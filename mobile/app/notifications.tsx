// Notifications Screen - Full page notifications (matches web Notifications.tsx)
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';
import { api, Notification } from '../lib/api';
import { useAuth, useAuthToken } from '../lib/auth';

export default function NotificationsScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = useCallback(async (autoMarkRead = false) => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getNotifications(token);
      const fetched = data.notifications || [];
      setNotifications(fetched);

      if (autoMarkRead) {
        const unreadIds = fetched.filter((n: Notification) => !n.read).map((n: Notification) => n.id);
        if (unreadIds.length > 0) {
          await api.markNotificationsRead(token, unreadIds);
          setNotifications(fetched.map((n: Notification) => ({ ...n, read: true })));
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => fetchNotifications(false), 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      const token = await getToken();
      if (!token) return;
      await api.markNotificationsRead(token, unreadIds);
      await fetchNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const dismissNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      const token = await getToken();
      if (!token) return;
      await api.markNotificationsRead(token, [id]);
    } catch (err) {
      console.error('Error dismissing:', err);
    }
  };

  const handleFriendRequest = async (notificationId: string, requestId: string, action: 'accept' | 'decline') => {
    setActionLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      await api.respondToFriendRequest(token, requestId, action);
      dismissNotification(notificationId);
    } catch (err) {
      console.error('Error handling friend request:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'vibe': return '💗';
      case 'comment': return '💬';
      case 'mention': return '📣';
      case 'friend_request': return '👋';
      case 'friend_request_accepted': return '🤝';
      case 'on_this_day': return '📖';
      default: return '🔔';
    }
  };

  const getNotificationText = (notification: Notification): string => {
    const data = notification.relatedData;
    switch (notification.type) {
      case 'mention':
        return `${data?.user?.name || 'Someone'} mentioned you in "${data?.songTitle || 'a song'}"`;
      case 'friend_request_accepted':
        return `${data?.sender?.name || data?.receiver?.name || 'Someone'} accepted your friend request`;
      case 'vibe': {
        const viber = data?.vibeUser;
        const viberName = viber?.name || viber?.username || viber?.email || 'Someone';
        return `${viberName} vibed to "${data?.songTitle || 'your song'}"`;
      }
      case 'comment':
        return `${data?.user?.name || 'Someone'} commented on your song`;
      case 'friend_request':
        return `${data?.sender?.name || 'Someone'} sent you a friend request`;
      case 'on_this_day':
        return 'You have memories from this day!';
      default:
        return 'New notification';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.clearAll}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>All quiet in the nest</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.notifCard, !item.read && styles.unreadCard]}
            onPress={() => dismissNotification(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.notifIcon}>{getNotificationIcon(item.type)}</Text>
            <View style={styles.notifContent}>
              <Text style={styles.notifText}>{getNotificationText(item)}</Text>
              <Text style={styles.notifTime}>{formatDate(item.createdAt)}</Text>

              {/* Friend request actions */}
              {item.type === 'friend_request' && item.relatedId && (
                <View style={styles.notifActions}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleFriendRequest(item.id, item.relatedId!, 'accept')}
                    disabled={actionLoading}
                  >
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={() => handleFriendRequest(item.id, item.relatedId!, 'decline')}
                    disabled={actionLoading}
                  >
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => dismissNotification(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.dismissBtn}>×</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  title: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text, flex: 1, marginLeft: spacing.md },
  clearAll: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '500' },
  listContent: { padding: spacing.lg, paddingTop: 0 },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyEmoji: { fontSize: 60, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  emptyText: { fontSize: fontSize.md, color: colors.textMuted },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  unreadCard: { backgroundColor: colors.accent + '15', borderLeftWidth: 3, borderLeftColor: colors.accent },
  notifIcon: { fontSize: 24, marginTop: 2 },
  notifContent: { flex: 1 },
  notifText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  notifTime: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  notifActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  acceptBtn: { backgroundColor: colors.accent, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.lg },
  acceptBtnText: { color: colors.bg, fontSize: fontSize.xs, fontWeight: '600' },
  declineBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.lg },
  declineBtnText: { color: colors.textMuted, fontSize: fontSize.xs },
  dismissBtn: { color: colors.textMuted, fontSize: 20, padding: spacing.xs },
});


