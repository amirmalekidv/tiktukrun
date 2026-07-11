'use client'

import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { getCities } from '@/lib/api'

export default function CityFilter() {
  const router = useRouter()
  const { data: cities = [] } = useSWR('cities', getCities)

  const handleCity = (cityId: string) => {
    router.push(`/games?cityId=${cityId}`)
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => router.push('/games')}
          className="flex-shrink-0 flex items-center gap-2 rounded-full border border-[#00f5ff]/40 bg-white/[0.03] px-5 py-2.5 text-sm font-bold text-[#00f5ff] shadow-[inset_0_0_14px_rgba(0,245,255,0.16)] transition-all hover:-translate-y-1 hover:border-[#00f5ff]/70"
        >
          <i className="fas fa-globe" />
          همه شهرها
        </button>
        {cities.map((city) => (
          <button
            key={city.id}
            onClick={() => handleCity(city.id)}
            className="flex-shrink-0 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-gray-300 transition-all hover:-translate-y-1 hover:border-[#b026ff]/60 hover:text-white"
          >
            <i className="fas fa-map-marker-alt text-[#b026ff] text-xs" />
            {city.name}
          </button>
        ))}
      </div>
    </section>
  )
}
