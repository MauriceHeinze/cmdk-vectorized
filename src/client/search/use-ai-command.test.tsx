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

  it("does not refetch when navigate/headers are recreated each render", async () => {
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
      (props: { hrefPrefix: string }) =>
        useAICommand({
          endpoint: "/api/search",
          debounceMs: 200,
          fetcher,
          headers: { Authorization: "Bearer ck_site_test" },
          navigate: vi.fn(),
          resolveHref: (href) => `${props.hrefPrefix}${href}`,
        }),
      { initialProps: { hrefPrefix: "" } },
    );

    act(() => {
      result.current.setQuery("invite team members");
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);

    rerender({ hrefPrefix: "#" });
    rerender({ hrefPrefix: "##" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);

    resolveFetch?.(
      createFetchResponse([
        { id: "nav.invite", type: "navigation", title: "Invite", href: "/invite" },
      ]),
    );

    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0]).toBe(
      "/api/search?q=invite+team+members&limit=20",
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
