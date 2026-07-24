'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import useSWR from 'swr'
import { getGamesBySection } from '@/lib/api'
import type { Game } from '@/types'
import GameCard from './GameCard'
import CarouselRail, { CarouselNavButtons } from './CarouselRail'
import { GameCardSkeleton } from '@/components/ui/LoadingSkeleton'

interface SectionStripProps {
  sectionKey: string
  title: string
  icon?: string
  games?: Game[]
  isLoading?: boolean
}

export default function SectionStrip({
  sectionKey,
  title,
  icon = 'fas fa-star',
  games: prefetchedGames,
  isLoading: externalLoading = false,
}: SectionStripProps) {
  const shouldFetch = prefetchedGames === undefined && !externalLoading
  const carouselId = `section-strip-${sectionKey}`
  const sectionContainerRef = useRef<HTMLDivElement>(null)
  const viewAllLabelRef = useRef<HTMLSpanElement>(null)
  const [railLeftInset, setRailLeftInset] = useState(0)
  const { data: fetchedGames = [], isLoading } = useSWR(
    shouldFetch ? `section-${sectionKey}` : null,
    () => getGamesBySection(sectionKey)
  )

  const games = prefetchedGames ?? fetchedGames
  const loading = externalLoading || (shouldFetch && isLoading)
  const railAlignmentStyle: CSSProperties | undefined = railLeftInset > 0
    ? { marginLeft: railLeftInset }
    : undefined

  const updateRailAlignment = useCallback(() => {
    const container = sectionContainerRef.current
    const label = viewAllLabelRef.current

    if (!container || !label) return

    const containerRect = container.getBoundingClientRect()
    const containerStyles = window.getComputedStyle(container)
    const containerContentLeft = containerRect.left + parseFloat(containerStyles.paddingLeft || '0')
    const labelRect = label.getBoundingClientRect()
    const nextInset = Math.max(0, Math.round(labelRect.left - containerContentLeft))

    setRailLeftInset((currentInset) => (
      currentInset === nextInset ? currentInset : nextInset
    ))
  }, [])

  useEffect(() => {
    updateRailAlignment()

    const observedElements: Element[] = []
    if (sectionContainerRef.current) observedElements.push(sectionContainerRef.current)
    if (viewAllLabelRef.current) observedElements.push(viewAllLabelRef.current)

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateRailAlignment)
      return () => window.removeEventListener('resize', updateRailAlignment)
    }

    const resizeObserver = new ResizeObserver(updateRailAlignment)
    observedElements.forEach((element) => resizeObserver.observe(element))
    window.addEventListener('resize', updateRailAlignment)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateRailAlignment)
    }
  }, [updateRailAlignment])

  if (!loading && games.length === 0) return null

  return (
    <section className="py-10">
      <div ref={sectionContainerRef} className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="font-cinzel font-bold text-xl text-white flex items-center gap-2">
              <i className={`${icon} text-[#f6d06b]`} />
              <span className="text-white">{title}</span>
            </h2>
            <CarouselNavButtons carouselId={carouselId} />
          </div>
          <Link
            href={`/section/${sectionKey}`}
            className="flex items-center gap-1 rounded-full border border-[#f6c453]/30 bg-[#0c111a]/75 px-4 py-2 text-sm font-bold text-[#f6d06b] transition-all hover:-translate-y-0.5 hover:border-[#f6c453]/65 hover:bg-[#111827]"
          >
            <span ref={viewAllLabelRef}>مشاهده همه</span>
            <i className="fas fa-chevron-left text-xs" />
          </Link>
        </div>

        <div className="section-carousel-viewport" style={railAlignmentStyle}>
          <CarouselRail carouselId={carouselId} navigationPlacement="external">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <GameCardSkeleton key={i} />
                ))
              : games.map((game) => <GameCard key={game.id} game={game} />)}
          </CarouselRail>
        </div>
      </div>
    </section>
  )
}
