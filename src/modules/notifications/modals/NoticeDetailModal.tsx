import { Notice } from '@/core/api/types'

interface NoticeDetailModalProps {
    notice: Notice
    onClose: () => void
}

export function NoticeDetailModal({ notice, onClose }: NoticeDetailModalProps) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
            <div className="bg-panel border border-border-light rounded-2xl shadow-2xl w-full max-w-xl max-h-full overflow-hidden flex flex-col scale-in">
                <div className="p-5 sm:p-6 border-b border-border-light flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Notice Detail</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted/50 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                    <div className="flex justify-between items-start">
                        <span className={`text-[10px] uppercase font-black px-2 py-1 rounded ${notice.type === 'overdue' ? 'bg-rose-100 text-rose-700' :
                                notice.type === 'payment_reminder' ? 'bg-amber-100 text-amber-700' :
                                    'bg-blue-100 text-blue-700'
                            }`}>
                            {notice.type.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-muted">
                            {notice.sentAt ? new Date(notice.sentAt).toLocaleString() : new Date(notice.createdAt).toLocaleString()}
                        </span>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-lg font-bold">Subject: {notice.type.charAt(0).toUpperCase() + notice.type.slice(1).replace('_', ' ')}</h3>
                        <p className="text-sm text-muted">Sent to: <span className="text-text font-medium">{notice.tenantName}</span></p>
                    </div>

                    <div className="p-4 bg-muted/20 border border-border rounded-xl">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-text">
                            {notice.message}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-xs uppercase font-black tracking-widest text-muted">Delivery Channels</h4>
                        <div className="flex gap-2">
                            {notice.channels.map(channel => (
                                <span key={channel} className="text-[10px] font-bold px-2 py-0.5 bg-accent/10 text-accent rounded-full border border-accent/20">
                                    {channel.toUpperCase()}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted">
                        <span className={`w-2 h-2 rounded-full ${notice.status === 'sent' ? 'bg-success' : notice.status === 'pending' ? 'bg-amber-500' : 'bg-danger'}`} />
                        Status: <span className="font-medium text-text capitalize">{notice.status}</span>
                    </div>
                </div>

                <div className="p-5 sm:p-6 border-t border-border-light flex-shrink-0 mt-auto">
                    <button
                        onClick={onClose}
                        className="btn secondary w-full sm:w-auto float-right"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
