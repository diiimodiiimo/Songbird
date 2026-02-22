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
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';
import { api, Entry } from '../lib/api';
import { useAuth, useAuthToken } from '../lib/auth';

interface MonthGroup {
  label: string;
  key: string;
  entries: Entry[];
  collapsed: boolean;
}

export default function ArchiveScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();
  const router = useRouter();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());

  // Edit modal state
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editMood, setEditMood] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEntries = useCallback(async (pageNum = 1) => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;

      const data = await api.getEntries(token, pageNum, 50);
      if (pageNum === 1) {
        setEntries(data.entries);
        setFilteredEntries(data.entries);
      } else {
        const newEntries = [...entries, ...data.entries];
        setEntries(newEntries);
        setFilteredEntries(
          searchQuery
            ? filterByQuery(newEntries, searchQuery)
            : newEntries
        );
      }
      setTotal(data.total);
      setHasMore(data.entries.length === 50);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken, entries, searchQuery]);

  useEffect(() => {
    fetchEntries(1);
  }, [isLoaded, isSignedIn]);

  const filterByQuery = (items: Entry[], query: string) => {
    const q = query.toLowerCase();
    return items.filter(e =>
      e.songTitle.toLowerCase().includes(q) ||
      e.artist.toLowerCase().includes(q) ||
      (e.notes || '').toLowerCase().includes(q)
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setSearchQuery('');
    setCollapsedMonths(new Set());
    await fetchEntries(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchEntries(nextPage);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredEntries(entries);
    } else {
      setFilteredEntries(filterByQuery(entries, query));
    }
  };

  const toggleMonth = (key: string) => {
    setCollapsedMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const groupByMonth = (items: Entry[]): MonthGroup[] => {
    const groups: Record<string, Entry[]> = {};
    items.forEach(entry => {
      const d = new Date(entry.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => {
        const [year, month] = key.split('-');
        const label = new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
        return { label, key, entries: items, collapsed: collapsedMonths.has(key) };
      });
  };

  const openEdit = (entry: Entry) => {
    setEditEntry(entry);
    setEditNotes(entry.notes || '');
    setEditMood(entry.mood || '');
  };

  const saveEdit = async () => {
    if (!editEntry) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      await api.updateEntry(token, editEntry.id, {
        notes: editNotes,
        mood: editMood || undefined,
      });
      const updatedEntries = entries.map(e =>
        e.id === editEntry.id ? { ...e, notes: editNotes, mood: editMood } : e
      );
      setEntries(updatedEntries);
      setFilteredEntries(
        searchQuery ? filterByQuery(updatedEntries, searchQuery) : updatedEntries
      );
      setEditEntry(null);
    } catch (error) {
      console.error('Error updating entry:', error);
    } finally {
      setSaving(false);
    }
  };

  const grouped = groupByMonth(filteredEntries);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading archive...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Archive</Text>
          <Text style={styles.headerCount}>{total} entries</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search songs, artists, notes..."
          placeholderTextColor={colors.textMuted + '80'}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results count when searching */}
      {searchQuery.length > 0 && (
        <Text style={styles.searchResults}>
          {filteredEntries.length} result{filteredEntries.length !== 1 ? 's' : ''} found
        </Text>
      )}

      <FlatList
        data={grouped}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching entries' : 'No entries yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try a different search term'
                : 'Start logging songs to build your musical timeline.'}
            </Text>
          </View>
        }
        renderItem={({ item: group }) => (
          <View style={styles.monthGroup}>
            {/* Collapsible month header */}
            <TouchableOpacity
              style={styles.monthHeader}
              onPress={() => toggleMonth(group.key)}
              activeOpacity={0.7}
            >
              <View style={styles.monthLabelRow}>
                <Text style={styles.monthLabel}>{group.label}</Text>
                <View style={styles.monthBadge}>
                  <Text style={styles.monthBadgeText}>{group.entries.length}</Text>
                </View>
              </View>
              <Ionicons
                name={group.collapsed ? 'chevron-forward' : 'chevron-down'}
                size={18}
                color={colors.accent}
              />
            </TouchableOpacity>

            {/* Entries (shown when not collapsed) */}
            {!group.collapsed && group.entries.map(entry => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onPress={() => openEdit(entry)}
                activeOpacity={0.7}
              >
                {entry.albumArt ? (
                  <Image source={{ uri: entry.albumArt }} style={styles.albumArt} />
                ) : (
                  <View style={styles.albumArtPlaceholder}>
                    <Ionicons name="musical-notes" size={24} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.entryInfo}>
                  <Text style={styles.entryDate}>
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.entrySong} numberOfLines={1}>{entry.songTitle}</Text>
                  <Text style={styles.entryArtist} numberOfLines={1}>{entry.artist}</Text>
                  {entry.mood && (
                    <View style={styles.moodBadge}>
                      <Text style={styles.moodText}>{entry.mood}</Text>
                    </View>
                  )}
                  {entry.notes && (
                    <Text style={styles.entryNotes} numberOfLines={2}>{entry.notes}</Text>
                  )}
                </View>
                <Ionicons name="create-outline" size={16} color={colors.textMuted} style={{ marginLeft: spacing.xs }} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      {/* Edit Modal */}
      <Modal visible={!!editEntry} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditEntry(null)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Entry</Text>
              <TouchableOpacity onPress={saveEdit} disabled={saving}>
                <Text style={[styles.modalSave, saving && { opacity: 0.5 }]}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            {editEntry && (
              <ScrollView style={styles.modalBody}>
                {/* Song info (read-only) */}
                <View style={styles.editSongInfo}>
                  {editEntry.albumArt && (
                    <Image source={{ uri: editEntry.albumArt }} style={styles.editAlbumArt} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.editSongTitle}>{editEntry.songTitle}</Text>
                    <Text style={styles.editArtist}>{editEntry.artist}</Text>
                    <Text style={styles.editDate}>
                      {new Date(editEntry.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>

                {/* Mood */}
                <Text style={styles.fieldLabel}>Mood</Text>
                <TextInput
                  style={styles.moodInput}
                  value={editMood}
                  onChangeText={setEditMood}
                  placeholder="How were you feeling?"
                  placeholderTextColor={colors.textMuted + '80'}
                />

                {/* Notes */}
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  style={styles.notesInput}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="What was happening that day?"
                  placeholderTextColor={colors.textMuted + '80'}
                  multiline
                  textAlignVertical="top"
                />
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { color: colors.textMuted, fontSize: fontSize.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    paddingVertical: 0,
  },
  searchResults: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: { fontSize: 60, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  emptyText: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.xl },
  monthGroup: {
    marginBottom: spacing.md,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  monthLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  monthLabel: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.accent,
  },
  monthBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  monthBadgeText: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  entryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    alignItems: 'center',
  },
  albumArt: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
  },
  albumArtPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryInfo: {
    flex: 1,
  },
  entryDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  entrySong: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  entryArtist: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  moodBadge: {
    backgroundColor: colors.accent + '1A',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  moodText: {
    color: colors.accent,
    fontSize: fontSize.xs,
  },
  entryNotes: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '80%',
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  modalSave: {
    color: colors.accent,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  modalBody: {
    padding: spacing.lg,
  },
  editSongInfo: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
  },
  editAlbumArt: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
  },
  editSongTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  editArtist: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  editDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  moodInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    minHeight: 120,
  },
});
