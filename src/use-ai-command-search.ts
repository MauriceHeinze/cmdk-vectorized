import { useCallback, useEffect, useRef, useState } from "react";

import { normalizeCommandSearchResponse } from "./guards";
import type { CommandSearchResult, UseAICommandSearchOptions } from "./types";

const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_MIN_QUERY_LENGTH = 1;
const DEFAULT_MAX_RESULTS = 20;
const DEFAULT_MIN_CONFIDENCE = 0.7;
const EMPTY_RESULTS: CommandSearchResult[] = [];

function createMissingFetcherError() {
  return new Error("A fetch implementation is required for useAICommandSearch.");
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error("Command search failed.");
}

function buildSearchUrl(endpoint: string, query: string, maxResults: number) {
  const url = new URL(endpoint, "http://localhost");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(maxResults));
  return endpoint.startsWith("http://") || endpoint.startsWith("https://")
    ? url.toString()
    : `${url.pathname}${url.search}`;
}

export function useAICommandSearch(
  options: UseAICommandSearchOptions,
): {
  query: string;
  setQuery: (query: string) => void;
  results: CommandSearchResult[];
  loading: boolean;
  error: Error | null;
  clear: () => void;
  refetch: () => Promise<void>;
} {
  const {
    endpoint,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    minQueryLength = DEFAULT_MIN_QUERY_LENGTH,
    maxResults = DEFAULT_MAX_RESULTS,
    minConfidence = DEFAULT_MIN_CONFIDENCE,
    headers,
    fetcher,
    transformResponse,
    searchOnEmptyQuery = false,
  } = options;
  const initialResults = options.initialResults ?? EMPTY_RESULTS;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommandSearchResult[]>(initialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  const skipNextEffectRef = useRef(false);

  // Keep latest request options in refs so object identity (headers, fetcher,
  // etc.) does not re-trigger the debounced search effect on every render.
  const optionsRef = useRef({
    endpoint,
    maxResults,
    minConfidence,
    minQueryLength,
    searchOnEmptyQuery,
    headers,
    fetcher,
    transformResponse,
    initialResults,
  });
  optionsRef.current = {
    endpoint,
    maxResults,
    minConfidence,
    minQueryLength,
    searchOnEmptyQuery,
    headers,
    fetcher,
    transformResponse,
    initialResults,
  };

  const cancelPendingWork = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    requestIdRef.current += 1;
  }, []);

  const performSearch = useCallback(async (requestedQuery: string) => {
    const {
      endpoint: activeEndpoint,
      maxResults: activeMaxResults,
      minConfidence: activeMinConfidence,
      minQueryLength: activeMinQueryLength,
      searchOnEmptyQuery: activeSearchOnEmpty,
      headers: activeHeaders,
      fetcher: optionFetcher,
      transformResponse: activeTransform,
      initialResults: activeInitial,
    } = optionsRef.current;

    const effectiveQuery =
      requestedQuery.length < activeMinQueryLength && activeSearchOnEmpty
        ? ""
        : requestedQuery;

    if (requestedQuery.length < activeMinQueryLength && !activeSearchOnEmpty) {
      cancelPendingWork();
      setResults(activeInitial);
      setLoading(false);
      setError(null);
      return;
    }

    const activeFetcher = optionFetcher ?? globalThis.fetch;

    if (!activeFetcher) {
      const fetcherError = createMissingFetcherError();
      setError(fetcherError);
      setResults([]);
      setLoading(false);
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);

    try {
      const response = await activeFetcher(
        buildSearchUrl(activeEndpoint, effectiveQuery, activeMaxResults),
        {
          method: "GET",
          headers: activeHeaders,
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(
          `Command search request failed with status ${response.status}.`,
        );
      }

      const data = await response.json();
      const normalizedResults = normalizeCommandSearchResponse(
        data,
        activeTransform,
      );
      const filteredResults = normalizedResults.filter(
        (result) =>
          result.score === undefined || result.score >= activeMinConfidence,
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      setResults(filteredResults);
      setLoading(false);
    } catch (caughtError) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      setError(toError(caughtError));
      setResults([]);
      setLoading(false);
    }
  }, [cancelPendingWork]);

  useEffect(() => {
    if (skipNextEffectRef.current) {
      skipNextEffectRef.current = false;
      return;
    }

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    if (query.length < minQueryLength && !searchOnEmptyQuery) {
      cancelPendingWork();
      setResults(optionsRef.current.initialResults);
      setLoading(false);
      setError(null);
      return;
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void performSearch(query);
    }, debounceMs);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    cancelPendingWork,
    debounceMs,
    minQueryLength,
    performSearch,
    query,
    searchOnEmptyQuery,
  ]);

  useEffect(() => () => cancelPendingWork(), [cancelPendingWork]);

  const clear = useCallback(() => {
    skipNextEffectRef.current = true;
    cancelPendingWork();
    setQuery("");
    setError(null);
    setResults(optionsRef.current.initialResults);
    setLoading(false);
  }, [cancelPendingWork]);

  const refetch = useCallback(async () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    await performSearch(query);
  }, [performSearch, query]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clear,
    refetch,
  };
}
