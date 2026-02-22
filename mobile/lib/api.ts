// API helper for mobile app
// Uses the same API endpoints as the web app

import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'https://songbird.vercel.app';

interface FetchOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ─── Type Definitions ───────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  username?: string;
  name?: string;
  email: string;
  image?: string;
  bio?: string;
  inviteCode?: string;
  onboardingCompletedAt?: string;
  gender?: string;
  favoriteArtists?: string[];
  favoriteSongs?: Array<{ songTitle: string; artist: string }>;
}

export interface Entry {
  id: string;
  date: string;
  songTitle: string;
  artist: string;
  albumTitle?: string;
  albumArt?: string;
  trackId?: string;
  notes?: string;
  vibes?: string[];
  mood?: string;
  people?: Array<{ id: string; name: string }>;
  mentionedUsers?: Array<{ id: string; name: string; email: string }>;
}

export interface FeedEntry extends Entry {
  user?: {
    id?: string;
    name?: string;
    username?: string;
    image?: string;
  };
  vibeCount?: number;
  commentCount?: number;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    username?: string;
    image?: string;
  };
}

export interface SuggestedUser {
  id: string;
  username: string;
  name?: string;
  image?: string;
  mutualFriends: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  uri: string;
  duration_ms: number;
  explicit: boolean;
  popularity: number;
  release_date?: string;
}

export interface Friend {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

export interface FriendRequest {
  id: string;
  status: string;
  sender: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
  receiver: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  relatedId: string | null;
  read: boolean;
  createdAt: string;
  relatedData: any;
}

export interface NotificationPreferences {
  notificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  reminderTime: number;
  reminderEnabled: boolean;
  notifyOnVibe: boolean;
  notifyOnComment: boolean;
  notifyOnMention: boolean;
  notifyOnFriendRequest: boolean;
  notifyOnFriendAccepted: boolean;
  notifyOnThisDay: boolean;
}

export interface LeaderboardData {
  topArtists: Array<{ artist: string; count: number }>;
  topSongs: Array<{ songTitle: string; artist: string; albumArt: string | null; count: number }>;
  stats: {
    totalUsers: number;
    totalEntries: number;
    timeFilter: string;
  };
}

export interface GlobalSOTD {
  songTitle: string;
  artist: string;
  albumTitle: string;
  albumArt: string | null;
  trackId: string;
  count: number;
  date: string;
  firstLoggedBy: {
    username: string | null;
    name: string | null;
  } | null;
}

export interface PublicProfile {
  username: string;
  name: string;
  email: string;
  image: string | null;
  bio: string | null;
  favoriteArtists: string[];
  favoriteSongs: Array<{ songTitle: string; artist: string }>;
  stats: {
    totalEntries: number;
    friendsCount: number;
  };
}

export interface FriendshipStatus {
  isOwnProfile: boolean;
  isFriend: boolean;
  hasPendingRequest: boolean;
  requestDirection: 'sent' | 'received' | null;
  requestId?: string;
}

export interface BlockedUser {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  blockedAt: string;
}

export interface Milestone {
  type: string;
  headline: string;
  body: string;
  icon: string;
  reward?: {
    icon: string;
    text: string;
  };
}

export interface BirdStatus {
  birdId: string;
  isUnlocked: boolean;
  progress?: {
    current: number;
    required: number;
    percentage: number;
    label: string;
  };
  unlockCondition?: string;
}

export interface SubscriptionInfo {
  isPremium: boolean;
  isFoundingMember: boolean;
  stripeCustomerId: string | null;
  subscriptionTier: string | null;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export const api = {
  // ── Profile ──────────────────────────────────────────────────────────────
  getProfile: (token: string) =>
    apiFetch<{ user: UserProfile }>('/api/profile', { token }),

  updateProfile: (token: string, data: Partial<UserProfile>) =>
    apiFetch<{ user: UserProfile }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  // ── Username ─────────────────────────────────────────────────────────────
  checkUsername: (username: string) =>
    apiFetch<{ available: boolean }>(`/api/username/check?username=${encodeURIComponent(username)}`),

  // ── Entries ──────────────────────────────────────────────────────────────
  getEntries: (token: string, page = 1, pageSize = 20) =>
    apiFetch<{ entries: Entry[]; total: number }>(`/api/entries?page=${page}&pageSize=${pageSize}`, { token }),

  getTodayEntry: (token: string) =>
    apiFetch<{ entry: Entry | null }>('/api/today-data', { token }),

  createEntry: (token: string, data: Partial<Entry>) =>
    apiFetch<{ entry: Entry; milestone?: Milestone }>('/api/entries', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  updateEntry: (token: string, id: string, data: Partial<Entry>) =>
    apiFetch<{ entry: Entry }>(`/api/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  deleteEntry: (token: string, id: string) =>
    apiFetch(`/api/entries/${id}`, { method: 'DELETE', token }),

  // ── Songs ────────────────────────────────────────────────────────────────
  searchSongs: (query: string) =>
    apiFetch<{ tracks: SpotifyTrack[] }>(`/api/songs/search?q=${encodeURIComponent(query)}`),

  // ── Feed ─────────────────────────────────────────────────────────────────
  getFeed: (token: string, page = 1) =>
    apiFetch<{ entries: FeedEntry[]; hasMore: boolean }>(`/api/feed?page=${page}`, { token }),

  // ── On This Day ──────────────────────────────────────────────────────────
  getOnThisDay: (token: string, date?: string) =>
    apiFetch<{ memories: Entry[] }>(`/api/on-this-day${date ? `?date=${date}` : ''}`, { token }),

  // ── Streak ───────────────────────────────────────────────────────────────
  getStreak: (token: string) =>
    apiFetch<{ currentStreak: number; longestStreak: number }>('/api/streak', { token }),

  // ── Analytics ────────────────────────────────────────────────────────────
  getAnalytics: (token: string, year?: number) =>
    apiFetch<{ analytics: any }>(`/api/analytics${year ? `?year=${year}` : ''}`, { token }),

  trackEvent: (token: string, event: string, data?: any) =>
    apiFetch('/api/analytics/event', {
      method: 'POST',
      body: JSON.stringify({ event, ...data }),
      token,
    }),

  // ── Onboarding ───────────────────────────────────────────────────────────
  completeOnboarding: (token: string) =>
    apiFetch('/api/onboarding/complete', { method: 'POST', token }),

  // ── Friends ──────────────────────────────────────────────────────────────
  getFriends: (token: string) =>
    apiFetch<{ friends: Friend[] }>('/api/friends/list', { token }),

  getFriendRequests: (token: string) =>
    apiFetch<{ requests: FriendRequest[] }>('/api/friends/requests?type=all', { token }),

  sendFriendRequest: (token: string, receiverUsername: string) =>
    apiFetch<{ request: FriendRequest }>('/api/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ receiverUsername }),
      token,
    }),

  respondToFriendRequest: (token: string, requestId: string, action: 'accept' | 'decline') =>
    apiFetch(`/api/friends/requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ action }),
      token,
    }),

