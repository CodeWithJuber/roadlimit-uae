import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DATA_SAFETY_NOTICE } from '../data/sources';
import { getRoadById } from '../data/demoRoads';
import type { DriveSettings, DriveSnapshot } from '../domain/types';
import { colors, radius } from '../theme';
import { LimitSign } from '../components/LimitSign';
import { ModePill } from '../components/ModePill';

type Props = {
  snapshot: DriveSnapshot;
  settings: DriveSettings;
  busy: boolean;
  startBlocked: boolean;
  onStart: () => void;
  onStop: () => void;
  onOpenSettings: () => void;
};

const providerLabel = (snapshot: DriveSnapshot, settings: DriveSettings) => {
  if (!snapshot.active) {
    return 'CONFIRM TO START';
  }
  switch (snapshot.resolution.provider) {
    case 'manual':
      return 'MANUAL SIGN';
    case 'catalog':
      return 'ROAD REFERENCE';
    default:
      return 'NO MATCH';
  }
};

export const DriveScreen = ({
  snapshot,
  settings,
  busy,
  startBlocked,
  onStart,
  onStop,
  onOpenSettings,
}: Props) => {
  const limit = snapshot.active ? snapshot.resolution.limitKmh : settings.manualLimitKmh;
  const displaySpeed = snapshot.currentSpeedKmh === null ? '—' : Math.round(snapshot.currentSpeedKmh);
  const selectedRoad = getRoadById(settings.selectedRoadId);
  const confirmedAt =
    snapshot.active && snapshot.resolution.observedAt > 0
      ? new Date(snapshot.resolution.observedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;
  const visualAlert =
    snapshot.active && snapshot.alertBand === 'over-limit'
      ? { text: 'REDUCE SPEED', color: colors.red, icon: 'alert-octagon' }
      : snapshot.active && snapshot.alertBand === 'approaching'
        ? { text: 'APPROACHING SESSION LIMIT', color: colors.amber, icon: 'alert-outline' }
        : null;

  const confirmAndStart = () => {
    if (settings.detectionMode === 'manual-road' && !settings.selectedRoadId) {
      Alert.alert('Choose a road reference', 'Select a candidate road value or switch to Confirm the sign mode.');
      return;
    }
    Alert.alert(
      `Confirm ${settings.manualLimitKmh} km/h`,
      settings.backgroundEnabled
        ? 'Only continue if this matches the physical sign for your current section. RoadLimit UAE accesses precise location during this drive, including in the background while the screen is locked or another app is open, to calculate GPS speed and issue local alerts. Android shows a persistent notification and iOS shows its location indicator. It never auto-starts, stores coordinates, or uploads your route. This number stays static until you stop.'
        : 'Only continue if this matches the physical sign for your current section. RoadLimit UAE accesses precise location while this screen is open to calculate GPS speed and issue local alerts. It never stores coordinates or uploads your route. This number stays static until you stop.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Privacy policy',
          onPress: () =>
            void Linking.openURL(
              'https://github.com/CodeWithJuber/roadlimit-uae/blob/main/PRIVACY.md',
            ),
        },
        { text: 'Agree & start', onPress: onStart },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>DUBAI-FIRST · OPEN SOURCE</Text>
          <Text style={styles.title}>Drive calm.</Text>
        </View>
        <ModePill snapshot={snapshot} />
      </View>

      {visualAlert ? (
        <View style={[styles.visualAlert, { backgroundColor: visualAlert.color }]}>
          <MaterialCommunityIcons name={visualAlert.icon as never} size={24} color={colors.white} />
          <Text style={styles.visualAlertText}>{visualAlert.text}</Text>
        </View>
      ) : null}

      <View
        style={[
          styles.hero,
          snapshot.alertBand === 'over-limit' && styles.heroOver,
          snapshot.alertBand === 'approaching' && styles.heroApproaching,
        ]}
      >
        <View style={styles.speedBlock}>
          <Text style={styles.speed}>{displaySpeed}</Text>
          <Text style={styles.speedUnit}>km/h</Text>
          <Text style={styles.gpsText}>
            {snapshot.lastFixAt
              ? snapshot.accuracyMetres !== null &&
                Number.isFinite(snapshot.accuracyMetres)
                ? `GPS ±${Math.round(snapshot.accuracyMetres)} m`
                : 'GPS accuracy unknown'
              : 'Waiting for drive session'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.limitBlock}>
          <Text style={styles.microLabel}>
            {snapshot.active ? 'CONFIRMED SESSION LIMIT' : 'SELECTED LIMIT — NOT CONFIRMED'}
          </Text>
          <LimitSign
            limitKmh={limit}
            accessibilityLabel={
              snapshot.active
                ? `Confirmed session limit ${limit ?? 'unknown'} kilometres per hour`
                : `Selected unconfirmed limit ${limit ?? 'unknown'} kilometres per hour`
            }
          />
          <Text style={styles.provider}>{providerLabel(snapshot, settings)}</Text>
        </View>
      </View>

      <View style={styles.roadCard}>
        <View style={styles.roadIcon}>
          <MaterialCommunityIcons name="road-variant" size={24} color={colors.green} />
        </View>
        <View style={styles.roadCopy}>
          <Text style={styles.microLabel}>
            {snapshot.active
              ? 'STATIC SESSION LIMIT SOURCE'
              : 'SELECTED SOURCE — NOT CONFIRMED'}
          </Text>
          <Text style={styles.roadName}>
            {snapshot.resolution.roadName ??
              (settings.detectionMode === 'manual-limit'
                ? snapshot.active
                  ? `Driver-confirmed ${settings.manualLimitKmh} km/h`
                  : `Selected ${settings.manualLimitKmh} km/h — confirmation required`
                : selectedRoad?.canonicalName ?? 'Road reference unavailable')}
          </Text>
          <Text style={styles.roadNote}>
            {snapshot.resolution.advisory ?? 'The physical sign is authoritative.'}
            {confirmedAt ? ` Confirmed at ${confirmedAt}.` : ''}
          </Text>
        </View>
        {!snapshot.active ? (
          <Pressable onPress={onOpenSettings} hitSlop={12} accessibilityLabel="Open settings">
            <MaterialCommunityIcons name="tune-variant" size={25} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {snapshot.message ? (
        <View style={styles.messageCard}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.amber} />
          <Text style={styles.messageText}>{snapshot.message}</Text>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          snapshot.active && styles.stopButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={snapshot.active ? onStop : confirmAndStart}
        disabled={busy || (!snapshot.active && startBlocked)}
        accessibilityRole="button"
        accessibilityLabel={
          snapshot.active
            ? 'Stop driving session'
            : startBlocked
              ? 'Start unavailable until the app is reopened'
              : 'Start driving session'
        }
      >
        {busy ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <MaterialCommunityIcons
            name={
              snapshot.active
                ? 'stop-circle-outline'
                : startBlocked
                  ? 'alert-circle-outline'
                  : 'navigation-variant'
            }
            size={24}
            color={snapshot.active ? colors.white : colors.ink}
          />
        )}
        <Text style={[styles.primaryText, snapshot.active && styles.stopText]}>
          {snapshot.active
            ? 'STOP DRIVE'
            : startBlocked
              ? 'REOPEN APP TO CONTINUE'
              : 'START DRIVE'}
        </Text>
      </Pressable>

      {!snapshot.active ? (
        <View style={styles.actionRow}>
          <Pressable style={styles.secondaryButton} onPress={onOpenSettings}>
            <MaterialCommunityIcons name="speedometer" size={20} color={colors.blue} />
            <Text style={styles.secondaryText}>Set posted limit</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.safetyCard}>
        <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.green} />
        <Text style={styles.safetyText}>{DATA_SAFETY_NOTICE} Never handle the phone while moving.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 120, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1.2, marginTop: 3 },
  visualAlert: {
    minHeight: 58,
    borderRadius: radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  visualAlertText: { color: colors.white, fontSize: 15, fontWeight: '900', letterSpacing: 1.1 },
  hero: {
    minHeight: 254,
    borderRadius: radius.large,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  heroOver: { borderColor: colors.red, borderWidth: 3 },
  heroApproaching: { borderColor: colors.amber, borderWidth: 2 },
  speedBlock: { flex: 1, alignItems: 'center' },
  speed: { color: colors.text, fontSize: 90, fontWeight: '900', letterSpacing: -6, lineHeight: 96 },
  speedUnit: { color: colors.muted, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  gpsText: { color: colors.muted, fontSize: 11, marginTop: 14 },
  divider: { height: 150, width: 1, backgroundColor: colors.line, marginHorizontal: 16 },
  limitBlock: { flex: 1, alignItems: 'center', gap: 10 },
  microLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  provider: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  roadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.line,
  },
  roadIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadCopy: { flex: 1, gap: 4 },
  roadName: { color: colors.text, fontSize: 16, fontWeight: '800' },
  roadNote: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  messageCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: colors.amberSoft,
    borderRadius: radius.medium,
    padding: 14,
  },
  messageText: { color: colors.amber, flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  primaryButton: {
    minHeight: 60,
    borderRadius: radius.medium,
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stopButton: { backgroundColor: colors.red },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  primaryText: { color: colors.ink, fontSize: 15, fontWeight: '900', letterSpacing: 1.2 },
  stopText: { color: colors.white },
  actionRow: { flexDirection: 'row', gap: 12 },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: radius.medium,
    padding: 16,
    backgroundColor: colors.greenSoft,
  },
  safetyText: { color: '#C8F6E3', flex: 1, fontSize: 12, lineHeight: 18 },
});
