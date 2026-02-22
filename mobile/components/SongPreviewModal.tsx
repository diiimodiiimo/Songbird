import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, birdThemes, defaultBirdImage } from '../lib/theme';

interface TaggedPerson {
  id: string;
  name: string;
  userId?: string | null;
}

interface AviarySong {
  id: string;
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  albumArtUrl: string;
  taggedPeople: TaggedPerson[];
  createdAt: string;
}

interface AviaryUser {
  id: string;
  username: string;
  name: string | null;
  avatarUrl?: string;
  theme: string;
}

export interface AviaryBirdData {
  user: AviaryUser;
  latestSong: AviarySong | null;
  isCurrentUser: boolean;
  activityTier: string;
  lastActivityDate: string | null;
}

interface SongPreviewModalProps {
  bird: AviaryBirdData | null;
  visible: boolean;
  onClose: () => void;
}

export default function SongPreviewModal({ bird, visible, onClose }: SongPreviewModalProps) {
  if (!bird) return null;

  const { user, latestSong, isCurrentUser } = bird;
  const theme = birdThemes[user.theme];
  const birdImage = theme?.image || defaultBirdImage;

  const handlePlayOnSpotify = () => {
    if (latestSong?.spotifyTrackId) {
      Linking.openURL(`https://open.spotify.com/track/${latestSong.spotifyTrackId}`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modal}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image
                source={birdImage}
                style={styles.headerBird}
                resizeMode="contain"
              />
              <Text style={styles.headerUsername} numberOfLines={1}>
                {isCurrentUser ? 'You' : user.username}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {latestSong ? (
              <>
                {/* Album art */}
                {latestSong.albumArtUrl ? (
                  <Image
                    source={{ uri: latestSong.albumArtUrl }}
                    style={styles.albumArt}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.albumArt, styles.albumArtPlaceholder]}>
                    <Ionicons name="musical-notes" size={48} color={colors.textMuted} />
                  </View>
                )}

                {/* Song info */}
                <Text style={styles.trackName} numberOfLines={2}>
                  {latestSong.trackName}
                </Text>
                <Text style={styles.artistName} numberOfLines={1}>
                  {latestSong.artistName}
                </Text>

                {/* Tagged people */}
                {latestSong.taggedPeople && latestSong.taggedPeople.length > 0 && (
                  <View style={styles.taggedSection}>
                    <Text style={styles.taggedLabel}>Mentioned: </Text>
                    <Text style={styles.taggedNames}>
                      {latestSong.taggedPeople.map(p => p.name).join(', ')}
                    </Text>
                  </View>
                )}

                {/* Logged date */}
                <Text style={styles.loggedDate}>
                  Logged {formatRelativeDate(latestSong.createdAt)}
                </Text>

                {/* Spotify button */}
                <TouchableOpacity style={styles.spotifyButton} onPress={handlePlayOnSpotify}>
                  <Ionicons name="musical-note" size={20} color="#fff" />
                  <Text style={styles.spotifyButtonText}>Listen on Spotify</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.noSongContainer}>
                <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
                <Text style={styles.noSongText}>
                  {isCurrentUser
                    ? "You haven't logged a song yet today."
                    : `${user.username} hasn't logged a song yet.`}
                </Text>
              </View>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerBird: {
    width: 32,
    height: 32,
  },
  headerUsername: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentScroll: {
    flexGrow: 0,
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  albumArt: {
    width: 180,
    height: 180,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  albumArtPlaceholder: {
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  artistName: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  taggedSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  taggedLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  taggedNames: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '500',
  },
  loggedDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  spotifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#1DB954',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  spotifyButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  noSongContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  noSongText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
