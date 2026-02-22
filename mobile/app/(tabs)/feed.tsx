import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  TouchableOpacity,
  Share,
  Linking,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import { api, FeedEntry } from '../../lib/api';
import { useAuth, useAuthToken, useUser } from '../../lib/auth';
import ThemeBird from '../../components/ThemeBird';
import CommentsSheet from '../../components/CommentsSheet';
import ReportModal from '../../components/ReportModal';
import InviteFriendsCTA from '../../components/InviteFriendsCTA';

interface ExtendedFeedEntry extends FeedEntry {
  isOwnEntry?: boolean;
  hasVibed?: boolean;
  trackId?: string;
  mentions?: Array<{
    id: string;
    user: {
      id: string;
      name?: string | null;
      username?: string | null;
      image?: string | null;
    };
  }>;
  recentComments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name?: string | null;
      username?: string | null;
      image?: string | null;
    };
  }>;
}

const VIBE_EMOJIS = ['💜', '🔥', '😍', '🎶', '💪', '😭'];

export default function FeedTab() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { getToken } = useAuthToken();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [entries, setEntries] = useState<ExtendedFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [commentsEntryId, setCommentsEntryId] = useState<string | null>(null);
  const [reportEntryId, setReportEntryId] = useState<string | null>(null);
  const [vibePickerEntryId, setVibePickerEntryId] = useState<string | null>(null);
  const [vibingEntryId, setVibingEntryId] = useState<string | null>(null);

  const [seenEntryIds, setSeenEntryIds] = useState<Set<string>>(new Set());
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [friendsWhoLoggedToday, setFriendsWhoLoggedToday] = useState(0);
  const [newPostCount, setNewPostCount] = useState(0);
  const [showJumpToTop, setShowJumpToTop] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const fetchFeed = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (!isLoaded || !isSignedIn) return;

    if (pageNum > 1) setLoadingMore(true);

    try {
      const token = await getToken();
      if (!token) return;

      const data = await api.getFeed(token, pageNum);
      const fetched = (data.entries || []) as ExtendedFeedEntry[];

      const currentUserId = user?.id;
      const enriched = fetched.map(e => ({
        ...e,
        isOwnEntry: e.isOwnEntry ?? (currentUserId ? e.user?.id === currentUserId : false),
      }));

      if (pageNum === 1) {
        setEntries(enriched);
        const ids = new Set(enriched.map(e => e.id));
        setSeenEntryIds(ids);

        const today = new Date().toISOString().split('T')[0];
        const userLogged = enriched.some(e => e.isOwnEntry && e.date?.startsWith(today));
        setHasLoggedToday(userLogged);

        const friendsToday = enriched.filter(e => !e.isOwnEntry && e.date?.startsWith(today)).length;
        setFriendsWhoLoggedToday(friendsToday);
      } else {
        setEntries(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const unique = enriched.filter(e => !existingIds.has(e.id));
          return [...prev, ...unique];
        });
      }

      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [isLoaded, isSignedIn, getToken, user?.id]);

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  useEffect(() => {
    const unread = entries.filter(e => !seenEntryIds.has(e.id) && !e.isOwnEntry).length;
    setNewPostCount(unread);
  }, [entries, seenEntryIds]);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    setPage(1);
    await fetchFeed(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage);
    }
  };

  const handleVibe = async (entryId: string, emoji: string) => {
    if (vibingEntryId) return;
    setVibingEntryId(entryId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const token = await getToken();
      if (!token) return;

      await api.addVibe(token, entryId, emoji);

      setEntries(prev =>
        prev.map(e =>
          e.id === entryId
            ? {
                ...e,
                vibeCount: (e.vibeCount || 0) + 1,
                hasVibed: true,
              }
            : e
        )
      );
      setVibePickerEntryId(null);
    } catch (error) {
      console.error('Error adding vibe:', error);
    } finally {
      setVibingEntryId(null);
    }
  };

  const handleReport = async (reason: string, description?: string) => {
    if (!reportEntryId) return;
    const token = await getToken();
    if (!token) return;
    await api.reportContent(token, {
      type: 'entry',
      reportedEntryId: reportEntryId,
      reason,
      description,
    });
  };

  const handleShare = async (item: ExtendedFeedEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const userName = item.user?.name || item.user?.username || 'Someone';
    const spotifyUrl = item.trackId
      ? `https://open.spotify.com/track/${item.trackId}`
      : '';

    try {
      await Share.share({
        message: `🐦 ${userName}'s Song of the Day: "${item.songTitle}" by ${item.artist}${spotifyUrl ? `\n\nListen: ${spotifyUrl}` : ''}\n\nShared from SongBird`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const openSpotify = (trackId?: string) => {
    if (!trackId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://open.spotify.com/track/${trackId}`);
  };

  const openAppleMusic = (songTitle: string, artist: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const query = encodeURIComponent(`${songTitle} ${artist}`);
    Linking.openURL(`https://music.apple.com/us/search?term=${query}`);
  };

  const jumpToTop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const markEntrySeen = (entryId: string) => {
    setSeenEntryIds(prev => {
      if (prev.has(entryId)) return prev;
      return new Set([...Array.from(prev), entryId]);
    });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    viewableItems.forEach((item: any) => {
      if (item.item?.id) {
        markEntrySeen(item.item.id);
      }
    });
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const onScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowJumpToTop(offsetY > 400);
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderUrgencyBanner = () => {
    if (hasLoggedToday || friendsWhoLoggedToday === 0) return null;

    return (
      <View style={styles.urgencyBanner}>
        <View style={styles.urgencyContent}>
          <ThemeBird size={32} />
          <Text style={styles.urgencyText}>
            {friendsWhoLoggedToday} {friendsWhoLoggedToday === 1 ? 'friend' : 'friends'} posted today. Log your song to join!
          </Text>
        </View>
        <TouchableOpacity
          style={styles.urgencyButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.urgencyButtonText}>Log Song</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderNewPostsBanner = () => {
    if (newPostCount === 0) return null;

    return (
      <View style={styles.newPostsBanner}>
        <Text style={styles.newPostsText}>
          {newPostCount} new {newPostCount === 1 ? 'post' : 'posts'}
        </Text>
        <TouchableOpacity onPress={jumpToTop}>
          <Text style={styles.jumpToTopText}>Jump to top</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({ item }: { item: ExtendedFeedEntry }) => {
    const isOwn = item.isOwnEntry;
    const isUnread = !seenEntryIds.has(item.id) && !isOwn;
    const mentions = item.mentions || [];
    const people = item.people || [];
    const recentComments = item.recentComments || [];

    return (
      <View
        style={[
          styles.feedCard,
          isOwn && styles.feedCardOwn,
          isUnread && styles.feedCardUnread,
        ]}
      >
        {/* User header */}
        <TouchableOpacity
          style={[styles.userHeader, isOwn && styles.userHeaderOwn]}
          onPress={() => item.user?.username && router.push(`/user/${item.user.username}`)}
          activeOpacity={0.7}
        >
          <View style={styles.userHeaderLeft}>
            {item.user?.image ? (
              <Image
                source={{ uri: item.user.image }}
                style={[styles.userAvatar, isOwn && styles.userAvatarOwn]}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, isOwn && styles.avatarPlaceholderOwn]}>
                <Text style={styles.avatarText}>
                  {(item.user?.name?.[0] || item.user?.username?.[0] || '?').toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {isOwn ? 'You' : (item.user?.name || item.user?.username || 'Unknown')}
                </Text>
                {isOwn && (
                  <View style={styles.yourPostBadge}>
                    <Text style={styles.yourPostText}>Your post</Text>
                  </View>
                )}
                {isUnread && (
                  <Animated.View style={[styles.unreadDot, { opacity: pulseAnim }]} />
                )}
              </View>
              <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setReportEntryId(item.id);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.moreButtonText}>•••</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Song content */}
        <View style={styles.songRow}>
          {item.albumArt && (
            <Image source={{ uri: item.albumArt }} style={styles.albumArt} />
          )}
          <View style={styles.songInfo}>
            <Text style={styles.songTitle} numberOfLines={1}>{item.songTitle}</Text>
            <Text style={styles.songArtist} numberOfLines={1}>by {item.artist}</Text>
            {item.mood && (
              <View style={styles.feedMoodBadge}>
                <Text style={styles.feedMoodText}>{item.mood}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {item.notes && (
          <Text style={styles.notes} numberOfLines={3}>{item.notes}</Text>
        )}

        {/* People tags */}
        {people.length > 0 && (
          <View style={styles.peopleRow}>
            <Text style={styles.peopleLabel}>👥 with</Text>
            <View style={styles.peopleTags}>
              {people.map(person => (
                <View key={person.id} style={styles.personTag}>
                  <Text style={styles.personTagText}>{person.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mentions */}
        {mentions.length > 0 && (
          <View style={styles.mentionsSection}>
            <View style={styles.mentionsHeader}>
              <Text style={styles.mentionsIcon}>📣</Text>
              <Text style={styles.mentionsLabel}>
                {isOwn ? 'You mentioned' : `${item.user?.username || item.user?.name || 'Someone'} mentioned`}
              </Text>
            </View>
            <View style={styles.mentionsTags}>
              {mentions.map(mention => (
                <TouchableOpacity
                  key={mention.id}
                  style={styles.mentionTag}
                  onPress={() => mention.user.username && router.push(`/user/${mention.user.username}`)}
                >
                  {mention.user.image ? (
                    <Image source={{ uri: mention.user.image }} style={styles.mentionAvatar} />
                  ) : (
                    <View style={styles.mentionAvatarPlaceholder}>
                      <Text style={styles.mentionAvatarText}>
                        {(mention.user.username || mention.user.name || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.mentionName}>
                    @{mention.user.username || mention.user.name || 'user'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Vibe picker (expanded) */}
        {vibePickerEntryId === item.id && (
          <View style={styles.vibePickerRow}>
            {VIBE_EMOJIS.map(emoji => (
              <TouchableOpacity
                key={emoji}
                onPress={() => handleVibe(item.id, emoji)}
                disabled={vibingEntryId === item.id}
              >
                <Text style={styles.vibeEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Actions row */}
        <View style={styles.actionsRow}>
          <View style={styles.actionsLeft}>
            {/* Vibe button */}
            <TouchableOpacity
              style={[styles.actionButton, item.hasVibed && styles.actionButtonActive]}
              onPress={() => setVibePickerEntryId(vibePickerEntryId === item.id ? null : item.id)}
              onLongPress={() => handleVibe(item.id, '💜')}
              disabled={vibingEntryId === item.id}
            >
              <Text style={styles.actionIcon}>{item.hasVibed ? '❤️' : '💜'}</Text>
              <Text style={[styles.actionCount, item.hasVibed && styles.actionCountActive]}>
                {item.vibeCount || 0}
              </Text>
            </TouchableOpacity>

            {/* Comment button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCommentsEntryId(item.id);
              }}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionCount}>{item.commentCount || 0}</Text>
            </TouchableOpacity>

            {/* Share button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(item)}
            >
              <Text style={styles.actionIcon}>📤</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRight}>
            {/* Spotify button */}
            {item.trackId && (
              <TouchableOpacity
                style={styles.spotifyButton}
                onPress={() => openSpotify(item.trackId)}
              >
                <Text style={styles.spotifyButtonText}>Spotify</Text>
              </TouchableOpacity>
            )}
            {/* Apple Music button */}
            <TouchableOpacity
              style={styles.appleMusicButton}
              onPress={() => openAppleMusic(item.songTitle, item.artist)}
            >
              <Text style={styles.appleMusicButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline recent comments (last 2) */}
        {recentComments.length > 0 && (
          <View style={styles.inlineComments}>
            {recentComments.slice(0, 2).map(comment => (
              <View key={comment.id} style={styles.inlineComment}>
                <Text style={styles.inlineCommentAuthor}>
                  {comment.user.username || comment.user.name || 'user'}
                </Text>
                <Text style={styles.inlineCommentText} numberOfLines={2}>
                  {comment.content}
                </Text>
              </View>
            ))}
            {(item.commentCount || 0) > 2 && (
              <TouchableOpacity onPress={() => setCommentsEntryId(item.id)}>
                <Text style={styles.viewAllComments}>
                  View all {item.commentCount} comments
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoading}>
          <ThemeBird size={40} />
          <Text style={styles.footerLoadingText}>Loading more...</Text>
        </View>
      );
    }
    if (!hasMore && entries.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <Text style={styles.footerEndText}>You've reached the end of your feed</Text>
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ThemeBird size={72} />
          <Text style={styles.loadingText}>Gathering the flock...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <InviteFriendsCTA />
          <View style={styles.emptyFooter}>
            <Text style={styles.emptyFooterOr}>or</Text>
            <TouchableOpacity
              style={styles.findFriendsButton}
              onPress={() => router.push('/(tabs)/friends')}
            >
              <Text style={styles.findFriendsText}>Find friends by username</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={entries}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View>
                {renderUrgencyBanner()}
                {renderNewPostsBanner()}
              </View>
            }
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onScroll={onScroll}
            scrollEventThrottle={100}
          />

          {/* Floating "Jump to top" button */}
          {showJumpToTop && newPostCount > 0 && (
            <TouchableOpacity style={styles.jumpToTopButton} onPress={jumpToTop}>
              <Text style={styles.jumpToTopButtonIcon}>↑</Text>
              <Text style={styles.jumpToTopButtonText}>
                {newPostCount} new
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <CommentsSheet
        visible={!!commentsEntryId}
        onClose={() => {
          setCommentsEntryId(null);
          onRefresh();
        }}
        entryId={commentsEntryId || ''}
      />

      <ReportModal
        visible={!!reportEntryId}
        onClose={() => setReportEntryId(null)}
        type="entry"
        onReport={handleReport}
      />
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
    gap: spacing.md,
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

  // ── Urgency banner ──────────────────────────────────────────────────────
  urgencyBanner: {
    backgroundColor: colors.accent + '33',
    borderWidth: 1,
    borderColor: colors.accent + '66',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  urgencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  urgencyText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  urgencyButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  urgencyButtonText: {
    color: colors.bg,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // ── New posts banner ────────────────────────────────────────────────────
  newPostsBanner: {
    backgroundColor: colors.surface + 'CC',
    borderWidth: 1,
    borderColor: colors.accent + '4D',
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newPostsText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  jumpToTopText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '500',
  },

  // ── Empty state ─────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  emptyFooter: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyFooterOr: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  findFriendsButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  findFriendsText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },

  // ── Feed card ───────────────────────────────────────────────────────────
  feedCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  feedCardOwn: {
    borderColor: colors.accent + '66',
  },
  feedCardUnread: {
    borderColor: colors.accent + '4D',
  },

  // ── User header ─────────────────────────────────────────────────────────
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.accent + '1A',
    borderBottomWidth: 1,
    borderBottomColor: colors.accent + '33',
  },
  userHeaderOwn: {
    backgroundColor: colors.accent + '33',
    borderBottomColor: colors.accent + '4D',
  },
  userHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  userAvatarOwn: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent + '4D',
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderOwn: {
    backgroundColor: colors.accent + '4D',
    borderColor: colors.accent,
  },
  avatarText: {
    color: colors.accent,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  userInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.accent,
  },
  yourPostBadge: {
    backgroundColor: colors.accent + '4D',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  yourPostText: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  entryDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  moreButton: {
    padding: spacing.xs,
  },
  moreButtonText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    letterSpacing: 2,
  },

  // ── Song content ────────────────────────────────────────────────────────
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  albumArt: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
  },
  songInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  songTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  songArtist: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  feedMoodBadge: {
    backgroundColor: colors.accent + '1A',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  feedMoodText: {
    color: colors.accent,
    fontSize: fontSize.xs,
  },
  notes: {
    fontSize: fontSize.sm,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    fontStyle: 'italic',
    opacity: 0.85,
  },

  // ── People tags ─────────────────────────────────────────────────────────
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  peopleLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  peopleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  personTag: {
    backgroundColor: colors.accent + '1A',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  personTagText: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },

  // ── Mentions ────────────────────────────────────────────────────────────
  mentionsSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  mentionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  mentionsIcon: {
    fontSize: fontSize.md,
  },
  mentionsLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  mentionsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  mentionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent + '26',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  mentionAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  mentionAvatarPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent + '4D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentionAvatarText: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '700',
  },
  mentionName: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },

  // ── Vibe picker ─────────────────────────────────────────────────────────
  vibePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.bg,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  vibeEmoji: {
    fontSize: 28,
  },

  // ── Actions row ─────────────────────────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  actionButtonActive: {
    opacity: 1,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  actionCountActive: {
    color: '#FF6B8A',
  },
  spotifyButton: {
    backgroundColor: '#1DB95433',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.lg,
  },
  spotifyButtonText: {
    color: '#1DB954',
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  appleMusicButton: {
    backgroundColor: '#FC3C4433',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.lg,
  },
  appleMusicButtonText: {
    color: '#FC3C44',
    fontSize: fontSize.xs,
    fontWeight: '600',
  },

  // ── Inline comments ─────────────────────────────────────────────────────
  inlineComments: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  inlineComment: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  inlineCommentAuthor: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.accent,
  },
  inlineCommentText: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
    opacity: 0.8,
  },
  viewAllComments: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  // ── Footer / loading more ──────────────────────────────────────────────
  footerLoading: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  footerLoadingText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  footerEnd: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerEndText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    opacity: 0.6,
  },

  // ── Floating jump-to-top button ────────────────────────────────────────
  jumpToTopButton: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  jumpToTopButtonIcon: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  jumpToTopButtonText: {
    color: colors.bg,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
