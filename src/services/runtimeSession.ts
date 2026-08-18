let activeSessionId: string | null = null;

/**
 * A process-local lease for a user-started drive. Persisted session data is
 * necessary for iOS background callbacks, but is not sufficient on its own:
 * after a process restart or reboot this value is deliberately absent, so an
 * old task fails closed instead of silently resuming a drive.
 */
export const activateRuntimeSession = (sessionId: string): void => {
  activeSessionId = sessionId;
};

export const clearRuntimeSession = (): void => {
  activeSessionId = null;
};

export const isRuntimeSessionActive = (sessionId: string): boolean =>
  activeSessionId === sessionId;
