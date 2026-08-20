export type NavigationCommandResult = {
  id: string;
  type: "navigation";
  title: string;
  description?: string;
  href: string;
  score?: number;
  meta?: Record<string, unknown>;
};

export type ActionCommandResult = {
  id: string;
  type: "action";
  title: string;
  description?: string;
  actionKey: string;
  /** Host page used to group related voice results. */
  href?: string;
  score?: number;
  meta?: Record<string, unknown>;
};

export type CommandSearchResult = NavigationCommandResult | ActionCommandResult;

export type CommandSearchResponse = {
  results: CommandSearchResult[];
};

export type ExecuteAICommandContext = {
  navigate: (href: string) => void | Promise<void>;
  actions?: Record<string, (ctx: ExecuteAICommandContext) => void | Promise<void>>;
  resolveHref?: (
    href: string,
    result: NavigationCommandResult,
  ) => string | null | undefined | Promise<string | null | undefined>;
  routeExists?: (href: string) => boolean;
  onUnknownAction?: (actionKey: string, result: ActionCommandResult) => void;
  onUnknownRoute?: (href: string, result: NavigationCommandResult) => void;
  onUnresolvedHref?: (href: string, result: NavigationCommandResult) => void;
  onExecuteError?: (error: unknown, result: CommandSearchResult) => void;
};

export type CreateCommandSearchHandlerOptions = {
  search: (params: {
    query: string;
    limit: number;
    request: Request;
  }) => Promise<CommandSearchResult[]>;
  defaultLimit?: number;
  maxLimit?: number;
};
