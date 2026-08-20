import type { HTMLAttributes } from "react";

type VoiceWaveformProps = HTMLAttributes<HTMLDivElement> & {
  /** Animate bars while listening / active. */
  active?: boolean;
};

/** Presentational sound-bar icon. Styles come from `.cmdk-ai` scoped CSS when used in the drop-in. */
export function VoiceWaveform({ active = false, className, ...rest }: VoiceWaveformProps) {
  return (
    <div
      className={className}
      data-cmdk-ai-waveform=""
      data-active={active ? "true" : "false"}
      aria-hidden="true"
      {...rest}
    >
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
