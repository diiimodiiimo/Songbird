// "See Your Story Unfold" value prop screen (matches web ValueProp2Screen)
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import ProgressDots from './ProgressDots';

interface ValueProp2ScreenProps {
  onContinue: () => void;
  totalSteps: number;
  currentStep: number;
}

export default function ValueProp2Screen({ onContinue, totalSteps, currentStep }: ValueProp2ScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Mock "On This Day" card */}
        <View style={styles.mockCard}>
          <Text style={styles.mockDate}>January 25, 2025</Text>
          <View style={styles.mockRow}>
            <View style={styles.mockAlbumArt} />
            <View style={styles.mockInfo}>
              <Text style={styles.mockSong}>Hundred</Text>
              <Text style={styles.mockArtist}>Khalid</Text>
            </View>
          </View>
          <View style={styles.mockNotes}>
            <Text style={styles.mockNotesText}>
              "Winter and 'Hundred' by Khalid. Something about cold weather makes certain songs hit harder.
              Looking at your history for this date across 4 years, you can see how your winter soundtrack has evolved."
            </Text>
          </View>
        </View>

        <Text style={styles.title}>See Your Story Unfold</Text>
        <Text style={styles.subtitle}>
          Our AI finds patterns you'd never notice. Rediscover how your musical taste evolves with your life.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
          <Text style={styles.continueBtnText}>I'm Interested</Text>
        </TouchableOpacity>
        <ProgressDots totalSteps={totalSteps} currentStep={currentStep} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  mockCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%', marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.accent + '30' },
  mockDate: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '500', marginBottom: spacing.sm },
  mockRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  mockAlbumArt: { width: 64, height: 64, borderRadius: borderRadius.lg, backgroundColor: '#7c3aed' },
  mockInfo: { flex: 1, justifyContent: 'center' },
  mockSong: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text, marginBottom: 2 },
  mockArtist: { fontSize: fontSize.sm, color: colors.textMuted },
  mockNotes: { backgroundColor: colors.bg + '80', borderRadius: borderRadius.lg, padding: spacing.md },
  mockNotesText: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20 },
  title: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.md },
  footer: { padding: spacing.lg },
  continueBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  continueBtnText: { color: colors.bg, fontSize: fontSize.lg, fontWeight: '600' },
});


