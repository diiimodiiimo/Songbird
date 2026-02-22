// Premium upsell screen during onboarding (matches web PremiumScreen)
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

interface PremiumScreenProps {
  onContinue: () => void;
  totalSteps: number;
  currentStep: number;
}

const PREMIUM_FEATURES = [
  { icon: '📊', title: 'Insights & Analytics', desc: 'Deep dive into your listening patterns.' },
  { icon: '🎁', title: 'Wrapped Summary', desc: 'Beautiful year-in-review summaries.' },
  { icon: '🐦', title: 'Exclusive Birds', desc: 'Unlock special bird themes and avatars.' },
  { icon: '♾️', title: 'Unlimited History', desc: 'Full access to your song journal history.' },
  { icon: '🏆', title: 'Advanced Streaks', desc: 'Detailed streak statistics and recovery.' },
  { icon: '🎨', title: 'Custom Themes', desc: 'Additional themes and customization options.' },
];

export default function PremiumScreen({ onContinue, totalSteps, currentStep }: PremiumScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.badge}>✨ SongBird Plus</Text>
        <Text style={styles.title}>Take Your Journal Further</Text>
        <Text style={styles.subtitle}>
          Unlock the full SongBird experience with premium features.
        </Text>

        <View style={styles.featuresGrid}>
          {PREMIUM_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.pricingCard}>
          <Text style={styles.pricingLabel}>SongBird Plus</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>$4.99</Text>
            <Text style={styles.pricePeriod}>/month</Text>
          </View>
          <Text style={styles.pricingNote}>Cancel anytime • Free 7-day trial</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {/* TODO: Replace with RevenueCat in-app purchase */}
        <TouchableOpacity style={styles.upgradeBtn} onPress={onContinue}>
          <Text style={styles.upgradeBtnText}>Start Free Trial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={onContinue}>
          <Text style={styles.skipText}>Maybe later</Text>
        </TouchableOpacity>
        <ProgressDots totalSteps={totalSteps} currentStep={currentStep} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  badge: { fontSize: fontSize.md, fontWeight: '600', color: colors.accent, backgroundColor: colors.accent + '20', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.md },
  title: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.md },
  featuresGrid: { width: '100%', gap: spacing.sm, marginBottom: spacing.xl },
  featureCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md },
  featureIcon: { fontSize: 28 },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: 2 },
  featureDesc: { fontSize: fontSize.sm, color: colors.textMuted },
  pricingCard: { backgroundColor: colors.accent + '10', borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: colors.accent + '40' },
  pricingLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.accent, marginBottom: spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.xs },
  price: { fontSize: 36, fontWeight: 'bold', color: colors.text },
  pricePeriod: { fontSize: fontSize.md, color: colors.textMuted, marginLeft: 4 },
  pricingNote: { fontSize: fontSize.sm, color: colors.textMuted },
  footer: { padding: spacing.lg },
  upgradeBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  upgradeBtnText: { color: colors.bg, fontSize: fontSize.lg, fontWeight: '600' },
  skipBtn: { alignItems: 'center', paddingVertical: spacing.sm, marginBottom: spacing.md },
  skipText: { color: colors.textMuted, fontSize: fontSize.md },
});


