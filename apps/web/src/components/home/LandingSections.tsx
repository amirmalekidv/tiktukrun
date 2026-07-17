'use client'

import useSWR from 'swr'
import { getLandingSections } from '@/lib/api'
import SectionStrip from './SectionStrip'

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

  if (sections.length === 0) return null

  return (
    <div className="border-t border-white/10 my-4">
      {sections.map((section) => (
        <SectionStrip
          key={section.key}
          sectionKey={section.key}
          title={section.title}
          icon={section.icon}
          games={section.games}
        />
      ))}
    </div>
  )
}
