// Feed Tab - Friends' entries (matches web FeedTab.tsx)
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import { api, Entry } from '../../lib/api';
import { useAuth, useAuthToken } from '../../lib/auth';

interface FeedEntry extends Entry {
  user?: {
    name?: string;
    username?: string;
    image?: string;
  };
  vibes?: string[];
  vibeCount?: number;
  commentCount?: number;
}

export default function FeedTab() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();

  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(async (pageNum = 1) => {
    if (!isLoaded || !isSignedIn) return;

    try {
      const token = await getToken();
      if (!token) return;

      const data = await api.getFeed(token, pageNum);
      if (pageNum === 1) {
        setEntries(data.entries);
      } else {
        setEntries(prev => [...prev, ...data.entries]);
      }
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchFeed(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage);
    }
  };

  const handleVibe = async (entryId: string, emoji: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await api.addVibe(token, entryId, emoji);

      // Optimistically update the UI
      setEntries(prev =>
        prev.map(e =>
          e.id === entryId
            ? { ...e, vibeCount: (e.vibeCount || 0) + 1 }
            : e
        )
      );
    } catch (error) {
      console.error('Error adding vibe:', error);
    }
  };

  const renderItem = ({ item }: { item: FeedEntry }) => (
    <View style={styles.feedCard}>
      {/* User info */}
      <View style={styles.userRow}>
        {item.user?.image ? (
          <Image source={{ uri: item.user.image }} style={styles.userAvatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {(item.user?.name?.[0] || item.user?.username?.[0] || '?').toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.user?.name || item.user?.username || 'Unknown'}</Text>
          <Text style={styles.entryDate}>
            {new Date(item.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      </View>

      {/* Song info */}
      <View style={styles.songRow}>
        {item.albumArt && (
          <Image source={{ uri: item.albumArt }} style={styles.albumArt} />
        )}
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>{item.songTitle}</Text>
          <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
        </View>
      </View>

      {/* Notes */}
      {item.notes && (
        <Text style={styles.notes} numberOfLines={3}>{item.notes}</Text>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleVibe(item.id, '💜')}
        >
          <Text style={styles.actionIcon}>💜</Text>
          <Text style={styles.actionCount}>{item.vibeCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{item.commentCount || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎵</Text>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptyText}>
            Add friends to see what songs are defining their days.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  feedCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.accent,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  userInfo: {
    marginLeft: spacing.sm,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  entryDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  albumArt: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
  },
  songInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  songTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  songArtist: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  notes: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
