import { useState, useMemo, useEffect, useRef } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import * as d3Geo from 'd3-geo'
import * as d3Zoom from 'd3-zoom'
import 'd3-transition'
import { select } from 'd3-selection'
import { feature } from 'topojson-client'
import countries110m from 'world-atlas/countries-110m.json'

/* ─────────────────────────────────────────────────────────────────────────────
   Station Map — Owner/Operator station map view with interactive world map
   RBAC: Owners, Operators, Site Owners
───────────────────────────────────────────────────────────────────────────── */

type StationStatus = 'Active' | 'Paused' | 'Offline' | 'Maintenance'

interface Station {
  id: string
  name: string
  city: string
  country: string
  countryCode: string
  status: StationStatus
  kW: number
  connector: string
  address: string
  lat: number
  lng: number
}

const MOCK_STATIONS: Station[] = [
  { id: 'st-101', name: 'City Mall Roof', city: 'Kampala', country: 'Uganda', countryCode: '800', status: 'Active', kW: 250, connector: 'CCS2', address: 'Plot 7 Jinja Rd', lat: 0.3476, lng: 32.5825 },
  { id: 'st-102', name: 'Tech Park A', city: 'Entebbe', country: 'Uganda', countryCode: '800', status: 'Paused', kW: 150, connector: 'Type 2', address: 'Block 4', lat: 0.0630, lng: 32.4631 },
  { id: 'st-103', name: 'Airport East', city: 'Nairobi', country: 'Kenya', countryCode: '404', status: 'Active', kW: 300, connector: 'CCS2', address: 'Terminal C', lat: -1.2864, lng: 36.8172 },
  { id: 'st-104', name: 'Central Hub', city: 'Dar es Salaam', country: 'Tanzania', countryCode: '834', status: 'Active', kW: 200, connector: 'CHAdeMO', address: 'Industrial Area', lat: -6.7924, lng: 39.2083 },
  { id: 'st-105', name: 'Business Park', city: 'Berlin', country: 'Germany', countryCode: '276', status: 'Maintenance', kW: 180, connector: 'CCS2', address: 'Building 5', lat: 52.5200, lng: 13.4050 },
]

