import { getDb } from '../db/connection'
import { parseFitFile } from './fitParser'
import { parseGpxFile } from './gpxParser'
import log from 'electron-log'
import type { RunningActivity, RunningActivityLap, RunningActivityPoint, HeartRateZones } from '@shared/types'

export const runningService = {
  getActivitiesByClient(clientId: number, limit = 50): RunningActivity[] {
    return getDb()
      .prepare(
        'SELECT * FROM running_activities WHERE client_id = ? ORDER BY activity_date DESC, created_at DESC LIMIT ?',
      )
      .all(clientId, limit) as RunningActivity[]
  },

  getActivityById(id: number): RunningActivity | null {
    return (
      (getDb()
        .prepare('SELECT * FROM running_activities WHERE id = ?')
        .get(id) as RunningActivity | undefined) ?? null
    )
  },

  getLaps(activityId: number): RunningActivityLap[] {
    return getDb()
      .prepare('SELECT * FROM running_activity_laps WHERE activity_id = ? ORDER BY lap_number')
      .all(activityId) as RunningActivityLap[]
  },

  getPoints(activityId: number): RunningActivityPoint[] {
    return getDb()
      .prepare(
        'SELECT * FROM running_activity_points WHERE activity_id = ? ORDER BY id',
      )
      .all(activityId) as RunningActivityPoint[]
  },

  async importActivity(
    clientId: number,
    filePath: string,
  ): Promise<RunningActivity> {
    const ext = filePath.toLowerCase().split('.').pop()
    let parsed

    if (ext === 'fit') {
      parsed = await parseFitFile(filePath)
    } else if (ext === 'gpx') {
      parsed = await parseGpxFile(filePath)
    } else {
      throw new Error('Formato de archivo no soportado. Use .FIT o .GPX')
    }

    const db = getDb()
    const activityDate = parsed.startedAt
      ? parsed.startedAt.split('T')[0]
      : new Date().toISOString().split('T')[0]

    const result = db.transaction(() => {
      const actResult = db
        .prepare(
          `INSERT INTO running_activities
            (client_id, source_file, source_type, activity_date, started_at,
             duration_seconds, distance_meters, avg_pace_min_km, avg_speed_kmh,
             avg_heart_rate, max_heart_rate, avg_cadence, elevation_gain_m, elevation_loss_m,
             calories, vo2max_estimate, training_effect_aerobic, training_effect_anaerobic, has_gps)
           VALUES
            (@clientId, @sourceFile, @sourceType, @activityDate, @startedAt,
             @durationSeconds, @distanceMeters, @avgPaceMinKm, @avgSpeedKmh,
             @avgHeartRate, @maxHeartRate, @avgCadence, @elevationGainM, @elevationLossM,
             @calories, @vo2maxEstimate, @trainingEffectAerobic, @trainingEffectAnaerobic, @hasGps)`,
        )
        .run({
          clientId,
          sourceFile: filePath.split(/[\\/]/).pop() ?? null,
          sourceType: ext === 'fit' ? 'fit' : 'gpx',
          activityDate,
          startedAt: parsed.startedAt,
          durationSeconds: parsed.durationSeconds,
          distanceMeters: parsed.distanceMeters,
          avgPaceMinKm: parsed.avgPaceMinKm,
          avgSpeedKmh: parsed.avgSpeedKmh,
          avgHeartRate: parsed.avgHeartRate,
          maxHeartRate: parsed.maxHeartRate,
          avgCadence: parsed.avgCadence,
          elevationGainM: parsed.elevationGainM,
          elevationLossM: parsed.elevationLossM,
          calories: parsed.calories,
          vo2maxEstimate: parsed.vo2maxEstimate,
          trainingEffectAerobic: parsed.trainingEffectAerobic,
          trainingEffectAnaerobic: parsed.trainingEffectAnaerobic,
          hasGps: parsed.hasGps ? 1 : 0,
        })

      const activityId = Number(actResult.lastInsertRowid)

      // Insert laps
      const insertLap = db.prepare(
        `INSERT INTO running_activity_laps
          (activity_id, lap_number, distance_meters, duration_seconds, avg_pace_min_km, avg_heart_rate, avg_cadence, elevation_gain_m)
         VALUES (@activityId, @lapNumber, @distanceMeters, @durationSeconds, @avgPaceMinKm, @avgHeartRate, @avgCadence, @elevationGainM)`,
      )
      for (const lap of parsed.laps) {
        insertLap.run({ ...lap, activityId })
      }

      // Insert GPS points (limit to avoid huge DB)
      if (parsed.points.length > 0) {
        const maxPoints = 2000
        const step = Math.ceil(parsed.points.length / maxPoints)
        const insertPoint = db.prepare(
          `INSERT INTO running_activity_points
            (activity_id, timestamp, latitude, longitude, altitude_m, heart_rate, cadence, speed_ms, distance_meters)
           VALUES (@activityId, @timestamp, @latitude, @longitude, @altitudeM, @heartRate, @cadence, @speedMs, @distanceMeters)`,
        )
        for (let i = 0; i < parsed.points.length; i += step) {
          const pt = parsed.points[i]
          insertPoint.run({ ...pt, activityId })
        }
      }

      return activityId
    })()

    log.info(`Activity imported: id=${result}, client=${clientId}`)
    return this.getActivityById(result)!
  },

  deleteActivity(id: number): void {
    getDb().prepare('DELETE FROM running_activities WHERE id = ?').run(id)
  },

  getWeeklyStats(clientId: number): { week: string; totalKm: number; count: number }[] {
    return getDb()
      .prepare(
        `SELECT
           strftime('%Y-W%W', activity_date) AS week,
           ROUND(SUM(distance_meters) / 1000.0, 2) AS total_km,
           COUNT(*) AS count
         FROM running_activities
         WHERE client_id = ?
         GROUP BY strftime('%Y-W%W', activity_date)
         ORDER BY week DESC
         LIMIT 12`,
      )
      .all(clientId) as { week: string; totalKm: number; count: number }[]
  },

  // ─── Zonas de FC ───────────────────────────────────────────────────────────

  getHrZones(clientId: number): HeartRateZones | null {
    return (
      (getDb()
        .prepare('SELECT * FROM heart_rate_zones WHERE client_id = ?')
        .get(clientId) as HeartRateZones | undefined) ?? null
    )
  },

  saveHrZones(data: Omit<HeartRateZones, 'id' | 'updatedAt'>): HeartRateZones {
    const db = getDb()
    db.prepare(
      `INSERT INTO heart_rate_zones
        (client_id, max_hr, zone1_min, zone1_max, zone2_min, zone2_max,
         zone3_min, zone3_max, zone4_min, zone4_max, zone5_min, zone5_max, calculation_method)
       VALUES
        (@clientId, @maxHr, @zone1Min, @zone1Max, @zone2Min, @zone2Max,
         @zone3Min, @zone3Max, @zone4Min, @zone4Max, @zone5Min, @zone5Max, @calculationMethod)
       ON CONFLICT(client_id) DO UPDATE SET
        max_hr = @maxHr,
        zone1_min = @zone1Min, zone1_max = @zone1Max,
        zone2_min = @zone2Min, zone2_max = @zone2Max,
        zone3_min = @zone3Min, zone3_max = @zone3Max,
        zone4_min = @zone4Min, zone4_max = @zone4Max,
        zone5_min = @zone5Min, zone5_max = @zone5Max,
        calculation_method = @calculationMethod,
        updated_at = datetime('now')`,
    ).run(data)

    return this.getHrZones(data.clientId)!
  },
}
