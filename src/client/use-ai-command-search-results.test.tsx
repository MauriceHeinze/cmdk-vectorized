import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAICommandSearch } from "./use-ai-command-search";

describe("useAICommandSearch result normalization", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("filters out results below the default confidence threshold", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            id: "nav.low",
            type: "navigation",
            title: "Low confidence",
            href: "/low",
            score: 0.69,
          },
          {
            id: "nav.high",
            type: "navigation",
            title: "High confidence",
            href: "/high",
            score: 0.7,
          },
          {
            id: "nav.unscored",
            type: "navigation",
            title: "Unscored",
            href: "/unscored",
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
      result.current.setQuery("confidence");
    });

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(result.current.results).toEqual([
      {
        id: "nav.high",
        type: "navigation",
        title: "High confidence",
        href: "/high",
        score: 0.7,
      },
      {
        id: "nav.unscored",
        type: "navigation",
        title: "Unscored",
        href: "/unscored",
      },
    ]);
  });

  it("allows overriding the minimum confidence threshold", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            id: "nav.mid",
            type: "navigation",
            title: "Mid confidence",
            href: "/mid",
            score: 0.65,
          },
        ],
      }),
    } as Response);

    const { result } = renderHook(() =>
      useAICommandSearch({
        endpoint: "/api/command-search",
        fetcher,
        minConfidence: 0.6,
      }),
    );

    act(() => {
      result.current.setQuery("mid");
    });

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(result.current.results).toEqual([
      {
        id: "nav.mid",
        type: "navigation",
        title: "Mid confidence",
        href: "/mid",
        score: 0.65,
      },
    ]);
  });

  it("passes meta through unchanged when it is an object", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            id: "nav.billing",
            type: "navigation",
            title: "Billing",
            href: "/billing",
            meta: {
              group: "Settings",
              badge: "Beta",
              openInNewTab: false,
            },
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
      result.current.setQuery("billing");
    });

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.results).toEqual([
      {
        id: "nav.billing",
        type: "navigation",
        title: "Billing",
        href: "/billing",
        meta: {
          group: "Settings",
          badge: "Beta",
          openInNewTab: false,
        },
      },
    ]);
  });
});
