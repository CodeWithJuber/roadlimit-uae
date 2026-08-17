import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../theme';

export type TabId = 'drive' | 'roads' | 'settings';

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'drive', label: 'Drive', icon: 'navigation-variant' },
  { id: 'roads', label: 'Roads', icon: 'road-variant' },
  { id: 'settings', label: 'Settings', icon: 'tune-variant' },
];

type Props = { active: TabId; locked: boolean; onChange: (tab: TabId) => void };

export const TabBar = ({ active, locked, onChange }: Props) => (
  <View style={styles.shell}>
    {tabs.map((tab) => {
      const selected = tab.id === active;
      const disabled = locked && tab.id !== 'drive';
      return (
        <Pressable
          key={tab.id}
          style={[styles.tab, disabled && styles.tabDisabled]}
          onPress={() => onChange(tab.id)}
          disabled={disabled}
          accessibilityState={{ disabled, selected }}
        >
          <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
            <MaterialCommunityIcons
              name={tab.icon as never}
              size={21}
              color={selected ? colors.ink : colors.muted}
            />
          </View>
          <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
    minHeight: 72,
    padding: 7,
    borderRadius: radius.large,
    backgroundColor: '#111E30F2',
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabDisabled: { opacity: 0.35 },
  iconWrap: {
    width: 42,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: { backgroundColor: colors.green },
  label: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  labelSelected: { color: colors.text },
});
