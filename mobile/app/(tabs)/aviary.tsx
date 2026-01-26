// Aviary Tab - Bird collection/customization (matches web AviaryTab.tsx)
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import { useAuth, useAuthToken } from '../../lib/auth';

interface Bird {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  requirement?: string;
}

// Mock bird data - matching web implementation
const mockBirds: Bird[] = [
  {
    id: 'robin',
    name: 'Robin',
    emoji: '🐦',
    description: 'Your trusty companion from day one.',
    unlocked: true,
    unlockedAt: 'Day 1',
  },
  {
    id: 'bluejay',
    name: 'Blue Jay',
    emoji: '🐦‍⬛',
    description: 'Unlocked after logging 7 consecutive days.',
    unlocked: false,
    requirement: '7-day streak',
  },
  {
    id: 'cardinal',
    name: 'Cardinal',
    emoji: '🐧',
    description: 'Unlocked after logging 30 entries.',
    unlocked: false,
    requirement: '30 entries',
  },
  {
    id: 'goldfinch',
    name: 'Goldfinch',
    emoji: '🦆',
    description: 'Unlocked after a 30-day streak.',
    unlocked: false,
    requirement: '30-day streak',
  },
  {
    id: 'owl',
    name: 'Night Owl',
    emoji: '🦉',
    description: 'Unlocked by logging entries after midnight.',
    unlocked: false,
    requirement: '10 late-night entries',
  },
  {
    id: 'parrot',
    name: 'Parrot',
    emoji: '🦜',
    description: 'Unlocked by logging the same artist 10 times.',
    unlocked: false,
    requirement: 'Artist superfan',
  },
];

export default function AviaryTab() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();

  const [birds, setBirds] = useState<Bird[]>(mockBirds);
  const [selectedBird, setSelectedBird] = useState<string>('robin');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // In a real implementation, fetch actual bird status from API
    // For now, use mock data
    setLoading(false);
  }, [isLoaded, isSignedIn]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh bird data
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  const unlockedCount = birds.filter(b => b.unlocked).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your aviary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Aviary</Text>
          <Text style={styles.subtitle}>
            {unlockedCount} of {birds.length} birds unlocked
          </Text>
        </View>

        {/* Current bird */}
        <View style={styles.currentBirdCard}>
          <Text style={styles.currentBirdEmoji}>
            {birds.find(b => b.id === selectedBird)?.emoji || '🐦'}
          </Text>
          <Text style={styles.currentBirdName}>
            {birds.find(b => b.id === selectedBird)?.name || 'Robin'}
          </Text>
          <Text style={styles.currentBirdLabel}>Active Bird</Text>
        </View>

        {/* Bird collection */}
        <View style={styles.collection}>
          <Text style={styles.sectionTitle}>Collection</Text>
          <View style={styles.birdsGrid}>
            {birds.map((bird) => (
              <TouchableOpacity
                key={bird.id}
                style={[
                  styles.birdCard,
                  selectedBird === bird.id && styles.selectedBirdCard,
                  !bird.unlocked && styles.lockedBirdCard,
                ]}
                onPress={() => bird.unlocked && setSelectedBird(bird.id)}
                disabled={!bird.unlocked}
              >
                <Text style={[styles.birdEmoji, !bird.unlocked && styles.lockedEmoji]}>
                  {bird.unlocked ? bird.emoji : '🔒'}
                </Text>
                <Text style={[styles.birdName, !bird.unlocked && styles.lockedText]}>
                  {bird.name}
                </Text>
                {bird.unlocked ? (
                  <Text style={styles.unlockedText}>{bird.unlockedAt}</Text>
                ) : (
                  <Text style={styles.requirementText}>{bird.requirement}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How to unlock birds</Text>
          <Text style={styles.infoText}>
            Keep logging your daily songs! Birds unlock as you reach milestones like streaks, entry
            counts, and special achievements.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  currentBirdCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.accent + '4D',
  },
  currentBirdEmoji: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  currentBirdName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  currentBirdLabel: {
    fontSize: fontSize.sm,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  collection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  birdsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  birdCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
  },
  selectedBirdCard: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  lockedBirdCard: {
    opacity: 0.6,
  },
  birdEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  lockedEmoji: {
    fontSize: 30,
  },
  birdName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  lockedText: {
    color: colors.textMuted,
  },
  unlockedText: {
    fontSize: fontSize.xs,
    color: colors.success,
    marginTop: spacing.xs,
  },
  requirementText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
