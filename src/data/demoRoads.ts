import type { RoadLimitRecord } from '../domain/types';
import { DUBAI_POLICE_SPEED_LIMITS_URL } from './sources';

const source = {
  label: 'Dubai Police — Street Speed Limits',
  url: DUBAI_POLICE_SPEED_LIMITS_URL,
  verifiedAt: '2026-08-17',
  kind: 'official' as const,
};

/**
 * Small demonstrator only. It is intentionally not a copy of the press table.
 * Values without segment geometry must never be used for automatic GPS alerts.
 * The driver explicitly confirms a displayed sign before every session.
 */
export const DEMO_ROADS: RoadLimitRecord[] = [
  {
    id: 'dubai:al-nahda',
    emirate: 'Dubai',
    canonicalName: 'Al Nahda Road',
    aliases: ['Al Nahda', 'Al Nahda Street'],
    postedLimitsKmh: [80],
    confidence: 'medium',
    source,
    note: 'Road-name-level reference; no segment geometry is bundled.',
  },
  {
    id: 'dubai:al-khail',
    emirate: 'Dubai',
    canonicalName: 'Al Khail Road',
    aliases: ['Al Khail', 'E44'],
    postedLimitsKmh: [100],
    confidence: 'medium',
    source,
    note: 'Road-name-level reference; temporary signs and changed sections override it.',
  },
  {
    id: 'dubai:emirates-road',
    emirate: 'Dubai',
    canonicalName: 'Emirates Road',
    aliases: ['E611'],
    postedLimitsKmh: [110],
    confidence: 'medium',
    source,
    note: 'Use only after the driver confirms the posted sign for the current section.',
  },
  {
    id: 'dubai:sheikh-zayed-road',
    emirate: 'Dubai',
    canonicalName: 'Sheikh Zayed Road',
    aliases: ['Sheik Zayed Road', 'E11'],
    postedLimitsKmh: [100, 120],
    confidence: 'low',
    source,
    note: 'Different sections have different limits. Confirm the sign and select the current limit manually.',
  },
];

export const getRoadById = (id: string | null): RoadLimitRecord | null =>
  id ? DEMO_ROADS.find((road) => road.id === id) ?? null : null;
