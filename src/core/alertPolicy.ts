import type { AlertEvent, AlertSeverity, AlertState } from '../domain/types';

export const INITIAL_ALERT_STATE: AlertState = {
  band: 'safe',
  lastAlertAt: {},
};

type EvaluateAlertInput = {
  speedKmh: number | null;
  limitKmh: number | null;
  warningOffsetKmh: 3 | 5 | 10;
  state: AlertState;
  now?: number;
  cooldownMs?: number;
};

export type AlertEvaluation = {
  event: AlertEvent | null;
  state: AlertState;
};

const canEmit = (
  severity: AlertSeverity,
  state: AlertState,
  now: number,
  cooldownMs: number,
): boolean => now - (state.lastAlertAt[severity] ?? 0) >= cooldownMs;

const recordEvent = (
  state: AlertState,
  severity: AlertSeverity,
  now: number,
): AlertState => ({
  ...state,
  lastAlertAt: { ...state.lastAlertAt, [severity]: now },
});

export const evaluateSpeedAlert = ({
  speedKmh,
  limitKmh,
  warningOffsetKmh,
  state,
  now = Date.now(),
  cooldownMs = 20_000,
}: EvaluateAlertInput): AlertEvaluation => {
  if (speedKmh === null || limitKmh === null || limitKmh <= 0) {
    return { event: null, state: { ...state, band: 'safe' } };
  }

  let nextState: AlertState = { ...state };
  const warningAt = limitKmh - warningOffsetKmh;
  const rearmAt = warningAt - 3;

  if (speedKmh >= limitKmh) {
    nextState = { ...nextState, band: 'over-limit' };
    if (canEmit('over-limit', state, now, cooldownMs)) {
      const event: AlertEvent = {
        severity: 'over-limit',
        title: 'Reduce speed',
        body: `${speedKmh} km/h · confirmed session limit ${limitKmh} km/h`,
        speak: `Slow down. Confirmed limit ${limitKmh}.`,
      };
      return { event, state: recordEvent(nextState, event.severity, now) };
    }
    return { event: null, state: nextState };
  }

  if (speedKmh >= warningAt) {
    nextState = { ...nextState, band: 'approaching' };
    if (state.band === 'safe' && canEmit('approaching', state, now, cooldownMs)) {
      const event: AlertEvent = {
        severity: 'approaching',
        title: 'Approaching confirmed limit',
        body: `${speedKmh} km/h · confirmed session limit ${limitKmh} km/h`,
        speak: `Approaching confirmed limit ${limitKmh}.`,
      };
      return { event, state: recordEvent(nextState, event.severity, now) };
    }
    return { event: null, state: nextState };
  }

  if (speedKmh <= rearmAt) {
    nextState = { ...nextState, band: 'safe' };
  }

  return { event: null, state: nextState };
};
