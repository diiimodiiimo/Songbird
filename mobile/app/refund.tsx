import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';

export default function RefundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Refund Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: February 2026</Text>

        {/* Guarantee banner */}
        <View style={styles.guaranteeBanner}>
          <Ionicons name="shield-checkmark" size={32} color={colors.accent} />
          <Text style={styles.guaranteeTitle}>7-Day Money-Back Guarantee</Text>
          <Text style={styles.guaranteeText}>
            Not satisfied? Get a full refund within 7 days of purchase — no
            questions asked.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Covered</Text>
          <Text style={styles.body}>
            We offer a 7-day money-back guarantee for all new premium
            subscriptions. If you are not satisfied with SongBird Premium within
            7 days of your initial purchase, we will provide a full refund.
          </Text>
          <Text style={[styles.body, { marginTop: spacing.sm }]}>
            This guarantee applies to:
          </Text>
          <View style={styles.bulletList}>
            <BulletItem text="Founding Flock annual subscriptions ($24/year)" />
            <BulletItem text="Monthly subscriptions ($3/month)" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Request a Refund</Text>
          <Text style={styles.body}>
            To request a refund within the 7-day guarantee period:
          </Text>
          <View style={styles.numberedList}>
            <NumberedItem
              number={1}
              text="Contact us at support@songbird.app with your account email"
            />
            <NumberedItem
              number={2}
              text="Include your purchase date and subscription type"
            />
            <NumberedItem
              number={3}
              text="We will process your refund within 5-7 business days"
            />
          </View>
          <Text style={[styles.body, { marginTop: spacing.sm }]}>
            Refunds will be issued to the original payment method used for the
            purchase.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Refunds After 7 Days</Text>
          <Text style={styles.body}>
            After the 7-day guarantee period, refunds are handled on a
            case-by-case basis. We may consider refunds for:
          </Text>
          <View style={styles.bulletList}>
            <BulletItem text="Technical issues that prevent you from using the service" />
            <BulletItem text="Billing errors or unauthorized charges" />
            <BulletItem text="Extenuating circumstances (at our discretion)" />
          </View>
          <Text style={[styles.body, { marginTop: spacing.sm }]}>
            For monthly subscriptions, refunds after the guarantee period will be
            prorated based on unused time remaining in your billing cycle.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Processing Time</Text>
          <Text style={styles.body}>
            Refunds are typically processed within 5-7 business days after
            approval. The refund will appear in your account within 10-14
            business days, depending on your payment provider.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cancellation vs. Refund</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>Cancellation</Text>
            <Text style={styles.infoCardText}>
              Stops future charges but does not refund payments already made. You
              retain premium access until the end of your current billing period.
            </Text>
          </View>
          <View style={[styles.infoCard, { marginTop: spacing.sm }]}>
            <Text style={styles.infoCardLabel}>Refund</Text>
            <Text style={styles.infoCardText}>
              Returns your payment and removes premium access immediately. Only
              available within the guarantee period or under special
              circumstances.
            </Text>
          </View>
          <Text style={[styles.body, { marginTop: spacing.md }]}>
            Founding Flock members who cancel retain lifetime premium access even
            after cancellation.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Non-Refundable Items</Text>
          <Text style={styles.body}>
            The following are not eligible for refunds:
          </Text>
          <View style={styles.bulletList}>
            <BulletItem text="Subscriptions cancelled after the 7-day guarantee period (unless under special circumstances)" />
            <BulletItem text="Payments made more than 30 days ago" />
            <BulletItem text="Refunds requested due to violation of Terms of Service" />
          </View>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need a Refund?</Text>
          <Text style={styles.contactText}>
            Please include your account email and purchase details in your refund
            request.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:support@songbird.app')}
          >
            <Ionicons name="mail-outline" size={16} color={colors.bg} />
            <Text style={styles.contactButtonText}>
              support@songbird.app
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          This refund policy is part of our Terms of Service. By purchasing a
          subscription, you agree to these terms.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function BulletItem({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function NumberedItem({ number, text }: { number: number; text: string }) {
  return (
    <View style={styles.numberedRow}>
      <View style={styles.numberCircle}>
        <Text style={styles.numberText}>{number}</Text>
      </View>
      <Text style={styles.numberedText}>{text}</Text>
    </View>
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  lastUpdated: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  guaranteeBanner: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.accent + '40',
  },
  guaranteeTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  guaranteeText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.xl,
  },
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
  bulletList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  numberedList: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  numberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: colors.accent,
  },
  numberedText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoCardLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  infoCardText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
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
  },
  contactButtonText: {
    color: colors.bg,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textMuted + '80',
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
  },
});
