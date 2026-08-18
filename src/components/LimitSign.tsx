import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../theme';

type Props = {
  limitKmh: number | null;
  compact?: boolean;
  accessibilityLabel?: string;
};

export const LimitSign = ({ limitKmh, compact = false, accessibilityLabel }: Props) => (
  <View
    style={[styles.shell, compact && styles.shellCompact]}
    accessible
    accessibilityRole="image"
    accessibilityLabel={accessibilityLabel ?? `Limit value ${limitKmh ?? 'unknown'}`}
  >
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.75}
      style={[styles.value, compact && styles.valueCompact]}
    >
      {limitKmh ?? '—'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  shell: {
    width: 92,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.large,
    borderWidth: 2,
    borderColor: colors.cyan,
    backgroundColor: colors.cyanWash,
    shadowColor: colors.cyan,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  shellCompact: {
    width: 60,
    height: 52,
    borderRadius: radius.small,
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  value: {
    width: '100%',
    color: colors.text,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '700',
    letterSpacing: -1.6,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  valueCompact: {
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.8,
  },
});
