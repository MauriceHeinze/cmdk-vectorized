import { useCallback, useEffect, useState } from "react";

import type {
  PaletteMode,
  UseAICommandPaletteOptions,
  UseAICommandPaletteResult,
} from "./types";
import { useAICommand } from "./use-ai-command";
import { useCommandVoice } from "./use-command-voice";
import { useGlobalShortcut } from "./use-global-shortcut";
import { useLatest } from "./use-latest";

export function useAICommandPalette(
  options: UseAICommandPaletteOptions,
): UseAICommandPaletteResult {
  const isControlled = options.open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const [mode, setMode] = useState<PaletteMode>("text");
  const open = isControlled ? Boolean(options.open) : internalOpen;

  const onOpenChangeRef = useLatest(options.onOpenChange);
  const navigateRef = useLatest(options.navigate);

  const setOpen = useCallback((next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChangeRef.current?.(next);
  }, [isControlled, onOpenChangeRef]);

  const command = useAICommand({
    endpoint: options.endpoint,
    headers: options.headers,
    fetcher: options.fetcher,
    transformResponse: options.transformResponse,
    minConfidence: options.minConfidence,
    debounceMs: options.debounceMs,
    minQueryLength: options.minQueryLength,
    maxResults: options.textMaxResults ?? options.maxResults,
    initialResults: options.initialResults,
    searchOnEmptyQuery: options.searchOnEmptyQuery,
    navigate: options.navigate,
    actions: options.actions,
    resolveHref: options.resolveHref,
    routeExists: options.routeExists,
    onUnknownAction: options.onUnknownAction,
    onUnknownRoute: options.onUnknownRoute,
    onUnresolvedHref: options.onUnresolvedHref,
    onExecuteError: options.onExecuteError,
  });

  const clearRef = useLatest(command.clear);

  const voice = useCommandVoice({
    endpoint: options.endpoint,
    headers: options.headers,
    fetcher: options.fetcher,
    transformResponse: options.transformResponse,
    minConfidence: options.minConfidence,
    maxResults: options.voiceMaxResults ?? options.maxResults,
    lang: options.lang,
    autoExecute: options.autoExecute,
    peerGap: options.peerGap,
    stepGap: options.stepGap,
    voiceListLimit: options.voiceListLimit,
    shortcut: false,
    navigate: async (href) => {
      await navigateRef.current(href);
      setMode("text");
      setOpen(false);
      clearRef.current();
    },
    actions: options.actions,
    resolveHref: options.resolveHref,
    routeExists: options.routeExists,
    onUnknownAction: options.onUnknownAction,
    onUnknownRoute: options.onUnknownRoute,
    onUnresolvedHref: options.onUnresolvedHref,
    onExecuteError: options.onExecuteError,
  });

  const voiceRef = useLatest(voice);

  const close = useCallback(() => {
    voiceRef.current.reset();
    clearRef.current();
    setMode("text");
    setOpen(false);
  }, [clearRef, setOpen, voiceRef]);

  const openText = useCallback(() => {
    voiceRef.current.reset();
    clearRef.current();
    setMode("text");
    setOpen(true);
  }, [clearRef, setOpen, voiceRef]);

  const openVoice = useCallback(() => {
    clearRef.current();
    setMode("voice");
    setOpen(true);
    voiceRef.current.start();
  }, [clearRef, setOpen, voiceRef]);

  const selectMode = useCallback((next: PaletteMode) => {
    if (next === "voice") openVoice();
    else openText();
  }, [openText, openVoice]);

  useEffect(() => {
    if (mode === "voice" && !voice.open && voice.decision === "executed") {
      clearRef.current();
      // Sync the palette shell after the voice controller completes an action.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("text");
      setOpen(false);
    }
  }, [clearRef, mode, setOpen, voice.decision, voice.open]);

  useEffect(() => {
    if (!open) {
      voiceRef.current.reset();
      // Controlled parents can close without calling our close handler.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("text");
    }
  }, [open, voiceRef]);

  useGlobalShortcut(options.openShortcut === false ? false : "k", () => {
    if (open && mode === "text") close();
    else openText();
  });
  useGlobalShortcut(options.voiceShortcut === false ? false : "m", () => {
    if (open && mode === "voice" && voiceRef.current.status === "listening") {
      voiceRef.current.stop();
    } else {
      openVoice();
    }
  });

  return { open, mode, openText, openVoice, close, setMode: selectMode, command, voice };
}
