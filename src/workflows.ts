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

export async function installAgentWorkflows(options: InstallAgentWorkflowsOptions): Promise<string[]> {
  const written: string[] = [];

  for (const file of WORKFLOW_FILES) {
    const targetPath = join(options.cwd, file.path);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, file.content, "utf8");
    written.push(file.path);
  }

  return written;
}
