import { readFileSync } from 'fs'
import log from 'electron-log'
import { MAX_FILE_SIZE_BYTES } from '@shared/constants'

export interface ParsedActivity {
  startedAt: string | null
  durationSeconds: number | null
  distanceMeters: number | null
  avgPaceMinKm: number | null
  avgSpeedKmh: number | null
  avgHeartRate: number | null
  maxHeartRate: number | null
  avgCadence: number | null
  elevationGainM: number | null
  elevationLossM: number | null
  calories: number | null
  vo2maxEstimate: number | null
  trainingEffectAerobic: number | null
  trainingEffectAnaerobic: number | null
  hasGps: boolean
  laps: ParsedLap[]
  points: ParsedPoint[]
}

export interface ParsedLap {
  lapNumber: number
  distanceMeters: number | null
  durationSeconds: number | null
  avgPaceMinKm: number | null
  avgHeartRate: number | null
  avgCadence: number | null
  elevationGainM: number | null
}

export interface ParsedPoint {
  timestamp: string
  latitude: number | null
  longitude: number | null
  altitudeM: number | null
  heartRate: number | null
  cadence: number | null
  speedMs: number | null
  distanceMeters: number | null
}

export async function parseFitFile(filePath: string): Promise<ParsedActivity> {
  const stat = await import('fs').then((m) => m.statSync(filePath))
  if (stat.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Archivo demasiado grande (máximo ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB)`)
  }

  const content = readFileSync(filePath)

  // Validate FIT magic bytes
  if (content.length < 12) throw new Error('Archivo .FIT inválido: demasiado corto')

  return new Promise((resolve, reject) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const FitParser = require('fit-file-parser').default || require('fit-file-parser')
      const parser = new FitParser({
        force: true,
        speedUnit: 'km/h',
        lengthUnit: 'm',
        temperatureUnit: 'celsius',
        elapsedRecordField: true,
        mode: 'cascade',
      })

      parser.parse(content, (error: Error | null, data: Record<string, unknown>) => {
        if (error) {
          reject(new Error(`Error parseando .FIT: ${error.message}`))
          return
        }

        try {
          resolve(extractFitData(data))
        } catch (err) {
          reject(err)
        }
      })
    } catch (err) {
      log.error('FIT parser error:', err)
      reject(new Error('No se pudo parsear el archivo .FIT'))
    }
  })
}

function extractFitData(data: Record<string, unknown>): ParsedActivity {
  const activity = (data.activity as Record<string, unknown>) || {}
  const sessions = (activity.sessions as Record<string, unknown>[]) || []
  const session = sessions[0] || {}
  const laps = (session.laps as Record<string, unknown>[]) || []
  const records = (session.records as Record<string, unknown>[]) || []

  const durationSeconds = toNumber(session.total_elapsed_time)
  const distanceMeters = toNumber(session.total_distance)
  const avgSpeedKmh = toNumber(session.avg_speed)
  const avgPaceMinKm =
    avgSpeedKmh && avgSpeedKmh > 0 ? 60 / avgSpeedKmh : null

  const points: ParsedPoint[] = records
    .filter((r) => r.position_lat != null || r.timestamp != null)
    .map((r) => ({
      timestamp: formatTimestamp(r.timestamp),
      latitude: semicirclesToDeg(toNumber(r.position_lat)),
      longitude: semicirclesToDeg(toNumber(r.position_long)),
      altitudeM: toNumber(r.altitude),
      heartRate: toNumber(r.heart_rate),
      cadence: toNumber(r.cadence),
      speedMs: avgSpeedKmh ? (toNumber(r.speed) ?? 0) / 3.6 : null,
      distanceMeters: toNumber(r.distance),
    }))

  const hasGps = points.some((p) => p.latitude != null && p.longitude != null)

  const parsedLaps: ParsedLap[] = laps.map((l, i) => {
    const lapSpeed = toNumber(l.avg_speed)
    return {
      lapNumber: i + 1,
      distanceMeters: toNumber(l.total_distance),
      durationSeconds: toNumber(l.total_elapsed_time),
      avgPaceMinKm: lapSpeed && lapSpeed > 0 ? 60 / lapSpeed : null,
      avgHeartRate: toNumber(l.avg_heart_rate),
      avgCadence: toNumber(l.avg_cadence),
      elevationGainM: toNumber(l.total_ascent),
    }
  })

  return {
    startedAt: session.start_time ? formatTimestamp(session.start_time) : null,
    durationSeconds,
    distanceMeters,
    avgPaceMinKm,
    avgSpeedKmh,
    avgHeartRate: toNumber(session.avg_heart_rate),
    maxHeartRate: toNumber(session.max_heart_rate),
    avgCadence: toNumber(session.avg_cadence),
    elevationGainM: toNumber(session.total_ascent),
    elevationLossM: toNumber(session.total_descent),
    calories: toNumber(session.total_calories),
    vo2maxEstimate: null,
    trainingEffectAerobic: toNumber(session.training_stress_score),
    trainingEffectAnaerobic: null,
    hasGps,
    laps: parsedLaps,
    points,
  }
}

function toNumber(val: unknown): number | null {
  if (val == null) return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

function semicirclesToDeg(val: number | null): number | null {
  if (val == null) return null
  return val * (180 / Math.pow(2, 31))
}

function formatTimestamp(ts: unknown): string {
  if (!ts) return new Date().toISOString()
  if (ts instanceof Date) return ts.toISOString()
  const d = new Date(ts as string)
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}
