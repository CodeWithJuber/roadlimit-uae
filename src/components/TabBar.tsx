import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme';

export type TabId = 'drive' | 'roads' | 'settings';

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'drive', label: 'Drive', icon: 'speedometer' },
  { id: 'roads', label: 'Roads', icon: 'road-variant' },
  { id: 'settings', label: 'Settings', icon: 'cog-outline' },
];

type Props = { active: TabId; locked: boolean; onChange: (tab: TabId) => void };

export const TabBar = ({ active, locked, onChange }: Props) => (
  <View style={styles.shell} accessibilityRole="tablist" accessibilityLabel="Primary navigation">
    {tabs.map((tab) => {
      const selected = tab.id === active;
      const disabled = locked && tab.id !== 'drive';
      return (
        <Pressable
          key={tab.id}
          style={({ pressed }) => [
            styles.tab,
            disabled && styles.tabDisabled,
            pressed && !disabled && styles.tabPressed,
          ]}
          onPress={() => onChange(tab.id)}
          disabled={disabled}
          accessibilityRole="tab"
          accessibilityLabel={disabled ? `${tab.label}, locked during drive` : tab.label}
          accessibilityHint={disabled ? 'Stop the drive to open this tab' : undefined}
          accessibilityState={{ disabled, selected }}
        >
          <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
            <MaterialCommunityIcons
              name={tab.icon as never}
              size={23}
              color={selected ? colors.cyan : colors.muted}
            />
            {disabled ? (
              <View style={styles.lockBadge}>
                <MaterialCommunityIcons name="lock" size={10} color={colors.muted} />
              </View>
            ) : null}
          </View>
          <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
          {selected ? <View style={styles.activeMark} /> : null}
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 78,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: spacing.xs,
    paddingTop: 6,
    backgroundColor: colors.navSurface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
  },
  tab: {
    position: 'relative',
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabPressed: { opacity: 0.68 },
  tabDisabled: { opacity: 0.38 },
  iconWrap: {
    position: 'relative',
    width: 38,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  iconWrapSelected: {
    backgroundColor: colors.cyanSoft,
  },
  lockBadge: {
    position: 'absolute',
    right: -1,
    top: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.cyan,
    fontWeight: '700',
  },
  activeMark: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.cyan,
  },
});
