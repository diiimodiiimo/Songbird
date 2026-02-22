import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert, Image } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, fontSize, spacing, borderRadius, defaultBirdImage } from '../../lib/theme';
import { api } from '../../lib/api';
import { useAuthToken } from '../../lib/auth';
import ProgressDots from './ProgressDots';

interface SocialScreenProps {
  onContinue: () => void;
  inviteCode?: string;
}

export default function SocialScreen({ onContinue, inviteCode }: SocialScreenProps) {
  const { getToken } = useAuthToken();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const token = await getToken();

    // Track analytics
    if (token) {
      api.trackEvent(token, 'onboarding_invite_tapped').catch(() => {});
    }

    // Generate invite URL (use app URL since we can't get window.location in RN)
    const appUrl = 'https://songbird.vercel.app';
    let shareUrl = appUrl;

    try {
      // Try to generate invite code
      // This would need an API endpoint update to return the code
      shareUrl = appUrl;
    } catch (err) {
      console.error('Error generating invite:', err);
    }

    // Try native share
    try {
      await Share.share({
        message: `I'm logging my daily songs on SongBird. Join me and let's share our music! ${shareUrl}`,
        title: 'Join me on SongBird',
      });
      onContinue();
    } catch (err: any) {
      // User cancelled or share failed, fall back to copy
      if (err.message !== 'User did not share') {
        try {
          await Clipboard.setStringAsync(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (copyErr) {
          console.error('Failed to copy:', copyErr);
        }
      }
    }
  };

  const handleSolo = async () => {
    const token = await getToken();
    if (token) {
      api.trackEvent(token, 'onboarding_invite_skipped').catch(() => {});
    }
    onContinue();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Bird */}
        <View style={styles.birdContainer}>
          <Image source={defaultBirdImage} style={styles.birdImage} resizeMode="contain" />
        </View>

        {/* Headline */}
        <Text style={styles.title}>Share with friends — or keep it private</Text>
        <Text style={styles.subtitle}>
          SongBird can be your personal journal, or you can share moments with close friends. Your
          call.
        </Text>

        {/* Social features explanation */}
        <View style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>👥</Text>
            <Text style={styles.featureText}>Add friends and see what they're logging each day</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💜</Text>
            <Text style={styles.featureText}>Vibe and comment on songs that resonate with you</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureText}>
              Everything stays private between you and your friends
            </Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.8}>
          {copied ? (
            <>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={styles.shareButtonText}>Link copied!</Text>
            </>
          ) : (
            <>
              <Text style={styles.shareIcon}>↗</Text>
              <Text style={styles.shareButtonText}>Invite a friend</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSolo}>
          <Text style={styles.skipText}>I'll journal solo for now</Text>
        </TouchableOpacity>
      </View>

      {/* Progress dots */}
      <ProgressDots totalSteps={6} currentStep={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  birdContainer: {
    marginBottom: spacing.lg,
  },
  birdImage: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  featuresCard: {
    width: '100%',
    backgroundColor: colors.surface + '80',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  featureIcon: {
    fontSize: 18,
  },
  featureText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  shareIcon: {
    fontSize: 20,
    color: colors.bg,
    fontWeight: 'bold',
  },
  checkIcon: {
    fontSize: 20,
    color: colors.bg,
    fontWeight: 'bold',
  },
  shareButtonText: {
    color: colors.bg,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  skipText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
