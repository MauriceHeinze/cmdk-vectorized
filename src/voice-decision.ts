import type { CommandSearchResult, VoiceAutoExecute, VoiceDecision } from "./types";

export type ResolveVoiceDecisionInput = {
  results: CommandSearchResult[];
  minConfidence: number;
  autoExecute: VoiceAutoExecute;
  /** @deprecated Prefer peerGap/stepGap; still used as optional score-gap shortcut. */
  ambiguityGap?: number;
  /** Max distance below top score to remain a peer. Default applied by caller. */
  peerGap: number;
  /** Stop peer band at first neighbor cliff larger than this. */
  stepGap: number;
  voiceListLimit: number;
};

export type ResolvedVoiceDecision = {
  decision: VoiceDecision;
  /** Candidates after confidence + peer band (capped for display when ambiguous). */
  results: CommandSearchResult[];
  /** Preferred result to execute (navigation row for the destination when possible). */
  top: CommandSearchResult | null;
  /** Page href to navigate to when auto-routing. */
  destinationHref: string | null;
  shouldExecute: boolean;
};

function normalizeAutoExecute(autoExecute: VoiceAutoExecute): "single" | "always" | "never" {
  if (autoExecute === true || autoExecute === "always") {
    return "always";
  }
  if (autoExecute === false || autoExecute === "never") {
    return "never";
  }
  return "single";
}

function passesConfidence(result: CommandSearchResult, minConfidence: number) {
  return result.score === undefined || result.score >= minConfidence;
}

/** Page destination for clustering. Actions should carry host-page href. */
export function resultDestination(result: CommandSearchResult): string | null {
  if (result.type === "navigation") {
    return result.href;
  }
  return result.href ?? null;
}

function sortByScoreDesc(results: CommandSearchResult[]) {
  return [...results].sort((a, b) => {
    const as = a.score ?? Number.NEGATIVE_INFINITY;
    const bs = b.score ?? Number.NEGATIVE_INFINITY;
    return bs - as;
  });
}

/**
 * Contiguous peer band: start at top, extend while within peerGap of top
 * and neighbor step does not exceed stepGap.
 */
export function buildPeerBand(
  results: CommandSearchResult[],
  peerGap: number,
  stepGap: number,
): CommandSearchResult[] {
  if (results.length === 0) {
    return [];
  }

  const sorted = sortByScoreDesc(results);
  const top = sorted[0]!;
  const topScore = top.score;
  const band: CommandSearchResult[] = [top];

  // No scores → only top is a peer (avoid treating everything as equal).
  if (topScore === undefined) {
    return band;
  }

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index]!;
    const previous = sorted[index - 1]!;
    const currentScore = current.score;
    const previousScore = previous.score;

    if (currentScore === undefined || previousScore === undefined) {
      break;
    }

    if (topScore - currentScore > peerGap) {
      break;
    }

    if (previousScore - currentScore > stepGap) {
      break;
    }

    band.push(current);
  }

  return band;
}

function uniqueDestinations(band: CommandSearchResult[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const result of band) {
    const dest = resultDestination(result);
    if (!dest || seen.has(dest)) {
      continue;
    }
    seen.add(dest);
    ordered.push(dest);
  }

  return ordered;
}

/** Prefer a navigation result for the destination; else first band hit with that href. */
export function pickResultForDestination(
  band: CommandSearchResult[],
  destinationHref: string,
): CommandSearchResult {
  const navigation = band.find(
    (result) => result.type === "navigation" && result.href === destinationHref,
  );
  if (navigation) {
    return navigation;
  }

  const withHref = band.find((result) => resultDestination(result) === destinationHref);
  if (withHref) {
    if (withHref.type === "navigation") {
      return withHref;
    }
    // Navigation-first: synthesize a nav command so we don't fire leaf actions.
    return {
      id: `voice-nav:${destinationHref}`,
      type: "navigation",
      title: withHref.title,
      description: withHref.description,
      href: destinationHref,
      score: withHref.score,
    };
  }

  return {
    id: `voice-nav:${destinationHref}`,
    type: "navigation",
    title: destinationHref,
    href: destinationHref,
  };
}

