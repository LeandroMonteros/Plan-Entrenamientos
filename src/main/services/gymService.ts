import { getDb } from '../db/connection'
import type {
  TrainingPlan,
  TrainingPlanDay,
  PlanDayExercise,
  TrainingSession,
  SessionExerciseSet,
  SessionWithSets,
  PersonalRecord,
} from '@shared/types'

export const gymService = {
  // ─── Planes ────────────────────────────────────────────────────────────────

  getPlansByClient(clientId: number): TrainingPlan[] {
    return getDb()
      .prepare('SELECT * FROM training_plans WHERE client_id = ? ORDER BY is_active DESC, created_at DESC')
      .all(clientId) as TrainingPlan[]
  },

  getPlanById(id: number): (TrainingPlan & { days: TrainingPlanDay[] }) | null {
    const db = getDb()
    const plan = db.prepare('SELECT * FROM training_plans WHERE id = ?').get(id) as TrainingPlan | undefined
    if (!plan) return null

    const days = db
      .prepare('SELECT * FROM training_plan_days WHERE plan_id = ? ORDER BY sort_order, day_of_week')
      .all(id) as TrainingPlanDay[]

    for (const day of days) {
      day.exercises = db
        .prepare(
          `SELECT pde.*, e.name AS exercise_name, mg.name AS primary_muscle_group_name
           FROM plan_day_exercises pde
           JOIN exercises e ON e.id = pde.exercise_id
           JOIN muscle_groups mg ON mg.id = e.primary_muscle_group_id
           WHERE pde.plan_day_id = ?
           ORDER BY pde.sort_order`,
        )
        .all(day.id) as PlanDayExercise[]
    }

    return { ...plan, days }
  },

  createPlan(data: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>): TrainingPlan {
    const db = getDb()
    const result = db
      .prepare(
        `INSERT INTO training_plans
          (client_id, template_id, name, objective, level, notes, start_date, end_date, is_active)
         VALUES
          (@clientId, @templateId, @name, @objective, @level, @notes, @startDate, @endDate, @isActive)`,
      )
      .run({
        clientId: data.clientId,
        templateId: data.templateId ?? null,
        name: data.name,
        objective: data.objective ?? null,
        level: data.level ?? null,
        notes: data.notes ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        isActive: data.isActive ?? 1,
      })

    return db
      .prepare('SELECT * FROM training_plans WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as TrainingPlan
  },

  updatePlan(id: number, data: Partial<Omit<TrainingPlan, 'id' | 'clientId' | 'createdAt'>>): void {
    getDb()
      .prepare(
        `UPDATE training_plans SET
          name = COALESCE(@name, name),
          objective = @objective,
          level = @level,
          notes = @notes,
          start_date = @startDate,
          end_date = @endDate,
          is_active = COALESCE(@isActive, is_active),
          updated_at = datetime('now')
         WHERE id = @id`,
      )
      .run({
        id,
        name: data.name ?? null,
        objective: data.objective ?? null,
        level: data.level ?? null,
        notes: data.notes ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        isActive: data.isActive ?? null,
      })
  },

  deletePlan(id: number): void {
    getDb().prepare('DELETE FROM training_plans WHERE id = ?').run(id)
  },

  // ─── Días del plan ─────────────────────────────────────────────────────────

  addDay(planId: number, data: Omit<TrainingPlanDay, 'id' | 'planId' | 'exercises'>): TrainingPlanDay {
    const db = getDb()
    const result = db
      .prepare(
        'INSERT INTO training_plan_days (plan_id, day_of_week, name, sort_order) VALUES (@planId, @dayOfWeek, @name, @sortOrder)',
      )
      .run({ planId, dayOfWeek: data.dayOfWeek ?? 0, name: data.name, sortOrder: data.sortOrder ?? 0 })

    return db
      .prepare('SELECT * FROM training_plan_days WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as TrainingPlanDay
  },

  updateDay(id: number, data: Partial<Pick<TrainingPlanDay, 'name' | 'dayOfWeek' | 'sortOrder'>>): void {
    getDb()
      .prepare(
        `UPDATE training_plan_days SET
          name = COALESCE(@name, name),
          day_of_week = COALESCE(@dayOfWeek, day_of_week),
          sort_order = COALESCE(@sortOrder, sort_order)
         WHERE id = @id`,
      )
      .run({ id, name: data.name ?? null, dayOfWeek: data.dayOfWeek ?? null, sortOrder: data.sortOrder ?? null })
  },

  deleteDay(id: number): void {
    getDb().prepare('DELETE FROM training_plan_days WHERE id = ?').run(id)
  },

  addExerciseToDay(
    planDayId: number,
    data: Omit<PlanDayExercise, 'id' | 'planDayId' | 'exerciseName' | 'primaryMuscleGroupName'>,
  ): PlanDayExercise {
    const db = getDb()
    const result = db
      .prepare(
        `INSERT INTO plan_day_exercises
          (plan_day_id, exercise_id, sets, reps, weight_kg, rest_seconds, technique_notes, sort_order)
         VALUES
          (@planDayId, @exerciseId, @sets, @reps, @weightKg, @restSeconds, @techniqueNotes, @sortOrder)`,
      )
      .run({
        planDayId,
        exerciseId: data.exerciseId,
        sets: data.sets ?? 3,
        reps: data.reps ?? '10',
        weightKg: data.weightKg ?? null,
        restSeconds: data.restSeconds ?? 90,
        techniqueNotes: data.techniqueNotes ?? null,
        sortOrder: data.sortOrder ?? 0,
      })

    return db
      .prepare('SELECT pde.*, e.name AS exercise_name FROM plan_day_exercises pde JOIN exercises e ON e.id = pde.exercise_id WHERE pde.id = ?')
      .get(Number(result.lastInsertRowid)) as PlanDayExercise
  },

  updateExerciseInDay(id: number, data: Partial<PlanDayExercise>): void {
    getDb()
      .prepare(
        `UPDATE plan_day_exercises SET
          sets = COALESCE(@sets, sets),
          reps = COALESCE(@reps, reps),
          weight_kg = @weightKg,
          rest_seconds = @restSeconds,
          technique_notes = @techniqueNotes,
          sort_order = COALESCE(@sortOrder, sort_order)
         WHERE id = @id`,
      )
      .run({
        id,
        sets: data.sets ?? null,
        reps: data.reps ?? null,
        weightKg: data.weightKg ?? null,
        restSeconds: data.restSeconds ?? null,
        techniqueNotes: data.techniqueNotes ?? null,
        sortOrder: data.sortOrder ?? null,
      })
  },

  removeExerciseFromDay(id: number): void {
    getDb().prepare('DELETE FROM plan_day_exercises WHERE id = ?').run(id)
  },

  // ─── Sesiones ──────────────────────────────────────────────────────────────

  getSessionsByClient(clientId: number, limit = 50): TrainingSession[] {
    return getDb()
      .prepare(
        `SELECT ts.*,
           tp.name AS plan_name,
           tpd.name AS plan_day_name,
           COUNT(ses.id) AS set_count,
           SUM(COALESCE(ses.reps_done, 0) * COALESCE(ses.weight_kg, 0)) AS total_volume
         FROM training_sessions ts
         LEFT JOIN training_plans tp ON tp.id = ts.plan_id
         LEFT JOIN training_plan_days tpd ON tpd.id = ts.plan_day_id
         LEFT JOIN session_exercise_sets ses ON ses.session_id = ts.id
         WHERE ts.client_id = ?
         GROUP BY ts.id
         ORDER BY ts.session_date DESC
         LIMIT ?`,
      )
      .all(clientId, limit) as TrainingSession[]
  },

  getSessionById(id: number): SessionWithSets | null {
    const db = getDb()
    const session = db
      .prepare(
        `SELECT ts.*, tp.name AS plan_name, tpd.name AS plan_day_name
         FROM training_sessions ts
         LEFT JOIN training_plans tp ON tp.id = ts.plan_id
         LEFT JOIN training_plan_days tpd ON tpd.id = ts.plan_day_id
         WHERE ts.id = ?`,
      )
      .get(id) as TrainingSession | undefined

    if (!session) return null

    const sets = db
      .prepare(
        `SELECT ses.*, e.name AS exercise_name
         FROM session_exercise_sets ses
         JOIN exercises e ON e.id = ses.exercise_id
         WHERE ses.session_id = ?
         ORDER BY ses.exercise_id, ses.set_number`,
      )
      .all(id) as SessionExerciseSet[]

    return { ...session, sets }
  },

  createSession(data: {
    clientId: number
    planId?: number | null
    planDayId?: number | null
    sessionDate: string
    notes?: string | null
  }): TrainingSession {
    const db = getDb()
    const result = db
      .prepare(
        `INSERT INTO training_sessions (client_id, plan_id, plan_day_id, session_date, started_at, notes)
         VALUES (@clientId, @planId, @planDayId, @sessionDate, datetime('now'), @notes)`,
      )
      .run({
        clientId: data.clientId,
        planId: data.planId ?? null,
        planDayId: data.planDayId ?? null,
        sessionDate: data.sessionDate,
        notes: data.notes ?? null,
      })

    return db
      .prepare('SELECT * FROM training_sessions WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as TrainingSession
  },

  addSet(
    sessionId: number,
    data: Omit<SessionExerciseSet, 'id' | 'sessionId' | 'exerciseName' | 'isPr'>,
  ): SessionExerciseSet {
    const db = getDb()
    const result = db
      .prepare(
        `INSERT INTO session_exercise_sets
          (session_id, exercise_id, set_number, reps_done, weight_kg, rpe, notes)
         VALUES
          (@sessionId, @exerciseId, @setNumber, @repsDone, @weightKg, @rpe, @notes)`,
      )
      .run({
        sessionId,
        exerciseId: data.exerciseId,
        setNumber: data.setNumber ?? 1,
        repsDone: data.repsDone ?? null,
        weightKg: data.weightKg ?? null,
        rpe: data.rpe ?? null,
        notes: data.notes ?? null,
      })

    const newSet = db
      .prepare('SELECT * FROM session_exercise_sets WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as SessionExerciseSet

    // Check for PR
    this.checkAndUpdatePr(sessionId, data.exerciseId, newSet)

    return newSet
  },

  updateSet(id: number, data: Partial<SessionExerciseSet>): void {
    getDb()
      .prepare(
        `UPDATE session_exercise_sets SET
          reps_done = COALESCE(@repsDone, reps_done),
          weight_kg = @weightKg,
          rpe = @rpe,
          notes = @notes
         WHERE id = @id`,
      )
      .run({
        id,
        repsDone: data.repsDone ?? null,
        weightKg: data.weightKg ?? null,
        rpe: data.rpe ?? null,
        notes: data.notes ?? null,
      })
  },

  deleteSet(id: number): void {
    getDb().prepare('DELETE FROM session_exercise_sets WHERE id = ?').run(id)
  },

  finishSession(id: number, overallRpe?: number): void {
    getDb()
      .prepare(
        `UPDATE training_sessions SET ended_at = datetime('now'), overall_rpe = @rpe WHERE id = @id`,
      )
      .run({ id, rpe: overallRpe ?? null })
  },

  // ─── PRs ───────────────────────────────────────────────────────────────────

  checkAndUpdatePr(sessionId: number, exerciseId: number, newSet: SessionExerciseSet): void {
    const db = getDb()
    const session = db
      .prepare('SELECT client_id, session_date FROM training_sessions WHERE id = ?')
      .get(sessionId) as { client_id: number; session_date: string } | undefined
    if (!session) return

    const volume = (newSet.repsDone ?? 0) * (newSet.weightKg ?? 0)
    if (volume <= 0) return

    const existingPr = db
      .prepare(
        `SELECT value FROM personal_records
         WHERE client_id = ? AND exercise_id = ? AND record_type = 'max_volume'`,
      )
      .get(session.client_id, exerciseId) as { value: number } | undefined

    if (!existingPr || volume > existingPr.value) {
      db.prepare(
        `INSERT INTO personal_records (client_id, exercise_id, session_id, record_type, value, achieved_at)
         VALUES (@clientId, @exerciseId, @sessionId, 'max_volume', @value, @date)
         ON CONFLICT (client_id, exercise_id, record_type) DO UPDATE SET
           value = excluded.value, session_id = excluded.session_id, achieved_at = excluded.achieved_at
         WHERE personal_records.value < excluded.value`,
      ).run({
        clientId: session.client_id,
        exerciseId,
        sessionId,
        value: volume,
        date: session.session_date,
      })

      db.prepare('UPDATE session_exercise_sets SET is_pr = 1 WHERE id = ?').run(newSet.id)
    }
  },

  getSessionStats(clientId: number): {
    totalSessions: number
    totalVolume: number
    lastSessionDate: string | null
  } {
    const row = getDb()
      .prepare(
        `SELECT
           COUNT(DISTINCT ts.id) AS total_sessions,
           SUM(COALESCE(ses.reps_done, 0) * COALESCE(ses.weight_kg, 0)) AS total_volume,
           MAX(ts.session_date) AS last_session_date
         FROM training_sessions ts
         LEFT JOIN session_exercise_sets ses ON ses.session_id = ts.id
         WHERE ts.client_id = ?`,
      )
      .get(clientId) as { total_sessions: number; total_volume: number; last_session_date: string }

    return {
      totalSessions: row.total_sessions ?? 0,
      totalVolume: row.total_volume ?? 0,
      lastSessionDate: row.last_session_date ?? null,
    }
  },

  getExerciseProgression(
    clientId: number,
    exerciseId: number,
  ): { date: string; maxWeight: number; totalVolume: number }[] {
    return getDb()
      .prepare(
        `SELECT
           ts.session_date AS date,
           MAX(ses.weight_kg) AS max_weight,
           SUM(COALESCE(ses.reps_done, 0) * COALESCE(ses.weight_kg, 0)) AS total_volume
         FROM session_exercise_sets ses
         JOIN training_sessions ts ON ts.id = ses.session_id
         WHERE ts.client_id = ? AND ses.exercise_id = ?
         GROUP BY ts.session_date
         ORDER BY ts.session_date ASC
         LIMIT 30`,
      )
      .all(clientId, exerciseId) as { date: string; maxWeight: number; totalVolume: number }[]
  },

  getPersonalRecords(clientId: number): PersonalRecord[] {
    return getDb()
      .prepare(
        `SELECT pr.*, e.name AS exercise_name
         FROM personal_records pr
         JOIN exercises e ON e.id = pr.exercise_id
         WHERE pr.client_id = ?
         ORDER BY pr.achieved_at DESC`,
      )
      .all(clientId) as PersonalRecord[]
  },
}
