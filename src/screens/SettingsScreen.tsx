import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { DUBAI_POLICE_SPEED_LIMITS_URL } from '../data/sources';
import type { DetectionMode, DriveSettings } from '../domain/types';
import { configureAlerts, deliverAlert } from '../services/notifications';
import { colors, radius, spacing, typeScale } from '../theme';

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
    title: 'Confirm a posted limit',
    body: 'Choose a value, then confirm the sign before starting.',
    icon: 'speedometer',
  },
  {
    id: 'manual-road',
    title: 'Use selected road reference',
    body: 'Start from a road-name candidate, then confirm your section.',
    icon: 'road-variant',
  },
];

const SectionHeading = ({ title }: { title: string }) => (
  <Text accessibilityRole="header" style={styles.sectionHeading}>
    {title}
  </Text>
);

const SettingToggle = ({
  icon,
  title,
  body,
  value,
  onValueChange,
  disabled,
  last = false,
}: {
  icon: string;
  title: string;
  body: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled: boolean;
  last?: boolean;
}) => (
  <View style={[styles.toggleRow, last && styles.lastRow, disabled && styles.disabled]}>
    <View style={styles.rowIcon}>
      <MaterialCommunityIcons name={icon as never} size={20} color={colors.muted} />
    </View>
    <View style={styles.rowCopy}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowBody}>{body}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={title}
      accessibilityHint={body}
      trackColor={{ false: colors.lineStrong, true: colors.cyanStrong }}
      thumbColor={colors.white}
      ios_backgroundColor={colors.lineStrong}
    />
  </View>
);

