// User Profile Page - View other users' profiles (matches web app/user/[username]/page.tsx)
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import { api, PublicProfile, FriendshipStatus } from '../../lib/api';
import { useAuth, useAuthToken } from '../../lib/auth';

export default function UserProfilePage() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [friendship, setFriendship] = useState<FriendshipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !username) return;
    try {
      const token = await getToken();
      if (!token) return;

      const [profileData, friendshipData] = await Promise.all([
        api.getUserProfile(token, username),
        api.getFriendshipStatus(token, username).catch(() => null),
      ]);

      setProfile(profileData);
      setFriendship(friendshipData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, username, getToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const sendFriendRequest = async () => {
    setActionLoading(true);
    try {
      const token = await getToken();
      if (!token || !username) return;
      await api.sendFriendRequest(token, username);
      setMessage({ type: 'success', text: 'Friend request sent!' });
      await fetchProfile();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to send request' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block @${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token || !profile) return;
              await api.blockUser(token, profile.username);
              setMessage({ type: 'success', text: 'User blocked' });
              router.back();
            } catch (err: any) {
              setMessage({ type: 'error', text: err.message || 'Failed to block user' });
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    router.push(`/report?type=user&username=${username}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Back button */}
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {profile.image ? (
            <Image source={{ uri: profile.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(profile.name?.[0] || profile.username?.[0] || '?').toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{profile.name || profile.username}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats?.totalEntries || 0}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats?.friendsCount || 0}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>

        {/* Friendship actions */}
        {friendship && !friendship.isOwnProfile && (
          <View style={styles.actionRow}>
            {friendship.isFriend ? (
              <View style={styles.friendBadge}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.friendBadgeText}>Friends</Text>
              </View>
            ) : friendship.hasPendingRequest ? (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>
                  {friendship.requestDirection === 'sent' ? 'Request Sent' : 'Request Received'}
                </Text>
                {friendship.requestDirection === 'received' && friendship.requestId && (
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={async () => {
                        const token = await getToken();
                        if (token && friendship.requestId) {
                          await api.respondToFriendRequest(token, friendship.requestId, 'accept');
                          fetchProfile();
                        }
                      }}
                    >
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addFriendBtn, actionLoading && styles.disabledButton]}
                onPress={sendFriendRequest}
                disabled={actionLoading}
              >
                <Ionicons name="person-add" size={18} color={colors.bg} />
                <Text style={styles.addFriendText}>Add Friend</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Message */}
        {message && (
          <View style={[styles.messageContainer, message.type === 'error' && styles.errorMessage]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        {/* Favorite Artists */}
        {profile.favoriteArtists && profile.favoriteArtists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorite Artists</Text>
            <View style={styles.tagsRow}>
              {profile.favoriteArtists.map((artist, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{artist}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        {friendship && !friendship.isOwnProfile && (
          <View style={styles.moreActions}>
            <TouchableOpacity style={styles.dangerAction} onPress={handleReport}>
              <Ionicons name="flag-outline" size={18} color={colors.error} />
              <Text style={styles.dangerActionText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerAction} onPress={handleBlock}>
              <Ionicons name="ban-outline" size={18} color={colors.error} />
              <Text style={styles.dangerActionText}>Block</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.md },
  emptyEmoji: { fontSize: 60, marginBottom: spacing.md },
  errorText: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  backBtn: { marginTop: spacing.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.accent, borderRadius: borderRadius.lg },
  backBtnText: { color: colors.bg, fontSize: fontSize.md, fontWeight: '600' },
  content: { padding: spacing.lg },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  backLabel: { color: colors.text, fontSize: fontSize.md },
  profileHeader: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: spacing.md },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.accent + '33', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  avatarText: { color: colors.accent, fontSize: fontSize.xxxl, fontWeight: 'bold' },
  name: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text },
  username: { fontSize: fontSize.md, color: colors.accent, marginTop: spacing.xs },
  bio: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  statsContainer: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  statValue: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  actionRow: { alignItems: 'center', marginBottom: spacing.lg },
  friendBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.success + '1A', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.full },
  friendBadgeText: { color: colors.success, fontSize: fontSize.md, fontWeight: '600' },
  pendingBadge: { alignItems: 'center' },
  pendingText: { color: colors.warning, fontSize: fontSize.md, fontWeight: '500' },
  requestActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  acceptBtn: { backgroundColor: colors.accent, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.lg },
  acceptBtnText: { color: colors.bg, fontWeight: '600' },
  addFriendBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.accent, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: borderRadius.xl },
  addFriendText: { color: colors.bg, fontSize: fontSize.md, fontWeight: '600' },
  disabledButton: { opacity: 0.5 },
  messageContainer: { padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.success + '1A', marginBottom: spacing.lg },
  errorMessage: { backgroundColor: colors.error + '1A' },
  messageText: { color: colors.text, fontSize: fontSize.sm, textAlign: 'center' },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { backgroundColor: colors.surface, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.full },
  tagText: { color: colors.text, fontSize: fontSize.sm },
  moreActions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  dangerAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dangerActionText: { color: colors.error, fontSize: fontSize.sm },
});


