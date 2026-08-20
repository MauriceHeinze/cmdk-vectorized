import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AICommandPalette } from "./ai-command-palette";

describe("AICommandPalette", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
    vi.restoreAllMocks();
  });

  it("renders initial results in the controlled drop-in palette", () => {
    render(
      <AICommandPalette
        open
        endpoint="/api/command-search"
        fetcher={vi.fn<typeof fetch>()}
        navigate={vi.fn()}
        initialResults={[
          { id: "nav.settings", type: "navigation", title: "Settings", href: "/settings" },
        ]}
      />,
    );

    expect(screen.getByText("Settings")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeTruthy();
  });

  it("requests close when Escape is pressed", () => {
    const onOpenChange = vi.fn();
    render(
      <AICommandPalette
        open
        onOpenChange={onOpenChange}
        endpoint="/api/command-search"
        fetcher={vi.fn<typeof fetch>()}
        navigate={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