function dedupeBandByDestination(band: CommandSearchResult[]): CommandSearchResult[] {
  const seen = new Set<string>();
  const out: CommandSearchResult[] = [];

  for (const result of band) {
    const dest = resultDestination(result) ?? `id:${result.id}`;
    if (seen.has(dest)) {
      continue;
    }
    seen.add(dest);
    // Prefer showing navigation title for a destination when listing.
    if (result.type === "action" && result.href) {
      const nav = band.find((item) => item.type === "navigation" && item.href === result.href);
      out.push(nav ?? pickResultForDestination(band, result.href));
    } else {
      out.push(result);
    }
  }

  return out;
}

/**
 * Decide whether voice should auto-navigate to a page or show a multi-result list.
 *
 * - Peer band: top-relative `peerGap` + neighbor `stepGap` cliff
 * - If all peers share one page href → navigate there (navigation-first)
 * - If peers disagree on href → list (deduped by href, capped)
 */
export function resolveVoiceDecision(input: ResolveVoiceDecisionInput): ResolvedVoiceDecision {
  const mode = normalizeAutoExecute(input.autoExecute);
  const confident = sortByScoreDesc(
    input.results.filter((result) => passesConfidence(result, input.minConfidence)),
  );

  if (confident.length === 0) {
    return {
      decision: "empty",
      results: [],
      top: null,
      destinationHref: null,
      shouldExecute: false,
    };
  }

  const band = buildPeerBand(confident, input.peerGap, input.stepGap);
  const destinations = uniqueDestinations(band);
  const listCap = Math.max(1, input.voiceListLimit);

  // Deprecated score-only gap: if top two are far apart, treat as single winner.
  if (
    mode === "single" &&
    input.ambiguityGap !== undefined &&
    confident.length >= 2 &&
    typeof confident[0]?.score === "number" &&
    typeof confident[1]?.score === "number" &&
    confident[0].score - confident[1].score >= input.ambiguityGap
  ) {
    const topOnly = [confident[0]!];
    const dest = resultDestination(confident[0]!);
    if (dest) {
      const top = pickResultForDestination(topOnly, dest);
      return {
        decision: "executed",
        results: [top],
        top,
        destinationHref: dest,
        shouldExecute: true,
      };
    }
  }

  if (mode === "never") {
    const listed = dedupeBandByDestination(band).slice(0, listCap);
    return {
      decision: "ambiguous",
      results: listed,
      top: listed[0] ?? null,
      destinationHref: resultDestination(listed[0]!) ?? null,
      shouldExecute: false,
    };
  }

  if (mode === "always") {
    const dest = destinations[0] ?? resultDestination(band[0]!);
    if (!dest) {
      return {
        decision: "ambiguous",
        results: dedupeBandByDestination(band).slice(0, listCap),
        top: band[0] ?? null,
        destinationHref: null,
        shouldExecute: false,
      };
    }
    const top = pickResultForDestination(band, dest);
    return {
      decision: "executed",
      results: [top],
      top,
      destinationHref: dest,
      shouldExecute: true,
    };
  }

  // single (smart): unanimous page in peer band → go there
  if (destinations.length === 1) {
    const dest = destinations[0]!;
    const top = pickResultForDestination(band, dest);
    return {
      decision: "executed",
      results: [top],
      top,
      destinationHref: dest,
      shouldExecute: true,
    };
  }

  // Band size 1 but no href on top action → cannot cluster; try execute top if nav
  if (band.length === 1) {
    const only = band[0]!;
    const dest = resultDestination(only);
    if (dest) {
      const top = pickResultForDestination(band, dest);
      return {
        decision: "executed",
        results: [top],
        top,
        destinationHref: dest,
        shouldExecute: true,
      };
    }
  }

  // Destinations disagree among close peers → list (dedupe by page)
  const listed = dedupeBandByDestination(band).slice(0, listCap);
  return {
    decision: "ambiguous",
    results: listed,
    top: listed[0] ?? null,
    destinationHref: null,
    shouldExecute: false,
  };
}
