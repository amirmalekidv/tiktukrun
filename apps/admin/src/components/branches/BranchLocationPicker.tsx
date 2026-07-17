'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, LocateFixed, MapPin, Minus, Plus } from 'lucide-react';

interface BranchLocationPickerProps {
  lat?: number | null;
  lng?: number | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

interface Size {
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

const TILE_SIZE = 256;
const DEFAULT_CENTER = { lat: 35.6892, lng: 51.389 };
const DEFAULT_ZOOM = 12;
const MIN_ZOOM = 3;
const MAX_ZOOM = 18;

function isValidCoord(lat?: number | null, lng?: number | null) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function latLngToWorld(lat: number, lng: number, zoom: number): Point {
  const scale = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((clamp(lat, -85.05112878, 85.05112878) * Math.PI) / 180);

  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function worldToLatLng(x: number, y: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));

  return {
    lat: clamp(lat, -90, 90),
    lng: ((((lng + 180) % 360) + 360) % 360) - 180,
  };
}

function wrapTileX(x: number, max: number) {
  return ((x % max) + max) % max;
}

export default function BranchLocationPicker({
  lat,
  lng,
  onChange,
  className = '',
}: BranchLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startClient: Point;
    startCenterWorld: Point;
    moved: boolean;
  } | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [center, setCenter] = useState(isValidCoord(lat, lng) ? { lat: lat!, lng: lng! } : DEFAULT_CENTER);

  const hasLocation = isValidCoord(lat, lng);

  useEffect(() => {
    if (isValidCoord(lat, lng)) {
      setCenter({ lat: lat!, lng: lng! });
    }
  }, [lat, lng]);

  useEffect(() => {
    const node = mapRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      const rect = entry.contentRect;
      setSize({ width: rect.width, height: rect.height });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const centerWorld = useMemo(
    () => latLngToWorld(center.lat, center.lng, zoom),
    [center.lat, center.lng, zoom],
  );

  const topLeft = useMemo(
    () => ({
      x: centerWorld.x - size.width / 2,
      y: centerWorld.y - size.height / 2,
    }),
    [centerWorld.x, centerWorld.y, size.height, size.width],
  );

  const tiles = useMemo(() => {
    if (!size.width || !size.height) return [];

    const maxTiles = 2 ** zoom;
    const minTileX = Math.floor(topLeft.x / TILE_SIZE);
    const maxTileX = Math.floor((topLeft.x + size.width) / TILE_SIZE);
    const minTileY = clamp(Math.floor(topLeft.y / TILE_SIZE), 0, maxTiles - 1);
    const maxTileY = clamp(Math.floor((topLeft.y + size.height) / TILE_SIZE), 0, maxTiles - 1);
    const result: Array<{ key: string; url: string; left: number; top: number }> = [];

    for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
      for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
        const wrappedX = wrapTileX(tileX, maxTiles);
        result.push({
          key: `${zoom}-${tileX}-${tileY}`,
          url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${tileY}.png`,
          left: tileX * TILE_SIZE - topLeft.x,
          top: tileY * TILE_SIZE - topLeft.y,
        });
      }
    }

    return result;
  }, [size.height, size.width, topLeft.x, topLeft.y, zoom]);

  const markerPosition = useMemo(() => {
    if (!hasLocation) return null;
    const point = latLngToWorld(lat!, lng!, zoom);
    return {
      x: point.x - topLeft.x,
      y: point.y - topLeft.y,
    };
  }, [hasLocation, lat, lng, topLeft.x, topLeft.y, zoom]);

  const selectAtPoint = (clientX: number, clientY: number) => {
    const node = mapRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const worldPoint = {
      x: topLeft.x + clientX - rect.left,
      y: topLeft.y + clientY - rect.top,
    };
    const coords = worldToLatLng(worldPoint.x, worldPoint.y, zoom);

    onChange({
      lat: Number(coords.lat.toFixed(7)),
      lng: Number(coords.lng.toFixed(7)),
    });
  };

  const updateZoom = (nextZoom: number) => {
    setZoom(clamp(nextZoom, MIN_ZOOM, MAX_ZOOM));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="label-field mb-1">موقعیت روی نقشه</label>
          <p className="text-xs text-slate-500">برای ثبت یا جابه‌جایی پین، روی نقطه دقیق شعبه کلیک کنید.</p>
        </div>
        <button
          type="button"
          onClick={() => setCenter(hasLocation ? { lat: lat!, lng: lng! } : DEFAULT_CENTER)}
          className="btn-secondary shrink-0 px-3"
          title="مرکز کردن نقشه"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
      </div>

      <div
        ref={mapRef}
        className="relative aspect-square w-full select-none overflow-hidden rounded-xl border border-slate-600/60 bg-slate-950"
        role="application"
        aria-label="انتخاب موقعیت شعبه روی نقشه"
        onPointerDown={(event) => {
          const node = mapRef.current;
          if (!node) return;
          node.setPointerCapture(event.pointerId);
          dragRef.current = {
            pointerId: event.pointerId,
            startClient: { x: event.clientX, y: event.clientY },
            startCenterWorld: centerWorld,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;

          const dx = event.clientX - drag.startClient.x;
          const dy = event.clientY - drag.startClient.y;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;

          const nextCenter = worldToLatLng(
            drag.startCenterWorld.x - dx,
            drag.startCenterWorld.y - dy,
            zoom,
          );
          setCenter(nextCenter);
        }}
        onPointerUp={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;

          dragRef.current = null;
          if (!drag.moved) {
            selectAtPoint(event.clientX, event.clientY);
          }
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          selectAtPoint(event.clientX, event.clientY);
          updateZoom(zoom + 1);
        }}
      >
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            draggable={false}
            className="absolute h-64 w-64 max-w-none"
            style={{ left: tile.left, top: tile.top }}
          />
        ))}

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(15,23,42,0.06)_68%,rgba(15,23,42,0.28)_100%)]" />

        {markerPosition && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
            style={{ left: markerPosition.x, top: markerPosition.y }}
          >
            <MapPin className="h-9 w-9 fill-red-500 text-white drop-shadow-[0_8px_18px_rgba(0,0,0,0.75)]" />
          </div>
        )}

        {!hasLocation && (
          <div className="pointer-events-none absolute inset-x-4 top-4 rounded-lg border border-cyan-400/30 bg-slate-950/85 px-3 py-2 text-center text-xs text-cyan-100 shadow-lg">
            هنوز پینی انتخاب نشده است.
          </div>
        )}

        <div
          className="absolute left-3 top-3 flex flex-col overflow-hidden rounded-lg border border-slate-600 bg-slate-900/90 shadow-lg"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => updateZoom(zoom + 1)}
            className="p-2 text-slate-100 transition hover:bg-slate-700"
            title="بزرگ‌نمایی"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => updateZoom(zoom - 1)}
            className="border-t border-slate-600 p-2 text-slate-100 transition hover:bg-slate-700"
            title="کوچک‌نمایی"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg border border-slate-700 bg-slate-950/90 px-2 py-1 text-[10px] text-slate-300">
          <Crosshair className="ml-1 inline h-3 w-3 text-cyan-300" />
          {hasLocation ? `${lat!.toFixed(6)}, ${lng!.toFixed(6)}` : 'بدون پین'}
        </div>
      </div>
    </div>
  );
}
