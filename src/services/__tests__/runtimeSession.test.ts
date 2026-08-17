import { beforeEach, describe, expect, it } from 'vitest';

import {
  activateRuntimeSession,
  clearRuntimeSession,
  isRuntimeSessionCurrent,
} from '../runtimeSession';

describe('runtime session gate', () => {
  beforeEach(() => clearRuntimeSession());

  it('rejects cold-started and old-session callbacks', () => {
    expect(isRuntimeSessionCurrent('drive-a')).toBe(false);
    activateRuntimeSession('drive-a');
    expect(isRuntimeSessionCurrent('drive-a')).toBe(true);
    expect(isRuntimeSessionCurrent('drive-b')).toBe(false);
  });

  it('invalidates callbacks immediately on stop', () => {
    activateRuntimeSession('drive-a');
    clearRuntimeSession();
    expect(isRuntimeSessionCurrent('drive-a')).toBe(false);
  });
});
