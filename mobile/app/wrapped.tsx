import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';
import { api } from '../lib/api';
import { useAuth, useAuthToken } from '../lib/auth';
import ThemeBird from '../components/ThemeBird';
import UpgradePrompt from '../components/UpgradePrompt';

const { width: screenWidth } = Dimensions.get('window');

interface WrappedData {
  totalEntries: number;
  uniqueArtists: number;
  uniqueSongs: number;
  topArtists: { name: string; count: number; image?: string }[];
  topSongs: { title: string; artist: string; albumArt?: string; count: number }[];
  currentStreak: number;
  longestStreak: number;
  topMoods?: { mood: string; count: number }[];
  entriesByMonth?: { month: string; count: number }[];
  seasonalData?: Record<string, {
    artists: string[];
    songs: Array<{ songTitle: string; artist: string }>;
  }>;
}

const SEASON_META: Record<string, { emoji: string; label: string; gradient: string[] }> = {
  winter: { emoji: '❄️', label: 'Winter', gradient: ['#1a365d', '#2c5282'] },
  spring: { emoji: '🌸', label: 'Spring', gradient: ['#22543d', '#276749'] },
  summer: { emoji: '☀️', label: 'Summer', gradient: ['#744210', '#975a16'] },
  fall:   { emoji: '🍂', label: 'Fall',   gradient: ['#7b341e', '#9c4221'] },
};

const MEDAL = ['🥇', '🥈', '🥉'];

