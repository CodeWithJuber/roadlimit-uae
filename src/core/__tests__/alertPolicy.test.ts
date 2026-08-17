import { describe, expect, it } from 'vitest';

import { evaluateSpeedAlert, INITIAL_ALERT_STATE } from '../alertPolicy';

describe('speed alert policy', () => {
  it('warns before and at the posted limit without using radar control', () => {
    const approaching = evaluateSpeedAlert({
      speedKmh: 76,
      limitKmh: 80,
      warningOffsetKmh: 5,
      state: INITIAL_ALERT_STATE,
      now: 100_000,
    });
    expect(approaching.event?.severity).toBe('approaching');

    const over = evaluateSpeedAlert({
      speedKmh: 80,
      limitKmh: 80,
      warningOffsetKmh: 5,
      state: approaching.state,
      now: 101_000,
    });
    expect(over.event?.severity).toBe('over-limit');
    expect(over.event?.body).toContain('confirmed session limit 80');
  });

  it('suppresses repeated alerts inside the cooldown', () => {
    const first = evaluateSpeedAlert({
      speedKmh: 90,
      limitKmh: 80,
      warningOffsetKmh: 5,
      state: INITIAL_ALERT_STATE,
      now: 100_000,
    });
    const repeated = evaluateSpeedAlert({
      speedKmh: 91,
      limitKmh: 80,
      warningOffsetKmh: 5,
      state: first.state,
      now: 105_000,
    });
    expect(first.event?.severity).toBe('over-limit');
    expect(repeated.event).toBeNull();
  });

  it('re-arms only after speed drops below hysteresis', () => {
    const warning = evaluateSpeedAlert({
      speedKmh: 76,
      limitKmh: 80,
      warningOffsetKmh: 5,
      state: INITIAL_ALERT_STATE,
      now: 100_000,
    });
    const safe = evaluateSpeedAlert({
      speedKmh: 70,
      limitKmh: 80,
      warningOffsetKmh: 5,
      state: warning.state,
      now: 110_000,
    });
    const warnedAgain = evaluateSpeedAlert({
      speedKmh: 76,
      limitKmh: 80,
      warningOffsetKmh: 5,
      state: safe.state,
      now: 130_000,
    });
    expect(safe.state.band).toBe('safe');
    expect(warnedAgain.event?.severity).toBe('approaching');
  });

  it('does not chatter when speed oscillates around the confirmed limit', () => {
    const over = evaluateSpeedAlert({
      speedKmh: 80,
      limitKmh: 80,
      warningOffsetKmh: 5,
      state: INITIAL_ALERT_STATE,
      now: 100_000,
    });
    const below = evaluateSpeedAlert({
      speedKmh: 79,
      limitKmh: 80,
      warningOffsetKmh: 5,
      state: over.state,
      now: 102_000,
    });
    const overAgain = evaluateSpeedAlert({
      speedKmh: 80,
      limitKmh: 80,
      warningOffsetKmh: 5,
      state: below.state,
      now: 104_000,
    });
    expect(over.event?.severity).toBe('over-limit');
    expect(overAgain.event).toBeNull();
  });
});
