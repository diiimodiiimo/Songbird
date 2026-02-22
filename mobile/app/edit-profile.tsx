// Profile Editing screen
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';
import { api, UserProfile } from '../lib/api';
import { useAuth, useAuthToken } from '../lib/auth';

export default function EditProfileScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getToken } = useAuthToken();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getProfile(token);
      setProfile(data.user);
      setName(data.user.name || '');
      setUsername(data.user.username || '');
      setBio(data.user.bio || '');
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const checkUsername = async (u: string) => {
    if (!u.trim() || u === profile?.username) {
      setUsernameAvailable(null);
      return;
    }
    try {
      const data = await api.checkUsername(u);
      setUsernameAvailable(data.available);
    } catch (err) {
      setUsernameAvailable(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = await getToken();
      if (!token) return;

      const updates: Partial<UserProfile> = {};
      if (name !== profile?.name) updates.name = name;
      if (username !== profile?.username) {
        if (usernameAvailable === false) {
          setMessage({ type: 'error', text: 'Username is taken' });
          setSaving(false);
          return;
        }
        updates.username = username;
      }
      if (bio !== profile?.bio) updates.bio = bio;

      await api.updateProfile(token, updates);
      setMessage({ type: 'success', text: 'Profile updated!' });
      await fetchProfile();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      // Note: Uploading base64 image to backend
      try {
        const token = await getToken();
        if (!token) return;
        await api.updateProfile(token, {
          image: `data:image/jpeg;base64,${result.assets[0].base64}`,
        });
        await fetchProfile();
        setMessage({ type: 'success', text: 'Photo updated!' });
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to update photo' });
      }
    }
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
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Message */}
        {message && (
          <View style={[styles.messageContainer, message.type === 'error' && styles.errorMessage]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        {/* Avatar */}
        <TouchableOpacity style={styles.avatarSection} onPress={pickImage}>
          {profile?.image ? (
            <Image source={{ uri: profile.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={colors.textMuted} />
            </View>
          )}
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted + '80'}
          />
        </View>

        {/* Username */}
        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <View style={styles.usernameRow}>
            <Text style={styles.atSign}>@</Text>
            <TextInput
              style={[styles.input, styles.usernameInput]}
              value={username}
              onChangeText={(v) => {
                const clean = v.toLowerCase().replace(/[^a-z0-9_]/g, '');
                setUsername(clean);
                checkUsername(clean);
              }}
              placeholder="username"
              placeholderTextColor={colors.textMuted + '80'}
              autoCapitalize="none"
            />
            {usernameAvailable !== null && (
              <Ionicons
                name={usernameAvailable ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={usernameAvailable ? colors.success : colors.error}
              />
            )}
          </View>
        </View>

        {/* Bio */}
        <View style={styles.field}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people about yourself..."
            placeholderTextColor={colors.textMuted + '80'}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={200}
          />
          <Text style={styles.charCount}>{bio.length}/200</Text>
        </View>

        {/* Delete Account */}
        <TouchableOpacity
          style={styles.dangerSection}
          onPress={() => {
            Alert.alert(
              'Delete Account',
              'Are you sure? This action is irreversible and will permanently delete all your data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const token = await getToken();
                      if (!token) return;
                      await api.deleteAccount(token);
                      router.replace('/home');
                    } catch (err) {
                      Alert.alert('Error', 'Failed to delete account');
                    }
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={styles.dangerText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  title: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text },
  saveText: { color: colors.accent, fontSize: fontSize.md, fontWeight: '600' },
  messageContainer: { padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.success + '1A', marginBottom: spacing.md },
  errorMessage: { backgroundColor: colors.error + '1A' },
  messageText: { color: colors.text, fontSize: fontSize.sm, textAlign: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  changePhotoText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '500', marginTop: spacing.sm },
  field: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.xs, fontWeight: '500' },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.md, color: colors.text, fontSize: fontSize.md },
  usernameRow: { flexDirection: 'row', alignItems: 'center' },
  atSign: { color: colors.accent, fontSize: fontSize.lg, fontWeight: '600', marginRight: spacing.xs },
  usernameInput: { flex: 1 },
  bioInput: { minHeight: 80, paddingTop: spacing.md },
  charCount: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },
  dangerSection: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xxl },
  dangerText: { color: colors.error, fontSize: fontSize.md },
});


