import { ipcMain, dialog, net } from 'electron'
import { z } from 'zod'
import log from 'electron-log'
import { IPC } from '@shared/ipc-channels'
import { appStore } from '../store/secureStore'
import type { IpcResponse, AppConfig } from '@shared/types'

function ok<T>(data: T): IpcResponse<T> { return { data, error: null } }
function fail(err: unknown): IpcResponse<never> {
  const msg = err instanceof Error ? err.message : String(err)
  log.error('IPC config error:', msg)
  return { data: null, error: msg }
}

export function registerConfigHandlers(): void {
  ipcMain.handle(IPC.CONFIG_GET, (): IpcResponse<AppConfig> => {
    try {
      return ok({
        trainerName: appStore.get('trainerName') || '',
        theme: (appStore.get('theme') as AppConfig['theme']) || 'system',
        githubOwner: appStore.get('githubOwner') || null,
        githubRepo: appStore.get('githubRepo') || null,
        githubSetupDone: appStore.get('githubSetupDone') || false,
        backupPath: appStore.get('backupPath') || null,
        backupFrequency: (appStore.get('backupFrequency') as AppConfig['backupFrequency']) || 'daily',
        inactivityAlertDays: appStore.get('inactivityAlertDays') || 7,
        onboardingDone: appStore.get('onboardingDone') || false,
        lastUpdateCheck: appStore.get('lastUpdateCheck') || null,
      })
    } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.CONFIG_SET, (_e, key: string, value: unknown) => {
    try {
      appStore.set(key as Parameters<typeof appStore.set>[0], value as never)
      return ok(true)
    } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.CONFIG_GET_GITHUB, () => {
    try {
      return ok({
        owner: appStore.get('githubOwner') || null,
        repo: appStore.get('githubRepo') || null,
        hasToken: !!appStore.getGithubToken(),
        setupDone: appStore.get('githubSetupDone') || false,
      })
    } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.CONFIG_SET_GITHUB, (_e, data: unknown) => {
    try {
      const d = z.object({
        owner: z.string(),
        repo: z.string(),
        token: z.string().optional(),
      }).parse(data)

      if (d.token) appStore.setGithubToken(d.token)
      if (d.owner) appStore.set('githubOwner', d.owner)
      if (d.repo) appStore.set('githubRepo', d.repo)

      return ok(true)
    } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.CONFIG_SETUP_GITHUB_REPO, async (_e, data: unknown) => {
    try {
      const d = z.object({
        token: z.string().min(1),
        repoName: z.string().min(1),
      }).parse(data)

      const body = JSON.stringify({
        name: d.repoName,
        private: true,
        auto_init: true,
        description: 'Repositorio de respaldo de App Entrenamiento',
      })

      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${d.token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'App-Entrenamiento',
        },
        body,
      })

      if (!response.ok) {
        const errData = await response.json() as { message?: string }
        throw new Error(errData.message || `Error GitHub: ${response.status}`)
      }

      const repo = await response.json() as { name: string; owner: { login: string } }
      appStore.setGithubToken(d.token)
      appStore.set('githubOwner', repo.owner.login)
      appStore.set('githubRepo', repo.name)
      appStore.set('githubSetupDone', true)

      return ok({ owner: repo.owner.login, repo: repo.name })
    } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.DIALOG_OPEN_FILE, async (_e, filters?: Electron.FileFilter[]) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: filters ?? [
          { name: 'Archivos de actividad', extensions: ['fit', 'gpx'] },
          { name: 'Todos los archivos', extensions: ['*'] },
        ],
      })
      return ok(result.canceled ? null : result.filePaths[0])
    } catch (err) { return fail(err) }
  })

  ipcMain.handle(IPC.DIALOG_OPEN_FOLDER, async () => {
    try {
      const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
      return ok(result.canceled ? null : result.filePaths[0])
    } catch (err) { return fail(err) }
  })
}
