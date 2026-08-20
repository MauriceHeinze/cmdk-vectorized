import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAICommandPalette } from "./use-ai-command-palette";

function options() {
  return {
    endpoint: "/api/command-search",
    fetcher: vi.fn<typeof fetch>(),
    navigate: vi.fn(),
  };
}

function press(key: "k" | "m") {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, metaKey: true }));
}

describe("useAICommandPalette", () => {
  afterEach(() => vi.restoreAllMocks());

  it("toggles its uncontrolled text palette with the keyboard shortcut", () => {
    const { result } = renderHook(() => useAICommandPalette(options()));

    act(() => press("k"));
    expect(result.current.open).toBe(true);
    expect(result.current.mode).toBe("text");

    act(() => press("k"));
    expect(result.current.open).toBe(false);
  });

  it("requests controlled state changes without mutating the open prop", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() => useAICommandPalette({
      ...options(),
      open: false,
      onOpenChange,
    }));

    act(() => result.current.openText());
    expect(result.current.open).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("opens voice mode from its shortcut", () => {
    const { result } = renderHook(() => useAICommandPalette(options()));

    act(() => press("m"));
    expect(result.current.open).toBe(true);
    expect(result.current.mode).toBe("voice");
    expect(result.current.voice.status).toBe("error");
  });
});
