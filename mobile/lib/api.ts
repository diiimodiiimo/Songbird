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

// Typed API functions

export interface UserProfile {
  id: string;
  username?: string;
  name?: string;
  email: string;
  image?: string;
  bio?: string;
  inviteCode?: string;
  onboardingCompletedAt?: string;
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

export const api = {
  // Profile
  getProfile: (token: string) =>
    apiFetch<{ user: UserProfile }>('/api/profile', { token }),

  updateProfile: (token: string, data: Partial<UserProfile>) =>
    apiFetch<{ user: UserProfile }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  // Username
  checkUsername: (username: string) =>
    apiFetch<{ available: boolean }>(`/api/username/check?username=${encodeURIComponent(username)}`),

  // Entries
  getEntries: (token: string, page = 1, pageSize = 20) =>
    apiFetch<{ entries: Entry[]; total: number }>(`/api/entries?page=${page}&pageSize=${pageSize}`, { token }),

  getTodayEntry: (token: string) =>
    apiFetch<{ entry: Entry | null }>('/api/today-data', { token }),

  createEntry: (token: string, data: Partial<Entry>) =>
    apiFetch<{ entry: Entry }>('/api/entries', {
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

  // Songs
  searchSongs: (query: string) =>
    apiFetch<{ tracks: SpotifyTrack[] }>(`/api/songs/search?q=${encodeURIComponent(query)}`),

  // Feed
  getFeed: (token: string, page = 1) =>
    apiFetch<{ entries: Entry[]; hasMore: boolean }>(`/api/feed?page=${page}`, { token }),

  // On This Day
  getOnThisDay: (token: string) =>
    apiFetch<{ memories: Entry[] }>('/api/on-this-day', { token }),

  // Analytics
  getAnalytics: (token: string, year?: number) =>
    apiFetch<{ analytics: any }>(`/api/analytics${year ? `?year=${year}` : ''}`, { token }),

  trackEvent: (token: string, event: string, data?: any) =>
    apiFetch('/api/analytics/event', {
      method: 'POST',
      body: JSON.stringify({ event, ...data }),
      token,
    }),

  // Onboarding
  completeOnboarding: (token: string) =>
    apiFetch('/api/onboarding/complete', { method: 'POST', token }),

  // Friends
  getFriends: (token: string) =>
    apiFetch<{ friends: any[] }>('/api/friends/list', { token }),

  getFriendRequests: (token: string) =>
    apiFetch<{ received: any[]; sent: any[] }>('/api/friends/requests', { token }),

  // Notifications
  getNotifications: (token: string) =>
    apiFetch<{ notifications: any[] }>('/api/notifications', { token }),

  // Vibes
  addVibe: (token: string, entryId: string, emoji: string) =>
    apiFetch('/api/vibes', {
      method: 'POST',
      body: JSON.stringify({ entryId, emoji }),
      token,
    }),

  // Invites
  validateInvite: (code: string) =>
    apiFetch<{ valid: boolean; invite?: any }>(`/api/invites/validate?code=${code}`),

  acceptInvite: (token: string, code: string) =>
    apiFetch('/api/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ code }),
      token,
    }),
};

