import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'What is SongBird?',
    answer:
      'SongBird is a music journaling app. You log one song each day that represents your day — the song stuck in your head, the one you played on repeat, or the one that defined a moment. Over time, you build a musical autobiography of your life.',
  },
  {
    category: 'Getting Started',
    question: 'Do I need a Spotify account?',
    answer:
      "No! SongBird uses Spotify's public music database to search for songs, but you don't need a Spotify account. We never access your personal Spotify data, playlists, or listening history.",
  },
  {
    category: 'Getting Started',
    question: 'Can I log songs from past days?',
    answer:
      'Yes, you can pick any date when logging a song. Use the date picker in the entry form to log songs for past dates. However, only same-day entries count toward your streak.',
  },
  {
    category: 'Music & Entries',
    question: 'What is "On This Day"?',
    answer:
      "On This Day shows what songs you logged on this date in previous years. It's like a musical time capsule — you'll see patterns in your taste evolve over time. The more you log, the more powerful this feature becomes.",
  },
  {
    category: 'Music & Entries',
    question: 'What are B-sides?',
    answer:
      "B-sides let you log additional songs beyond your main Song of the Day. Sometimes one song isn't enough — maybe two songs defined your day. B-sides are a premium feature that lets you capture the full soundtrack of your day.",
  },
  {
    category: 'Music & Entries',
    question: 'What is the mood picker for?',
    answer:
      'The mood picker lets you tag how your day felt with an emoji (😊 😌 😢 🔥 😴 🎉). Over time, this data powers insights about the emotional patterns in your music — like which artists you turn to when you\'re feeling a certain way.',
  },
  {
    category: 'Music & Entries',
    question: 'What is the Global Song of the Day?',
    answer:
      'The Global Song of the Day is the most-logged song across all SongBird users yesterday. When multiple users log the same song, it rises on the global chart. Check the Leaderboard tab to see it — and whether your song made the cut.',
  },
  {
    category: 'Social Features',
    question: 'What\'s the difference between "People in Your Day" and "Mention Friends"?',
    answer:
      '"People in Your Day" is a private tag — record who you were with, even people not on SongBird. Only you can see these. "Mention Friends" is social — the friend gets a notification and can see they were mentioned in your entry. Use People for your personal memory, Mentions when you want friends to know.',
  },
  {
    category: 'Social Features',
    question: 'What is the Aviary?',
    answer:
      "The Aviary is where you see your friends' birds and their latest songs. Think of it like a visual overview of your flock — each friend appears as their chosen bird, and you can tap to see what they logged today. Unread songs show a notification dot.",
  },
  {
    category: 'Social Features',
    question: 'Can I keep my journal private?',
    answer:
      "Absolutely. SongBird is private by default. Only friends you've accepted can see your entries in the Feed. You can use SongBird entirely as a personal journal — social features are optional.",
  },
  {
    category: 'Social Features',
    question: 'What are vibes?',
    answer:
      "Vibes are like \"likes\" in SongBird. When you see a friend's song in the Feed that resonates with you, tap the heart icon to vibe it. The friend gets a notification. Your vibed songs are saved in your Profile.",
  },
  {
    category: 'Streaks',
    question: 'How do streaks work?',
    answer:
      "Your streak counts consecutive days you've logged a song. Log a song today, then again tomorrow, and your streak grows. If you miss a day (no entry logged by midnight in your timezone), your streak resets to zero. Only entries logged on the same day count — backdating an entry won't save your streak.",
  },
  {
    category: 'Streaks',
    question: 'What do I unlock with streaks?',
    answer:
      "Streaks unlock milestone achievements and new bird themes. Hit 7 days to earn your first milestone, then 14, 30, 50, 100, and 365 days for increasingly rare birds. Check your Profile → Your Flock to see which birds you've unlocked and what's next.",
  },
  {
    category: 'Streaks',
    question: 'When does my streak reset?',
    answer:
      'Your streak resets at midnight in your local timezone. If you see a warning that your streak is about to end, log a song before midnight to keep it alive. The countdown timer on the Today tab shows how many hours remain.',
  },
  {
    category: 'Premium',
    question: 'What is the Founding Flock?',
    answer:
      "The Founding Flock is a limited lifetime membership for early SongBird users. For a one-time payment of $39.99, you get all premium features forever — no subscription needed. Only 500 spots are available, and the price increases to $29.99/year after they're filled.",
  },
  {
    category: 'Premium',
    question: 'What do premium members get?',
    answer:
      'Premium includes: all bird themes unlocked, unlimited friends, full analytics & insights, SongBird Wrapped, B-sides (extra daily songs), data export, and all future premium features. Free users get 30 entries per month and basic features.',
  },
  {
    category: 'Premium',
    question: 'What are AI Insights?',
    answer:
      "AI Insights analyze your music logging patterns and surface interesting observations — like noticing you listen to more upbeat music in summer, or that a certain artist always appears when you're with specific people. They appear in the Insights tab after you have 10+ entries.",
  },
  {
    category: 'Premium',
    question: 'What is Wrapped?',
    answer:
      'SongBird Wrapped is your year-end music summary, similar to Spotify Wrapped but based on the songs you consciously chose each day. It includes top artists, seasonal trends, sentiment analysis of your notes, and more. Available to premium members.',
  },
  {
    category: 'Privacy & Security',
    question: 'Who can see my entries?',
    answer:
      "Only you can see your entries by default. If you add friends and share through the Feed, only your accepted friends can see them. SongBird never makes your entries public.",
  },
  {
    category: 'Privacy & Security',
    question: 'Does SongBird access my Spotify account?',
    answer:
      "No. We only use Spotify's public search API to help you find songs. We never log in to your Spotify account, access your playlists, or track your listening history.",
  },
  {
    category: 'Technical',
    question: 'Can I change my username?',
    answer:
      "Currently, usernames are set during onboarding and can't be changed from the app. If you need to change yours, reach out to support.",
  },
  {
    category: 'Technical',
    question: 'Can I export my data?',
    answer:
      "Data export is available for premium members. We're working on making this available in a future update.",
  },
];

