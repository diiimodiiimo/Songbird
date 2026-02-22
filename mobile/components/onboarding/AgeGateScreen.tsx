// Age gate / demographics screen (matches web AgeGateScreen.tsx)
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius, defaultBirdImage } from '../../lib/theme';
import ProgressDots from './ProgressDots';
import { api } from '../../lib/api';
import { useAuthToken } from '../../lib/auth';

interface AgeGateScreenProps {
  onContinue: () => void;
  totalSteps: number;
  currentStep: number;
}

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

export default function AgeGateScreen({ onContinue, totalSteps, currentStep }: AgeGateScreenProps) {
  const { getToken } = useAuthToken();
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [gender, setGender] = useState('');

  const handleContinue = async () => {
    if (!ageConfirmed) return;
    try {
      const token = await getToken();
      if (token) {
        // Track and save
        api.trackEvent(token, 'onboarding_demographics_completed', { properties: { gender } }).catch(() => {});
        if (gender) {
          api.updateProfile(token, { gender } as any).catch(() => {});
        }
      }
    } catch (err) {}
    onContinue();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={defaultBirdImage} style={styles.birdImage} resizeMode="contain" />
        <Text style={styles.title}>Demographics</Text>
        <Text style={styles.subtitle}>Help us understand our community better</Text>

        {/* Age Confirmation */}
        <TouchableOpacity
          style={[styles.checkboxCard, ageConfirmed && styles.checkboxActive]}
          onPress={() => setAgeConfirmed(!ageConfirmed)}
        >
          <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
            {ageConfirmed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.checkboxInfo}>
            <Text style={styles.checkboxTitle}>I confirm I am 13 years or older</Text>
            <Text style={styles.checkboxDesc}>
              Required to use SongBird and comply with privacy regulations.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Gender Selection */}
        <Text style={styles.fieldLabel}>Gender (optional)</Text>
        <View style={styles.genderGrid}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.genderOption, gender === g.value && styles.genderActive]}
              onPress={() => setGender(g.value)}
            >
              <Text style={[styles.genderText, gender === g.value && styles.genderTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Continue */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !ageConfirmed && styles.disabledBtn]}
          onPress={handleContinue}
          disabled={!ageConfirmed}
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
  birdImage: { width: 100, height: 100, marginBottom: spacing.md },
  title: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  checkboxCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%', marginBottom: spacing.lg },
  checkboxActive: { borderWidth: 1, borderColor: colors.accent },
  checkbox: { width: 24, height: 24, borderRadius: borderRadius.md, borderWidth: 2, borderColor: colors.textMuted, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  checkboxInfo: { flex: 1 },
  checkboxTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: 4 },
  checkboxDesc: { fontSize: fontSize.sm, color: colors.textMuted },
  fieldLabel: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.sm, alignSelf: 'flex-start', width: '100%' },
  genderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, width: '100%' },
  genderOption: { width: '48%', backgroundColor: colors.surface, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center' },
  genderActive: { backgroundColor: colors.accent },
  genderText: { fontSize: fontSize.sm, color: colors.text, fontWeight: '500' },
  genderTextActive: { color: colors.bg },
  footer: { padding: spacing.lg },
  continueBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  continueBtnText: { color: colors.bg, fontSize: fontSize.lg, fontWeight: '600' },
  disabledBtn: { opacity: 0.3 },
});


