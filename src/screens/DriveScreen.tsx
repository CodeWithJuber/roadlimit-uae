import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { LimitSign } from '../components/LimitSign';
import { ModePill } from '../components/ModePill';
import { getRoadById } from '../data/demoRoads';
import type { DriveSettings, DriveSnapshot } from '../domain/types';
import { colors, radius, spacing, typeScale } from '../theme';

type Props = {
  snapshot: DriveSnapshot;
  settings: DriveSettings;
  busy: boolean;
  startBlocked: boolean;
  onStart: () => void;
  onStop: () => void;
  onOpenSettings: () => void;
};

const sourceLabel = (snapshot: DriveSnapshot) => {
  if (snapshot.resolution.provider === 'manual') return 'Manually confirmed';
  if (snapshot.resolution.provider === 'catalog') return 'Road reference confirmed';
  return 'No confirmed source';
};

const Gauge = ({
  value,
  active,
  size,
}: {
  value: number | '—';
  active: boolean;
  size: number;
}) => (
  <View
    accessible
    accessibilityLabel={
      value === '—' ? 'Current speed unavailable' : `Current speed ${value} kilometres per hour`
    }
    style={[styles.gauge, { width: size, height: size, borderRadius: size / 2 }]}
  >
    <View
      style={[
        styles.gaugeInner,
        {
          borderRadius: (size - 24) / 2,
        },
      ]}
    />
    {Array.from({ length: 24 }).map((_, index) => (
      <View
        // The marks are decorative and deliberately static.
        key={index}
        style={[styles.tickWrap, { transform: [{ rotate: `${index * 15}deg` }] }]}
        pointerEvents="none"
      >
        <View
          style={[
            styles.tick,
            index % 3 === 0 && styles.tickMajor,
            active && index % 3 === 0 && styles.tickActive,
          ]}
        />
      </View>
    ))}
    <View style={styles.gaugeReadout}>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={[styles.speed, { fontSize: Math.round(size * 0.38), lineHeight: Math.round(size * 0.42) }]}
      >
        {value}
      </Text>
      <Text style={styles.speedUnit}>km/h</Text>
    </View>
  </View>
);

