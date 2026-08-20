/*
 * Thin adapter over `SpeechRecognition` / `webkitSpeechRecognition`.
 * `continuous` is off: one utterance per start, then `onend`.
 */

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  readonly [index: number]: { transcript: string } | undefined;
};

type SpeechRecognitionEventLike = Event & {
  results: {
    readonly length: number;
    readonly [index: number]: SpeechRecognitionResultLike | undefined;
  };
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type RecognitionCallbacks = {
  onTranscript: (finalTranscript: string, visibleTranscript: string) => void;
  onError: (message: string) => void;
  onEnd: () => void;
};

function recognitionConstructor() {
  if (typeof window === "undefined") return null;
  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function errorMessage(error?: string) {
  const messages: Record<string, string> = {
    "not-allowed": "Microphone access is blocked.",
    "service-not-allowed": "Microphone access is blocked.",
    "audio-capture": "No microphone was found.",
    network: "Speech recognition is unavailable.",
    "language-not-supported": "Speech recognition is not available for the current language.",
    "no-speech": "No speech was detected.",
  };
  return messages[error ?? ""] ?? "Voice command failed.";
}

function readTranscript(event: SpeechRecognitionEventLike) {
  const finalParts: string[] = [];
  const interimParts: string[] = [];

  for (let index = 0; index < event.results.length; index += 1) {
    const result = event.results[index];
    if (!result) continue;
    const transcript = result[0]?.transcript.trim();
    if (!transcript) continue;
    (result.isFinal ? finalParts : interimParts).push(transcript);
  }

  return {
    finalTranscript: finalParts.join(" "),
    visibleTranscript: [...finalParts, ...interimParts].join(" "),
  };
}

export function speechRecognitionSupported() {
  return recognitionConstructor() !== null;
}

export function createSpeechRecognition(
  lang: string,
  callbacks: RecognitionCallbacks,
): SpeechRecognitionInstance | null {
  const Recognition = recognitionConstructor();
  if (!Recognition) return null;

  const recognition = new Recognition();
  recognition.continuous = false; // one utterance per start; `onend` closes the session
  recognition.interimResults = true;
  recognition.lang = lang;
  recognition.onresult = (event) => {
    const transcript = readTranscript(event);
    callbacks.onTranscript(transcript.finalTranscript, transcript.visibleTranscript);
  };
  recognition.onerror = (event) => callbacks.onError(errorMessage(event.error));
  recognition.onend = callbacks.onEnd;
  return recognition;
}

export function stopSpeechRecognition(recognition: SpeechRecognitionInstance | null) {
  try {
    recognition?.stop();
  } catch {
    // Browsers can end recognition before cleanup runs.
  }
}

export type { SpeechRecognitionInstance };
