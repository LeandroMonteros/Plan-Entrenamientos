import { getDb } from '../db/connection'
import type { Client, ClientCreate, ClientUpdate, BodyMeasurement } from '@shared/types'

export const clientService = {
  getAll(): Client[] {
    return getDb()
      .prepare(
        'SELECT * FROM clients ORDER BY first_name, last_name',
      )
      .all() as Client[]
  },

  getById(id: number): Client | null {
    return (
      (getDb().prepare('SELECT * FROM clients WHERE id = ?').get(id) as Client | undefined) ?? null
    )
  },

  create(data: ClientCreate): Client {
    const db = getDb()
    const result = db
      .prepare(
        `INSERT INTO clients
          (first_name, last_name, email, phone, birth_date, sex, weight_kg, height_cm,
           goal, level, medical_notes, injury_history, private_notes, is_active, avatar_path)
         VALUES
          (@firstName, @lastName, @email, @phone, @birthDate, @sex, @weightKg, @heightCm,
           @goal, @level, @medicalNotes, @injuryHistory, @privateNotes, @isActive, @avatarPath)`,
      )
      .run({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        birthDate: data.birthDate ?? null,
        sex: data.sex ?? null,
        weightKg: data.weightKg ?? null,
        heightCm: data.heightCm ?? null,
        goal: data.goal ?? null,
        level: data.level ?? null,
        medicalNotes: data.medicalNotes ?? null,
        injuryHistory: data.injuryHistory ?? null,
        privateNotes: data.privateNotes ?? null,
        isActive: data.isActive ?? 1,
        avatarPath: data.avatarPath ?? null,
      })

    return this.getById(Number(result.lastInsertRowid))!
  },

  update(data: ClientUpdate): Client {
    const db = getDb()
    db.prepare(
      `UPDATE clients SET
        first_name = @firstName, last_name = @lastName, email = @email,
        phone = @phone, birth_date = @birthDate, sex = @sex,
        weight_kg = @weightKg, height_cm = @heightCm, goal = @goal,
        level = @level, medical_notes = @medicalNotes, injury_history = @injuryHistory,
        private_notes = @privateNotes, is_active = @isActive, avatar_path = @avatarPath,
        updated_at = datetime('now')
       WHERE id = @id`,
    ).run({
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? null,
      phone: data.phone ?? null,
      birthDate: data.birthDate ?? null,
      sex: data.sex ?? null,
      weightKg: data.weightKg ?? null,
      heightCm: data.heightCm ?? null,
      goal: data.goal ?? null,
      level: data.level ?? null,
      medicalNotes: data.medicalNotes ?? null,
      injuryHistory: data.injuryHistory ?? null,
      privateNotes: data.privateNotes ?? null,
      isActive: data.isActive ?? 1,
      avatarPath: data.avatarPath ?? null,
    })

    return this.getById(data.id)!
  },

  delete(id: number): void {
    getDb().prepare('DELETE FROM clients WHERE id = ?').run(id)
  },

  getMeasurements(clientId: number): BodyMeasurement[] {
    return getDb()
      .prepare(
        'SELECT * FROM body_measurements WHERE client_id = ? ORDER BY measured_at DESC',
      )
      .all(clientId) as BodyMeasurement[]
  },

  addMeasurement(data: Omit<BodyMeasurement, 'id'>): BodyMeasurement {
    const db = getDb()
    const result = db
      .prepare(
        `INSERT INTO body_measurements
          (client_id, measured_at, weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm, arm_cm, thigh_cm, notes)
         VALUES
          (@clientId, @measuredAt, @weightKg, @bodyFatPct, @chestCm, @waistCm, @hipsCm, @armCm, @thighCm, @notes)`,
      )
      .run({
        clientId: data.clientId,
        measuredAt: data.measuredAt,
        weightKg: data.weightKg ?? null,
        bodyFatPct: data.bodyFatPct ?? null,
        chestCm: data.chestCm ?? null,
        waistCm: data.waistCm ?? null,
        hipsCm: data.hipsCm ?? null,
        armCm: data.armCm ?? null,
        thighCm: data.thighCm ?? null,
        notes: data.notes ?? null,
      })

    return db
      .prepare('SELECT * FROM body_measurements WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as BodyMeasurement
  },
}
