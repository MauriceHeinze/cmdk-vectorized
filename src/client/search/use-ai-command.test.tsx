import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { executeAICommand } from "../../core/execute-ai-command";
import { createFetchResponse } from "../../testing/create-fetch-response";
import { useAICommand } from "./use-ai-command";

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

  it("keeps execute stable and uses the latest navigation callback", async () => {
    const firstNavigate = vi.fn();
    const secondNavigate = vi.fn();
    const { result, rerender } = renderHook(
      ({ navigate }) => useAICommand({
        endpoint: "/api/command-search",
        fetcher: vi.fn<typeof fetch>(),
        navigate,
      }),
      { initialProps: { navigate: firstNavigate } },
    );
    const execute = result.current.execute;

    rerender({ navigate: secondNavigate });
    expect(result.current.execute).toBe(execute);

    await act(() => result.current.execute({
      id: "nav.latest",
      type: "navigation",
      title: "Latest",
      href: "/latest",
    }));
    expect(firstNavigate).not.toHaveBeenCalled();
    expect(secondNavigate).toHaveBeenCalledWith("/latest");
  });
});
