import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { InstallAgentWorkflowsOptions } from "./tooling-types";
import { INTEGRATION_BODY, INTEGRATION_SKILL, INTENT_SKILL } from "./workflow-templates";

type WorkflowFile = { path: string; content: string };

const INTENT_FILES: WorkflowFile[] = [
  { path: join(".codex", "skills", "cmdk-vectorized", "SKILL.md"), content: INTENT_SKILL },
  { path: join(".opencode", "skill", "cmdk-vectorized", "SKILL.md"), content: INTENT_SKILL },
  { path: join(".claude", "commands", "cmdk-vectorized.md"), content: INTENT_SKILL },
];

const INTEGRATION_FILES: WorkflowFile[] = [
  { path: join(".codex", "skills", "cmdk-vectorized-integrate", "SKILL.md"), content: INTEGRATION_SKILL },
  { path: join(".opencode", "skill", "cmdk-vectorized-integrate", "SKILL.md"), content: INTEGRATION_SKILL },
  { path: join(".claude", "commands", "cmdk-vectorized-integrate.md"), content: INTEGRATION_BODY },
];

async function installFiles(options: InstallAgentWorkflowsOptions, files: WorkflowFile[]) {
  const written: string[] = [];
  for (const file of files) {
    const target = join(options.cwd, file.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content, "utf8");
    written.push(file.path);
  }
  return written;
}

export function installAgentWorkflows(options: InstallAgentWorkflowsOptions) {
  return installFiles(options, INTENT_FILES);
}

export function installIntegrationSkill(options: InstallAgentWorkflowsOptions) {
  return installFiles(options, INTEGRATION_FILES);
}
