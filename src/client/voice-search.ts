import type { UseCommandVoiceOptions } from "./types";
import { createCommandSearchClient } from "./search-client";
import { resolveVoiceDecision } from "./voice-decision";

const DEFAULTS = {
  maxResults: 5,
  minConfidence: 0.6,
  autoExecute: "single" as const,
  peerGap: 0.15,
  stepGap: 0.05,
  voiceListLimit: 3,
};

export async function searchVoiceCommand(
  query: string,
  signal: AbortSignal,
  options: UseCommandVoiceOptions,
) {
  const results = await createCommandSearchClient(options).search(query, {
    limit: options.maxResults ?? DEFAULTS.maxResults,
    signal,
  });

  return resolveVoiceDecision({
    results,
    minConfidence: options.minConfidence ?? DEFAULTS.minConfidence,
    autoExecute: options.autoExecute ?? DEFAULTS.autoExecute,
    peerGap: options.peerGap ?? DEFAULTS.peerGap,
    stepGap: options.stepGap ?? DEFAULTS.stepGap,
    voiceListLimit: options.voiceListLimit ?? DEFAULTS.voiceListLimit,
  });
}
