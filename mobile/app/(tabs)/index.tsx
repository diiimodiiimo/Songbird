// Today Tab - Main entry screen (web TodayTab.tsx + mobile features combined)
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, spacing, borderRadius, defaultBirdImage } from '../../lib/theme';
import { api, apiFetch, SpotifyTrack, Entry, Milestone } from '../../lib/api';
import { useAuth, useUser, useAuthToken } from '../../lib/auth';
import ThemeBird from '../../components/ThemeBird';
import MoodPicker from '../../components/MoodPicker';
import MilestoneModal from '../../components/MilestoneModal';

const { width: screenWidth } = Dimensions.get('window');
const ALBUM_ART_SIZE = Math.min(screenWidth - spacing.lg * 4, 300);

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  durationMs: number;
  explicit: boolean;
  popularity: number;
  releaseDate?: string;
  uri: string;
}

interface MilestoneInfo {
  type: string;
  message: string;
  achieved: boolean;
  achievedDate?: string;
  progress?: {
    current: number;
    target: number;
    message: string;
  };
}

interface MilestoneDataResponse {
  milestones: MilestoneInfo[];
  nextMilestone: MilestoneInfo | null;
  stats: {
    entryCount: number;
    daysSinceFirst: number;
  };
}

interface FriendToday {
  id: string;
  name: string;
  image: string | null;
}

