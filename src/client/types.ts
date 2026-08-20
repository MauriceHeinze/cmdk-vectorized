import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

import type {
  CommandSearchResult,
  ExecuteAICommandContext,
} from "../core/command-types";

/**
 * Debounced vector search against `endpoint`.
 * Default `minConfidence` is 0.7; results without `score` are kept.
 */
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
  /** When true, still GET the endpoint for an empty query (e.g. default list). */
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

/** Search options plus host `navigate` / `actions` for `execute`. */
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

/**
 * Voice auto-route after search.
 * `"single"` (default): execute when the peer band agrees on one page.
 * `"always"` / `true`: top page. `"never"` / `false`: always list.
 */
export type VoiceAutoExecute = boolean | "single" | "always" | "never";
export type VoiceDecision = "pending" | "executed" | "ambiguous" | "empty" | "error";
export type CommandVoiceShortcut = "mod+m" | false;

/**
 * Web Speech plus the same search endpoint and execute context.
 * Voice `minConfidence` defaults to 0.6 (lower than typed search).
 */
export type UseCommandVoiceOptions = ExecuteAICommandContext &
  Pick<
    UseAICommandSearchOptions,
    "endpoint" | "headers" | "fetcher" | "transformResponse" | "minConfidence"
  > & {
    lang?: string;
    maxResults?: number;
    autoExecute?: VoiceAutoExecute;
    /** Max score distance from the top hit to stay in the peer band. Default 0.15. */
    peerGap?: number;
    /** Neighbor cliff that ends the peer band. Default 0.05. */
    stepGap?: number;
    /** Cap for the ambiguous-result list. Default 3. */
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
  result: CommandSearchResult | null;
  results: CommandSearchResult[];
  decision: VoiceDecision;
  start: () => void;
  stop: () => void;
  reset: () => void;
  execute: (result?: CommandSearchResult) => Promise<void>;
};

export type CommandVoiceRenderProps = UseCommandVoiceResult;

/** Pass `children` for a custom UI; otherwise a default button + list is rendered. */
export type CommandVoiceProps = UseCommandVoiceOptions & {
  children?: (props: UseCommandVoiceResult) => ReactNode;
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

/**
 * Drop-in / headless palette controller.
 * Default shortcuts: ⌘/Ctrl+K text, ⌘/Ctrl+M voice.
 */
export type UseAICommandPaletteOptions = UseAICommandOptions &
  Pick<
    UseCommandVoiceOptions,
    "lang" | "autoExecute" | "peerGap" | "stepGap" | "voiceListLimit" | "maxResults"
  > & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    openShortcut?: PaletteOpenShortcut;
    voiceShortcut?: CommandVoiceShortcut;
    textMaxResults?: number;
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

export type AICommandPaletteClassNames = Partial<Record<
  | "root" | "backdrop" | "dialog" | "inputWrap" | "input" | "list"
  | "item" | "itemTitle" | "itemDescription" | "empty" | "error"
  | "footer" | "footerHint" | "kbd" | "voiceBody" | "voiceTranscript"
  | "voiceStop" | "voiceHeading",
  string
>>;

/** Styled drop-in palette. CSS is scoped to `.cmdk-ai` when using `cmdk-vectorized/styles.css`. */
export type AICommandPaletteProps = UseAICommandPaletteOptions & {
  placeholder?: string;
  voiceResultsHeading?: string;
  className?: string;
  classNames?: AICommandPaletteClassNames;
  style?: CSSProperties;
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
