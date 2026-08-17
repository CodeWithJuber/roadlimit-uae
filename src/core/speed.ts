import type { SpeedSample } from '../domain/types';

const MPS_TO_KMH = 3.6;
const MAX_PLAUSIBLE_SPEED_MPS = 70;
const MAX_PLAUSIBLE_ACCELERATION_MPS2 = 12;
export const MAX_FIX_AGE_MS = 5_000;

export const metresPerSecondToKmh = (speedMps: number | null): number | null => {
  if (
    speedMps === null ||
    !Number.isFinite(speedMps) ||
    speedMps < 0 ||
    speedMps > MAX_PLAUSIBLE_SPEED_MPS
  ) {
    return null;
  }
  return Math.round(speedMps * MPS_TO_KMH * 10) / 10;
};

export const median = (values: number[]): number | null => {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (finite.length === 0) return null;
  const middle = Math.floor(finite.length / 2);
  if (finite.length % 2 === 1) return finite[middle] ?? null;
  const left = finite[middle - 1];
  const right = finite[middle];
  return left === undefined || right === undefined ? null : (left + right) / 2;
};

export const smoothedSpeedKmh = (
  samples: SpeedSample[],
  now = Date.now(),
): number | null => {
  const usable = samples
    .filter((sample) => isUsableLocation(sample, now))
    .sort((a, b) => a.timestamp - b.timestamp);
  const latest = usable.at(-1);
  if (!latest || metresPerSecondToKmh(latest.speedMps) === null) return null;

  const plausible: SpeedSample[] = [];
  for (const sample of usable) {
    if (metresPerSecondToKmh(sample.speedMps) === null) continue;
    const previous = plausible.at(-1);
    if (previous && previous.speedMps !== null && sample.speedMps !== null) {
      const elapsedSeconds = (sample.timestamp - previous.timestamp) / 1_000;
      if (elapsedSeconds <= 0) continue;
      const acceleration = Math.abs(sample.speedMps - previous.speedMps) / elapsedSeconds;
      if (acceleration > MAX_PLAUSIBLE_ACCELERATION_MPS2) continue;
    }
    plausible.push(sample);
  }

  if (plausible.at(-1)?.timestamp !== latest.timestamp) return null;

  const speeds = plausible
    .slice(-3)
    .map((sample) => metresPerSecondToKmh(sample.speedMps))
    .filter((value): value is number => value !== null);

  const result = median(speeds);
  return result === null ? null : Math.round(result);
};

export const isUsableLocation = (sample: SpeedSample, now = Date.now()): boolean => {
  const ageMs = now - sample.timestamp;
  const accuracy = sample.accuracyMetres ?? Number.POSITIVE_INFINITY;
  return ageMs >= 0 && ageMs <= MAX_FIX_AGE_MS && accuracy <= 50;
};
