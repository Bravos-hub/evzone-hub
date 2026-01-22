import { useRef, useState, useEffect } from 'react'
import clsx from 'clsx'

interface DigitalSignaturePadProps {
    onSign: (signatureData: string) => void
    onCancel: () => void
    isSubmitting: boolean
    signeeName: string
}

export function DigitalSignaturePad({ onSign, onCancel, isSubmitting, signeeName }: DigitalSignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasSignature, setHasSignature] = useState(false)
    const [typedSignature, setTypedSignature] = useState('')
    const [mode, setMode] = useState<'draw' | 'type'>('type')

    // Canvas Logic
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return

        setIsDrawing(true)
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'

        const { offsetX, offsetY } = getCoordinates(e, canvas)
        ctx.beginPath()
        ctx.moveTo(offsetX, offsetY)
    }

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const { offsetX, offsetY } = getCoordinates(e, canvas)
        ctx.lineTo(offsetX, offsetY)
        ctx.stroke()
        setHasSignature(true)
    }

    const stopDrawing = () => {
        setIsDrawing(false)
    }

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        let clientX, clientY

        // @ts-ignore - TouchEvent handling
        if (e.touches && e.touches.length > 0) {
            clientX = (e as unknown as React.TouchEvent).touches[0].clientX
            clientY = (e as unknown as React.TouchEvent).touches[0].clientY
        } else {
            clientX = (e as React.MouseEvent).clientX
            clientY = (e as React.MouseEvent).clientY
        }

        const rect = canvas.getBoundingClientRect()
        return {
            offsetX: clientX - rect.left,
            offsetY: clientY - rect.top
        }
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setHasSignature(false)
    }

    const handleSave = () => {
        if (mode === 'draw') {
            const canvas = canvasRef.current
            if (canvas) {
                onSign(canvas.toDataURL())
            }
        } else {
            // Create a canvas for the typed signature to uniformize output
            const canvas = document.createElement('canvas')
            canvas.width = 500
            canvas.height = 150
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.font = 'italic 48px "Dancing Script", cursive, serif'
                ctx.fillStyle = '#000'
                ctx.fillText(typedSignature, 50, 90)
                onSign(canvas.toDataURL())
            }
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="card max-w-lg w-full bg-bg-secondary border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <span>✍️</span> Sign Lease Agreement
                    </h3>
                    <button onClick={onCancel} className="btn btn-sm btn-ghost text-muted hover:text-white">✕</button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-sm text-blue-200">
                        <p className="mb-2"><strong>Electronic Signature Consent</strong></p>
                        <p>By signing this document, I, <strong>{signeeName}</strong>, agree to be legally bound by the terms and conditions set forth in the Lease Agreement.</p>
                    </div>

                    <div className="flex gap-2 mb-4 bg-white/5 p-1 rounded-lg">
                        <button
                            className={clsx("flex-1 py-2 text-sm font-medium rounded-md transition-colors", mode === 'type' ? "bg-accent text-white shadow-lg" : "text-muted hover:text-white")}
                            onClick={() => setMode('type')}
                        >
                            Type
                        </button>
                        <button
                            className={clsx("flex-1 py-2 text-sm font-medium rounded-md transition-colors", mode === 'draw' ? "bg-accent text-white shadow-lg" : "text-muted hover:text-white")}
                            onClick={() => setMode('draw')}
                        >
                            Draw
                        </button>
                    </div>

                    {mode === 'type' ? (
                        <div className="space-y-4">
                            <label className="label">Type your full legal name</label>
                            <input
                                type="text"
                                className="input w-full text-2xl font-serif italic py-4"
                                placeholder={signeeName}
                                value={typedSignature}
                                onChange={e => setTypedSignature(e.target.value)}
                            />
                            <p className="text-xs text-muted text-center cursor-help">
                                This will generate a digital signature representation.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="label">Draw your signature below</label>
                            <div className="border-2 border-dashed border-white/20 rounded-lg bg-white overflow-hidden relative group">
                                <canvas
                                    ref={canvasRef}
                                    width={450}
                                    height={150}
                                    className="w-full h-[150px] cursor-crosshair touch-none"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                                {hasSignature && (
                                    <button
                                        onClick={clearCanvas}
                                        className="absolute top-2 right-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                                    >
                                        Clear
                                    </button>
                                )}
                                {!hasSignature && !isDrawing && (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                                        Sign Here
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-white/5">
                    <button
                        className="btn ghost"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn primary px-8"
                        onClick={handleSave}
                        disabled={isSubmitting || (mode === 'draw' && !hasSignature) || (mode === 'type' && !typedSignature)}
                    >
                        {isSubmitting ? 'Signing...' : 'Sign & Complete'}
                    </button>
                </div>
            </div>
        </div>
    )
}
