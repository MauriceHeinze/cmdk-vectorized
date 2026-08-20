import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { CmdkVectorizedIntent } from "./tooling-types";

export const INTENT_MAP_PATH = join("public", "intent-map.json");
export const INTENT_MAP_CSV_PATH = join("public", "intent-map.csv");

const REQUIRED_STRING_FIELDS = [
  "recordType",
  "section",
  "commandId",
  "label",
  "description",
  "actionType",
] as const;

const OPTIONAL_STRING_FIELDS = ["path", "setValue", "stateKey"] as const;

export function validateIntentMap(data: unknown): CmdkVectorizedIntent[] {
  if (!Array.isArray(data)) {
    throw new Error("intent-map.json must contain an array of intent records.");
  }

  return data.map((item, index) => validateIntent(item, index));
}

export async function readIntentMap(cwd: string): Promise<CmdkVectorizedIntent[]> {
  const raw = await readFile(join(cwd, INTENT_MAP_PATH), "utf8");
  return validateIntentMap(JSON.parse(raw));
}

function validateIntent(item: unknown, index: number): CmdkVectorizedIntent {
  if (!isRecord(item)) {
    throw new Error(`Intent at index ${index} must be an object.`);
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    if (!isNonEmptyString(item[field])) {
      throw new Error(`Intent at index ${index} must include a non-empty string "${field}".`);
    }
  }

  for (const field of OPTIONAL_STRING_FIELDS) {
    if (item[field] !== undefined && typeof item[field] !== "string") {
      throw new Error(`Intent at index ${index} has invalid optional string "${field}".`);
    }
  }

  if (!isStringArray(item.phrases)) {
    throw new Error(`Intent at index ${index} must include "phrases" as a string array.`);
  }

  if (!isStringArray(item.keywords)) {
    throw new Error(`Intent at index ${index} must include "keywords" as a string array.`);
  }

  return {
    recordType: getRequiredString(item, "recordType"),
    section: getRequiredString(item, "section"),
    commandId: getRequiredString(item, "commandId"),
    label: getRequiredString(item, "label"),
    path: getOptionalString(item, "path"),
    phrases: item.phrases,
    keywords: item.keywords,
    setValue: getOptionalString(item, "setValue"),
    description: getRequiredString(item, "description"),
    actionType: getRequiredString(item, "actionType"),
    stateKey: getOptionalString(item, "stateKey"),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function getRequiredString(item: Record<string, unknown>, field: (typeof REQUIRED_STRING_FIELDS)[number]): string {
  const value = item[field];
  if (!isNonEmptyString(value)) {
    throw new Error(`Intent has invalid required string "${field}".`);
  }

  return value;
}

function getOptionalString(item: Record<string, unknown>, field: (typeof OPTIONAL_STRING_FIELDS)[number]): string | undefined {
  const value = item[field];
  return typeof value === "string" ? value : undefined;
}
