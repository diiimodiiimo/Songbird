// Memory Tab - On This Day and History (matches web MemoryTab.tsx)
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import { api, Entry } from '../../lib/api';
import { useAuth, useAuthToken } from '../../lib/auth';

export default function MemoryTab() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();

  const [view, setView] = useState<'onthisday' | 'history'>('onthisday');
  const [onThisDayEntries, setOnThisDayEntries] = useState<Entry[]>([]);
  const [historyEntries, setHistoryEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const fetchOnThisDay = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    try {
      const token = await getToken();
      if (!token) return;

      const data = await api.getOnThisDay(token);
      if (data.memories) {
        setOnThisDayEntries(data.memories);
      }
    } catch (error) {
      console.error('Error fetching on this day:', error);
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchHistory = useCallback(async (pageNum = 1) => {
    if (!isLoaded || !isSignedIn) return;

    try {
      const token = await getToken();
      if (!token) return;

      const data = await api.getEntries(token, pageNum, 20);
      if (pageNum === 1) {
        setHistoryEntries(data.entries);
      } else {
        setHistoryEntries(prev => [...prev, ...data.entries]);
      }
      setHasMore(data.entries.length === 20);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchOnThisDay(), fetchHistory(1)]);
      setLoading(false);
    };
    fetchData();
  }, [fetchOnThisDay, fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await Promise.all([fetchOnThisDay(), fetchHistory(1)]);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && view === 'history') {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHistory(nextPage);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading memories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderHistoryItem = ({ item }: { item: Entry }) => (
    <View style={styles.historyCard}>
      {item.albumArt && (
        <Image source={{ uri: item.albumArt }} style={styles.historyAlbumArt} />
      )}
      <View style={styles.historyInfo}>
        <Text style={styles.historyDate}>
          {new Date(item.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.historySong} numberOfLines={1}>{item.songTitle}</Text>
        <Text style={styles.historyArtist} numberOfLines={1}>{item.artist}</Text>
        {item.notes && (
          <Text style={styles.historyNotes} numberOfLines={2}>{item.notes}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'onthisday' && styles.activeToggle]}
          onPress={() => setView('onthisday')}
        >
          <Text style={[styles.toggleText, view === 'onthisday' && styles.activeToggleText]}>
            On This Day
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'history' && styles.activeToggle]}
          onPress={() => setView('history')}
        >
          <Text style={[styles.toggleText, view === 'history' && styles.activeToggleText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {view === 'onthisday' ? (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          <View style={styles.header}>
            <Text style={styles.title}>On This Day</Text>
            <Text style={styles.subtitle}>{formattedDate}</Text>
          </View>

          {onThisDayEntries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTitle}>No memories yet</Text>
              <Text style={styles.emptyText}>
                Keep logging songs and you'll see them here on this date in future years.
              </Text>
            </View>
          ) : (
            <View style={styles.memoriesList}>
              {onThisDayEntries.map((entry) => (
                <View key={entry.id} style={styles.memoryCard}>
                  {entry.albumArt && (
                    <Image source={{ uri: entry.albumArt }} style={styles.memoryAlbumArt} />
                  )}
                  <View style={styles.memoryInfo}>
                    <Text style={styles.memoryYear}>
                      {new Date(entry.date).getFullYear()}
                    </Text>
                    <Text style={styles.memorySong} numberOfLines={1}>{entry.songTitle}</Text>
                    <Text style={styles.memoryArtist} numberOfLines={1}>{entry.artist}</Text>
                    {entry.notes && (
                      <Text style={styles.memoryNotes} numberOfLines={2}>{entry.notes}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={historyEntries}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.historyContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptyText}>
                Start logging songs to build your musical timeline.
              </Text>
            </View>
          }
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
  toggleContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: colors.accent,
  },
  toggleText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  activeToggleText: {
    color: colors.bg,
  },
  content: {
    padding: spacing.lg,
  },
  historyContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
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
    paddingHorizontal: spacing.xl,
  },
  memoriesList: {
    gap: spacing.md,
  },
  memoryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  memoryAlbumArt: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.lg,
  },
  memoryInfo: {
    flex: 1,
  },
  memoryYear: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  memorySong: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  memoryArtist: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  memoryNotes: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  historyAlbumArt: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: fontSize.xs,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  historySong: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  historyArtist: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  historyNotes: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
