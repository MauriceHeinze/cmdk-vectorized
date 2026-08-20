import type { CmdkVectorizedIntent } from "./tooling-types";

export const CSV_COLUMNS = [
  "recordType",
  "section",
  "commandId",
  "label",
  "path",
  "phrases",
  "keywords",
  "setValue",
  "description",
  "actionType",
  "stateKey",
] as const;

export function intentMapToCsv(intents: CmdkVectorizedIntent[]): string {
  const rows = intents.map((intent) =>
    [
      intent.recordType,
      intent.section,
      intent.commandId,
      intent.label,
      intent.path ?? "",
      intent.phrases.join(" | "),
      intent.keywords.join(" | "),
      intent.setValue ?? "",
      intent.description,
      intent.actionType,
      intent.stateKey ?? "",
    ]
      .map(escapeCsvCell)
      .join(","),
  );

  return [CSV_COLUMNS.join(","), ...rows].join("\n");
}

function escapeCsvCell(value: string): string {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}
