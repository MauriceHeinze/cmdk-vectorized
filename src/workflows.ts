import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { InstallAgentWorkflowsOptions } from "./tooling-types";

const WORKFLOW_BODY = `# cmdk-vectorized Intent Map Generator

Generate intent-map artifacts for cmdk-vectorized.

## Goal

Scan this app and produce:

- public/intent-map.json
- public/intent-map.csv

Do not generate llms.txt files.
Do not change app behavior.
Do not upload to Weaviate.

## Canonical JSON Shape

public/intent-map.json must be a JSON array. Each object must use exactly these fields:

\`\`\`ts
type CmdkVectorizedIntent = {
  recordType: string;
  section: string;
  commandId: string;
  label: string;
  path?: string;
  phrases: string[];
  keywords: string[];
  setValue?: string;
  description: string;
  actionType: string;
  stateKey?: string;
};
\`\`\`

## CSV Shape

public/intent-map.csv must use these columns:

\`\`\`txt
recordType,section,commandId,label,path,phrases,keywords,setValue,description,actionType,stateKey
\`\`\`

Encode phrases and keywords with \` | \`.

## Discovery Instructions

Inspect the whole app for routes, pages, command palettes, settings screens, forms, tabs, buttons, selects, toggles, and common user tasks. Prefer explicit source metadata over inference. Keep generated records inspectable and conservative. If a field is unknown, omit optional fields rather than inventing values.

## Detailed Prompt Placeholder

The project owner will provide a more detailed prompt later. Until then, follow the contract above exactly.
`;

const CODEX_SKILL = `---
name: cmdk-vectorized
description: Generate cmdk-vectorized public/intent-map.json and public/intent-map.csv artifacts for the current app.
---

${WORKFLOW_BODY}`;

const OPENCODE_SKILL = CODEX_SKILL;

const CLAUDE_COMMAND = `# cmdk-vectorized

${WORKFLOW_BODY}`;

const WORKFLOW_FILES = [
  {
    path: join(".codex", "skills", "cmdk-vectorized", "SKILL.md"),
    content: CODEX_SKILL,
  },
  {
    path: join(".opencode", "skill", "cmdk-vectorized", "SKILL.md"),
    content: OPENCODE_SKILL,
  },
  {
    path: join(".claude", "commands", "cmdk-vectorized.md"),
    content: CLAUDE_COMMAND,
  },
] as const;


const INTEGRATION_BODY = `# cmdk-vectorized Integration

Wire vector-database search into an existing or new \`cmdk\` command palette.

## When to use

- App uses \`cmdk\` or shadcn/ui \`Command\` components
- Command palette should query a **vector database** (Weaviate) instead of client-side filtering
- Optional: add **speech-to-text voice input** via browser Web Speech API

This is vector DB retrieval, not a generic LLM chat API.

## Integration steps

1. Install: \`npm install cmdk-vectorized cmdk react react-dom\`
2. Create search endpoint using \`createCommandSearchHandler\` from \`cmdk-vectorized/server\`
3. Wire \`useAICommand\` with \`endpoint\`, \`navigate\`, and \`actions\`
4. Render \`<Command shouldFilter={false}>\` — required
5. Optional: add \`CommandVoice\` for speech-to-text voice search
6. Optional Weaviate corpus:
   - \`npx cmdk-vectorized init\` (separate skill) to generate \`public/intent-map.json\`
   - \`WEAVIATE_URL=... WEAVIATE_API_KEY=... npx cmdk-vectorized upload\`

## Client example

\`\`\`tsx
import { Command, useAICommand } from "cmdk-vectorized";

export function CommandMenu() {
  const command = useAICommand({
    endpoint: "/api/command-search",
    navigate: (href) => router.push(href),
    actions: {
      "team.invite": () => openInviteModal(),
    },
  });

  return (
    <Command shouldFilter={false}>
      <Command.Input value={command.query} onValueChange={command.setQuery} />
      <Command.List>
        {command.results.map((result) => (
          <Command.Item
            key={result.id}
            value={result.id}
            onSelect={() => void command.execute(result)}
          >
            {result.title}
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );
}
\`\`\`

## Server example

\`\`\`ts
import { createCommandSearchHandler } from "cmdk-vectorized/server";

export const GET = createCommandSearchHandler({
  search: async ({ query, limit }) => {
    // Query Weaviate or your vector database here
    return rankedResults;
  },
});
\`\`\`

## Voice example

\`\`\`tsx
import { CommandVoice } from "cmdk-vectorized";

<CommandVoice
  endpoint="/api/command-search"
  navigate={(href) => router.push(href)}
  actions={{ "settings.open": () => openSettings() }}
/>
\`\`\`

## Result contract

Each result must be either:

- \`{ id, type: "navigation", title, href, score? }\` — app resolves and navigates to \`href\`
- \`{ id, type: "action", title, actionKey, score? }\` — app calls \`actions[actionKey]()\`

## Rules

- Always set \`shouldFilter={false}\` on \`<Command>\`
- Do not parse \`id\` to decide behavior — use \`href\` or \`actionKey\`
- Do not generate \`llms.txt\` files in the consumer app
- Do not change unrelated app behavior during integration

## Docs

- https://github.com/MauriceHeinze/cmdk-vectorized/blob/main/docs/llm-guide.md
- https://github.com/MauriceHeinze/cmdk-vectorized/blob/main/docs/api.md
- https://github.com/MauriceHeinze/cmdk-vectorized/blob/main/docs/local-weaviate.md`;

const INTEGRATION_CODEX_SKILL = `---
name: cmdk-vectorized-integrate
description: Integrate cmdk-vectorized vector-database search and optional speech-to-text voice input into a React cmdk command palette.
---

${INTEGRATION_BODY}`;

const INTEGRATION_CLAUDE_COMMAND = `# cmdk-vectorized Integration

${INTEGRATION_BODY}`;

const INTEGRATION_FILES = [
  {
    path: join(".codex", "skills", "cmdk-vectorized-integrate", "SKILL.md"),
    content: INTEGRATION_CODEX_SKILL,
  },
  {
    path: join(".opencode", "skill", "cmdk-vectorized-integrate", "SKILL.md"),
    content: INTEGRATION_CODEX_SKILL,
  },
  {
    path: join(".claude", "commands", "cmdk-vectorized-integrate.md"),
    content: INTEGRATION_CLAUDE_COMMAND,
  },
] as const;

async function installWorkflowFiles(
  options: InstallAgentWorkflowsOptions,
  files: ReadonlyArray<{ path: string; content: string }>,
): Promise<string[]> {
  const written: string[] = [];

  for (const file of files) {
    const targetPath = join(options.cwd, file.path);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, file.content, "utf8");
    written.push(file.path);
  }

  return written;
}

export async function installAgentWorkflows(options: InstallAgentWorkflowsOptions): Promise<string[]> {
  return installWorkflowFiles(options, WORKFLOW_FILES);
}

export async function installIntegrationSkill(options: InstallAgentWorkflowsOptions): Promise<string[]> {
  return installWorkflowFiles(options, INTEGRATION_FILES);
}
