import { useEffect, useState } from "react";
import { Command } from "cmdk";

import { TextPaletteBody, VoicePaletteBody } from "./palette-body";
import type { AICommandPaletteProps } from "../types";
import { useAICommandPalette } from "./use-ai-command-palette";

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

function modifierKey() {
  if (typeof navigator === "undefined") return "⌘";
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
    ? "⌘"
    : "Ctrl";
}

/**
 * Styled drop-in command palette (text + voice).
 * Ranking comes from `endpoint`; cmdk filtering is off (`shouldFilter={false}`).
 * Styles are scoped to `.cmdk-ai`.
 */
export function AICommandPalette({
  placeholder = "Search documentation…",
  voiceResultsHeading = "Top results:",
  className,
  classNames,
  style,
  listHeading = "Pages",
  labels,
  ...options
}: AICommandPaletteProps) {
  const palette = useAICommandPalette(options);
  const { close, open } = palette;
  const [selection, setSelection] = useState({ listKey: "", value: "" });

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [close, open]);

  if (!palette.open) return null;

  const textResults = palette.command.query.trim() === "" && palette.command.results.length === 0
    ? options.initialResults ?? []
    : palette.command.results;
  const activeResults = palette.mode === "voice" && palette.voice.status === "results"
    ? palette.voice.results
    : textResults;
  const listKey = activeResults.map((result) => result.id).join("\0");
  // cmdk keeps a stale value when the list is replaced; pin to the new first item.
  const selectedValue = selection.listKey === listKey
    ? selection.value
    : activeResults[0]?.id ?? "";

  const goToPage = labels?.goToPage ?? "Go to Page";
  const voiceSearch = labels?.voiceSearch ?? "Voice Search";
  const textSearch = labels?.textSearch ?? "Text Search";
  const showEnterHint = palette.mode === "text" || palette.voice.status === "results";

  return (
    <div
      className={classes("cmdk-ai", className, classNames?.root)}
      data-cmdk-ai-root=""
      data-mode={palette.mode}
      style={style}
    >
      <button
        type="button"
        className={classes(classNames?.backdrop)}
        data-cmdk-ai-backdrop=""
        aria-label="Close command palette"
        onClick={palette.close}
      />
      <Command
        className={classes(classNames?.dialog)}
        data-cmdk-ai-dialog=""
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        shouldFilter={false} // ranking is server-side; do not re-filter by title
        loop
        value={selectedValue}
        onValueChange={(value) => setSelection({ listKey, value })}
        label="Command palette"
      >
        {palette.mode === "text" ? (
          <TextPaletteBody
            command={palette.command}
            results={textResults}
            classNames={classNames}
            placeholder={placeholder}
            listHeading={listHeading}
            emptyLabel={labels?.empty ?? "No results"}
            searchingLabel={labels?.searching ?? "Searching…"}
            close={palette.close}
          />
        ) : (
          <VoicePaletteBody
            voice={palette.voice}
            classNames={classNames}
            heading={voiceResultsHeading}
            listeningLabel={labels?.listening ?? "Listening…"}
            searchingLabel={labels?.searching ?? "Searching…"}
            stopLabel={labels?.stopVoice ?? "Stop voice"}
            close={palette.close}
          />
        )}

        <div className={classes(classNames?.footer)} data-cmdk-ai-footer="">
          <span className={classes(classNames?.footerHint)} data-cmdk-ai-footer-hint="">
            {showEnterHint ? <><span aria-hidden="true">↵</span>{goToPage}</> : null}
          </span>
          <button
            type="button"
            data-cmdk-ai-mode-switch=""
            onClick={palette.mode === "text" ? palette.openVoice : palette.openText}
          >
            <kbd className={classes(classNames?.kbd)} data-cmdk-ai-kbd="">{modifierKey()}</kbd>
            <kbd className={classes(classNames?.kbd)} data-cmdk-ai-kbd="">
              {palette.mode === "text" ? "M" : "K"}
            </kbd>
            <span>{palette.mode === "text" ? voiceSearch : textSearch}</span>
          </button>
        </div>
      </Command>
    </div>
  );
}
