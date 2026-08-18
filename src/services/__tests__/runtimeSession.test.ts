import { beforeEach, describe, expect, it } from 'vitest';

import {
  activateRuntimeSession,
  clearRuntimeSession,
  isRuntimeSessionActive,
} from '../runtimeSession';

describe('process-local drive lease', () => {
  beforeEach(clearRuntimeSession);

  it('authorises only the explicitly activated session', () => {
    activateRuntimeSession('drive-a');

    expect(isRuntimeSessionActive('drive-a')).toBe(true);
    expect(isRuntimeSessionActive('drive-b')).toBe(false);
  });

  it('fails closed when the runtime lease is absent', () => {
    expect(isRuntimeSessionActive('drive-a')).toBe(false);
  });
});
