// Friends Tab - Friends management (matches web FriendsTab.tsx)
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import { api, Friend, FriendRequest, SuggestedUser } from '../../lib/api';
import { useAuth, useAuthToken } from '../../lib/auth';

type ViewMode = 'friends' | 'requests' | 'discover';

export default function FriendsTab() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();
  const router = useRouter();

  const [view, setView] = useState<ViewMode>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SuggestedUser[]>([]);
  const [friendUsername, setFriendUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;

      const [friendsData, requestsData, suggestedData] = await Promise.all([
        api.getFriends(token).catch(() => ({ friends: [] })),
        api.getFriendRequests(token).catch(() => ({ requests: [] })),
        api.getSuggestedUsers(token, 10).catch(() => ({ users: [] })),
      ]);

      setFriends(friendsData.friends || []);
      setRequests((requestsData.requests || []).filter((r: FriendRequest) => r.status === 'pending'));
      setSuggested(suggestedData.users || []);
    } catch (error) {
      console.error('Error fetching friends data:', error);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const sendFriendRequest = async () => {
    if (!friendUsername.trim()) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const token = await getToken();
      if (!token) return;
      await api.sendFriendRequest(token, friendUsername.trim().replace('@', ''));
      setMessage({ type: 'success', text: `Friend request sent to @${friendUsername.trim()}!` });
      setFriendUsername('');
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to send friend request' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequest = async (requestId: string, action: 'accept' | 'decline') => {
    setActionLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      await api.respondToFriendRequest(token, requestId, action);
      setMessage({ type: 'success', text: action === 'accept' ? 'Friend request accepted!' : 'Request declined' });
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update request' });
    } finally {
      setActionLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.searchUsers(token, query);
      setSearchResults(data.users || []);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const receivedRequests = requests.filter((r) => r.status === 'pending');
  const pendingCount = receivedRequests.length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
      </View>

      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'friends' && styles.activeToggle]}
          onPress={() => setView('friends')}
        >
          <Text style={[styles.toggleText, view === 'friends' && styles.activeToggleText]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'requests' && styles.activeToggle]}
          onPress={() => setView('requests')}
        >
          <Text style={[styles.toggleText, view === 'requests' && styles.activeToggleText]}>
            Requests{pendingCount > 0 ? ` (${pendingCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'discover' && styles.activeToggle]}
          onPress={() => setView('discover')}
        >
          <Text style={[styles.toggleText, view === 'discover' && styles.activeToggleText]}>
            Discover
          </Text>
        </TouchableOpacity>
      </View>

      {/* Message */}
      {message && (
        <View style={[styles.messageContainer, message.type === 'error' && styles.errorMessage]}>
          <Text style={styles.messageText}>{message.text}</Text>
        </View>
      )}

      {/* Add Friend Input */}
      <View style={styles.addFriendRow}>
        <TextInput
          style={styles.addFriendInput}
          value={friendUsername}
          onChangeText={setFriendUsername}
          placeholder="Add by username..."
          placeholderTextColor={colors.textMuted + '80'}
          onSubmitEditing={sendFriendRequest}
          returnKeyType="send"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.addButton, (!friendUsername.trim() || actionLoading) && styles.disabledButton]}
          onPress={sendFriendRequest}
          disabled={!friendUsername.trim() || actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : (
            <Text style={styles.addButtonText}>Add</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Friends List */}
      {view === 'friends' && (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>👋</Text>
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptyText}>Send a friend request to get started!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.friendCard}
              onPress={() => item.username && router.push(`/user/${item.username}`)}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(item.name?.[0] || item.email?.[0] || '?').toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.name || item.email}</Text>
                {item.username && <Text style={styles.friendUsername}>@{item.username}</Text>}
              </View>
              <Text style={styles.friendBadge}>✓</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Requests */}
      {view === 'requests' && (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>No pending requests</Text>
              <Text style={styles.emptyText}>Friend requests will appear here</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>
                  {item.sender.name || item.sender.email}
                </Text>
                <Text style={styles.requestDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleRequest(item.id, 'accept')}
                  disabled={actionLoading}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => handleRequest(item.id, 'decline')}
                  disabled={actionLoading}
                >
                  <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Discover */}
      {view === 'discover' && (
        <FlatList
          data={searchQuery.length >= 2 ? searchResults : suggested}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          ListHeaderComponent={
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={searchUsers}
                placeholder="Search users..."
                placeholderTextColor={colors.textMuted + '80'}
                autoCapitalize="none"
              />
              {searchQuery.length < 2 && suggested.length > 0 && (
                <Text style={styles.sectionLabel}>Suggested for you</Text>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>Find friends</Text>
              <Text style={styles.emptyText}>Search by username to find people</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.friendCard}
              onPress={() => item.username && router.push(`/user/${item.username}`)}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(item.name?.[0] || item.username?.[0] || '?').toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.name || item.username}</Text>
                <Text style={styles.friendUsername}>@{item.username}</Text>
                {item.mutualFriends > 0 && (
                  <Text style={styles.mutualText}>{item.mutualFriends} mutual</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textMuted, fontSize: fontSize.md },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text },
  toggleContainer: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.xs, marginBottom: spacing.sm },
  toggleButton: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center' },
  activeToggle: { backgroundColor: colors.accent },
  toggleText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '500' },
  activeToggleText: { color: colors.bg },
  messageContainer: { marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.success + '1A', marginBottom: spacing.sm },
  errorMessage: { backgroundColor: colors.error + '1A' },
  messageText: { color: colors.text, fontSize: fontSize.sm, textAlign: 'center' },
  addFriendRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  addFriendInput: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, color: colors.text, fontSize: fontSize.md },
  addButton: { backgroundColor: colors.accent, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  addButtonText: { color: colors.bg, fontSize: fontSize.md, fontWeight: '600' },
  disabledButton: { opacity: 0.5 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyEmoji: { fontSize: 60, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  emptyText: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
  friendCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent + '33', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.accent, fontSize: fontSize.lg, fontWeight: '600' },
  friendInfo: { flex: 1 },
  friendName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  friendUsername: { fontSize: fontSize.sm, color: colors.textMuted },
  mutualText: { fontSize: fontSize.xs, color: colors.accent, marginTop: 2 },
  friendBadge: { color: colors.success, fontSize: fontSize.md },
  requestCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, marginBottom: spacing.sm },
  requestInfo: { marginBottom: spacing.sm },
  requestName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  requestDate: { fontSize: fontSize.xs, color: colors.textMuted },
  requestActions: { flexDirection: 'row', gap: spacing.sm },
  acceptButton: { flex: 1, backgroundColor: colors.accent, borderRadius: borderRadius.lg, paddingVertical: spacing.sm, alignItems: 'center' },
  acceptButtonText: { color: colors.bg, fontSize: fontSize.sm, fontWeight: '600' },
  declineButton: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, paddingVertical: spacing.sm, alignItems: 'center' },
  declineButtonText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '500' },
  searchContainer: { marginBottom: spacing.md },
  searchInput: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, color: colors.text, fontSize: fontSize.md, marginBottom: spacing.md },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.sm },
});