export function StationMap() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'OWNER'
  const canView = hasPermission(role, 'stations', 'view')

  const [q, setQ] = useState('')
  const [countryFilter, setCountryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [connectorFilter, setConnectorFilter] = useState('All')
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const gRef = useRef<SVGGElement>(null)

  const worldData = useMemo(() => {
    try {
      const topo = countries110m as any
      const data = feature(topo, topo.objects.countries) as any
      return data
    } catch (error) {
      console.error('StationMap: Error loading world data', error)
      return null
    }
  }, [])

  const filtered = useMemo(() =>
    MOCK_STATIONS
      .filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.address.toLowerCase().includes(q.toLowerCase()))
      .filter(s => countryFilter === 'All' || s.country === countryFilter)
      .filter(s => statusFilter === 'All' || s.status === statusFilter)
      .filter(s => connectorFilter === 'All' || s.connector === connectorFilter)
    , [q, countryFilter, statusFilter, connectorFilter])

  const countriesList = useMemo(() =>
    Array.from(new Set(MOCK_STATIONS.map(s => s.country))).sort()
    , [])

  const stationsByCountry = useMemo(() => {
    const map = new Map<string, number>()
    MOCK_STATIONS.forEach(s => {
      map.set(s.countryCode, (map.get(s.countryCode) || 0) + 1)
    })
    return map
  }, [])

  const resetZoom = () => {
    if (!svgRef.current) return
    select(svgRef.current)
      .transition()
      .duration(750)
      .call((d3Zoom.zoom() as any).transform, d3Zoom.zoomIdentity)
  }

  const handleCountryClick = (f: any, projection: any) => {
    if (!svgRef.current) return
    const svg = select(svgRef.current)
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight
    const path = d3Geo.geoPath().projection(projection)
    const bounds = path.bounds(f)
    const dx = bounds[1][0] - bounds[0][0]
    const dy = bounds[1][1] - bounds[0][1]
    const x = (bounds[0][0] + bounds[1][0]) / 2
    const y = (bounds[0][1] + bounds[1][1]) / 2
    const scale = Math.max(1, Math.min(15, 0.9 / Math.max(dx / width, dy / height)))
    const translate = [width / 2 - scale * x, height / 2 - scale * y]

    svg.transition().duration(750).call(
      (d3Zoom.zoom() as any).transform,
      d3Zoom.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    )
  }

  useEffect(() => {
    if (!worldData || !svgRef.current || !containerRef.current) return

    const updateMap = () => {
      if (!svgRef.current || !containerRef.current) return
      const width = containerRef.current.clientWidth || 800
      const height = containerRef.current.clientHeight || 500

      const svg = select(svgRef.current)
      svg.selectAll('*').remove()
      svg.attr('width', width).attr('height', height)

      const projection = d3Geo.geoNaturalEarth1().fitSize([width, height], worldData)
      const path = d3Geo.geoPath().projection(projection)

      const g = svg.append('g')

      const zoom = d3Zoom.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 15])
        .on('zoom', (event) => {
          g.attr('transform', event.transform)
          setIsZoomed(event.transform.k !== 1 || event.transform.x !== 0 || event.transform.y !== 0)
        })
      svg.call(zoom)

      g.selectAll('path.country')
        .data(worldData.features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path as any)
        .attr('fill', (d: any) => {
          const id = String(d.id)
          if (stationsByCountry.has(id)) return '#03cd8c'
          return '#e5e7eb'
        })
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          event.stopPropagation()
          handleCountryClick(d, projection)
        })

      g.selectAll('circle.station')
        .data(filtered)
        .enter()
        .append('circle')
        .attr('cx', d => projection([d.lng, d.lat])?.[0] ?? 0)
        .attr('cy', d => projection([d.lng, d.lat])?.[1] ?? 0)
        .attr('r', 4)
        .attr('fill', d => {
          if (d.status === 'Active') return '#03cd8c'
          if (d.status === 'Paused') return '#f59e0b'
          if (d.status === 'Offline') return '#ef4444'
          return '#3b82f6'
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
    }

    updateMap()
    window.addEventListener('resize', updateMap)
    return () => window.removeEventListener('resize', updateMap)
  }, [worldData, filtered, stationsByCountry])

  if (!canView) return <div className="p-8 text-center">No permission.</div>

  const avgHealth = Math.round((filtered.filter(s => s.status === 'Active').length / filtered.length) * 100) || 0
  const openIncidents = filtered.filter(s => s.status === 'Offline').length

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-bg-secondary border border-border-light rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text">Stations Map</h1>
          <p className="text-sm text-muted">{filtered.length} stations</p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-xs text-muted uppercase">Avg Health</div>
            <div className="text-lg font-bold text-ok">{avgHealth}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted uppercase">Incidents</div>
            <div className="text-lg font-bold text-danger">{openIncidents}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <aside className="card p-4 space-y-4 h-fit">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search..."
            className="input w-full"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} className="select">
              <option value="All">All Countries</option>
              {countriesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select">
              <option value="All">All Status</option>
              {['Active', 'Paused', 'Offline', 'Maintenance'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {filtered.map(s => (
              <li
                key={s.id}
                className="p-3 border border-border-light rounded-lg hover:border-accent/40 cursor-pointer"
                onClick={() => setSelectedStation(s.id)}
              >
                <div className="flex justify-between font-medium text-sm">
                  <span>{s.name}</span>
                  <span className={s.status === 'Active' ? 'text-ok' : 'text-danger'}>{s.status}</span>
                </div>
                <div className="text-xs text-muted mt-1">{s.city}, {s.country}</div>
              </li>
            ))}
          </ul>
        </aside>

        <section ref={containerRef} className="card p-2 min-h-[500px] relative bg-[#f1f5f9] dark:bg-[#0f172a] overflow-hidden">
          {isZoomed && (
            <button
              onClick={resetZoom}
              className="absolute top-4 right-4 z-10 text-[10px] font-bold px-2 py-1 rounded-md bg-white/5 border border-white/10 text-muted hover:text-text backdrop-blur-sm"
            >
              Reset Zoom
            </button>
          )}
          <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        </section>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: StationStatus }) {
  const colors: Record<StationStatus, string> = {
    Active: 'bg-ok/20 text-ok',
    Paused: 'bg-warn/20 text-warn',
    Offline: 'bg-danger/20 text-danger',
    Maintenance: 'bg-info/20 text-info',
  }
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${colors[status]}`}>{status}</span>
}

export default StationMap
