import type { CommandSearchResult } from "../../core/command-types";

/*
 * Peer-band scoring for voice auto-route.
 * Hits stay in the band while within `peerGap` of the top score and no neighbor
 * drop exceeds `stepGap`. Destinations come from `href` on both result types.
 */

export function resultDestination(result: CommandSearchResult): string | null {
  return result.type === "navigation" ? result.href : result.href ?? null;
}

export function sortByScore(results: CommandSearchResult[]) {
  return [...results].sort(
    (left, right) =>
      (right.score ?? Number.NEGATIVE_INFINITY) -
      (left.score ?? Number.NEGATIVE_INFINITY),
  );
}

export function buildPeerBand(
  results: CommandSearchResult[],
  peerGap: number,
  stepGap: number,
): CommandSearchResult[] {
  if (results.length === 0) return [];

  const sorted = sortByScore(results);
  const topScore = sorted[0]?.score;
  if (topScore === undefined) return [sorted[0]!];

  const band = [sorted[0]!];
  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index]!;
    const previous = sorted[index - 1]!;
    if (current.score === undefined || previous.score === undefined) break;
    if (topScore - current.score > peerGap) break;
    // A cliff vs the previous neighbor ends the band even if still within peerGap.
    if (previous.score - current.score > stepGap) break;
    band.push(current);
  }
  return band;
}

export function destinationsIn(band: CommandSearchResult[]) {
  const destinations: string[] = [];
  const seen = new Set<string>();

  for (const result of band) {
    const destination = resultDestination(result);
    if (destination && !seen.has(destination)) {
      seen.add(destination);
      destinations.push(destination);
    }
  }
  return destinations;
}

export function pickResultForDestination(
  band: CommandSearchResult[],
  destination: string,
): CommandSearchResult {
  const navigation = band.find(
    (result) => result.type === "navigation" && result.href === destination,
  );
  if (navigation) return navigation;

  const match = band.find((result) => resultDestination(result) === destination);
  if (match?.type === "action") {
    // Auto-route must navigate the host page, never fire the leaf action.
    return {
      id: `voice-nav:${destination}`,
      type: "navigation",
      title: match.title,
      description: match.description,
      href: destination,
      score: match.score,
    };
  }
  if (match) return match;

  return {
    id: `voice-nav:${destination}`,
    type: "navigation",
    title: destination,
    href: destination,
  };
}

export function listDestinations(
  band: CommandSearchResult[],
  limit: number,
): CommandSearchResult[] {
  const listed: CommandSearchResult[] = [];
  const seen = new Set<string>();

  for (const result of band) {
    const destination = resultDestination(result) ?? `id:${result.id}`;
    if (seen.has(destination)) continue;
    seen.add(destination);
    listed.push(
      // List pages, not leaf actions: promote action+href rows to navigation.
      result.type === "action" && result.href
        ? pickResultForDestination(band, result.href)
        : result,
    );
    if (listed.length >= Math.max(1, limit)) break;
  }
  return listed;
}
