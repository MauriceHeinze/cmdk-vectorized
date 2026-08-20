import { useCallback, useEffect, useRef, useState } from "react";

import { executeAICommand } from "./execute-ai-command";
import { normalizeCommandSearchResponse } from "./guards";
import type {
  CommandSearchResult,
  CommandVoiceProps,
  CommandVoiceStatus,
  UseCommandVoiceOptions,
  UseCommandVoiceResult,
  VoiceDecision,
} from "./types";
import { resolveVoiceDecision } from "./voice-decision";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  readonly [index: number]: SpeechRecognitionAlternativeLike | undefined;
};

type SpeechRecognitionResultListLike = {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResultLike | undefined;
};

type SpeechRecognitionEventLike = Event & {
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionErrorEventLike = Event & {
  error?: string;
};

type SpeechRecognitionInstanceLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructorLike = {
  new (): SpeechRecognitionInstanceLike;
};

type WindowWithSpeechRecognition = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  };

const DEFAULT_LANGUAGE = "en-US";
const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_MIN_CONFIDENCE = 0.6;
const DEFAULT_VOICE_LIST_LIMIT = 3;
const DEFAULT_AUTO_EXECUTE = "single" as const;
/** Max score distance below top to stay in peer band. */
const DEFAULT_PEER_GAP = 0.15;
/** Stop peer band at first neighbor cliff (billing: 0.03 keep, 0.058 drop plans). */
const DEFAULT_STEP_GAP = 0.05;

function createUnsupportedError() {
  return new Error("Speech recognition is not available in this browser.");
}

function createMissingFetcherError() {
  return new Error("A fetch implementation is required for useCommandVoice.");
}

function getRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as WindowWithSpeechRecognition;
  return (speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null) as SpeechRecognitionConstructorLike | null;
}

function isSpeechSupported() {
  return getRecognitionConstructor() !== null;
}

function getSpeechErrorMessage(event: SpeechRecognitionErrorEventLike) {
  switch (event.error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access is blocked.";
    case "audio-capture":
      return "No microphone was found.";
    case "network":
      return "Speech recognition is unavailable.";
    case "language-not-supported":
      return "Speech recognition is not available for the current language.";
    case "no-speech":
      return "No speech was detected.";
    default:
      return "Voice command failed.";
  }
}

function getTranscriptFromEvent(event: SpeechRecognitionEventLike) {
  let finalTranscript = "";
  let interimTranscript = "";

  for (let index = 0; index < event.results.length; index += 1) {
    const result = event.results[index];
    const transcript = result?.[0]?.transcript?.trim() ?? "";

    if (!transcript) {
      continue;
    }

    if (result?.isFinal) {
      finalTranscript = finalTranscript ? `${finalTranscript} ${transcript}` : transcript;
    } else {
      interimTranscript = interimTranscript ? `${interimTranscript} ${transcript}` : transcript;
    }
  }

  return {
    finalTranscript,
    visibleTranscript: [finalTranscript, interimTranscript].filter(Boolean).join(" ").trim(),
  };
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error("Voice command failed.");
}

function buildSearchUrl(endpoint: string, query: string, maxResults: number) {
  const url = new URL(endpoint, "http://localhost");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(maxResults));
  return endpoint.startsWith("http://") || endpoint.startsWith("https://")
    ? url.toString()
    : `${url.pathname}${url.search}`;
}

function isDefaultVoiceShortcut(event: KeyboardEvent) {
  return (
    !event.defaultPrevented &&
    event.key.toLowerCase() === "m" &&
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey
  );
}

