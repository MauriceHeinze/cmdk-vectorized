import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAICommandSearch } from "./use-ai-command-search";
import type { CommandSearchResult } from "../../core/command-types";
import { createFetchResponse } from "../../testing/create-fetch-response";

describe("useAICommandSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns initialResults before the first remote search", () => {
    const fetcher = vi.fn<typeof fetch>();
    const initialResults: CommandSearchResult[] = [
      { id: "nav.dashboard", type: "navigation", title: "Dashboard", href: "/dashboard" },
    ];

    const { result } = renderHook(() =>
      useAICommandSearch({
        endpoint: "/api/command-search",
        fetcher,
        initialResults,
      }),
    );

    expect(result.current.results).toEqual(initialResults);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("debounces requests and sends q and limit correctly", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      createFetchResponse([
        { id: "nav.settings", type: "navigation", title: "Settings", href: "/settings" },
      ]),
    );

    const { result } = renderHook(() =>
      useAICommandSearch({
        endpoint: "/api/command-search",
        debounceMs: 300,
        maxResults: 7,
        fetcher,
      }),
    );

    act(() => {
      result.current.setQuery("set");
    });

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(fetcher).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    await vi.runAllTimersAsync();

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0]).toBe("/api/command-search?q=set&limit=7");
  });

  it("honors minQueryLength without searching", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const initialResults: CommandSearchResult[] = [
      { id: "nav.home", type: "navigation", title: "Home", href: "/home" },
    ];

    const { result } = renderHook(() =>
      useAICommandSearch({
        endpoint: "/api/command-search",
        minQueryLength: 3,
        fetcher,
        initialResults,
      }),
    );

    act(() => {
      result.current.setQuery("hi");
    });

    await vi.runAllTimersAsync();

    expect(result.current.results).toEqual(initialResults);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("searches with an empty query when searchOnEmptyQuery is enabled", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(createFetchResponse([]));

    renderHook(() =>
      useAICommandSearch({
        endpoint: "/api/command-search",
        minQueryLength: 3,
        searchOnEmptyQuery: true,
        fetcher,
      }),
    );

    await vi.runAllTimersAsync();

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0]).toBe("/api/command-search?q=&limit=20");
  });

  it("uses transformResponse when provided", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{ id: "action.logout", type: "action", title: "Log out", actionKey: "auth.logout" }],
      }),
    } as Response);

    const { result } = renderHook(() =>
      useAICommandSearch({
        endpoint: "/api/command-search",
        fetcher,
        transformResponse: (data) => (data as { items: CommandSearchResult[] }).items,
      }),
    );

    act(() => {
      result.current.setQuery("logout");
    });

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(result.current.results).toEqual([
      { id: "action.logout", type: "action", title: "Log out", actionKey: "auth.logout" },
    ]);
  });

  it("normalizes numeric string scores from the backend", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            id: "nav.contact",
            type: "navigation",
            title: "Contact Us",
            href: "/contact-us",
            score: "1",
          },
        ],
      }),
    } as Response);

    const { result } = renderHook(() =>
      useAICommandSearch({
        endpoint: "/api/command-search",
        fetcher,
      }),
    );

    act(() => {
      result.current.setQuery("contact");
    });

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.results).toEqual([
      {
        id: "nav.contact",
        type: "navigation",
        title: "Contact Us",
        href: "/contact-us",
        score: 1,
      },
    ]);
  });
});