export const SettingsScreen = ({ settings, disabled, onChange }: Props) => {
  const update = <K extends keyof DriveSettings>(key: K, value: DriveSettings[K]) =>
    onChange({ ...settings, [key]: value });

  const testAlert = async () => {
    try {
      const notificationsReady = await configureAlerts();
      const delivery = await deliverAlert(
        {
          severity: 'approaching',
          title: 'RoadLimit UAE test',
          body: `Alert ready · selected limit ${settings.manualLimitKmh} km/h`,
          speak: `Test alert. Selected limit ${settings.manualLimitKmh}.`,
        },
        settings,
        { allowSpeech: true },
      );
      if (!notificationsReady && !delivery.hapticDelivered && !delivery.speechStarted) {
        Alert.alert(
          'No alert output available',
          'Enable at least one alert output and allow its device permission before starting a drive.',
        );
      }
    } catch {
      Alert.alert(
        'Alert test unavailable',
        'RoadLimit could not test the selected outputs. Check notification and sound settings, then try again.',
      );
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Configure the drive while parked. RoadLimit never chooses a posted limit for you.
        </Text>
      </View>

      {disabled ? (
        <View accessibilityRole="alert" style={styles.lockedNotice}>
          <MaterialCommunityIcons name="lock-outline" size={20} color={colors.amber} />
          <Text style={styles.lockedText}>
            Settings are locked during a drive. Stop while parked to make changes.
          </Text>
        </View>
      ) : null}

      <SectionHeading title="Limit source" />
      <View style={styles.group} accessibilityRole="radiogroup">
        {MODES.map((mode, index) => {
          const selected = settings.detectionMode === mode.id;
          const unavailable = mode.id === 'manual-road' && !settings.selectedRoadId;
          const modeDisabled = disabled || unavailable;
          return (
            <Pressable
              key={mode.id}
              style={({ pressed }) => [
                styles.modeRow,
                index === MODES.length - 1 && styles.lastRow,
                selected && styles.modeRowSelected,
                modeDisabled && styles.disabled,
                pressed && !modeDisabled && styles.pressed,
              ]}
              onPress={() => !modeDisabled && update('detectionMode', mode.id)}
              disabled={modeDisabled}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: modeDisabled }}
              accessibilityLabel={mode.title}
              accessibilityHint={unavailable ? 'Select a road reference first' : mode.body}
            >
              <View style={[styles.rowIcon, selected && styles.rowIconSelected]}>
                <MaterialCommunityIcons
                  name={mode.icon as never}
                  size={21}
                  color={selected ? colors.cyan : colors.muted}
                />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{mode.title}</Text>
                <Text style={styles.rowBody}>
                  {unavailable ? 'Select a candidate in Roads first.' : mode.body}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={selected ? 'check-circle' : 'circle-outline'}
                size={22}
                color={selected ? colors.cyan : colors.faint}
              />
            </Pressable>
          );
        })}
      </View>

      <SectionHeading title="Posted limit" />
      <Text style={styles.helper}>
        Default selection only. Confirm the posted sign again before every drive.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.limitScroller}
        accessibilityRole="radiogroup"
      >
        {LIMIT_OPTIONS.map((limit) => {
          const selected = settings.manualLimitKmh === limit;
          return (
            <Pressable
              key={limit}
              onPress={() => !disabled && update('manualLimitKmh', limit)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityLabel={`${limit} kilometres per hour`}
              accessibilityState={{ selected, disabled }}
              style={({ pressed }) => [
                styles.limitChip,
                selected && styles.limitChipSelected,
                disabled && styles.disabled,
                pressed && !disabled && styles.pressed,
              ]}
            >
              <Text style={[styles.limitText, selected && styles.limitTextSelected]}>{limit}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <SectionHeading title="Early warning" />
      <View style={styles.segmented} accessibilityRole="radiogroup">
        {WARNING_OPTIONS.map((offset) => {
          const selected = settings.warningOffsetKmh === offset;
          return (
            <Pressable
              key={offset}
              onPress={() => !disabled && update('warningOffsetKmh', offset)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={`Warn ${offset} kilometres per hour before the confirmed limit`}
              style={({ pressed }) => [
                styles.segment,
                selected && styles.segmentSelected,
                disabled && styles.disabled,
                pressed && !disabled && styles.pressed,
              ]}
            >
              <Text style={[styles.segmentValue, selected && styles.segmentValueSelected]}>
                {offset} km/h
              </Text>
              <Text style={[styles.segmentCaption, selected && styles.segmentCaptionSelected]}>
                before
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeading title="Alerts & feedback" />
      <View style={styles.group}>
        <SettingToggle
          icon="bell-outline"
          title="Local notifications"
          body="Show warnings on this device."
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
          icon="microphone-outline"
          title="Voice alerts"
          body="Speak warnings while the drive is active."
          value={settings.voiceEnabled}
          onValueChange={(value) => update('voiceEnabled', value)}
          disabled={disabled}
        />
        <SettingToggle
          icon="vibrate"
          title="Haptic feedback"
          body="Vibrate when RoadLimit warns you."
          value={settings.hapticsEnabled}
          onValueChange={(value) => update('hapticsEnabled', value)}
          disabled={disabled}
          last={Platform.OS !== 'ios'}
        />
        {Platform.OS === 'ios' ? (
          <SettingToggle
            icon="cellphone-lock"
            title="Background drive session"
            body="Requires notifications and Always Location. It runs only after you start."
            value={settings.backgroundEnabled}
            onValueChange={(value) => update('backgroundEnabled', value)}
            disabled={disabled || !settings.notificationsEnabled}
            last
          />
        ) : null}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.testButton,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}
        onPress={() => void testAlert()}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Test the selected alert outputs"
      >
        <MaterialCommunityIcons name="bell-check-outline" size={21} color={colors.cyan} />
        <Text style={styles.testText}>Test alert outputs</Text>
      </Pressable>

      {Platform.OS === 'android' ? (
        <View style={styles.androidNotice}>
          <View style={styles.androidIcon}>
            <MaterialCommunityIcons name="android" size={24} color={colors.violet} />
          </View>
          <View style={styles.androidCopy}>
            <Text style={styles.androidEyebrow}>Android beta</Text>
            <Text style={styles.androidTitle}>Screen-on tracking only</Text>
            <Text style={styles.androidText}>
              Keep RoadLimit visible with the screen on. Background tracking is disabled in this
              build.
            </Text>
          </View>
        </View>
      ) : null}

      <SectionHeading title="Privacy & data" />
      <View style={styles.group}>
        <Pressable
          onPress={() =>
            void Linking.openURL(
              'https://github.com/CodeWithJuber/roadlimit-uae/blob/main/PRIVACY.md',
            )
          }
          disabled={disabled}
          accessibilityRole="link"
          accessibilityLabel="Open RoadLimit UAE privacy policy"
          style={({ pressed }) => [
            styles.linkRow,
            disabled && styles.disabled,
            pressed && !disabled && styles.pressed,
          ]}
        >
          <View style={styles.rowIcon}>
            <MaterialCommunityIcons name="shield-lock-outline" size={21} color={colors.muted} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Data & privacy</Text>
            <Text style={styles.rowBody}>No account, ads, analytics, or route upload.</Text>
          </View>
          <MaterialCommunityIcons name="open-in-new" size={18} color={colors.faint} />
        </Pressable>
        <Pressable
          onPress={() => void Linking.openURL(DUBAI_POLICE_SPEED_LIMITS_URL)}
          disabled={disabled}
          accessibilityRole="link"
          accessibilityLabel="Open road reference source"
          style={({ pressed }) => [
            styles.linkRow,
            styles.lastRow,
            disabled && styles.disabled,
            pressed && !disabled && styles.pressed,
          ]}
        >
          <View style={styles.rowIcon}>
            <MaterialCommunityIcons name="database-outline" size={21} color={colors.muted} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Source & data</Text>
            <Text style={styles.rowBody}>Open the source used by the road-name references.</Text>
          </View>
          <MaterialCommunityIcons name="open-in-new" size={18} color={colors.faint} />
        </Pressable>
      </View>

      <Text style={styles.footerText}>
        Follow posted and temporary signs and authority instructions. Never change settings while
        moving.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: 104,
    gap: spacing.sm,
  },
  header: { gap: spacing.xs, marginBottom: spacing.xs },
  title: {
    color: colors.text,
    fontSize: typeScale.title,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.9,
  },
  subtitle: { color: colors.muted, fontSize: typeScale.body, lineHeight: 21 },
  lockedNotice: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: '#5B4315',
    borderRadius: radius.medium,
  },
  lockedText: { flex: 1, color: colors.amber, fontSize: typeScale.label, lineHeight: 18, fontWeight: '600' },
  sectionHeading: {
    color: colors.muted,
    fontSize: typeScale.micro,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.75,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
    marginLeft: spacing.xxs,
  },
  helper: {
    color: colors.faint,
    fontSize: typeScale.label,
    lineHeight: 18,
    marginTop: -4,
    marginLeft: spacing.xxs,
  },
  group: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.large,
  },
  modeRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineStrong,
  },
  modeRowSelected: { backgroundColor: colors.cyanWash },
  rowIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
  },
  rowIconSelected: { borderWidth: 1, borderColor: colors.cyan },
  rowCopy: { flex: 1, gap: 3 },
  rowTitle: { color: colors.text, fontSize: typeScale.body, lineHeight: 20, fontWeight: '700' },
  rowBody: { color: colors.muted, fontSize: typeScale.label, lineHeight: 17 },
  lastRow: { borderBottomWidth: 0 },
  limitScroller: { gap: spacing.xs, paddingRight: spacing.md },
  limitChip: {
    minWidth: 58,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.small,
  },
  limitChipSelected: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  limitText: {
    color: colors.text,
    fontSize: typeScale.bodyLarge,
    lineHeight: 21,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  limitTextSelected: { color: colors.ink },
  segmented: { flexDirection: 'row', gap: spacing.xs },
  segment: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.medium,
  },
  segmentSelected: { backgroundColor: colors.cyanSoft, borderColor: colors.cyan },
  segmentValue: { color: colors.text, fontSize: typeScale.body, lineHeight: 19, fontWeight: '700' },
  segmentValueSelected: { color: colors.cyan },
  segmentCaption: { color: colors.faint, fontSize: typeScale.micro, lineHeight: 14 },
  segmentCaptionSelected: { color: colors.muted },
  toggleRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineStrong,
  },
  testButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: radius.medium,
    backgroundColor: colors.cyanWash,
  },
  testText: { color: colors.cyan, fontSize: typeScale.body, lineHeight: 20, fontWeight: '700' },
  androidNotice: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.violetSoft,
    borderWidth: 1,
    borderColor: '#373063',
    borderRadius: radius.large,
  },
  androidIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#28204B',
  },
  androidCopy: { flex: 1, gap: 3 },
  androidEyebrow: {
    color: colors.violet,
    fontSize: typeScale.micro,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  androidTitle: { color: colors.text, fontSize: typeScale.bodyLarge, lineHeight: 21, fontWeight: '700' },
  androidText: { color: colors.muted, fontSize: typeScale.label, lineHeight: 18 },
  linkRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineStrong,
  },
  footerText: {
    color: colors.faint,
    fontSize: typeScale.micro,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.68 },
});
