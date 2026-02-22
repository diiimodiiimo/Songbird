import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, spacing, borderRadius, birdThemes } from '../lib/theme';
import { api, BirdStatus } from '../lib/api';
import { useAuth, useAuthToken } from '../lib/auth';

export default function ThemeSelectorScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();
  const router = useRouter();

  const [birdStatuses, setBirdStatuses] = useState<BirdStatus[]>([]);
  const [activeBird, setActiveBird] = useState<string>('american-robin');
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  const fetchStatuses = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getBirdStatuses(token);
      setBirdStatuses(data.birds || []);

      const profile = await api.getProfile(token);
      const serverTheme = (profile.user as any)?.theme;
      if (serverTheme && birdThemes[serverTheme]) {
        setActiveBird(serverTheme);
      }
    } catch (err) {
      console.error('Error fetching bird statuses:', err);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const isBirdUnlocked = (birdId: string): boolean => {
    if (loading) return true;
    const status = birdStatuses.find((s) => s.birdId === birdId);
    return status?.isUnlocked ?? (birdId === 'american-robin' || birdId === 'northern-cardinal');
  };

  const getBirdProgress = (birdId: string) => {
    return birdStatuses.find((s) => s.birdId === birdId)?.progress;
  };

  const selectTheme = async (birdId: string) => {
    if (!isBirdUnlocked(birdId) || birdId === activeBird) return;
    setSelecting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await getToken();
      if (!token) return;
      await api.updateProfile(token, { theme: birdId } as any);
      setActiveBird(birdId);
    } catch (err) {
      console.error('Error selecting theme:', err);
    } finally {
      setSelecting(false);
    }
  };

  const themeList = Object.entries(birdThemes);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Choose Your Bird</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.subtitle}>Your bird represents your journey</Text>

        {/* Active bird with real image */}
        <View style={styles.currentBird}>
          {birdThemes[activeBird] && (
            <Image
              source={birdThemes[activeBird].image}
              style={styles.currentBirdImage}
              resizeMode="contain"
            />
          )}
          <Text style={styles.currentBirdName}>
            {birdThemes[activeBird]?.name || 'American Robin'}
          </Text>
          <Text style={styles.currentBirdLabel}>Active Bird</Text>
        </View>

        {/* Bird Grid */}
        <View style={styles.grid}>
          {themeList.map(([id, theme]) => {
            const unlocked = isBirdUnlocked(id);
            const progress = getBirdProgress(id);
            const isActive = activeBird === id;

            return (
              <TouchableOpacity
                key={id}
                style={[
                  styles.birdCard,
                  isActive && { borderColor: theme.colors.primary },
                  !unlocked && styles.birdCardLocked,
                ]}
                onPress={() => selectTheme(id)}
                disabled={!unlocked || selecting}
              >
                {isActive && (
                  <View style={[styles.checkBadge, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}

                {unlocked ? (
                  <Image source={theme.image} style={styles.birdImage} resizeMode="contain" />
                ) : (
                  <View style={styles.lockedPlaceholder}>
                    <Text style={styles.lockedIcon}>🔒</Text>
                  </View>
                )}

                <Text style={[styles.birdName, !unlocked && styles.lockedText]}>
                  {theme.shortName}
                </Text>

                {!unlocked && progress ? (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${progress.percentage}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{progress.label}</Text>
                  </View>
                ) : unlocked ? (
                  <View style={[styles.colorDot, { backgroundColor: theme.colors.primary }]} />
                ) : (
                  <Text style={styles.requirementText}>Keep logging!</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  currentBird: { alignItems: 'center', marginBottom: spacing.xl },
  currentBirdImage: { width: 100, height: 100, marginBottom: spacing.sm },
  currentBirdName: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text },
  currentBirdLabel: { fontSize: fontSize.xs, color: colors.accent, marginTop: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
  birdCard: { width: '47%', backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  birdCardLocked: { opacity: 0.6 },
  checkBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  birdImage: { width: 64, height: 64, marginBottom: spacing.sm },
  lockedPlaceholder: { width: 64, height: 64, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  lockedIcon: { fontSize: 32 },
  birdName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, textAlign: 'center' },
  lockedText: { color: colors.textMuted },
  colorDot: { width: 16, height: 16, borderRadius: 8, marginTop: spacing.xs },
  progressContainer: { marginTop: spacing.xs, width: '100%' },
  progressBg: { height: 4, backgroundColor: colors.bg, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: colors.accent, borderRadius: 2 },
  progressText: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  requirementText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
});
