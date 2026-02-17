import type { OwnerCapability } from '@/core/auth/types'
import { capabilityAllowsStation } from '@/core/auth/rbac'
import type { ChargingSession, Station } from '@/core/api/types'

export type OwnerReportRange = '7d' | '30d' | '90d' | 'YTD' | 'ALL'

export interface OwnerReportChartPoint {
  date: string
  name: string
  revenue: number
  utilization: number
  sessions: number
}

export interface OwnerReportMetrics {
  range: OwnerReportRange
  chartData: OwnerReportChartPoint[]
  summary: {
    averageRevenuePerDay: number
    averageRevenueDeltaPct: number | null
    busiestHour: string
    busiestHourSessions: number
    energyReliabilityPct: number | null
    energyReliabilityLabel: 'Nominal' | 'Stable' | 'Needs Attention' | 'N/A'
    churnRiskLabel: 'Low' | 'Medium' | 'High' | 'N/A'
    churnDeltaPct: number | null
  }
  forecast: {
    estimatedMonthlyClose: number
    deltaPct: number | null
    trend: 'up' | 'down' | 'flat'
  }
  heatmap: Array<{ label: string; value: number }>
  exportRows: Array<Record<string, string | number>>
  filteredSessions: ChargingSession[]
  totalRevenue: number
  totalSessions: number
  windowStart: string
  windowEnd: string
  hasData: boolean
}

type RangeWindow = {
  start: Date
  end: Date
  previousStart: Date | null
  previousEnd: Date | null
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0)
}

function endOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999)
}

function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1, 0, 0, 0, 0)
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

function dateKey(value: Date): string {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatLabel(value: Date, range: OwnerReportRange): string {
  if (range === '7d') {
    return value.toLocaleDateString('en-US', { weekday: 'short' })
  }
  return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function toDate(value?: string): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function inWindow(value: Date, start: Date, end: Date): boolean {
  return value.getTime() >= start.getTime() && value.getTime() <= end.getTime()
}

function sumRevenue(sessions: ChargingSession[]): number {
  return sessions.reduce((acc, session) => acc + (session.cost ?? 0), 0)
}

function countDays(start: Date, end: Date): number {
  return Math.max(1, Math.floor((startOfDay(end).getTime() - startOfDay(start).getTime()) / MS_PER_DAY) + 1)
}

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0
    return null
  }
  return ((current - previous) / previous) * 100
}

function riskFromDelta(delta: number | null, currentUsers: number, previousUsers: number): 'Low' | 'Medium' | 'High' | 'N/A' {
  if (currentUsers === 0 && previousUsers === 0) return 'N/A'
  if (delta == null) return 'Low'
  if (delta <= -25) return 'High'
  if (delta <= -10) return 'Medium'
  return 'Low'
}

function reliabilityLabel(value: number | null): 'Nominal' | 'Stable' | 'Needs Attention' | 'N/A' {
  if (value == null) return 'N/A'
  if (value >= 99) return 'Nominal'
  if (value >= 95) return 'Stable'
  return 'Needs Attention'
}

function resolveWindow(range: OwnerReportRange, sessions: ChargingSession[], now: Date): RangeWindow {
  const end = endOfDay(now)

  if (range === 'ALL') {
    const parsedDates = sessions
      .map((session) => toDate(session.startedAt))
      .filter((value): value is Date => value != null)
    const earliest = parsedDates.length > 0
      ? parsedDates.reduce((min, current) => (current.getTime() < min.getTime() ? current : min))
      : now

    return {
      start: startOfDay(earliest),
      end,
      previousStart: null,
      previousEnd: null,
    }
  }

  let start: Date

  if (range === 'YTD') {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
  } else {
    const spanDays = range === '30d' ? 30 : range === '90d' ? 90 : 7
    start = startOfDay(addDays(now, -(spanDays - 1)))
  }

  const days = countDays(start, end)
  const previousEnd = endOfDay(addDays(start, -1))
  const previousStart = startOfDay(addDays(previousEnd, -(days - 1)))

  return {
    start,
    end,
    previousStart,
    previousEnd,
  }
}

function buildBuckets(start: Date, end: Date, range: OwnerReportRange): OwnerReportChartPoint[] {
  const buckets: OwnerReportChartPoint[] = []
  let cursor = startOfDay(start)
  const boundary = startOfDay(end)

  while (cursor.getTime() <= boundary.getTime()) {
    buckets.push({
      date: dateKey(cursor),
      name: formatLabel(cursor, range),
      revenue: 0,
      utilization: 0,
      sessions: 0,
    })
    cursor = addDays(cursor, 1)
  }

  return buckets
}

