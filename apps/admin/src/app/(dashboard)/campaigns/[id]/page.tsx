'use client'
import { useParams, useRouter } from 'next/navigation'
import { useCampaign } from '@/hooks/useCampaigns'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatJalali, toPersianNum, campaignTypeToLabel, campaignTypeToIcon } from '@/lib/utils'

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: res, isLoading } = useCampaign(params.id as string)
  const campaign = res?.data

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
  if (!campaign) return <div className="text-center text-slate-400 py-20">کمپین یافت نشد</div>

  const metrics = [
    { label: 'ارسال شده', value: campaign.sentCount, total: campaign.targetCount, color: '#0ea5e9' },
    { label: 'باز شده', value: campaign.openedCount, total: campaign.sentCount, color: '#10b981' },
    { label: 'کلیک', value: campaign.clickedCount, total: campaign.openedCount, color: '#f59e0b' },
    { label: 'تبدیل', value: campaign.convertedCount, total: campaign.clickedCount, color: '#dc2626' },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        <i className="fas fa-arrow-right" /> بازگشت
      </button>

      <div className="admin-card p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
              <i className={`fas ${campaignTypeToIcon(campaign.type)} text-red-400`} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">{campaign.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">{campaignTypeToLabel(campaign.type)}</span>
                {campaign.segmentName && <span className="text-xs text-slate-600">• {campaign.segmentName}</span>}
              </div>
            </div>
          </div>
          <StatusBadge type={campaign.status} size="md" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map(m => {
            const rate = m.total > 0 ? (m.value / m.total * 100) : 0
            return (
              <div key={m.label} className="p-3 rounded-xl bg-slate-800/30">
                <p className="text-2xl font-bold text-slate-100">{toPersianNum(m.value)}</p>
                <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
                <ProgressBar value={rate} color={m.color} className="mt-2" />
                <p className="text-xs text-slate-600 mt-1">{toPersianNum(rate.toFixed(1))}٪</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="admin-card p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">محتوای پیام</h2>
        <div className="p-4 rounded-xl bg-slate-800/30 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {campaign.content.body}
        </div>
      </div>
    </div>
  )
}