  getFriendsToday: (token: string) =>
    apiFetch<{ friends: any[] }>('/api/friends/today', { token }),

  // ── Notifications ────────────────────────────────────────────────────────
  getNotifications: (token: string, unreadOnly = false) =>
    apiFetch<{ notifications: Notification[] }>(`/api/notifications?unreadOnly=${unreadOnly}`, { token }),

  markNotificationsRead: (token: string, notificationIds: string[]) =>
    apiFetch('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ notificationIds }),
      token,
    }),

  getNotificationPreferences: (token: string) =>
    apiFetch<{ preferences: NotificationPreferences }>('/api/notifications/preferences', { token }),

  updateNotificationPreferences: (token: string, data: Partial<NotificationPreferences>) =>
    apiFetch('/api/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  // ── Push Notifications ───────────────────────────────────────────────────
  subscribePush: (token: string, pushToken: string) =>
    apiFetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ pushToken, platform: 'expo' }),
      token,
    }),

  // ── Vibes ────────────────────────────────────────────────────────────────
  addVibe: (token: string, entryId: string, emoji: string) =>
    apiFetch('/api/vibes', {
      method: 'POST',
      body: JSON.stringify({ entryId, emoji }),
      token,
    }),

  // ── Comments ─────────────────────────────────────────────────────────────
  getComments: (token: string, entryId: string) =>
    apiFetch<{ comments: Comment[] }>(`/api/comments?entryId=${entryId}`, { token }),

  addComment: (token: string, entryId: string, text: string) =>
    apiFetch<{ comment: Comment }>('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ entryId, text }),
      token,
    }),

  // ── Invites ──────────────────────────────────────────────────────────────
  getInviteInfo: (token: string) =>
    apiFetch<{ personalCode: string; inviteUrl: string }>('/api/invites', { token }),

  validateInvite: (code: string) =>
    apiFetch<{ valid: boolean; invite?: any }>(`/api/invites/validate?code=${code}`),

  acceptInvite: (token: string, code: string) =>
    apiFetch('/api/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ code }),
      token,
    }),

  // ── User Profiles (public) ───────────────────────────────────────────────
  getUserProfile: (token: string, username: string) =>
    apiFetch<PublicProfile>(`/api/users/${encodeURIComponent(username)}`, { token }),

  getFriendshipStatus: (token: string, username: string) =>
    apiFetch<FriendshipStatus>(`/api/users/${encodeURIComponent(username)}/friendship`, { token }),

  searchUsers: (token: string, query: string) =>
    apiFetch<{ users: SuggestedUser[] }>(`/api/users/search?q=${encodeURIComponent(query)}`, { token }),

  getSuggestedUsers: (token: string, limit = 20) =>
    apiFetch<{ users: SuggestedUser[] }>(`/api/users/suggested?limit=${limit}`, { token }),

  // ── Block / Report ───────────────────────────────────────────────────────
  blockUser: (token: string, userId: string) =>
    apiFetch('/api/users/block', {
      method: 'POST',
      body: JSON.stringify({ blockedUserId: userId }),
      token,
    }),

  unblockUser: (token: string, userId: string) =>
    apiFetch('/api/users/block', {
      method: 'DELETE',
      body: JSON.stringify({ blockedUserId: userId }),
      token,
    }),

  getBlockedUsers: (token: string) =>
    apiFetch<{ blockedUsers: BlockedUser[] }>('/api/users/block', { token }),

  reportContent: (token: string, data: {
    type: 'user' | 'entry' | 'comment';
    reportedUserId?: string;
    reportedEntryId?: string;
    reportedCommentId?: string;
    reason: string;
    description?: string;
  }) =>
    apiFetch('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  // ── Leaderboard ──────────────────────────────────────────────────────────
  getLeaderboard: (timeFilter: 'all' | 'year' | 'month' | 'week' = 'all') =>
    apiFetch<LeaderboardData>(`/api/leaderboard?time=${timeFilter}`),

  getGlobalSOTD: () =>
    apiFetch<{ globalSOTD: GlobalSOTD | null }>('/api/global-sotd'),

  // ── Milestones ───────────────────────────────────────────────────────────
  getMilestones: (token: string) =>
    apiFetch<{ milestones: Milestone[] }>('/api/milestones', { token }),

  // ── Birds / Aviary ───────────────────────────────────────────────────────
  getBirds: (token: string) =>
    apiFetch<{ birds: any[] }>('/api/birds', { token }),

  getBirdStatuses: (token: string) =>
    apiFetch<{ birds: BirdStatus[] }>('/api/birds/status', { token }),

  getAviary: (token: string) =>
    apiFetch<{ aviary: any }>('/api/aviary', { token }),

  // ── Subscription / Premium ───────────────────────────────────────────────
  getSubscription: (token: string) =>
    apiFetch<SubscriptionInfo>('/api/user/subscription', { token }),

  getUserUsage: (token: string) =>
    apiFetch<{ usage: any }>('/api/user/usage', { token }),

  // ── Account ──────────────────────────────────────────────────────────────
  deleteAccount: (token: string) =>
    apiFetch('/api/user/delete', { method: 'DELETE', token }),

  // ── Mentions ─────────────────────────────────────────────────────────────
  getMentions: (token: string) =>
    apiFetch<{ mentions: any[] }>('/api/mentions', { token }),

  // ── Song Associations ────────────────────────────────────────────────────
  getSongAssociations: (token: string) =>
    apiFetch<{ associations: any[] }>('/api/song-associations', { token }),

  // ── Artist Search (for images) ───────────────────────────────────────────
  searchArtists: (name: string) =>
    apiFetch<{ image: string | null }>(`/api/artists/search?name=${encodeURIComponent(name)}`),
};
