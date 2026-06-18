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
          className="flex-shrink-0 flex items-center gap-2 bg-red-700/20 border border-red-700/40 hover:bg-red-700/30 hover:border-red-500 text-white rounded-full px-5 py-2.5 transition-all text-sm font-medium"
        >
          <i className="fas fa-globe text-red-400" />
          همه شهرها
        </button>
        {cities.map((city) => (
          <button
            key={city.id}
            onClick={() => handleCity(city.id)}
            className="flex-shrink-0 flex items-center gap-2 bg-red-950/30 border border-red-900/30 hover:border-red-600/50 hover:bg-red-950/50 text-gray-300 hover:text-white rounded-full px-5 py-2.5 transition-all text-sm"
          >
            <i className="fas fa-map-marker-alt text-red-600 text-xs" />
            {city.name}
          </button>
        ))}
      </div>
    </section>
  )
}
