import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LimitSign } from '../components/LimitSign';
import { DEMO_ROADS } from '../data/demoRoads';
import { DUBAI_POLICE_SPEED_LIMITS_URL } from '../data/sources';
import type { DriveSettings, RoadLimitRecord } from '../domain/types';
import { colors, radius } from '../theme';

type Props = {
  settings: DriveSettings;
  disabled: boolean;
  onSelect: (road: RoadLimitRecord, limitKmh: number) => void;
};

export const RoadsScreen = ({ settings, disabled, onSelect }: Props) => {
  const [query, setQuery] = useState('');
  const roads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return DEMO_ROADS;
    return DEMO_ROADS.filter((road) =>
      [road.canonicalName, ...road.aliases].some((name) => name.toLowerCase().includes(normalized)),
    );
  }, [query]);

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>PARKED REFERENCE</Text>
      <Text style={styles.title}>Road limits</Text>
      <Text style={styles.subtitle}>
        A deliberately small demo catalog. Confirm the sign for your exact section before selecting a value.
      </Text>

      {disabled ? (
        <View style={styles.lockedNotice}>
          <MaterialCommunityIcons name="lock-outline" size={20} color={colors.amber} />
          <Text style={styles.lockedText}>Stop the drive before changing the selected road or limit.</Text>
        </View>
      ) : null}

      <View style={styles.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={22} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search road name or route ref"
          placeholderTextColor={colors.muted}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled}
        />
      </View>

      <View style={styles.notice}>
        <MaterialCommunityIcons name="database-lock-outline" size={22} color={colors.amber} />
        <Text style={styles.noticeText}>
          The full 62-row press table is not bundled: it lacks segment geometry and the official open-data licence is unspecified. Contributors can propose licensed data packs for review.
        </Text>
      </View>

      {roads.map((road) => (
        <View key={road.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>{road.canonicalName}</Text>
              <Text style={styles.aliases}>{road.aliases.join(' · ')}</Text>
            </View>
            <View style={styles.confidencePill}>
              <Text style={styles.confidence}>{road.confidence.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>CANDIDATE VALUES — VERIFY THE PHYSICAL SIGN</Text>
          <View style={styles.limitRow}>
            {road.postedLimitsKmh.map((limit) => {
              const selected =
                settings.selectedRoadId === road.id && settings.manualLimitKmh === limit;
              return (
                <Pressable
                  key={limit}
                  onPress={() => !disabled && onSelect(road, limit)}
                  disabled={disabled}
                  style={[
                    styles.limitChoice,
                    selected && styles.limitChoiceSelected,
                    disabled && styles.limitChoiceDisabled,
                  ]}
                >
                  <LimitSign
                    limitKmh={limit}
                    compact
                    accessibilityLabel={`Candidate limit ${limit} kilometres per hour; verify the physical sign`}
                  />
                  <Text style={[styles.useText, selected && styles.useTextSelected]}>
                    {selected ? 'SELECTED' : 'USE THIS'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.note}>{road.note}</Text>
        </View>
      ))}

      <Pressable
        style={[styles.sourceButton, disabled && styles.disabledAction]}
        onPress={() => void Linking.openURL(DUBAI_POLICE_SPEED_LIMITS_URL)}
        disabled={disabled}
      >
        <Text style={styles.sourceText}>Open current Dubai Police source</Text>
        <MaterialCommunityIcons name="open-in-new" size={18} color={colors.blue} />
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 120, gap: 14 },
  eyebrow: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1.2 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 4 },
  lockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.medium,
  },
  lockedText: { color: colors.amber, flex: 1, fontSize: 12, fontWeight: '700' },
  searchWrap: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.line,
  },
  search: { flex: 1, height: 54, color: colors.text, fontSize: 15 },
  notice: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.medium,
    padding: 15,
  },
  noticeText: { flex: 1, color: '#FFE6AC', fontSize: 12, lineHeight: 18 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.large,
    padding: 17,
    gap: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitleWrap: { flex: 1, gap: 3 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  aliases: { color: colors.muted, fontSize: 11 },
  confidencePill: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  confidence: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  sectionLabel: { color: colors.amber, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  limitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  limitChoice: {
    minWidth: 94,
    alignItems: 'center',
    gap: 8,
    padding: 11,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.medium,
  },
  limitChoiceSelected: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  limitChoiceDisabled: { opacity: 0.4 },
  useText: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  useTextSelected: { color: colors.green },
  note: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  sourceButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.medium,
  },
  sourceText: { color: colors.blue, fontSize: 13, fontWeight: '700' },
  disabledAction: { opacity: 0.4 },
});
