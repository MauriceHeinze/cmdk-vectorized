import type { ButtonHTMLAttributes, ReactNode } from "react";

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
  score?: number;
  meta?: Record<string, unknown>;
};

export type CommandSearchResult = NavigationCommandResult | ActionCommandResult;

export type CommandSearchResponse = {
  results: CommandSearchResult[];
};

export type UseAICommandSearchOptions = {
  endpoint: string;
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
  minConfidence?: number;
  headers?: HeadersInit;
  fetcher?: typeof fetch;
  transformResponse?: (data: unknown) => CommandSearchResult[];
  initialResults?: CommandSearchResult[];
  searchOnEmptyQuery?: boolean;
};

export type UseAICommandSearchResult = {
  query: string;
  setQuery: (query: string) => void;
  results: CommandSearchResult[];
  loading: boolean;
  error: Error | null;
  clear: () => void;
  refetch: () => Promise<void>;
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

export type UseAICommandOptions = UseAICommandSearchOptions & ExecuteAICommandContext;

export type UseAICommandResult = UseAICommandSearchResult & {
  execute: (result: CommandSearchResult) => Promise<void>;
};

export type CommandVoiceStatus =
  | "idle"
  | "listening"
  | "searching"
  | "executing"
  | "error";

export type CommandVoiceShortcut = "mod+m" | false;

export type UseCommandVoiceOptions = ExecuteAICommandContext &
  Pick<
    UseAICommandSearchOptions,
    "endpoint" | "headers" | "fetcher" | "transformResponse" | "minConfidence"
  > & {
    lang?: string;
    maxResults?: number;
    autoExecute?: boolean;
    shortcut?: CommandVoiceShortcut;
    onShortcut?: () => void;
  };

export type UseCommandVoiceResult = {
  supported: boolean;
  open: boolean;
  status: CommandVoiceStatus;
  transcript: string;
  error: Error | null;
  result: CommandSearchResult | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
};

export type CommandVoiceRenderProps = UseCommandVoiceResult;

export type CommandVoiceProps = UseCommandVoiceOptions & {
  children?: (props: CommandVoiceRenderProps) => ReactNode;
  labels?: {
    start?: ReactNode;
    stop?: ReactNode;
    unsupported?: ReactNode;
    listening?: ReactNode;
    searching?: ReactNode;
    executing?: ReactNode;
    error?: (error: Error) => ReactNode;
  };
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick" | "type">;
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
