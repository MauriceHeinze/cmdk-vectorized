import { useCallback, useEffect, useRef, useState } from "react";

import type { CommandSearchResult } from "../../core/command-types";
import { executeAICommand } from "../../core/execute-ai-command";
import { isAbortError } from "../search/search-client";
import {
  createSpeechRecognition,
  speechRecognitionSupported,
  stopSpeechRecognition,
  type SpeechRecognitionInstance,
} from "./speech-recognition";
import type {
  UseCommandVoiceOptions,
  UseCommandVoiceResult,
} from "../types";
import { useGlobalShortcut } from "../hooks/use-global-shortcut";
import { useLatest } from "../hooks/use-latest";
import { searchVoiceCommand } from "./voice-search";

const DEFAULT_LANGUAGE = "en-US";

type VoiceState = Omit<UseCommandVoiceResult, "start" | "stop" | "reset" | "execute">;

function initialState(): VoiceState {
  return {
    supported: speechRecognitionSupported(),
    open: false,
    status: "idle",
    transcript: "",
    error: null,
    result: null,
    results: [],
    decision: "pending",
  };
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error("Voice command failed.");
}

export function useCommandVoice(
  options: UseCommandVoiceOptions,
): UseCommandVoiceResult {
  const [state, setState] = useState(initialState);
  const optionsRef = useLatest(options);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const transcriptRef = useRef("");
  const submittedRef = useRef(false);
  const recognitionErrorRef = useRef(false);

  const patchState = useCallback((patch: Partial<VoiceState>) => {
    setState((current) => ({ ...current, ...patch }));
  }, []);

  const cancelRequest = useCallback(() => {
    requestRef.current?.abort();
    requestRef.current = null;
    requestIdRef.current += 1;
  }, []);

  const reset = useCallback(() => {
    stopSpeechRecognition(recognitionRef.current);
    recognitionRef.current = null;
    cancelRequest();
    transcriptRef.current = "";
    submittedRef.current = false;
    recognitionErrorRef.current = false;
    setState(initialState());
  }, [cancelRequest]);

  const runSearch = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query || submittedRef.current) return;

    submittedRef.current = true;
    cancelRequest();
    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestRef.current = controller;
    requestIdRef.current = requestId;
    patchState({ status: "searching", error: null, decision: "pending", results: [] });

    try {
      const active = optionsRef.current;
      const resolved = await searchVoiceCommand(query, controller.signal, active);
      if (requestId !== requestIdRef.current) return;
      if (resolved.decision === "empty") {
        patchState({
          status: "error",
          decision: "error",
          error: new Error(`No command match found for "${query}".`),
        });
        return;
      }

      if (resolved.shouldExecute && resolved.top) {
        patchState({ status: "executing", result: resolved.top });
        await executeAICommand(resolved.top, optionsRef.current);
        if (requestId !== requestIdRef.current) return;
        patchState({ status: "idle", open: false, decision: "executed", results: [] });
        return;
      }

      patchState({
        status: "results",
        results: resolved.results,
        result: resolved.top,
        decision: resolved.decision,
      });
    } catch (error) {
      if (controller.signal.aborted || isAbortError(error)) return;
      patchState({ status: "error", decision: "error", error: toError(error) });
    }
  }, [cancelRequest, optionsRef, patchState]);

  const start = useCallback(() => {
    cancelRequest();
    stopSpeechRecognition(recognitionRef.current);
    transcriptRef.current = "";
    submittedRef.current = false;
    recognitionErrorRef.current = false;

    const recognition = createSpeechRecognition(
      optionsRef.current.lang ?? DEFAULT_LANGUAGE,
      {
        onTranscript(finalTranscript, visibleTranscript) {
          transcriptRef.current = visibleTranscript;
          patchState({ transcript: visibleTranscript });
          if (finalTranscript) void runSearch(finalTranscript);
        },
        onError(message) {
          recognitionErrorRef.current = true;
          patchState({ status: "error", decision: "error", error: new Error(message) });
        },
        onEnd() {
          recognitionRef.current = null;
          if (recognitionErrorRef.current) return;
          const transcript = transcriptRef.current.trim();
          if (transcript && !submittedRef.current) void runSearch(transcript);
          if (!transcript && !submittedRef.current) {
            patchState({ open: false, status: "idle", decision: "pending" });
          }
        },
      },
    );

    if (!recognition) {
      patchState({
        supported: false,
        open: true,
        status: "error",
        decision: "error",
        error: new Error("Speech recognition is not available in this browser."),
      });
      return;
    }

    recognitionRef.current = recognition;
    patchState({ ...initialState(), supported: true, open: true, status: "listening" });
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      patchState({ status: "error", decision: "error", error: new Error("Voice command could not start.") });
    }
  }, [cancelRequest, optionsRef, patchState, runSearch]);

  const stop = useCallback(() => {
    stopSpeechRecognition(recognitionRef.current);
    recognitionRef.current = null;
    setState((current) => ({
      ...current,
      status: current.status === "listening" ? "idle" : current.status,
    }));
  }, []);

  const execute = useCallback(async (target?: CommandSearchResult) => {
    const result = target ?? state.result;
    if (!result) return;
    patchState({ status: "executing", error: null, result });
    await executeAICommand(result, optionsRef.current);
    patchState({ status: "idle", open: false, decision: "executed", results: [] });
  }, [optionsRef, patchState, state.result]);

  useGlobalShortcut(options.shortcut === false ? false : "m", () => {
    optionsRef.current.onShortcut?.();
    start();
  });
  useEffect(() => () => {
    stopSpeechRecognition(recognitionRef.current);
    recognitionRef.current = null;
    cancelRequest();
  }, [cancelRequest]);

  return { ...state, start, stop, reset, execute };
}
