import { StyleSheet, Text, View } from 'react-native';

import type { DriveSnapshot } from '../domain/types';
import { colors, radius } from '../theme';

type Props = { snapshot: DriveSnapshot };

const copy = (snapshot: DriveSnapshot) => {
  if (snapshot.status === 'error') return { label: 'NEEDS ATTENTION', color: colors.red };
  if (!snapshot.active) return { label: 'READY', color: colors.blue };
  if (snapshot.status === 'degraded') return { label: 'SIGNAL DEGRADED', color: colors.amber };
  if (snapshot.status === 'starting') return { label: 'STARTING', color: colors.amber };
  return { label: 'TRACKING', color: colors.green };
};

export const ModePill = ({ snapshot }: Props) => {
  const value = copy(snapshot);
  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: value.color }]} />
      <Text style={styles.text}>{value.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { color: colors.text, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
});
