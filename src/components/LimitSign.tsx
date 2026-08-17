import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  limitKmh: number | null;
  compact?: boolean;
  accessibilityLabel?: string;
};

export const LimitSign = ({ limitKmh, compact = false, accessibilityLabel }: Props) => (
  <View
    style={[styles.outer, compact && styles.outerCompact]}
    accessibilityLabel={accessibilityLabel ?? `Limit value ${limitKmh ?? 'unknown'}`}
  >
    <View style={[styles.inner, compact && styles.innerCompact]}>
      <Text style={[styles.value, compact && styles.valueCompact]}>{limitKmh ?? '—'}</Text>
      <Text style={[styles.unit, compact && styles.unitCompact]}>km/h</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  outer: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.red,
    padding: 8,
    shadowColor: colors.red,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  outerCompact: { width: 66, height: 66, borderRadius: 33, padding: 4 },
  inner: {
    flex: 1,
    borderRadius: 58,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCompact: { borderRadius: 29 },
  value: { color: '#111820', fontSize: 44, fontWeight: '900', letterSpacing: -2 },
  valueCompact: { fontSize: 23, letterSpacing: -1 },
  unit: { color: '#4A5563', fontSize: 12, fontWeight: '800', marginTop: -4 },
  unitCompact: { fontSize: 8, marginTop: -2 },
});
