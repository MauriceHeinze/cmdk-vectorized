import type { CreateCommandSearchHandlerOptions } from "./types";

const DEFAULT_LIMIT = 20;

function parseLimit(rawLimit: string | null, defaultLimit: number) {
  if (!rawLimit) {
    return defaultLimit;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultLimit;
}

export function createCommandSearchHandler(options: CreateCommandSearchHandlerOptions) {
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = options.maxLimit;

  return async function handleCommandSearch(request: Request) {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";
    const requestedLimit = parseLimit(url.searchParams.get("limit"), defaultLimit);
    const limit = maxLimit === undefined ? requestedLimit : Math.min(requestedLimit, maxLimit);
    const results = await options.search({ query, limit, request });

    return Response.json({ results });
  };
}
