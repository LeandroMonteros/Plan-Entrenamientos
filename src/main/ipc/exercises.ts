import { ipcMain, app } from 'electron'
import { z } from 'zod'
import { join, extname } from 'path'
import { promises as fs } from 'fs'
import log from 'electron-log'
import { IPC } from '@shared/ipc-channels'
import { exerciseService } from '../services/exerciseService'
import type { IpcResponse } from '@shared/types'

function ok<T>(data: T): IpcResponse<T> {
  return { data, error: null }
}

function fail(err: unknown): IpcResponse<never> {
  const msg = err instanceof Error ? err.message : String(err)
  log.error('IPC exercises error:', msg)
  return { data: null, error: msg }
}

const ExerciseSchema = z.object({
  name: z.string().min(1),
  primaryMuscleGroupId: z.number(),
  secondaryMuscleGroupIds: z.array(z.number()).optional(),
  equipmentType: z.string().optional(),
  exerciseType: z.string().optional(),
  description: z.string().nullable().optional(),
  techniqueNotes: z.string().nullable().optional(),
  imagePath: z.string().nullable().optional(),
  isDefault: z.number().optional(),
})

export function registerExerciseHandlers(): void {
  ipcMain.handle(IPC.EXERCISES_GET_MUSCLE_GROUPS, () => {
    try {
      return ok(exerciseService.getMuscleGroups())
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle(IPC.EXERCISES_GET_ALL, (_e, filters?: unknown) => {
    try {
      const f = filters as { muscleGroupId?: number; equipment?: string; search?: string } | undefined
      return ok(exerciseService.getAll(f))
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle(IPC.EXERCISES_GET_BY_ID, (_e, id: number) => {
    try {
      return ok(exerciseService.getById(id))
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle(IPC.EXERCISES_CREATE, (_e, input: unknown) => {
    try {
      const data = ExerciseSchema.parse(input)
      return ok(exerciseService.create(data as Parameters<typeof exerciseService.create>[0]))
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle(IPC.EXERCISES_UPDATE, (_e, input: unknown) => {
    try {
      const data = ExerciseSchema.extend({ id: z.number() }).parse(input)
      return ok(exerciseService.update(data as Parameters<typeof exerciseService.update>[0]))
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle(IPC.EXERCISES_DELETE, (_e, id: number) => {
    try {
      exerciseService.delete(id)
      return ok(true)
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle(IPC.EXERCISES_SET_MEDIA, async (_e, input: unknown) => {
    try {
      const { exerciseId, type, sourcePath } = z.object({
        exerciseId: z.number(),
        type: z.enum(['image', 'video']),
        sourcePath: z.string().nullable(),
      }).parse(input)

      if (sourcePath === null) {
        return ok(exerciseService.setMedia(exerciseId, type, null))
      }

      const mediaDir = join(app.getPath('userData'), 'media', 'exercises')
      await fs.mkdir(mediaDir, { recursive: true })

      const ext = extname(sourcePath).toLowerCase()
      const destPath = join(mediaDir, `${exerciseId}_${type}_${Date.now()}${ext}`)
      await fs.copyFile(sourcePath, destPath)

      return ok(exerciseService.setMedia(exerciseId, type, destPath))
    } catch (err) {
      return fail(err)
    }
  })
}
