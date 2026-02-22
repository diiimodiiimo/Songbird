import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, birdThemes, defaultBirdImage } from '../../lib/theme';
import { api, SuggestedUser } from '../../lib/api';
import { useAuth, useAuthToken } from '../../lib/auth';
import ThemeBird from '../../components/ThemeBird';
import InviteFriendsCTA from '../../components/InviteFriendsCTA';
import SongPreviewModal, { AviaryBirdData } from '../../components/SongPreviewModal';

const VIEWED_ENTRIES_KEY = 'aviary_viewed_entries';

export default function AviaryTab() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();
  const router = useRouter();

  const [friends, setFriends] = useState<AviaryBirdData[]>([]);
  const [currentUser, setCurrentUser] = useState<AviaryBirdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewedEntryIds, setViewedEntryIds] = useState<Set<string>>(new Set());
  const [selectedBird, setSelectedBird] = useState<AviaryBirdData | null>(null);

  // Suggested users
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  // Load viewed entries from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(VIEWED_ENTRIES_KEY).then((stored) => {
      if (stored) {
        try {
          setViewedEntryIds(new Set(JSON.parse(stored)));
        } catch {}
      }
    });
  }, []);

  const markAsViewed = useCallback(async (entryId: string) => {
    setViewedEntryIds((prev) => {
      const next = new Set(prev);
      next.add(entryId);
      AsyncStorage.setItem(VIEWED_ENTRIES_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const fetchAviaryData = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;

      const data = await api.getAviary(token);
      // API returns { currentUser, friends } directly
      const aviaryData = data as any;
      setCurrentUser(aviaryData.currentUser || null);
      setFriends(aviaryData.friends || []);

      // Fetch suggested users
      try {
        const suggested = await api.getSuggestedUsers(token, 20);
        setSuggestedUsers(suggested.users || []);
      } catch {}
    } catch (err) {
      console.error('Error fetching aviary data:', err);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchAviaryData();
  }, [fetchAviaryData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAviaryData();
    setRefreshing(false);
  };

  const handleBirdTap = (bird: AviaryBirdData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBird(bird);
    if (bird.latestSong) {
      markAsViewed(bird.latestSong.id);
    }
  };

  const handleCloseModal = () => {
    if (selectedBird?.latestSong) {
      markAsViewed(selectedBird.latestSong.id);
    }
    setSelectedBird(null);
  };

  const sendFriendRequest = async (username: string, userId: string) => {
    setSendingRequests((prev) => new Set(prev).add(userId));
    try {
      const token = await getToken();
      if (!token) return;
      await api.sendFriendRequest(token, username);
      setSentRequests((prev) => new Set(prev).add(userId));
    } catch (err) {
      console.error('Error sending friend request:', err);
    } finally {
      setSendingRequests((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  // Group friends into unread and read
  const { unreadFriends, otherFriends } = useMemo(() => {
    const unread: AviaryBirdData[] = [];
    const others: AviaryBirdData[] = [];

    let filtered = friends;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = friends.filter(
        (f) =>
          f.user.username.toLowerCase().includes(query) ||
          f.user.name?.toLowerCase().includes(query)
      );
    }

    filtered.forEach((friend) => {
      const hasUnread = friend.latestSong && !viewedEntryIds.has(friend.latestSong.id);
      if (hasUnread) {
        unread.push(friend);
      } else {
        others.push(friend);
      }
    });

    // Sort unread by most recent
    unread.sort((a, b) => {
      if (a.lastActivityDate && b.lastActivityDate) {
        return new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime();
      }
      return a.lastActivityDate ? -1 : b.lastActivityDate ? 1 : 0;
    });

    // Sort others by activity tier then recency
    const tierPriority: Record<string, number> = {
      today: 0,
      thisWeek: 1,
      thisMonth: 2,
      inactive: 3,
    };
    others.sort((a, b) => {
      const tierDiff = (tierPriority[a.activityTier] ?? 3) - (tierPriority[b.activityTier] ?? 3);
      if (tierDiff !== 0) return tierDiff;
      if (a.lastActivityDate && b.lastActivityDate) {
        return new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime();
      }
      return a.lastActivityDate ? -1 : b.lastActivityDate ? 1 : 0;
    });

    return { unreadFriends: unread, otherFriends: others };
  }, [friends, searchQuery, viewedEntryIds]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading your aviary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>The Aviary</Text>
          <Text style={styles.subtitle}>See what your flock is listening to</Text>
        </View>

        {/* Search bar */}
        {friends.length > 0 && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* New Songs (unread) */}
        {unreadFriends.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Songs</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadFriends.length}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.birdRow}>
              {unreadFriends.map((friend) => (
                <FriendBirdCard
                  key={friend.user.id}
                  bird={friend}
                  hasUnread={true}
                  onPress={() => handleBirdTap(friend)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Your Flock (read / no unread) */}
        {otherFriends.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Your Flock</Text>
              <Text style={styles.flockCount}>
                {otherFriends.length} {otherFriends.length === 1 ? 'friend' : 'friends'}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.birdRow}>
              {otherFriends.map((friend) => (
                <FriendBirdCard
                  key={friend.user.id}
                  bird={friend}
                  hasUnread={false}
                  onPress={() => handleBirdTap(friend)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search empty state */}
        {unreadFriends.length === 0 && otherFriends.length === 0 && friends.length > 0 && (
          <View style={styles.emptySearch}>
            <Text style={styles.emptySearchText}>No friends match your search</Text>
          </View>
        )}

        {/* Empty Aviary */}
        {friends.length === 0 && (
          <View style={styles.emptyAviary}>
            <ThemeBird size={80} />
            <Text style={styles.emptyTitle}>Your aviary is empty</Text>
            <Text style={styles.emptySubtitle}>
              Add friends to see their birds here and discover what songs they're logging each day.
            </Text>
            <InviteFriendsCTA />
          </View>
        )}

        {/* Suggested Users */}
        {suggestedUsers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Users on SongBird</Text>
              <Text style={styles.flockCount}>{suggestedUsers.length}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.birdRow}>
              {suggestedUsers.map((user) => (
                <View key={user.id} style={styles.suggestedCard}>
                  <TouchableOpacity
                    style={styles.suggestedCardInner}
                    onPress={() => router.push(`/user/${encodeURIComponent(user.username)}` as any)}
                    activeOpacity={0.7}
                  >
                    {user.image ? (
                      <Image source={{ uri: user.image }} style={styles.suggestedAvatar} />
                    ) : (
                      <View style={styles.suggestedAvatarPlaceholder}>
                        <Text style={styles.suggestedAvatarText}>
                          {(user.name?.[0] || user.username[0] || '?').toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.suggestedUsername} numberOfLines={1}>
                      {user.username}
                    </Text>
                  </TouchableOpacity>
                  {user.mutualFriends > 0 && (
                    <Text style={styles.mutualText}>{user.mutualFriends} mutual</Text>
                  )}
                  {sentRequests.has(user.id) ? (
                    <Text style={styles.sentText}>Request sent</Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => sendFriendRequest(user.username, user.id)}
                      disabled={sendingRequests.has(user.id)}
                    >
                      <Text style={styles.addButtonText}>
                        {sendingRequests.has(user.id) ? '...' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Friend count footer */}
        {friends.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {searchQuery
                ? `${unreadFriends.length + otherFriends.length} of ${friends.length} friends`
                : `${friends.length} friend${friends.length !== 1 ? 's' : ''} in your flock`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Song Preview Modal */}
      <SongPreviewModal
        bird={selectedBird}
        visible={!!selectedBird}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
}

// ─── Friend Bird Card Component ──────────────────────────────────────────────

interface FriendBirdCardProps {
  bird: AviaryBirdData;
  hasUnread: boolean;
  onPress: () => void;
}

function FriendBirdCard({ bird, hasUnread, onPress }: FriendBirdCardProps) {
  const theme = birdThemes[bird.user.theme];
  const birdImage = theme?.image || defaultBirdImage;
  const themeColor = theme?.colors?.primary || colors.accent;

  return (
    <TouchableOpacity style={styles.friendCard} onPress={onPress} activeOpacity={0.7}>
      {/* Bird image with unread indicator */}
      <View style={styles.friendBirdContainer}>
        {hasUnread && (
          <View style={[styles.unreadDot, { backgroundColor: themeColor }]} />
        )}
        <Image source={birdImage} style={styles.friendBirdImage} resizeMode="contain" />
      </View>

      {/* Username */}
      <Text style={styles.friendUsername} numberOfLines={1}>
        {bird.user.username}
      </Text>

      {/* Latest song snippet */}
      {bird.latestSong ? (
        <View style={styles.songSnippet}>
          {bird.latestSong.albumArtUrl ? (
            <Image
              source={{ uri: bird.latestSong.albumArtUrl }}
              style={styles.snippetAlbumArt}
            />
          ) : null}
          <Text style={styles.snippetTitle} numberOfLines={1}>
            {bird.latestSong.trackName}
          </Text>
        </View>
      ) : (
        <Text style={styles.noSongSnippet}>No song yet</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { color: colors.textMuted, fontSize: fontSize.md },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },

  // Header
  header: { alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    color: colors.text,
  },
  searchClear: { padding: spacing.xs },

  // Sections
  section: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  badge: {
    backgroundColor: colors.accent + '33',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.accent },
  flockCount: { fontSize: fontSize.sm, color: colors.textMuted },

  // Bird row
  birdRow: { gap: spacing.md, paddingRight: spacing.md },

  // Friend card
  friendCard: {
    width: 100,
    alignItems: 'center',
    gap: spacing.xs,
  },
  friendBirdContainer: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.surface,
    zIndex: 1,
  },
  friendBirdImage: { width: 48, height: 48 },
  friendUsername: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.text,
    maxWidth: 90,
    textAlign: 'center',
  },
  songSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 96,
  },
  snippetAlbumArt: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  snippetTitle: {
    fontSize: 10,
    color: colors.textMuted,
    flex: 1,
  },
  noSongSnippet: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // Empty states
  emptySearch: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptySearchText: { fontSize: fontSize.md, color: colors.textMuted },
  emptyAviary: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    lineHeight: 20,
  },

  // Suggested users
  suggestedCard: {
    width: 100,
    alignItems: 'center',
    gap: spacing.xs,
  },
  suggestedCardInner: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  suggestedAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  suggestedAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent + '33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  suggestedAvatarText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.accent,
  },
  suggestedUsername: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.text,
    maxWidth: 90,
    textAlign: 'center',
  },
  mutualText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  sentText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  addButton: {
    marginTop: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
  },
  addButtonText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.bg,
  },

  // Footer
  footer: { alignItems: 'center', paddingVertical: spacing.md },
  footerText: { fontSize: fontSize.sm, color: colors.textMuted },
});
