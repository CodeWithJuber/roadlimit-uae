import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import type { DetectionMode, DriveSettings } from '../domain/types';
import { configureAlerts, deliverAlert } from '../services/notifications';
import { colors, radius } from '../theme';

type Props = {
  settings: DriveSettings;
  disabled: boolean;
  onChange: (settings: DriveSettings) => void;
};

const LIMIT_OPTIONS = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 160];
const WARNING_OPTIONS = [3, 5, 10] as const;

const MODES: Array<{ id: DetectionMode; title: string; body: string; icon: string }> = [
  {
    id: 'manual-limit',
    title: 'Confirm the sign',
    body: 'Safest offline mode. Select the posted limit before moving.',
    icon: 'traffic-cone',
  },
  {
    id: 'manual-road',
    title: 'Road reference',
    body: 'Use a source-linked candidate, then confirm the exact section.',
    icon: 'road-variant',
  },
];

const SettingToggle = ({
  icon,
  title,
  body,
  value,
  onValueChange,
  disabled,
}: {
  icon: string;
  title: string;
  body: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled: boolean;
}) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleIcon}>
      <MaterialCommunityIcons name={icon as never} size={21} color={colors.blue} />
    </View>
    <View style={styles.toggleCopy}>
      <Text style={styles.toggleTitle}>{title}</Text>
      <Text style={styles.toggleBody}>{body}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.line, true: colors.greenSoft }}
      thumbColor={value ? colors.green : colors.muted}
    />
  </View>
);

