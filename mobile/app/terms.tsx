import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: February 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.body}>
            By accessing or using SongBird ("the App"), you agree to be bound by these Terms of
            Service. If you do not agree to these terms, please do not use the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.body}>
            SongBird is a music journaling platform that allows users to log one song per day,
            track streaks, view analytics, and connect with friends. The App integrates with
            Spotify for song search functionality.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.body}>
            You must create an account to use SongBird. You are responsible for maintaining the
            security of your account. You must be at least 13 years old to use the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User Content</Text>
          <Text style={styles.body}>
            You retain ownership of any content you post (notes, entries). By posting content, you
            grant SongBird a non-exclusive license to display that content within the App. You
            agree not to post content that is offensive, illegal, or violates others' rights.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Subscriptions</Text>
          <Text style={styles.body}>
            SongBird offers free and premium subscription tiers. Premium subscriptions are billed
            through your app store account. You can cancel at any time through your account
            settings. Refunds are subject to app store policies.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Prohibited Conduct</Text>
          <Text style={styles.body}>
            You may not: harass other users, create fake accounts, attempt to access other users'
            data, reverse-engineer the App, or use the App for any illegal purpose.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Termination</Text>
          <Text style={styles.body}>
            We reserve the right to suspend or terminate accounts that violate these terms.
            You may delete your account at any time through the App settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
          <Text style={styles.body}>
            SongBird is provided "as is" without warranties. We are not liable for any damages
            arising from your use of the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contact</Text>
          <Text style={styles.body}>
            For questions about these terms, contact us at support@songbird.app.
          </Text>
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
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  lastUpdated: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 22,
  },
});
