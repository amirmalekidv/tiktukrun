'use client'
import { useState } from 'react'
import { useSegments, useSegmentMembers } from '@/hooks/useSegments'
import { SegmentCard } from '@/components/segments/SegmentCard'
import { SegmentBuilder } from '@/components/segments/SegmentBuilder'
import { SegmentMembersTable } from '@/components/segments/SegmentMembersTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { toPersianNum } from '@/lib/utils'
import type { Segment } from '@/types'

export default function SegmentsPage() {
  const { data: res, isLoading, mutate } = useSegments()
  const segments: Segment[] = res?.data || []
  const [selected, setSelected] = useState<Segment | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">سگمنت‌ها</h1>
          <p className="text-sm text-slate-500">{toPersianNum(segments.length)} سگمنت تعریف شده</p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <i className="fas fa-plus" /> سگمنت جدید
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {segments.map(seg => (
            <SegmentCard key={seg.id} segment={seg} onClick={() => setSelected(seg)} />
          ))}
        </div>
      )}

      {/* Members modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative admin-card w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: selected.color + '20' }}>
                  <i className={`fas ${selected.icon} text-sm`} style={{ color: selected.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200">{selected.name}</h3>
                  <p className="text-xs text-slate-500">{toPersianNum(selected.count)} عضو</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white p-2">
                <i className="fas fa-xmark" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SegmentMembersTable segmentId={selected.id} />
            </div>
          </div>
        </div>
      )}

      {/* Builder modal */}
      {showBuilder && (
        <SegmentBuilder onClose={() => setShowBuilder(false)} onSave={() => { setShowBuilder(false); mutate() }} />
      )}
    </div>
  )
}
