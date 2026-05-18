import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'
import type {
  Client, BodyMeasurement,
  Exercise, MuscleGroup,
  TrainingPlan, TrainingPlanDay, PlanDayExercise,
  TrainingSession, SessionWithSets, SessionExerciseSet, PersonalRecord,
  RunningActivity, RunningActivityLap, RunningActivityPoint, HeartRateZones,
  AppConfig,
} from '../shared/types'

function invoke<T>(channel: string, ...args: unknown[]) {
  return ipcRenderer.invoke(channel, ...args) as Promise<{ data: T | null; error: string | null }>
}

const api = {
  clients: {
    getAll: () => invoke<Client[]>(IPC.CLIENTS_GET_ALL),
    getById: (id: number) => invoke<Client>(IPC.CLIENTS_GET_BY_ID, id),
    create: (data: unknown) => invoke<Client>(IPC.CLIENTS_CREATE, data),
    update: (data: unknown) => invoke<Client>(IPC.CLIENTS_UPDATE, data),
    delete: (id: number) => invoke<boolean>(IPC.CLIENTS_DELETE, id),
    getMeasurements: (clientId: number) => invoke<BodyMeasurement[]>(IPC.CLIENTS_GET_MEASUREMENTS, clientId),
    addMeasurement: (data: unknown) => invoke<BodyMeasurement>(IPC.CLIENTS_ADD_MEASUREMENT, data),
  },

  exercises: {
    getAll: (filters?: unknown) => invoke<Exercise[]>(IPC.EXERCISES_GET_ALL, filters),
    getById: (id: number) => invoke<Exercise>(IPC.EXERCISES_GET_BY_ID, id),
    create: (data: unknown) => invoke<Exercise>(IPC.EXERCISES_CREATE, data),
    update: (data: unknown) => invoke<Exercise>(IPC.EXERCISES_UPDATE, data),
    delete: (id: number) => invoke<boolean>(IPC.EXERCISES_DELETE, id),
    getMuscleGroups: () => invoke<MuscleGroup[]>(IPC.EXERCISES_GET_MUSCLE_GROUPS),
    setMedia: (exerciseId: number, type: 'image' | 'video', sourcePath: string | null) =>
      invoke<Exercise>(IPC.EXERCISES_SET_MEDIA, { exerciseId, type, sourcePath }),
  },

  gym: {
    plans: {
      getByClient: (clientId: number) => invoke<TrainingPlan[]>(IPC.GYM_PLANS_GET_BY_CLIENT, clientId),
      getById: (id: number) => invoke<TrainingPlan & { days: TrainingPlanDay[] }>(IPC.GYM_PLANS_GET_BY_ID, id),
      create: (data: unknown) => invoke<TrainingPlan>(IPC.GYM_PLANS_CREATE, data),
      update: (data: unknown) => invoke<boolean>(IPC.GYM_PLANS_UPDATE, data),
      delete: (id: number) => invoke<boolean>(IPC.GYM_PLANS_DELETE, id),
    },
    planDays: {
      add: (planId: number, data: unknown) => invoke<TrainingPlanDay>(IPC.GYM_PLAN_DAYS_ADD, planId, data),
      update: (id: number, data: unknown) => invoke<boolean>(IPC.GYM_PLAN_DAYS_UPDATE, id, data),
      delete: (id: number) => invoke<boolean>(IPC.GYM_PLAN_DAYS_DELETE, id),
      addExercise: (planDayId: number, data: unknown) => invoke<PlanDayExercise>(IPC.GYM_PLAN_DAYS_ADD_EXERCISE, planDayId, data),
      updateExercise: (id: number, data: unknown) => invoke<boolean>(IPC.GYM_PLAN_DAYS_UPDATE_EXERCISE, id, data),
      removeExercise: (id: number) => invoke<boolean>(IPC.GYM_PLAN_DAYS_REMOVE_EXERCISE, id),
    },
    sessions: {
      getByClient: (clientId: number, limit?: number) => invoke<TrainingSession[]>(IPC.GYM_SESSIONS_GET_BY_CLIENT, clientId, limit),
      getById: (id: number) => invoke<SessionWithSets>(IPC.GYM_SESSIONS_GET_BY_ID, id),
      create: (data: unknown) => invoke<TrainingSession>(IPC.GYM_SESSIONS_CREATE, data),
      addSet: (sessionId: number, data: unknown) => invoke<SessionExerciseSet>(IPC.GYM_SESSIONS_ADD_SET, sessionId, data),
      updateSet: (id: number, data: unknown) => invoke<boolean>(IPC.GYM_SESSIONS_UPDATE_SET, id, data),
      deleteSet: (id: number) => invoke<boolean>(IPC.GYM_SESSIONS_DELETE_SET, id),
      finish: (id: number, rpe?: number) => invoke<boolean>(IPC.GYM_SESSIONS_FINISH, id, rpe),
      getStats: (clientId: number) => invoke<{ totalSessions: number; totalVolume: number; lastSessionDate: string | null }>(IPC.GYM_SESSIONS_GET_STATS, clientId),
      getProgression: (clientId: number, exerciseId: number) => invoke<{ date: string; maxWeight: number; totalVolume: number }[]>(IPC.GYM_SESSIONS_GET_PROGRESSION, clientId, exerciseId),
      getPrs: (clientId: number) => invoke<PersonalRecord[]>(IPC.GYM_SESSIONS_GET_PRS, clientId),
    },
  },

  running: {
    activities: {
      getByClient: (clientId: number, limit?: number) => invoke<RunningActivity[]>(IPC.RUNNING_ACTIVITIES_GET_BY_CLIENT, clientId, limit),
      getById: (id: number) => invoke<RunningActivity>(IPC.RUNNING_ACTIVITIES_GET_BY_ID, id),
      import: (clientId: number, filePath: string) => invoke<RunningActivity>(IPC.RUNNING_ACTIVITIES_IMPORT, clientId, filePath),
      getLaps: (activityId: number) => invoke<RunningActivityLap[]>(IPC.RUNNING_ACTIVITIES_GET_LAPS, activityId),
      getPoints: (activityId: number) => invoke<RunningActivityPoint[]>(IPC.RUNNING_ACTIVITIES_GET_POINTS, activityId),
      getStats: (clientId: number) => invoke<{ week: string; totalKm: number; count: number }[]>(IPC.RUNNING_ACTIVITIES_GET_STATS, clientId),
      delete: (id: number) => invoke<boolean>(IPC.RUNNING_ACTIVITIES_DELETE, id),
    },
    hrZones: {
      get: (clientId: number) => invoke<HeartRateZones | null>(IPC.HR_ZONES_GET, clientId),
      save: (data: unknown) => invoke<HeartRateZones>(IPC.HR_ZONES_SAVE, data),
    },
  },

  config: {
    get: () => invoke<AppConfig>(IPC.CONFIG_GET),
    set: (key: string, value: unknown) => invoke<boolean>(IPC.CONFIG_SET, key, value),
    getGithub: () => invoke<{ owner: string | null; repo: string | null; hasToken: boolean; setupDone: boolean }>(IPC.CONFIG_GET_GITHUB),
    setGithub: (data: unknown) => invoke<boolean>(IPC.CONFIG_SET_GITHUB, data),
    setupGithubRepo: (data: unknown) => invoke<boolean>(IPC.CONFIG_SETUP_GITHUB_REPO, data),
  },

  dialog: {
    openFile: (filters?: unknown) => invoke<string | null>(IPC.DIALOG_OPEN_FILE, filters),
    openFolder: () => invoke<string | null>(IPC.DIALOG_OPEN_FOLDER),
  },
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
