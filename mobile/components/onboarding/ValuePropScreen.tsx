// Value proposition intro screens (matches web ValueProp1Screen)
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import ProgressDots from './ProgressDots';

interface ValuePropScreenProps {
  onContinue: () => void;
  totalSteps: number;
  currentStep: number;
}

const FEATURES = [
  { icon: '🎵', title: 'Daily Song Journal', desc: 'Log one song a day and capture what it means to you.' },
  { icon: '📅', title: 'On This Day Memories', desc: 'Revisit songs from the same date in past years.' },
  { icon: '👥', title: 'Social Sharing', desc: 'Discover what your friends are listening to.' },
  { icon: '🔥', title: 'Streaks & Milestones', desc: 'Build habits and unlock achievements.' },
];

export default function ValuePropScreen({ onContinue, totalSteps, currentStep }: ValuePropScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎶</Text>
        <Text style={styles.title}>What is SongBird?</Text>
        <Text style={styles.subtitle}>
          A music journal that helps you track the soundtrack of your life.
        </Text>

        <View style={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
          <Text style={styles.continueBtnText}>Sounds Great!</Text>
        </TouchableOpacity>
        <ProgressDots totalSteps={totalSteps} currentStep={currentStep} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 60, marginBottom: spacing.md },
  title: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.md },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, width: '100%', justifyContent: 'center' },
  featureCard: { width: '47%', backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, alignItems: 'center' },
  featureIcon: { fontSize: 28, marginBottom: spacing.xs },
  featureTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 4 },
  featureDesc: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
  footer: { padding: spacing.lg },
  continueBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  continueBtnText: { color: colors.bg, fontSize: fontSize.lg, fontWeight: '600' },
});


