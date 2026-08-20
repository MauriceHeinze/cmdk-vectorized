import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCommandVoice } from "./command-voice";
import { createCommandSearchHandler } from "./create-command-search-handler";
import { executeAICommand } from "./execute-ai-command";
import { useAICommand } from "./use-ai-command";
import { useAICommandSearch } from "./use-ai-command-search";
import type { CommandSearchResult } from "./types";
import { resolveVoiceDecision } from "./voice-decision";

function createFetchResponse(results: CommandSearchResult[]) {
  return {
    ok: true,
    json: async () => ({ results }),
  } as Response;
}

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

describe("executeAICommand", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("executes navigation results through navigate", async () => {
    const navigate = vi.fn();

    await executeAICommand(
      { id: "nav.settings", type: "navigation", title: "Settings", href: "/settings" },
      {
        navigate,
        actions: {},
      },
    );

    expect(navigate).toHaveBeenCalledWith("/settings");
  });

  it("resolves navigation hrefs before navigating", async () => {
    const navigate = vi.fn();
    const resolveHref = vi.fn().mockReturnValue("/workspaces/workspace-1/settings");

    await executeAICommand(
      {
        id: "nav.workspace-settings",
        type: "navigation",
        title: "Workspace settings",
        href: "/workspaces/[workspaceId]/settings",
      },
      {
        navigate,
        resolveHref,
      },
    );

    expect(resolveHref).toHaveBeenCalledWith(
      "/workspaces/[workspaceId]/settings",
      expect.objectContaining({ id: "nav.workspace-settings" }),
    );
    expect(navigate).toHaveBeenCalledWith("/workspaces/workspace-1/settings");
  });

  it("supports async navigation href resolvers", async () => {
    const navigate = vi.fn();

    await executeAICommand(
      {
        id: "nav.workspace-settings",
        type: "navigation",
        title: "Workspace settings",
        href: "/workspaces/[workspaceId]/settings",
      },
      {
        navigate,
        resolveHref: async () => "/workspaces/workspace-1/settings",
      },
    );

    expect(navigate).toHaveBeenCalledWith("/workspaces/workspace-1/settings");
  });

  it("reports unresolved navigation hrefs without navigating", async () => {
    const navigate = vi.fn();
    const onUnresolvedHref = vi.fn();

    await executeAICommand(
      {
        id: "nav.workspace-settings",
        type: "navigation",
        title: "Workspace settings",
        href: "/workspaces/[workspaceId]/settings",
      },
      {
        navigate,
        resolveHref: () => null,
        onUnresolvedHref,
      },
    );

    expect(onUnresolvedHref).toHaveBeenCalledWith(
      "/workspaces/[workspaceId]/settings",
      expect.objectContaining({ id: "nav.workspace-settings" }),
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it("reports invalid navigation hrefs through onExecuteError", async () => {
    const onExecuteError = vi.fn();

    await executeAICommand(
      { id: "nav.invalid", type: "navigation", title: "Invalid", href: "settings" },
      {
        navigate: vi.fn(),
        actions: {},
        onExecuteError,
      },
    );

    expect(onExecuteError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ id: "nav.invalid" }));
  });

  it("reports resolver output that is not an internal href through onExecuteError", async () => {
    const onExecuteError = vi.fn();
    const navigate = vi.fn();

    await executeAICommand(
      { id: "nav.invalid", type: "navigation", title: "Invalid", href: "/settings" },
      {
        navigate,
        resolveHref: () => "https://example.com/settings",
        onExecuteError,
      },
    );

    expect(onExecuteError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ id: "nav.invalid" }));
    expect(navigate).not.toHaveBeenCalled();
  });

  it("triggers onUnknownRoute for missing routes", async () => {
    const onUnknownRoute = vi.fn();
    const navigate = vi.fn();

    await executeAICommand(
      { id: "nav.billing", type: "navigation", title: "Billing", href: "/billing" },
      {
        navigate,
        actions: {},
        routeExists: () => false,
        onUnknownRoute,
      },
    );

    expect(onUnknownRoute).toHaveBeenCalledWith(
      "/billing",
      expect.objectContaining({ id: "nav.billing" }),
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it("checks route existence against resolved hrefs", async () => {
    const onUnknownRoute = vi.fn();
    const navigate = vi.fn();

    await executeAICommand(
      {
        id: "nav.workspace-settings",
        type: "navigation",
        title: "Workspace settings",
        href: "/workspaces/[workspaceId]/settings",
      },
      {
        navigate,
        resolveHref: () => "/workspaces/workspace-1/settings",
        routeExists: (href) => href !== "/workspaces/workspace-1/settings",
        onUnknownRoute,
      },
    );

    expect(onUnknownRoute).toHaveBeenCalledWith(
      "/workspaces/workspace-1/settings",
      expect.objectContaining({ id: "nav.workspace-settings" }),
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it("executes actions through actionKey lookup", async () => {
    const action = vi.fn();

    await executeAICommand(
      { id: "action.logout", type: "action", title: "Log out", actionKey: "auth.logout" },
      {
        navigate: vi.fn(),
        actions: {
          "auth.logout": action,
        },
      },
    );

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("triggers onUnknownAction for missing actions", async () => {
    const onUnknownAction = vi.fn();

    await executeAICommand(
      { id: "action.invite", type: "action", title: "Invite", actionKey: "team.invite" },
      {
        navigate: vi.fn(),
        actions: {},
        onUnknownAction,
      },
    );

    expect(onUnknownAction).toHaveBeenCalledWith(
      "team.invite",
      expect.objectContaining({ id: "action.invite" }),
    );
  });

  it("reports thrown execution errors", async () => {
    const onExecuteError = vi.fn();

    await executeAICommand(
      { id: "action.logout", type: "action", title: "Log out", actionKey: "auth.logout" },
      {
        navigate: vi.fn(),
        actions: {
          "auth.logout": () => {
            throw new Error("boom");
          },
        },
        onExecuteError,
      },
    );

    expect(onExecuteError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ id: "action.logout" }));
  });
});

describe("useAICommand", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("exposes search state and executes selected results", async () => {
    const navigate = vi.fn();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      createFetchResponse([
        { id: "nav.settings", type: "navigation", title: "Settings", href: "/settings" },
      ]),
    );

    const { result } = renderHook(() =>
      useAICommand({
        endpoint: "/api/command-search",
        fetcher,
        navigate,
      }),
    );

    act(() => {
      result.current.setQuery("settings");
    });

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(result.current.results).toHaveLength(1);

    await act(async () => {
      await result.current.execute(result.current.results[0]!);
    });

    expect(navigate).toHaveBeenCalledWith("/settings");
  });

  it("treats missing actions as an empty action map", async () => {
    const onUnknownAction = vi.fn();

    await executeAICommand(
      { id: "action.logout", type: "action", title: "Log out", actionKey: "auth.logout" },
      {
        navigate: vi.fn(),
        onUnknownAction,
      },
    );

    expect(onUnknownAction).toHaveBeenCalledWith(
      "auth.logout",
      expect.objectContaining({ id: "action.logout" }),
    );
  });
});

describe("createCommandSearchHandler", () => {
  it("applies the default limit when limit is absent", async () => {
    const search = vi.fn().mockResolvedValue([]);
    const handler = createCommandSearchHandler({
      defaultLimit: 15,
      search,
    });

    await handler(new Request("https://example.com/api/command-search?q=billing"));

    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ query: "billing", limit: 15 }),
    );
  });

  it("clamps limit to maxLimit", async () => {
    const search = vi.fn().mockResolvedValue([]);
    const handler = createCommandSearchHandler({
      defaultLimit: 20,
      maxLimit: 50,
      search,
    });

    await handler(new Request("https://example.com/api/command-search?q=billing&limit=100"));

    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ query: "billing", limit: 50 }),
    );
  });

  it("passes empty queries through as an empty string", async () => {
    const search = vi.fn().mockResolvedValue([]);
    const handler = createCommandSearchHandler({
      search,
    });

    await handler(new Request("https://example.com/api/command-search"));

    expect(search).toHaveBeenCalledWith(expect.objectContaining({ query: "" }));
  });

  it("returns a JSON response shaped like { results }", async () => {
    const results: CommandSearchResult[] = [
      { id: "nav.settings", type: "navigation", title: "Settings", href: "/settings" },
    ];
    const handler = createCommandSearchHandler({
      search: vi.fn().mockResolvedValue(results),
    });

    const response = await handler(new Request("https://example.com/api/command-search?q=settings"));

    await expect(response.json()).resolves.toEqual({ results });
  });
});

