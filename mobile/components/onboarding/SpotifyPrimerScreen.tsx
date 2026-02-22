// Spotify data primer screen (matches web SpotifyDataPrimerScreen)
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import ProgressDots from './ProgressDots';
import ThemeBird from '../ThemeBird';
import { api } from '../../lib/api';
import { useAuthToken } from '../../lib/auth';

interface SpotifyPrimerScreenProps {
  onContinue: () => void;
  totalSteps: number;
  currentStep: number;
}

export default function SpotifyPrimerScreen({ onContinue, totalSteps, currentStep }: SpotifyPrimerScreenProps) {
  const { getToken } = useAuthToken();

  const handleContinue = async () => {
    try {
      const token = await getToken();
      if (token) {
        api.trackEvent(token, 'onboarding_spotify_primer_viewed').catch(() => {});
      }
    } catch (err) {}
    onContinue();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemeBird size={80} />

        <Text style={styles.title}>How SongBird finds songs</Text>
        <Text style={styles.subtitle}>
          SongBird uses Spotify's music database to help you search and log songs.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>What SongBird accesses:</Text>
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Song search results (when you search for a song)</Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Album artwork and song metadata</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>What SongBird does NOT access:</Text>
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Your Spotify listening history</Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Your Spotify playlists or saved songs</Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Your Spotify account credentials</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.note}>
            SongBird uses Spotify's public API to search for songs. You don't need a Spotify account
            to use SongBird, and we never access your personal Spotify data.
          </Text>
        </View>

        {/* Spotify attribution */}
        <View style={styles.attribution}>
          <Text style={styles.attributionText}>Powered by Spotify</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>Got it</Text>
        </TouchableOpacity>
        <ProgressDots totalSteps={totalSteps} currentStep={currentStep} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  infoCard: { backgroundColor: colors.surface + '80', borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%', marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs },
  bullet: { color: colors.accent, fontSize: fontSize.md, marginTop: 1 },
  bulletText: { fontSize: fontSize.sm, color: colors.textMuted, flex: 1 },
  divider: { height: 1, backgroundColor: colors.textMuted + '20', marginVertical: spacing.md },
  note: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 18 },
  attribution: { marginBottom: spacing.md },
  attributionText: { fontSize: fontSize.xs, color: colors.textMuted },
  footer: { padding: spacing.lg },
  continueBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  continueBtnText: { color: colors.bg, fontSize: fontSize.lg, fontWeight: '600' },
});


