import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

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
  /**
   * Host page for this action (e.g. `/settings/profile`).
   * Used by voice to cluster sibling intents and navigate to the page.
   */
  href?: string;
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
  | "results"
  | "executing"
  | "error";

/** Smart single-intent routing (default), force always, or never auto-route. */
export type VoiceAutoExecute = boolean | "single" | "always" | "never";

export type VoiceDecision = "pending" | "executed" | "ambiguous" | "empty" | "error";

export type CommandVoiceShortcut = "mod+m" | false;

export type UseCommandVoiceOptions = ExecuteAICommandContext &
  Pick<
    UseAICommandSearchOptions,
    "endpoint" | "headers" | "fetcher" | "transformResponse" | "minConfidence"
  > & {
    lang?: string;
    /** Max results fetched from the search endpoint. Default 5. */
    maxResults?: number;
    /**
     * Auto-routing policy after speech search:
     * - `"single"` (default): navigate when peer-band shares one page href
     * - `"always"` / `true`: always go to top result's page href
     * - `"never"` / `false`: never auto-route; show peer list when hits exist
     */
    autoExecute?: VoiceAutoExecute;
    /**
     * @deprecated Prefer `peerGap` / `stepGap` href clustering. Still honored as an
     * extra early exit when top two vector scores differ by at least this amount.
     */
    ambiguityGap?: number;
    /**
     * Max score distance below the top hit to stay in the peer band.
     * Default 0.15 — a result ~0.3 below top is not a peer.
     */
    peerGap?: number;
    /**
     * Stop extending the peer band at the first neighbor cliff larger than this.
     * Default 0.05 (keeps same-page siblings, drops the next section).
     */
    stepGap?: number;
    /** Max results shown when destinations in the peer band disagree. Default 3. */
    voiceListLimit?: number;
    shortcut?: CommandVoiceShortcut;
    onShortcut?: () => void;
  };

export type UseCommandVoiceResult = {
  supported: boolean;
  open: boolean;
  status: CommandVoiceStatus;
  transcript: string;
  error: Error | null;
  /** Top / last executed result (compat). */
  result: CommandSearchResult | null;
  /** Candidate list (capped) after search — especially when decision is `"ambiguous"`. */
  results: CommandSearchResult[];
  decision: VoiceDecision;
  start: () => void;
  stop: () => void;
  reset: () => void;
  /** Manually execute a result (e.g. user picked from ambiguous list). */
  execute: (result?: CommandSearchResult) => Promise<void>;
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
    results?: ReactNode;
    error?: (error: Error) => ReactNode;
  };
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick" | "type">;
};

export type PaletteMode = "text" | "voice";

export type PaletteOpenShortcut = "mod+k" | false;

export type UseAICommandPaletteOptions = UseAICommandOptions &
  Pick<
    UseCommandVoiceOptions,
    | "lang"
    | "autoExecute"
    | "ambiguityGap"
    | "peerGap"
    | "stepGap"
    | "voiceListLimit"
    | "maxResults"
  > & {
    /** Controlled open state. When omitted, the palette manages open internally. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Text-mode open shortcut. Default `"mod+k"`. Pass `false` to disable. */
    openShortcut?: PaletteOpenShortcut;
    /** Voice-mode shortcut. Default `"mod+m"`. Pass `false` to disable. */
    voiceShortcut?: CommandVoiceShortcut;
    /** Max results for text search (useAICommand). Independent of voice maxResults when both set. */
    textMaxResults?: number;
    /** Max results for voice search. Defaults to `maxResults` or 5. */
    voiceMaxResults?: number;
  };

export type UseAICommandPaletteResult = {
  open: boolean;
  mode: PaletteMode;
  openText: () => void;
  openVoice: () => void;
  close: () => void;
  setMode: (mode: PaletteMode) => void;
  command: UseAICommandResult;
  voice: UseCommandVoiceResult;
};

export type AICommandPaletteClassNames = {
  root?: string;
  backdrop?: string;
  dialog?: string;
  inputWrap?: string;
  input?: string;
  list?: string;
  item?: string;
  itemTitle?: string;
  itemDescription?: string;
  empty?: string;
  error?: string;
  footer?: string;
  footerHint?: string;
  kbd?: string;
  voiceBody?: string;
  voiceTranscript?: string;
  voiceStop?: string;
  voiceHeading?: string;
};

export type AICommandPaletteProps = UseAICommandPaletteOptions & {
  /** Controlled open state. When omitted, the palette manages open internally via shortcuts. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  /** Heading above ambiguous voice results. Default `"Top results:"`. */
  voiceResultsHeading?: string;
  className?: string;
  classNames?: AICommandPaletteClassNames;
  style?: CSSProperties;
  /** Group label above empty-query / initial results list. */
  listHeading?: string;
  labels?: {
    goToPage?: string;
    voiceSearch?: string;
    textSearch?: string;
    empty?: string;
    searching?: string;
    listening?: string;
    stopVoice?: string;
  };
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
