import { Command } from "cmdk";

import type { CommandSearchResult } from "../core/command-types";
import type {
  AICommandPaletteClassNames,
  UseAICommandResult,
  UseCommandVoiceResult,
} from "./types";
import { VoiceWaveform } from "./voice-waveform";

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

function subtitle(result: CommandSearchResult) {
  if (result.description) return result.description;
  return result.type === "navigation" ? result.href : result.actionKey;
}

type TextBodyProps = {
  command: UseAICommandResult;
  results: CommandSearchResult[];
  classNames?: AICommandPaletteClassNames;
  placeholder: string;
  listHeading?: string;
  emptyLabel: string;
  searchingLabel: string;
  close: () => void;
};

export function TextPaletteBody(props: TextBodyProps) {
  return (
    <>
      <div className={classes(props.classNames?.inputWrap)} data-cmdk-ai-input-wrap="">
        <span data-cmdk-ai-search-icon="" aria-hidden="true">⌕</span>
        <Command.Input
          className={classes(props.classNames?.input)}
          data-cmdk-ai-input=""
          value={props.command.query}
          onValueChange={props.command.setQuery}
          placeholder={props.placeholder}
          autoFocus
        />
        {props.command.loading ? (
          <span data-cmdk-ai-spinner="" role="status" aria-label={props.searchingLabel} />
        ) : null}
      </div>

      <Command.List className={classes(props.classNames?.list)} data-cmdk-ai-list="">
        {props.listHeading && props.command.query.trim() === "" ? (
          <div data-cmdk-ai-list-heading="">{props.listHeading}</div>
        ) : null}
        {props.command.error ? (
          <div className={classes(props.classNames?.error)} data-cmdk-ai-error="" role="alert">
            {props.command.error.message}
          </div>
        ) : null}
        {!props.command.loading && props.results.length === 0 ? (
          <Command.Empty className={classes(props.classNames?.empty)} data-cmdk-ai-empty="">
            {props.emptyLabel}
          </Command.Empty>
        ) : null}
        {props.results.map((result) => (
          <Command.Item
            key={result.id}
            value={result.id}
            className={classes(props.classNames?.item)}
            data-cmdk-ai-item=""
            onSelect={() => void props.command.execute(result).then(props.close)}
          >
            <span data-cmdk-ai-item-arrow="" aria-hidden="true">→</span>
            <span className={classes(props.classNames?.itemTitle)} data-cmdk-ai-item-title="">
              {result.title}
            </span>
            <span className={classes(props.classNames?.itemDescription)} data-cmdk-ai-item-description="">
              {subtitle(result)}
            </span>
          </Command.Item>
        ))}
      </Command.List>
    </>
  );
}

type VoiceBodyProps = {
  voice: UseCommandVoiceResult;
  classNames?: AICommandPaletteClassNames;
  heading: string;
  listeningLabel: string;
  searchingLabel: string;
  stopLabel: string;
  close: () => void;
};

export function VoicePaletteBody(props: VoiceBodyProps) {
  const showResults = props.voice.status === "results" && props.voice.results.length > 0;
  const message = props.voice.status === "error" && props.voice.error
    ? props.voice.error.message
    : props.voice.status === "searching"
      ? props.searchingLabel
      : props.voice.transcript || props.listeningLabel;

  function stopOrRetry() {
    if (props.voice.status === "listening") props.voice.stop();
    else if (props.voice.status === "results") props.voice.start();
    else props.close();
  }

  return (
    <div className={classes(props.classNames?.voiceBody)} data-cmdk-ai-voice="">
      {showResults ? (
        <Command.List className={classes(props.classNames?.list)} data-cmdk-ai-list="">
          <div className={classes(props.classNames?.voiceHeading)} data-cmdk-ai-list-heading="">
            {props.heading}
          </div>
          {props.voice.results.map((result) => (
            <Command.Item
              key={result.id}
              value={result.id}
              className={classes(props.classNames?.item)}
              data-cmdk-ai-item=""
              onSelect={() => void props.voice.execute(result).then(props.close)}
            >
              <span data-cmdk-ai-item-arrow="" aria-hidden="true">→</span>
              <span className={classes(props.classNames?.itemTitle)} data-cmdk-ai-item-title="">
                {result.title}
              </span>
            </Command.Item>
          ))}
        </Command.List>
      ) : null}
      <div data-cmdk-ai-voice-center="">
        <VoiceWaveform active={props.voice.status === "listening" || props.voice.status === "searching"} />
        <div className={classes(props.classNames?.voiceTranscript)} data-cmdk-ai-voice-transcript="" aria-live="polite">
          {message}
        </div>
        <button
          type="button"
          className={classes(props.classNames?.voiceStop)}
          data-cmdk-ai-voice-stop=""
          aria-label={props.stopLabel}
          onClick={stopOrRetry}
        >
          <span data-cmdk-ai-voice-stop-icon="" />
        </button>
      </div>
    </div>
  );
}