const categories = Array.from(new Set(faqs.map((f) => f.category)));

export default function HelpScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory =
        activeCategory === 'all' || faq.category === activeCategory;
      const matchesSearch =
        !search.trim() ||
        faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  const toggleExpanded = (globalIndex: number) => {
    setExpandedIndex(expandedIndex === globalIndex ? null : globalIndex);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & FAQ</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={18}
          color={colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search for answers..."
          placeholderTextColor={colors.textMuted + '80'}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              activeCategory === 'all' && styles.categoryChipActive,
            ]}
            onPress={() => setActiveCategory('all')}
          >
            <Text
              style={[
                styles.categoryChipText,
                activeCategory === 'all' && styles.categoryChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                activeCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  activeCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.map((faq) => {
          const globalIndex = faqs.indexOf(faq);
          const isExpanded = expandedIndex === globalIndex;
          return (
            <TouchableOpacity
              key={globalIndex}
              style={styles.faqCard}
              onPress={() => toggleExpanded(globalIndex)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </View>
              {isExpanded && (
                <View style={styles.faqAnswerWrapper}>
                  <View style={styles.faqDivider} />
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>
              No results found for "{search}"
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSearch('');
                setActiveCategory('all');
              }}
            >
              <Text style={styles.clearFilters}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still have questions?</Text>
          <Text style={styles.contactText}>
            Can't find what you're looking for? Reach out and we'll help.
          </Text>
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="mail-outline" size={16} color={colors.bg} />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
          <Text style={styles.contactEmail}>support@songbird.app</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    paddingVertical: spacing.md,
  },
  categoriesWrapper: {
    marginBottom: spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  categoryChipActive: {
    backgroundColor: colors.accent,
  },
  categoryChipText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: colors.bg,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  faqCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginRight: spacing.sm,
  },
  faqAnswerWrapper: {
    marginTop: spacing.sm,
  },
  faqDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  faqAnswer: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  clearFilters: {
    fontSize: fontSize.sm,
    color: colors.accent,
    marginTop: spacing.md,
    fontWeight: '500',
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginTop: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  contactText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
  },
  contactButtonText: {
    color: colors.bg,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  contactEmail: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
