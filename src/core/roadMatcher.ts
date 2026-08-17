import type { Confidence, RoadLimitRecord } from '../domain/types';

export const normalizeRoadName = (value: string): string =>
  value
    .toLocaleLowerCase('en')
    .replace(/\bsheik\b/g, 'sheikh')
    .replace(/\bmohammad\b/g, 'mohammed')
    .replace(/\bumm?\b/g, 'um')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(road|street|st|rd)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenScore = (left: string, right: string): number => {
  if (!left || !right) return 0;
  if (left === right) return 1;

  const leftTokens = new Set(left.split(' '));
  const rightTokens = new Set(right.split(' '));
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  const jaccard = union === 0 ? 0 : intersection / union;
  const containment = left.includes(right) || right.includes(left) ? 0.82 : 0;
  return Math.max(jaccard, containment);
};

export type RoadNameMatch = {
  road: RoadLimitRecord | null;
  score: number;
  confidence: Confidence;
  ambiguous: boolean;
};

export const matchRoadName = (
  query: string,
  roads: RoadLimitRecord[],
): RoadNameMatch => {
  const normalizedQuery = normalizeRoadName(query);
  const ranked = roads
    .map((road) => {
      const names = [road.canonicalName, ...road.aliases].map(normalizeRoadName);
      return {
        road,
        score: Math.max(...names.map((name) => tokenScore(normalizedQuery, name))),
      };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const second = ranked[1];
  if (!best || best.score < 0.72) {
    return { road: null, score: best?.score ?? 0, confidence: 'unknown', ambiguous: false };
  }

  const ambiguous = Boolean(second && best.score - second.score < 0.12);
  if (ambiguous) {
    return { road: null, score: best.score, confidence: 'low', ambiguous: true };
  }

  return {
    road: best.road,
    score: best.score,
    confidence: best.score >= 0.95 ? 'high' : 'medium',
    ambiguous: false,
  };
};
