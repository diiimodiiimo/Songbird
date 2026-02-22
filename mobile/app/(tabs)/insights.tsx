// Insights Tab - Analytics (matches web AnalyticsTab.tsx)
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import { api, apiFetch } from '../../lib/api';
import { useAuth, useAuthToken } from '../../lib/auth';
import ThemeBird from '../../components/ThemeBird';

const FILTER_OPTIONS = ['Last 4 Weeks', 'Last 6 Months', 'Calendar Year', 'All Time'] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

interface AnalyticsData {
  topArtists: Array<{ artist: string; count: number }>;
  topSongs: Array<{ songTitle: string; artist: string; count: number; albumArt?: string | null }>;
  topPeople?: Array<{ name: string; count: number }>;
}

interface ArtistImageCache {
  [key: string]: string | null;
}

interface ArtistSearchResult {
  songTitle: string;
  dates: string[];
  count: number;
}

function getDateRange(filter: FilterOption): { startDate: Date; endDate: Date } {
  const now = new Date();
  let startDate: Date;
  switch (filter) {
    case 'Last 4 Weeks':
      startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);
      break;
    case 'Last 6 Months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      break;
    case 'Calendar Year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(0);
  }
  return { startDate, endDate: now };
}

function spotifySearchUrl(query: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

export default function InsightsTab() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterOption, setFilterOption] = useState<FilterOption>('Last 4 Weeks');

  const [artistImages, setArtistImages] = useState<ArtistImageCache>({});

  const [artistSearchQuery, setArtistSearchQuery] = useState('');
  const [artistSearchResults, setArtistSearchResults] = useState<ArtistSearchResult[]>([]);
  const [artistSearchLoading, setArtistSearchLoading] = useState(false);

  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loadingAiInsights, setLoadingAiInsights] = useState(false);

  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  const [showSpotlight, setShowSpotlight] = useState(true);
  const [showAllArtists, setShowAllArtists] = useState(false);
  const [showAllSongs, setShowAllSongs] = useState(false);

  const totalEntries = analytics?.topArtists?.reduce((sum, a) => sum + a.count, 0) ?? 0;
  const uniqueArtists = analytics?.topArtists?.length ?? 0;
  const uniqueSongs = analytics?.topSongs?.length ?? 0;

  // ── Data Fetching ───────────────────────────────────────────────────────────

  const fetchAnalytics = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const { startDate, endDate } = getDateRange(filterOption);
      const data = await apiFetch<AnalyticsData>(
        `/api/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { token },
      );
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken, filterOption]);

  const fetchStreaks = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getStreak(token);
      setCurrentStreak(data.currentStreak);
      setLongestStreak(data.longestStreak);
    } catch (error) {
      console.error('Error fetching streaks:', error);
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchAiInsights = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    setLoadingAiInsights(true);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await apiFetch<{ insights?: string[] }>(
        `/api/ai-insight?filter=${encodeURIComponent(filterOption)}`,
        { token },
      );
      if (data.insights) setAiInsights(data.insights);
    } catch {
      // AI insights may not be available yet
    } finally {
      setLoadingAiInsights(false);
    }
  }, [isLoaded, isSignedIn, getToken, filterOption]);

  const fetchArtistImage = useCallback(async (artistName: string) => {
    try {
      const data = await api.searchArtists(artistName);
      if (data.image) {
        setArtistImages((prev) => ({ ...prev, [artistName]: data.image }));
      }
    } catch {
      // silently skip
    }
  }, []);

  useEffect(() => {
    setShowAllArtists(false);
    setShowAllSongs(false);
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchStreaks();
  }, [fetchStreaks]);

  useEffect(() => {
    if (analytics && totalEntries > 10) fetchAiInsights();
  }, [analytics, filterOption]);

  useEffect(() => {
    if (analytics?.topArtists) {
      analytics.topArtists.forEach((item) => {
        if (!(item.artist in artistImages)) fetchArtistImage(item.artist);
      });
    }
  }, [analytics]);

  // ── Artist Search ──────────────────────────────────────────────────────────

  const searchArtist = async () => {
    if (!artistSearchQuery.trim()) {
      setArtistSearchResults([]);
      return;
    }
    setArtistSearchLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const { startDate, endDate } = getDateRange(filterOption);
      const data = await apiFetch<{ entries: any[] }>(
        `/api/entries?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { token },
      );
      if (!data.entries) {
        setArtistSearchResults([]);
        return;
      }
      const queryLower = artistSearchQuery.toLowerCase();
      const matches = data.entries.filter((e: any) =>
        e.artist?.toLowerCase().includes(queryLower),
      );
      if (matches.length === 0) {
        setArtistSearchResults([]);
        return;
      }
      const groups: Record<string, { dates: string[]; count: number }> = {};
      matches.forEach((entry: any) => {
        const d = new Date(entry.date).toISOString().split('T')[0];
        if (!groups[entry.songTitle]) groups[entry.songTitle] = { dates: [], count: 0 };
        groups[entry.songTitle].dates.push(d);
        groups[entry.songTitle].count++;
      });
      setArtistSearchResults(
        Object.entries(groups)
          .map(([songTitle, g]) => ({ songTitle, dates: g.dates.sort(), count: g.count }))
          .sort((a, b) => b.count - a.count),
      );
    } catch (error) {
      console.error('Error searching artist:', error);
    } finally {
      setArtistSearchLoading(false);
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAnalytics(), fetchStreaks()]);
    setRefreshing(false);
  };

  const openSpotify = (query: string) => Linking.openURL(spotifySearchUrl(query));

  // ── Loading State ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ThemeBird size={72} />
          <Text style={styles.loadingText}>Crunching your music data...</Text>
          <Text style={styles.loadingSubtext}>Finding patterns in your listening</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>Patterns in your music memory</Text>
        </View>

        {/* Feature Spotlight */}
        {showSpotlight && (
          <View style={styles.spotlight}>
            <View style={styles.spotlightRow}>
              <Text style={styles.spotlightIcon}>📊</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.spotlightTitle}>Your Music Patterns</Text>
                <Text style={styles.spotlightDesc}>
                  Insights analyzes your song history to surface patterns you'd never notice on your own.
                </Text>
                <View style={{ marginTop: spacing.sm }}>
                  {[
                    'Use the time filter to see patterns across different periods',
                    'Search by artist to see every day they soundtracked your life',
                    'AI Insights appear automatically after 10+ entries',
                  ].map((tip, i) => (
                    <Text key={i} style={styles.spotlightTip}>
                      <Text style={{ color: colors.accent }}>•  </Text>
                      {tip}
                    </Text>
                  ))}
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowSpotlight(false)} hitSlop={12}>
                <Text style={styles.spotlightClose}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Time Period Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          {FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.filterPill, filterOption === opt && styles.filterPillActive]}
              onPress={() => {
                if (opt !== filterOption) {
                  setFilterOption(opt);
                  setLoading(true);
                }
              }}
            >
              <Text style={[styles.filterText, filterOption === opt && styles.filterTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { value: totalEntries, label: 'Entries' },
            { value: uniqueArtists, label: 'Artists' },
            { value: uniqueSongs, label: 'Songs' },
            { value: currentStreak, label: 'Streak' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {analytics ? (
          <>
            {/* ── AI Insights ────────────────────────────────────────────── */}
            {totalEntries > 10 && (
              <View style={styles.aiSection}>
                <View style={styles.aiHeader}>
                  <ThemeBird size={40} />
                  <View style={{ marginLeft: spacing.md }}>
                    <Text style={styles.aiTitle}>AI Insights</Text>
                    <Text style={styles.aiSubtitle}>Patterns we noticed in your music</Text>
                  </View>
                </View>

                {loadingAiInsights ? (
                  <View style={styles.aiLoading}>
                    <ThemeBird size={56} />
                    <Text style={styles.aiLoadingText}>Analyzing your musical patterns...</Text>
                  </View>
                ) : aiInsights.length > 0 ? (
                  <View style={{ gap: spacing.md }}>
                    {aiInsights.map((insight, i) => (
                      <View key={i} style={styles.aiCard}>
                        <Text style={styles.aiCardText}>"{insight}"</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.aiEmpty}>
                    <Text style={styles.aiEmptyText}>
                      Not enough data yet. Keep logging songs to unlock AI insights!
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* ── Artist Search ──────────────────────────────────────────── */}
            <View style={styles.searchSection}>
              <View style={styles.searchHeader}>
                <Text style={{ fontSize: 22 }}>🔍</Text>
                <Text style={styles.searchTitle}>Search by Artist</Text>
              </View>
              <Text style={styles.searchSubtitle}>
                Find all the days a specific artist soundtracked your life
              </Text>

              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  value={artistSearchQuery}
                  onChangeText={setArtistSearchQuery}
                  placeholder="Type an artist name..."
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={searchArtist}
                  returnKeyType="search"
                />
                <TouchableOpacity
                  style={[styles.searchBtn, artistSearchLoading && { opacity: 0.5 }]}
                  onPress={searchArtist}
                  disabled={artistSearchLoading}
                >
                  <Text style={styles.searchBtnText}>
                    {artistSearchLoading ? '...' : '🔍 Search'}
                  </Text>
                </TouchableOpacity>
              </View>

              {artistSearchResults.length > 0 && (
                <>
                  <View style={styles.searchSummary}>
                    <Text style={styles.searchSummaryText}>
                      <Text style={{ color: colors.accent, fontWeight: '600' }}>
                        {artistSearchQuery}
                      </Text>
                      {' appeared '}
                      <Text style={{ color: colors.accent, fontWeight: '600' }}>
                        {artistSearchResults.reduce((s, r) => s + r.count, 0)} times
                      </Text>
                      {' as Song of the Day'}
                    </Text>
                  </View>
                  {artistSearchResults.map((r) => (
                    <View key={r.songTitle} style={styles.searchResultCard}>
                      <View style={styles.searchResultTop}>
                        <Text style={styles.searchResultSong} numberOfLines={1}>
                          {r.songTitle}
                        </Text>
                        <View style={styles.searchResultBadge}>
                          <Text style={styles.searchResultBadgeText}>{r.count}×</Text>
                        </View>
                      </View>
                      <Text style={styles.searchResultDates} numberOfLines={3}>
                        {r.dates
                          .map((d) =>
                            new Date(d).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }),
                          )
                          .join('   ')}
                      </Text>
                    </View>
                  ))}
                </>
              )}

              {artistSearchLoading && (
                <View style={styles.searchEmpty}>
                  <Text style={{ fontSize: 28 }}>🔍</Text>
                  <Text style={styles.searchEmptyText}>Searching for songs...</Text>
                </View>
              )}

              {!!artistSearchQuery &&
                artistSearchResults.length === 0 &&
                !artistSearchLoading && (
                  <View style={styles.searchEmpty}>
                    <Text style={{ fontSize: 28 }}>🔍</Text>
                    <Text style={styles.searchEmptyText}>No songs found for that artist</Text>
                  </View>
                )}
            </View>

            {/* ── Top Artists ────────────────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎤  Top Artists</Text>

              {analytics.topArtists?.length ? (
                <>
                  {/* Podium */}
                  {analytics.topArtists.length >= 2 && (
                    <View style={styles.podium}>
                      {/* 2nd */}
                      {analytics.topArtists[1] && (
                        <View style={styles.podiumSide}>
                          <Text style={styles.podiumMedal2}>🥈</Text>
                          <TouchableOpacity
                            onPress={() => openSpotify(analytics.topArtists[1].artist)}
                          >
                            {artistImages[analytics.topArtists[1].artist] ? (
                              <Image
                                source={{ uri: artistImages[analytics.topArtists[1].artist]! }}
                                style={styles.podiumImgSide}
                              />
                            ) : (
                              <View style={[styles.podiumPlaceholder, styles.podiumImgSide, { backgroundColor: '#7c3aed' }]}>
                                <Text style={{ fontSize: 24 }}>🎤</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                          <Text style={styles.podiumName} numberOfLines={2}>
                            {analytics.topArtists[1].artist}
                          </Text>
                          <Text style={styles.podiumCount}>{analytics.topArtists[1].count} days</Text>
                        </View>
                      )}

                      {/* 1st */}
                      <View style={styles.podiumCenter}>
                        <Text style={styles.podiumMedal1}>🥇</Text>
                        <TouchableOpacity
                          onPress={() => openSpotify(analytics.topArtists[0].artist)}
                        >
                          {artistImages[analytics.topArtists[0].artist] ? (
                            <Image
                              source={{ uri: artistImages[analytics.topArtists[0].artist]! }}
                              style={styles.podiumImgCenter}
                            />
                          ) : (
                            <View style={[styles.podiumPlaceholder, styles.podiumImgCenter, { backgroundColor: '#eab308' }]}>
                              <Text style={{ fontSize: 30 }}>🎤</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        <Text style={styles.podiumNameCenter} numberOfLines={2}>
                          {analytics.topArtists[0].artist}
                        </Text>
                        <Text style={styles.podiumCount}>{analytics.topArtists[0].count} days</Text>
                      </View>

                      {/* 3rd */}
                      {analytics.topArtists[2] && (
                        <View style={styles.podiumSide}>
                          <Text style={styles.podiumMedal2}>🥉</Text>
                          <TouchableOpacity
                            onPress={() => openSpotify(analytics.topArtists[2].artist)}
                          >
                            {artistImages[analytics.topArtists[2].artist] ? (
                              <Image
                                source={{ uri: artistImages[analytics.topArtists[2].artist]! }}
                                style={styles.podiumImgSide}
                              />
                            ) : (
                              <View style={[styles.podiumPlaceholder, styles.podiumImgSide, { backgroundColor: '#ea580c' }]}>
                                <Text style={{ fontSize: 24 }}>🎤</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                          <Text style={styles.podiumName} numberOfLines={2}>
                            {analytics.topArtists[2].artist}
                          </Text>
                          <Text style={styles.podiumCount}>{analytics.topArtists[2].count} days</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Remaining artists list */}
                  {analytics.topArtists.length > 3 && (
                    <View style={styles.listContainer}>
                      {analytics.topArtists
                        .slice(3, showAllArtists ? undefined : 6)
                        .map((artist, idx) => (
                          <TouchableOpacity
                            key={artist.artist}
                            style={styles.listItem}
                            onPress={() => openSpotify(artist.artist)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.listRank}>#{idx + 4}</Text>
                            {artistImages[artist.artist] ? (
                              <Image
                                source={{ uri: artistImages[artist.artist]! }}
                                style={styles.listAvatarRound}
                              />
                            ) : (
                              <View style={[styles.listAvatarPlaceholder, styles.listAvatarRound]}>
                                <Text style={{ fontSize: 18 }}>🎤</Text>
                              </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={styles.listName} numberOfLines={1}>
                                {artist.artist}
                              </Text>
                              <Text style={styles.listSub}>{artist.count} days</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                    </View>
                  )}

                  {analytics.topArtists.length > 6 && !showAllArtists && (
                    <TouchableOpacity
                      style={styles.viewAll}
                      onPress={() => setShowAllArtists(true)}
                    >
                      <Text style={styles.viewAllText}>
                        View all {analytics.topArtists.length} artists →
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <Text style={styles.emptyText}>No data yet</Text>
              )}
            </View>

            {/* ── Top Songs ─────────────────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎵  Top Songs</Text>

              {analytics.topSongs?.length ? (
                <>
                  {analytics.topSongs.length >= 3 ? (
                    <>
                      {/* Song Podium */}
                      <View style={styles.podium}>
                        {/* 2nd */}
                        {analytics.topSongs[1] && (
                          <View style={styles.podiumSide}>
                            <Text style={styles.podiumMedal2}>🥈</Text>
                            <TouchableOpacity
                              onPress={() =>
                                openSpotify(
                                  `${analytics.topSongs[1].songTitle} ${analytics.topSongs[1].artist}`,
                                )
                              }
                            >
                              {analytics.topSongs[1].albumArt ? (
                                <Image
                                  source={{ uri: analytics.topSongs[1].albumArt }}
                                  style={[styles.podiumAlbumSide]}
                                />
                              ) : (
                                <View style={[styles.podiumPlaceholder, styles.podiumAlbumSide, { backgroundColor: '#7c3aed' }]}>
                                  <Text style={{ fontSize: 24 }}>🎵</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                            <Text style={styles.podiumName} numberOfLines={2}>
                              {analytics.topSongs[1].songTitle}
                            </Text>
                            <Text style={styles.podiumArtist} numberOfLines={1}>
                              {analytics.topSongs[1].artist}
                            </Text>
                            <Text style={styles.podiumCount}>
                              {analytics.topSongs[1].count} days
                            </Text>
                          </View>
                        )}

                        {/* 1st */}
                        <View style={styles.podiumCenter}>
                          <Text style={styles.podiumMedal1}>🥇</Text>
                          <TouchableOpacity
                            onPress={() =>
                              openSpotify(
                                `${analytics.topSongs[0].songTitle} ${analytics.topSongs[0].artist}`,
                              )
                            }
                          >
                            {analytics.topSongs[0].albumArt ? (
                              <Image
                                source={{ uri: analytics.topSongs[0].albumArt }}
                                style={styles.podiumAlbumCenter}
                              />
                            ) : (
                              <View style={[styles.podiumPlaceholder, styles.podiumAlbumCenter, { backgroundColor: '#eab308' }]}>
                                <Text style={{ fontSize: 30 }}>🎵</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                          <Text style={styles.podiumNameCenter} numberOfLines={2}>
                            {analytics.topSongs[0].songTitle}
                          </Text>
                          <Text style={styles.podiumArtist} numberOfLines={1}>
                            {analytics.topSongs[0].artist}
                          </Text>
                          <Text style={styles.podiumCount}>
                            {analytics.topSongs[0].count} days
                          </Text>
                        </View>

                        {/* 3rd */}
                        {analytics.topSongs[2] && (
                          <View style={styles.podiumSide}>
                            <Text style={styles.podiumMedal2}>🥉</Text>
                            <TouchableOpacity
                              onPress={() =>
                                openSpotify(
                                  `${analytics.topSongs[2].songTitle} ${analytics.topSongs[2].artist}`,
                                )
                              }
                            >
                              {analytics.topSongs[2].albumArt ? (
                                <Image
                                  source={{ uri: analytics.topSongs[2].albumArt }}
                                  style={[styles.podiumAlbumSide]}
                                />
                              ) : (
                                <View style={[styles.podiumPlaceholder, styles.podiumAlbumSide, { backgroundColor: '#ea580c' }]}>
                                  <Text style={{ fontSize: 24 }}>🎵</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                            <Text style={styles.podiumName} numberOfLines={2}>
                              {analytics.topSongs[2].songTitle}
                            </Text>
                            <Text style={styles.podiumArtist} numberOfLines={1}>
                              {analytics.topSongs[2].artist}
                            </Text>
                            <Text style={styles.podiumCount}>
                              {analytics.topSongs[2].count} days
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Remaining songs list */}
                      {analytics.topSongs.length > 3 && (
                        <View style={styles.listContainer}>
                          {analytics.topSongs
                            .slice(3, showAllSongs ? undefined : 6)
                            .map((song, idx) => (
                              <TouchableOpacity
                                key={`${song.songTitle}-${song.artist}`}
                                style={styles.listItem}
                                onPress={() =>
                                  openSpotify(`${song.songTitle} ${song.artist}`)
                                }
                                activeOpacity={0.7}
                              >
                                <Text style={styles.listRank}>#{idx + 4}</Text>
                                {song.albumArt ? (
                                  <Image
                                    source={{ uri: song.albumArt }}
                                    style={styles.listAlbumArt}
                                  />
                                ) : (
                                  <View style={[styles.listAvatarPlaceholder, styles.listAlbumArt]}>
                                    <Text style={{ fontSize: 18 }}>🎵</Text>
                                  </View>
                                )}
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.listName} numberOfLines={1}>
                                    {song.songTitle}
                                  </Text>
                                  <Text style={styles.listSub} numberOfLines={1}>
                                    {song.artist}
                                  </Text>
                                </View>
                                <Text style={styles.listCount}>{song.count} days</Text>
                              </TouchableOpacity>
                            ))}
                        </View>
                      )}

                      {analytics.topSongs.length > 6 && !showAllSongs && (
                        <TouchableOpacity
                          style={styles.viewAll}
                          onPress={() => setShowAllSongs(true)}
                        >
                          <Text style={styles.viewAllText}>
                            View all {analytics.topSongs.length} songs →
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    /* Fewer than 3 songs — simple list */
                    <View style={styles.listContainer}>
                      {analytics.topSongs.map((song, idx) => (
                        <TouchableOpacity
                          key={`${song.songTitle}-${song.artist}`}
                          style={styles.listItem}
                          onPress={() => openSpotify(`${song.songTitle} ${song.artist}`)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.listRank, { color: colors.accent }]}>
                            {idx + 1}
                          </Text>
                          {song.albumArt ? (
                            <Image
                              source={{ uri: song.albumArt }}
                              style={styles.listAlbumArt}
                            />
                          ) : (
                            <View style={[styles.listAvatarPlaceholder, styles.listAlbumArt]}>
                              <Text style={{ fontSize: 18 }}>🎵</Text>
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.listName} numberOfLines={1}>
                              {song.songTitle}
                            </Text>
                            <Text style={styles.listSub} numberOfLines={1}>
                              {song.artist}
                            </Text>
                          </View>
                          <Text style={styles.listCount}>{song.count} days</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.emptyText}>No data yet</Text>
              )}
            </View>

            {/* ── Top People ────────────────────────────────────────────── */}
            {analytics.topPeople && analytics.topPeople.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👥  People in Your Days</Text>
                <View style={styles.peopleGrid}>
                  {analytics.topPeople.slice(0, 8).map((person) => (
                    <View key={person.name} style={styles.personCard}>
                      <View style={styles.personAvatar}>
                        <Text style={styles.personInitial}>
                          {person.name[0]?.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.personName} numberOfLines={1}>
                        {person.name}
                      </Text>
                      <Text style={styles.personCount}>
                        {person.count} {person.count === 1 ? 'day' : 'days'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Streaks ───────────────────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Streaks</Text>
              <View style={styles.streakRow}>
                <View style={styles.streakCard}>
                  <Text style={styles.streakEmoji}>🔥</Text>
                  <Text style={styles.streakValue}>{currentStreak}</Text>
                  <Text style={styles.streakLabel}>Current</Text>
                </View>
                <View style={styles.streakCard}>
                  <Text style={styles.streakEmoji}>🏆</Text>
                  <Text style={styles.streakValue}>{longestStreak}</Text>
                  <Text style={styles.streakLabel}>Longest</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          /* ── Empty State ────────────────────────────────────────────── */
          <View style={styles.emptyState}>
            <ThemeBird size={80} />
            <Text style={styles.emptyStateTitle}>No insights yet</Text>
            <Text style={styles.emptyStateText}>
              Start logging your songs of the day to discover patterns in your music taste!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.sm },
  loadingSubtext: { color: colors.textMuted, fontSize: fontSize.sm, opacity: 0.6 },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: { marginBottom: spacing.lg, alignItems: 'center' },
  title: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },

  // ── Feature Spotlight ───────────────────────────────────────────────────────
  spotlight: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: `${colors.accent}40`,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  spotlightRow: { flexDirection: 'row', gap: spacing.md },
  spotlightIcon: { fontSize: 22, marginTop: 2 },
  spotlightTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: 2 },
  spotlightDesc: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20 },
  spotlightTip: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  spotlightClose: { fontSize: fontSize.md, color: colors.textMuted, padding: 4 },

  // ── Filter Pills ────────────────────────────────────────────────────────────
  filterScroll: { marginBottom: spacing.lg, marginHorizontal: -spacing.lg },
  filterScrollContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  filterPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterPillActive: { backgroundColor: 'transparent', borderColor: colors.text },
  filterText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '500' },
  filterTextActive: { color: colors.text, fontWeight: '600' },

  // ── Stats Grid ──────────────────────────────────────────────────────────────
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  statCard: {
    width: '47%' as any,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.accent },
  statLabel: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },

  // ── AI Insights ─────────────────────────────────────────────────────────────
  aiSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: `${colors.accent}50`,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  aiTitle: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.accent },
  aiSubtitle: { fontSize: fontSize.sm, color: colors.textMuted },
  aiLoading: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  aiLoadingText: { color: colors.textMuted, fontSize: fontSize.sm },
  aiCard: {
    backgroundColor: `${colors.bg}80`,
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  aiCardText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontStyle: 'italic',
    lineHeight: 24,
    opacity: 0.9,
  },
  aiEmpty: { alignItems: 'center', paddingVertical: spacing.xl },
  aiEmptyText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },

  // ── Artist Search ───────────────────────────────────────────────────────────
  searchSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  searchHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  searchTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.accent },
  searchSubtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.md },
  searchRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  searchInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: fontSize.md,
    borderWidth: 2,
    borderColor: `${colors.accent}40`,
  },
  searchBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: { color: colors.bg, fontWeight: 'bold', fontSize: fontSize.sm },
  searchSummary: {
    backgroundColor: `${colors.accent}15`,
    borderWidth: 1,
    borderColor: `${colors.accent}40`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  searchSummaryText: { fontSize: fontSize.md, color: colors.text, fontWeight: '500' },
  searchResultCard: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchResultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  searchResultSong: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, flex: 1 },
  searchResultBadge: {
    backgroundColor: `${colors.accent}25`,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  searchResultBadgeText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '500' },
  searchResultDates: { fontSize: fontSize.sm, color: colors.textMuted },
  searchEmpty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  searchEmptyText: { color: colors.textMuted, fontSize: fontSize.sm },

  // ── Sections ────────────────────────────────────────────────────────────────
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md },

  // ── Podium ──────────────────────────────────────────────────────────────────
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  podiumSide: { flex: 1, alignItems: 'center', maxWidth: 140 },
  podiumCenter: { flex: 1, alignItems: 'center', maxWidth: 160, marginTop: -spacing.xl },
  podiumMedal1: { fontSize: 40, marginBottom: spacing.sm },
  podiumMedal2: { fontSize: 32, marginBottom: spacing.sm },
  podiumImgCenter: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#fff' },
  podiumImgSide: { width: 68, height: 68, borderRadius: 34, borderWidth: 3, borderColor: '#fff' },
  podiumAlbumCenter: { width: 88, height: 88, borderRadius: borderRadius.lg, borderWidth: 3, borderColor: '#fff' },
  podiumAlbumSide: { width: 68, height: 68, borderRadius: borderRadius.lg, borderWidth: 3, borderColor: '#fff' },
  podiumPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  podiumName: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: 4,
  },
  podiumNameCenter: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: 4,
  },
  podiumArtist: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  podiumCount: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },

  // ── List Items ──────────────────────────────────────────────────────────────
  listContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listRank: { width: 28, fontSize: fontSize.md, fontWeight: 'bold', color: colors.textMuted },
  listAvatarRound: { width: 42, height: 42, borderRadius: 21 },
  listAlbumArt: { width: 42, height: 42, borderRadius: borderRadius.md },
  listAvatarPlaceholder: {
    backgroundColor: `${colors.accent}25`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  listSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  listCount: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '500' },

  // ── View All ────────────────────────────────────────────────────────────────
  viewAll: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  viewAllText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '600' },

  // ── People Grid ─────────────────────────────────────────────────────────────
  peopleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  personCard: {
    width: '47%' as any,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  personAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${colors.accent}25`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  personInitial: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.accent },
  personName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: 4 },
  personCount: { fontSize: fontSize.xs, color: colors.textMuted },

  // ── Streaks ─────────────────────────────────────────────────────────────────
  streakRow: { flexDirection: 'row', gap: spacing.md },
  streakCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  streakEmoji: { fontSize: 30, marginBottom: spacing.sm },
  streakValue: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text },
  streakLabel: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },

  // ── Empty State ─────────────────────────────────────────────────────────────
  emptyText: { color: colors.textMuted, fontSize: fontSize.md, fontStyle: 'italic' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyStateTitle: { fontSize: fontSize.lg, color: colors.textMuted },
  emptyStateText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    opacity: 0.7,
  },
});
