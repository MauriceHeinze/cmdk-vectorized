import type { CommandSearchResult } from "../core/command-types";

export function createFetchResponse(results: CommandSearchResult[]) {
  return { ok: true, json: async () => ({ results }) } as Response;
}
