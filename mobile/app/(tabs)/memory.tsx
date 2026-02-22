// Memory Tab - On This Day + History (combines web MemoryTab features with mobile-native UX)
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius, defaultBirdImage } from '../../lib/theme';
import { api, apiFetch, Entry, Milestone } from '../../lib/api';
import ThemeBird from '../../components/ThemeBird';
import { useAuth, useAuthToken } from '../../lib/auth';

// Web-style milestone types (different from the entry-creation Milestone)
interface MilestoneProgress {
  type: string;
  message: string;
  achieved: boolean;
  achievedDate?: string;
  progress?: {
    current: number;
    target: number;
    message: string;
  };
}

interface MilestoneData {
  milestones: MilestoneProgress[];
  nextMilestone: MilestoneProgress | null;
  stats: {
    entryCount: number;
    daysSinceFirst: number;
  };
}

function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}

export default function MemoryTab() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();

  // View toggle (mobile-native)
  const [view, setView] = useState<'onthisday' | 'history'>('onthisday');

  // On This Day
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [onThisDayEntries, setOnThisDayEntries] = useState<Entry[]>([]);
  const [loadingOnThisDay, setLoadingOnThisDay] = useState(true);
  const [showNotes, setShowNotes] = useState(true);

  // AI Insight
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Recent Flight (last 7 days)
  const [recentFlightEntries, setRecentFlightEntries] = useState<Entry[]>([]);
  const [flightInsight, setFlightInsight] = useState<string | null>(null);
  const [loadingFlightInsight, setLoadingFlightInsight] = useState(false);

  // Recent Days (last 14 entries)
  const [recentEntries, setRecentEntries] = useState<Entry[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [recentDaysOpen, setRecentDaysOpen] = useState(false);

  // Milestones
  const [milestoneData, setMilestoneData] = useState<MilestoneData | null>(null);

  // History (mobile-native paginated)
  const [historyEntries, setHistoryEntries] = useState<Entry[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const todayStr = getLocalDateString();
  const isToday = selectedDate === todayStr;

  // ─── Fetchers ─────────────────────────────────────────────────────────

  const fetchOnThisDay = useCallback(async (date: string) => {
    if (!isLoaded || !isSignedIn) return;
    setLoadingOnThisDay(true);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getOnThisDay(token, date);
      const entries = data.memories || [];
      setOnThisDayEntries(entries);
      if (entries.length > 0) {
        fetchAiInsight(entries, date, token);
      } else {
        setAiInsight(null);
      }
    } catch (error) {
      console.error('Error fetching on this day:', error);
    } finally {
      setLoadingOnThisDay(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchAiInsight = async (entries: Entry[], date: string, token: string) => {
    setLoadingInsight(true);
    try {
      const artists = entries.map(e => e.artist);
      const songs = entries.map(e => e.songTitle);
      const notes = entries.map(e => e.notes).filter((n): n is string => !!n);
      const people = entries.flatMap(e => e.people?.map(p => p.name) || []);
      const years = entries.map(e => parseInt(e.date.split('-')[0]));

      const data = await apiFetch<{ insight: string }>('/api/ai-insight', {
        method: 'POST',
        body: JSON.stringify({ artists, songs, date, notes, people, years }),
        token,
      });
      if (data.insight) setAiInsight(data.insight);
    } catch (error) {
      console.error('Error fetching AI insight:', error);
    } finally {
      setLoadingInsight(false);
    }
  };

  const fetchRecentEntries = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    setLoadingRecent(true);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getEntries(token, 1, 14);
      setRecentEntries(data.entries || []);
    } catch (error) {
      console.error('Error fetching recent entries:', error);
    } finally {
      setLoadingRecent(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchRecentFlight = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getEntries(token, 1, 14);
      if (data.entries) {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recent = data.entries.filter((entry: Entry) => {
          const entryDate = new Date(entry.date);
          return entryDate >= sevenDaysAgo;
        });
        if (recent.length >= 2) {
          setRecentFlightEntries(recent);
          fetchFlightInsight(recent, token);
        } else {
          setRecentFlightEntries([]);
          setFlightInsight(null);
        }
      }
    } catch (error) {
      console.error('Error fetching recent flight:', error);
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchFlightInsight = async (entries: Entry[], token: string) => {
    if (entries.length < 2) return;
    setLoadingFlightInsight(true);
    try {
      const artists = entries.map(e => e.artist);
      const songs = entries.map(e => e.songTitle);
      const notes = entries.map(e => e.notes).filter((n): n is string => !!n);
      const people = entries.flatMap(e => e.people?.map(p => p.name) || []);

      const data = await apiFetch<{ insight: string }>('/api/ai-insight', {
        method: 'POST',
        body: JSON.stringify({
          artists,
          songs,
          date: getLocalDateString(),
          context: 'recent',
          notes: notes.length > 0 ? notes : undefined,
          people: people.length > 0 ? people : undefined,
        }),
        token,
      });
      if (data.insight) setFlightInsight(data.insight);
    } catch (error) {
      console.error('Error fetching flight insight:', error);
    } finally {
      setLoadingFlightInsight(false);
    }
  };

  const fetchMilestones = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await apiFetch<MilestoneData>(
        `/api/milestones?today=${getLocalDateString()}`,
        { token }
      );
      setMilestoneData(data);
    } catch (error) {
      console.error('Error fetching milestones:', error);
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

  // ─── Effects ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchOnThisDay(selectedDate);
    }
  }, [selectedDate, isLoaded, isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchRecentEntries();
      fetchRecentFlight();
      fetchMilestones();
      fetchHistory(1);
    }
  }, [isLoaded, isSignedIn]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await Promise.all([
      fetchOnThisDay(selectedDate),
      fetchRecentEntries(),
      fetchRecentFlight(),
      fetchMilestones(),
      fetchHistory(1),
    ]);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && view === 'history') {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHistory(nextPage);
    }
  };

  // ─── Date Navigation ─────────────────────────────────────────────────

  const goBack = () => setSelectedDate(prev => addDays(prev, -1));
  const goForward = () => {
    if (!isToday) setSelectedDate(prev => addDays(prev, 1));
  };
  const goToToday = () => setSelectedDate(getLocalDateString());

  // ─── Initial Loading ─────────────────────────────────────────────────

  if (!isLoaded || !isSignedIn) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.centeredContainer}>
          <ThemeBird size={64} />
          <Text style={styles.loadingText}>Loading memories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render Helpers ───────────────────────────────────────────────────

  const renderMemoryCard = (entry: Entry) => (
    <View key={entry.id} style={styles.memoryCard}>
      {entry.albumArt && (
        <View style={styles.albumArtWrapper}>
          <View style={styles.albumArtGlow} />
          <Image source={{ uri: entry.albumArt }} style={styles.memoryAlbumArt} />
        </View>
      )}
      <View style={styles.memoryInfo}>
        <Text style={styles.memoryYear}>{entry.date.split('-')[0]}</Text>
        <Text style={styles.memorySong} numberOfLines={1}>{entry.songTitle}</Text>
        <Text style={styles.memoryArtist} numberOfLines={1}>{entry.artist}</Text>
        <Text style={styles.spotifyAttr}>Powered by Spotify</Text>
        {showNotes && entry.notes && (
          <Text style={styles.memoryNotes} numberOfLines={3}>{entry.notes}</Text>
        )}
        {entry.people && entry.people.length > 0 && (
          <View style={styles.peopleTags}>
            {entry.people.map((person) => (
              <View key={person.id} style={styles.personChip}>
                <Text style={styles.personChipText}>{person.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const renderFlightCard = (entry: Entry) => {
    const [y, m, d] = entry.date.split('-').map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return (
      <View key={entry.id} style={styles.flightCard}>
        {entry.albumArt && (
          <Image source={{ uri: entry.albumArt }} style={styles.flightArt} />
        )}
        <View style={styles.flightInfo}>
          <Text style={styles.flightDate}>{label}</Text>
          <Text style={styles.flightSong} numberOfLines={1}>{entry.songTitle}</Text>
          <Text style={styles.flightArtist} numberOfLines={1}>{entry.artist}</Text>
        </View>
      </View>
    );
  };

  const renderRecentCard = (entry: Entry) => {
    const [y, m, d] = entry.date.split('-').map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return (
      <View key={entry.id} style={styles.recentCard}>
        {entry.albumArt && (
          <Image source={{ uri: entry.albumArt }} style={styles.recentArt} />
        )}
        <View style={styles.recentInfo}>
          <Text style={styles.recentDate}>{label}</Text>
          <Text style={styles.recentSong} numberOfLines={1}>{entry.songTitle}</Text>
          <Text style={styles.recentArtist} numberOfLines={1}>{entry.artist}</Text>
          {showNotes && entry.notes && (
            <Text style={styles.recentNotes} numberOfLines={2}>{entry.notes}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderMilestoneBar = () => {
    if (!milestoneData?.nextMilestone?.progress) return null;
    const { progress } = milestoneData.nextMilestone;
    const pct = Math.min(100, (progress.current / progress.target) * 100);
    return (
      <View style={styles.milestoneBox}>
        <Text style={styles.milestoneMsg}>{progress.message}</Text>
        <View style={styles.mBarBg}>
          <View style={[styles.mBarFill, { width: `${pct}%` }]} />
        </View>
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: Entry }) => (
    <View style={styles.historyCard}>
      {item.albumArt && (
        <Image source={{ uri: item.albumArt }} style={styles.historyArt} />
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
        {item.people && item.people.length > 0 && (
          <View style={styles.peopleTags}>
            {item.people.map((person) => (
              <View key={person.id} style={styles.personChip}>
                <Text style={styles.personChipText}>{person.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  // ─── On This Day View ─────────────────────────────────────────────────

  const renderOnThisDayView = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      {/* Header */}
      <Text style={styles.pageTitle}>On This Day</Text>

      {/* Date Picker */}
      <View style={styles.datePicker}>
        <Text style={styles.dateLabel}>What happened on this day?</Text>
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={goBack} style={styles.dateBtn}>
            <Text style={styles.dateBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.dateValue}>{formatDisplayDate(selectedDate)}</Text>
          <TouchableOpacity
            onPress={goForward}
            style={[styles.dateBtn, isToday && styles.dateBtnDisabled]}
            disabled={isToday}
          >
            <Text style={[styles.dateBtnText, isToday && styles.dateBtnTextDisabled]}>›</Text>
          </TouchableOpacity>
        </View>
        {!isToday && (
          <TouchableOpacity onPress={goToToday} style={styles.todayPill}>
            <Text style={styles.todayPillText}>Today</Text>
          </TouchableOpacity>
        )}
        {/* Notes Toggle */}
        <TouchableOpacity
          onPress={() => setShowNotes(!showNotes)}
          style={styles.notesToggleRow}
          activeOpacity={0.7}
        >
          <View style={[styles.checkBox, showNotes && styles.checkBoxOn]}>
            {showNotes && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.notesToggleLabel}>Show notes</Text>
        </TouchableOpacity>
      </View>

      {/* AI Insight */}
      {onThisDayEntries.length > 0 && (
        <View style={styles.insightCard}>
          {loadingInsight ? (
            <View style={styles.insightLoadingRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.insightLoadingLabel}>Analyzing your music...</Text>
            </View>
          ) : aiInsight ? (
            <Text style={styles.insightQuote}>&ldquo;{aiInsight}&rdquo;</Text>
          ) : null}
        </View>
      )}

      {/* Entries or Loading / Empty */}
      {loadingOnThisDay ? (
        <View style={styles.centeredSection}>
          <ThemeBird size={64} />
          <Text style={styles.loadingText}>Searching your memories...</Text>
        </View>
      ) : onThisDayEntries.length > 0 ? (
        <View style={styles.entryList}>{onThisDayEntries.map(renderMemoryCard)}</View>
      ) : (
        <View style={styles.centeredSection}>
          <ThemeBird size={72} />
          {recentEntries.length === 0 ? (
            <>
              <Text style={styles.emptyHeading}>Welcome to your musical journal</Text>
              <Text style={styles.emptyBody}>
                Every song you log becomes a memory. Start your journey by logging your first
                song — each entry tells a story about who you were and what mattered in that moment.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyHeading}>No memories from this day yet</Text>
              <Text style={styles.emptyBody}>
                Keep logging songs to build your musical timeline!
              </Text>
            </>
          )}
          {renderMilestoneBar()}
        </View>
      )}

      {/* ── Recent Flight ─────────────────────────────────────────────── */}
      {recentFlightEntries.length >= 2 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Your Recent Flight</Text>
          {loadingFlightInsight ? (
            <View style={styles.insightCard}>
              <View style={styles.insightLoadingRow}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.insightLoadingLabel}>Reflecting on your week...</Text>
              </View>
            </View>
          ) : flightInsight ? (
            <View style={styles.insightCard}>
              <Text style={styles.insightQuote}>&ldquo;{flightInsight}&rdquo;</Text>
            </View>
          ) : null}
          <View style={styles.entryList}>
            {recentFlightEntries.map(renderFlightCard)}
          </View>
        </View>
      )}

      {/* ── Recent Days (collapsible) ─────────────────────────────────── */}
      <View style={styles.recentDaysWrap}>
        <TouchableOpacity
          onPress={() => setRecentDaysOpen(!recentDaysOpen)}
          style={styles.recentDaysHeader}
          activeOpacity={0.7}
        >
          <Text style={styles.recentDaysTitle}>Recent Days</Text>
          <View style={styles.recentDaysActions}>
            <TouchableOpacity
              onPress={() => setView('history')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.archiveBtn}>Full Archive →</Text>
            </TouchableOpacity>
            <Text style={styles.chevron}>{recentDaysOpen ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {recentDaysOpen && (
          <View style={styles.recentDaysBody}>
            {loadingRecent ? (
              <View style={styles.centeredMini}>
                <ThemeBird size={48} />
                <Text style={styles.loadingText}>Loading recent entries...</Text>
              </View>
            ) : recentEntries.length > 0 ? (
              recentEntries.map(renderRecentCard)
            ) : (
              <View style={styles.centeredMini}>
                <ThemeBird size={56} />
                <Text style={styles.emptyHeading}>No recent entries yet</Text>
                <Text style={styles.emptyBody}>Start logging songs to see them here!</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Archive shortcut */}
      <TouchableOpacity onPress={() => setView('history')} style={styles.fullArchiveLink}>
        <Text style={styles.fullArchiveLinkText}>View Full History →</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ─── History View ─────────────────────────────────────────────────────

  const renderHistoryView = () => (
    <FlatList
      data={historyEntries}
      renderItem={renderHistoryItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View style={styles.centeredSection}>
          <ThemeBird size={72} />
          <Text style={styles.emptyHeading}>No entries yet</Text>
          <Text style={styles.emptyBody}>
            Start logging songs to build your musical timeline.
          </Text>
        </View>
      }
    />
  );

  // ─── Main ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* View Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'onthisday' && styles.toggleBtnActive]}
          onPress={() => setView('onthisday')}
        >
          <Text style={[styles.toggleLabel, view === 'onthisday' && styles.toggleLabelActive]}>
            On This Day
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'history' && styles.toggleBtnActive]}
          onPress={() => setView('history')}
        >
          <Text style={[styles.toggleLabel, view === 'history' && styles.toggleLabelActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {view === 'onthisday' ? renderOnThisDayView() : renderHistoryView()}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Layout
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl + spacing.xl },
  listContent: { padding: spacing.lg },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  centeredSection: { alignItems: 'center', paddingVertical: spacing.xxl },
  centeredMini: { alignItems: 'center', paddingVertical: spacing.lg },
  loadingText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.sm },

  // Toggle
  toggleRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: colors.accent },
  toggleLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '500' },
  toggleLabelActive: { color: colors.bg },

  // Page header
  pageTitle: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.lg },

  // Date picker
  datePicker: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  dateLabel: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.md },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  dateBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBtnDisabled: { opacity: 0.3 },
  dateBtnText: { color: colors.text, fontSize: 28, fontWeight: '300', marginTop: -2 },
  dateBtnTextDisabled: { color: colors.textMuted },
  dateValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    minWidth: 150,
    textAlign: 'center',
  },
  todayPill: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent + '20',
  },
  todayPillText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '600' },

  // Notes toggle
  notesToggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBoxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkMark: { color: colors.bg, fontSize: 12, fontWeight: 'bold' },
  notesToggleLabel: { color: colors.textMuted, fontSize: fontSize.sm },

  // AI Insight card
  insightCard: {
    backgroundColor: colors.surface + '80',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  insightLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  insightLoadingLabel: { color: colors.textMuted, fontSize: fontSize.sm },
  insightQuote: { color: colors.text, fontSize: fontSize.sm, fontStyle: 'italic', lineHeight: 20, opacity: 0.9 },

  // Entry list
  entryList: { gap: spacing.md },

  // Memory cards (On This Day entries)
  memoryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  albumArtWrapper: { position: 'relative' as const },
  albumArtGlow: {
    position: 'absolute' as const,
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: borderRadius.lg + 2,
    backgroundColor: colors.accent,
    opacity: 0.35,
  },
  memoryAlbumArt: { width: 90, height: 90, borderRadius: borderRadius.lg },
  memoryInfo: { flex: 1 },
  memoryYear: { fontSize: fontSize.sm, color: colors.accent, fontWeight: '600', marginBottom: 2 },
  memorySong: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  memoryArtist: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: 4 },
  spotifyAttr: { fontSize: fontSize.xs, color: '#1DB954', marginBottom: 4 },
  memoryNotes: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    lineHeight: 18,
  },

  // People chips
  peopleTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  personChip: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent + '15',
    borderWidth: 1,
    borderColor: colors.accent + '40',
  },
  personChipText: { fontSize: fontSize.xs, color: colors.text, fontWeight: '500' },

  // Empty states
  emptyHeading: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
  },

  // Milestone progress bar
  milestoneBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '100%',
    maxWidth: 300,
  },
  milestoneMsg: { fontSize: fontSize.sm, color: colors.text, marginBottom: spacing.sm, opacity: 0.8 },
  mBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: colors.bg,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  mBarFill: { height: 8, backgroundColor: colors.accent, borderRadius: borderRadius.full },

  // Section headers
  section: { marginTop: spacing.xl },
  sectionHeading: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },

  // Flight cards (Recent Flight section)
  flightCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
  },
  flightArt: { width: 48, height: 48, borderRadius: borderRadius.md },
  flightInfo: { flex: 1 },
  flightDate: { fontSize: fontSize.xs, color: colors.textMuted },
  flightSong: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  flightArtist: { fontSize: fontSize.sm, color: colors.textMuted },

  // Recent Days collapsible
  recentDaysWrap: {
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    paddingTop: spacing.lg,
  },
  recentDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  recentDaysTitle: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text },
  recentDaysActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  archiveBtn: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '600' },
  chevron: { color: colors.textMuted, fontSize: fontSize.sm },
  recentDaysBody: { marginTop: spacing.md, gap: spacing.sm },

  // Recent entry cards
  recentCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  recentArt: { width: 56, height: 56, borderRadius: borderRadius.md },
  recentInfo: { flex: 1 },
  recentDate: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
  recentSong: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  recentArtist: { fontSize: fontSize.sm, color: colors.textMuted },
  recentNotes: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 },

  // Full archive link
  fullArchiveLink: { marginTop: spacing.lg, paddingVertical: spacing.md, alignItems: 'center' },
  fullArchiveLinkText: { color: colors.accent, fontSize: fontSize.md, fontWeight: '600' },

  // History cards
  historyCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  historyArt: { width: 60, height: 60, borderRadius: borderRadius.md },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: fontSize.xs, color: colors.accent, marginBottom: spacing.xs },
  historySong: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  historyArtist: { fontSize: fontSize.sm, color: colors.textMuted },
  historyNotes: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
