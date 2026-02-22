// Leaderboard Tab - Global SOTD + leaderboard (matches web LeaderboardTab.tsx)
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import { api, LeaderboardData, GlobalSOTD } from '../../lib/api';

type ActiveTab = 'today' | 'leaderboard';
type TimeFilter = 'all' | 'year' | 'month' | 'week';
type ViewType = 'artists' | 'songs';

export default function LeaderboardTab() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [globalSOTD, setGlobalSOTD] = useState<GlobalSOTD | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [viewType, setViewType] = useState<ViewType>('artists');
  const [loading, setLoading] = useState(true);
  const [loadingSOTD, setLoadingSOTD] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getLeaderboard(timeFilter);
      setData(result);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  const fetchGlobalSOTD = useCallback(async () => {
    setLoadingSOTD(true);
    try {
      const result = await api.getGlobalSOTD();
      setGlobalSOTD(result.globalSOTD);
    } catch (err) {
      console.error('Error fetching global SOTD:', err);
    } finally {
      setLoadingSOTD(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    fetchGlobalSOTD();
  }, [fetchGlobalSOTD]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLeaderboard(), fetchGlobalSOTD()]);
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const openSpotify = (trackId: string) => {
    Linking.openURL(`https://open.spotify.com/track/${trackId}`);
  };

  const timeFilters: { key: TimeFilter; label: string }[] = [
    { key: 'all', label: 'All Time' },
    { key: 'year', label: 'Year' },
    { key: 'month', label: 'Month' },
    { key: 'week', label: 'Week' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'today' && styles.activeTab]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
            🌍 Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            🏆 Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Global Song of the Day */}
        {activeTab === 'today' && (
          <View>
            <View style={styles.headerCenter}>
              <Text style={styles.pageTitle}>Global Song of the Day</Text>
              <Text style={styles.pageSubtitle}>The most logged song across all SongBird users</Text>
            </View>

            {loadingSOTD ? (
              <View style={styles.centerPad}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.loadingText}>Finding yesterday's top song...</Text>
              </View>
            ) : globalSOTD ? (
              <View style={styles.sotdCard}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>{formatDate(globalSOTD.date)}</Text>
                </View>

                {globalSOTD.albumArt ? (
                  <View style={styles.albumArtContainer}>
                    <Image source={{ uri: globalSOTD.albumArt }} style={styles.albumArt} />
                    <View style={styles.crownBadge}>
                      <Text style={styles.crownEmoji}>👑</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.albumArtPlaceholder}>
                    <Text style={styles.albumArtPlaceholderText}>🎵</Text>
                  </View>
                )}

                <Text style={styles.songTitle}>{globalSOTD.songTitle}</Text>
                <Text style={styles.artistName}>{globalSOTD.artist}</Text>

                <View style={styles.countContainer}>
                  <Text style={styles.countValue}>{globalSOTD.count}</Text>
                  <Text style={styles.countLabel}>
                    {globalSOTD.count === 1 ? 'person logged' : 'people logged'}
                  </Text>
                </View>

                {globalSOTD.firstLoggedBy && (
                  <Text style={styles.firstLoggedBy}>
                    First logged by @{globalSOTD.firstLoggedBy.username || globalSOTD.firstLoggedBy.name || 'anonymous'}
                  </Text>
                )}

                {globalSOTD.trackId && (
                  <TouchableOpacity
                    style={styles.spotifyBtn}
                    onPress={() => openSpotify(globalSOTD.trackId)}
                  >
                    <Text style={styles.spotifyBtnText}>🎧 Listen on Spotify</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>No Global SOTD Yet</Text>
                <Text style={styles.emptyText}>Check back tomorrow!</Text>
              </View>
            )}

            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                🌍 The Global Song of the Day is the song that was logged by the most SongBird users yesterday. When there's a tie, the song that was logged first wins!
              </Text>
            </View>
          </View>
        )}

        {/* Leaderboard */}
        {activeTab === 'leaderboard' && (
          <View>
            <View style={styles.headerCenter}>
              <Text style={styles.pageTitle}>🏆 Global Leaderboard</Text>
              <Text style={styles.pageSubtitle}>Most loved artists and songs across all users</Text>
            </View>

            {data && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{data.stats.totalUsers?.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Users</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{data.stats.totalEntries?.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Entries</Text>
                </View>
              </View>
            )}

            {/* Time Filter */}
            <View style={styles.filterRow}>
              {timeFilters.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, timeFilter === f.key && styles.filterChipActive]}
                  onPress={() => setTimeFilter(f.key)}
                >
                  <Text style={[styles.filterChipText, timeFilter === f.key && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* View Type Toggle */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.viewToggle, viewType === 'artists' && styles.viewToggleActive]}
                onPress={() => setViewType('artists')}
              >
                <Text style={[styles.viewToggleText, viewType === 'artists' && styles.viewToggleTextActive]}>
                  🎤 Artists
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewToggle, viewType === 'songs' && styles.viewToggleActive]}
                onPress={() => setViewType('songs')}
              >
                <Text style={[styles.viewToggleText, viewType === 'songs' && styles.viewToggleTextActive]}>
                  🎵 Songs
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: spacing.xl }} />
            ) : data ? (
              <>
                {/* Top 3 Podium */}
                {viewType === 'artists' && data.topArtists.length >= 3 && (
                  <View style={styles.podium}>
                    {/* 2nd Place */}
                    <View style={[styles.podiumItem, styles.podiumSecond]}>
                      <Text style={styles.podiumMedal}>🥈</Text>
                      <View style={styles.podiumCircle}>
                        <Text style={styles.podiumCircleText}>🎤</Text>
                      </View>
                      <Text style={styles.podiumName} numberOfLines={2}>{data.topArtists[1].artist}</Text>
                      <Text style={styles.podiumCount}>{data.topArtists[1].count} days</Text>
                    </View>
                    {/* 1st Place */}
                    <View style={[styles.podiumItem, styles.podiumFirst]}>
                      <Text style={styles.podiumMedalLg}>🥇</Text>
                      <View style={[styles.podiumCircle, styles.podiumCircleLg]}>
                        <Text style={styles.podiumCircleTextLg}>🎤</Text>
                      </View>
                      <Text style={styles.podiumNameLg} numberOfLines={2}>{data.topArtists[0].artist}</Text>
                      <Text style={styles.podiumCount}>{data.topArtists[0].count} days</Text>
                    </View>
                    {/* 3rd Place */}
                    <View style={[styles.podiumItem, styles.podiumThird]}>
                      <Text style={styles.podiumMedal}>🥉</Text>
                      <View style={styles.podiumCircle}>
                        <Text style={styles.podiumCircleText}>🎤</Text>
                      </View>
                      <Text style={styles.podiumName} numberOfLines={2}>{data.topArtists[2].artist}</Text>
                      <Text style={styles.podiumCount}>{data.topArtists[2].count} days</Text>
                    </View>
                  </View>
                )}

                {/* Remaining */}
                {viewType === 'artists' &&
                  data.topArtists.slice(3, 10).map((item, index) => (
                    <View key={item.artist} style={styles.listItem}>
                      <Text style={styles.listRank}>#{index + 4}</Text>
                      <View style={styles.listCircle}>
                        <Text style={styles.listCircleText}>🎤</Text>
                      </View>
                      <View style={styles.listInfo}>
                        <Text style={styles.listTitle} numberOfLines={1}>{item.artist}</Text>
                        <Text style={styles.listSub}>{item.count} days</Text>
                      </View>
                    </View>
                  ))}

                {/* Songs - Top 3 */}
                {viewType === 'songs' && data.topSongs.length >= 3 && (
                  <View style={styles.podium}>
                    <View style={[styles.podiumItem, styles.podiumSecond]}>
                      <Text style={styles.podiumMedal}>🥈</Text>
                      {data.topSongs[1].albumArt ? (
                        <Image source={{ uri: data.topSongs[1].albumArt }} style={styles.podiumAlbum} />
                      ) : (
                        <View style={styles.podiumCircle}><Text style={styles.podiumCircleText}>🎵</Text></View>
                      )}
                      <Text style={styles.podiumName} numberOfLines={2}>{data.topSongs[1].songTitle}</Text>
                      <Text style={styles.podiumSub} numberOfLines={1}>{data.topSongs[1].artist}</Text>
                      <Text style={styles.podiumCount}>{data.topSongs[1].count} days</Text>
                    </View>
                    <View style={[styles.podiumItem, styles.podiumFirst]}>
                      <Text style={styles.podiumMedalLg}>🥇</Text>
                      {data.topSongs[0].albumArt ? (
                        <Image source={{ uri: data.topSongs[0].albumArt }} style={styles.podiumAlbumLg} />
                      ) : (
                        <View style={[styles.podiumCircle, styles.podiumCircleLg]}><Text style={styles.podiumCircleTextLg}>🎵</Text></View>
                      )}
                      <Text style={styles.podiumNameLg} numberOfLines={2}>{data.topSongs[0].songTitle}</Text>
                      <Text style={styles.podiumSub} numberOfLines={1}>{data.topSongs[0].artist}</Text>
                      <Text style={styles.podiumCount}>{data.topSongs[0].count} days</Text>
                    </View>
                    <View style={[styles.podiumItem, styles.podiumThird]}>
                      <Text style={styles.podiumMedal}>🥉</Text>
                      {data.topSongs[2].albumArt ? (
                        <Image source={{ uri: data.topSongs[2].albumArt }} style={styles.podiumAlbum} />
                      ) : (
                        <View style={styles.podiumCircle}><Text style={styles.podiumCircleText}>🎵</Text></View>
                      )}
                      <Text style={styles.podiumName} numberOfLines={2}>{data.topSongs[2].songTitle}</Text>
                      <Text style={styles.podiumSub} numberOfLines={1}>{data.topSongs[2].artist}</Text>
                      <Text style={styles.podiumCount}>{data.topSongs[2].count} days</Text>
                    </View>
                  </View>
                )}

                {viewType === 'songs' &&
                  data.topSongs.slice(3, 10).map((song, index) => (
                    <View key={`${song.songTitle}-${song.artist}`} style={styles.listItem}>
                      <Text style={styles.listRank}>#{index + 4}</Text>
                      {song.albumArt ? (
                        <Image source={{ uri: song.albumArt }} style={styles.listAlbumArt} />
                      ) : (
                        <View style={styles.listCircle}><Text style={styles.listCircleText}>🎵</Text></View>
                      )}
                      <View style={styles.listInfo}>
                        <Text style={styles.listTitle} numberOfLines={1}>{song.songTitle}</Text>
                        <Text style={styles.listSub}>{song.artist}</Text>
                        <Text style={styles.listSub}>{song.count} days</Text>
                      </View>
                    </View>
                  ))}
              </>
            ) : (
              <Text style={styles.errorTextCenter}>Failed to load leaderboard</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  tabContainer: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surface },
  tabButton: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center' },
  activeTab: { backgroundColor: colors.accent },
  tabText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '500' },
  activeTabText: { color: colors.bg },
  headerCenter: { alignItems: 'center', marginBottom: spacing.lg },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  pageSubtitle: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  centerPad: { alignItems: 'center', paddingVertical: spacing.xxl },
  loadingText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.md },
  sotdCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, padding: spacing.xl, marginBottom: spacing.lg, alignItems: 'center' },
  dateBadge: { backgroundColor: colors.accent + '1A', paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.full, marginBottom: spacing.md },
  dateBadgeText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '500' },
  albumArtContainer: { marginBottom: spacing.md, position: 'relative' as const },
  albumArt: { width: 180, height: 180, borderRadius: borderRadius.xl },
  crownBadge: { position: 'absolute' as const, top: -10, right: -10, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  crownEmoji: { fontSize: 24 },
  albumArtPlaceholder: { width: 180, height: 180, borderRadius: borderRadius.xl, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  albumArtPlaceholderText: { fontSize: 60 },
  songTitle: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  artistName: { fontSize: fontSize.lg, color: colors.textMuted, marginTop: spacing.xs },
  countContainer: { alignItems: 'center', marginTop: spacing.md },
  countValue: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.accent },
  countLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  firstLoggedBy: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.md },
  spotifyBtn: { marginTop: spacing.md, backgroundColor: '#1DB954' + '33', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.lg },
  spotifyBtnText: { color: '#1DB954', fontSize: fontSize.sm, fontWeight: '600' },
  emptyCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, padding: spacing.xxl, alignItems: 'center' },
  emptyEmoji: { fontSize: 60, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  infoCard: { backgroundColor: colors.surface + '80', borderRadius: borderRadius.xl, padding: spacing.md, marginTop: spacing.md },
  infoText: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xxl, marginBottom: spacing.lg },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.accent },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  filterRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginBottom: spacing.md },
  filterChip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.surface },
  filterChipActive: { backgroundColor: colors.accent },
  filterChipText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '500' },
  filterChipTextActive: { color: colors.bg },
  viewToggle: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center' },
  viewToggleActive: { backgroundColor: colors.accent },
  viewToggleText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '500' },
  viewToggleTextActive: { color: colors.bg },
  errorTextCenter: { color: colors.textMuted, fontSize: fontSize.md, textAlign: 'center', marginTop: spacing.xxl },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: spacing.xl, paddingTop: spacing.md },
  podiumItem: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs },
  podiumFirst: { marginTop: -20 },
  podiumSecond: { marginTop: 0 },
  podiumThird: { marginTop: 0 },
  podiumMedal: { fontSize: 36, marginBottom: spacing.sm },
  podiumMedalLg: { fontSize: 48, marginBottom: spacing.sm },
  podiumCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent + '33', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  podiumCircleLg: { width: 80, height: 80, borderRadius: 40 },
  podiumCircleText: { fontSize: 28 },
  podiumCircleTextLg: { fontSize: 36 },
  podiumAlbum: { width: 64, height: 64, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  podiumAlbumLg: { width: 80, height: 80, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  podiumName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, textAlign: 'center' },
  podiumNameLg: { fontSize: fontSize.md, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  podiumSub: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
  podiumCount: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  listRank: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.textMuted + '80', width: 36 },
  listCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent + '33', justifyContent: 'center', alignItems: 'center' },
  listCircleText: { fontSize: 20 },
  listAlbumArt: { width: 44, height: 44, borderRadius: borderRadius.md },
  listInfo: { flex: 1 },
  listTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  listSub: { fontSize: fontSize.xs, color: colors.textMuted },
});


