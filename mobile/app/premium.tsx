// Premium / Subscription management screen
// TODO: Integrate with RevenueCat for actual IAP
// Placeholder key needed: REVENUECAT_API_KEY
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';
import { api, SubscriptionInfo } from '../lib/api';
import { useAuth, useAuthToken } from '../lib/auth';

const PLANS = [
  {
    id: 'founding_flock',
    name: 'Founding Flock',
    price: '$2.99/mo',
    badge: '🐣',
    perks: [
      'Everything in Plus',
      'Founding member badge forever',
      'Early access to new features',
      'Direct line to the team',
    ],
    highlight: true,
  },
  {
    id: 'songbird_plus',
    name: 'SongBird Plus',
    price: '$4.99/mo',
    badge: '🐦',
    perks: [
      'Advanced Insights & Analytics',
      'SongBird Wrapped',
      'All bird themes & customizations',
      'Extended notes (1000+ chars)',
      'Data export',
      'Priority support',
    ],
    highlight: false,
  },
];

export default function PremiumScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();
  const router = useRouter();

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getSubscription(token);
      setSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handlePurchase = async (planId: string) => {
    // TODO: Replace with RevenueCat purchase flow
    // import Purchases from 'react-native-purchases';
    // const offerings = await Purchases.getOfferings();
    // const purchaserInfo = await Purchases.purchasePackage(package);
    console.log('Would purchase:', planId);
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

  const isPremium = subscription?.isPremium;
  const isFoundingMember = subscription?.isFoundingMember;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Premium</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Current Status */}
        {isPremium ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusEmoji}>
              {isFoundingMember ? '🐣' : '🐦'}
            </Text>
            <Text style={styles.statusTitle}>
              {isFoundingMember ? 'Founding Flock Member' : 'SongBird Plus'}
            </Text>
            <Text style={styles.statusText}>
              You're a premium member! Thank you for your support.
            </Text>
            <TouchableOpacity
              style={styles.manageBtn}
              onPress={() => {
                // Open Stripe customer portal or management
                Linking.openURL('https://songbird.vercel.app/settings/premium');
              }}
            >
              <Text style={styles.manageBtnText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.heroSection}>
              <Text style={styles.heroEmoji}>✨</Text>
              <Text style={styles.heroTitle}>Upgrade to Premium</Text>
              <Text style={styles.heroText}>
                Unlock the full SongBird experience
              </Text>
            </View>

            {/* Plans */}
            {PLANS.map((plan) => (
              <View
                key={plan.id}
                style={[styles.planCard, plan.highlight && styles.planCardHighlight]}
              >
                {plan.highlight && (
                  <View style={styles.highlightBadge}>
                    <Text style={styles.highlightBadgeText}>Best Value</Text>
                  </View>
                )}
                <Text style={styles.planBadge}>{plan.badge}</Text>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>

                <View style={styles.perksList}>
                  {plan.perks.map((perk, i) => (
                    <View key={i} style={styles.perkRow}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={styles.perkText}>{perk}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.purchaseBtn, plan.highlight && styles.purchaseBtnHighlight]}
                  onPress={() => handlePurchase(plan.id)}
                >
                  <Text style={[styles.purchaseBtnText, plan.highlight && styles.purchaseBtnTextHighlight]}>
                    Subscribe
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={styles.disclaimer}>
              * In-app purchases powered by RevenueCat (coming soon). Subscriptions auto-renew monthly. Cancel anytime.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  title: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text },
  statusCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, padding: spacing.xl, alignItems: 'center', borderWidth: 2, borderColor: colors.accent + '40' },
  statusEmoji: { fontSize: 60, marginBottom: spacing.md },
  statusTitle: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  statusText: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  manageBtn: { backgroundColor: colors.accent + '1A', paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: borderRadius.xl },
  manageBtnText: { color: colors.accent, fontSize: fontSize.md, fontWeight: '600' },
  heroSection: { alignItems: 'center', marginBottom: spacing.xl },
  heroEmoji: { fontSize: 60, marginBottom: spacing.md },
  heroTitle: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  heroText: { fontSize: fontSize.md, color: colors.textMuted },
  planCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, padding: spacing.xl, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  planCardHighlight: { borderColor: colors.accent, borderWidth: 2 },
  highlightBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: colors.accent, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.full },
  highlightBadgeText: { color: colors.bg, fontSize: fontSize.xs, fontWeight: 'bold' },
  planBadge: { fontSize: 40, textAlign: 'center', marginBottom: spacing.sm },
  planName: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  planPrice: { fontSize: fontSize.lg, color: colors.accent, fontWeight: '600', textAlign: 'center', marginBottom: spacing.md },
  perksList: { marginBottom: spacing.md },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  perkText: { fontSize: fontSize.sm, color: colors.text },
  purchaseBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center' },
  purchaseBtnHighlight: { backgroundColor: colors.accent, borderColor: colors.accent },
  purchaseBtnText: { color: colors.accent, fontSize: fontSize.md, fontWeight: '600' },
  purchaseBtnTextHighlight: { color: colors.bg },
  disclaimer: { fontSize: fontSize.xs, color: colors.textMuted + '80', textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
});


