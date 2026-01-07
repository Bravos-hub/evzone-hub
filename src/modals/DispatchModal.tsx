import { useState, useEffect } from 'react'
import { useAuthStore } from '@/core/auth/authStore'

type Priority = 'Critical' | 'High' | 'Normal' | 'Low'
type TechnicianType = 'org' | 'public'

interface Technician {
  id: string
  name: string
  type: TechnicianType
  skills: string[]
  rating: number
  available: boolean
  phone: string
}

interface Station {
  id: string
  name: string
  address: string
  chargers: number
  ownerContact: string
}

interface DispatchModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dispatch: DispatchFormData) => void
  mode: 'create' | 'assign'
  dispatchId?: string
  stationId?: string
  incidentId?: string
}

export interface DispatchFormData {
  title: string
  description: string
  priority: Priority
  stationId: string
  technicianId: string
  dueDate: string
  dueTime: string
  incidentId?: string
  estimatedDuration: string
  requiredSkills: string[]
}

// Mock data
const MOCK_STATIONS: Station[] = [
  { id: 'ST-0001', name: 'Kampala CBD Hub', address: 'Plot 12, Kampala Road', chargers: 8, ownerContact: '+256 700 123 456' },
  { id: 'ST-0002', name: 'Entebbe Airport Lot', address: 'Entebbe International Airport', chargers: 12, ownerContact: '+256 700 234 567' },
  { id: 'ST-0017', name: 'Gulu Main Street', address: 'Churchill Drive, Gulu', chargers: 6, ownerContact: '+256 700 345 678' },
]

const MOCK_TECHNICIANS: Technician[] = [
  { id: 'TECH-001', name: 'Allan Tech', type: 'org', skills: ['OCPP', 'Electrical', 'Firmware'], rating: 4.8, available: true, phone: '+256 701 111 111' },
  { id: 'TECH-002', name: 'Betty Maina', type: 'org', skills: ['HVAC', 'Mechanical'], rating: 4.6, available: true, phone: '+256 701 222 222' },
  { id: 'TECH-003', name: 'Charles Okello', type: 'public', skills: ['OCPP', 'Networking', 'Firmware'], rating: 4.9, available: true, phone: '+256 701 333 333' },
  { id: 'TECH-004', name: 'Diana Nakato', type: 'public', skills: ['Battery', 'Swap Station', 'Electrical'], rating: 4.7, available: false, phone: '+256 701 444 444' },
  { id: 'TECH-005', name: 'Emmanuel Ssali', type: 'public', skills: ['OCPP', 'Electrical', 'HVAC'], rating: 4.5, available: true, phone: '+256 701 555 555' },
]

const SKILLS_LIST = ['OCPP', 'Electrical', 'Firmware', 'HVAC', 'Mechanical', 'Networking', 'Battery', 'Swap Station']

