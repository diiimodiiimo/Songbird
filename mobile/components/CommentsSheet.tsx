// Comments bottom sheet component for feed entries
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';
import { api, Comment } from '../lib/api';
import { useAuthToken } from '../lib/auth';

interface CommentsSheetProps {
  visible: boolean;
  onClose: () => void;
  entryId: string;
}

export default function CommentsSheet({ visible, onClose, entryId }: CommentsSheetProps) {
  const { getToken } = useAuthToken();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!entryId) return;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getComments(token, entryId);
      setComments(data.comments || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }, [entryId, getToken]);

  useEffect(() => {
    if (visible && entryId) {
      setLoading(true);
      fetchComments();
    }
  }, [visible, entryId, fetchComments]);

  const postComment = async () => {
    if (!newComment.trim() || posting) return;
    setPosting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await api.addComment(token, entryId, newComment.trim());
      setNewComment('');
      await fetchComments();
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setPosting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Comments list */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No comments yet. Be the first! 💬</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.commentCard}>
                  {item.user?.image ? (
                    <Image source={{ uri: item.user.image }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {(item.user?.name?.[0] || '?').toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUser}>
                        {item.user?.username ? `@${item.user.username}` : item.user?.name || 'Unknown'}
                      </Text>
                      <Text style={styles.commentTime}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
            />
          )}

          {/* Comment input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textMuted + '80'}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!newComment.trim() || posting) && styles.disabledBtn]}
              onPress={postComment}
              disabled={!newComment.trim() || posting}
            >
              {posting ? (
                <ActivityIndicator size="small" color={colors.bg} />
              ) : (
                <Ionicons name="send" size={18} color={colors.bg} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, maxHeight: '70%' },
  handleRow: { alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.xs },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '40' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  loadingContainer: { padding: spacing.xxl, alignItems: 'center' },
  listContent: { padding: spacing.lg },
  emptyContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
  commentCard: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent + '33', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '600' },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  commentUser: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  commentTime: { fontSize: fontSize.xs, color: colors.textMuted },
  commentText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20, marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  input: { flex: 1, backgroundColor: colors.bg, borderRadius: borderRadius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, color: colors.text, fontSize: fontSize.md, maxHeight: 100 },
  sendBtn: { backgroundColor: colors.accent, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  disabledBtn: { opacity: 0.5 },
});


