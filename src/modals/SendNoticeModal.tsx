import { useState } from 'react'
import { useSendNotice } from '@/core/api/hooks/useNotices'
import { getErrorMessage } from '@/core/api/errors'
import type { NoticeType, NoticeChannel } from '@/core/api/types'

interface SendNoticeModalProps {
  tenantId: string
  tenantName: string
  onClose: () => void
  onSuccess: () => void
  initialType?: NoticeType
}

export function SendNoticeModal({
  tenantId,
  tenantName,
  onClose,
  onSuccess,
  initialType = 'general',
}: SendNoticeModalProps) {
  const [noticeType, setNoticeType] = useState<NoticeType>(initialType)
  const [message, setMessage] = useState('')
  const [channels, setChannels] = useState<NoticeChannel[]>(['in-app'])
  const [error, setError] = useState('')

  const sendNoticeMutation = useSendNotice()

  const toggleChannel = (channel: NoticeChannel) => {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!message.trim()) {
      setError('Message is required')
      return
    }

    if (channels.length === 0) {
      setError('Please select at least one delivery channel')
      return
    }

    try {
      await sendNoticeMutation.mutateAsync({
        tenantId,
        type: noticeType,
        message: message.trim(),
        channels,
      })
      onSuccess()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const defaultMessages: Record<NoticeType, string> = {
    payment_reminder: `Dear ${tenantName},\n\nThis is a reminder that your payment is due. Please ensure payment is made by the due date to avoid any service interruptions.\n\nThank you for your prompt attention to this matter.`,
    overdue: `Dear ${tenantName},\n\nYour payment is now overdue. Please make payment immediately to avoid further action. If you have already made payment, please contact us to update your account.\n\nThank you.`,
    general: `Dear ${tenantName},\n\nThis is a general notice regarding your account.\n\nThank you.`,
  }

  const handleTypeChange = (type: NoticeType) => {
    setNoticeType(type)
    if (!message || message === defaultMessages[noticeType]) {
      setMessage(defaultMessages[type])
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-panel border border-border-light rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border-light">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Send Notice to {tenantName}</h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-text transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-danger/10 text-danger rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Notice Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Notice Type</label>
            <select
              value={noticeType}
              onChange={(e) => handleTypeChange(e.target.value as NoticeType)}
              className="select w-full"
            >
              <option value="payment_reminder">Payment Reminder</option>
              <option value="overdue">Overdue Notice</option>
              <option value="general">General Notice</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={8}
              className="input w-full resize-none"
              required
            />
            <button
              type="button"
              onClick={() => setMessage(defaultMessages[noticeType])}
              className="mt-2 text-sm text-accent hover:text-accent-hover"
            >
              Use default message
            </button>
          </div>

          {/* Delivery Channels */}
          <div>
            <label className="block text-sm font-medium mb-2">Delivery Channels</label>
            <div className="space-y-2">
              {(['in-app', 'email', 'sms'] as NoticeChannel[]).map((channel) => (
                <label key={channel} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                    className="rounded border-border"
                  />
                  <span className="text-sm capitalize">
                    {channel === 'in-app' ? 'In-App Notification' : channel.toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
            {channels.length === 0 && (
              <p className="mt-2 text-sm text-danger">Please select at least one channel</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border-light">
            <button
              type="button"
              onClick={onClose}
              className="btn secondary"
              disabled={sendNoticeMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={sendNoticeMutation.isPending || channels.length === 0}
            >
              {sendNoticeMutation.isPending ? 'Sending...' : 'Send Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
