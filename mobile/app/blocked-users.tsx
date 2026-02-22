// Blocked Users management screen (matches web app/settings/blocked/page.tsx)
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';
import { api, BlockedUser } from '../lib/api';
import { useAuth, useAuthToken } from '../lib/auth';

export default function BlockedUsersScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();
  const router = useRouter();

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocked = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getBlockedUsers(token);
      setBlockedUsers(data.blockedUsers || []);
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  const unblockUser = (user: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock @${user.username || user.name || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) return;
              await api.unblockUser(token, user.id);
              await fetchBlocked();
            } catch (err) {
              Alert.alert('Error', 'Failed to unblock user');
            }
          },
        },
      ]
    );
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Blocked Users</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={blockedUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>No blocked users</Text>
            <Text style={styles.emptyText}>Users you block will appear here</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.name || item.username || 'Unknown'}</Text>
              {item.username && <Text style={styles.userUsername}>@{item.username}</Text>}
              <Text style={styles.blockedDate}>
                Blocked {new Date(item.blockedAt).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity style={styles.unblockBtn} onPress={() => unblockUser(item)}>
              <Text style={styles.unblockBtnText}>Unblock</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  title: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text },
  listContent: { padding: spacing.lg, paddingTop: 0 },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyEmoji: { fontSize: 60, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  emptyText: { fontSize: fontSize.md, color: colors.textMuted },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, marginBottom: spacing.sm },
  userInfo: { flex: 1 },
  userName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  userUsername: { fontSize: fontSize.sm, color: colors.textMuted },
  blockedDate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  unblockBtn: { backgroundColor: colors.accent + '1A', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.lg },
  unblockBtnText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '600' },
});


