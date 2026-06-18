'use client'
import { useRouter } from 'next/navigation'
import { useCampaigns } from '@/hooks/useCampaigns'
import { campaignsApi } from '@/lib/api/campaigns'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { toPersianNum, campaignTypeToLabel, campaignTypeToIcon, formatJalali, timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Campaign } from '@/types'

function CampaignCard({ campaign, onAction }: { campaign: Campaign; onAction: (a: string) => void }) {
  const sentRate = campaign.targetCount > 0 ? (campaign.sentCount / campaign.targetCount * 100) : 0
  const openRate = campaign.sentCount > 0 ? (campaign.openedCount / campaign.sentCount * 100) : 0
  const clickRate = campaign.openedCount > 0 ? (campaign.clickedCount / campaign.openedCount * 100) : 0
  const convertRate = campaign.clickedCount > 0 ? (campaign.convertedCount / campaign.clickedCount * 100) : 0

  return (
    <div className="admin-card p-5 hover:border-slate-600/50 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-600/20 flex items-center justify-center flex-shrink-0">
            <i className={`fas ${campaignTypeToIcon(campaign.type)} text-red-400 text-sm`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">{campaign.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500">{campaignTypeToLabel(campaign.type)}</span>
              {campaign.segmentName && <span className="text-xs text-slate-600">• {campaign.segmentName}</span>}
            </div>
          </div>
        </div>
        <StatusBadge type={campaign.status} />
      </div>

      {campaign.sentCount > 0 && (
        <div className="space-y-1.5 mb-3">
          {[
            { label: 'ارسال شده', value: campaign.sentCount, total: campaign.targetCount, rate: sentRate, color: '#0ea5e9' },
            { label: 'باز شده', value: campaign.openedCount, total: campaign.sentCount, rate: openRate, color: '#10b981' },
            { label: 'کلیک', value: campaign.clickedCount, total: campaign.openedCount, rate: clickRate, color: '#f59e0b' },
            { label: 'تبدیل', value: campaign.convertedCount, total: campaign.clickedCount, rate: convertRate, color: '#dc2626' },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-16">{m.label}</span>
              <div className="flex-1">
                <ProgressBar value={m.rate} color={m.color} />
              </div>
              <div className="text-right w-24">
                <span className="text-xs text-slate-400">{toPersianNum(m.value)}</span>
                <span className="text-xs text-slate-600 mr-1">({toPersianNum(m.rate.toFixed(0))}٪)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-700/20">
        <span className="text-xs text-slate-600">
          {campaign.scheduledAt ? formatJalali(campaign.scheduledAt) : campaign.createdAt ? timeAgo(campaign.createdAt) : ''}
        </span>
        <div className="flex items-center gap-1">
          {[
            { icon: 'fa-eye', action: 'view', title: 'مشاهده' },
            { icon: 'fa-pen', action: 'edit', title: 'ویرایش' },
            { icon: campaign.status === 'ACTIVE' ? 'fa-pause' : 'fa-play', action: campaign.status === 'ACTIVE' ? 'pause' : 'resume', title: campaign.status === 'ACTIVE' ? 'توقف' : 'شروع' },
            { icon: 'fa-copy', action: 'duplicate', title: 'کپی' },
            { icon: 'fa-trash', action: 'delete', title: 'حذف' },
          ].map(a => (
            <button
              key={a.action}
              onClick={() => onAction(a.action)}
              title={a.title}
              className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors text-xs"
            >
              <i className={`fas ${a.icon}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CampaignsPage() {
  const router = useRouter()
  const { data: res, isLoading, mutate } = useCampaigns()
  const campaigns: Campaign[] = res?.data || []

  const handleAction = async (action: string, campaign: Campaign) => {
    if (action === 'view' || action === 'edit') router.push(`/campaigns/${campaign.id}`)
    else if (action === 'pause') { await campaignsApi.pause(campaign.id); toast.success('کمپین متوقف شد'); mutate() }
    else if (action === 'resume') { await campaignsApi.resume(campaign.id); toast.success('کمپین ادامه یافت'); mutate() }
    else if (action === 'duplicate') { toast.success('کمپین کپی شد'); mutate() }
    else if (action === 'delete') { await campaignsApi.delete(campaign.id); toast.success('کمپین حذف شد'); mutate() }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">کمپین‌ها</h1>
          <p className="text-sm text-slate-500">{toPersianNum(campaigns.length)} کمپین</p>
        </div>
        <button onClick={() => router.push('/campaigns/new')} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
          <i className="fas fa-plus" /> کمپین جدید
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState icon="fa-megaphone" title="کمپینی وجود ندارد" action={{ label: 'ایجاد کمپین', onClick: () => router.push('/campaigns/new') }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {campaigns.map(c => (
            <CampaignCard key={c.id} campaign={c} onAction={(a) => handleAction(a, c)} />
          ))}
        </div>
      )}
    </div>
  )
}
