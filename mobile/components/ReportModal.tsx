// Report Modal (matches web ReportModal.tsx)
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, fontSize, spacing, borderRadius } from '../lib/theme';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'user' | 'entry' | 'comment';
  onReport: (reason: string, description?: string) => Promise<void>;
}

const REASONS = [
  { key: 'harassment', label: 'Harassment or Bullying' },
  { key: 'spam', label: 'Spam' },
  { key: 'inappropriate', label: 'Inappropriate Content' },
  { key: 'other', label: 'Other' },
];

const TYPE_LABELS: Record<string, string> = {
  user: 'user',
  entry: 'song entry',
  comment: 'comment',
};

export default function ReportModal({ visible, onClose, type, onReport }: ReportModalProps) {
  const [reason, setReason] = useState('harassment');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onReport(reason, description || undefined);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setDescription('');
        setReason('harassment');
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {submitted ? (
            <View style={styles.successContainer}>
              <Text style={styles.successEmoji}>✅</Text>
              <Text style={styles.successTitle}>Report Submitted</Text>
              <Text style={styles.successText}>Thank you for helping keep SongBird safe.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Report {TYPE_LABELS[type]}</Text>

              {/* Reason Selection */}
              <Text style={styles.label}>Reason</Text>
              {REASONS.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.reasonOption, reason === r.key && styles.reasonActive]}
                  onPress={() => setReason(r.key)}
                >
                  <View style={[styles.radio, reason === r.key && styles.radioActive]} />
                  <Text style={[styles.reasonText, reason === r.key && styles.reasonTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Description */}
              <Text style={styles.label}>Additional Details (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Please provide any additional information..."
                placeholderTextColor={colors.textMuted + '80'}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.disabledBtn]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit Report</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing.lg },
  container: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, padding: spacing.xl },
  title: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.sm, marginTop: spacing.md },
  reasonOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.xs },
  reasonActive: { backgroundColor: colors.accent + '15' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.textMuted },
  radioActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  reasonText: { fontSize: fontSize.md, color: colors.text },
  reasonTextActive: { color: colors.accent, fontWeight: '500' },
  textInput: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, color: colors.text, fontSize: fontSize.md, minHeight: 100 },
  buttonRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { color: colors.text, fontSize: fontSize.md, fontWeight: '500' },
  submitBtn: { flex: 1, backgroundColor: colors.error, borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  submitBtnText: { color: 'white', fontSize: fontSize.md, fontWeight: '600' },
  disabledBtn: { opacity: 0.5 },
  successContainer: { alignItems: 'center', paddingVertical: spacing.xl },
  successEmoji: { fontSize: 60, marginBottom: spacing.md },
  successTitle: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  successText: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
});


