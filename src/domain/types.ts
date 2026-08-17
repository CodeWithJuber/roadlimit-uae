export type Confidence = 'high' | 'medium' | 'low' | 'unknown';

export type RoadLimitSource = {
  label: string;
  url: string;
  publishedAt?: string;
  verifiedAt: string;
  kind: 'official' | 'open-data' | 'secondary' | 'demo';
};

export type RoadLimitRecord = {
  id: string;
  emirate: 'Dubai';
  canonicalName: string;
  aliases: string[];
  postedLimitsKmh: number[];
  confidence: Confidence;
  source: RoadLimitSource;
  note?: string;
};

export type DetectionMode = 'manual-limit' | 'manual-road';

export type DriveSettings = {
  detectionMode: DetectionMode;
  manualLimitKmh: number;
  selectedRoadId: string | null;
  warningOffsetKmh: 3 | 5 | 10;
  notificationsEnabled: boolean;
  voiceEnabled: boolean;
  hapticsEnabled: boolean;
  backgroundEnabled: boolean;
};

export type LimitResolution = {
  limitKmh: number | null;
  roadName: string | null;
  confidence: Confidence;
  provider: 'manual' | 'catalog' | 'none';
  advisory?: string;
  observedAt: number;
};

export type DriveSnapshot = {
  active: boolean;
  currentSpeedKmh: number | null;
  accuracyMetres: number | null;
  resolution: LimitResolution;
  lastFixAt: number | null;
  status: 'idle' | 'starting' | 'tracking' | 'degraded' | 'error';
  alertBand: 'safe' | 'approaching' | 'over-limit';
  restartRequired?: boolean;
  message?: string;
  sessionWarning?: string;
};

export type LocationSample = {
  latitude: number;
  longitude: number;
  speedMps: number | null;
  accuracyMetres: number | null;
  headingDegrees: number | null;
  timestamp: number;
};

export type SpeedSample = Pick<
  LocationSample,
  'speedMps' | 'accuracyMetres' | 'timestamp'
>;

export type AlertSeverity = 'approaching' | 'over-limit';

export type AlertEvent = {
  severity: AlertSeverity;
  title: string;
  body: string;
  speak: string;
};

export type AlertState = {
  band: 'safe' | 'approaching' | 'over-limit';
  lastAlertAt: Partial<Record<AlertSeverity, number>>;
};
