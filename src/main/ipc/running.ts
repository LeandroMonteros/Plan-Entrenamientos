import { ipcMain } from 'electron'
import { z } from 'zod'
import log from 'electron-log'
import { IPC } from '@shared/ipc-channels'
import { runningService } from '../services/runningService'
import type { IpcResponse } from '@shared/types'

function ok<T>(data: T): IpcResponse<T> { return { data, error: null } }
function fail(err: unknown): IpcResponse<never> {
  const msg = err instanceof Error ? err.message : String(err)
  log.error('IPC running error:', msg)
  return { data: null, error: msg }
}

export function registerRunningHandlers(): void {
  ipcMain.handle(IPC.RUNNING_ACTIVITIES_GET_BY_CLIENT, (_e, clientId: number, limit?: number) => {
    try { return ok(runningService.getActivitiesByClient(clientId, limit)) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.RUNNING_ACTIVITIES_GET_BY_ID, (_e, id: number) => {
    try { return ok(runningService.getActivityById(id)) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.RUNNING_ACTIVITIES_GET_LAPS, (_e, activityId: number) => {
    try { return ok(runningService.getLaps(activityId)) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.RUNNING_ACTIVITIES_GET_POINTS, (_e, activityId: number) => {
    try { return ok(runningService.getPoints(activityId)) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.RUNNING_ACTIVITIES_IMPORT, async (_e, clientId: number, filePath: unknown) => {
    try {
      const path = z.string().parse(filePath)
      const activity = await runningService.importActivity(clientId, path)
      return ok(activity)
    } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.RUNNING_ACTIVITIES_DELETE, (_e, id: number) => {
    try { runningService.deleteActivity(id); return ok(true) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.RUNNING_ACTIVITIES_GET_STATS, (_e, clientId: number) => {
    try { return ok(runningService.getWeeklyStats(clientId)) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.HR_ZONES_GET, (_e, clientId: number) => {
    try { return ok(runningService.getHrZones(clientId)) } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.HR_ZONES_SAVE, (_e, data: unknown) => {
    try {
      const d = z.object({
        clientId: z.number(),
        maxHr: z.number(),
        zone1Min: z.number(), zone1Max: z.number(),
        zone2Min: z.number(), zone2Max: z.number(),
        zone3Min: z.number(), zone3Max: z.number(),
        zone4Min: z.number(), zone4Max: z.number(),
        zone5Min: z.number(), zone5Max: z.number(),
        calculationMethod: z.enum(['hrmax_pct', 'karvonen']),
      }).parse(data)
      return ok(runningService.saveHrZones(d))
    } catch (err) { return fail(err) }
  })
}
