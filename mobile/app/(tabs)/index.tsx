// Today Tab - Main entry screen (matches web AddEntryTab.tsx)
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import { api, SpotifyTrack, Entry } from '../../lib/api';
import { useAuth, useUser, useAuthToken } from '../../lib/auth';

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

export default function TodayTab() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { getToken } = useAuthToken();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingEntry, setExistingEntry] = useState<Entry | null>(null);
  const [checkingEntry, setCheckingEntry] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [onThisDayEntries, setOnThisDayEntries] = useState<Entry[]>([]);

  const isToday = date === new Date().toISOString().split('T')[0];
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

  // Fetch today's data
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

      // Try to get streak
      try {
        const response = await fetch(`https://songbird.vercel.app/api/streak`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const streakData = await response.json();
        if (streakData.currentStreak !== undefined) {
          setCurrentStreak(streakData.currentStreak);
        }
      } catch (err) {
        console.log('Could not fetch streak');
      }

      // Try to get on this day
      try {
        const otdData = await api.getOnThisDay(token);
        if (otdData.memories) {
          setOnThisDayEntries(otdData.memories);
        }
      } catch (err) {
        console.log('Could not fetch on this day');
      }
    } catch (error) {
      console.error('Error fetching today data:', error);
    } finally {
      setCheckingEntry(false);
    }
  }, [isLoaded, isSignedIn, getToken, date]);

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
      };

      if (existingEntry) {
        await api.updateEntry(token, existingEntry.id, entryData);
        setMessage({ type: 'success', text: 'Entry updated!' });
      } else {
        await api.createEntry(token, entryData);
        setMessage({ type: 'success', text: 'Entry saved!' });
      }

      // Refresh data
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

  // Loading state
  if (!isLoaded || checkingEntry) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.birdEmoji}>🐦</Text>
          <Text style={styles.loadingText}>Loading your music...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Welcome state - show CTA to add entry
  if (!existingEntry && !showForm) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.welcomeContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Happy {dayName}!</Text>
            {currentStreak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {currentStreak} day streak</Text>
              </View>
            )}
          </View>

          {/* Bird CTA */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={styles.birdButton}
              onPress={() => setShowForm(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.largeBirdEmoji}>🐦</Text>
            </TouchableOpacity>
            <Text style={styles.ctaText}>What song defined your day?</Text>
            <Text style={styles.ctaSubtext}>Tap the bird to log your song</Text>
          </View>

          {/* On This Day */}
          {onThisDayEntries.length > 0 && (
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
                    <Text style={styles.memorySong} numberOfLines={1}>{entry.songTitle}</Text>
                    <Text style={styles.memoryArtist} numberOfLines={1}>{entry.artist}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show existing entry
  if (existingEntry && !showForm) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.entryContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Happy {dayName}!</Text>
            {currentStreak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {currentStreak} day streak</Text>
              </View>
            )}
          </View>

          {/* Today's entry */}
          <View style={styles.entryCard}>
            <Text style={styles.entryLabel}>Today's Song</Text>
            <View style={styles.entryMain}>
              {existingEntry.albumArt && (
                <Image source={{ uri: existingEntry.albumArt }} style={styles.entryAlbumArt} />
              )}
              <View style={styles.entryDetails}>
                <Text style={styles.entrySong}>{existingEntry.songTitle}</Text>
                <Text style={styles.entryArtist}>{existingEntry.artist}</Text>
                {existingEntry.notes && (
                  <Text style={styles.entryNotes} numberOfLines={2}>{existingEntry.notes}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowForm(true)}
            >
              <Text style={styles.editButtonText}>Change Song</Text>
            </TouchableOpacity>
          </View>

          {/* On This Day */}
          {onThisDayEntries.length > 0 && (
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
                    <Text style={styles.memorySong} numberOfLines={1}>{entry.songTitle}</Text>
                    <Text style={styles.memoryArtist} numberOfLines={1}>{entry.artist}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Entry form
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.formContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          {/* Back button */}
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

          {/* Search */}
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

          {/* Search results */}
          {tracks.length > 0 && !selectedTrack && (
            <View style={styles.resultsContainer}>
              {tracks.slice(0, 5).map((track) => (
                <TouchableOpacity
                  key={track.id}
                  style={styles.trackItem}
                  onPress={() => setSelectedTrack(track)}
                >
                  {track.albumArt && (
                    <Image source={{ uri: track.albumArt }} style={styles.trackAlbumArt} />
                  )}
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackName} numberOfLines={1}>{track.name}</Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Selected track */}
          {selectedTrack && (
            <View style={styles.selectedContainer}>
              <View style={styles.selectedTrack}>
                {selectedTrack.albumArt && (
                  <Image source={{ uri: selectedTrack.albumArt }} style={styles.selectedAlbumArt} />
                )}
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedName}>{selectedTrack.name}</Text>
                  <Text style={styles.selectedArtist}>{selectedTrack.artist}</Text>
                  <TouchableOpacity onPress={() => setSelectedTrack(null)}>
                    <Text style={styles.changeLink}>Change song</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Notes */}
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

              {/* Save button */}
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

          {/* Message */}
          {message && (
            <View style={[styles.messageContainer, message.type === 'error' && styles.errorMessage]}>
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  birdEmoji: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  welcomeContent: {
    padding: spacing.lg,
  },
  entryContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
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
  ctaContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  birdButton: {
    marginBottom: spacing.lg,
  },
  largeBirdEmoji: {
    fontSize: 120,
  },
  ctaText: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  ctaSubtext: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  onThisDaySection: {
    marginTop: spacing.xl,
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
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  entryLabel: {
    fontSize: fontSize.sm,
    color: colors.accent,
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  entryMain: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  entryAlbumArt: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
  },
  entryDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  entrySong: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  entryArtist: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  entryNotes: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  editButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  // Form styles
  formContainer: {
    flex: 1,
  },
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

