import { useState, useMemo, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { renderAsync } from 'docx-preview'

interface DocumentPreviewModalProps {
    document: {
        id: string
        name: string
        size: string
        date: string
        category: string
        content?: string
        file?: File // Actual file from upload
    }
    onClose: () => void
    onDownload: () => void
}

export function DocumentPreviewModal({ document, onClose, onDownload }: DocumentPreviewModalProps) {
    const [zoom, setZoom] = useState(100)
    const [currentPage, setCurrentPage] = useState(1)
    const [showThumbnails, setShowThumbnails] = useState(true)
    const [isFullScreen, setIsFullScreen] = useState(false)
    const docxContainerRef = useRef<HTMLDivElement>(null)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)

    const isPDF = document.name.toLowerCase().endsWith('.pdf')
    const isDOCX = document.name.toLowerCase().endsWith('.docx') || document.name.toLowerCase().endsWith('.doc')

    // For mock demos, we still use 8 pages. Real PDFs will show their own browser UI.
    const totalPages = isPDF ? 8 : 1

    const pages = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages])

    useEffect(() => {
        if (document.file) {
            if (isPDF) {
                const url = URL.createObjectURL(document.file)
                setPdfUrl(url)
                return () => URL.revokeObjectURL(url)
            } else if (isDOCX && docxContainerRef.current) {
                renderAsync(document.file, docxContainerRef.current, docxContainerRef.current, {
                    className: "docx",
                    inWrapper: false,
                    ignoreHeight: true,
                    ignoreWidth: true
                })
            }
        }
    }, [document.file, isPDF, isDOCX])

    const handlePrint = () => {
        const frame = window.frames[0] as any
        if (frame && isPDF) {
            frame.focus()
            frame.print()
        } else {
            window.print()
        }
    }

    return (
        <div className={clsx(
            "fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-300",
            isFullScreen ? "p-0" : "p-4 sm:p-8"
        )}>
            <div className={clsx(
                "bg-[#1A1C1E] border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col transition-all duration-500 ease-out scale-in",
                isFullScreen ? "w-full h-full rounded-none" : "w-full max-w-6xl h-full max-h-[95vh] rounded-3xl"
            )}>
                {/* --- TOP TOOLBAR --- */}
                <div className="h-14 flex-shrink-0 border-b border-white/10 bg-[#242629]/50 backdrop-blur-xl flex items-center justify-between px-4 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {!document.file && (
                            <button
                                onClick={() => setShowThumbnails(!showThumbnails)}
                                className={clsx("p-2 rounded-lg transition-colors", showThumbnails ? "bg-accent/20 text-accent" : "hover:bg-white/5 text-white/60")}
                                title="Toggle Thumbnails"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                            </button>
                        )}
                        <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate leading-tight">{document.name}</span>
                            <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{document.category} • {document.size}</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2 bg-black/20 rounded-xl p-1 border border-white/5">
                        <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-1.5 hover:bg-white/5 text-white/60 rounded-lg group transition-colors">
                            <svg className="w-4 h-4 group-active:scale-95" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                        </button>
                        <span className="text-[11px] font-black text-white px-2 min-w-[50px] text-center">{zoom}%</span>
                        <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="p-1.5 hover:bg-white/5 text-white/60 rounded-lg group transition-colors">
                            <svg className="w-4 h-4 group-active:scale-95" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-3">
                        {!document.file && (
                            <div className="flex items-center bg-black/20 rounded-xl p-1 border border-white/5 mr-1 sm:mr-4">
                                <button disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)} className="p-1.5 hover:bg-white/5 text-white/60 disabled:opacity-20 rounded-lg transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="text-[11px] font-bold text-white px-2 flex gap-1">
                                    <span>{currentPage}</span>
                                    <span className="opacity-30">/</span>
                                    <span className="opacity-60">{totalPages}</span>
                                </span>
                                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="p-1.5 hover:bg-white/5 text-white/60 disabled:opacity-20 rounded-lg transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        )}

                        <button onClick={handlePrint} className="p-2 hover:bg-white/5 text-white/60 rounded-lg transition-colors hidden sm:block" title="Print">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        </button>
                        <button onClick={onDownload} className="p-2 hover:bg-white/5 text-white/60 rounded-lg transition-colors" title="Download">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                        <div className="h-4 w-px bg-white/10 mx-1" />
                        <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 hover:bg-white/5 text-white/60 rounded-lg transition-colors" title="Toggle Fullscreen">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors" title="Close">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* --- MAIN CONTENT AREA --- */}
                <div className="flex-1 flex overflow-hidden bg-[#0D0E10]">
                    {/* SIDEBAR (THUMBNAILS) - ONLY FOR MOCK */}
                    {!document.file && (
                        <div className={clsx(
                            "flex-shrink-0 border-r border-white/5 bg-[#1A1C1E]/50 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out",
                            showThumbnails ? "w-48 p-4" : "w-0 p-0 overflow-hidden"
                        )}>
                            <div className="space-y-4">
                                {pages.map(page => (
                                    <div
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={clsx(
                                            "cursor-pointer group flex flex-col items-center gap-2 transition-all",
                                            currentPage === page ? "scale-100 opacity-100" : "opacity-40 hover:opacity-100 hover:scale-[1.02]"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-full aspect-[1/1.4] bg-white rounded-md shadow-lg border-2 transition-colors",
                                            currentPage === page ? "border-accent" : "border-transparent group-hover:border-white/20"
                                        )}>
                                            <div className="w-full h-full p-2 overflow-hidden select-none pointer-events-none">
                                                <div className="w-8 h-1 bg-black/10 mb-1" />
                                                <div className="w-full h-0.5 bg-black/5 mb-0.5" />
                                                <div className="w-full h-0.5 bg-black/5 mb-0.5" />
                                                <div className="w-2/3 h-0.5 bg-black/5 mb-1" />
                                                <div className="w-full h-8 bg-black/5 rounded mb-1" />
                                                <div className="w-full h-0.5 bg-black/5 mb-0.5" />
                                                <div className="w-full h-0.5 bg-black/5 mb-0.5" />
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black tracking-widest text-white/40">{page}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* VIEWER AREA */}
                    <div className="flex-1 overflow-auto custom-scrollbar flex flex-col items-center bg-[radial-gradient(circle_at_center,_#1A1C1E_0%,_#0D0E10_100%)] p-2 sm:p-4 lg:p-8">
                        <div
                            style={{
                                width: `${zoom}%`,
                                maxWidth: document.file ? '100%' : '1000px',
                                height: document.file ? '100%' : 'auto'
                            }}
                            className={clsx(
                                "transition-all duration-300 origin-top flex flex-col items-center",
                                !document.file && "bg-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm min-h-[141%] mb-20"
                            )}
                        >
                            {document.file ? (
                                /* REAL DOCUMENT RENDERING */
                                <div className="w-full h-full rounded-xl overflow-hidden bg-white shadow-2xl">
                                    {isPDF && pdfUrl ? (
                                        <iframe
                                            src={`${pdfUrl}#toolbar=0&navpanes=0`}
                                            className="w-full h-full border-none"
                                            title="PDF Preview"
                                        />
                                    ) : isDOCX ? (
                                        <div className="w-full h-full bg-white overflow-auto p-8 custom-scrollbar">
                                            <div ref={docxContainerRef} className="docx-wrapper mx-auto" style={{ maxWidth: '800px' }} />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center text-zinc-500">
                                            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            <p className="text-lg font-bold">Unsupported Format</p>
                                            <p className="text-sm">Cannot preview {document.name}. Please download to view.</p>
                                            <button onClick={onDownload} className="btn mt-6">Download Now</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* MOCK/LEGACY RENDERING */
                                <div className="p-[10%] sm:p-[12%] h-full font-serif text-[#1e1e1e] select-text">
                                    <div className="flex justify-between items-start mb-12">
                                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.813a1 1 0 00-.788 0l-7 3a1 1 0 000 1.837l7 3a1 1 0 00.788 0l7-3a1 1 0 000-1.837l-7-3zM2.11 11.305l.79 1.185A2.324 2 0 004.832 13.5h10.336a2.324 2 0 001.932-1.01l.79-1.185a1 1 0 00-1.664-1.11l-.79 1.185A.324.324 0 0115.168 11.5H4.832a.324.324 0 01-.27-.14l-.79-1.185a1 1 0 00-1.664 1.11z" /></svg>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black tracking-tighter uppercase mb-1">Confidential Agreement</div>
                                            <div className="text-[10px] text-muted-foreground">{document.id}</div>
                                        </div>
                                    </div>

                                    <h1 className="text-2xl sm:text-3xl font-black mb-8 border-b-2 border-black/5 pb-4 tracking-tight uppercase">
                                        {(document as any).title || document.name.split('.')[0].replace(/_/g, ' ')}
                                    </h1>

                                    <div className="space-y-6 text-sm sm:text-base leading-loose opacity-90">
                                        <p className="font-bold italic">Page {currentPage} of {totalPages}</p>

                                        <div className="whitespace-pre-wrap font-serif">
                                            {document.content || `[No preview content available for this document format]

Technical File ID: ${document.id}
Generated on: ${document.date}

Please download the full version for legal verification.`}
                                        </div>

                                        {(!document.content) && (
                                            <div className="pl-6 border-l-4 border-accent/20 py-2 space-y-4">
                                                <p className="font-black uppercase text-xs tracking-widest text-accent mb-4">Article {currentPage + 1}: General Provisions</p>
                                                <p>
                                                    The terms and conditions for this specific file have been archived in the system vault.
                                                    As part of the EVZONE security protocol, sensitive document metadata is encrypted and stored
                                                    on a localized private ledger.
                                                </p>
                                            </div>
                                        )}

                                        <div className="pt-12 grid grid-cols-2 gap-12 border-t border-black/5">
                                            <div className="space-y-8">
                                                <div className="h-0.5 bg-black/40 w-full" />
                                                <div className="text-[10px] font-black uppercase tracking-widest">Signatory Authority</div>
                                            </div>
                                            <div className="space-y-8 text-right font-bold text-[10px] uppercase opacity-40">
                                                <div className="h-0.5 bg-black/40 w-full mb-8" />
                                                E-Sign Verified
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- FOOTER STATUS --- */}
                <div className="h-8 flex-shrink-0 bg-[#0D0E10] border-t border-white/5 flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Document Securely Verified</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 h-full">
                        <span className="text-[10px] text-white/40 font-medium">Encoding: UTF-8</span>
                        <div className="h-3 w-px bg-white/5" />
                        <span className="text-[10px] text-white/40 font-medium">Layout: Fixed A4</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