describe("resolveVoiceDecision", () => {
  const defaults = {
    minConfidence: 0.6,
    autoExecute: "single" as const,
    peerGap: 0.15,
    stepGap: 0.05,
    voiceListLimit: 3,
  };

  const home = {
    id: "nav.home",
    type: "navigation" as const,
    title: "Home",
    href: "/home",
    score: 0.95,
  };
  const docs = {
    id: "nav.docs",
    type: "navigation" as const,
    title: "Docs",
    href: "/docs",
    score: 0.9,
  };
  const components = {
    id: "nav.components",
    type: "navigation" as const,
    title: "Components",
    href: "/components",
    score: 0.88,
  };

  it("routes straight for a single confident hit (single mode)", () => {
    const resolved = resolveVoiceDecision({
      ...defaults,
      results: [home],
    });

    expect(resolved.shouldExecute).toBe(true);
    expect(resolved.decision).toBe("executed");
    expect(resolved.destinationHref).toBe("/home");
    expect(resolved.top).toEqual(home);
  });

  it("shows a list when peer-band destinations disagree", () => {
    // Scores within stepGap of neighbors and peerGap of top → full band, 3 pages
    const resolved = resolveVoiceDecision({
      ...defaults,
      stepGap: 0.05,
      peerGap: 0.15,
      results: [
        { ...home, score: 0.92 },
        { ...docs, score: 0.9 },
        { ...components, score: 0.88 },
      ],
    });

    expect(resolved.shouldExecute).toBe(false);
    expect(resolved.decision).toBe("ambiguous");
    expect(resolved.results.length).toBeGreaterThanOrEqual(2);
  });

  it("auto-routes multi-hit when ambiguityGap is clear", () => {
    const resolved = resolveVoiceDecision({
      ...defaults,
      results: [
        { ...home, score: 0.95 },
        { ...docs, score: 0.7 },
      ],
      ambiguityGap: 0.12,
    });

    expect(resolved.shouldExecute).toBe(true);
    expect(resolved.decision).toBe("executed");
    expect(resolved.destinationHref).toBe("/home");
  });

  it("caps displayed results with voiceListLimit", () => {
    const resolved = resolveVoiceDecision({
      ...defaults,
      results: [
        { ...home, score: 0.95 },
        { ...docs, score: 0.94 },
        { ...components, score: 0.93 },
        { ...home, id: "nav.extra", href: "/extra", score: 0.92 },
      ],
      autoExecute: "never",
      voiceListLimit: 2,
      stepGap: 0.05,
    });

    expect(resolved.results).toHaveLength(2);
    expect(resolved.shouldExecute).toBe(false);
  });

  it("treats true as always and false as never", () => {
    expect(
      resolveVoiceDecision({
        ...defaults,
        results: [home, docs],
        autoExecute: true,
      }).shouldExecute,
    ).toBe(true);

    expect(
      resolveVoiceDecision({
        ...defaults,
        results: [home],
        autoExecute: false,
      }).shouldExecute,
    ).toBe(false);
  });

  it("returns empty when nothing passes confidence", () => {
    const resolved = resolveVoiceDecision({
      ...defaults,
      results: [{ ...home, score: 0.1 }],
      minConfidence: 0.7,
    });

    expect(resolved.decision).toBe("empty");
    expect(resolved.shouldExecute).toBe(false);
  });

  it("billing fixture: same-page action+nav → navigate to billing (not list, not leaf action)", () => {
    const billingResults: CommandSearchResult[] = [
      {
        id: "settings.billing.update-card",
        type: "action",
        title: "Update payment card",
        description: "Change the credit card used for billing",
        actionKey: "settings.billing.update-card",
        href: "/settings/billing",
        score: 0.7216892242431641,
      },
      {
        id: "settings.billing.open",
        type: "navigation",
        title: "Billing settings",
        description: "Update your payment method, download invoices, and change your plan",
        href: "/settings/billing",
        score: 0.6923880577087402,
      },
      {
        id: "settings.plans.open",
        type: "navigation",
        title: "Plans",
        description: "Compare plans, upgrade, or change billing frequency",
        href: "/settings/plans",
        score: 0.6344346702098846,
      },
      {
        id: "settings.billing.cancel",
        type: "action",
        title: "Cancel subscription",
        actionKey: "settings.billing.cancel",
        href: "/settings/billing",
        score: 0.633653074502945,
      },
      {
        id: "settings.profile.open",
        type: "navigation",
        title: "Profile settings",
        href: "/settings/profile",
        score: 0.6167759895324707,
      },
    ];

    const resolved = resolveVoiceDecision({
      ...defaults,
      results: billingResults,
    });

    expect(resolved.shouldExecute).toBe(true);
    expect(resolved.decision).toBe("executed");
    expect(resolved.destinationHref).toBe("/settings/billing");
    expect(resolved.top?.type).toBe("navigation");
    expect(resolved.top?.type === "navigation" && resolved.top.href).toBe("/settings/billing");
    // Prefer the real navigation row when present
    expect(resolved.top?.id).toBe("settings.billing.open");
  });

  it("profile cluster: action siblings share href → navigate to profile", () => {
    const resolved = resolveVoiceDecision({
      ...defaults,
      results: [
        {
          id: "settings.profile.open",
          type: "navigation",
          title: "Profile settings",
          href: "/settings/profile",
          score: 0.91,
        },
        {
          id: "settings.profile.save",
          type: "action",
          title: "Save profile",
          actionKey: "settings.profile.save",
          href: "/settings/profile",
          score: 0.89,
        },
        {
          id: "settings.profile.upload-avatar",
          type: "action",
          title: "Upload avatar",
          actionKey: "settings.profile.upload-avatar",
          href: "/settings/profile",
          score: 0.88,
        },
      ],
    });

    expect(resolved.shouldExecute).toBe(true);
    expect(resolved.destinationHref).toBe("/settings/profile");
    expect(resolved.top?.id).toBe("settings.profile.open");
  });

  it("large score gap: only top is a peer → navigate without listing far results", () => {
    const resolved = resolveVoiceDecision({
      ...defaults,
      results: [
        { ...home, score: 0.9 },
        { ...docs, score: 0.55 },
      ],
    });

    expect(resolved.shouldExecute).toBe(true);
    expect(resolved.destinationHref).toBe("/home");
    expect(resolved.results).toHaveLength(1);
  });
});

