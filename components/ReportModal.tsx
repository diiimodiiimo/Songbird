'use client'

import { useState } from 'react'
import ThemeBird from './ThemeBird'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'user' | 'entry' | 'comment'
  reportedUsername?: string
  reportedEntryId?: string
  reportedCommentId?: string
  onReport: (reason: string, description?: string) => Promise<void>
}

export default function ReportModal({
  isOpen,
  onClose,
  type,
  reportedUsername,
  reportedEntryId,
  reportedCommentId,
  onReport,
}: ReportModalProps) {
  const [reason, setReason] = useState<'harassment' | 'spam' | 'inappropriate' | 'other'>('harassment')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (loading) return
    setLoading(true)

    try {
      await onReport(reason, description || undefined)
      setSubmitted(true)
      setTimeout(() => {
        onClose()
        setSubmitted(false)
        setDescription('')
        setReason('harassment')
      }, 2000)
    } catch (error) {
      console.error('Error submitting report:', error)
    } finally {
      setLoading(false)
    }
  }

  const typeLabels = {
    user: 'user',
    entry: 'song entry',
    comment: 'comment',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl p-6 max-w-md w-full border border-accent/20">
        {submitted ? (
          <div className="text-center py-4">
            <div className="mb-4">
              <ThemeBird size={60} state="sing" />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">Report Submitted</h3>
            <p className="text-text/70">Thank you for helping keep SongBird safe.</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-text mb-4">Report {typeLabels[type]}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text/80 mb-2">
                  Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-4 py-2 bg-bg border border-text/20 rounded-lg text-text"
                >
                  <option value="harassment">Harassment or Bullying</option>
                  <option value="spam">Spam</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text/80 mb-2">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide any additional information..."
                  rows={4}
                  className="w-full px-4 py-2 bg-bg border border-text/20 rounded-lg text-text resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-bg border border-text/20 rounded-lg text-text hover:bg-surface/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}



