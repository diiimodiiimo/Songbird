import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';

interface SongShareCardProps {
  songTitle: string;
  artist: string;
  albumArt: string;
  date: string;
  username: string;
  notes?: string;
}

function formatDate(dateStr: string): string {
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDayLabel(dateStr: string): string {
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  if (d.getTime() === today.getTime()) return "Today's";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getTime() === yesterday.getTime()) return "Yesterday's";

  return d.toLocaleDateString('en-US', { weekday: 'long' }) + "'s";
}

export default function SongShareCard({
  songTitle,
  artist,
  albumArt,
  date,
  username,
  notes,
}: SongShareCardProps) {
  const [sharing, setSharing] = useState(false);
  const dayLabel = getDayLabel(date);
  const formattedDate = formatDate(date);

  const handleShare = async () => {
    setSharing(true);
    try {
      const message = notes
        ? `🐦 ${dayLabel} Song of the Day\n\n🎵 ${songTitle} — ${artist}\n\n"${notes}"\n\n📅 ${formattedDate}\n@${username} on SongBird`
        : `🐦 ${dayLabel} Song of the Day\n\n🎵 ${songTitle} — ${artist}\n\n📅 ${formattedDate}\n@${username} on SongBird`;

      await Share.share({
        message,
        title: `${songTitle} by ${artist} — My Song of the Day`,
      });
    } catch (error) {
      // Share cancelled or failed
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Accent bar at top */}
      <View style={styles.accentBar} />

      {/* Header label */}
      <Text style={styles.dayLabel}>
        {dayLabel.toUpperCase()} SONG OF THE DAY
      </Text>

      {/* Album art */}
      <View style={styles.artContainer}>
        <View style={styles.artGlow} />
        <Image source={{ uri: albumArt }} style={styles.albumArt} />
      </View>

      {/* Song info */}
      <Text style={styles.songTitle} numberOfLines={2}>
        {songTitle}
      </Text>
      <Text style={styles.artist}>{artist}</Text>

      {/* Optional notes */}
      {notes ? (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText} numberOfLines={3}>
            &ldquo;{notes}&rdquo;
          </Text>
        </View>
      ) : null}

      {/* Date & username */}
      <View style={styles.metaContainer}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <Text style={styles.username}>@{username}</Text>
      </View>

      {/* Branding */}
      <View style={styles.brandingPill}>
        <Text style={styles.brandingText}>🐦  SongBird</Text>
      </View>

      {/* Share button */}
      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
        disabled={sharing}
        activeOpacity={0.8}
      >
        {sharing ? (
          <ActivityIndicator size="small" color={colors.bg} />
        ) : (
          <>
            <Ionicons name="share-outline" size={18} color={colors.bg} />
            <Text style={styles.shareButtonText}>Share</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.accent,
  },
  dayLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 2,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  artContainer: {
    width: 200,
    height: 200,
    marginBottom: spacing.lg,
    position: 'relative',
  },
  artGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: borderRadius.xl + 8,
    backgroundColor: colors.accent + '15',
  },
  albumArt: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.xl,
  },
  songTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  artist: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  notesContainer: {
    backgroundColor: colors.accent + '12',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '25',
    maxWidth: '90%',
  },
  notesText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  metaContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textMuted + 'AA',
  },
  username: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.accent + 'BB',
    marginTop: spacing.xs,
  },
  brandingPill: {
    backgroundColor: colors.text + '08',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  brandingText: {
    fontSize: fontSize.xs,
    color: colors.textMuted + '60',
    fontWeight: '600',
    letterSpacing: 1,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.xl,
    width: '100%',
  },
  shareButtonText: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
