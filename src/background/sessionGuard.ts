import type { DriveSnapshot } from '../domain/types';
import type { ActiveDriveSession } from '../storage';

export const MAX_BACKGROUND_SESSION_SILENCE_MS = 5 * 60 * 1_000;

/**
 * This validates persisted freshness in addition to the process-local runtime
 * lease enforced by the task executor. Both must pass: stale storage alone can
 * never resurrect a drive after a process restart or reboot.
 */
export const canProcessBackgroundSession = (
  session: ActiveDriveSession | null,
  snapshot: DriveSnapshot,
  now = Date.now(),
): boolean => {
  if (
    !session ||
    !snapshot.active ||
    snapshot.restartRequired === true ||
    snapshot.status === 'error'
  ) {
    return false;
  }

  const lastEvidenceAt = snapshot.lastFixAt ?? session.startedAt;
  return (
    lastEvidenceAt >= session.startedAt &&
    lastEvidenceAt <= now + 60_000 &&
    now - lastEvidenceAt <= MAX_BACKGROUND_SESSION_SILENCE_MS
  );
};
