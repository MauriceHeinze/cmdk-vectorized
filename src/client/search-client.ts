import type { CommandSearchResult } from "../core/command-types";
import { normalizeCommandSearchResponse } from "../core/guards";

type SearchClientConfig = {
  endpoint: string;
  headers?: HeadersInit;
  fetcher?: typeof fetch;
  transformResponse?: (data: unknown) => CommandSearchResult[];
};

type SearchRequest = {
  limit: number;
  signal?: AbortSignal;
};

function buildSearchUrl(endpoint: string, query: string, limit: number) {
  const url = new URL(endpoint, "http://localhost");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));

  return endpoint.startsWith("http://") || endpoint.startsWith("https://")
    ? url.toString()
    : `${url.pathname}${url.search}`;
}

export function createCommandSearchClient(config: SearchClientConfig) {
  return {
    async search(query: string, request: SearchRequest): Promise<CommandSearchResult[]> {
      const fetcher = config.fetcher ?? globalThis.fetch;
      if (!fetcher) {
        throw new Error("A fetch implementation is required for command search.");
      }

      const response = await fetcher(
        buildSearchUrl(config.endpoint, query, request.limit),
        {
          method: "GET",
          headers: config.headers,
          signal: request.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Command search request failed with status ${response.status}.`);
      }

      return normalizeCommandSearchResponse(
        await response.json(),
        config.transformResponse,
      );
    },
  };
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
