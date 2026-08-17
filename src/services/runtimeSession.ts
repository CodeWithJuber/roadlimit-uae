let runtimeSessionId: string | null = null;

export const activateRuntimeSession = (sessionId: string): void => {
  runtimeSessionId = sessionId;
};

export const clearRuntimeSession = (): void => {
  runtimeSessionId = null;
};

export const isRuntimeSessionCurrent = (sessionId: string): boolean =>
  runtimeSessionId === sessionId;