export function useCommandVoice(options: UseCommandVoiceOptions): UseCommandVoiceResult {
  const {
    endpoint,
    headers,
    fetcher,
    transformResponse,
    minConfidence = DEFAULT_MIN_CONFIDENCE,
    lang = DEFAULT_LANGUAGE,
    maxResults = DEFAULT_MAX_RESULTS,
    autoExecute = DEFAULT_AUTO_EXECUTE,
    ambiguityGap,
    peerGap = DEFAULT_PEER_GAP,
    stepGap = DEFAULT_STEP_GAP,
    voiceListLimit = DEFAULT_VOICE_LIST_LIMIT,
    shortcut = "mod+m",
    onShortcut,
  } = options;

  const [supported, setSupported] = useState(() => isSpeechSupported());
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<CommandVoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<CommandSearchResult | null>(null);
  const [results, setResults] = useState<CommandSearchResult[]>([]);
  const [decision, setDecision] = useState<VoiceDecision>("pending");

  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);
  const transcriptRef = useRef("");
  const hasSubmittedRef = useRef(false);
  const hasRecognitionErrorRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const reset = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // The browser may already have stopped recognition.
    }
    recognitionRef.current = null;
    transcriptRef.current = "";
    hasSubmittedRef.current = false;
    hasRecognitionErrorRef.current = false;
    setOpen(false);
    setStatus("idle");
    setTranscript("");
    setError(null);
    setResult(null);
    setResults([]);
    setDecision("pending");
  }, []);

  const executeResult = useCallback(async (target?: CommandSearchResult) => {
    const next = target ?? result;
    if (!next) {
      return;
    }

    setStatus("executing");
    setError(null);
    setResult(next);

    try {
      await executeAICommand(next, optionsRef.current);
      setDecision("executed");
      setOpen(false);
      setStatus("idle");
      setResults([]);
    } catch (caughtError) {
      setStatus("error");
      setDecision("error");
      setError(toError(caughtError));
    }
  }, [result]);

  const runSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || hasSubmittedRef.current) {
        return;
      }

      hasSubmittedRef.current = true;
      setStatus("searching");
      setError(null);
      setDecision("pending");
      setResults([]);

      const activeFetcher = fetcher ?? globalThis.fetch;

      if (!activeFetcher) {
        setStatus("error");
        setDecision("error");
        setError(createMissingFetcherError());
        return;
      }

      try {
        const response = await activeFetcher(buildSearchUrl(endpoint, trimmed, maxResults), {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          throw new Error(`Command voice search request failed with status ${response.status}.`);
        }

        const data = await response.json();
        const allResults = normalizeCommandSearchResponse(data, transformResponse);
        const resolved = resolveVoiceDecision({
          results: allResults,
          minConfidence,
          autoExecute,
          ambiguityGap,
          peerGap,
          stepGap,
          voiceListLimit,
        });

        setResults(resolved.results);
        setResult(resolved.top);
        setDecision(resolved.decision);

        if (resolved.decision === "empty") {
          throw new Error(`No command match found for "${trimmed}".`);
        }

        if (resolved.shouldExecute && resolved.top) {
          setStatus("executing");
          // Navigation-first: top is already a navigation command for the page href.
          await executeAICommand(resolved.top, optionsRef.current);
          setDecision("executed");
          setOpen(false);
          setStatus("idle");
          setResults([]);
          return;
        }

        // Ambiguous (or never-auto): keep open for user selection.
        setStatus("results");
      } catch (caughtError) {
        setStatus("error");
        setDecision("error");
        setError(toError(caughtError));
      }
    },
    [
      ambiguityGap,
      autoExecute,
      endpoint,
      fetcher,
      headers,
      maxResults,
      minConfidence,
      peerGap,
      stepGap,
      transformResponse,
      voiceListLimit,
    ],
  );

  const start = useCallback(() => {
    const Recognition = getRecognitionConstructor();
    setSupported(Boolean(Recognition));

    if (!Recognition) {
      setOpen(true);
      setStatus("error");
      setDecision("error");
      setError(createUnsupportedError());
      return;
    }

    try {
      recognitionRef.current?.stop();
    } catch {
      // The browser may already have stopped recognition.
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognitionRef.current = recognition;
    transcriptRef.current = "";
    hasSubmittedRef.current = false;
    hasRecognitionErrorRef.current = false;
    setOpen(true);
    setStatus("listening");
    setTranscript("");
    setError(null);
    setResult(null);
    setResults([]);
    setDecision("pending");

    recognition.onresult = (event) => {
      const { finalTranscript, visibleTranscript } = getTranscriptFromEvent(event);

      if (visibleTranscript) {
        transcriptRef.current = visibleTranscript;
        setTranscript(visibleTranscript);
      }

      if (finalTranscript) {
        void runSearch(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      hasRecognitionErrorRef.current = true;
      setStatus("error");
      setDecision("error");
      setError(new Error(getSpeechErrorMessage(event)));
    };

    recognition.onend = () => {
      recognitionRef.current = null;

      if (hasRecognitionErrorRef.current) {
        return;
      }

      const fallbackTranscript = transcriptRef.current.trim();

      if (!fallbackTranscript || hasSubmittedRef.current) {
        if (!hasSubmittedRef.current) {
          setOpen(false);
          setStatus("idle");
          setDecision("pending");
        }
        return;
      }

      void runSearch(fallbackTranscript);
    };

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setStatus("error");
      setDecision("error");
      setError(new Error("Voice command could not start."));
    }
  }, [lang, runSearch]);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // The browser may already have stopped recognition.
    }
    recognitionRef.current = null;
    setStatus((current) => {
      if (current === "listening") {
        return "idle";
      }
      return current;
    });
  }, []);

  useEffect(() => {
    setSupported(isSpeechSupported());
  }, []);

  useEffect(() => {
    if (shortcut === false) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!isDefaultVoiceShortcut(event)) {
        return;
      }

      event.preventDefault();
      onShortcut?.();
      start();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onShortcut, shortcut, start]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // The browser may already have stopped recognition.
      }
    };
  }, []);

  return {
    supported,
    open,
    status,
    transcript,
    error,
    result,
    results,
    decision,
    start,
    stop,
    reset,
    execute: executeResult,
  };
}

export function CommandVoice({
  children,
  labels,
  buttonProps,
  ...options
}: CommandVoiceProps) {
  const voice = useCommandVoice(options);
  const isListening = voice.status === "listening";
  const toggle = isListening ? voice.stop : voice.start;

  if (children) {
    return <>{children(voice)}</>;
  }

  const statusLabel =
    voice.status === "listening"
      ? labels?.listening ?? "Listening"
      : voice.status === "searching"
        ? labels?.searching ?? "Searching"
        : voice.status === "results"
          ? labels?.results ?? "Choose a result"
          : voice.status === "executing"
            ? labels?.executing ?? "Executing"
            : voice.status === "error" && voice.error
              ? labels?.error?.(voice.error) ?? voice.error.message
              : null;

  return (
    <div data-cmdk-voice="" data-cmdk-voice-open={voice.open ? "" : undefined}>
      <button
        {...buttonProps}
        type="button"
        onClick={toggle}
        disabled={buttonProps?.disabled ?? !voice.supported}
        aria-pressed={isListening}
        data-cmdk-voice-button=""
      >
        {!voice.supported
          ? labels?.unsupported ?? "Voice unavailable"
          : isListening
            ? labels?.stop ?? "Stop voice command"
            : labels?.start ?? "Start voice command"}
      </button>

      <div data-cmdk-voice-status="" aria-live="polite">
        {statusLabel}
      </div>

      {voice.transcript ? (
        <div data-cmdk-voice-transcript="">{voice.transcript}</div>
      ) : null}

      {voice.status === "results" && voice.results.length > 0 ? (
        <ul data-cmdk-voice-results="">
          {voice.results.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => void voice.execute(item)}>
                {item.title}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
