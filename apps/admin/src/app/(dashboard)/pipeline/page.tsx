'use client'
import { useState, useCallback } from 'react'
import { usePipeline } from '@/hooks/usePipeline'
import { pipelineApi } from '@/lib/api/pipeline'
import { formatToman, toPersianNum, pipelineStageToLabel } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'
import type { Deal, PipelineStage } from '@/types'

const STAGES: PipelineStage[] = ['LEAD', 'CONTACTED', 'PROPOSED', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST']

const stageColors: Record<PipelineStage, string> = {
  LEAD: 'text-slate-400 border-slate-600',
  CONTACTED: 'text-sky-400 border-sky-600',
  PROPOSED: 'text-purple-400 border-purple-600',
  NEGOTIATING: 'text-amber-400 border-amber-600',
  CLOSED_WON: 'text-emerald-400 border-emerald-600',
  CLOSED_LOST: 'text-red-400 border-red-600',
}

function DealCard({ deal, onDragStart }: { deal: Deal; onDragStart: (e: React.DragEvent, dealId: string) => void }) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, deal.id)}
      className="admin-card p-3 cursor-grab active:cursor-grabbing hover:border-slate-600/50 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-slate-200 leading-tight flex-1">{deal.title}</p>
        {deal.tag && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: (deal.tagColor || '#dc2626') + '20', color: deal.tagColor || '#dc2626' }}>
            {deal.tag}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-red-600/50 to-purple-600/50 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
          {deal.customerName?.slice(0, 2)}
        </div>
        <span className="text-xs text-slate-500 truncate">{deal.customerName}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-emerald-400">{formatToman(deal.value)}</span>
        <span className="text-[10px] text-slate-600">{deal.expectedCloseDate?.slice(0,10)}</span>
      </div>
    </div>
  )
}

function KanbanColumn({
  stage, deals, onDragOver, onDrop, onDragStart,
}: {
  stage: PipelineStage; deals: Deal[];
  onDragOver: (e: React.DragEvent, stage: PipelineStage) => void;
  onDrop: (e: React.DragEvent, stage: PipelineStage) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  const total = deals.reduce((s, d) => s + d.value, 0)
  const colorClass = stageColors[stage]

  return (
    <div
      className={`flex-shrink-0 w-52 flex flex-col rounded-xl border-t-2 ${colorClass.split(' ')[1]} overflow-hidden`}
      style={{ background: 'rgba(15,23,42,0.6)', minHeight: 400 }}
      onDragOver={e => { e.preventDefault(); onDragOver(e, stage) }}
      onDrop={e => onDrop(e, stage)}
    >
      <div className={`px-3 py-2.5 border-b border-slate-700/30`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold ${colorClass.split(' ')[0]}`}>{pipelineStageToLabel(stage)}</span>
          <span className="text-xs bg-slate-800/80 text-slate-400 rounded-full px-1.5 py-0.5">{toPersianNum(deals.length)}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{formatToman(total)}</p>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {deals.map(d => (
          <DealCard key={d.id} deal={d} onDragStart={onDragStart} />
        ))}
        {deals.length === 0 && (
          <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-700/30 rounded-lg text-xs text-slate-700">
            رها کنید
          </div>
        )}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const { data: res, isLoading, mutate } = usePipeline()
  const [deals, setDeals] = useState<Deal[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const allDeals: Deal[] = Array.isArray(res?.data) ? res.data : deals

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggingId(dealId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, newStage: PipelineStage) => {
    e.preventDefault()
    if (!draggingId) return
    setDraggingId(null)
    try {
      await pipelineApi.move(draggingId, newStage, 0)
      toast.success('معامله جابجا شد')
      mutate()
    } catch { toast.error('خطا در جابجایی') }
  }

  const dealsByStage = (stage: PipelineStage) => allDeals.filter(d => d.stage === stage)
  const totalValue = allDeals.filter(d => !['CLOSED_LOST'].includes(d.stage)).reduce((s, d) => s + d.value, 0)
  const wonDeals = allDeals.filter(d => d.stage === 'CLOSED_WON')
  const conversionRate = allDeals.length ? (wonDeals.length / allDeals.length * 100).toFixed(1) : '0'

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Pipeline فروش</h1>
          <p className="text-sm text-slate-500">مدیریت فرصت‌های فروش و ارتباط با مشتریان</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
          <i className="fas fa-plus" /> Deal جدید
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'کل ارزش Pipeline', value: formatToman(totalValue), icon: 'fa-chart-line', color: 'text-emerald-400 bg-emerald-400/10' },
          { label: 'نرخ تبدیل', value: `${toPersianNum(conversionRate)}٪`, icon: 'fa-percent', color: 'text-sky-400 bg-sky-400/10' },
          { label: 'معاملات فعال', value: toPersianNum(allDeals.filter(d => !['CLOSED_WON','CLOSED_LOST'].includes(d.stage)).length), icon: 'fa-handshake', color: 'text-amber-400 bg-amber-400/10' },
        ].map(s => (
          <div key={s.label} className="admin-card p-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <i className={`fas ${s.icon} text-sm`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex gap-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="w-52 h-64 flex-shrink-0 rounded-xl" />)}
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {STAGES.map(stage => (
              <KanbanColumn
                key={stage}
                stage={stage}
                deals={dealsByStage(stage)}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
