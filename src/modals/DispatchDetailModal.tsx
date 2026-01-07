import { useState } from 'react'
import { useAuthStore } from '@/core/auth/authStore'

type DispatchStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled'
type Priority = 'Critical' | 'High' | 'Normal' | 'Low'

interface DispatchDetail {
  id: string
  title: string
  description: string
  status: DispatchStatus
  priority: Priority
  stationId: string
  stationName: string
  stationAddress: string
  stationChargers: number
  ownerName: string
  ownerContact: string
  assignee: string
  assigneeContact: string
  createdAt: string
  createdBy: string
  dueAt: string
  estimatedDuration: string
  incidentId?: string
  requiredSkills: string[]
  notes?: string
}

interface DispatchDetailModalProps {
  isOpen: boolean
  onClose: () => void
  dispatch: DispatchDetail | null
  onStatusChange?: (dispatchId: string, newStatus: DispatchStatus, notes?: string) => void
  onContactOwner?: (dispatchId: string) => void
}

export function DispatchDetailModal({ isOpen, onClose, dispatch, onStatusChange, onContactOwner }: DispatchDetailModalProps) {
  const { user } = useAuthStore()
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [showContactForm, setShowContactForm] = useState(false)
  const [message, setMessage] = useState('')

  if (!isOpen || !dispatch) return null

  const isTechnician = ['TECHNICIAN_ORG', 'TECHNICIAN_PUBLIC'].includes(user?.role ?? '')
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isAdmin = ['EVZONE_ADMIN', 'EVZONE_OPERATOR'].includes(user?.role ?? '')
  const isOwner = ['OWNER', 'STATION_ADMIN', 'MANAGER'].includes(user?.role ?? '')

  const canAccept = isTechnician && dispatch.status === 'Assigned'
  const canReject = isTechnician && dispatch.status === 'Assigned'
  const canStart = isTechnician && dispatch.status === 'Assigned'
  const canComplete = isTechnician && dispatch.status === 'In Progress'
  const canCancel = (isSuperAdmin || isAdmin || isOwner) && ['Pending', 'Assigned'].includes(dispatch.status)

  const handleAccept = () => {
    if (onStatusChange) {
      onStatusChange(dispatch.id, 'In Progress', 'Accepted and started working on the dispatch')
      onClose()
    }
  }

  const handleReject = () => {
    setShowNotes(true)
  }

  const handleRejectConfirm = () => {
    if (!notes) {
      alert('Please provide a reason for rejection')
      return
    }
    if (onStatusChange) {
      onStatusChange(dispatch.id, 'Cancelled', `Rejected by technician: ${notes}`)
      onClose()
    }
  }

  const handleComplete = () => {
    setShowNotes(true)
  }

  const handleCompleteConfirm = () => {
    if (onStatusChange) {
      onStatusChange(dispatch.id, 'Completed', notes || 'Dispatch completed successfully')
      onClose()
    }
  }

  const handleContactOwner = () => {
    setShowContactForm(true)
  }

  const handleSendMessage = () => {
    if (!message) {
      alert('Please enter a message')
      return
    }
    console.log('Sending message to owner:', message)
    alert(`Message sent to ${dispatch.ownerName}`)
    setShowContactForm(false)
    setMessage('')
  }

  const priorityColor = (p: Priority) => {
    switch (p) {
      case 'Critical': return 'bg-danger text-white'
      case 'High': return 'bg-warn text-white'
      case 'Normal': return 'bg-muted/30 text-muted'
      case 'Low': return 'bg-muted/20 text-muted'
    }
  }

  const statusColor = (s: DispatchStatus) => {
    switch (s) {
      case 'Pending': return 'pending'
      case 'Assigned': return 'sendback'
      case 'In Progress': return 'bg-accent/20 text-accent'
      case 'Completed': return 'approved'
      case 'Cancelled': return 'rejected'
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-white/10 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-bg-secondary border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-white">{dispatch.id}</h2>
            <p className="text-sm text-muted">{dispatch.title}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Status & Priority */}
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-muted mb-1">Status</div>
              <span className={`pill ${statusColor(dispatch.status)}`}>{dispatch.status}</span>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Priority</div>
              <span className={`pill ${priorityColor(dispatch.priority)}`}>{dispatch.priority}</span>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs text-muted">Due Date</div>
              <div className="text-sm font-semibold text-text">{dispatch.dueAt}</div>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-lg bg-panel border border-border-light">
            <div className="text-sm font-semibold text-text mb-2">Issue Description</div>
            <p className="text-text-secondary">{dispatch.description}</p>
          </div>

          {/* Station Information */}
          <div>
            <div className="text-sm font-semibold text-text mb-3">Station Information</div>
            <div className="p-4 rounded-lg bg-panel border border-border-light space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-text">{dispatch.stationName}</div>
                  <div className="text-sm text-muted">{dispatch.stationId}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">Chargers</div>
                  <div className="text-sm font-semibold text-text">{dispatch.stationChargers} units</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-text-secondary">{dispatch.stationAddress}</span>
              </div>

              <div className="pt-3 border-t border-border-light">
                <div className="text-xs text-muted mb-2">Station Owner</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-text">{dispatch.ownerName}</div>
                    <a href={`tel:${dispatch.ownerContact}`} className="text-sm text-accent hover:underline">
                      {dispatch.ownerContact}
                    </a>
                  </div>
                  {isTechnician && (
                    <button
                      onClick={handleContactOwner}
                      className="btn secondary text-sm"
                    >
                      Contact Owner
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Required Skills */}
          {dispatch.requiredSkills.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-text mb-2">Required Skills</div>
              <div className="flex flex-wrap gap-2">
                {dispatch.requiredSkills.map(skill => (
                  <span key={skill} className="px-3 py-1 rounded-full text-sm bg-accent/20 text-accent font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assignment Details */}
          <div>
            <div className="text-sm font-semibold text-text mb-3">Assignment Details</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-panel border border-border-light">
                <div className="text-xs text-muted mb-1">Assigned To</div>
                <div className="font-semibold text-text">{dispatch.assignee}</div>
                {dispatch.assigneeContact && (
                  <a href={`tel:${dispatch.assigneeContact}`} className="text-sm text-accent hover:underline">
                    {dispatch.assigneeContact}
                  </a>
                )}
              </div>
              <div className="p-3 rounded-lg bg-panel border border-border-light">
                <div className="text-xs text-muted mb-1">Estimated Duration</div>
                <div className="font-semibold text-text">{dispatch.estimatedDuration}</div>
              </div>
              <div className="p-3 rounded-lg bg-panel border border-border-light">
                <div className="text-xs text-muted mb-1">Created By</div>
                <div className="font-semibold text-text">{dispatch.createdBy}</div>
                <div className="text-sm text-muted">{dispatch.createdAt}</div>
              </div>
              {dispatch.incidentId && (
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                  <div className="text-xs text-muted mb-1">Linked Incident</div>
                  <div className="font-semibold text-accent">{dispatch.incidentId}</div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Form (for technicians) */}
          {showContactForm && (
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 space-y-3">
              <div className="text-sm font-semibold text-text">Send Message to Station Owner</div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="input w-full min-h-[100px]"
              />
              <div className="flex items-center gap-2">
                <button onClick={handleSendMessage} className="btn" style={{ background: '#F77F00', color: 'white' }}>
                  Send Message
                </button>
                <button onClick={() => setShowContactForm(false)} className="btn secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Notes Input (for completion/rejection) */}
          {showNotes && (
            <div className="p-4 rounded-lg bg-panel border border-border-light space-y-3">
              <div className="text-sm font-semibold text-text">
                {dispatch.status === 'In Progress' ? 'Completion Notes' : 'Rejection Reason'}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                className="input w-full min-h-[100px]"
              />
              <div className="flex items-center gap-2">
                {dispatch.status === 'In Progress' ? (
                  <button onClick={handleCompleteConfirm} className="btn" style={{ background: '#03cd8c', color: 'white' }}>
                    Mark as Completed
                  </button>
                ) : (
                  <button onClick={handleRejectConfirm} className="btn" style={{ background: '#dc3545', color: 'white' }}>
                    Confirm Rejection
                  </button>
                )}
                <button onClick={() => setShowNotes(false)} className="btn secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-bg-secondary border-t border-white/10 px-6 py-4 flex items-center justify-end gap-3">
          {canAccept && (
            <button onClick={handleAccept} className="btn" style={{ background: '#03cd8c', color: 'white' }}>
              Accept & Start
            </button>
          )}
          {canReject && (
            <button onClick={handleReject} className="btn" style={{ background: '#dc3545', color: 'white' }}>
              Reject
            </button>
          )}
          {canComplete && !showNotes && (
            <button onClick={handleComplete} className="btn" style={{ background: '#03cd8c', color: 'white' }}>
              Complete
            </button>
          )}
          {canCancel && (
            <button 
              onClick={() => onStatusChange && onStatusChange(dispatch.id, 'Cancelled', 'Cancelled by administrator')} 
              className="btn" 
              style={{ background: '#dc3545', color: 'white' }}
            >
              Cancel Dispatch
            </button>
          )}
          <button onClick={onClose} className="btn secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

