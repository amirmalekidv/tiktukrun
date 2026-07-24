'use client'

import type { ReactNode } from 'react'
import useSWR from 'swr'
import { getGames, getLandingSections } from '@/lib/api'
import type { LandingSection } from '@/types'
import SectionStrip from './SectionStrip'

const NEWEST_ESCAPE_ROOMS_KEY = 'newest-escape-rooms'
const OUR_PICKS_KEY = 'our-picks'

function NewestEscapeRoomsStrip() {
  const { data, isLoading } = useSWR('newest-escape-rooms-landing', () =>
    getGames({ category: 'ESCAPE_ROOM', sortBy: 'newest', limit: 20 })
  )

  return (
    <SectionStrip
      sectionKey={NEWEST_ESCAPE_ROOMS_KEY}
      title="جدیدترین اتاق فرارها"
      icon="fas fa-clock"
      games={isLoading ? undefined : (data?.data ?? [])}
      isLoading={isLoading}
    />
  )
}

function renderSections(sections: LandingSection[]) {
  const nodes: ReactNode[] = []
  let insertedNewest = false

  for (const section of sections) {
    nodes.push(
      <SectionStrip
        key={section.key}
        sectionKey={section.key}
        title={section.title}
        icon={section.icon}
        games={section.games}
      />
    )

    if (section.key === OUR_PICKS_KEY) {
      nodes.push(<NewestEscapeRoomsStrip key={NEWEST_ESCAPE_ROOMS_KEY} />)
      insertedNewest = true
    }
  }

  if (!insertedNewest) {
    const weeklyIndex = sections.findIndex((section) => section.key === 'weekly-discount')
    const insertAt = weeklyIndex >= 0 ? weeklyIndex + 1 : 0
    nodes.splice(insertAt, 0, <NewestEscapeRoomsStrip key={NEWEST_ESCAPE_ROOMS_KEY} />)
  }

  return nodes
}

export default function LandingSections() {
  const { data: sections = [], isLoading } = useSWR('landing-sections', getLandingSections)

  if (isLoading) {
    return (
      <div className="border-t border-white/10 my-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <section key={i} className="py-10">
            <div className="max-w-7xl mx-auto px-4">
              <div className="h-8 w-48 skeleton rounded mb-6" />
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-64 w-56 flex-shrink-0 skeleton rounded-[18px]" />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className="border-t border-white/10 my-4">
        <NewestEscapeRoomsStrip />
      </div>
    )
  }

  return (
    <div className="border-t border-white/10 my-4">
      {renderSections(sections)}
    </div>
  )
}