export function DispatchModal({ isOpen, onClose, onSubmit, mode, dispatchId, stationId: initialStationId, incidentId }: DispatchModalProps) {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isOwner = ['OWNER', 'STATION_ADMIN', 'MANAGER'].includes(user?.role ?? '')
  const isAdmin = ['EVZONE_ADMIN', 'EVZONE_OPERATOR'].includes(user?.role ?? '')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('Normal')
  const [stationId, setStationId] = useState(initialStationId || '')
  const [technicianId, setTechnicianId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [estimatedDuration, setEstimatedDuration] = useState('2')
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [showTechnicianType, setShowTechnicianType] = useState<'org' | 'public' | 'all'>('org')
  
  const selectedStation = MOCK_STATIONS.find(s => s.id === stationId)
  const selectedTechnician = MOCK_TECHNICIANS.find(t => t.id === technicianId)

  // Filter technicians based on role and selection
  const availableTechnicians = MOCK_TECHNICIANS.filter(tech => {
    if (isSuperAdmin) return true
    if (isAdmin) return tech.type === 'public' // Admin can only assign public
    if (isOwner) {
      if (showTechnicianType === 'org') return tech.type === 'org'
      if (showTechnicianType === 'public') return tech.type === 'public'
      return true
    }
    return false
  }).filter(tech => {
    // Filter by required skills if any selected
    if (requiredSkills.length === 0) return true
    return requiredSkills.some(skill => tech.skills.includes(skill))
  })

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setTitle('')
      setDescription('')
      setPriority('Normal')
      setStationId(initialStationId || '')
      setTechnicianId('')
      setDueDate('')
      setDueTime('')
      setEstimatedDuration('2')
      setRequiredSkills([])
      setShowTechnicianType('org')
    }
  }, [isOpen, initialStationId])

  const toggleSkill = (skill: string) => {
    setRequiredSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !stationId || !technicianId || !dueDate || !dueTime) {
      alert('Please fill in all required fields')
      return
    }

    onSubmit({
      title,
      description,
      priority,
      stationId,
      technicianId,
      dueDate,
      dueTime,
      incidentId,
      estimatedDuration: `${estimatedDuration}h`,
      requiredSkills,
    })

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-white/10 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-bg-secondary border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {mode === 'create' ? 'Create New Dispatch' : 'Assign Technician'}
            </h2>
            <button type="button" onClick={onClose} className="text-muted hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Connector replacement - Bay 3"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Description <span className="text-danger">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue and what needs to be done..."
                  className="input w-full min-h-[100px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Priority <span className="text-danger">*</span>
                  </label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="select w-full">
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Normal">Normal</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Estimated Duration <span className="text-danger">*</span>
                  </label>
                  <select value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)} className="select w-full">
                    <option value="1">1 hour</option>
                    <option value="2">2 hours</option>
                    <option value="4">4 hours</option>
                    <option value="8">8 hours (Full day)</option>
                    <option value="16">2 days</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Station Selection */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                Station <span className="text-danger">*</span>
              </label>
              <select 
                value={stationId} 
                onChange={(e) => setStationId(e.target.value)} 
                className="select w-full"
                required
              >
                <option value="">Select a station</option>
                {MOCK_STATIONS.map(station => (
                  <option key={station.id} value={station.id}>
                    {station.name} ({station.id}) - {station.chargers} chargers
                  </option>
                ))}
              </select>
              
              {selectedStation && (
                <div className="mt-3 p-4 rounded-lg bg-panel border border-border-light">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted">Address:</span>
                      <span className="text-text">{selectedStation.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted">Chargers:</span>
                      <span className="text-text">{selectedStation.chargers} units</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted">Owner Contact:</span>
                      <a href={`tel:${selectedStation.ownerContact}`} className="text-accent hover:underline">
                        {selectedStation.ownerContact}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                Required Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILLS_LIST.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      requiredSkills.includes(skill)
                        ? 'bg-accent text-white'
                        : 'bg-panel text-text-secondary hover:bg-panel-2'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Technician Type Selection (Only for Owners) */}
            {isOwner && (
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Technician Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTechnicianType('org')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      showTechnicianType === 'org'
                        ? 'bg-accent text-white'
                        : 'bg-panel text-text-secondary hover:bg-panel-2'
                    }`}
                  >
                    My Technicians
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTechnicianType('public')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      showTechnicianType === 'public'
                        ? 'bg-accent text-white'
                        : 'bg-panel text-text-secondary hover:bg-panel-2'
                    }`}
                  >
                    Public Technicians
                  </button>
                </div>
              </div>
            )}

            {/* Technician Selection */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                Assign to Technician <span className="text-danger">*</span>
              </label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {availableTechnicians.length === 0 ? (
                  <div className="text-center py-8 text-muted">
                    No technicians available with the selected criteria
                  </div>
                ) : (
                  availableTechnicians.map(tech => (
                    <label
                      key={tech.id}
                      className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        technicianId === tech.id
                          ? 'border-accent bg-accent/10'
                          : 'border-border-light bg-panel hover:border-accent/50'
                      } ${!tech.available ? 'opacity-50' : ''}`}
                    >
                      <input
                        type="radio"
                        name="technician"
                        value={tech.id}
                        checked={technicianId === tech.id}
                        onChange={(e) => setTechnicianId(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text">{tech.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              tech.type === 'org' ? 'bg-accent/20 text-accent' : 'bg-muted/20 text-muted'
                            }`}>
                              {tech.type === 'org' ? 'Organization' : 'Public'}
                            </span>
                            {!tech.available && (
                              <span className="text-xs px-2 py-0.5 rounded bg-danger/20 text-danger">Busy</span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-sm">
                            <span className="text-accent">★</span>
                            <span className="text-text">{tech.rating.toFixed(1)}</span>
                            <span className="text-muted mx-2">•</span>
                            <a href={`tel:${tech.phone}`} className="text-accent hover:underline" onClick={(e) => e.stopPropagation()}>
                              {tech.phone}
                            </a>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {tech.skills.map(skill => (
                              <span key={skill} className="text-xs px-2 py-1 rounded bg-panel-2 text-text-secondary">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Due Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Due Time <span className="text-danger">*</span>
                </label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>
            </div>

            {incidentId && (
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                <div className="text-sm">
                  <span className="text-muted">Linked to Incident:</span>
                  <span className="ml-2 font-semibold text-accent">{incidentId}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-bg-secondary border-t border-white/10 px-6 py-4 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn secondary">
              Cancel
            </button>
            <button type="submit" className="btn" style={{ background: '#F77F00', color: 'white' }}>
              {mode === 'create' ? 'Create Dispatch' : 'Assign Technician'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

