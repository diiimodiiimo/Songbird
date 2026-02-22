// Mood picker component for entries
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';

interface MoodPickerProps {
  selected: string | null;
  onSelect: (mood: string) => void;
}

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😤', label: 'Angry' },
  { emoji: '🥰', label: 'In Love' },
  { emoji: '😌', label: 'Chill' },
  { emoji: '🤔', label: 'Thoughtful' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🥳', label: 'Excited' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '🤗', label: 'Grateful' },
  { emoji: '😎', label: 'Confident' },
  { emoji: '🫠', label: 'Melancholy' },
  { emoji: '💪', label: 'Motivated' },
  { emoji: '🌧️', label: 'Gloomy' },
  { emoji: '✨', label: 'Inspired' },
];

export default function MoodPicker({ selected, onSelect }: MoodPickerProps) {
  const handleSelect = (mood: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(mood === selected ? '' : mood);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>How are you feeling?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {MOODS.map((m) => (
          <TouchableOpacity
            key={m.label}
            style={[styles.chip, selected === m.label && styles.chipSelected]}
            onPress={() => handleSelect(m.label)}
          >
            <Text style={styles.emoji}>{m.emoji}</Text>
            <Text style={[styles.chipText, selected === m.label && styles.chipTextSelected]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.sm, fontWeight: '500' },
  scroll: { gap: spacing.sm, paddingRight: spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surface, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'transparent' },
  chipSelected: { backgroundColor: colors.accent + '1A', borderColor: colors.accent },
  emoji: { fontSize: 18 },
  chipText: { fontSize: fontSize.sm, color: colors.textMuted },
  chipTextSelected: { color: colors.accent, fontWeight: '500' },
});


