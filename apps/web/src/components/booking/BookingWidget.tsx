'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Game } from '@/types'
import { formatToman, toPersianDigits } from '@/lib/utils'
import PriceTag from '@/components/ui/PriceTag'

interface BookingWidgetProps {
  game: Game
}

export default function BookingWidget({ game }: BookingWidgetProps) {
  const router = useRouter()
  const [players, setPlayers] = useState(game.minPlayers)
  const totalPrice = game.basePrice + (game.pricePerPlayer || 0) * players
  const gameIdentifier = game.slug || game.id

  const handleBooking = () => {
    router.push(`/games/${gameIdentifier}/booking?players=${players}`)
  }

  return (
    <div className="dark-card rounded-[18px] p-6 space-y-5">
      {/* Header */}
      <div className="text-center border-b border-white/10 pb-4">
        <h3 className="font-cinzel font-bold text-white text-lg mb-1">رزرو آنلاین</h3>
        <p className="text-gray-400 text-xs">سریع، آسان، مطمئن</p>
      </div>

      {/* Players counter */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-3">
          <i className="fas fa-users text-[#00f5ff] ml-1" />
          تعداد بازیکن
        </label>
        <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl p-1">
          <button
            onClick={() => setPlayers(Math.max(game.minPlayers, players - 1))}
            className="w-10 h-10 rounded-lg bg-[#b026ff]/25 text-white font-bold hover:bg-[#b026ff]/40 transition-all disabled:opacity-40"
            disabled={players <= game.minPlayers}
          >
            −
          </button>
          <div className="text-center">
            <div className="font-cinzel font-black text-2xl text-white">{toPersianDigits(players)}</div>
            <div className="text-gray-500 text-xs">نفر</div>
          </div>
          <button
            onClick={() => setPlayers(Math.min(game.maxPlayers, players + 1))}
            className="w-10 h-10 rounded-lg bg-[#b026ff]/25 text-white font-bold hover:bg-[#b026ff]/40 transition-all disabled:opacity-40"
            disabled={players >= game.maxPlayers}
          >
            +
          </button>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>حداقل {toPersianDigits(game.minPlayers)} نفر</span>
          <span>حداکثر {toPersianDigits(game.maxPlayers)} نفر</span>
        </div>
      </div>

      {/* Price preview */}
      <div className="space-y-2 bg-white/[0.03] rounded-xl p-4 border border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">قیمت پایه</span>
          <span className="text-gray-200">{formatToman(game.basePrice)} ت</span>
        </div>
        {game.pricePerPlayer && game.pricePerPlayer > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{toPersianDigits(players)} نفر × {formatToman(game.pricePerPlayer)} ت</span>
            <span className="text-gray-200">{formatToman(game.pricePerPlayer * players)} ت</span>
          </div>
        )}
        <div className="border-t border-white/10 pt-2 flex justify-between">
          <span className="text-gray-300 font-medium">مجموع</span>
          <PriceTag amount={totalPrice} size="lg" />
        </div>
        <p className="text-gray-500 text-xs text-center">* قیمت نهایی پس از انتخاب زمان</p>
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <i className="fas fa-clock text-[#00f5ff] w-4" />
          {toPersianDigits(game.duration)} دقیقه
        </div>
        <div className="flex items-center gap-1">
          <i className="fas fa-map-marker-alt text-[#00f5ff] w-4" />
          {game.branch.city.name}
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleBooking}
        className="btn-blood w-full py-4 text-base font-bold"
      >
        <i className="fas fa-calendar-check ml-2" />
        انتخاب تاریخ و زمان
      </button>

      {/* Guarantees */}
      <div className="space-y-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <i className="fas fa-shield-alt text-green-500 w-4" />
          پرداخت امن و مطمئن
        </div>
        <div className="flex items-center gap-2">
          <i className="fas fa-undo text-blue-500 w-4" />
          امکان لغو تا ۲۴ ساعت قبل
        </div>
        <div className="flex items-center gap-2">
          <i className="fas fa-headset text-[#00f5ff] w-4" />
          پشتیبانی ۲۴/۷
        </div>
      </div>
    </div>
  )
}
