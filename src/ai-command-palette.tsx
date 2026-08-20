import { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";

import type { AICommandPaletteProps, CommandSearchResult } from "./types";
import { useAICommandPalette } from "./use-ai-command-palette";
import { VoiceWaveform } from "./voice-waveform";

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

function isMacPlatform() {
  if (typeof navigator === "undefined") {
    return true;
  }
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

function resultSubtitle(result: CommandSearchResult) {
  if (result.description) {
    return result.description;
  }
  if (result.type === "navigation") {
    return result.href;
  }
  return result.actionKey;
}

/**
 * Styled drop-in command palette with text + voice modes.
 * Built on headless hooks; import `cmdk-vectorized/styles.css` for default look.
 * All styles are scoped under `.cmdk-ai` and never affect host UI.
 */
export function AICommandPalette({
  open: openProp,
  onOpenChange,
  placeholder = "Search documentation…",
  voiceResultsHeading = "Top results:",
  className,
  classNames,
  style,
  listHeading = "Pages",
  labels,
  ...paletteOptions
}: AICommandPaletteProps) {
  const palette = useAICommandPalette({
    ...paletteOptions,
    open: openProp,
    onOpenChange,
  });

  const { open, mode, command, voice, close, openText, openVoice } = palette;

  const modKey = useMemo(() => (isMacPlatform() ? "⌘" : "Ctrl"), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  const listResults = useMemo(() => {
    if (command.query.trim() === "") {
      return command.results.length > 0
        ? command.results
        : (paletteOptions.initialResults ?? []);
    }
    return command.results;
  }, [command.query, command.results, paletteOptions.initialResults]);

  const activeList =
    mode === "voice" && voice.status === "results" ? voice.results : listResults;

  // Stable key so we only reset selection when the result set identity changes.
  const activeListKey = useMemo(
    () => activeList.map((result) => result.id).join("\0"),
    [activeList],
  );

  const [selectedValue, setSelectedValue] = useState("");

  useEffect(() => {
    setSelectedValue(activeList[0]?.id ?? "");
    // Only reset when the set of result ids changes — not on new array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeListKey
  }, [activeListKey]);

  if (!open) {
    return null;
  }

  const goToPage = labels?.goToPage ?? "Go to Page";
  const voiceSearchLabel = labels?.voiceSearch ?? "Voice Search";
  const textSearchLabel = labels?.textSearch ?? "Text Search";
  const emptyLabel = labels?.empty ?? "No results";
  const searchingLabel = labels?.searching ?? "Searching…";

  const showVoiceResults = mode === "voice" && voice.status === "results" && voice.results.length > 0;
  const showVoiceCenter =
    mode === "voice" &&
    (voice.status === "listening" ||
      voice.status === "searching" ||
      voice.status === "error" ||
      showVoiceResults);

  return (
    <div
      className={cn("cmdk-ai", className, classNames?.root)}
      data-cmdk-ai-root=""
      data-mode={mode}
      style={style}
    >
      <button
        type="button"
        className={cn(classNames?.backdrop)}
        data-cmdk-ai-backdrop=""
        aria-label="Close command palette"
        onClick={close}
      />

      <Command
        className={cn(classNames?.dialog)}
        data-cmdk-ai-dialog=""
        shouldFilter={false}
        loop
        value={selectedValue}
        onValueChange={setSelectedValue}
        label="Command palette"
      >
        {mode === "text" ? (
          <>
            <div className={cn(classNames?.inputWrap)} data-cmdk-ai-input-wrap="">
              <span data-cmdk-ai-search-icon="" aria-hidden="true">
                ⌕
              </span>
              <Command.Input
                className={cn(classNames?.input)}
                data-cmdk-ai-input=""
                value={command.query}
                onValueChange={command.setQuery}
                placeholder={placeholder}
                autoFocus
              />
              {command.loading ? (
                <span data-cmdk-ai-spinner="" role="status" aria-label={searchingLabel} />
              ) : null}
            </div>

            <Command.List className={cn(classNames?.list)} data-cmdk-ai-list="">
              {listHeading && command.query.trim() === "" ? (
                <div data-cmdk-ai-list-heading="">{listHeading}</div>
              ) : null}

              {command.error ? (
                <div className={cn(classNames?.error)} data-cmdk-ai-error="" role="alert">
                  {command.error.message}
                </div>
              ) : null}

              {!command.loading && listResults.length === 0 ? (
                <Command.Empty className={cn(classNames?.empty)} data-cmdk-ai-empty="">
                  {emptyLabel}
                </Command.Empty>
              ) : null}

              {listResults.map((result) => (
                <Command.Item
                  key={result.id}
                  value={result.id}
                  className={cn(classNames?.item)}
                  data-cmdk-ai-item=""
                  onSelect={() => {
                    void command.execute(result).then(() => {
                      close();
                    });
                  }}
                >
                  <span data-cmdk-ai-item-arrow="" aria-hidden="true">
                    →
                  </span>
                  <span className={cn(classNames?.itemTitle)} data-cmdk-ai-item-title="">
                    {result.title}
                  </span>
                  {resultSubtitle(result) ? (
                    <span
                      className={cn(classNames?.itemDescription)}
                      data-cmdk-ai-item-description=""
                    >
                      {resultSubtitle(result)}
                    </span>
                  ) : null}
                </Command.Item>
              ))}
            </Command.List>
          </>
        ) : (
          <div className={cn(classNames?.voiceBody)} data-cmdk-ai-voice="">
            {showVoiceResults ? (
              <Command.List className={cn(classNames?.list)} data-cmdk-ai-list="">
                <div
                  className={cn(classNames?.voiceHeading)}
                  data-cmdk-ai-list-heading=""
                >
                  {voiceResultsHeading}
                </div>
                {voice.results.map((result) => (
                  <Command.Item
                    key={result.id}
                    value={result.id}
                    className={cn(classNames?.item)}
                    data-cmdk-ai-item=""
                    onSelect={() => {
                      void voice.execute(result).then(() => {
                        close();
                      });
                    }}
                  >
                    <span data-cmdk-ai-item-arrow="" aria-hidden="true">
                      →
                    </span>
                    <span className={cn(classNames?.itemTitle)} data-cmdk-ai-item-title="">
                      {result.title}
                    </span>
                  </Command.Item>
                ))}
              </Command.List>
            ) : null}

            {showVoiceCenter ? (
              <div data-cmdk-ai-voice-center="">
                <VoiceWaveform
                  active={voice.status === "listening" || voice.status === "searching"}
                />
                <div
                  className={cn(classNames?.voiceTranscript)}
                  data-cmdk-ai-voice-transcript=""
                  aria-live="polite"
                >
                  {voice.status === "error" && voice.error
                    ? voice.error.message
                    : voice.status === "searching"
                      ? searchingLabel
                      : voice.transcript || (labels?.listening ?? "Listening…")}
                </div>
                <button
                  type="button"
                  className={cn(classNames?.voiceStop)}
                  data-cmdk-ai-voice-stop=""
                  aria-label={labels?.stopVoice ?? "Stop voice"}
                  onClick={() => {
                    if (voice.status === "listening") {
                      voice.stop();
                      return;
                    }
                    if (voice.status === "results") {
                      voice.start();
                      return;
                    }
                    close();
                  }}
                >
                  <span data-cmdk-ai-voice-stop-icon="" />
                </button>
              </div>
            ) : null}
          </div>
        )}

        <div className={cn(classNames?.footer)} data-cmdk-ai-footer="">
          {mode === "text" || showVoiceResults ? (
            <span className={cn(classNames?.footerHint)} data-cmdk-ai-footer-hint="">
              <span data-cmdk-ai-footer-icon="" aria-hidden="true">
                ↵
              </span>
              {goToPage}
            </span>
          ) : (
            <span />
          )}

          {mode === "text" ? (
            <button type="button" data-cmdk-ai-mode-switch="" onClick={openVoice}>
              <kbd className={cn(classNames?.kbd)} data-cmdk-ai-kbd="">
                {modKey}
              </kbd>
              <kbd className={cn(classNames?.kbd)} data-cmdk-ai-kbd="">
                M
              </kbd>
              <span>{voiceSearchLabel}</span>
            </button>
          ) : (
            <button type="button" data-cmdk-ai-mode-switch="" onClick={openText}>
              <kbd className={cn(classNames?.kbd)} data-cmdk-ai-kbd="">
                {modKey}
              </kbd>
              <kbd className={cn(classNames?.kbd)} data-cmdk-ai-kbd="">
                K
              </kbd>
              <span>{textSearchLabel}</span>
            </button>
          )}
        </div>
      </Command>
    </div>
  );
}
