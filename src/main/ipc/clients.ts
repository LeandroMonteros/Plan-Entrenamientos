import { ipcMain } from 'electron'
import { z } from 'zod'
import log from 'electron-log'
import { IPC } from '@shared/ipc-channels'
import { clientService } from '../services/clientService'
import type { IpcResponse } from '@shared/types'

function ok<T>(data: T): IpcResponse<T> {
  return { data, error: null }
}

function fail(err: unknown): IpcResponse<never> {
  const msg = err instanceof Error ? err.message : String(err)
  log.error('IPC error:', msg)
  return { data: null, error: msg }
}

const ClientCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  sex: z.enum(['M', 'F', 'otro']).nullable().optional(),
  weightKg: z.number().positive().nullable().optional(),
  heightCm: z.number().positive().nullable().optional(),
  goal: z.string().nullable().optional(),
  level: z.enum(['principiante', 'intermedio', 'avanzado']).nullable().optional(),
  medicalNotes: z.string().nullable().optional(),
  injuryHistory: z.string().nullable().optional(),
  privateNotes: z.string().nullable().optional(),
  isActive: z.number().optional(),
  avatarPath: z.string().nullable().optional(),
})

export function registerClientHandlers(): void {
  ipcMain.handle(IPC.CLIENTS_GET_ALL, () => {
    try {
      return ok(clientService.getAll())
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle(IPC.CLIENTS_GET_BY_ID, (_e, id: number) => {
    try {
      return ok(clientService.getById(id))
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle(IPC.CLIENTS_CREATE, (_e, input: unknown) => {
    try {
      const data = ClientCreateSchema.parse(input)
      return ok(clientService.create(data as Parameters<typeof clientService.create>[0]))
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle(IPC.CLIENTS_UPDATE, (_e, input: unknown) => {
    try {
      const data = ClientCreateSchema.extend({ id: z.number() }).parse(input)
      return ok(clientService.update(data as Parameters<typeof clientService.update>[0]))
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle(IPC.CLIENTS_DELETE, (_e, id: number) => {
    try {
      clientService.delete(id)
      return ok(true)
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle(IPC.CLIENTS_GET_MEASUREMENTS, (_e, clientId: number) => {
    try {
      return ok(clientService.getMeasurements(clientId))
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle(IPC.CLIENTS_ADD_MEASUREMENT, (_e, input: unknown) => {
    try {
      const schema = z.object({
        clientId: z.number(),
        measuredAt: z.string(),
        weightKg: z.number().nullable().optional(),
        bodyFatPct: z.number().nullable().optional(),
        chestCm: z.number().nullable().optional(),
        waistCm: z.number().nullable().optional(),
        hipsCm: z.number().nullable().optional(),
        armCm: z.number().nullable().optional(),
        thighCm: z.number().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
      const data = schema.parse(input)
      return ok(clientService.addMeasurement(data as Parameters<typeof clientService.addMeasurement>[0]))
    } catch (err) {
      return fail(err)
    }
  })
}
