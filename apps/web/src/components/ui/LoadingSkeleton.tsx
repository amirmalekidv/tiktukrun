import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />
}

export function GameCardSkeleton({
  className,
  variant = 'compact',
}: {
  className?: string
  variant?: 'compact' | 'horizontal'
}) {
  if (variant === 'horizontal') {
    return (
      <div
        className={cn(
          'dark-card overflow-hidden rounded-[24px] border border-white/10 p-3 sm:p-4',
          className
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <Skeleton className="h-[220px] w-full rounded-[20px] sm:w-56 lg:w-60" />
          <div className="flex flex-1 flex-col gap-3 py-1">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="mt-auto flex items-center justify-between gap-3 pt-3">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'w-[220px] flex-shrink-0 snap-start sm:w-[236px] lg:w-[248px]',
        className
      )}
    >
      <div className="dark-card overflow-hidden rounded-[24px] border border-white/10 p-2.5">
        <Skeleton className="aspect-[3/4] w-full rounded-[20px]" />
      </div>

      <div className="space-y-2 px-2 pb-1 pt-3 text-center">
        <Skeleton className="mx-auto h-6 w-4/5" />
        <Skeleton className="mx-auto h-4 w-3/5" />
        <div className="flex justify-center gap-2 pt-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="mx-auto h-6 w-32" />
      </div>
    </div>
  )
}

export function GameDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-96 w-full rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
