// Notification setup screen for onboarding (matches web NotificationSetupScreen)
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import ProgressDots from './ProgressDots';
import { api } from '../../lib/api';
import { useAuthToken } from '../../lib/auth';
import * as Notifications from 'expo-notifications';

interface NotificationSetupScreenProps {
  onContinue: () => void;
  totalSteps: number;
  currentStep: number;
}

export default function NotificationSetupScreen({
  onContinue,
  totalSteps,
  currentStep,
}: NotificationSetupScreenProps) {
  const { getToken } = useAuthToken();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleEnablePush = async () => {
    try {
      setLoading(true);
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        setPushEnabled(true);
        // Get push token and send to server
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = await getToken();
        if (token) {
          api.updateNotificationPreferences(token, {
            pushEnabled: true,
            dailyReminder: dailyReminder,
            pushToken: tokenData.data,
          } as any).catch(() => {});
        }
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive reminders.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onContinue();
  };

  const handleContinue = async () => {
    if (pushEnabled) {
      try {
        const token = await getToken();
        if (token) {
          api.trackEvent(token, 'onboarding_notifications_enabled').catch(() => {});
        }
      } catch (err) {}
    }
    onContinue();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔔</Text>
        <Text style={styles.title}>Stay in the Loop</Text>
        <Text style={styles.subtitle}>
          Get reminded to log your daily song and never miss an "On This Day" memory.
        </Text>

        {/* Push Notifications */}
        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionIcon}>📱</Text>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Push Notifications</Text>
              <Text style={styles.optionDesc}>
                Receive alerts for friend activity, vibes, and more.
              </Text>
            </View>
            {pushEnabled ? (
              <View style={styles.enabledBadge}>
                <Text style={styles.enabledText}>✓ On</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.enableBtn} onPress={handleEnablePush} disabled={loading}>
                <Text style={styles.enableBtnText}>{loading ? '...' : 'Enable'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Daily Reminder */}
        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionIcon}>⏰</Text>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Daily Reminder</Text>
              <Text style={styles.optionDesc}>
                A gentle nudge to log your song of the day.
              </Text>
            </View>
            <Switch
              value={dailyReminder}
              onValueChange={setDailyReminder}
              trackColor={{ false: colors.surface, true: colors.accent }}
              thumbColor={Platform.OS === 'ios' ? undefined : colors.text}
            />
          </View>
        </View>

        {/* Memory alerts */}
        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionIcon}>💫</Text>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Memory Alerts</Text>
              <Text style={styles.optionDesc}>
                Get notified when you have "On This Day" memories.
              </Text>
            </View>
            <View style={styles.enabledBadge}>
              <Text style={styles.enabledText}>✓ On</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
        {!pushEnabled && (
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
        <ProgressDots totalSteps={totalSteps} currentStep={currentStep} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  emoji: { fontSize: 60, textAlign: 'center', marginBottom: spacing.md },
  title: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.md },
  optionCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md },
  optionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  optionIcon: { fontSize: 28 },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: 2 },
  optionDesc: { fontSize: fontSize.sm, color: colors.textMuted },
  enableBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  enableBtnText: { color: colors.bg, fontSize: fontSize.sm, fontWeight: '600' },
  enabledBadge: { backgroundColor: colors.accent + '20', borderRadius: borderRadius.lg, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  enabledText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '600' },
  footer: { padding: spacing.lg },
  continueBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  continueBtnText: { color: colors.bg, fontSize: fontSize.lg, fontWeight: '600' },
  skipBtn: { alignItems: 'center', paddingVertical: spacing.sm, marginBottom: spacing.md },
  skipText: { color: colors.textMuted, fontSize: fontSize.md },
});


