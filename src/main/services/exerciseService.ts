import { getDb } from '../db/connection'
import type { Exercise, ExerciseCreate, ExerciseUpdate, MuscleGroup } from '@shared/types'

function rowToExercise(row: Record<string, unknown>): Exercise {
  return {
    ...(row as Exercise),
    secondaryMuscleGroupIds: JSON.parse((row.secondary_muscle_group_ids as string) || '[]'),
  }
}

export const exerciseService = {
  getMuscleGroups(): MuscleGroup[] {
    return getDb().prepare('SELECT * FROM muscle_groups ORDER BY name').all() as MuscleGroup[]
  },

  getAll(filters?: { muscleGroupId?: number; equipment?: string; search?: string }): Exercise[] {
    let sql = `
      SELECT e.*, mg.name AS primary_muscle_group_name
      FROM exercises e
      JOIN muscle_groups mg ON mg.id = e.primary_muscle_group_id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (filters?.muscleGroupId) {
      sql += ' AND e.primary_muscle_group_id = ?'
      params.push(filters.muscleGroupId)
    }
    if (filters?.equipment) {
      sql += ' AND e.equipment_type = ?'
      params.push(filters.equipment)
    }
    if (filters?.search) {
      sql += ' AND e.name LIKE ?'
      params.push(`%${filters.search}%`)
    }

    sql += ' ORDER BY mg.name, e.name'

    const rows = getDb().prepare(sql).all(...params) as Record<string, unknown>[]
    return rows.map(rowToExercise)
  },

  getById(id: number): Exercise | null {
    const row = getDb()
      .prepare(
        `SELECT e.*, mg.name AS primary_muscle_group_name
         FROM exercises e
         JOIN muscle_groups mg ON mg.id = e.primary_muscle_group_id
         WHERE e.id = ?`,
      )
      .get(id) as Record<string, unknown> | undefined
    return row ? rowToExercise(row) : null
  },

  create(data: ExerciseCreate): Exercise {
    const db = getDb()
    const result = db
      .prepare(
        `INSERT INTO exercises
          (name, primary_muscle_group_id, secondary_muscle_group_ids, equipment_type,
           exercise_type, description, technique_notes, image_path, is_default)
         VALUES
          (@name, @primaryMuscleGroupId, @secondaryMuscleGroupIds, @equipmentType,
           @exerciseType, @description, @techniqueNotes, @imagePath, @isDefault)`,
      )
      .run({
        name: data.name,
        primaryMuscleGroupId: data.primaryMuscleGroupId,
        secondaryMuscleGroupIds: JSON.stringify(data.secondaryMuscleGroupIds ?? []),
        equipmentType: data.equipmentType ?? 'peso_corporal',
        exerciseType: data.exerciseType ?? 'libre',
        description: data.description ?? null,
        techniqueNotes: data.techniqueNotes ?? null,
        imagePath: data.imagePath ?? null,
        isDefault: 0,
      })

    return this.getById(Number(result.lastInsertRowid))!
  },

  update(data: ExerciseUpdate): Exercise {
    const db = getDb()
    db.prepare(
      `UPDATE exercises SET
        name = @name,
        primary_muscle_group_id = @primaryMuscleGroupId,
        secondary_muscle_group_ids = @secondaryMuscleGroupIds,
        equipment_type = @equipmentType,
        exercise_type = @exerciseType,
        description = @description,
        technique_notes = @techniqueNotes,
        image_path = @imagePath
       WHERE id = @id`,
    ).run({
      id: data.id,
      name: data.name,
      primaryMuscleGroupId: data.primaryMuscleGroupId,
      secondaryMuscleGroupIds: JSON.stringify(data.secondaryMuscleGroupIds ?? []),
      equipmentType: data.equipmentType,
      exerciseType: data.exerciseType,
      description: data.description ?? null,
      techniqueNotes: data.techniqueNotes ?? null,
      imagePath: data.imagePath ?? null,
    })

    return this.getById(data.id)!
  },

  delete(id: number): void {
    const exercise = this.getById(id)
    if (!exercise) return
    if (exercise.isDefault) throw new Error('No se pueden eliminar ejercicios predeterminados')
    getDb().prepare('DELETE FROM exercises WHERE id = ?').run(id)
  },
}
