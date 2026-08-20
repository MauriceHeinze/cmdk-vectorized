import { useCallback, useEffect, useRef, useState } from "react";

import type { CommandSearchResult } from "../core/command-types";
import { createCommandSearchClient, isAbortError } from "./search-client";
import type {
  UseAICommandSearchOptions,
  UseAICommandSearchResult,
} from "./types";
import { useLatest } from "./use-latest";

const DEFAULTS = {
  debounceMs: 300,
  minQueryLength: 1,
  maxResults: 20,
  minConfidence: 0.7,
} as const;
const EMPTY_RESULTS: CommandSearchResult[] = [];

function toError(error: unknown) {
  return error instanceof Error ? error : new Error("Command search failed.");
}

export function useAICommandSearch(
  options: UseAICommandSearchOptions,
): UseAICommandSearchResult {
  const debounceMs = options.debounceMs ?? DEFAULTS.debounceMs;
  const minQueryLength = options.minQueryLength ?? DEFAULTS.minQueryLength;
  const searchOnEmptyQuery = options.searchOnEmptyQuery ?? false;
  const initialResults = options.initialResults ?? EMPTY_RESULTS;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(initialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const optionsRef = useLatest(options);
  const controllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    controllerRef.current?.abort();
    controllerRef.current = null;
    requestIdRef.current += 1;
  }, []);

  const search = useCallback(async (requestedQuery: string) => {
    const active = optionsRef.current;
    const activeMinLength = active.minQueryLength ?? DEFAULTS.minQueryLength;
    const searchEmpty = active.searchOnEmptyQuery ?? false;

    if (requestedQuery.length < activeMinLength && !searchEmpty) {
      cancel();
      setResults(active.initialResults ?? EMPTY_RESULTS);
      setLoading(false);
      setError(null);
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    controllerRef.current = controller;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
      const client = createCommandSearchClient(active);
      const found = await client.search(
        requestedQuery.length < activeMinLength ? "" : requestedQuery,
        { limit: active.maxResults ?? DEFAULTS.maxResults, signal: controller.signal },
      );
      if (requestId !== requestIdRef.current) return;

      const minConfidence = active.minConfidence ?? DEFAULTS.minConfidence;
      setResults(found.filter((item) => item.score === undefined || item.score >= minConfidence));
      setLoading(false);
    } catch (caught) {
      if (controller.signal.aborted || isAbortError(caught) || requestId !== requestIdRef.current) {
        return;
      }
      setError(toError(caught));
      setResults([]);
      setLoading(false);
    }
  }, [cancel, optionsRef]);

  useEffect(() => {
    if (query.length < minQueryLength && !searchOnEmptyQuery) {
      cancel();
      setResults(optionsRef.current.initialResults ?? EMPTY_RESULTS);
      setLoading(false);
      setError(null);
      return;
    }

    timerRef.current = window.setTimeout(() => void search(query), debounceMs);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [cancel, debounceMs, minQueryLength, optionsRef, query, search, searchOnEmptyQuery]);

  useEffect(() => cancel, [cancel]);

  const clear = useCallback(() => {
    cancel();
    setQuery("");
    setResults(optionsRef.current.initialResults ?? EMPTY_RESULTS);
    setLoading(false);
    setError(null);
  }, [cancel, optionsRef]);

  const refetch = useCallback(async () => {
    cancel();
    await search(query);
  }, [cancel, query, search]);

  return { query, setQuery, results, loading, error, clear, refetch };
}