export default function TodayTab() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { getToken } = useAuthToken();

  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingEntry, setExistingEntry] = useState<Entry | null>(null);
  const [checkingEntry, setCheckingEntry] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [currentStreak, setCurrentStreak] = useState(0);
  const [onThisDayEntries, setOnThisDayEntries] = useState<Entry[]>([]);
  const [milestoneInfo, setMilestoneInfo] = useState<MilestoneDataResponse | null>(null);
  const [friendsToday, setFriendsToday] = useState<FriendToday[]>([]);
  const [milestoneData, setMilestoneData] = useState<Milestone | null>(null);
  const [showMilestone, setShowMilestone] = useState(false);

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const fetchTodayData = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setCheckingEntry(true);
    try {
      const token = await getToken();
      if (!token) return;

      const data = await api.getTodayEntry(token);
      if (data.entry) {
        setExistingEntry(data.entry);
        setNotes(data.entry.notes || '');
      } else {
        setExistingEntry(null);
        setNotes('');
      }

      try {
        const streakData = await api.getStreak(token);
        if (streakData.currentStreak !== undefined) {
          setCurrentStreak(streakData.currentStreak);
        }
      } catch {}

      try {
        const otdData = await api.getOnThisDay(token);
        if (otdData.memories) {
          setOnThisDayEntries(otdData.memories);
        }
      } catch {}

      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const msData = await apiFetch<MilestoneDataResponse>(
          `/api/milestones?today=${todayStr}`,
          { token }
        );
        setMilestoneInfo(msData);
      } catch {}

      try {
        const ftData = await api.getFriendsToday(token);
        if (ftData.friends) {
          setFriendsToday(ftData.friends);
        }
      } catch {}
    } catch (error) {
      console.error('Error fetching today data:', error);
    } finally {
      setCheckingEntry(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchTodayData();
  }, [fetchTodayData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTodayData();
    setRefreshing(false);
  };

  const searchSongs = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await api.searchSongs(query);
      const mappedTracks = data.tracks.map((t: SpotifyTrack) => ({
        id: t.id,
        name: t.name,
        artist: t.artists.map((a) => a.name).join(', '),
        album: t.album.name,
        albumArt: t.album.images[0]?.url || '',
        durationMs: t.duration_ms,
        explicit: t.explicit,
        popularity: t.popularity,
        releaseDate: t.release_date,
        uri: t.uri,
      }));
      setTracks(mappedTracks);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to search songs' });
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = async () => {
    if (!selectedTrack) return;

    setLoading(true);
    setMessage(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const entryData = {
        date,
        songTitle: selectedTrack.name,
        artist: selectedTrack.artist,
        albumTitle: selectedTrack.album,
        albumArt: selectedTrack.albumArt,
        trackId: selectedTrack.id,
        notes,
        mood: mood || undefined,
      };

      if (existingEntry) {
        await api.updateEntry(token, existingEntry.id, entryData);
        setMessage({ type: 'success', text: 'Entry updated!' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const result = await api.createEntry(token, entryData);
        setMessage({ type: 'success', text: 'Entry saved!' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (result.milestone) {
          setMilestoneData(result.milestone);
          setShowMilestone(true);
        }
      }

      await fetchTodayData();
      setShowForm(false);
      setSelectedTrack(null);
      setTracks([]);
      setQuery('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save entry' });
    } finally {
      setLoading(false);
    }
  };

  // ── Shared sub-components ────────────────────────────────────────────────────

  const renderMilestoneBanner = () => {
    if (!milestoneInfo?.milestones?.length) return null;
    const latest = milestoneInfo.milestones[milestoneInfo.milestones.length - 1];
    return (
      <View style={styles.milestoneBanner}>
        <Text style={styles.milestoneEmoji}>🎉</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.milestoneMessage}>{latest.message}</Text>
          {latest.achievedDate && (
            <Text style={styles.milestoneDate}>
              Achieved{' '}
              {new Date(latest.achievedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderNextMilestone = () => {
    const next = milestoneInfo?.nextMilestone;
    if (!next || next.achieved) return null;
    const progress = next.progress;
    const pct = progress
      ? Math.min(100, (progress.current / progress.target) * 100)
      : 0;
    return (
      <View style={styles.nextMilestoneCard}>
        <Text style={styles.nextMilestoneLabel}>Next milestone</Text>
        <Text style={styles.nextMilestoneMessage}>{next.message}</Text>
        {progress && (
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabelText}>{progress.message}</Text>
              <Text style={styles.progressLabelText}>
                {progress.current} / {progress.target}
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { flex: pct }]} />
              <View style={{ flex: Math.max(0, 100 - pct) }} />
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderHeroHeader = () => (
    <View style={styles.heroHeader}>
      <Text style={styles.heroDate}>{dateString}</Text>
      <Text style={styles.heroSubtitle}>How will we remember today?</Text>
    </View>
  );

  const renderStreakBadge = () => {
    if (currentStreak <= 0) return null;
    return (
      <View style={styles.streakContainer}>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 {currentStreak} day streak</Text>
        </View>
      </View>
    );
  };

  const renderFriendsToday = () => {
    if (!friendsToday.length) return null;
    return (
      <View style={styles.friendsTodaySection}>
        <View style={styles.friendAvatarRow}>
          {friendsToday.slice(0, 5).map((friend, i) => (
            <View
              key={friend.id}
              style={[styles.friendAvatar, i > 0 && { marginLeft: -8 }]}
            >
              {friend.image ? (
                <Image source={{ uri: friend.image }} style={styles.friendAvatarImage} />
              ) : (
                <View style={styles.friendAvatarPlaceholder}>
                  <Text style={styles.friendAvatarInitial}>
                    {(friend.name || '?')[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
        <Text style={styles.friendsTodayText}>
          {friendsToday.length === 1
            ? '1 friend also logged today'
            : `${friendsToday.length} friends also logged today`}
        </Text>
      </View>
    );
  };

  const renderSpotifyAttribution = () => (
    <Text style={styles.spotifyAttribution}>Song data powered by Spotify</Text>
  );

  const renderNavigationHints = () => (
    <View style={styles.navHints}>
      <TouchableOpacity activeOpacity={0.7}>
        <Text style={styles.navHintText}>See past days →</Text>
      </TouchableOpacity>
      {friendsToday.length > 0 && (
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.navHintText}>See friends today →</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderOnThisDay = () => {
    if (!onThisDayEntries.length) return null;
    return (
      <View style={styles.onThisDaySection}>
        <Text style={styles.sectionTitle}>On This Day</Text>
        {onThisDayEntries.map((entry) => (
          <View key={entry.id} style={styles.memoryCard}>
            {entry.albumArt && (
              <Image source={{ uri: entry.albumArt }} style={styles.memoryAlbumArt} />
            )}
            <View style={styles.memoryInfo}>
              <Text style={styles.memoryYear}>
                {new Date(entry.date).getFullYear()}
              </Text>
              <Text style={styles.memorySong} numberOfLines={1}>
                {entry.songTitle}
              </Text>
              <Text style={styles.memoryArtist} numberOfLines={1}>
                {entry.artist}
              </Text>
              {entry.notes && (
                <Text style={styles.memoryNotes} numberOfLines={1}>
                  {entry.notes}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  // ── Loading state ────────────────────────────────────────────────────────────

  if (!isLoaded || checkingEntry) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ThemeBird size={80} />
          <Text style={styles.loadingText}>Loading your music...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Entry form ───────────────────────────────────────────────────────────────

  if (showForm) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setShowForm(false);
                setSelectedTrack(null);
                setTracks([]);
                setQuery('');
              }}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.formTitle}>
              {existingEntry ? 'Change your song' : 'Log your song'}
            </Text>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search for a song..."
                placeholderTextColor={colors.textMuted + '80'}
                onSubmitEditing={searchSongs}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={[styles.searchButton, (!query.trim() || loading) && styles.disabledButton]}
                onPress={searchSongs}
                disabled={loading || !query.trim()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.bg} />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>

            {tracks.length > 0 && !selectedTrack && (
              <View style={styles.resultsContainer}>
                {tracks.slice(0, 5).map((track) => (
                  <TouchableOpacity
                    key={track.id}
                    style={styles.trackItem}
                    onPress={() => {
                      setSelectedTrack(track);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    {track.albumArt ? (
                      <Image source={{ uri: track.albumArt }} style={styles.trackAlbumArt} />
                    ) : null}
                    <View style={styles.trackInfo}>
                      <Text style={styles.trackName} numberOfLines={1}>
                        {track.name}
                      </Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>
                        {track.artist}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {renderSpotifyAttribution()}
              </View>
            )}

            {selectedTrack && (
              <View style={styles.selectedContainer}>
                <View style={styles.selectedTrack}>
                  {selectedTrack.albumArt ? (
                    <Image source={{ uri: selectedTrack.albumArt }} style={styles.selectedAlbumArt} />
                  ) : null}
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedName}>{selectedTrack.name}</Text>
                    <Text style={styles.selectedArtist}>{selectedTrack.artist}</Text>
                    <TouchableOpacity onPress={() => setSelectedTrack(null)}>
                      <Text style={styles.changeLink}>Change song</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <MoodPicker selected={mood} onSelect={setMood} />

                <View style={styles.notesContainer}>
                  <Text style={styles.label}>Notes (optional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="What made this song special today?"
                    placeholderTextColor={colors.textMuted + '80'}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, loading && styles.disabledButton]}
                  onPress={saveEntry}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Saving...' : existingEntry ? 'Update Entry' : 'Save Entry'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {message && (
              <View style={[styles.messageContainer, message.type === 'error' && styles.errorMessage]}>
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <MilestoneModal
          visible={showMilestone}
          milestone={milestoneData}
          onClose={() => {
            setShowMilestone(false);
            setMilestoneData(null);
          }}
        />
      </SafeAreaView>
    );
  }

  // ── Welcome state (no entry yet) ────────────────────────────────────────────

  if (!existingEntry) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
        >
          {renderMilestoneBanner()}
          {renderNextMilestone()}
          {renderHeroHeader()}
          {renderStreakBadge()}

          <View style={styles.ctaCard}>
            <TouchableOpacity
              style={styles.birdButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowForm(true);
              }}
              activeOpacity={0.8}
            >
              <ThemeBird size={96} />
            </TouchableOpacity>
            <Text style={styles.ctaTitle}>No song yet</Text>
            <Text style={styles.ctaSubtitle}>What song will hold today together?</Text>
            <TouchableOpacity
              style={styles.addSongButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowForm(true);
              }}
            >
              <Text style={styles.addSongButtonText}>Add today's song</Text>
            </TouchableOpacity>
          </View>

          {renderFriendsToday()}
          {renderNavigationHints()}
          {renderOnThisDay()}
        </ScrollView>

        <MilestoneModal
          visible={showMilestone}
          milestone={milestoneData}
          onClose={() => {
            setShowMilestone(false);
            setMilestoneData(null);
          }}
        />
      </SafeAreaView>
    );
  }

  // ── Existing entry view ──────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {renderMilestoneBanner()}
        {renderNextMilestone()}
        {renderHeroHeader()}
        {renderStreakBadge()}

        <View style={styles.entryCard}>
          {existingEntry.albumArt && (
            <View style={styles.albumArtWrapper}>
              <View style={styles.albumArtGlow} />
              <Image
                source={{ uri: existingEntry.albumArt }}
                style={styles.heroAlbumArt}
              />
            </View>
          )}

          <View style={styles.songInfoCenter}>
            <Text style={styles.heroSongTitle}>{existingEntry.songTitle}</Text>
            <Text style={styles.heroArtist}>{existingEntry.artist}</Text>

            {existingEntry.mood && (
              <View style={styles.moodBadge}>
                <Text style={styles.moodBadgeText}>{existingEntry.mood}</Text>
              </View>
            )}

            {renderSpotifyAttribution()}
          </View>

          {existingEntry.people && existingEntry.people.length > 0 && (
            <View style={styles.peopleSection}>
              <Text style={styles.peopleSectionLabel}>With</Text>
              <View style={styles.peopleRow}>
                {existingEntry.people.map((person) => (
                  <View key={person.id} style={styles.personTag}>
                    <Text style={styles.personTagText}>{person.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {renderFriendsToday()}
        </View>

        {existingEntry.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesCardText}>{existingEntry.notes}</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowForm(true);
              }}
            >
              <Text style={styles.editLink}>Edit today</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.changeSongButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowForm(true);
          }}
        >
          <Text style={styles.changeSongButtonText}>Change Song</Text>
        </TouchableOpacity>

        {renderNavigationHints()}
        {renderOnThisDay()}
      </ScrollView>

      <MilestoneModal
        visible={showMilestone}
        milestone={milestoneData}
        onClose={() => {
          setShowMilestone(false);
          setMilestoneData(null);
        }}
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },

  // Scroll
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Milestone banner
  milestoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '20',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '30',
    gap: spacing.md,
  },
  milestoneEmoji: {
    fontSize: 28,
  },
  milestoneMessage: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  milestoneDate: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },

  // Next milestone
  nextMilestoneCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '10',
  },
  nextMilestoneLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: 4,
  },
  nextMilestoneMessage: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  progressSection: {
    marginTop: spacing.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabelText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  progressBarBg: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: colors.bg,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
  },

  // Hero header
  heroHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  heroDate: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Streak
  streakContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  streakBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  streakText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },

  // CTA card (no entry)
  ctaCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  birdButton: {
    marginBottom: spacing.md,
  },
  ctaTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ctaSubtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  addSongButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
  },
  addSongButtonText: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontWeight: '600',
  },

  // Friends today
  friendsTodaySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  friendAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.bg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  friendAvatarImage: {
    width: '100%' as any,
    height: '100%' as any,
  },
  friendAvatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  friendAvatarInitial: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  friendsTodayText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },

  // Spotify attribution
  spotifyAttribution: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
    opacity: 0.7,
  },

  // Nav hints
  navHints: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginVertical: spacing.md,
  },
  navHintText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },

  // On This Day
  onThisDaySection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  memoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  memoryAlbumArt: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
  },
  memoryInfo: {
    flex: 1,
  },
  memoryYear: {
    fontSize: fontSize.xs,
    color: colors.accent,
    marginBottom: 2,
  },
  memorySong: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  memoryArtist: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  memoryNotes: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Entry card (existing entry)
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  // Enhanced album art
  albumArtWrapper: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  albumArtGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: borderRadius.xl + 4,
    backgroundColor: colors.accent,
    opacity: 0.2,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
      },
    }),
  },
  heroAlbumArt: {
    width: ALBUM_ART_SIZE,
    height: ALBUM_ART_SIZE,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Song info (centered, web-style)
  songInfoCenter: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  heroSongTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroArtist: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  // Mood badge
  moodBadge: {
    backgroundColor: colors.accent + '1A',
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  moodBadgeText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },

  // People/tags
  peopleSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.bg + '40',
  },
  peopleSectionLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  peopleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  personTag: {
    backgroundColor: colors.card,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  personTagText: {
    color: colors.text,
    fontSize: fontSize.sm,
  },

  // Notes card
  notesCard: {
    backgroundColor: colors.surface + 'AA',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  notesCardText: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 24,
    opacity: 0.85,
  },
  editLink: {
    color: colors.accent,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },

  // Change song button
  changeSongButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
  },
  changeSongButtonText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },

  // ── Form styles ──────────────────────────────────────────────────────────────

  formContent: {
    padding: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backButtonText: {
    color: colors.accent,
    fontSize: fontSize.md,
  },
  formTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  searchButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  resultsContainer: {
    gap: spacing.sm,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  trackAlbumArt: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  trackArtist: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  selectedContainer: {
    marginTop: spacing.md,
  },
  selectedTrack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '4D',
    gap: spacing.md,
  },
  selectedAlbumArt: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: 'bold',
  },
  selectedArtist: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  changeLink: {
    color: colors.accent,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  notesContainer: {
    marginTop: spacing.lg,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    minHeight: 80,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  saveButtonText: {
    color: colors.bg,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: colors.success + '1A',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorMessage: {
    backgroundColor: colors.error + '1A',
  },
  messageText: {
    color: colors.text,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
