// Social preview screen (matches web SocialPreviewScreen)
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import ProgressDots from './ProgressDots';

interface SocialPreviewScreenProps {
  onContinue: () => void;
  onSkip: () => void;
  totalSteps: number;
  currentStep: number;
}

export default function SocialPreviewScreen({ onContinue, onSkip, totalSteps, currentStep }: SocialPreviewScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Mock social feed cards */}
        <View style={styles.mockFeed}>
          <View style={styles.mockFeedCard}>
            <View style={styles.mockUser}>
              <View style={styles.mockAvatar} />
              <View>
                <Text style={styles.mockUsername}>sarah_music</Text>
                <Text style={styles.mockTime}>2 hours ago</Text>
              </View>
            </View>
            <Text style={styles.mockSong}>Superstition - Stevie Wonder</Text>
            <View style={styles.mockActions}>
              <Text style={styles.mockStat}>❤️ 12</Text>
              <Text style={styles.mockStat}>💬 3</Text>
            </View>
          </View>

          <View style={[styles.mockFeedCard, { opacity: 0.75 }]}>
            <View style={styles.mockUser}>
              <View style={styles.mockAvatar} />
              <View>
                <Text style={styles.mockUsername}>mike_songs</Text>
                <Text style={styles.mockTime}>5 hours ago</Text>
              </View>
            </View>
            <Text style={styles.mockSong}>Rabiosa - Shakira</Text>
            <View style={styles.mockActions}>
              <Text style={styles.mockStat}>❤️ 8</Text>
              <Text style={styles.mockStat}>💬 1</Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>Share With Your Flock</Text>
        <Text style={styles.subtitle}>
          See what your friends are listening to. Share your moments. Build your musical story together — or keep it private. Your choice.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
          <Text style={styles.continueBtnText}>Sounds Good</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipText}>Skip - I'll add friends later</Text>
        </TouchableOpacity>
        <ProgressDots totalSteps={totalSteps} currentStep={currentStep} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  mockFeed: { width: '100%', gap: spacing.sm, marginBottom: spacing.xl },
  mockFeedCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.accent + '30' },
  mockUser: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  mockAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent + '40' },
  mockUsername: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  mockTime: { fontSize: fontSize.xs, color: colors.textMuted },
  mockSong: { fontSize: fontSize.md, fontWeight: '500', color: colors.text, marginBottom: spacing.sm },
  mockActions: { flexDirection: 'row', gap: spacing.lg },
  mockStat: { fontSize: fontSize.sm, color: colors.textMuted },
  title: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.sm },
  footer: { padding: spacing.lg },
  continueBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  continueBtnText: { color: colors.bg, fontSize: fontSize.lg, fontWeight: '600' },
  skipBtn: { alignItems: 'center', paddingVertical: spacing.sm, marginBottom: spacing.md },
  skipText: { color: colors.textMuted, fontSize: fontSize.sm },
});


