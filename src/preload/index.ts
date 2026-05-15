import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'

function invoke<T>(channel: string, ...args: unknown[]) {
  return ipcRenderer.invoke(channel, ...args) as Promise<{ data: T | null; error: string | null }>
}

const api = {
  clients: {
    getAll: () => invoke(IPC.CLIENTS_GET_ALL),
    getById: (id: number) => invoke(IPC.CLIENTS_GET_BY_ID, id),
    create: (data: unknown) => invoke(IPC.CLIENTS_CREATE, data),
    update: (data: unknown) => invoke(IPC.CLIENTS_UPDATE, data),
    delete: (id: number) => invoke(IPC.CLIENTS_DELETE, id),
    getMeasurements: (clientId: number) => invoke(IPC.CLIENTS_GET_MEASUREMENTS, clientId),
    addMeasurement: (data: unknown) => invoke(IPC.CLIENTS_ADD_MEASUREMENT, data),
  },

  exercises: {
    getAll: (filters?: unknown) => invoke(IPC.EXERCISES_GET_ALL, filters),
    getById: (id: number) => invoke(IPC.EXERCISES_GET_BY_ID, id),
    create: (data: unknown) => invoke(IPC.EXERCISES_CREATE, data),
    update: (data: unknown) => invoke(IPC.EXERCISES_UPDATE, data),
    delete: (id: number) => invoke(IPC.EXERCISES_DELETE, id),
    getMuscleGroups: () => invoke(IPC.EXERCISES_GET_MUSCLE_GROUPS),
  },

  gym: {
    plans: {
      getByClient: (clientId: number) => invoke(IPC.GYM_PLANS_GET_BY_CLIENT, clientId),
      getById: (id: number) => invoke(IPC.GYM_PLANS_GET_BY_ID, id),
      create: (data: unknown) => invoke(IPC.GYM_PLANS_CREATE, data),
      update: (data: unknown) => invoke(IPC.GYM_PLANS_UPDATE, data),
      delete: (id: number) => invoke(IPC.GYM_PLANS_DELETE, id),
    },
    planDays: {
      add: (planId: number, data: unknown) => invoke(IPC.GYM_PLAN_DAYS_ADD, planId, data),
      update: (id: number, data: unknown) => invoke(IPC.GYM_PLAN_DAYS_UPDATE, id, data),
      delete: (id: number) => invoke(IPC.GYM_PLAN_DAYS_DELETE, id),
      addExercise: (planDayId: number, data: unknown) => invoke(IPC.GYM_PLAN_DAYS_ADD_EXERCISE, planDayId, data),
      updateExercise: (id: number, data: unknown) => invoke(IPC.GYM_PLAN_DAYS_UPDATE_EXERCISE, id, data),
      removeExercise: (id: number) => invoke(IPC.GYM_PLAN_DAYS_REMOVE_EXERCISE, id),
    },
    sessions: {
      getByClient: (clientId: number, limit?: number) => invoke(IPC.GYM_SESSIONS_GET_BY_CLIENT, clientId, limit),
      getById: (id: number) => invoke(IPC.GYM_SESSIONS_GET_BY_ID, id),
      create: (data: unknown) => invoke(IPC.GYM_SESSIONS_CREATE, data),
      addSet: (sessionId: number, data: unknown) => invoke(IPC.GYM_SESSIONS_ADD_SET, sessionId, data),
      updateSet: (id: number, data: unknown) => invoke(IPC.GYM_SESSIONS_UPDATE_SET, id, data),
      deleteSet: (id: number) => invoke(IPC.GYM_SESSIONS_DELETE_SET, id),
      finish: (id: number, rpe?: number) => invoke(IPC.GYM_SESSIONS_FINISH, id, rpe),
      getStats: (clientId: number) => invoke(IPC.GYM_SESSIONS_GET_STATS, clientId),
      getProgression: (clientId: number, exerciseId: number) => invoke(IPC.GYM_SESSIONS_GET_PROGRESSION, clientId, exerciseId),
      getPrs: (clientId: number) => invoke(IPC.GYM_SESSIONS_GET_PRS, clientId),
    },
  },

  running: {
    activities: {
      getByClient: (clientId: number, limit?: number) => invoke(IPC.RUNNING_ACTIVITIES_GET_BY_CLIENT, clientId, limit),
      getById: (id: number) => invoke(IPC.RUNNING_ACTIVITIES_GET_BY_ID, id),
      import: (clientId: number, filePath: string) => invoke(IPC.RUNNING_ACTIVITIES_IMPORT, clientId, filePath),
      getLaps: (activityId: number) => invoke(IPC.RUNNING_ACTIVITIES_GET_LAPS, activityId),
      getPoints: (activityId: number) => invoke(IPC.RUNNING_ACTIVITIES_GET_POINTS, activityId),
      getStats: (clientId: number) => invoke(IPC.RUNNING_ACTIVITIES_GET_STATS, clientId),
      delete: (id: number) => invoke(IPC.RUNNING_ACTIVITIES_DELETE, id),
    },
    hrZones: {
      get: (clientId: number) => invoke(IPC.HR_ZONES_GET, clientId),
      save: (data: unknown) => invoke(IPC.HR_ZONES_SAVE, data),
    },
  },

  config: {
    get: () => invoke(IPC.CONFIG_GET),
    set: (key: string, value: unknown) => invoke(IPC.CONFIG_SET, key, value),
    getGithub: () => invoke(IPC.CONFIG_GET_GITHUB),
    setGithub: (data: unknown) => invoke(IPC.CONFIG_SET_GITHUB, data),
    setupGithubRepo: (data: unknown) => invoke(IPC.CONFIG_SETUP_GITHUB_REPO, data),
  },

  dialog: {
    openFile: (filters?: unknown) => invoke<string | null>(IPC.DIALOG_OPEN_FILE, filters),
    openFolder: () => invoke<string | null>(IPC.DIALOG_OPEN_FOLDER),
  },
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
