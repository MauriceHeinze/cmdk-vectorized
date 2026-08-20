import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CommandSearchResult } from "../../core/command-types";
import { createFetchResponse } from "../../testing/create-fetch-response";
import { useAICommandSearch } from "./use-ai-command-search";

describe("useAICommandSearch lifecycle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("rejects non-object meta values", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            id: "action.export",
            type: "action",
            title: "Export data",
            actionKey: "data.export",
            meta: "toolbar",
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
      result.current.setQuery("export");
    });

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.error?.message).toBe(
      "Command search result 0 has an invalid description, score, or meta.",
    );
  });

  it("clears results and sets error on failed fetch", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() =>
      useAICommandSearch({
        endpoint: "/api/command-search",
        fetcher,
        initialResults: [
          { id: "nav.start", type: "navigation", title: "Start", href: "/start" },
        ],
      }),
    );

    act(() => {
      result.current.setQuery("start");
    });

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(result.current.error?.message).toBe("network down");
    expect(result.current.results).toEqual([]);
  });

  it("ignores stale responses", async () => {
    let resolveFirst: ((value: Response) => void) | undefined;
    let resolveSecond: ((value: Response) => void) | undefined;

    const fetcher = vi.fn<typeof fetch>()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );

    const { result } = renderHook(() =>
      useAICommandSearch({
        endpoint: "/api/command-search",
        debounceMs: 10,
        fetcher,
      }),
    );

    act(() => {
      result.current.setQuery("bi");
    });
    await vi.advanceTimersByTimeAsync(10);

    act(() => {
      result.current.setQuery("bill");
    });
    await vi.advanceTimersByTimeAsync(10);

    resolveSecond?.(
      createFetchResponse([
        { id: "nav.billing", type: "navigation", title: "Billing", href: "/billing" },
      ]),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.results).toEqual([
      { id: "nav.billing", type: "navigation", title: "Billing", href: "/billing" },
    ]);

    resolveFirst?.(
      createFetchResponse([
        { id: "nav.old", type: "navigation", title: "Old", href: "/old" },
      ]),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.results).toEqual([
      { id: "nav.billing", type: "navigation", title: "Billing", href: "/billing" },
    ]);
  });

  it("clear resets state to initialResults", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(createFetchResponse([]));
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

    act(() => {
      result.current.setQuery("dash");
    });

    await vi.runAllTimersAsync();

    expect(fetcher).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.clear();
    });

    expect(result.current.query).toBe("");
    expect(result.current.error).toBeNull();
    expect(result.current.results).toEqual(initialResults);
  });

  it("does not abort/refetch when option object identity changes", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      (_input, init) =>
        new Promise((resolve, reject) => {
          const signal = init?.signal;
          const onAbort = () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          };
          if (signal?.aborted) {
            onAbort();
            return;
          }
          signal?.addEventListener("abort", onAbort, { once: true });
          resolveFetch = (value) => {
            signal?.removeEventListener("abort", onAbort);
            resolve(value);
          };
        }),
    );

    const { result, rerender } = renderHook(
      (props: { token: string }) =>
        useAICommandSearch({
          endpoint: "/api/search",
          debounceMs: 200,
          fetcher,
          headers: { Authorization: `Bearer ${props.token}` },
          transformResponse: (data) =>
            (data as { results: CommandSearchResult[] }).results,
        }),
      { initialProps: { token: "ck_site_test" } },
    );

    act(() => {
      result.current.setQuery("invite team members");
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);

    // Parent re-renders with a new headers object / transformResponse while
    // the GET is still in flight (typical consumer: inline options).
    rerender({ token: "ck_site_test" });
    rerender({ token: "ck_site_test" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    resolveFetch?.(
      createFetchResponse([
        {
          id: "nav.invite",
          type: "navigation",
          title: "Invite team members",
          href: "/settings/members",
        },
      ]),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.results).toHaveLength(1);

    rerender({ token: "ck_site_test" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0]).toBe(
      "/api/search?q=invite+team+members&limit=20",
    );
    expect(result.current.results).toHaveLength(1);
  });

  it("refetch reruns the current query immediately", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(createFetchResponse([]));

    const { result } = renderHook(() =>
      useAICommandSearch({
        endpoint: "/api/command-search",
        debounceMs: 1_000,
        fetcher,
      }),
    );

    act(() => {
      result.current.setQuery("billing");
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0]).toBe("/api/command-search?q=billing&limit=20");
  });
});
