'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCustomer } from '@/hooks/useCustomers'
import { Tabs } from '@/components/ui/Tabs'
import { Skeleton } from '@/components/ui/Skeleton'
import { ProfileHeader } from '@/components/customers/CustomerDetail/ProfileHeader'
import { KpiBoxes } from '@/components/customers/CustomerDetail/KpiBoxes'
import { BookingsTab } from '@/components/customers/CustomerDetail/BookingsTab'
import { TransactionsTab } from '@/components/customers/CustomerDetail/TransactionsTab'
import { NotesTab } from '@/components/customers/CustomerDetail/NotesTab'
import { GrantBadgeModal } from '@/components/customers/GrantBadgeModal'
import { AdjustXpModal } from '@/components/customers/AdjustXpModal'
import { AdjustWalletModal } from '@/components/customers/AdjustWalletModal'
import { BanUserModal } from '@/components/customers/BanUserModal'
import { customersApi } from '@/lib/api/customers'
import toast from 'react-hot-toast'

const tabs = [
  { id: 'bookings', label: 'رزروها', icon: 'fa-calendar-check' },
  { id: 'transactions', label: 'تراکنش‌ها', icon: 'fa-credit-card' },
  { id: 'reviews', label: 'نظرات', icon: 'fa-star' },
  { id: 'notes', label: 'یادداشت‌ها', icon: 'fa-note-sticky' },
  { id: 'timeline', label: 'تاریخچه', icon: 'fa-timeline' },
]

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data: res, isLoading, mutate } = useCustomer(id)
  const customer = res?.data
  const [activeTab, setActiveTab] = useState('bookings')
  const [modal, setModal] = useState<string | null>(null)

  const handleAction = (action: string) => setModal(action)

  const handleBadge = async (badge: string) => {
    await customersApi.grantBadge(id, badge)
    toast.success('بج اعطا شد'); setModal(null)
  }
  const handleXp = async (amount: number, reason: string) => {
    await customersApi.adjustXp(id, amount, reason)
    toast.success('XP اعمال شد'); setModal(null); mutate()
  }
  const handleWallet = async (amount: number, reason: string) => {
    await customersApi.adjustWallet(id, amount, reason)
    toast.success('کیف پول تنظیم شد'); setModal(null); mutate()
  }
  const handleBan = async (reason: string) => {
    await customersApi.ban(id, reason)
    toast.success('کاربر مسدود شد'); setModal(null); mutate()
  }
  const handleUnban = async () => {
    await customersApi.unban(id)
    toast.success('رفع مسدودی انجام شد'); setModal(null); mutate()
  }

  if (isLoading) return (
    <div className="space-y-4 animate-fade-in">
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i=><Skeleton key={i} className="h-24 rounded-xl"/>)}</div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
  if (!customer) return <div className="text-center text-slate-400 py-20">مشتری یافت نشد</div>

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        <i className="fas fa-arrow-right" /> بازگشت به لیست
      </button>

      <ProfileHeader customer={customer} onAction={handleAction} />
      <KpiBoxes customer={customer} />

      {/* Tabs */}
      <div className="admin-card overflow-hidden">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div>
          {activeTab === 'bookings' && <BookingsTab customerId={id} />}
          {activeTab === 'transactions' && <TransactionsTab customerId={id} />}
          {activeTab === 'notes' && <NotesTab customerId={id} />}
          {activeTab === 'reviews' && (
            <div className="p-6 text-center text-slate-500 text-sm">
              <i className="fas fa-star text-2xl mb-2 block text-slate-700" />
              نظرات در نسخه بعدی پیاده‌سازی می‌شود
            </div>
          )}
          {activeTab === 'timeline' && (
            <div className="p-6 text-center text-slate-500 text-sm">
              <i className="fas fa-timeline text-2xl mb-2 block text-slate-700" />
              تاریخچه در نسخه بعدی پیاده‌سازی می‌شود
            </div>
          )}
        </div>
      </div>

      {modal === 'badge' && <GrantBadgeModal onConfirm={handleBadge} onClose={() => setModal(null)} />}
      {modal === 'xp' && <AdjustXpModal onConfirm={handleXp} onClose={() => setModal(null)} />}
      {modal === 'wallet' && <AdjustWalletModal onConfirm={handleWallet} onClose={() => setModal(null)} />}
      {modal === 'ban' && customer && <BanUserModal customer={customer} onConfirm={handleBan} onClose={() => setModal(null)} />}
    </div>
  )
}
