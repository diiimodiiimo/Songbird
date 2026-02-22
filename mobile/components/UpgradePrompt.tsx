// Upgrade prompt component (matches web UpgradePrompt.tsx)
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
}

const PERKS = [
  { icon: '📊', title: 'Advanced Insights', desc: 'Deep analytics about your music taste' },
  { icon: '🎨', title: 'Exclusive Themes', desc: 'Unlock all bird themes and customizations' },
  { icon: '🔄', title: 'SongBird Wrapped', desc: 'Your personalized year in music review' },
  { icon: '📤', title: 'Data Export', desc: 'Export your entries and data anytime' },
  { icon: '💬', title: 'Extended Notes', desc: 'Longer notes on your entries' },
  { icon: '🏆', title: 'Priority Support', desc: 'Direct access to the SongBird team' },
];

export default function UpgradePrompt({ visible, onClose, feature }: UpgradePromptProps) {
  const handleUpgrade = () => {
    // TODO: Integrate with RevenueCat or in-app purchase
    // For now, placeholder
    console.log('Upgrade flow would open here');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Header */}
          <Text style={styles.badge}>SongBird Plus</Text>
          <Text style={styles.title}>Unlock the Full Experience</Text>
          {feature && (
            <Text style={styles.featureNote}>
              {feature} is a Plus feature
            </Text>
          )}

          {/* Perks */}
          <View style={styles.perksList}>
            {PERKS.map((perk, i) => (
              <View key={i} style={styles.perkItem}>
                <Text style={styles.perkIcon}>{perk.icon}</Text>
                <View style={styles.perkInfo}>
                  <Text style={styles.perkTitle}>{perk.title}</Text>
                  <Text style={styles.perkDesc}>{perk.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
            <Text style={styles.upgradeBtnText}>Upgrade to Plus</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.maybeLater} onPress={onClose}>
            <Text style={styles.maybeLaterText}>Maybe later</Text>
          </TouchableOpacity>

          {/* Note about in-app purchases */}
          <Text style={styles.disclaimer}>
            * In-app purchase integration coming soon. Contact support for early access.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  container: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, padding: spacing.xl, paddingBottom: spacing.xxl },
  closeBtn: { position: 'absolute', top: spacing.md, right: spacing.md, zIndex: 10, padding: spacing.xs },
  badge: { alignSelf: 'center', backgroundColor: colors.accent + '1A', paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.full, marginBottom: spacing.md },
  title: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  featureNote: { fontSize: fontSize.sm, color: colors.accent, textAlign: 'center', marginBottom: spacing.lg },
  perksList: { marginBottom: spacing.lg },
  perkItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  perkIcon: { fontSize: 28 },
  perkInfo: { flex: 1 },
  perkTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  perkDesc: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  upgradeBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  upgradeBtnText: { color: colors.bg, fontSize: fontSize.lg, fontWeight: 'bold' },
  maybeLater: { alignItems: 'center', paddingVertical: spacing.sm },
  maybeLaterText: { color: colors.textMuted, fontSize: fontSize.sm },
  disclaimer: { fontSize: fontSize.xs, color: colors.textMuted + '80', textAlign: 'center', marginTop: spacing.md },
});


