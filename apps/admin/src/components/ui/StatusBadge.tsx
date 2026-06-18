import { cn, statusToLabel, tierToLabel } from '@/lib/utils'
import type { CustomerTier, CustomerStatus, BookingStatus, CampaignStatus, TransactionStatus } from '@/types'

type BadgeType = CustomerTier | CustomerStatus | BookingStatus | CampaignStatus | TransactionStatus

const styles: Record<string, string> = {
  // Tiers
  VIP: 'badge-vip',
  PLATINUM: 'badge-platinum',
  GOLD: 'badge-gold',
  SILVER: 'badge-silver',
  BRONZE: 'badge-bronze',
  AT_RISK: 'badge-at-risk',
  NEWCOMER: 'badge-newcomer',
  // Status
  ACTIVE: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  INACTIVE: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  BANNED: 'bg-red-500/15 text-red-400 border border-red-500/30',
  SUSPENDED: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  // Booking
  PENDING: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  CONFIRMED: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
  PLAYING: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
  COMPLETED: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 border border-red-500/30',
  NO_SHOW: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  // Campaign
  DRAFT: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  SCHEDULED: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
  PAUSED: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  SUCCESS: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  FAILED: 'bg-red-500/15 text-red-400 border border-red-500/30',
  REFUNDED: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
}

const tierIcons: Record<string, string> = {
  VIP: 'fa-crown',
  PLATINUM: 'fa-gem',
  GOLD: 'fa-star',
  SILVER: 'fa-medal',
  BRONZE: 'fa-award',
  AT_RISK: 'fa-triangle-exclamation',
  NEWCOMER: 'fa-user-plus',
}

interface Props {
  type: BadgeType
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

export function StatusBadge({ type, size = 'sm', showIcon = false, className }: Props) {
  const style = styles[type] || 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
  const label = tierToLabel(type) || statusToLabel(type)
  const icon = tierIcons[type]

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      style,
      className
    )}>
      {showIcon && icon && <i className={`fas ${icon} text-[10px]`} />}
      {label}
    </span>
  )
}
