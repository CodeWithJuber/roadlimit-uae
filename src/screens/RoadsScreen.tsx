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
import { colors, radius, spacing, typeScale } from '../theme';

type Props = {
  settings: DriveSettings;
  disabled: boolean;
  onSelect: (road: RoadLimitRecord, limitKmh: number) => void;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return `${day} ${MONTHS[month - 1]} ${year}`;
};

export const RoadsScreen = ({ settings, disabled, onSelect }: Props) => {
  const [query, setQuery] = useState('');
  const roads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return DEMO_ROADS;
    return DEMO_ROADS.filter((road) =>
      [road.canonicalName, ...road.aliases].some((name) =>
        name.toLowerCase().includes(normalized),
      ),
    );
  }, [query]);
  const sourceChecked = DEMO_ROADS[0]?.source.verifiedAt;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Road references</Text>
        <Text style={styles.subtitle}>
          Road-name candidates from a linked Dubai Police source. Confirm the posted sign for your
          section.
        </Text>
      </View>

      {disabled ? (
        <View accessibilityRole="alert" style={styles.lockedNotice}>
          <MaterialCommunityIcons name="lock-outline" size={20} color={colors.amber} />
          <Text style={styles.lockedText}>
            References are locked during a drive. Stop while parked to change the limit.
          </Text>
        </View>
      ) : null}

      <View style={styles.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={21} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Dubai roads"
          placeholderTextColor={colors.faint}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled}
          accessibilityLabel="Search road references"
          returnKeyType="search"
        />
      </View>

      <View style={styles.evidenceNotice}>
        <View style={styles.evidenceIcon}>
          <MaterialCommunityIcons name="map-marker-alert-outline" size={22} color={colors.cyan} />
        </View>
        <View style={styles.evidenceCopy}>
          <Text style={styles.evidenceTitle}>{DEMO_ROADS.length} road-name references</Text>
          <Text style={styles.evidenceText}>
            Source checked {sourceChecked ? formatDate(sourceChecked) : 'date unavailable'} · no
            segment geometry is bundled.
          </Text>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Available candidates</Text>
        <Text style={styles.listCount}>{roads.length}</Text>
      </View>

      {roads.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="road-variant" size={27} color={colors.faint} />
          <Text style={styles.emptyTitle}>No matching reference</Text>
          <Text style={styles.emptyText}>Try “Al Khail” or a route reference such as “E11”.</Text>
        </View>
      ) : null}

      {roads.map((road) => {
        const coverageLabel =
          road.postedLimitsKmh.length > 1
            ? 'Multiple values · exact section unknown'
            : 'Road-name only · exact section unknown';
        const selectedRoad = settings.selectedRoadId === road.id;
        return (
          <View
            key={road.id}
            style={[styles.card, selectedRoad && styles.cardSelected]}
            accessibilityLabel={`${road.canonicalName}, ${coverageLabel}`}
          >
            <View style={styles.cardHeader}>
              <View style={styles.roadIcon}>
                <MaterialCommunityIcons name="map-marker-outline" size={21} color={colors.text} />
              </View>
              <View style={styles.roadCopy}>
                <Text style={styles.roadName}>{road.canonicalName}</Text>
                <Text style={styles.aliases}>{road.aliases.join(' · ')}</Text>
              </View>
              <View style={styles.checkedBadge}>
                <MaterialCommunityIcons name="source-branch" size={13} color={colors.cyan} />
                <Text style={styles.checkedText}>Source checked</Text>
              </View>
            </View>

            <View style={styles.candidateRow} accessibilityRole="radiogroup">
              {road.postedLimitsKmh.map((limit) => {
                const selected = selectedRoad && settings.manualLimitKmh === limit;
                return (
                  <Pressable
                    key={limit}
                    onPress={() => !disabled && onSelect(road, limit)}
                    disabled={disabled}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled }}
                    accessibilityLabel={`${limit} kilometres per hour candidate for ${road.canonicalName}`}
                    accessibilityHint="Confirm the posted sign for the current section before starting"
                    style={({ pressed }) => [
                      styles.candidate,
                      selected && styles.candidateSelected,
                      disabled && styles.disabled,
                      pressed && !disabled && styles.pressed,
                    ]}
                  >
                    <LimitSign
                      limitKmh={limit}
                      compact
                      accessibilityLabel={`${limit} kilometres per hour candidate`}
                    />
                    <View style={styles.candidateState}>
                      <MaterialCommunityIcons
                        name={selected ? 'check-circle' : 'circle-outline'}
                        size={15}
                        color={selected ? colors.cyan : colors.faint}
                      />
                      <Text style={[styles.candidateText, selected && styles.candidateTextSelected]}>
                        {selected ? 'Selected' : 'Candidate'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.metaRow}>
              <MaterialCommunityIcons
                name="map-marker-question-outline"
                size={17}
                color={colors.amber}
              />
              <Text style={styles.coverageText}>{coverageLabel}</Text>
              <Text style={styles.checkedDate}>
                Checked {formatDate(road.source.verifiedAt)}
              </Text>
            </View>

            <Text style={styles.note}>{road.note}</Text>
          </View>
        );
      })}

      <View style={styles.truthFooter}>
        <MaterialCommunityIcons name="information-outline" size={20} color={colors.muted} />
        <Text style={styles.truthText}>
          Limits can vary by direction and section. Follow posted and temporary signs and authority
          instructions.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.sourceButton,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}
        onPress={() => void Linking.openURL(DUBAI_POLICE_SPEED_LIMITS_URL)}
        disabled={disabled}
        accessibilityRole="link"
        accessibilityLabel="Open the Dubai Police street speed limits source"
      >
        <MaterialCommunityIcons name="shield-link-variant-outline" size={21} color={colors.cyan} />
        <Text style={styles.sourceText}>Open Dubai Police source</Text>
        <MaterialCommunityIcons name="open-in-new" size={18} color={colors.muted} />
      </Pressable>
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
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: '#5B4315',
  },
  lockedText: { flex: 1, color: colors.amber, fontSize: typeScale.label, lineHeight: 18, fontWeight: '600' },
  searchWrap: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.medium,
  },
  search: { flex: 1, minHeight: 52, color: colors.text, fontSize: typeScale.bodyLarge },
  evidenceNotice: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.cyanWash,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.medium,
  },
  evidenceIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.cyanSoft,
  },
  evidenceCopy: { flex: 1, gap: 3 },
  evidenceTitle: { color: colors.text, fontSize: typeScale.body, lineHeight: 19, fontWeight: '700' },
  evidenceText: { color: colors.muted, fontSize: typeScale.label, lineHeight: 18 },
  listHeader: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxs,
  },
  listTitle: { color: colors.muted, fontSize: typeScale.label, lineHeight: 17, fontWeight: '700' },
  listCount: {
    minWidth: 26,
    minHeight: 26,
    color: colors.cyan,
    fontSize: typeScale.label,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: colors.cyanSoft,
    borderRadius: 13,
  },
  emptyState: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.large,
  },
  emptyTitle: { color: colors.text, fontSize: typeScale.bodyLarge, fontWeight: '700' },
  emptyText: { color: colors.muted, fontSize: typeScale.label, lineHeight: 18, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.large,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardSelected: { borderColor: colors.cyan, backgroundColor: colors.cyanWash },
  cardHeader: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  roadIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
  },
  roadCopy: { flex: 1, minWidth: 0, gap: 2 },
  roadName: { color: colors.text, fontSize: typeScale.bodyLarge, lineHeight: 21, fontWeight: '700' },
  aliases: { color: colors.faint, fontSize: typeScale.micro, lineHeight: 15 },
  checkedBadge: {
    minHeight: 30,
    maxWidth: 104,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    borderRadius: radius.small,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.canvasRaised,
  },
  checkedText: { flexShrink: 1, color: colors.cyan, fontSize: 10, lineHeight: 13, fontWeight: '600' },
  candidateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  candidate: {
    minWidth: 82,
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: 6,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  candidateSelected: { borderColor: colors.cyan, backgroundColor: colors.cyanSoft },
  candidateState: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  candidateText: { color: colors.muted, fontSize: typeScale.micro, lineHeight: 14, fontWeight: '600' },
  candidateTextSelected: { color: colors.cyan },
  metaRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 6 },
  coverageText: {
    flex: 1,
    color: colors.amber,
    fontSize: typeScale.micro,
    lineHeight: 16,
    fontWeight: '600',
  },
  checkedDate: { color: colors.faint, fontSize: typeScale.micro, lineHeight: 16 },
  note: { color: colors.muted, fontSize: typeScale.label, lineHeight: 18 },
  truthFooter: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
  },
  truthText: { flex: 1, color: colors.muted, fontSize: typeScale.label, lineHeight: 18 },
  sourceButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.medium,
  },
  sourceText: { flex: 1, color: colors.text, fontSize: typeScale.body, lineHeight: 20, fontWeight: '700' },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.68 },
});