export default function WrappedScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();
  const router = useRouter();

  const [data, setData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [artistImages, setArtistImages] = useState<Record<string, string | null>>({});

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const fetchWrapped = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const [sub, analytics] = await Promise.all([
        api.getSubscription(token).catch(() => ({
          isPremium: false, isFoundingMember: false, stripeCustomerId: null, subscriptionTier: null,
        })),
        api.getAnalytics(token, selectedYear).catch(() => ({ analytics: null })),
      ]);

      setIsPremium(sub.isPremium || sub.isFoundingMember);

      if (analytics.analytics) {
        setData(analytics.analytics);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('Error fetching wrapped:', err);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken, selectedYear]);

  useEffect(() => {
    fetchWrapped();
  }, [fetchWrapped]);

  useEffect(() => {
    if (data?.topArtists) {
      data.topArtists.slice(0, 5).forEach(artist => {
        if (!artistImages[artist.name]) {
          fetchArtistImage(artist.name);
        }
      });
    }
  }, [data]);

  const fetchArtistImage = async (name: string) => {
    try {
      const result = await api.searchArtists(name);
      if (result.image) {
        setArtistImages(prev => ({ ...prev, [name]: result.image }));
      }
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    if (!data) return;
    const topArtist = data.topArtists[0]?.name ?? 'N/A';
    const topSong = data.topSongs[0] ? `${data.topSongs[0].title} by ${data.topSongs[0].artist}` : 'N/A';
    const message = [
      `🐦 My SongBird Wrapped ${selectedYear}`,
      '',
      `🎵 ${data.totalEntries} songs logged`,
      `🎤 ${data.uniqueArtists} artists`,
      `🔥 ${data.longestStreak} day streak`,
      '',
      `Top Artist: ${topArtist}`,
      `Top Song: ${topSong}`,
      '',
      '#SongBirdWrapped',
    ].join('\n');

    try {
      await Share.share({ message });
    } catch {
      // cancelled
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemeBird size={64} />
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: spacing.md }} />
          <Text style={styles.loadingText}>Building your Wrapped...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Premium Gate ──
  if (!isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Wrapped</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.premiumGate}>
          {/* Blurred preview teaser */}
          <View style={styles.previewCard}>
            <View style={styles.blurOverlay}>
              <View style={styles.previewStats}>
                <View style={styles.previewStatItem}>
                  <Text style={styles.previewStatVal}>247</Text>
                  <Text style={styles.previewStatLbl}>Songs</Text>
                </View>
                <View style={styles.previewStatItem}>
                  <Text style={styles.previewStatVal}>42</Text>
                  <Text style={styles.previewStatLbl}>Streak</Text>
                </View>
                <View style={styles.previewStatItem}>
                  <Text style={styles.previewStatVal}>85</Text>
                  <Text style={styles.previewStatLbl}>Artists</Text>
                </View>
              </View>
              <View style={styles.previewRows}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewRowEmoji}>🥇</Text>
                  <View style={styles.previewRowBar} />
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewRowEmoji}>🎵</Text>
                  <View style={styles.previewRowBar} />
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewRowEmoji}>🌊</Text>
                  <View style={styles.previewRowBar} />
                </View>
              </View>
            </View>

            <View style={styles.previewOverlay}>
              <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🎁</Text>
              <Text style={styles.previewTitle}>Your Wrapped Awaits</Text>
              <Text style={styles.previewDesc}>
                See your top artists, seasonal trends, mood analysis, and more.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/premium')}>
            <Text style={styles.upgradeBtnText}>Upgrade to SongBird Plus</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Main Wrapped Content ──
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Wrapped</Text>
          <TouchableOpacity onPress={handleShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="share-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Year selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearRow}>
          {years.map((y) => (
            <TouchableOpacity
              key={y}
              style={[styles.yearChip, selectedYear === y && styles.yearChipActive]}
              onPress={() => setSelectedYear(y)}
            >
              <Text style={[styles.yearChipText, selectedYear === y && styles.yearChipTextActive]}>
                {y}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {!data ? (
          <View style={styles.emptyContainer}>
            <ThemeBird size={64} />
            <Text style={styles.emptyTitle}>No data for {selectedYear}</Text>
            <Text style={styles.emptyText}>Start logging songs to build your year in review.</Text>
          </View>
        ) : (
          <>
            {/* ── Hero Stats ── */}
            <View style={styles.heroCard}>
              <ThemeBird size={48} />
              <Text style={styles.heroYear}>{selectedYear}</Text>
              <Text style={styles.heroSubtitle}>Your Year in Music</Text>
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{data.totalEntries}</Text>
                  <Text style={styles.heroStatLabel}>Songs</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{data.uniqueArtists}</Text>
                  <Text style={styles.heroStatLabel}>Artists</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{data.uniqueSongs ?? data.totalEntries}</Text>
                  <Text style={styles.heroStatLabel}>Unique Songs</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{data.longestStreak}</Text>
                  <Text style={styles.heroStatLabel}>Best Streak</Text>
                </View>
              </View>
            </View>

            {/* ── Top Artists (podium) ── */}
            {data.topArtists?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Artists</Text>

                {/* Podium for top 3 */}
                {data.topArtists.length >= 3 && (
                  <View style={styles.podium}>
                    {[1, 0, 2].map(idx => {
                      const artist = data.topArtists[idx];
                      if (!artist) return null;
                      const isFirst = idx === 0;
                      return (
                        <View key={artist.name} style={[styles.podiumSlot, isFirst && styles.podiumFirst]}>
                          {artistImages[artist.name] ? (
                            <Image source={{ uri: artistImages[artist.name]! }} style={[styles.podiumImage, isFirst && styles.podiumImageFirst]} />
                          ) : (
                            <View style={[styles.podiumPlaceholder, isFirst && styles.podiumImageFirst]}>
                              <Text style={{ fontSize: isFirst ? 28 : 22 }}>🎤</Text>
                            </View>
                          )}
                          <Text style={{ fontSize: 18 }}>{MEDAL[idx]}</Text>
                          <Text style={styles.podiumName} numberOfLines={1}>{artist.name}</Text>
                          <Text style={styles.podiumCount}>{artist.count}x</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Remaining artists */}
                {data.topArtists.slice(3, 10).map((artist, i) => (
                  <View key={artist.name} style={styles.rankItem}>
                    <Text style={styles.rankNumber}>{i + 4}</Text>
                    {artistImages[artist.name] ? (
                      <Image source={{ uri: artistImages[artist.name]! }} style={styles.rankAvatar} />
                    ) : (
                      <View style={styles.rankCircle}>
                        <Text style={styles.rankCircleText}>🎤</Text>
                      </View>
                    )}
                    <View style={styles.rankInfo}>
                      <Text style={styles.rankName} numberOfLines={1}>{artist.name}</Text>
                      <Text style={styles.rankCount}>{artist.count} entries</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ── Top Songs ── */}
            {data.topSongs?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Songs</Text>
                {data.topSongs.slice(0, 10).map((song, i) => (
                  <View key={`${song.title}-${song.artist}-${i}`} style={styles.rankItem}>
                    <Text style={styles.rankNumber}>{i < 3 ? MEDAL[i] : i + 1}</Text>
                    {song.albumArt ? (
                      <Image source={{ uri: song.albumArt }} style={styles.rankAlbumArt} />
                    ) : (
                      <View style={styles.rankCircle}>
                        <Text style={styles.rankCircleText}>🎵</Text>
                      </View>
                    )}
                    <View style={styles.rankInfo}>
                      <Text style={styles.rankName} numberOfLines={1}>{song.title}</Text>
                      <Text style={styles.rankCount}>{song.artist} · {song.count}x</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ── Seasonal Breakdown ── */}
            {data.seasonalData && Object.keys(data.seasonalData).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Seasonal Journey</Text>
                {(['winter', 'spring', 'summer', 'fall'] as const).map(season => {
                  const sData = data.seasonalData?.[season];
                  if (!sData || (!sData.artists?.length && !sData.songs?.length)) return null;
                  const meta = SEASON_META[season];
                  return (
                    <View key={season} style={[styles.seasonCard, { borderLeftColor: meta.gradient[1] }]}>
                      <View style={styles.seasonHeader}>
                        <Text style={{ fontSize: 22 }}>{meta.emoji}</Text>
                        <Text style={styles.seasonLabel}>{meta.label}</Text>
                      </View>
                      {sData.artists?.length > 0 && (
                        <View style={styles.seasonRow}>
                          <Text style={styles.seasonSubLabel}>Top Artists</Text>
                          {sData.artists.slice(0, 3).map((a, idx) => (
                            <Text key={a} style={styles.seasonItem}>
                              {MEDAL[idx] || `${idx + 1}.`} {a}
                            </Text>
                          ))}
                        </View>
                      )}
                      {sData.songs?.length > 0 && (
                        <View style={styles.seasonRow}>
                          <Text style={styles.seasonSubLabel}>Top Songs</Text>
                          {sData.songs.slice(0, 3).map((s, idx) => (
                            <Text key={`${s.songTitle}-${s.artist}`} style={styles.seasonItem} numberOfLines={1}>
                              {MEDAL[idx] || `${idx + 1}.`} {s.songTitle}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Mood Distribution ── */}
            {data.topMoods && data.topMoods.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Moods</Text>
                <View style={styles.moodGrid}>
                  {data.topMoods.slice(0, 8).map(mood => {
                    const maxCount = data.topMoods![0].count;
                    const pct = Math.max(15, (mood.count / maxCount) * 100);
                    return (
                      <View key={mood.mood} style={styles.moodItem}>
                        <Text style={styles.moodEmoji}>{mood.mood}</Text>
                        <View style={styles.moodBarBg}>
                          <View style={[styles.moodBarFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={styles.moodCount}>{mood.count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── Streaks ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Streaks</Text>
              <View style={styles.streakRow}>
                <View style={styles.streakCard}>
                  <Text style={styles.streakEmoji}>🔥</Text>
                  <Text style={styles.streakValue}>{data.currentStreak}</Text>
                  <Text style={styles.streakLabel}>Current</Text>
                </View>
                <View style={styles.streakCard}>
                  <Text style={styles.streakEmoji}>🏆</Text>
                  <Text style={styles.streakValue}>{data.longestStreak}</Text>
                  <Text style={styles.streakLabel}>Best</Text>
                </View>
              </View>
            </View>

            {/* ── Share Card ── */}
            <View style={styles.shareSection}>
              <View style={styles.shareCard}>
                <ThemeBird size={36} />
                <Text style={styles.shareTitle}>SongBird Wrapped {selectedYear}</Text>
                <Text style={styles.shareStats}>
                  {data.totalEntries} songs · {data.uniqueArtists} artists · {data.longestStreak} day streak
                </Text>
                {data.topArtists[0] && (
                  <Text style={styles.shareHighlight}>
                    Top Artist: {data.topArtists[0].name}
                  </Text>
                )}
              </View>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Ionicons name="share-social" size={18} color={colors.bg} />
                <Text style={styles.shareBtnText}>Share Your Wrapped</Text>
              </TouchableOpacity>
            </View>

            {/* ── Closing ── */}
            <View style={styles.closingSection}>
              <ThemeBird size={64} />
              <Text style={styles.closingText}>That's a wrap!</Text>
              <Text style={styles.closingSubtext}>
                Thanks for making {selectedYear} musical 🎶
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="Wrapped"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  loadingText: { color: colors.textMuted, fontSize: fontSize.md },
  content: { paddingBottom: spacing.xxl * 2 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  title: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text },

  // Year selector
  yearRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg },
  yearChip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.lg, backgroundColor: colors.surface },
  yearChipActive: { backgroundColor: colors.accent },
  yearChipText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '500' },
  yearChipTextActive: { color: colors.bg },

  // Premium gate
  premiumGate: { padding: spacing.xl, alignItems: 'center' },
  previewCard: {
    width: '100%',
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  blurOverlay: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    opacity: 0.35,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  previewStatItem: { alignItems: 'center' },
  previewStatVal: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.accent },
  previewStatLbl: { fontSize: fontSize.xs, color: colors.textMuted },
  previewRows: { gap: spacing.sm },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  previewRowEmoji: { fontSize: 18 },
  previewRowBar: {
    flex: 1,
    height: 12,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent + '30',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: spacing.xl,
  },
  previewTitle: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  previewDesc: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.lg },
  upgradeBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.xl, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl },
  upgradeBtnText: { color: colors.bg, fontSize: fontSize.md, fontWeight: '600' },

  // Empty state
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.xl },

  // Hero
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent + '33',
  },
  heroYear: { fontSize: fontSize.display, fontWeight: 'bold', color: colors.accent, marginTop: spacing.sm },
  heroSubtitle: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.lg },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { alignItems: 'center', flex: 1 },
  heroStatValue: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text },
  heroStatLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  heroDivider: { width: 1, height: 30, backgroundColor: colors.border, marginHorizontal: spacing.xs },

  // Sections
  section: { marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },

  // Podium
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  podiumSlot: { alignItems: 'center', flex: 1 },
  podiumFirst: { marginBottom: spacing.md },
  podiumImage: { width: 56, height: 56, borderRadius: 28, marginBottom: spacing.xs },
  podiumImageFirst: { width: 72, height: 72, borderRadius: 36 },
  podiumPlaceholder: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.accent + '33', justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.xs,
  },
  podiumName: { fontSize: fontSize.xs, fontWeight: '600', color: colors.text, textAlign: 'center', maxWidth: screenWidth * 0.25 },
  podiumCount: { fontSize: 10, color: colors.textMuted },

  // Rank items
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rankNumber: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.accent, width: 28, textAlign: 'center' },
  rankAvatar: { width: 44, height: 44, borderRadius: 22 },
  rankCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent + '33', justifyContent: 'center', alignItems: 'center' },
  rankCircleText: { fontSize: 20 },
  rankAlbumArt: { width: 44, height: 44, borderRadius: borderRadius.md },
  rankInfo: { flex: 1 },
  rankName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  rankCount: { fontSize: fontSize.sm, color: colors.textMuted },

  // Seasonal
  seasonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  seasonHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  seasonLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  seasonRow: { marginBottom: spacing.sm },
  seasonSubLabel: { fontSize: fontSize.xs, fontWeight: '600', color: colors.accent, marginBottom: 4 },
  seasonItem: { fontSize: fontSize.sm, color: colors.textMuted, marginLeft: spacing.sm, marginBottom: 2 },

  // Mood
  moodGrid: { gap: spacing.sm },
  moodItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  moodEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  moodBarBg: { flex: 1, height: 10, backgroundColor: colors.surface, borderRadius: borderRadius.sm, overflow: 'hidden' },
  moodBarFill: { height: '100%', backgroundColor: colors.accent, borderRadius: borderRadius.sm },
  moodCount: { fontSize: fontSize.xs, color: colors.textMuted, width: 30, textAlign: 'right' },

  // Streaks
  streakRow: { flexDirection: 'row', gap: spacing.md },
  streakCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, alignItems: 'center' },
  streakEmoji: { fontSize: 30, marginBottom: spacing.sm },
  streakValue: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text },
  streakLabel: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },

  // Share
  shareSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl, alignItems: 'center' },
  shareCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent + '40',
    marginBottom: spacing.md,
  },
  shareTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.accent, marginTop: spacing.sm },
  shareStats: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  shareHighlight: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginTop: spacing.sm },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  shareBtnText: { color: colors.bg, fontSize: fontSize.md, fontWeight: '600' },

  // Closing
  closingSection: { alignItems: 'center', paddingVertical: spacing.xxl },
  closingText: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text, marginTop: spacing.md },
  closingSubtext: { fontSize: fontSize.md, color: colors.textMuted, marginTop: spacing.xs },
});