function formatHour(hour: number): string {
  const next = (hour + 1) % 24
  return `${String(hour).padStart(2, '0')}:00 - ${String(next).padStart(2, '0')}:00`
}

function filterByCapability(
  sessions: ChargingSession[],
  stations: Station[],
  capability: OwnerCapability | undefined
): { sessions: ChargingSession[]; scopedStations: Station[] } {
  if (stations.length === 0) {
    return { sessions, scopedStations: [] }
  }

  const stationById = new Map(stations.map((station) => [station.id, station]))
  const scopedStations = stations.filter((station) => capabilityAllowsStation(capability, station.type))

  const filteredSessions = sessions.filter((session) => {
    const station = stationById.get(session.stationId)
    if (!station) return true
    return capabilityAllowsStation(capability, station.type)
  })

  return {
    sessions: filteredSessions,
    scopedStations,
  }
}

export function emptyOwnerReportMetrics(range: OwnerReportRange, now: Date = new Date()): OwnerReportMetrics {
  const window = resolveWindow(range, [], now)
  const chartData = buildBuckets(window.start, window.end, range)

  return {
    range,
    chartData,
    summary: {
      averageRevenuePerDay: 0,
      averageRevenueDeltaPct: null,
      busiestHour: 'N/A',
      busiestHourSessions: 0,
      energyReliabilityPct: null,
      energyReliabilityLabel: 'N/A',
      churnRiskLabel: 'N/A',
      churnDeltaPct: null,
    },
    forecast: {
      estimatedMonthlyClose: 0,
      deltaPct: null,
      trend: 'flat',
    },
    heatmap: [
      { label: 'Returning Customers', value: 0 },
      { label: 'Repeat Sessions', value: 0 },
      { label: 'Active Stations', value: 0 },
    ],
    exportRows: [],
    filteredSessions: [],
    totalRevenue: 0,
    totalSessions: 0,
    windowStart: window.start.toISOString(),
    windowEnd: window.end.toISOString(),
    hasData: false,
  }
}

