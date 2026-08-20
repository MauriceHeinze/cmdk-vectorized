import { useCallback, useEffect, useRef, useState } from "react";

import { useCommandVoice } from "./command-voice";
import type {
  PaletteMode,
  UseAICommandPaletteOptions,
  UseAICommandPaletteResult,
} from "./types";
import { useAICommand } from "./use-ai-command";

function isOpenShortcut(event: KeyboardEvent) {
  return (
    !event.defaultPrevented &&
    event.key.toLowerCase() === "k" &&
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey
  );
}

function isVoiceShortcut(event: KeyboardEvent) {
  return (
    !event.defaultPrevented &&
    event.key.toLowerCase() === "m" &&
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey
  );
}

/**
 * Headless controller that unifies text search + voice mode for a command palette.
 * Compose with your own UI, or use `AICommandPalette` for the styled drop-in.
 *
 * Supports controlled (`open` + `onOpenChange`) or uncontrolled open state.
 */
export function useAICommandPalette(
  options: UseAICommandPaletteOptions,
): UseAICommandPaletteResult {
  const {
    open: openProp,
    onOpenChange,
    openShortcut = "mod+k",
    voiceShortcut = "mod+m",
    textMaxResults,
    voiceMaxResults,
    maxResults,
    lang,
    autoExecute,
    ambiguityGap,
    peerGap,
    stepGap,
    voiceListLimit,
    endpoint,
    headers,
    fetcher,
    transformResponse,
    minConfidence,
    debounceMs,
    minQueryLength,
    initialResults,
    searchOnEmptyQuery,
    navigate,
    actions,
    resolveHref,
    routeExists,
    onUnknownAction,
    onUnknownRoute,
    onUnresolvedHref,
    onExecuteError,
  } = options;

  const isControlled = openProp !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [mode, setMode] = useState<PaletteMode>("text");

  const open = isControlled ? Boolean(openProp) : uncontrolledOpen;

  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChangeRef.current?.(next);
    },
    [isControlled],
  );

  const textLimit = textMaxResults ?? maxResults;
  const voiceLimit = voiceMaxResults ?? maxResults;

  const command = useAICommand({
    endpoint,
    headers,
    fetcher,
    transformResponse,
    minConfidence,
    debounceMs,
    minQueryLength,
    maxResults: textLimit,
    initialResults,
    searchOnEmptyQuery,
    navigate,
    actions,
    resolveHref,
    routeExists,
    onUnknownAction,
    onUnknownRoute,
    onUnresolvedHref,
    onExecuteError,
  });

  const { clear: clearCommand } = command;
  const clearCommandRef = useRef(clearCommand);
  clearCommandRef.current = clearCommand;

  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const voice = useCommandVoice({
    endpoint,
    headers,
    fetcher,
    transformResponse,
    minConfidence,
    maxResults: voiceLimit,
    lang,
    autoExecute,
    ambiguityGap,
    peerGap,
    stepGap,
    voiceListLimit,
    shortcut: false,
    navigate: async (href) => {
      await navigateRef.current(href);
      setMode("text");
      setOpen(false);
      clearCommandRef.current();
    },
    actions,
    resolveHref,
    routeExists,
    onUnknownAction,
    onUnknownRoute,
    onUnresolvedHref,
    onExecuteError,
  });

  const { start: startVoice, stop: stopVoice, reset: resetVoice } = voice;
  const startVoiceRef = useRef(startVoice);
  const stopVoiceRef = useRef(stopVoice);
  const resetVoiceRef = useRef(resetVoice);
  startVoiceRef.current = startVoice;
  stopVoiceRef.current = stopVoice;
  resetVoiceRef.current = resetVoice;

  const close = useCallback(() => {
    resetVoiceRef.current();
    setMode("text");
    setOpen(false);
    clearCommandRef.current();
  }, [setOpen]);

  const openText = useCallback(() => {
    resetVoiceRef.current();
    setMode("text");
    setOpen(true);
    clearCommandRef.current();
  }, [setOpen]);

  const openVoice = useCallback(() => {
    setMode("voice");
    setOpen(true);
    clearCommandRef.current();
    startVoiceRef.current();
  }, [setOpen]);

  const setModeAndMaybeStart = useCallback(
    (next: PaletteMode) => {
      if (next === "voice") {
        openVoice();
        return;
      }
      openText();
    },
    [openText, openVoice],
  );

  // After smart auto-execute, voice hook closes itself — mirror that on the palette.
  useEffect(() => {
    if (mode !== "voice") {
      return;
    }
    if (!voice.open && voice.status === "idle" && voice.decision === "executed") {
      setMode("text");
      setOpen(false);
      clearCommandRef.current();
    }
  }, [mode, setOpen, voice.decision, voice.open, voice.status]);

  // When parent forces closed while voice is active, reset voice chrome.
  useEffect(() => {
    if (!open) {
      resetVoiceRef.current();
      setMode("text");
    }
  }, [open]);

  useEffect(() => {
    if (openShortcut === false && voiceShortcut === false) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (openShortcut !== false && isOpenShortcut(event)) {
        event.preventDefault();
        if (open && mode === "text") {
          close();
          return;
        }
        if (open && mode === "voice") {
          openText();
          return;
        }
        openText();
        return;
      }

      if (voiceShortcut !== false && isVoiceShortcut(event)) {
        event.preventDefault();
        if (open && mode === "voice" && voice.status === "listening") {
          stopVoiceRef.current();
          return;
        }
        openVoice();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [close, mode, open, openShortcut, openText, openVoice, voice.status, voiceShortcut]);

  return {
    open,
    mode,
    openText,
    openVoice,
    close,
    setMode: setModeAndMaybeStart,
    command,
    voice,
  };
}
