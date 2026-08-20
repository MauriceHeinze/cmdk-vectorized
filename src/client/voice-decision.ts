import type { CommandSearchResult } from "../core/command-types";
import type { VoiceAutoExecute, VoiceDecision } from "./types";
import {
  buildPeerBand,
  destinationsIn,
  listDestinations,
  pickResultForDestination,
  resultDestination,
  sortByScore,
} from "./voice-peer-band";

export type ResolveVoiceDecisionInput = {
  results: CommandSearchResult[];
  minConfidence: number;
  autoExecute: VoiceAutoExecute;
  peerGap: number;
  stepGap: number;
  voiceListLimit: number;
};

export type ResolvedVoiceDecision = {
  decision: VoiceDecision;
  results: CommandSearchResult[];
  top: CommandSearchResult | null;
  destinationHref: string | null;
  shouldExecute: boolean;
};

function autoExecuteMode(
  value: VoiceAutoExecute,
): "single" | "always" | "never" {
  if (value === true || value === "always") return "always";
  if (value === false || value === "never") return "never";
  return "single";
}

function emptyDecision(): ResolvedVoiceDecision {
  return {
    decision: "empty",
    results: [],
    top: null,
    destinationHref: null,
    shouldExecute: false,
  };
}

function executeDecision(
  band: CommandSearchResult[],
  destination: string,
): ResolvedVoiceDecision {
  const top = pickResultForDestination(band, destination);
  return {
    decision: "executed",
    results: [top],
    top,
    destinationHref: destination,
    shouldExecute: true,
  };
}

function listDecision(
  band: CommandSearchResult[],
  limit: number,
): ResolvedVoiceDecision {
  const results = listDestinations(band, limit);
  return {
    decision: "ambiguous",
    results,
    top: results[0] ?? null,
    destinationHref: results[0] ? resultDestination(results[0]) : null,
    shouldExecute: false,
  };
}

export function resolveVoiceDecision(
  input: ResolveVoiceDecisionInput,
): ResolvedVoiceDecision {
  const confident = sortByScore(
    input.results.filter(
      (result) => result.score === undefined || result.score >= input.minConfidence,
    ),
  );
  if (confident.length === 0) return emptyDecision();

  const band = buildPeerBand(confident, input.peerGap, input.stepGap);
  const destinations = destinationsIn(band);
  const mode = autoExecuteMode(input.autoExecute);

  if (mode === "never") return listDecision(band, input.voiceListLimit);

  if (mode === "always") {
    const destination = destinations[0] ?? resultDestination(band[0]!);
    return destination
      ? executeDecision(band, destination)
      : listDecision(band, input.voiceListLimit);
  }

  if (destinations.length === 1) {
    return executeDecision(band, destinations[0]!);
  }

  if (band.length === 1) {
    const destination = resultDestination(band[0]!);
    if (destination) return executeDecision(band, destination);
  }

  return listDecision(band, input.voiceListLimit);
}
