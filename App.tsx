import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
        {tab === 'drive' ? (
          <DriveScreen
            snapshot={snapshot}
            settings={settings}
            busy={busy || !ready}
            startBlocked={startBlocked}
            onStart={() => void start()}
            onStop={() => void stop()}
            onOpenSettings={() => setTab('settings')}
          />
        ) : null}
        {tab === 'roads' ? (
          <RoadsScreen
            settings={settings}
            disabled={snapshot.active || !ready}
            onSelect={selectRoad}
          />
        ) : null}
        {tab === 'settings' ? (
          <SettingsScreen
            settings={settings}
            disabled={snapshot.active || !ready}
            onChange={(next) => void updateSettings(next)}
          />
        ) : null}
        <TabBar active={tab} locked={snapshot.active} onChange={setTab} />
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
  safe: { flex: 1, backgroundColor: colors.ink },
  screen: { flex: 1, backgroundColor: colors.ink },
});
