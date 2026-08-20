/** Host should navigate to `href`. */
export type NavigationCommandResult = {
  id: string;
  type: "navigation";
  title: string;
  description?: string;
  href: string;
  /** Retrieval score. Missing scores pass client `minConfidence` filters. */
  score?: number;
  meta?: Record<string, unknown>;
};

/** Host should call `actions[actionKey]`. */
export type ActionCommandResult = {
  id: string;
  type: "action";
  title: string;
  description?: string;
  actionKey: string;
  /** Host page used to group related voice results. Required for voice auto-route. */
  href?: string;
  /** Retrieval score. Missing scores pass client `minConfidence` filters. */
  score?: number;
  meta?: Record<string, unknown>;
};

export type CommandSearchResult = NavigationCommandResult | ActionCommandResult;

export type CommandSearchResponse = {
  results: CommandSearchResult[];
};

/** App-owned navigation and actions. The library never owns routing or side effects. */
export type ExecuteAICommandContext = {
  navigate: (href: string) => void | Promise<void>;
  actions?: Record<string, (ctx: ExecuteAICommandContext) => void | Promise<void>>;
  /** Rewrite or drop an href before navigate. Returning empty triggers `onUnresolvedHref`. */
  resolveHref?: (
    href: string,
    result: NavigationCommandResult,
  ) => string | null | undefined | Promise<string | null | undefined>;
  /** When set, unknown paths call `onUnknownRoute` instead of `navigate`. */
  routeExists?: (href: string) => boolean;
  onUnknownAction?: (actionKey: string, result: ActionCommandResult) => void;
  onUnknownRoute?: (href: string, result: NavigationCommandResult) => void;
  onUnresolvedHref?: (href: string, result: NavigationCommandResult) => void;
  /** Called instead of rethrowing. `executeAICommand` does not reject on handler errors. */
  onExecuteError?: (error: unknown, result: CommandSearchResult) => void;
};

export type CreateCommandSearchHandlerOptions = {
  /** Host ranking (Weaviate or similar). This library does not query a vector DB itself. */
  search: (params: {
    query: string;
    limit: number;
    request: Request;
  }) => Promise<CommandSearchResult[]>;
  defaultLimit?: number;
  /** Caps the client `limit` query param. */
  maxLimit?: number;
};
