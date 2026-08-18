import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { TabBar, type TabId } from './src/components/TabBar';
import type { RoadLimitRecord } from './src/domain/types';
import { useDriveTelemetry } from './src/hooks/useDriveTelemetry';
import { DriveScreen } from './src/screens/DriveScreen';
import { RoadsScreen } from './src/screens/RoadsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors } from './src/theme';

const Root = () => {
  const [tab, setTab] = useState<TabId>('drive');
  const {
    settings,
    snapshot,
    busy,
    ready,
    startBlocked,
    updateSettings,
    start,
    stop,
  } = useDriveTelemetry();

  // The current Android beta is deliberately foreground-only. Normalize older
  // or default settings before enabling Start so the runtime and the UI make the
  // same promise: keep RoadLimit visible and the screen on during the drive.
  const normalizingAndroidMode =
    Platform.OS === 'android' && ready && settings.backgroundEnabled;

  useEffect(() => {
    if (
      Platform.OS !== 'android' ||
      !ready ||
      snapshot.active ||
      !settings.backgroundEnabled
    ) {
      return;
    }
    void updateSettings({ ...settings, backgroundEnabled: false });
  }, [ready, settings, snapshot.active, updateSettings]);

  const selectRoad = (road: RoadLimitRecord, limitKmh: number) => {
    void updateSettings({
      ...settings,
      detectionMode: 'manual-road',
      selectedRoadId: road.id,
      manualLimitKmh: limitKmh,
    });
    setTab('drive');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.screen}>
        {tab === 'drive' ? (
          <DriveScreen
            snapshot={snapshot}
            settings={settings}
            busy={busy || !ready || normalizingAndroidMode}
            startBlocked={startBlocked}
            onStart={() => void start()}
            onStop={() => void stop()}
            onOpenSettings={() => setTab('settings')}
          />
        ) : null}
        {tab === 'roads' ? (
          <RoadsScreen
            settings={settings}
            disabled={snapshot.active || !ready || normalizingAndroidMode}
            onSelect={selectRoad}
          />
        ) : null}
        {tab === 'settings' ? (
          <SettingsScreen
            settings={settings}
            disabled={snapshot.active || !ready || normalizingAndroidMode}
            onChange={(next) => void updateSettings(next)}
          />
        ) : null}
        <TabBar active={tab} locked={snapshot.active || !ready} onChange={setTab} />
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Root />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});
