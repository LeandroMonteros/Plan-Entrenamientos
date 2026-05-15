import { readFileSync } from 'fs'
import { XMLParser } from 'fast-xml-parser'
import log from 'electron-log'
import { MAX_FILE_SIZE_BYTES } from '@shared/constants'
import type { ParsedActivity, ParsedPoint } from './fitParser'

export async function parseGpxFile(filePath: string): Promise<ParsedActivity> {
  const fs = await import('fs')
  const stat = fs.statSync(filePath)
  if (stat.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Archivo demasiado grande (máximo ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB)`)
  }

  const content = readFileSync(filePath, 'utf-8')
  if (!content.trimStart().startsWith('<?xml') && !content.trimStart().startsWith('<gpx')) {
    throw new Error('Archivo .GPX inválido: no es XML válido')
  }

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
    })

    const result = parser.parse(content)
    return extractGpxData(result)
  } catch (err) {
    log.error('GPX parser error:', err)
    throw new Error('No se pudo parsear el archivo .GPX')
  }
}

function extractGpxData(data: Record<string, unknown>): ParsedActivity {
  const gpx = (data.gpx as Record<string, unknown>) || {}
  const trk = Array.isArray(gpx.trk) ? gpx.trk[0] : (gpx.trk as Record<string, unknown>) || {}
  const trkseg = Array.isArray(trk.trkseg)
    ? trk.trkseg[0]
    : (trk.trkseg as Record<string, unknown>) || {}
  const trkpts = (
    Array.isArray(trkseg.trkpt) ? trkseg.trkpt : [trkseg.trkpt]
  ).filter(Boolean) as Record<string, unknown>[]

  const points: ParsedPoint[] = trkpts.map((pt) => {
    const ext = (pt.extensions as Record<string, unknown>) || {}
    const tpx = (ext['gpxtpx:TrackPointExtension'] as Record<string, unknown>) ||
      (ext['ns3:TrackPointExtension'] as Record<string, unknown>) || {}

    return {
      timestamp: String(pt.time || new Date().toISOString()),
      latitude: toNumber(pt['@_lat']),
      longitude: toNumber(pt['@_lon']),
      altitudeM: toNumber(pt.ele),
      heartRate: toNumber(tpx['gpxtpx:hr'] ?? tpx['ns3:hr'] ?? ext.hr),
      cadence: toNumber(tpx['gpxtpx:cad'] ?? tpx['ns3:cad']),
      speedMs: null,
      distanceMeters: null,
    }
  })

  // Calculate metrics from track points
  let totalDistanceM = 0
  let totalElevationGain = 0
  let totalElevationLoss = 0
  let hrSum = 0
  let hrCount = 0
  let maxHr = 0

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]

    if (prev.latitude && curr.latitude && prev.longitude && curr.longitude) {
      totalDistanceM += haversineMeters(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
    }

    if (prev.altitudeM != null && curr.altitudeM != null) {
      const diff = curr.altitudeM - prev.altitudeM
      if (diff > 0) totalElevationGain += diff
      else totalElevationLoss += Math.abs(diff)
    }

    if (curr.heartRate) {
      hrSum += curr.heartRate
      hrCount++
      if (curr.heartRate > maxHr) maxHr = curr.heartRate
    }
  }

  let durationSeconds: number | null = null
  if (points.length >= 2) {
    const start = new Date(points[0].timestamp).getTime()
    const end = new Date(points[points.length - 1].timestamp).getTime()
    durationSeconds = Math.round((end - start) / 1000)
  }

  const avgSpeedKmh =
    totalDistanceM > 0 && durationSeconds && durationSeconds > 0
      ? (totalDistanceM / 1000) / (durationSeconds / 3600)
      : null
  const avgPaceMinKm = avgSpeedKmh && avgSpeedKmh > 0 ? 60 / avgSpeedKmh : null

  return {
    startedAt: points[0]?.timestamp ?? null,
    durationSeconds,
    distanceMeters: totalDistanceM > 0 ? totalDistanceM : null,
    avgPaceMinKm,
    avgSpeedKmh,
    avgHeartRate: hrCount > 0 ? Math.round(hrSum / hrCount) : null,
    maxHeartRate: maxHr > 0 ? maxHr : null,
    avgCadence: null,
    elevationGainM: totalElevationGain > 0 ? Math.round(totalElevationGain) : null,
    elevationLossM: totalElevationLoss > 0 ? Math.round(totalElevationLoss) : null,
    calories: null,
    vo2maxEstimate: null,
    trainingEffectAerobic: null,
    trainingEffectAnaerobic: null,
    hasGps: points.some((p) => p.latitude != null),
    laps: [],
    points,
  }
}

function toNumber(val: unknown): number | null {
  if (val == null) return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
