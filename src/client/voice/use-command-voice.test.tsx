import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFetchResponse } from "../../testing/create-fetch-response";
import { useCommandVoice } from "./use-command-voice";

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

  it("aborts an in-flight search when reset", async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    let signal: AbortSignal | undefined;
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_input, init) => {
      signal = init?.signal ?? undefined;
      return new Promise((resolve) => {
        resolveResponse = resolve;
      });
    });
    const { result } = renderHook(() => useCommandVoice({
      endpoint: "/api/command-search",
      fetcher,
      navigate: vi.fn(),
      shortcut: false,
    }));

    act(() => result.current.start());
    await act(async () => {
      lastRecognition.onresult?.({
        results: [{ isFinal: true, 0: { transcript: "open home" } }],
      });
      await Promise.resolve();
    });
    expect(fetcher).toHaveBeenCalledOnce();

    act(() => result.current.reset());
    expect(signal?.aborted).toBe(true);
    expect(result.current.status).toBe("idle");

    await act(async () => {
      resolveResponse?.(createFetchResponse([
        { id: "nav.home", type: "navigation", title: "Home", href: "/home" },
      ]));
      await Promise.resolve();
    });
    expect(result.current.decision).toBe("pending");
  });

  it("keeps a newer voice result when an older request finishes late", async () => {
    const responses: Array<(response: Response) => void> = [];
    const signals: AbortSignal[] = [];
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_input, init) => {
      if (init?.signal) signals.push(init.signal);
      return new Promise((resolve) => responses.push(resolve));
    });
    const { result } = renderHook(() => useCommandVoice({
      endpoint: "/api/command-search",
      fetcher,
      navigate: vi.fn(),
      shortcut: false,
      autoExecute: "never",
    }));

    act(() => result.current.start());
    await act(async () => {
      lastRecognition.onresult?.({
        results: [{ isFinal: true, 0: { transcript: "open old page" } }],
      });
      await Promise.resolve();
    });

    act(() => result.current.start());
    await act(async () => {
      lastRecognition.onresult?.({
        results: [{ isFinal: true, 0: { transcript: "open new page" } }],
      });
      await Promise.resolve();
    });

    expect(signals[0]?.aborted).toBe(true);
    await act(async () => {
      responses[1]?.(createFetchResponse([
        { id: "nav.new", type: "navigation", title: "New", href: "/new" },
      ]));
      await Promise.resolve();
    });
    expect(result.current.results[0]?.id).toBe("nav.new");

    await act(async () => {
      responses[0]?.(createFetchResponse([
        { id: "nav.old", type: "navigation", title: "Old", href: "/old" },
      ]));
      await Promise.resolve();
    });
    expect(result.current.results[0]?.id).toBe("nav.new");
  });
});