describe("useCommandVoice smart routing", () => {
  type RecognitionHandlers = {
    onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
    onerror: ((event: { error?: string }) => void) | null;
    onend: (() => void) | null;
  };

  let lastRecognition: RecognitionHandlers & {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    lastRecognition = {
      onresult: null,
      onerror: null,
      onend: null,
      start: vi.fn(),
      stop: vi.fn(),
    };

    class FakeSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = "";
      onresult = null;
      onerror = null;
      onend = null;
      start = vi.fn(() => {
        lastRecognition.onresult = this.onresult;
        lastRecognition.onerror = this.onerror;
        lastRecognition.onend = this.onend;
        lastRecognition.start = this.start;
        lastRecognition.stop = this.stop;
      });
      stop = vi.fn();

      constructor() {
        lastRecognition = this as unknown as typeof lastRecognition;
      }
    }

    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      writable: true,
      value: FakeSpeechRecognition,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error cleanup
    delete window.SpeechRecognition;
  });

  it("auto-executes a single confident match", async () => {
    const navigate = vi.fn();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      createFetchResponse([
        { id: "nav.home", type: "navigation", title: "Home", href: "/home", score: 0.95 },
      ]),
    );

    const { result } = renderHook(() =>
      useCommandVoice({
        endpoint: "/api/command-search",
        fetcher,
        navigate,
        shortcut: false,
        autoExecute: "single",
      }),
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.status).toBe("listening");

    await act(async () => {
      lastRecognition.onresult?.({
        results: [
          {
            isFinal: true,
            0: { transcript: "go home" },
          },
        ],
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetcher).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/home");
    expect(result.current.decision).toBe("executed");
  });

  it("keeps results open when multiple intents match", async () => {
    const navigate = vi.fn();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      createFetchResponse([
        { id: "nav.home", type: "navigation", title: "Home", href: "/home", score: 0.9 },
        { id: "nav.docs", type: "navigation", title: "Docs", href: "/docs", score: 0.88 },
        { id: "nav.components", type: "navigation", title: "Components", href: "/components", score: 0.85 },
      ]),
    );

    const { result } = renderHook(() =>
      useCommandVoice({
        endpoint: "/api/command-search",
        fetcher,
        navigate,
        shortcut: false,
        autoExecute: "single",
        voiceListLimit: 3,
      }),
    );

    act(() => {
      result.current.start();
    });

    await act(async () => {
      lastRecognition.onresult?.({
        results: [{ isFinal: true, 0: { transcript: "open something" } }],
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.status).toBe("results");
    expect(result.current.decision).toBe("ambiguous");
    expect(result.current.results).toHaveLength(3);
    expect(result.current.open).toBe(true);

    await act(async () => {
      await result.current.execute(result.current.results[1]);
    });

    expect(navigate).toHaveBeenCalledWith("/docs");
  });
});
