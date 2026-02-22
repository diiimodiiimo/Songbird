// Report page - handles reporting from deep links
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../lib/theme';
import { api } from '../lib/api';
import { useAuthToken } from '../lib/auth';
import ReportModal from '../components/ReportModal';

export default function ReportPage() {
  const { type, username, entryId, commentId } = useLocalSearchParams<{
    type: 'user' | 'entry' | 'comment';
    username?: string;
    entryId?: string;
    commentId?: string;
  }>();
  const router = useRouter();
  const { getToken } = useAuthToken();

  const handleReport = async (reason: string, description?: string) => {
    const token = await getToken();
    if (!token) return;

    await api.reportContent(token, {
      type: type || 'user',
      reportedUserId: username,
      reportedEntryId: entryId,
      reportedCommentId: commentId,
      reason,
      description,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ReportModal
        visible={true}
        onClose={() => router.back()}
        type={type || 'user'}
        onReport={handleReport}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});


