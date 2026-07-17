import type { Branch } from '@/types'

interface BranchMapProps {
  branch: Branch
  className?: string
}

function getCoordinate(value: unknown, min: number, max: number) {
  if (value === undefined || value === null || value === '') return undefined
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) && num >= min && num <= max ? num : undefined
}

function buildEmbedUrl(lat: number, lng: number) {
  const delta = 0.004
  const params = new URLSearchParams({
    bbox: `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`,
    layer: 'mapnik',
    marker: `${lat},${lng}`,
  })

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`
}

function buildOpenUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
}

export default function BranchMap({ branch, className = '' }: BranchMapProps) {
  const lat = getCoordinate(branch.lat, -90, 90)
  const lng = getCoordinate(branch.lng, -180, 180)
  const hasCoordinates = lat !== undefined && lng !== undefined

  return (
    <section className={`dark-card rounded-2xl p-4 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">{branch.name}</h2>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-400">{branch.address}</p>
        </div>
        <i className="fas fa-map-marker-alt mt-0.5 text-lg text-[#00f5ff]" />
      </div>

      {hasCoordinates ? (
        <>
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
            <iframe
              title={`موقعیت ${branch.name}`}
              src={buildEmbedUrl(lat, lng)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full border-0"
            />
            <div className="pointer-events-none absolute bottom-2 right-2 rounded-lg border border-black/20 bg-black/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </div>
          </div>
          <a
            href={buildOpenUrl(lat, lng)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#00f5ff] transition-colors hover:text-white"
          >
            <i className="fas fa-location-arrow" />
            باز کردن نقشه
          </a>
        </>
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 p-4 text-center text-sm leading-6 text-gray-400">
          موقعیت دقیق این شعبه هنوز ثبت نشده است.
        </div>
      )}
    </section>
  )
}
