// Attribution / "How did you find us?" screen (matches web AttributionScreen)
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import ProgressDots from './ProgressDots';
import { api } from '../../lib/api';
import { useAuthToken } from '../../lib/auth';

interface AttributionScreenProps {
  onContinue: () => void;
  totalSteps: number;
  currentStep: number;
}

const SOURCES = [
  { value: 'friend', label: '👥 A friend told me', icon: '👥' },
  { value: 'social', label: '📱 Social media', icon: '📱' },
  { value: 'search', label: '🔍 Search engine', icon: '🔍' },
  { value: 'app-store', label: '📲 App store', icon: '📲' },
  { value: 'blog', label: '📝 Blog/article', icon: '📝' },
  { value: 'other', label: '🤔 Other', icon: '🤔' },
];

export default function AttributionScreen({ onContinue, totalSteps, currentStep }: AttributionScreenProps) {
  const { getToken } = useAuthToken();
  const [selected, setSelected] = useState('');
  const [otherText, setOtherText] = useState('');

  const handleContinue = async () => {
    try {
      const token = await getToken();
      if (token && selected) {
        api.trackEvent(token, 'onboarding_attribution', {
          properties: { source: selected, otherText: selected === 'other' ? otherText : undefined },
        }).catch(() => {});
      }
    } catch (err) {}
    onContinue();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>🗺️</Text>
        <Text style={styles.title}>How did you find us?</Text>
        <Text style={styles.subtitle}>
          Help us understand how people discover SongBird.
        </Text>

        <View style={styles.optionsGrid}>
          {SOURCES.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[styles.optionCard, selected === s.value && styles.optionActive]}
              onPress={() => setSelected(s.value)}
            >
              <Text style={styles.optionIcon}>{s.icon}</Text>
              <Text style={[styles.optionLabel, selected === s.value && styles.optionLabelActive]}>
                {s.label.replace(/^.{2} /, '')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selected === 'other' && (
          <TextInput
            style={styles.otherInput}
            placeholder="Tell us more..."
            placeholderTextColor={colors.textMuted}
            value={otherText}
            onChangeText={setOtherText}
            multiline
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>{selected ? 'Continue' : 'Skip'}</Text>
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
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, width: '100%', justifyContent: 'center' },
  optionCard: { width: '47%', backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, alignItems: 'center', gap: spacing.xs },
  optionActive: { backgroundColor: colors.accent, borderWidth: 0 },
  optionIcon: { fontSize: 28 },
  optionLabel: { fontSize: fontSize.sm, color: colors.text, textAlign: 'center', fontWeight: '500' },
  optionLabelActive: { color: colors.bg },
  otherInput: { width: '100%', backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, marginTop: spacing.md, color: colors.text, fontSize: fontSize.md, minHeight: 80, textAlignVertical: 'top' },
  footer: { padding: spacing.lg },
  continueBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  continueBtnText: { color: colors.bg, fontSize: fontSize.lg, fontWeight: '600' },
});


