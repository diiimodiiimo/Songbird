// Notification Settings screen (matches web NotificationSettings.tsx)
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';
import { api, NotificationPreferences } from '../lib/api';
import { useAuth, useAuthToken } from '../lib/auth';

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`,
}));

export default function NotificationSettingsScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();
  const router = useRouter();

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPrefs = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getNotificationPreferences(token);
      setPreferences(data.preferences);
    } catch (err) {
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean | number) => {
    if (!preferences) return;
    const prev = { ...preferences };
    setPreferences({ ...preferences, [key]: value });
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      await api.updateNotificationPreferences(token, { [key]: value });
    } catch (err) {
      setPreferences(prev);
      console.error('Error updating:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to load preferences</Text>
        </View>
      </SafeAreaView>
    );
  }

  const notifTypes: { key: keyof NotificationPreferences; label: string; desc: string; icon: string }[] = [
    { key: 'notifyOnVibe', label: 'Vibes', desc: 'When someone vibes your entry', icon: '💗' },
    { key: 'notifyOnComment', label: 'Comments', desc: 'When someone comments on your entry', icon: '💬' },
    { key: 'notifyOnMention', label: 'Mentions', desc: "When you're mentioned in an entry", icon: '📣' },
    { key: 'notifyOnFriendRequest', label: 'Friend Requests', desc: 'When you receive a friend request', icon: '👋' },
    { key: 'notifyOnFriendAccepted', label: 'Friend Accepted', desc: 'When someone accepts your request', icon: '🤝' },
    { key: 'notifyOnThisDay', label: 'On This Day', desc: 'Reminders about past entries', icon: '📖' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Notification Settings</Text>
          {saving && <ActivityIndicator size="small" color={colors.accent} />}
        </View>

        <Text style={styles.subtitle}>Control how and when you receive notifications</Text>

        {/* Master Toggle */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Enable All Notifications</Text>
              <Text style={styles.cardDesc}>Master switch for all notification types</Text>
            </View>
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={(v) => updatePreference('notificationsEnabled', v)}
              trackColor={{ false: colors.textMuted + '40', true: colors.accent + '80' }}
              thumbColor={preferences.notificationsEnabled ? colors.accent : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Push Notifications */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Push Notifications</Text>
              <Text style={styles.cardDesc}>Receive notifications even when the app is closed</Text>
            </View>
            <Switch
              value={preferences.pushNotificationsEnabled && preferences.notificationsEnabled}
              onValueChange={(v) => updatePreference('pushNotificationsEnabled', v)}
              disabled={!preferences.notificationsEnabled}
              trackColor={{ false: colors.textMuted + '40', true: colors.accent + '80' }}
              thumbColor={preferences.pushNotificationsEnabled ? colors.accent : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Daily Reminder */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Daily Reminder</Text>
              <Text style={styles.cardDesc}>Get reminded to log your Song of the Day</Text>
            </View>
            <Switch
              value={preferences.reminderEnabled && preferences.notificationsEnabled}
              onValueChange={(v) => updatePreference('reminderEnabled', v)}
              disabled={!preferences.notificationsEnabled}
              trackColor={{ false: colors.textMuted + '40', true: colors.accent + '80' }}
              thumbColor={preferences.reminderEnabled ? colors.accent : '#f4f3f4'}
            />
          </View>

          {preferences.reminderEnabled && preferences.notificationsEnabled && (
            <View style={styles.timeSelector}>
              <Text style={styles.timeSelectorLabel}>Reminder Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {HOURS.map((h) => (
                  <TouchableOpacity
                    key={h.value}
                    style={[styles.timeChip, preferences.reminderTime === h.value && styles.timeChipActive]}
                    onPress={() => updatePreference('reminderTime', h.value)}
                  >
                    <Text style={[styles.timeChipText, preferences.reminderTime === h.value && styles.timeChipTextActive]}>
                      {h.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Individual Types */}
        <Text style={styles.sectionLabel}>Notification Types</Text>

        {notifTypes.map(({ key, label, desc, icon }) => (
          <View key={key} style={styles.typeCard}>
            <Text style={styles.typeIcon}>{icon}</Text>
            <View style={styles.typeInfo}>
              <Text style={styles.typeTitle}>{label}</Text>
              <Text style={styles.typeDesc}>{desc}</Text>
            </View>
            <Switch
              value={Boolean(preferences[key]) && preferences.notificationsEnabled}
              onValueChange={(v) => updatePreference(key, v)}
              disabled={!preferences.notificationsEnabled}
              trackColor={{ false: colors.textMuted + '40', true: colors.accent + '80' }}
              thumbColor={Boolean(preferences[key]) ? colors.accent : '#f4f3f4'}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.textMuted, fontSize: fontSize.md },
  content: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  title: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text, flex: 1 },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardInfo: { flex: 1, marginRight: spacing.md },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  cardDesc: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  timeSelector: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  timeSelectorLabel: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.sm },
  timeScroll: { flexDirection: 'row' },
  timeChip: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.full, backgroundColor: colors.bg, marginRight: spacing.xs },
  timeChipActive: { backgroundColor: colors.accent },
  timeChipText: { fontSize: fontSize.xs, color: colors.textMuted },
  timeChipTextActive: { color: colors.bg, fontWeight: '600' },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.md, marginTop: spacing.sm },
  typeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  typeIcon: { fontSize: 24 },
  typeInfo: { flex: 1 },
  typeTitle: { fontSize: fontSize.md, fontWeight: '500', color: colors.text },
  typeDesc: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
});


