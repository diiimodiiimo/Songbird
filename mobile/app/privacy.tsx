import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: February 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.body}>
            We collect information you provide when creating an account (email, name, username),
            your daily song entries and notes, and usage analytics to improve the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.body}>
            Your information is used to: provide the SongBird service, display your entries and
            profile to friends, generate analytics and insights, send notifications you've opted
            into, and improve the App experience.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Spotify Integration</Text>
          <Text style={styles.body}>
            SongBird uses the Spotify Web API to search for songs. We do not access your Spotify
            listening history, playlists, or account data. Song search queries are processed
            through our servers to Spotify's API.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Sharing</Text>
          <Text style={styles.body}>
            We do not sell your personal data. Your song entries are visible only to your approved
            friends. Aggregate, anonymized data may be used for features like the Global Song of
            the Day and leaderboards.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Storage</Text>
          <Text style={styles.body}>
            Your data is stored securely using Supabase (PostgreSQL). Authentication is handled by
            Clerk. All data is transmitted over HTTPS.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Retention</Text>
          <Text style={styles.body}>
            Your data is retained as long as your account is active. When you delete your account,
            all associated data is permanently removed within 30 days.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Push Notifications</Text>
          <Text style={styles.body}>
            Push notifications are optional. You can enable or disable specific notification types
            in your notification settings. We use Expo Push Notifications for delivery.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Your Rights</Text>
          <Text style={styles.body}>
            You have the right to: access your data, export your data, correct inaccurate data,
            delete your account and all associated data, and opt out of non-essential communications.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
          <Text style={styles.body}>
            SongBird is not intended for children under 13. We do not knowingly collect data from
            children under 13.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact</Text>
          <Text style={styles.body}>
            For privacy-related questions, contact us at privacy@songbird.app.
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
