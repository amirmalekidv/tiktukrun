'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import type { ActivityItem } from '@/types'
import { activitiesApi } from '@/lib/api/activities'
import { USE_MOCK } from '@/lib/mock-admin-api'

// Mock activity generator for demo
const activityTemplates = [
  { type: 'BOOKING', title: 'رزرو جدید', icon: 'fa-calendar-check', color: 'emerald' },
  { type: 'PAYMENT', title: 'پرداخت موفق', icon: 'fa-credit-card', color: 'sky' },
  { type: 'REVIEW', title: 'نظر جدید', icon: 'fa-star', color: 'amber' },
  { type: 'LEVEL_UP', title: 'ارتقاء سطح', icon: 'fa-arrow-up', color: 'purple' },
  { type: 'BADGE', title: 'بج اعطا شد', icon: 'fa-medal', color: 'amber' },
]

const names = ['محمد رضایی', 'سارا احمدی', 'علیرضا کریمی', 'نرگس موسوی', 'امیر صادقی', 'فاطمه علوی', 'رضا باقری']
const games = ['اتاق فرار', 'VR ترس', 'لیزرتگ', 'پینت‌بال', 'سینما ترس']

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function createMockActivity(): ActivityItem {
  const t = randomChoice(activityTemplates)
  const name = randomChoice(names)
  const game = randomChoice(games)
  
  const descriptions: Record<string, string> = {
    BOOKING: `${name} رزرو ${game} را ثبت کرد`,
    PAYMENT: `${name} مبلغ ${Math.floor(Math.random() * 3 + 1)}،۵۰۰،۰۰۰ تومان پرداخت کرد`,
    REVIEW: `${name} برای ${game} نظر ۵ ستاره ثبت کرد`,
    LEVEL_UP: `${name} به سطح ${Math.floor(Math.random() * 30 + 10)} ارتقاء یافت`,
    BADGE: `به ${name} بج طلایی اعطا شد`,
  }
  
  return {
    id: `live_${Date.now()}_${Math.random()}`,
    type: t.type as ActivityItem['type'],
    title: t.title,
    description: descriptions[t.type] || '',
    customerName: name,
    icon: t.icon,
    color: t.color,
    createdAt: new Date().toISOString(),
  }
}

export function useLiveActivities(maxItems = 20) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const addActivity = useCallback((activity: ActivityItem) => {
    setActivities(prev => [activity, ...prev].slice(0, maxItems))
  }, [maxItems])

  useEffect(() => {
    // Load initial activities
    activitiesApi.list({ limit: 15 }).then(res => {
      if (res.success && Array.isArray(res.data)) {
        setActivities((res.data as ActivityItem[]).slice(0, maxItems))
      }
      setIsLoading(false)
    }).catch(() => {
      setActivities([])
      setIsLoading(false)
    })

    // Cleanup references
    let socketCleanup: (() => void) | null = null

    if (USE_MOCK) {
      // Simulate live activities with random interval
      intervalRef.current = setInterval(() => {
        if (Math.random() > 0.3) {
          addActivity(createMockActivity())
        }
      }, 3000)
    } else {
      // Use dynamic import to avoid require() in Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let socketRef: any = null
      import('@/lib/socket')
        .then(({ connectAdminSocket }) => {
          socketRef = connectAdminSocket()
          socketRef.on('activity', addActivity)
          socketCleanup = () => {
            if (socketRef) socketRef.off('activity', addActivity)
          }
        })
        .catch(() => {
          console.warn('Socket not available')
        })
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (socketCleanup) socketCleanup()
    }
  }, [addActivity, maxItems])

  return { activities, isLoading, addActivity }
}
