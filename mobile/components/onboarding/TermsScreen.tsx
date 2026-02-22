// Terms & Privacy acceptance screen (matches web TermsAcceptanceScreen.tsx)
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius, defaultBirdImage } from '../../lib/theme';
import ProgressDots from './ProgressDots';
import { api } from '../../lib/api';
import { useAuthToken } from '../../lib/auth';

interface TermsScreenProps {
  onContinue: () => void;
  totalSteps: number;
  currentStep: number;
}

const DATA_ITEMS = [
  'Your song choices and journal entries',
  'Your notes and memories',
  'Your friends list (if you use social features)',
  'Basic account information (email, username)',
];

export default function TermsScreen({ onContinue, totalSteps, currentStep }: TermsScreenProps) {
  const { getToken } = useAuthToken();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const allAccepted = termsAccepted && privacyAccepted;

  const handleContinue = async () => {
    if (!allAccepted) return;
    try {
      const token = await getToken();
      if (token) {
        api.trackEvent(token, 'onboarding_terms_accepted').catch(() => {});
      }
    } catch (err) {}
    onContinue();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={defaultBirdImage} style={styles.birdImage} resizeMode="contain" />
        <Text style={styles.title}>Terms & Privacy</Text>
        <Text style={styles.subtitle}>
          Please review and accept our Terms of Service and Privacy Policy to continue.
        </Text>

        {/* Data collection summary */}
        <View style={styles.dataCard}>
          <Text style={styles.dataTitle}>What we collect:</Text>
          {DATA_ITEMS.map((item, i) => (
            <View key={i} style={styles.dataRow}>
              <Text style={styles.dataDot}>•</Text>
              <Text style={styles.dataText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Terms checkbox */}
        <TouchableOpacity
          style={[styles.checkboxCard, termsAccepted && styles.checkboxActive]}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.checkboxInfo}>
            <Text style={styles.checkboxTitle}>
              I agree to the{' '}
              <Text
                style={styles.link}
                onPress={() => Linking.openURL('https://songbird.vercel.app/terms')}
              >
                Terms of Service
              </Text>
            </Text>
          </View>
        </TouchableOpacity>

        {/* Privacy checkbox */}
        <TouchableOpacity
          style={[styles.checkboxCard, privacyAccepted && styles.checkboxActive]}
          onPress={() => setPrivacyAccepted(!privacyAccepted)}
        >
          <View style={[styles.checkbox, privacyAccepted && styles.checkboxChecked]}>
            {privacyAccepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.checkboxInfo}>
            <Text style={styles.checkboxTitle}>
              I agree to the{' '}
              <Text
                style={styles.link}
                onPress={() => Linking.openURL('https://songbird.vercel.app/privacy')}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !allAccepted && styles.disabledBtn]}
          onPress={handleContinue}
          disabled={!allAccepted}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
        <ProgressDots totalSteps={totalSteps} currentStep={currentStep} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  birdImage: { width: 80, height: 80, marginBottom: spacing.md },
  title: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.md },
  dataCard: { backgroundColor: colors.surface + '80', borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%', marginBottom: spacing.lg },
  dataTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  dataRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs },
  dataDot: { color: colors.accent, fontSize: fontSize.md },
  dataText: { fontSize: fontSize.sm, color: colors.textMuted, flex: 1 },
  checkboxCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%', marginBottom: spacing.sm },
  checkboxActive: { borderWidth: 1, borderColor: colors.accent },
  checkbox: { width: 24, height: 24, borderRadius: borderRadius.md, borderWidth: 2, borderColor: colors.textMuted, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  checkboxInfo: { flex: 1 },
  checkboxTitle: { fontSize: fontSize.md, fontWeight: '500', color: colors.text },
  link: { color: colors.accent },
  footer: { padding: spacing.lg },
  continueBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  continueBtnText: { color: colors.bg, fontSize: fontSize.lg, fontWeight: '600' },
  disabledBtn: { opacity: 0.3 },
});


