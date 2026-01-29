import Skeleton from 'react-loading-skeleton'
import { Card } from '@/ui/components/Card'

export function KpiCardSkeleton() {
    return (
        <Card className="p-5">
            <div className="flex justify-between items-start mb-2">
                <Skeleton width={80} height={12} />
                <Skeleton circle width={36} height={36} />
            </div>
            <Skeleton width={120} height={32} />
            <div className="flex justify-between items-center mt-1">
                <Skeleton width={60} height={12} />
                <Skeleton width={40} height={16} borderRadius={4} />
            </div>
        </Card>
    )
}

export function SiteCardSkeleton() {
    return (
        <Card className="p-0 overflow-hidden border-l-4 border-l-muted/30">
            <div className="p-6 border-b border-border bg-card-header flex flex-wrap justify-between items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3">
                        <Skeleton width={200} height={24} />
                        <Skeleton width={60} height={20} borderRadius={10} />
                    </div>
                    <div className="mt-2 text-sm">
                        <Skeleton width={300} height={16} />
                    </div>
                    <div className="mt-2">
                        <Skeleton width={150} height={12} />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right">
                        <Skeleton width={100} height={10} />
                        <Skeleton width={120} height={16} className="mt-1" />
                    </div>
                    <Skeleton width={100} height={32} borderRadius={6} />
                    <Skeleton width={100} height={32} borderRadius={6} />
                </div>
            </div>
            <div className="p-6 bg-muted/5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i}>
                            <Skeleton width={60} height={10} className="mb-2" />
                            <Skeleton width={100} height={20} />
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <div className="w-full">
            <div className="flex bg-muted/5 border-b border-border p-3">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="flex-1 px-2">
                        <Skeleton height={14} />
                    </div>
                ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex border-b border-border p-4 items-center">
                    {Array.from({ length: cols }).map((_, j) => (
                        <div key={j} className="flex-1 px-2">
                            <Skeleton height={16} />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}
