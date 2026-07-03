#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { intentMapToCsv } from "./csv";
import { INTENT_MAP_CSV_PATH, readIntentMap } from "./intent-map";
import { uploadIntentMap } from "./weaviate";
import { installAgentWorkflows, installIntegrationSkill } from "./workflows";

export async function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const [command] = argv;

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "init") {
    const written = await installAgentWorkflows({ cwd });
    for (const file of written) {
      console.log(`created ${file}`);
    }
    return;
  }

  if (command === "integrate") {
    const written = await installIntegrationSkill({ cwd });
    for (const file of written) {
      console.log(`created ${file}`);
    }
    return;
  }

  if (command === "upload") {
    const intents = await readIntentMap(cwd);
    await writeFile(join(cwd, INTENT_MAP_CSV_PATH), `${intentMapToCsv(intents)}\n`, "utf8");
    const result = await uploadIntentMap({ cwd });
    console.log(`uploaded ${result.uploadedCount} intents to Weaviate`);
    if (result.collectionCreated) {
      console.log("created CmdkIntent collection");
    }
    return;
  }

  throw new Error(`Unknown command "${command}".`);
}

function printHelp() {
  console.log(`cmdk-vectorized

Usage:
  cmdk-vectorized init
  cmdk-vectorized integrate
  cmdk-vectorized upload

Commands:
  init        Install local-agent workflow files for intent-map generation.
  integrate   Install local-agent skill files for package integration.
  upload      Validate public/intent-map.json, write public/intent-map.csv, and upload JSON to Weaviate.

Environment for upload:
  WEAVIATE_URL
  WEAVIATE_API_KEY
`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
