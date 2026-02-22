import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Switch,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, defaultBirdImage } from '../../lib/theme';
import { api, apiFetch, UserProfile, Friend } from '../../lib/api';
import { useAuth, useUser, useAuthToken } from '../../lib/auth';
import ThemeBird from '../../components/ThemeBird';

interface VibedSong {
  id: string;
  entry: {
    id: string;
    songTitle: string;
    artist: string;
    albumTitle: string;
    albumArt: string;
    date: string;
    trackId: string;
    user: {
      id: string;
      username: string | null;
      name: string | null;
      email: string;
      image: string | null;
    };
  };
}

export default function ProfileTab() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { getToken } = useAuthToken();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({ entries: 0, friends: 0, streak: 0, vibes: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Friends
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showFriendsSection, setShowFriendsSection] = useState(false);

  // Vibed songs
  const [vibedSongs, setVibedSongs] = useState<VibedSong[]>([]);
  const [showVibesSection, setShowVibesSection] = useState(false);
  const [loadingVibes, setLoadingVibes] = useState(false);

  // Favorite artists/songs
  const [favoriteArtists, setFavoriteArtists] = useState<string[]>([]);
  const [favoriteSongs, setFavoriteSongs] = useState<Array<{ songTitle: string; artist: string }>>([]);

  // Profile discoverability
  const [profileVisible, setProfileVisible] = useState(true);

  // Add Friend modal
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendUsernameInput, setFriendUsernameInput] = useState('');

  // Delete Account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Expandable settings sections
  const [showBirdsSection, setShowBirdsSection] = useState(false);
  const [showAccountInfo, setShowAccountInfo] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    try {
      const token = await getToken();
      if (!token) return;

      const data = await api.getProfile(token);
      setProfile(data.user);
      setFavoriteArtists(data.user.favoriteArtists || []);
      setFavoriteSongs(data.user.favoriteSongs || []);

      // Profile visibility from extended profile data
      try {
        const raw = await apiFetch<any>('/api/profile', { token });
        if (raw?.user?.profileVisible !== undefined) {
          setProfileVisible(raw.user.profileVisible !== false);
        }
      } catch (_) {}

      // Fetch friends
      try {
        const friendsData = await api.getFriends(token);
        const friendsList = friendsData.friends || [];
        setFriends(friendsList);
        setStats(prev => ({ ...prev, friends: friendsList.length }));
      } catch (_) {}

      // Fetch entry count and streak
      try {
        const analyticsData = await api.getAnalytics(token);
        setStats(prev => ({
          ...prev,
          entries: analyticsData.analytics?.totalEntries || 0,
          streak: analyticsData.analytics?.currentStreak || 0,
        }));
      } catch (_) {}

      // Fetch vibed songs
      try {
        setLoadingVibes(true);
        const vibesData = await apiFetch<{ vibes: VibedSong[] }>('/api/vibes', { token });
        const vibes = vibesData.vibes || [];
        setVibedSongs(vibes);
        setStats(prev => ({ ...prev, vibes: vibes.length }));
      } catch (_) {
      } finally {
        setLoadingVibes(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/home');
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm.');
      return;
    }

    setDeletingAccount(true);
    try {
      const token = await getToken();
      if (!token) return;
      await api.deleteAccount(token);
      await signOut();
      router.replace('/home');
    } catch (err) {
      Alert.alert('Error', 'Failed to delete account. Please try again.');
      setDeletingAccount(false);
    }
  };

  const handleToggleProfileVisible = async () => {
    const newVal = !profileVisible;
    setProfileVisible(newVal);
    try {
      const token = await getToken();
      if (!token) return;
      await api.updateProfile(token, { profileVisible: newVal } as any);
    } catch (_) {
      setProfileVisible(!newVal);
    }
  };

  const handleViewFriendProfile = (friend: Friend) => {
    const identifier = friend.username || friend.id;
    router.push(`/user/${encodeURIComponent(identifier)}` as any);
  };

  const handleViewTutorial = () => {
    router.push('/welcome?tutorial=true' as any);
  };

  const openSpotifyTrack = (trackId: string) => {
    Linking.openURL(`https://open.spotify.com/track/${trackId}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ThemeBird size={72} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = profile?.name || profile?.username || user?.fullName || 'User';
  const displayUsername = profile?.username || user?.username || '';
  const displayEmail = profile?.email || user?.emailAddresses?.[0]?.emailAddress || '';

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header with Edit button */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/edit-profile')}
          >
            <Ionicons name="create-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile header */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {profile?.image || user?.imageUrl ? (
              <Image
                source={{ uri: profile?.image || user?.imageUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(displayName[0] || '?').toUpperCase()}
                </Text>
              </View>
            )}

            {/* ThemeBird under avatar */}
            <View style={styles.themeBirdContainer}>
              <ThemeBird size={64} />
            </View>

            <Text style={styles.name}>{displayName}</Text>
            {displayUsername ? (
              <Text style={styles.username}>@{displayUsername}</Text>
            ) : null}
            {profile?.bio ? (
              <View style={styles.bioContainer}>
                <Text style={styles.bio}>{profile.bio}</Text>
              </View>
            ) : null}
          </View>

          {/* Stats - clickable */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.entries}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => setShowFriendsSection(!showFriendsSection)}
              activeOpacity={0.7}
            >
              <Text style={styles.statValue}>{stats.friends}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => setShowVibesSection(!showVibesSection)}
              activeOpacity={0.7}
            >
              <Text style={[styles.statValue, { color: '#f472b6' }]}>{stats.vibes}</Text>
              <Text style={styles.statLabel}>Vibes</Text>
            </TouchableOpacity>
          </View>

          {/* Vibed Songs (expandable) */}
          {showVibesSection && (
            <View style={styles.expandableSection}>
              <View style={styles.expandableHeader}>
                <Ionicons name="heart" size={18} color="#f472b6" />
                <Text style={[styles.expandableTitle, { color: '#f472b6' }]}>Songs You Vibed</Text>
              </View>
              {loadingVibes ? (
                <ActivityIndicator color={colors.accent} style={{ paddingVertical: spacing.lg }} />
              ) : vibedSongs.length === 0 ? (
                <Text style={styles.emptyText}>
                  No vibed songs yet. Visit the Feed to vibe to your friends' songs!
                </Text>
              ) : (
                <View style={styles.vibedList}>
                  {vibedSongs.map((vibe) => (
                    <TouchableOpacity
                      key={vibe.id}
                      style={styles.vibedItem}
                      onPress={() => vibe.entry.trackId && openSpotifyTrack(vibe.entry.trackId)}
                      activeOpacity={0.7}
                    >
                      {vibe.entry.albumArt ? (
                        <Image source={{ uri: vibe.entry.albumArt }} style={styles.vibedAlbumArt} />
                      ) : (
                        <View style={[styles.vibedAlbumArt, { backgroundColor: colors.surface }]}>
                          <Ionicons name="musical-note" size={20} color={colors.textMuted} />
                        </View>
                      )}
                      <View style={styles.vibedInfo}>
                        <Text style={styles.vibedTitle} numberOfLines={1}>{vibe.entry.songTitle}</Text>
                        <Text style={styles.vibedArtist} numberOfLines={1}>
                          {vibe.entry.artist} {'\u2022'} shared by {vibe.entry.user.username || vibe.entry.user.name || vibe.entry.user.email.split('@')[0]}
                        </Text>
                      </View>
                      <Ionicons name="musical-note" size={20} color="#1DB954" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowFriendsSection(!showFriendsSection)}
            >
              <Text style={styles.actionButtonText}>
                {showFriendsSection ? 'Hide Friends' : 'View Friends'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonSecondary}
              onPress={() => setShowAddFriendModal(true)}
            >
              <Text style={styles.actionButtonSecondaryText}>Add Friend</Text>
            </TouchableOpacity>
          </View>

          {/* Friends List (expandable) */}
          {showFriendsSection && (
            <View style={styles.expandableSection}>
              <View style={styles.expandableHeader}>
                <Ionicons name="people" size={18} color={colors.accent} />
                <Text style={styles.expandableTitle}>Friends</Text>
              </View>
              {friends.length === 0 ? (
                <View style={{ paddingVertical: spacing.lg }}>
                  <Text style={styles.emptyText}>No friends yet.</Text>
                  <Text style={[styles.emptyText, { marginTop: spacing.xs }]}>
                    Use "Add Friend" to find and connect with others!
                  </Text>
                </View>
              ) : (
                <View style={styles.friendsList}>
                  {friends.map((friend) => (
                    <TouchableOpacity
                      key={friend.id}
                      style={styles.friendItem}
                      onPress={() => handleViewFriendProfile(friend)}
                      activeOpacity={0.7}
                    >
                      {friend.image ? (
                        <Image source={{ uri: friend.image }} style={styles.friendAvatar} />
                      ) : (
                        <View style={styles.friendAvatarPlaceholder}>
                          <Text style={styles.friendAvatarText}>
                            {(friend.name || friend.email)[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName} numberOfLines={1}>
                          {friend.name || 'Friend'}
                        </Text>
                        {friend.username && (
                          <Text style={styles.friendUsername} numberOfLines={1}>
                            @{friend.username}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Favorite Artists */}
          {favoriteArtists.length > 0 && (
            <View style={styles.favSection}>
              <Text style={styles.favSectionTitle}>Favorite Artists</Text>
              <View style={styles.tagsContainer}>
                {favoriteArtists.map((artist) => (
                  <View key={artist} style={styles.tag}>
                    <Text style={styles.tagText}>{artist}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Favorite Songs */}
          {favoriteSongs.length > 0 && (
            <View style={styles.favSection}>
              <Text style={styles.favSectionTitle}>Favorite Songs</Text>
              <View style={styles.favSongsGrid}>
                {favoriteSongs.map((song) => (
                  <View key={`${song.songTitle}-${song.artist}`} style={styles.favSongCard}>
                    <Text style={styles.favSongTitle} numberOfLines={1}>{song.songTitle}</Text>
                    <Text style={styles.favSongArtist} numberOfLines={1}>{song.artist}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Invite code */}
        {profile?.inviteCode && (
          <View style={styles.inviteCard}>
            <Text style={styles.inviteTitle}>Your Invite Code</Text>
            <Text style={styles.inviteCode}>{profile.inviteCode}</Text>
            <Text style={styles.inviteHint}>Share this with friends to join SongBird</Text>
          </View>
        )}

        {/* Menu: Account */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Account</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/edit-profile')}>
            <Ionicons name="create-outline" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/theme-selector')}>
            <Ionicons name="color-palette-outline" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Change Bird Theme</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/premium')}>
            <Ionicons name="sparkles" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>SongBird Plus</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/wrapped')}>
            <Ionicons name="gift-outline" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Wrapped</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Menu: Music */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Music</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/archive')}>
            <Ionicons name="library-outline" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Full Archive</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/leaderboard')}>
            <Ionicons name="trophy-outline" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Leaderboard</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Menu: Social */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Social</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/friends')}>
            <Ionicons name="people-outline" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Friends</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Menu: Settings */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Settings</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notification-settings')}>
            <Ionicons name="settings-outline" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Notification Settings</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/blocked-users')}>
            <Ionicons name="ban-outline" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Blocked Users</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Profile Discoverability */}
          <View style={styles.menuItemSwitch}>
            <View style={styles.menuItemSwitchLeft}>
              <Ionicons name="eye-outline" size={20} color={colors.accent} style={styles.menuIcon} />
              <View>
                <Text style={styles.menuItemText}>Profile Discoverable</Text>
                <Text style={styles.menuItemHint}>
                  {profileVisible
                    ? 'Mutual friends can find you'
                    : 'Hidden from suggested users'}
                </Text>
              </View>
            </View>
            <Switch
              value={profileVisible}
              onValueChange={handleToggleProfileVisible}
              trackColor={{ false: colors.surface, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>

          {/* Account Information (expandable) */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowAccountInfo(!showAccountInfo)}
          >
            <Ionicons name="person-circle-outline" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Account Information</Text>
            <Ionicons name={showAccountInfo ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
          </TouchableOpacity>
          {showAccountInfo && (
            <View style={styles.accountInfoContainer}>
              <View style={styles.accountInfoRow}>
                <Text style={styles.accountInfoLabel}>Username</Text>
                <Text style={styles.accountInfoValue}>
                  {displayUsername || 'Not set'}
                </Text>
              </View>
              <View style={styles.accountInfoRow}>
                <Text style={styles.accountInfoLabel}>Email</Text>
                <Text style={styles.accountInfoValue}>{displayEmail}</Text>
              </View>
              <Text style={styles.accountInfoHint}>
                Edit your username in Edit Profile. Email cannot be changed.
              </Text>
            </View>
          )}

          {/* Tutorial */}
          <TouchableOpacity style={styles.menuItem} onPress={handleViewTutorial}>
            <Ionicons name="book-outline" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>View Tutorial</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Help & FAQ */}
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/help' as any)}>
            <Ionicons name="help-circle-outline" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Help & FAQ</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Menu: Legal */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Legal</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/terms')}>
            <Ionicons name="document-text-outline" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy')}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/refund' as any)}>
            <Ionicons name="card-outline" size={20} color={colors.accent} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Refund Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => setShowDeleteModal(true)}
        >
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>SongBird v1.0.0</Text>
          <Text style={styles.appInfoText}>Made with 💜</Text>
        </View>
      </ScrollView>

      {/* ───── Add Friend Modal ───── */}
      <Modal
        visible={showAddFriendModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddFriendModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Friend</Text>
            <Text style={styles.modalDescription}>
              Enter a username to view their profile
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter username"
              placeholderTextColor={colors.textMuted}
              value={friendUsernameInput}
              onChangeText={(text) => setFriendUsernameInput(text.replace('@', ''))}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={() => {
                if (friendUsernameInput.trim()) {
                  setShowAddFriendModal(false);
                  router.push(`/user/${friendUsernameInput.trim()}` as any);
                  setFriendUsernameInput('');
                }
              }}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionPrimary, !friendUsernameInput.trim() && styles.modalActionDisabled]}
                disabled={!friendUsernameInput.trim()}
                onPress={() => {
                  setShowAddFriendModal(false);
                  router.push(`/user/${friendUsernameInput.trim()}` as any);
                  setFriendUsernameInput('');
                }}
              >
                <Text style={styles.modalActionPrimaryText}>View Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalActionCancel}
                onPress={() => {
                  setShowAddFriendModal(false);
                  setFriendUsernameInput('');
                }}
              >
                <Text style={styles.modalActionCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ───── Delete Account Modal ───── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deletingAccount) {
            setShowDeleteModal(false);
            setDeleteConfirmText('');
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.deleteModalContent]}>
            <Text style={styles.deleteModalTitle}>Delete Account</Text>
            <Text style={styles.deleteModalBody}>
              This action cannot be undone. This will permanently delete your account and all associated data including:
            </Text>
            <View style={styles.deleteList}>
              <Text style={styles.deleteListItem}>{'\u2022'} All your song entries</Text>
              <Text style={styles.deleteListItem}>{'\u2022'} Your notes and memories</Text>
              <Text style={styles.deleteListItem}>{'\u2022'} Your friends and connections</Text>
              <Text style={styles.deleteListItem}>{'\u2022'} Your profile information</Text>
              <Text style={styles.deleteListItem}>{'\u2022'} All other data associated with your account</Text>
            </View>
            <Text style={styles.deleteConfirmLabel}>
              To confirm, type <Text style={styles.deleteKeyword}>DELETE</Text> below:
            </Text>
            <TextInput
              style={styles.deleteInput}
              placeholder="Type DELETE to confirm"
              placeholderTextColor={colors.textMuted}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.deleteConfirmButton,
                  (deleteConfirmText !== 'DELETE' || deletingAccount) && styles.modalActionDisabled,
                ]}
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.deleteConfirmButtonText}>
                  {deletingAccount ? 'Deleting...' : 'Permanently Delete'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalActionCancel}
                disabled={deletingAccount}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
              >
                <Text style={styles.modalActionCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  editButton: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Profile card
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.accent,
    marginBottom: spacing.sm,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent + '33',
    borderWidth: 3,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    color: colors.accent,
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
  },
  themeBirdContainer: {
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  username: {
    fontSize: fontSize.md,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  bioContainer: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    width: '100%',
  },
  bio: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.accent,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Expandable sections
  expandableSection: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  expandableTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Vibed songs
  vibedList: {
    gap: spacing.sm,
  },
  vibedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  vibedAlbumArt: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vibedInfo: {
    flex: 1,
  },
  vibedTitle: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  vibedArtist: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.accent + '1A',
    borderWidth: 1,
    borderColor: colors.accent + '4D',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  actionButtonSecondary: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  actionButtonSecondaryText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },

  // Friends list
  friendsList: {
    gap: spacing.sm,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  friendAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    color: colors.accent,
    fontWeight: 'bold',
    fontSize: fontSize.md,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  friendUsername: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Favorite artists / songs
  favSection: {
    marginBottom: spacing.md,
  },
  favSectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent + '1A',
    borderWidth: 1,
    borderColor: colors.accent + '4D',
    borderRadius: borderRadius.full,
  },
  tagText: {
    color: colors.accent,
    fontWeight: '500',
    fontSize: fontSize.sm,
  },
  favSongsGrid: {
    gap: spacing.sm,
  },
  favSongCard: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '33',
  },
  favSongTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  favSongArtist: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Invite card
  inviteCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  inviteTitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  inviteCode: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.accent,
    letterSpacing: 2,
  },
  inviteHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  // Menu sections
  menuSection: {
    marginBottom: spacing.xl,
  },
  menuTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  menuIcon: {
    marginRight: spacing.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  menuItemHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Switch menu item
  menuItemSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  menuItemSwitchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },

  // Account info expandable
  accountInfoContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    marginTop: -spacing.sm + 2,
  },
  accountInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  accountInfoLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textMuted,
  },
  accountInfoValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  accountInfoHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  // Sign out / Delete
  signOutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error + '1A',
    borderWidth: 1,
    borderColor: colors.error + '4D',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  signOutText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.error + '33',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  deleteText: {
    color: colors.error + 'AA',
    fontSize: fontSize.sm,
    fontWeight: '500',
  },

  // App info
  appInfo: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  appInfoText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },

  // Modal shared
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalActions: {
    gap: spacing.sm,
  },
  modalActionPrimary: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalActionPrimaryText: {
    color: colors.bg,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  modalActionCancel: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalActionCancelText: {
    color: colors.text,
    fontWeight: '500',
    fontSize: fontSize.md,
  },
  modalActionDisabled: {
    opacity: 0.5,
  },

  // Delete modal specifics
  deleteModalContent: {
    borderWidth: 1,
    borderColor: colors.error + '4D',
  },
  deleteModalTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: spacing.sm,
  },
  deleteModalBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  deleteList: {
    marginBottom: spacing.md,
    paddingLeft: spacing.sm,
  },
  deleteListItem: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  deleteConfirmLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  deleteKeyword: {
    color: colors.error,
    fontFamily: 'monospace',
  },
  deleteInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.error + '4D',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  deleteConfirmButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: fontSize.md,
  },
});
