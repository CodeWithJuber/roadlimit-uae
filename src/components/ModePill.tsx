import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Platform, StyleSheet, Text, View } from 'react-native';

import type { DriveSnapshot } from '../domain/types';
import { colors, radius } from '../theme';

type Props = { snapshot: DriveSnapshot };

const copy = (snapshot: DriveSnapshot) => {
  if (snapshot.status === 'error') {
    return {
      label: 'Needs attention',
      color: colors.red,
      icon: 'alert-circle-outline',
    };
  }
  if (snapshot.status === 'degraded') {
    return {
      label: 'GPS degraded · alerts paused',
      color: colors.amber,
      icon: 'signal-off',
    };
  }
  if (snapshot.status === 'starting') {
    return {
      label: 'Starting GPS',
      color: colors.amber,
      icon: 'crosshairs-gps',
    };
  }
  if (snapshot.active) {
    return {
      label: Platform.OS === 'android' ? 'Tracking · screen on' : 'Tracking',
      color: colors.cyan,
      icon: 'navigation-variant',
    };
  }
  return {
    label: Platform.OS === 'android' ? 'Ready · screen on' : 'Ready to confirm',
    color: colors.green,
    icon: 'circle',
  };
};

export const ModePill = ({ snapshot }: Props) => {
  const value = copy(snapshot);
  return (
    <View
      accessible
      accessibilityLabel={`Drive status: ${value.label}`}
      accessibilityLiveRegion="polite"
      style={styles.pill}
    >
      <MaterialCommunityIcons name={value.icon as never} size={14} color={value.color} />
      <Text style={[styles.text, { color: value.color }]}>{value.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    minHeight: 36,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  text: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.25,
  },
});
