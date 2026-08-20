export { Command } from "cmdk";

export { AICommandPalette } from "./client/ai-command-palette";
export { CommandVoice } from "./client/command-voice";
export { useAICommand } from "./client/use-ai-command";
export { useAICommandPalette } from "./client/use-ai-command-palette";
export { useAICommandSearch } from "./client/use-ai-command-search";
export { useCommandVoice } from "./client/use-command-voice";
export { VoiceWaveform } from "./client/voice-waveform";
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
