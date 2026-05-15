import { ipcMain } from 'electron'
import { z } from 'zod'
import log from 'electron-log'
import { IPC } from '@shared/ipc-channels'
import { gymService } from '../services/gymService'
import type { IpcResponse } from '@shared/types'

function ok<T>(data: T): IpcResponse<T> { return { data, error: null } }
function fail(err: unknown): IpcResponse<never> {
  const msg = err instanceof Error ? err.message : String(err)
  log.error('IPC gym error:', msg)
  return { data: null, error: msg }
}

export function registerGymHandlers(): void {
  // Plans
  ipcMain.handle(IPC.GYM_PLANS_GET_BY_CLIENT, (_e, clientId: number) => {
    try { return ok(gymService.getPlansByClient(clientId)) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_PLANS_GET_BY_ID, (_e, id: number) => {
    try { return ok(gymService.getPlanById(id)) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_PLANS_CREATE, (_e, input: unknown) => {
    try {
      const data = z.object({
        clientId: z.number(),
        name: z.string().min(1),
        objective: z.string().nullable().optional(),
        level: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
        isActive: z.number().optional(),
        templateId: z.number().nullable().optional(),
      }).parse(input)
      return ok(gymService.createPlan(data as Parameters<typeof gymService.createPlan>[0]))
    } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_PLANS_UPDATE, (_e, input: unknown) => {
    try {
      const data = z.object({ id: z.number() }).passthrough().parse(input) as { id: number } & Record<string, unknown>
      gymService.updatePlan(data.id, data)
      return ok(true)
    } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_PLANS_DELETE, (_e, id: number) => {
    try { gymService.deletePlan(id); return ok(true) } catch (err) { return fail(err) }
  })

  // Plan days
  ipcMain.handle(IPC.GYM_PLAN_DAYS_ADD, (_e, planId: number, data: unknown) => {
    try {
      const d = z.object({ dayOfWeek: z.number().optional(), name: z.string(), sortOrder: z.number().optional() }).parse(data)
      return ok(gymService.addDay(planId, d))
    } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_PLAN_DAYS_UPDATE, (_e, id: number, data: unknown) => {
    try {
      gymService.updateDay(id, data as Parameters<typeof gymService.updateDay>[1])
      return ok(true)
    } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_PLAN_DAYS_DELETE, (_e, id: number) => {
    try { gymService.deleteDay(id); return ok(true) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_PLAN_DAYS_ADD_EXERCISE, (_e, planDayId: number, data: unknown) => {
    try {
      const d = z.object({
        exerciseId: z.number(),
        sets: z.number().optional(),
        reps: z.string().optional(),
        weightKg: z.number().nullable().optional(),
        restSeconds: z.number().nullable().optional(),
        techniqueNotes: z.string().nullable().optional(),
        sortOrder: z.number().optional(),
      }).parse(data)
      return ok(gymService.addExerciseToDay(planDayId, d as Parameters<typeof gymService.addExerciseToDay>[1]))
    } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_PLAN_DAYS_UPDATE_EXERCISE, (_e, id: number, data: unknown) => {
    try { gymService.updateExerciseInDay(id, data as Parameters<typeof gymService.updateExerciseInDay>[1]); return ok(true) }
    catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_PLAN_DAYS_REMOVE_EXERCISE, (_e, id: number) => {
    try { gymService.removeExerciseFromDay(id); return ok(true) } catch (err) { return fail(err) }
  })

  // Sessions
  ipcMain.handle(IPC.GYM_SESSIONS_GET_BY_CLIENT, (_e, clientId: number, limit?: number) => {
    try { return ok(gymService.getSessionsByClient(clientId, limit)) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_SESSIONS_GET_BY_ID, (_e, id: number) => {
    try { return ok(gymService.getSessionById(id)) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_SESSIONS_CREATE, (_e, data: unknown) => {
    try {
      const d = z.object({
        clientId: z.number(),
        planId: z.number().nullable().optional(),
        planDayId: z.number().nullable().optional(),
        sessionDate: z.string(),
        notes: z.string().nullable().optional(),
      }).parse(data)
      return ok(gymService.createSession(d))
    } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_SESSIONS_ADD_SET, (_e, sessionId: number, data: unknown) => {
    try {
      const d = z.object({
        exerciseId: z.number(),
        setNumber: z.number().optional(),
        repsDone: z.number().nullable().optional(),
        weightKg: z.number().nullable().optional(),
        rpe: z.number().min(1).max(10).nullable().optional(),
        notes: z.string().nullable().optional(),
      }).parse(data)
      return ok(gymService.addSet(sessionId, d as Parameters<typeof gymService.addSet>[1]))
    } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_SESSIONS_UPDATE_SET, (_e, id: number, data: unknown) => {
    try { gymService.updateSet(id, data as Parameters<typeof gymService.updateSet>[1]); return ok(true) }
    catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_SESSIONS_DELETE_SET, (_e, id: number) => {
    try { gymService.deleteSet(id); return ok(true) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_SESSIONS_FINISH, (_e, id: number, rpe?: number) => {
    try { gymService.finishSession(id, rpe); return ok(true) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_SESSIONS_GET_STATS, (_e, clientId: number) => {
    try { return ok(gymService.getSessionStats(clientId)) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_SESSIONS_GET_PROGRESSION, (_e, clientId: number, exerciseId: number) => {
    try { return ok(gymService.getExerciseProgression(clientId, exerciseId)) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.GYM_SESSIONS_GET_PRS, (_e, clientId: number) => {
    try { return ok(gymService.getPersonalRecords(clientId)) } catch (err) { return fail(err) }
  })
}
