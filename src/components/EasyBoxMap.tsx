import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import type { EasyBox } from '../types'

interface EasyBoxMapProps {
  /** The full list of pickup points (from the backend/SameDay, or the demo list). */
  boxes: EasyBox[]
  /** Currently selected EasyBox id ('' = none). */
  selectedId: string
  /** Called when the user picks a box — keep state in sync with the dropdown. */
  onSelect: (id: string) => void
  loading?: boolean
}

/** Brand-oxblood marker dot (avoids bundling Leaflet's default PNG icons). */
function makeIcon(active: boolean) {
  return L.divIcon({
    className: '',
    html: `<span class="libraria-marker ${active ? 'libraria-marker--active' : ''}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  })
}

/**
 * Interactive map of SameDay EasyBox pickup points.
 *
 * Renders every box that carries `{ lat, lng }` as a clickable marker on a real
 * Leaflet + OpenStreetMap map (free, no API key). Picking a marker calls
 * `onSelect(id)` — the exact same state the <select> dropdown and the city list
 * below drive, so the map, dropdown and list stay perfectly in sync.
 *
 * The map auto-fits to the full set of boxes on load and pans/zooms to the
 * selected box whenever `selectedId` changes (e.g. the user picks it from the
 * dropdown). Below the map an always-visible, city-grouped list serves as an
 * accessible fallback.
 */
export function EasyBoxMap({ boxes, selectedId, onSelect, loading = false }: EasyBoxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const fittedRef = useRef(false)

  const markers = useMemo(
    () => boxes.filter((b) => b.lat !== undefined && b.lng !== undefined),
    [boxes],
  )

  // Group boxes by city so the fallback list stays useful.
  const byCity = useMemo(() => {
    const map = new Map<string, EasyBox[]>()
    for (const b of boxes) {
      const city = b.city || 'Altele'
      const group = map.get(city)
      if (group) group.push(b)
      else map.set(city, [b])
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ro'))
  }, [boxes])

  // Create the Leaflet map once and tear it down on unmount.
  useEffect(() => {
    if (!containerRef.current) return
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, [])


  // Sync markers (add/remove) whenever the box list changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const seen = new Set<string>()
    for (const b of markers) {
      seen.add(b.id)
      let marker = markersRef.current.get(b.id)
      if (!marker) {
        marker = L.marker([b.lat!, b.lng!], {
          icon: makeIcon(b.id === selectedId),
          title: b.name,
        })
        marker.bindPopup(`<strong>${b.name}</strong><br/>${b.address}`)
        marker.on('click', () => onSelect(b.id))
        marker.addTo(map)
        markersRef.current.set(b.id, marker)
      } else {
        marker.bindPopup(`<strong>${b.name}</strong><br/>${b.address}`)
      }
    }

    // Remove markers for boxes that disappeared.
    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    }

    // Center/zoom on the whole bounding box the first time boxes appear.
    if (markers.length > 0 && !fittedRef.current) {
      const group = L.featureGroup([...markersRef.current.values()])
      map.fitBounds(group.getBounds(), { padding: [28, 28], maxZoom: 12 })
      fittedRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers])

  // Pan/zoom to + highlight the selected box (from the dropdown or the list).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const marker = markersRef.current.get(selectedId)
    if (!marker) return
    map.panTo(marker.getLatLng())
    if (map.getZoom() < 14) map.setZoom(14)
    for (const [id, m] of markersRef.current) {
      m.setIcon(makeIcon(id === selectedId))
    }
    marker.openPopup()
  }, [selectedId])

  // Keep the active marker style in sync when boxes load/replace.
  useEffect(() => {
    for (const [id, m] of markersRef.current) {
      m.setIcon(makeIcon(id === selectedId))
    }
  }, [selectedId, markers])

  return (
    <div className="overflow-hidden rounded-sm border border-ink/15">
      <div
        ref={containerRef}
        className="relative z-0 h-64 w-full bg-[#e9e4da] md:h-80"
        aria-label="Harta punctelor EasyBox SameDay din România"
      >
        {loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#f5f0e6]/70">
            <span className="text-sm uppercase tracking-[0.2em] text-ink-muted">
              Se încarcă punctele…
            </span>
          </div>
        )}
      </div>

      {/* Fallback interactive list grouped by city — doubles as the picker. */}
      <div className="max-h-72 overflow-y-auto border-t border-ink/10 bg-paper-50">
        {byCity.length === 0 ? (
          <p className="p-4 text-sm text-ink-muted">Niciun punct de preluare disponibil.</p>
        ) : (
          byCity.map(([city, cityBoxes]) => (
            <div key={city} className="border-b border-ink/5 last:border-b-0">
              <div className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
                <span>{city}</span>
                <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[0.65rem] text-ink">
                  {cityBoxes.length}
                </span>
              </div>
              <ul className="px-2 pb-2">
                {cityBoxes.map((b) => {
                  const active = b.id === selectedId
                  return (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(active ? '' : b.id)}
                        aria-pressed={active}
                        className={`flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors ${
                          active ? 'bg-[#642A2E]/10 font-medium text-[#642A2E]' : 'text-ink hover:bg-ink/5'
                        }`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            active ? 'bg-[#642A2E]' : 'bg-ink/30'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="leading-snug">
                          <span className="block font-medium">{b.name}</span>
                          <span className="block text-xs text-ink-muted">{b.address}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
