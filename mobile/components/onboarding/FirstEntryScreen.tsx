import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { colors, fontSize, spacing, borderRadius, defaultBirdImage } from '../../lib/theme';
import { api, SpotifyTrack } from '../../lib/api';
import { useAuthToken } from '../../lib/auth';
import ProgressDots from './ProgressDots';

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

interface FirstEntryScreenProps {
  onContinue: () => void;
  onSkip: () => void;
}

export default function FirstEntryScreen({ onContinue, onSkip }: FirstEntryScreenProps) {
  const { getToken } = useAuthToken();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBirdClick = () => {
    setShowForm(true);
  };

  const searchSongs = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
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
      setError('Failed to search songs');
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = async () => {
    if (!selectedTrack) return;

    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      await api.createEntry(token, {
        date,
        songTitle: selectedTrack.name,
        artist: selectedTrack.artist,
        albumTitle: selectedTrack.album,
        albumArt: selectedTrack.albumArt,
        trackId: selectedTrack.id,
        notes,
      });

      // Track analytics
      api.trackEvent(token, 'onboarding_first_entry_created').catch(() => {});

      setSaved(true);
      // Wait a moment to show success, then continue
      setTimeout(() => {
        onContinue();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    const token = await getToken();
    if (token) {
      api.trackEvent(token, 'onboarding_first_entry_skipped').catch(() => {});
    }
    onSkip();
  };

  // Success state
  if (saved) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.birdContainer}>
          <Image source={defaultBirdImage} style={styles.birdImage} resizeMode="contain" />
        </View>
        <Text style={styles.successTitle}>Got it!</Text>
        <Text style={styles.successText}>Your first memory is saved ♪</Text>
      </View>
    );
  }

  // Landing state (before form)
  if (!showForm) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Let's log your first song</Text>
          <Text style={styles.subtitle}>
            What song defined today? Or pick a recent day that stands out.
          </Text>

          {/* Tappable bird */}
          <TouchableOpacity
            style={styles.tappableBird}
            onPress={handleBirdClick}
            activeOpacity={0.8}
          >
            <Animated.View style={styles.birdPulse}>
              <Image source={defaultBirdImage} style={styles.largeBirdImage} resizeMode="contain" />
            </Animated.View>
          </TouchableOpacity>

          <Text style={styles.tapHint}>Tap the bird to get started</Text>
        </View>

        {/* Skip option */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>I'll do this later</Text>
          </TouchableOpacity>
        </View>

        <ProgressDots totalSteps={6} currentStep={2} />
      </View>
    );
  }

  // Form state
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date picker - simplified for now, just showing the date */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Date</Text>
          <View style={styles.dateDisplay}>
            <Text style={styles.dateText}>
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Search for a song</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Song or artist name..."
              placeholderTextColor={colors.textMuted + '4D'}
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
                  <Image source={{ uri: track.albumArt }} style={styles.albumArt} />
                )}
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
              <Text style={styles.label}>
                Notes <Text style={styles.optionalLabel}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="What made this song special today?"
                placeholderTextColor={colors.textMuted + '4D'}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <Text style={styles.editHint}>
              Not sure yet? You can always edit or change songs later from your timeline.
            </Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.saveButton, (!selectedTrack || saving) && styles.disabledSaveButton]}
          onPress={saveEntry}
          disabled={!selectedTrack || saving}
        >
          <Text
            style={[styles.saveButtonText, (!selectedTrack || saving) && styles.disabledButtonText]}
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>I'll do this later</Text>
        </TouchableOpacity>
      </View>

      <ProgressDots totalSteps={6} currentStep={2} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  tappableBird: {
    marginBottom: spacing.md,
  },
  birdPulse: {
    // Add animation later
  },
  largeBirdImage: {
    width: 160,
    height: 160,
  },
  tapHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  bottomContainer: {
    paddingBottom: spacing.sm,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  // Form styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  dateDisplay: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  dateText: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  searchButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.xl,
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
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  albumArt: {
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
    marginBottom: spacing.lg,
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
    marginTop: spacing.md,
  },
  optionalLabel: {
    color: colors.textMuted,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    minHeight: 80,
  },
  editHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
  },
  errorContainer: {
    backgroundColor: '#ef4444' + '1A',
    borderWidth: 1,
    borderColor: '#ef4444' + '4D',
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: '#f87171',
    fontSize: fontSize.sm,
  },
  bottomActions: {
    paddingVertical: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  disabledSaveButton: {
    backgroundColor: colors.surface,
  },
  saveButtonText: {
    color: colors.bg,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButtonText: {
    color: colors.textMuted,
  },
  // Success state
  successContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  birdContainer: {
    marginBottom: spacing.lg,
  },
  birdImage: {
    width: 120,
    height: 120,
  },
  successTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  successText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
});
