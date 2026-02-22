// First entry celebration screen (matches web FirstEntryCelebrationScreen)
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import ThemeBird from '../ThemeBird';
import * as Haptics from 'expo-haptics';

interface FirstEntryCelebrationScreenProps {
  onContinue: () => void;
  onViewEntry: () => void;
  entry?: {
    songTitle: string;
    artist: string;
    albumArt: string | null;
    date: string;
    notes?: string;
  };
}

export default function FirstEntryCelebrationScreen({
  onContinue,
  onViewEntry,
  entry,
}: FirstEntryCelebrationScreenProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Celebration Bird */}
        <ThemeBird size={100} />

        <Text style={styles.title}>Your first memory is saved!</Text>

        {/* Entry Preview */}
        {entry && (
          <View style={styles.entryCard}>
            {entry.albumArt && (
              <Image
                source={{ uri: entry.albumArt }}
                style={styles.albumArt}
                resizeMode="cover"
              />
            )}
            <Text style={styles.entrySong}>{entry.songTitle}</Text>
            <Text style={styles.entryArtist}>{entry.artist}</Text>
            <Text style={styles.entryDate}>
              {new Date(entry.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            {entry.notes && (
              <Text style={styles.entryNotes}>"{entry.notes}"</Text>
            )}
          </View>
        )}

        <Text style={styles.encouragement}>
          Come back tomorrow to start your streak. Every day you log, you're building something special.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onViewEntry}>
          <Text style={styles.primaryBtnText}>See My First Entry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onContinue}>
          <Text style={styles.secondaryBtnText}>Continue Setup</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  entryCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: colors.accent + '30', marginBottom: spacing.xl },
  albumArt: { width: 160, height: 160, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  entrySong: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 2 },
  entryArtist: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.xs },
  entryDate: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.sm },
  entryNotes: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: spacing.sm },
  encouragement: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', lineHeight: 24, paddingHorizontal: spacing.md },
  footer: { padding: spacing.lg },
  primaryBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  primaryBtnText: { color: colors.bg, fontSize: fontSize.lg, fontWeight: '600' },
  secondaryBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  secondaryBtnText: { color: colors.textMuted, fontSize: fontSize.sm },
});


