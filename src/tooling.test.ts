import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it, vi } from "vitest";

import { intentMapToCsv } from "./csv";
import { INTENT_MAP_PATH, validateIntentMap } from "./intent-map";
import type { CmdkVectorizedIntent } from "./tooling-types";
import { createWeaviateClassSchema, uploadIntentMap } from "./weaviate";
import { installAgentWorkflows, installIntegrationSkill } from "./workflows";

const SAMPLE_INTENT: CmdkVectorizedIntent = {
  recordType: "tab",
  section: "developers",
  commandId: "settings.workspace.user_actions.action_type.no_code",
  label: "No-code action",
  path: "/workspaces/[workspaceId]/settings/workspace/user-actions",
  phrases: ["choose no code action", "track clicks without code"],
  keywords: ["no code action", "no-code tracking", "click action"],
  setValue: "noCode",
  description: "Choose the no-code action type.",
  actionType: "select",
  stateKey: "actionClass.type",
};

describe("validateIntentMap", () => {
  it("accepts the canonical intent-map shape", () => {
    expect(validateIntentMap([SAMPLE_INTENT])).toEqual([SAMPLE_INTENT]);
  });

  it("rejects missing required fields", () => {
    expect(() =>
      validateIntentMap([
        {
          ...SAMPLE_INTENT,
          commandId: "",
        },
      ]),
    ).toThrow('must include a non-empty string "commandId"');
  });

  it("rejects non-array phrases and keywords", () => {
    expect(() =>
      validateIntentMap([
        {
          ...SAMPLE_INTENT,
          phrases: "choose no code action",
        },
      ]),
    ).toThrow('"phrases" as a string array');
  });
});

describe("intentMapToCsv", () => {
  it("exports expected columns and array fields with pipe delimiters", () => {
    expect(intentMapToCsv([SAMPLE_INTENT])).toBe(
      [
        "recordType,section,commandId,label,path,phrases,keywords,setValue,description,actionType,stateKey",
        "tab,developers,settings.workspace.user_actions.action_type.no_code,No-code action,/workspaces/[workspaceId]/settings/workspace/user-actions,choose no code action | track clicks without code,no code action | no-code tracking | click action,noCode,Choose the no-code action type.,select,actionClass.type",
      ].join("\n"),
    );
  });

  it("escapes commas, quotes, and new lines", () => {
    const csv = intentMapToCsv([
      {
        ...SAMPLE_INTENT,
        label: 'No-code, "action"',
        description: "Choose\ncarefully.",
      },
    ]);

    expect(csv).toContain('"No-code, ""action"""');
    expect(csv).toContain('"Choose\ncarefully."');
  });
});

describe("installAgentWorkflows", () => {
  it("installs Codex, OpenCode, and Claude workflow files", async () => {
    const cwd = await createTempProject();
    const written = await installAgentWorkflows({ cwd });

    expect(written).toEqual([
      join(".codex", "skills", "cmdk-vectorized", "SKILL.md"),
      join(".opencode", "skill", "cmdk-vectorized", "SKILL.md"),
      join(".claude", "commands", "cmdk-vectorized.md"),
    ]);

    const codexSkill = await readFile(join(cwd, ".codex", "skills", "cmdk-vectorized", "SKILL.md"), "utf8");
    expect(codexSkill).toContain("public/intent-map.json");
    expect(codexSkill).toContain("Do not generate llms.txt files.");
  });
});


describe("installIntegrationSkill", () => {
  it("installs Codex, OpenCode, and Claude integration skill files", async () => {
    const cwd = await createTempProject();
    const written = await installIntegrationSkill({ cwd });

    expect(written).toEqual([
      join(".codex", "skills", "cmdk-vectorized-integrate", "SKILL.md"),
      join(".opencode", "skill", "cmdk-vectorized-integrate", "SKILL.md"),
      join(".claude", "commands", "cmdk-vectorized-integrate.md"),
    ]);

    const codexSkill = await readFile(
      join(cwd, ".codex", "skills", "cmdk-vectorized-integrate", "SKILL.md"),
      "utf8",
    );
    expect(codexSkill).toContain("vector database");
    expect(codexSkill).toContain("shouldFilter={false}");
    expect(codexSkill).toContain("Do not generate `llms.txt` files in the consumer app");
  });
});

describe("createWeaviateClassSchema", () => {
  it("marks only selected properties for vectorization", () => {
    const schema = createWeaviateClassSchema();
    const vectorized = schema.properties
      .filter((property) => property.moduleConfig["text2vec-openai"].skip === false)
      .map((property) => property.name);

    expect(vectorized).toEqual(["section", "label", "phrases", "keywords", "description"]);
  });
});

describe("uploadIntentMap", () => {
  it("requires WEAVIATE_URL and WEAVIATE_API_KEY", async () => {
    const cwd = await createTempProject();
    await writeIntentMap(cwd, [SAMPLE_INTENT]);

    await expect(uploadIntentMap({ cwd, env: {} })).rejects.toThrow("WEAVIATE_URL is required.");
    await expect(uploadIntentMap({ cwd, env: { WEAVIATE_URL: "https://weaviate.example.com" } })).rejects.toThrow(
      "WEAVIATE_API_KEY is required.",
    );
  });

  it("creates the schema and uploads intent batches", async () => {
    const cwd = await createTempProject();
    const intents = Array.from({ length: 51 }, (_, index) => ({
      ...SAMPLE_INTENT,
      commandId: `${SAMPLE_INTENT.commandId}.${index}`,
    }));
    await writeIntentMap(cwd, intents);

    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("", { status: 404 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValue(new Response("{}", { status: 200 }));

    const result = await uploadIntentMap({
      cwd,
      fetcher,
      env: {
        WEAVIATE_URL: "weaviate.example.com/",
        WEAVIATE_API_KEY: "secret",
      },
    });

    expect(result).toEqual({ collectionCreated: true, uploadedCount: 51 });
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://weaviate.example.com/v1/schema/CmdkIntent");
    expect(fetcher.mock.calls[0]?.[1]?.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer secret",
    });

    const schemaBody = JSON.parse(String(fetcher.mock.calls[1]?.[1]?.body));
    expect(schemaBody.class).toBe("CmdkIntent");

    const firstBatch = JSON.parse(String(fetcher.mock.calls[2]?.[1]?.body));
    const secondBatch = JSON.parse(String(fetcher.mock.calls[3]?.[1]?.body));
    expect(firstBatch.objects).toHaveLength(50);
    expect(secondBatch.objects).toHaveLength(1);
  });

  it("does not recreate an existing schema", async () => {
    const cwd = await createTempProject();
    await writeIntentMap(cwd, [SAMPLE_INTENT]);

    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 200 }));
    const result = await uploadIntentMap({
      cwd,
      fetcher,
      env: {
        WEAVIATE_URL: "https://weaviate.example.com",
        WEAVIATE_API_KEY: "secret",
      },
    });

    expect(result).toEqual({ collectionCreated: false, uploadedCount: 1 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

async function createTempProject() {
  const cwd = join(tmpdir(), `cmdk-vectorized-${randomUUID()}`);
  await mkdir(cwd, { recursive: true });
  return cwd;
}

async function writeIntentMap(cwd: string, intents: CmdkVectorizedIntent[]) {
  await mkdir(join(cwd, "public"), { recursive: true });
  await writeFile(join(cwd, INTENT_MAP_PATH), JSON.stringify(intents, null, 2), "utf8");
}
