// Milestone celebration modal (matches web MilestoneModal.tsx)
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Share,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';
import { Milestone } from '../lib/api';

interface MilestoneModalProps {
  visible: boolean;
  milestone: Milestone | null;
  onClose: () => void;
}

const CONFETTI_EMOJIS = ['🎉', '🎊', '✨', '🌟', '🎵', '🔥'];

export default function MilestoneModal({ visible, milestone, onClose }: MilestoneModalProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const handleShare = async () => {
    if (!milestone) return;
    try {
      await Share.share({
        message: `🎉 ${milestone.headline}\n${milestone.body}\n\n🐦 SongBird`,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (!milestone) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          {/* Confetti */}
          {showConfetti && (
            <View style={styles.confettiContainer}>
              {Array.from({ length: 12 }).map((_, i) => (
                <Text
                  key={i}
                  style={[
                    styles.confetti,
                    {
                      left: `${Math.random() * 100}%` as any,
                      top: `${Math.random() * 100}%` as any,
                    },
                  ]}
                >
                  {CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)]}
                </Text>
              ))}
            </View>
          )}

          {/* Icon */}
          <Text style={styles.icon}>{milestone.icon}</Text>

          {/* Headline */}
          <Text style={styles.headline}>{milestone.headline}</Text>

          {/* Body */}
          <Text style={styles.body}>{milestone.body}</Text>

          {/* Reward Card */}
          {milestone.reward && (
            <View style={styles.rewardCard}>
              <Text style={styles.rewardIcon}>{milestone.reward.icon}</Text>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>Reward Unlocked!</Text>
                <Text style={styles.rewardText}>{milestone.reward.text}</Text>
              </View>
            </View>
          )}

          {/* Buttons */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share Achievement</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.continueBtn} onPress={onClose}>
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg },
  container: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, padding: spacing.xl, borderWidth: 2, borderColor: colors.accent + '66', overflow: 'hidden' },
  confettiContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  confetti: { position: 'absolute', fontSize: 24 },
  icon: { fontSize: 60, textAlign: 'center', marginBottom: spacing.md },
  headline: { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: spacing.md },
  body: { fontSize: fontSize.lg, color: colors.textMuted, textAlign: 'center', lineHeight: 26, marginBottom: spacing.xl },
  rewardCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent + '15', borderWidth: 1, borderColor: colors.accent + '40', borderRadius: borderRadius.xl, padding: spacing.md, marginBottom: spacing.lg, gap: spacing.md },
  rewardIcon: { fontSize: 36 },
  rewardInfo: { flex: 1 },
  rewardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  rewardText: { fontSize: fontSize.sm, color: colors.textMuted },
  shareBtn: { backgroundColor: colors.accent + '1A', borderWidth: 1, borderColor: colors.accent + '40', borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  shareBtnText: { color: colors.accent, fontSize: fontSize.md, fontWeight: '600' },
  continueBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center' },
  continueBtnText: { color: colors.bg, fontSize: fontSize.md, fontWeight: '600' },
});