export function buildOwnerReportMetrics(input: {
  sessions: ChargingSession[]
  stations?: Station[]
  range: OwnerReportRange
  capability?: OwnerCapability
  now?: Date
}): OwnerReportMetrics {
  const now = input.now ?? new Date()
  const stations = input.stations ?? []

  const { sessions: capabilityFiltered, scopedStations } = filterByCapability(
    input.sessions,
    stations,
    input.capability
  )

  const window = resolveWindow(input.range, capabilityFiltered, now)

  const currentSessions = capabilityFiltered.filter((session) => {
    const startedAt = toDate(session.startedAt)
    return startedAt ? inWindow(startedAt, window.start, window.end) : false
  })

  const previousSessions = (window.previousStart && window.previousEnd)
    ? capabilityFiltered.filter((session) => {
      const startedAt = toDate(session.startedAt)
      return startedAt ? inWindow(startedAt, window.previousStart as Date, window.previousEnd as Date) : false
    })
    : []

  const chartData = buildBuckets(window.start, window.end, input.range)
  const byDay = new Map(chartData.map((point) => [point.date, point]))

  currentSessions.forEach((session) => {
    const startedAt = toDate(session.startedAt)
    if (!startedAt) return
    const key = dateKey(startedAt)
    const bucket = byDay.get(key)
    if (!bucket) return
    bucket.revenue += session.cost ?? 0
    bucket.sessions += 1
  })

  const maxSessions = chartData.reduce((max, point) => Math.max(max, point.sessions), 0)
  chartData.forEach((point) => {
    point.utilization = maxSessions > 0 ? Math.round((point.sessions / maxSessions) * 100) : 0
  })

  const daysInCurrentWindow = countDays(window.start, window.end)
  const totalRevenue = sumRevenue(currentSessions)
  const averageRevenuePerDay = totalRevenue / daysInCurrentWindow

  const previousRevenue = sumRevenue(previousSessions)
  const previousDays = window.previousStart && window.previousEnd
    ? countDays(window.previousStart, window.previousEnd)
    : daysInCurrentWindow
  const previousAverageRevenue = previousRevenue / previousDays
  const averageRevenueDeltaPct = percentDelta(averageRevenuePerDay, previousAverageRevenue)

  const sessionsByHour = new Array<number>(24).fill(0)
  currentSessions.forEach((session) => {
    const startedAt = toDate(session.startedAt)
    if (!startedAt) return
    sessionsByHour[startedAt.getHours()] += 1
  })

  let busiestHour = 0
  let busiestHourSessions = 0
  sessionsByHour.forEach((count, hour) => {
    if (count > busiestHourSessions) {
      busiestHour = hour
      busiestHourSessions = count
    }
  })

  const completedSessions = currentSessions.filter((session) => session.status === 'COMPLETED').length
  const energyReliabilityPct = currentSessions.length > 0
    ? (completedSessions / currentSessions.length) * 100
    : null
  const energyReliabilityValue = energyReliabilityPct == null
    ? null
    : Number(energyReliabilityPct.toFixed(2))

  const currentUsers = new Set(currentSessions.map((session) => session.userId).filter(Boolean))
  const previousUsers = new Set(previousSessions.map((session) => session.userId).filter(Boolean))
  const churnDeltaPct = percentDelta(currentUsers.size, previousUsers.size)
  const churnRiskLabel = riskFromDelta(churnDeltaPct, currentUsers.size, previousUsers.size)

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const estimatedMonthlyClose = averageRevenuePerDay * daysInMonth
  const previousEstimatedMonthlyClose = previousAverageRevenue * daysInMonth
  const forecastDeltaPct = percentDelta(estimatedMonthlyClose, previousEstimatedMonthlyClose)
  const forecastTrend = forecastDeltaPct == null
    ? 'flat'
    : forecastDeltaPct > 0
      ? 'up'
      : forecastDeltaPct < 0
        ? 'down'
        : 'flat'

  const sessionsByUser = new Map<string, number>()
  currentSessions.forEach((session) => {
    if (!session.userId) return
    sessionsByUser.set(session.userId, (sessionsByUser.get(session.userId) ?? 0) + 1)
  })
  const returningUsers = Array.from(sessionsByUser.values()).filter((count) => count > 1).length
  const repeatSessions = Array.from(sessionsByUser.values()).reduce((acc, count) => acc + Math.max(count - 1, 0), 0)
  const returningCustomersPct = sessionsByUser.size > 0
    ? Math.round((returningUsers / sessionsByUser.size) * 100)
    : 0
  const repeatSessionsPct = currentSessions.length > 0
    ? Math.round((repeatSessions / currentSessions.length) * 100)
    : 0

  const activeStationIds = new Set(currentSessions.map((session) => session.stationId).filter(Boolean))
  const activeStationsPct = scopedStations.length > 0
    ? Math.round((activeStationIds.size / scopedStations.length) * 100)
    : activeStationIds.size > 0
      ? 100
      : 0

  const exportRows = [...currentSessions]
    .sort((a, b) => {
      const aDate = toDate(a.startedAt)?.getTime() ?? 0
      const bDate = toDate(b.startedAt)?.getTime() ?? 0
      return bDate - aDate
    })
    .map((session) => ({
      ID: session.id,
      Date: toDate(session.startedAt)?.toLocaleDateString() ?? 'Unknown',
      Station: session.stationName || session.stationId || 'Unknown',
      User: session.userName || session.userId || 'Unknown',
      Energy_kWh: Number((session.energyDelivered ?? 0).toFixed(3)),
      Total_Amount: Number((session.cost ?? 0).toFixed(2)),
      Duration_Minutes: session.durationMinutes ?? 0,
      Status: session.status,
    }))

  return {
    range: input.range,
    chartData,
    summary: {
      averageRevenuePerDay,
      averageRevenueDeltaPct,
      busiestHour: busiestHourSessions > 0 ? formatHour(busiestHour) : 'N/A',
      busiestHourSessions,
      energyReliabilityPct: energyReliabilityValue,
      energyReliabilityLabel: reliabilityLabel(energyReliabilityValue),
      churnRiskLabel,
      churnDeltaPct,
    },
    forecast: {
      estimatedMonthlyClose,
      deltaPct: forecastDeltaPct,
      trend: forecastTrend,
    },
    heatmap: [
      { label: 'Returning Customers', value: returningCustomersPct },
      { label: 'Repeat Sessions', value: repeatSessionsPct },
      { label: 'Active Stations', value: activeStationsPct },
    ],
    exportRows,
    filteredSessions: currentSessions,
    totalRevenue,
    totalSessions: currentSessions.length,
    windowStart: window.start.toISOString(),
    windowEnd: window.end.toISOString(),
    hasData: currentSessions.length > 0,
  }
}