export const DriveScreen = ({
  snapshot,
  settings,
  busy,
  startBlocked,
  onStart,
  onStop,
  onOpenSettings,
}: Props) => {
  const { height, width } = useWindowDimensions();
  const compact = height < 860 || width < 370;
  const gaugeSize = Math.min(width - 72, compact ? 226 : 260);
  const limit = snapshot.active ? snapshot.resolution.limitKmh : settings.manualLimitKmh;
  const displaySpeed =
    snapshot.active && snapshot.currentSpeedKmh !== null
      ? Math.round(snapshot.currentSpeedKmh)
      : '—';
  const selectedRoad = getRoadById(settings.selectedRoadId);
  const runtimeMessage = snapshot.message ?? snapshot.sessionWarning;
  const confirmedAt =
    snapshot.active && snapshot.resolution.observedAt > 0
      ? new Date(snapshot.resolution.observedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;
  const difference =
    snapshot.currentSpeedKmh !== null && limit !== null
      ? Math.round(snapshot.currentSpeedKmh - limit)
      : null;

  const confirmAndStart = () => {
    if (settings.detectionMode === 'manual-road' && !settings.selectedRoadId) {
      Alert.alert(
        'Choose a road reference',
        'Select a candidate road value or switch to Confirm a posted limit.',
      );
      return;
    }

    const trackingCopy =
      Platform.OS === 'android'
        ? 'Android beta tracks only while RoadLimit remains visible with the screen on.'
        : settings.backgroundEnabled
          ? 'RoadLimit uses precise location during this drive, including while the screen is locked or another app is open.'
          : 'RoadLimit tracks only while this screen remains open.';

    Alert.alert(
      `Confirm ${settings.manualLimitKmh} km/h`,
      `Continue only if this matches the posted sign for your current section. ${trackingCopy} Coordinates are not stored or uploaded. This value stays fixed until you stop the drive.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Privacy policy',
          onPress: () =>
            void Linking.openURL(
              'https://github.com/CodeWithJuber/roadlimit-uae/blob/main/PRIVACY.md',
            ),
        },
        { text: 'Confirm & start', onPress: onStart },
      ],
    );
  };

  const primaryAction = (
    <Pressable
      style={({ pressed }) => [
        styles.primaryButton,
        snapshot.active && styles.stopButton,
        (busy || (!snapshot.active && startBlocked)) && styles.buttonDisabled,
        pressed && !busy && styles.pressed,
      ]}
      onPress={snapshot.active ? onStop : confirmAndStart}
      disabled={busy || (!snapshot.active && startBlocked)}
      accessibilityRole="button"
      accessibilityState={{ disabled: busy || (!snapshot.active && startBlocked), busy }}
      accessibilityLabel={
        snapshot.active
          ? 'Stop driving session'
          : startBlocked
            ? 'Start unavailable until the app is reopened'
            : `Confirm ${settings.manualLimitKmh} kilometres per hour and start`
      }
    >
      {busy ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <MaterialCommunityIcons
          name={snapshot.active ? 'stop' : startBlocked ? 'alert-circle-outline' : 'play'}
          size={23}
          color={startBlocked ? colors.muted : colors.ink}
        />
      )}
      <Text style={[styles.primaryText, startBlocked && styles.primaryTextDisabled]}>
        {snapshot.active
          ? 'Stop drive'
          : startBlocked
            ? 'Reopen app to continue'
            : `Confirm ${settings.manualLimitKmh} & start`}
      </Text>
    </Pressable>
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.content, compact && styles.contentCompact]}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>RoadLimit</Text>
          <Text style={styles.brandRegion}>UAE</Text>
        </View>
        <View style={styles.headerIcon} accessibilityElementsHidden>
          <MaterialCommunityIcons name="shield-outline" size={20} color={colors.muted} />
        </View>
      </View>

      <View style={styles.modeWrap}>
        <ModePill snapshot={snapshot} />
      </View>

      <View style={styles.hero}>
        <Gauge value={displaySpeed} active={snapshot.active} size={gaugeSize} />
        <View style={styles.limitBlock}>
          <Text style={styles.limitCaption}>
            {snapshot.active ? 'Confirmed limit' : 'Selected · confirm the sign'}
          </Text>
          <LimitSign
            limitKmh={limit}
            accessibilityLabel={
              snapshot.active
                ? `Confirmed session limit ${limit ?? 'unknown'} kilometres per hour`
                : `Selected candidate ${limit ?? 'unknown'} kilometres per hour, not yet confirmed`
            }
          />
          <Text numberOfLines={1} style={styles.limitSource}>
            {snapshot.active
              ? snapshot.resolution.roadName ?? sourceLabel(snapshot)
              : settings.detectionMode === 'manual-road'
                ? selectedRoad?.canonicalName ?? 'Choose a road reference'
                : 'Manual selection'}
          </Text>
        </View>
      </View>

      {snapshot.active && snapshot.alertBand === 'over-limit' ? (
        <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.dangerCard}>
          <View style={styles.alertIcon}>
            <MaterialCommunityIcons name="alert-outline" size={27} color={colors.red} />
          </View>
          <View style={styles.alertCopy}>
            <Text style={styles.dangerTitle}>Slow down</Text>
            <Text style={styles.dangerText}>
              {difference !== null && difference > 0
                ? `${difference} km/h over the confirmed limit`
                : 'Speed is over the confirmed limit'}
            </Text>
          </View>
        </View>
      ) : null}

      {snapshot.active && snapshot.alertBand === 'approaching' ? (
        <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.warningCard}>
          <View style={styles.warningIcon}>
            <MaterialCommunityIcons name="alert-outline" size={25} color={colors.amber} />
          </View>
          <View style={styles.alertCopy}>
            <Text style={styles.warningTitle}>Approaching limit</Text>
            <Text style={styles.warningText}>
              {difference !== null && difference < 0
                ? `${Math.abs(difference)} km/h below the confirmed limit`
                : 'You are within the selected early-warning range'}
            </Text>
          </View>
        </View>
      ) : null}

      {snapshot.active ? primaryAction : null}

      <View style={styles.infoPanel}>
        {snapshot.active ? (
          <>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.cyan} />
              <Text style={styles.infoLabel}>GPS accuracy</Text>
              <Text style={styles.infoValue}>
                {snapshot.lastFixAt
                  ? snapshot.accuracyMetres !== null
                    ? `±${Math.round(snapshot.accuracyMetres)} m`
                    : 'Unavailable'
                  : 'Waiting'}
              </Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.cyan} />
              <Text style={styles.infoLabel}>{sourceLabel(snapshot)}</Text>
              <Text style={styles.infoValue}>{confirmedAt ?? 'This session'}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="information-outline" size={20} color={colors.cyan} />
              <Text style={styles.infoLabel}>GPS starts after confirmation</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <MaterialCommunityIcons name="traffic-cone" size={20} color={colors.muted} />
              <Text style={styles.infoLabel}>
                Follow posted and temporary signs and authority instructions
              </Text>
            </View>
          </>
        )}
      </View>

      {runtimeMessage ? (
        <View
          accessibilityRole={snapshot.status === 'error' ? 'alert' : 'text'}
          accessibilityLiveRegion="polite"
          style={[
            styles.messageCard,
            snapshot.status === 'error' && styles.messageCardError,
          ]}
        >
          <MaterialCommunityIcons
            name={snapshot.status === 'error' ? 'alert-circle-outline' : 'information-outline'}
            size={20}
            color={snapshot.status === 'error' ? colors.red : colors.muted}
          />
          <Text
            style={[
              styles.messageText,
              snapshot.status === 'error' && styles.messageTextError,
            ]}
          >
            {runtimeMessage}
          </Text>
        </View>
      ) : null}

      {!snapshot.active ? primaryAction : null}

      {!snapshot.active ? (
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          onPress={onOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Change the selected limit"
        >
          <Text style={styles.secondaryText}>Change limit</Text>
        </Pressable>
      ) : null}

      <Text style={styles.platformText}>
        {Platform.OS === 'android'
          ? 'Android beta · Screen-on tracking only'
          : 'Follow posted signs · Never handle the phone while moving'}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 100,
    gap: spacing.sm,
  },
  contentCompact: {
    paddingTop: spacing.xs,
    gap: spacing.xs,
  },
  header: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: colors.text,
    fontSize: 23,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  brandRegion: {
    color: colors.cyan,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  modeWrap: { minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', gap: spacing.sm },
  gauge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvasRaised,
    borderWidth: 2,
    borderColor: colors.cyanStrong,
    shadowColor: colors.cyan,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  gaugeInner: {
    position: 'absolute',
    top: 12,
    right: 12,
    bottom: 12,
    left: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  tickWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
  },
  tick: {
    width: 1,
    height: 7,
    marginTop: 10,
    borderRadius: 1,
    backgroundColor: colors.lineStrong,
  },
  tickMajor: { width: 2, height: 12 },
  tickActive: { backgroundColor: colors.cyan },
  gaugeReadout: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  speed: {
    width: '100%',
    color: colors.text,
    fontWeight: '600',
    letterSpacing: -4,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  speedUnit: {
    color: colors.muted,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '500',
    marginTop: -2,
  },
  limitBlock: { alignItems: 'center', gap: 6 },
  limitCaption: {
    color: colors.muted,
    fontSize: typeScale.micro,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 0.65,
    textTransform: 'uppercase',
  },
  limitSource: {
    maxWidth: 250,
    color: colors.faint,
    fontSize: typeScale.label,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  dangerCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.redSoft,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: radius.medium,
  },
  warningCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: radius.medium,
  },
  alertIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: '#250B10',
  },
  warningIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: '#211807',
  },
  alertCopy: { flex: 1, gap: 3 },
  dangerTitle: { color: colors.red, fontSize: 19, lineHeight: 23, fontWeight: '700' },
  dangerText: { color: colors.text, fontSize: typeScale.body, lineHeight: 19 },
  warningTitle: { color: colors.amber, fontSize: 18, lineHeight: 22, fontWeight: '700' },
  warningText: { color: colors.text, fontSize: typeScale.body, lineHeight: 19 },
  infoPanel: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.medium,
  },
  infoRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  infoLabel: {
    flex: 1,
    color: colors.text,
    fontSize: typeScale.body,
    lineHeight: 20,
    fontWeight: '500',
  },
  infoValue: {
    color: colors.muted,
    fontSize: typeScale.label,
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'right',
  },
  messageCard: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.small,
  },
  messageCardError: { backgroundColor: colors.redSoft },
  messageText: { flex: 1, color: colors.muted, fontSize: typeScale.label, lineHeight: 18 },
  messageTextError: { color: colors.red },
  primaryButton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.cyan,
  },
  stopButton: { backgroundColor: colors.red },
  buttonDisabled: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  pressed: { opacity: 0.72 },
  primaryText: {
    color: colors.ink,
    fontSize: typeScale.bodyLarge,
    lineHeight: 22,
    fontWeight: '800',
  },
  primaryTextDisabled: { color: colors.muted },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.cyan,
    fontSize: typeScale.body,
    lineHeight: 20,
    fontWeight: '700',
  },
  platformText: {
    minHeight: 26,
    color: colors.faint,
    fontSize: typeScale.micro,
    lineHeight: 16,
    textAlign: 'center',
  },
});