export const SettingsScreen = ({ settings, disabled, onChange }: Props) => {
  const update = <K extends keyof DriveSettings>(key: K, value: DriveSettings[K]) =>
    onChange({ ...settings, [key]: value });

  const testAlert = async () => {
    await configureAlerts();
    await deliverAlert(
      {
        severity: 'approaching',
        title: 'RoadLimit UAE test',
        body: `Alert ready · selected limit ${settings.manualLimitKmh} km/h`,
        speak: `Test alert. Selected limit ${settings.manualLimitKmh}.`,
      },
      settings,
      { allowSpeech: true },
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>SET UP WHILE PARKED</Text>
      <Text style={styles.title}>Preferences</Text>
      {disabled ? (
        <View style={styles.lockedNotice}>
          <MaterialCommunityIcons name="lock-outline" size={19} color={colors.amber} />
          <Text style={styles.lockedText}>Stop the drive before changing safety settings.</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>LIMIT SOURCE</Text>
      <View style={styles.group}>
        {MODES.map((mode) => {
          const selected = settings.detectionMode === mode.id;
          const unavailable = mode.id === 'manual-road' && !settings.selectedRoadId;
          return (
            <Pressable
              key={mode.id}
              style={[styles.modeRow, selected && styles.modeRowSelected]}
              onPress={() => !disabled && !unavailable && update('detectionMode', mode.id)}
              disabled={disabled || unavailable}
            >
              <View style={[styles.modeIcon, selected && styles.modeIconSelected]}>
                <MaterialCommunityIcons
                  name={mode.icon as never}
                  size={22}
                  color={selected ? colors.green : colors.muted}
                />
              </View>
              <View style={styles.modeCopy}>
                <Text style={[styles.modeTitle, unavailable && styles.disabledText]}>{mode.title}</Text>
                <Text style={styles.modeBody}>
                  {unavailable ? 'Select a road in the Roads tab first.' : mode.body}
                </Text>
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>SELECT POSTED LIMIT — CONFIRM AGAIN AT START</Text>
      <View style={styles.chipWrap}>
        {LIMIT_OPTIONS.map((limit) => (
          <Pressable
            key={limit}
            onPress={() => !disabled && update('manualLimitKmh', limit)}
            disabled={disabled}
            style={[
              styles.limitChip,
              settings.manualLimitKmh === limit && styles.limitChipSelected,
            ]}
          >
            <Text
              style={[styles.limitChipText, settings.manualLimitKmh === limit && styles.limitChipTextSelected]}
            >
              {limit}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>EARLY WARNING</Text>
      <View style={styles.segmented}>
        {WARNING_OPTIONS.map((offset) => (
          <Pressable
            key={offset}
            onPress={() => !disabled && update('warningOffsetKmh', offset)}
            disabled={disabled}
            style={[styles.segment, settings.warningOffsetKmh === offset && styles.segmentSelected]}
          >
            <Text style={[styles.segmentText, settings.warningOffsetKmh === offset && styles.segmentTextSelected]}>
              {offset} km/h before
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>ALERTS & PRIVACY</Text>
      <View style={styles.group}>
        <SettingToggle
          icon="bell-ring-outline"
          title="Local notifications"
          body="No cloud push service or account is required."
          value={settings.notificationsEnabled}
          onValueChange={(value) =>
            onChange({
              ...settings,
              notificationsEnabled: value,
              backgroundEnabled: value ? settings.backgroundEnabled : false,
            })
          }
          disabled={disabled}
        />
        <SettingToggle
          icon="volume-high"
          title="Voice while active"
          body="iPhone silent mode, Focus and calls can suppress audio."
          value={settings.voiceEnabled}
          onValueChange={(value) => update('voiceEnabled', value)}
          disabled={disabled}
        />
        <SettingToggle
          icon="vibrate"
          title="Haptic warning"
          body="Short local vibration when an alert is raised."
          value={settings.hapticsEnabled}
          onValueChange={(value) => update('hapticsEnabled', value)}
          disabled={disabled}
        />
        <SettingToggle
          icon="cellphone-lock"
          title="Background drive session"
          body="Requires local notifications. Only during a session you start; never auto-starts."
          value={settings.backgroundEnabled}
          onValueChange={(value) => update('backgroundEnabled', value)}
          disabled={disabled || !settings.notificationsEnabled}
        />
      </View>

      <Pressable
        style={[styles.testButton, disabled && styles.disabledAction]}
        onPress={() => void testAlert()}
        disabled={disabled}
      >
        <MaterialCommunityIcons name="bell-check-outline" size={21} color={colors.ink} />
        <Text style={styles.testText}>TEST ALERT</Text>
      </Pressable>

      <View style={styles.privacyCard}>
        <MaterialCommunityIcons name="incognito" size={22} color={colors.green} />
        <View style={styles.privacyCopy}>
          <Text style={styles.privacyTitle}>Private by design</Text>
          <Text style={styles.privacyText}>
            No account, ads, analytics or route upload. A short speed-smoothing buffer stays on this device and is cleared when the drive stops.
          </Text>
          <Pressable
            onPress={() =>
              void Linking.openURL(
                'https://github.com/CodeWithJuber/roadlimit-uae/blob/main/PRIVACY.md',
              )
            }
            disabled={disabled}
          >
            <Text style={[styles.privacyLink, disabled && styles.disabledText]}>
              Read privacy policy
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 120, gap: 14 },
  eyebrow: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1.2 },
  lockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 13,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.medium,
  },
  lockedText: { color: colors.amber, flex: 1, fontSize: 12, fontWeight: '600' },
  sectionTitle: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 8 },
  group: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.large,
    overflow: 'hidden',
  },
  modeRow: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  modeRowSelected: { backgroundColor: colors.greenSoft },
  modeIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconSelected: { backgroundColor: '#17493A' },
  modeCopy: { flex: 1, gap: 4 },
  modeTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  modeBody: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  disabledText: { color: colors.muted },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.line, padding: 3 },
  radioSelected: { borderColor: colors.green },
  radioDot: { flex: 1, borderRadius: 10, backgroundColor: colors.green },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  limitChip: {
    width: 58,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.small,
  },
  limitChipSelected: { backgroundColor: colors.green, borderColor: colors.green },
  limitChipText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  limitChipTextSelected: { color: colors.ink },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  segment: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  segmentSelected: { backgroundColor: colors.surfaceRaised },
  segmentText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  segmentTextSelected: { color: colors.green },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCopy: { flex: 1, gap: 3 },
  toggleTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  toggleBody: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  testButton: {
    minHeight: 54,
    borderRadius: radius.medium,
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  testText: { color: colors.ink, fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  disabledAction: { opacity: 0.4 },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.greenSoft,
    borderRadius: radius.large,
    padding: 16,
  },
  privacyCopy: { flex: 1, gap: 5 },
  privacyTitle: { color: '#D9FFF0', fontSize: 14, fontWeight: '800' },
  privacyText: { color: '#B6E4D3', fontSize: 11, lineHeight: 17 },
  privacyLink: { color: colors.blue, fontSize: 12, fontWeight: '800', marginTop: 4 },
});
