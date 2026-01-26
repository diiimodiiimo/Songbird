// Profile Tab - User profile and settings (matches web ProfileTab.tsx)
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fontSize, spacing, borderRadius } from '../../lib/theme';
import { api, UserProfile } from '../../lib/api';
import { useAuth, useUser, useAuthToken } from '../../lib/auth';

export default function ProfileTab() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { getToken } = useAuthToken();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({ entries: 0, friends: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    try {
      const token = await getToken();
      if (!token) return;

      const data = await api.getProfile(token);
      setProfile(data.user);

      // Fetch friends count
      try {
        const friendsData = await api.getFriends(token);
        setStats(prev => ({ ...prev, friends: friendsData.friends?.length || 0 }));
      } catch (err) {
        console.log('Could not fetch friends');
      }

      // Fetch entry count and streak
      try {
        const entriesData = await api.getEntries(token, 1, 1);
        const analyticsData = await api.getAnalytics(token);
        setStats(prev => ({
          ...prev,
          entries: analyticsData.analytics?.totalEntries || entriesData.total || 0,
          streak: analyticsData.analytics?.currentStreak || 0,
        }));
      } catch (err) {
        console.log('Could not fetch stats');
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
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/home');
          },
        },
      ]
    );
  };

  const handleViewTutorial = () => {
    router.push('/welcome?tutorial=true');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Profile header */}
        <View style={styles.profileHeader}>
          {profile?.image || user?.imageUrl ? (
            <Image
              source={{ uri: profile?.image || user?.imageUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(profile?.name?.[0] || profile?.username?.[0] || user?.firstName?.[0] || '?').toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.name}>
            {profile?.name || user?.fullName || 'User'}
          </Text>
          {profile?.username && (
            <Text style={styles.username}>@{profile.username}</Text>
          )}
          {profile?.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.entries}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.friends}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        {/* Invite code */}
        {profile?.inviteCode && (
          <View style={styles.inviteCard}>
            <Text style={styles.inviteTitle}>Your Invite Code</Text>
            <Text style={styles.inviteCode}>{profile.inviteCode}</Text>
            <Text style={styles.inviteHint}>Share this with friends to join SongBird</Text>
          </View>
        )}

        {/* Menu options */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Settings</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleViewTutorial}>
            <Text style={styles.menuItemIcon}>📖</Text>
            <Text style={styles.menuItemText}>View Tutorial</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemIcon}>🎨</Text>
            <Text style={styles.menuItemText}>Change Theme</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemIcon}>🔔</Text>
            <Text style={styles.menuItemText}>Notifications</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemIcon}>🔒</Text>
            <Text style={styles.menuItemText}>Privacy</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>SongBird v1.0.0</Text>
          <Text style={styles.appInfoText}>Made with 💜</Text>
        </View>
      </ScrollView>
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
  content: {
    padding: spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent + '33',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    color: colors.accent,
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
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
  bio: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
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
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
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
  menuItemIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  menuItemArrow: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  signOutButton: {
    backgroundColor: colors.error + '1A',
    borderWidth: 1,
    borderColor: colors.error + '4D',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  signOutText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  appInfoText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
