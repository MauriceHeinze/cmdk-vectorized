/*
 * cmdk-vectorized — vector-ranked command palette, not client-side cmdk filtering.
 * Drop-in: `AICommandPalette`. Headless: `useAICommand` + `<Command shouldFilter={false}>`.
 */

/** Re-export of `cmdk`. Headless UIs must render `<Command shouldFilter={false}>`. */
export { Command } from "cmdk";

export { AICommandPalette } from "./client/palette/ai-command-palette";
export { CommandVoice } from "./client/voice/command-voice";
export { useAICommand } from "./client/search/use-ai-command";
export { useAICommandPalette } from "./client/palette/use-ai-command-palette";
export { useAICommandSearch } from "./client/search/use-ai-command-search";
export { useCommandVoice } from "./client/voice/use-command-voice";
export { VoiceWaveform } from "./client/voice/voice-waveform";
export { executeAICommand } from "./core/execute-ai-command";

export type {
  AICommandPaletteClassNames,
  AICommandPaletteProps,
  CommandVoiceProps,
  CommandVoiceRenderProps,
  CommandVoiceShortcut,
  CommandVoiceStatus,
  PaletteMode,
  PaletteOpenShortcut,
  UseAICommandOptions,
  UseAICommandPaletteOptions,
  UseAICommandPaletteResult,
  UseAICommandResult,
  UseAICommandSearchOptions,
  UseAICommandSearchResult,
  UseCommandVoiceOptions,
  UseCommandVoiceResult,
  VoiceAutoExecute,
  VoiceDecision,
} from "./client/types";

export type {
  ActionCommandResult,
  CommandSearchResponse,
  CommandSearchResult,
  ExecuteAICommandContext,
  NavigationCommandResult,
} from "./core/command-types";
