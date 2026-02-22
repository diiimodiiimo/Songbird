// Invite Friends CTA with native share (matches web InviteFriendsCTA.tsx)
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';
import { api } from '../lib/api';
import { useAuthToken } from '../lib/auth';

interface InviteFriendsCTAProps {
  compact?: boolean;
}

export default function InviteFriendsCTA({ compact = false }: InviteFriendsCTAProps) {
  const { getToken } = useAuthToken();
  const [inviteUrl, setInviteUrl] = useState('');
  const [personalCode, setPersonalCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchInviteInfo();
  }, []);

  const fetchInviteInfo = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getInviteInfo(token);
      setInviteUrl(data.inviteUrl || '');
      setPersonalCode(data.personalCode || '');
    } catch (err) {
      console.error('Error fetching invite info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on SongBird! Track your daily songs and share music memories with friends 🐦🎵\n\n${inviteUrl || `Use my code: ${personalCode}`}`,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleCopy = async () => {
    const text = inviteUrl || personalCode;
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  if (compact) {
    return (
      <View style={styles.containerCompact}>
        <TouchableOpacity style={styles.shareRowBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color={colors.accent} />
          <Text style={styles.shareRowText}>Invite Friends</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🐦</Text>
        <Text style={styles.title}>Invite Friends</Text>
        <Text style={styles.subtitle}>Share the nest! Invite friends to join SongBird</Text>
      </View>

      {/* Code display */}
      {personalCode && (
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Your Invite Code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{personalCode}</Text>
            <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={colors.accent} />
            </TouchableOpacity>
          </View>
          {copied && <Text style={styles.copiedText}>Copied!</Text>}
        </View>
      )}

      {/* Share button */}
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Ionicons name="share-social" size={20} color={colors.bg} />
        <Text style={styles.shareBtnText}>Share Invite Link</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, padding: spacing.lg, marginBottom: spacing.md },
  containerCompact: { marginBottom: spacing.sm },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  emoji: { fontSize: 40, marginBottom: spacing.sm },
  title: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  codeContainer: { backgroundColor: colors.bg, borderRadius: borderRadius.xl, padding: spacing.md, marginBottom: spacing.md },
  codeLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.xs },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.accent, letterSpacing: 2 },
  copyBtn: { padding: spacing.sm },
  copiedText: { fontSize: fontSize.xs, color: colors.success, marginTop: spacing.xs },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.accent, borderRadius: borderRadius.xl, paddingVertical: spacing.md },
  shareBtnText: { color: colors.bg, fontSize: fontSize.md, fontWeight: '600' },
  shareRowBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  shareRowText: { color: colors.accent, fontSize: fontSize.md, fontWeight: '500' },
});


