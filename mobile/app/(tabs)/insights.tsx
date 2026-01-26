// Insights Tab - Analytics (matches web AnalyticsTab.tsx)
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import { api } from '../../lib/api';
import { useAuth, useAuthToken } from '../../lib/auth';

interface Analytics {
  totalEntries: number;
  uniqueArtists: number;
  uniqueSongs: number;
  topArtists: { name: string; count: number }[];
  topSongs: { title: string; artist: string; count: number }[];
  entriesByMonth: { month: string; count: number }[];
  currentStreak: number;
  longestStreak: number;
}

export default function InsightsTab() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const fetchAnalytics = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    try {
      const token = await getToken();
      if (!token) return;

      const data = await api.getAnalytics(token, selectedYear);
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken, selectedYear]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Analyzing your music...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
        </View>

        {/* Year selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.yearSelector}
          contentContainerStyle={styles.yearSelectorContent}
        >
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[styles.yearButton, selectedYear === year && styles.activeYearButton]}
              onPress={() => setSelectedYear(year)}
            >
              <Text style={[styles.yearText, selectedYear === year && styles.activeYearText]}>
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats overview */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics?.totalEntries || 0}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics?.uniqueArtists || 0}</Text>
            <Text style={styles.statLabel}>Artists</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics?.uniqueSongs || 0}</Text>
            <Text style={styles.statLabel}>Songs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        {/* Top Artists */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Artists</Text>
          {analytics?.topArtists?.length ? (
            <View style={styles.listContainer}>
              {analytics.topArtists.slice(0, 5).map((artist, index) => (
                <View key={artist.name} style={styles.listItem}>
                  <Text style={styles.listRank}>{index + 1}</Text>
                  <Text style={styles.listName} numberOfLines={1}>
                    {artist.name}
                  </Text>
                  <Text style={styles.listCount}>{artist.count}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No data yet</Text>
          )}
        </View>

        {/* Top Songs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Songs</Text>
          {analytics?.topSongs?.length ? (
            <View style={styles.listContainer}>
              {analytics.topSongs.slice(0, 5).map((song, index) => (
                <View key={`${song.title}-${song.artist}`} style={styles.listItem}>
                  <Text style={styles.listRank}>{index + 1}</Text>
                  <View style={styles.listSongInfo}>
                    <Text style={styles.listName} numberOfLines={1}>
                      {song.title}
                    </Text>
                    <Text style={styles.listArtist} numberOfLines={1}>
                      {song.artist}
                    </Text>
                  </View>
                  <Text style={styles.listCount}>{song.count}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No data yet</Text>
          )}
        </View>

        {/* Streak info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streaks</Text>
          <View style={styles.streakContainer}>
            <View style={styles.streakItem}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakValue}>{analytics?.currentStreak || 0}</Text>
              <Text style={styles.streakLabel}>Current</Text>
            </View>
            <View style={styles.streakItem}>
              <Text style={styles.streakEmoji}>🏆</Text>
              <Text style={styles.streakValue}>{analytics?.longestStreak || 0}</Text>
              <Text style={styles.streakLabel}>Longest</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  yearSelector: {
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.lg,
  },
  yearSelectorContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  yearButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  activeYearButton: {
    backgroundColor: colors.accent,
  },
  yearText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  activeYearText: {
    color: colors.bg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.accent,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  listContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listRank: {
    width: 30,
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.accent,
  },
  listName: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  listSongInfo: {
    flex: 1,
  },
  listArtist: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  listCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontStyle: 'italic',
  },
  streakContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  streakItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 30,
    marginBottom: spacing.sm,
  },
  streakValue: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  streakLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
