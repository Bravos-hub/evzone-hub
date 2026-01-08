interface DocumentPreviewModalProps {
    document: {
        id: string
        name: string
        size: string
        date: string
        category: string
        content?: string
    }
    onClose: () => void
    onDownload: () => void
}

export function DocumentPreviewModal({ document, onClose, onDownload }: DocumentPreviewModalProps) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
            <div className="bg-panel border border-border-light rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col scale-in">
                <div className="p-5 sm:p-6 border-b border-border-light flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Document Preview</h2>
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

                <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="flex items-start gap-4 p-4 bg-muted/5 rounded-xl border border-border-light">
                        <div className="p-3 bg-accent/10 text-accent rounded-xl">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{document.name}</h3>
                            <p className="text-sm text-muted">{document.category} • {document.size} • Uploaded on {document.date}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs uppercase font-black tracking-widest text-muted">Document Content Preview</h4>
                        <div className="p-6 bg-surface border border-border-light rounded-2xl min-h-[300px] shadow-inner font-serif text-sm leading-relaxed text-text whitespace-pre-wrap">
                            {document.content || `[Simulated Content Preview]

MEMORANDUM OF UNDERSTANDING

This Agreement is made on this ${document.date} between the Site Owner and ${document.id}.

1. PURPOSE & SCOPE
The purpose of this document is to outline the shared goals and responsibilities regarding the electric vehicle charging infrastructure at City Mall Roof.

2. TERMS OF COOPERATION
The parties agree to participate in a revenue-share model as defined in the main Lease Agreement...

[End of Preview]`}
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-6 border-t border-border-light flex-shrink-0 mt-auto">
                    <div className="flex gap-3 justify-end">
                        <button onClick={onClose} className="btn secondary">
                            Close
                        </button>
                        <button
                            onClick={() => {
                                onDownload()
                                onClose()
                            }}
                            className="btn flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download File
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
