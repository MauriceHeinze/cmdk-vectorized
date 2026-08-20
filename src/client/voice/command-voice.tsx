import type { CommandVoiceProps } from "../types";
import { useCommandVoice } from "./use-command-voice";

export function CommandVoice({ children, labels, buttonProps, ...options }: CommandVoiceProps) {
  const voice = useCommandVoice(options);
  const isListening = voice.status === "listening";

  if (children) return <>{children(voice)}</>;

  const statusLabel = {
    listening: labels?.listening ?? "Listening",
    searching: labels?.searching ?? "Searching",
    results: labels?.results ?? "Choose a result",
    executing: labels?.executing ?? "Executing",
    error: voice.error ? labels?.error?.(voice.error) ?? voice.error.message : null,
    idle: null,
  }[voice.status];

  return (
    <div data-cmdk-voice="" data-cmdk-voice-open={voice.open ? "" : undefined}>
      <button
        {...buttonProps}
        type="button"
        onClick={isListening ? voice.stop : voice.start}
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

      <div data-cmdk-voice-status="" aria-live="polite">{statusLabel}</div>
      {voice.transcript ? <div data-cmdk-voice-transcript="">{voice.transcript}</div> : null}
      {voice.status === "results" ? (
        <ul data-cmdk-voice-results="">
          {voice.results.map((result) => (
            <li key={result.id}>
              <button type="button" onClick={() => void voice.execute(result)}>
                {result.title}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
