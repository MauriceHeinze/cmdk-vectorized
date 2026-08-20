import { afterEach, describe, expect, it, vi } from "vitest";

import { executeAICommand } from "./execute-ai-command";

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
