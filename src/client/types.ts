import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

import type {
  CommandSearchResult,
  ExecuteAICommandContext,
} from "../core/command-types";

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

export type VoiceAutoExecute = boolean | "single" | "always" | "never";
export type VoiceDecision = "pending" | "executed" | "ambiguous" | "empty" | "error";
export type CommandVoiceShortcut = "mod+m" | false;

export type UseCommandVoiceOptions = ExecuteAICommandContext &
  Pick<
    UseAICommandSearchOptions,
    "endpoint" | "headers" | "fetcher" | "transformResponse" | "minConfidence"
  > & {
    lang?: string;
    maxResults?: number;
    autoExecute?: VoiceAutoExecute;
    peerGap?: number;
    stepGap?: number;
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
