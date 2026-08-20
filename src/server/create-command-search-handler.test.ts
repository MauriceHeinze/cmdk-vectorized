import { describe, expect, it, vi } from "vitest";

import type { CommandSearchResult } from "../core/command-types";
import { createCommandSearchHandler } from "./create-command-search-handler";

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
