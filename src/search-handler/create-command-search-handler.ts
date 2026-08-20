import type { CreateCommandSearchHandlerOptions } from "../core/command-types";

const DEFAULT_LIMIT = 20;

function parseLimit(rawLimit: string | null, defaultLimit: number) {
  if (!rawLimit) {
    return defaultLimit;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  // Non-numeric or non-positive `limit` must not 400 — fall back to the host default.
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultLimit;
}

/**
 * Host GET handler for `/api/command-search?q=&limit=`.
 * Parses and caps `limit`; ranking stays in `options.search`.
 */
export function createCommandSearchHandler(options: CreateCommandSearchHandlerOptions) {
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = options.maxLimit;

  return async function handleCommandSearch(request: Request) {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";
    const requestedLimit = parseLimit(url.searchParams.get("limit"), defaultLimit);
    // Host maxLimit wins over the client `limit` query param.
    const limit = maxLimit === undefined ? requestedLimit : Math.min(requestedLimit, maxLimit);
    const results = await options.search({ query, limit, request });

    return Response.json({ results });
  };
}
