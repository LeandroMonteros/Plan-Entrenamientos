// ─── Clientes ─────────────────────────────────────────────────────────────────

export interface Client {
  id: number
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  birthDate: string | null
  sex: 'M' | 'F' | 'otro' | null
  weightKg: number | null
  heightCm: number | null
  goal: string | null
  level: 'principiante' | 'intermedio' | 'avanzado' | null
  medicalNotes: string | null
  injuryHistory: string | null
  privateNotes: string | null
  isActive: number
  avatarPath: string | null
  createdAt: string
  updatedAt: string
}

export type ClientCreate = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
export type ClientUpdate = Partial<ClientCreate> & { id: number }

// ─── Mediciones ───────────────────────────────────────────────────────────────

export interface BodyMeasurement {
  id: number
  clientId: number
  measuredAt: string
  weightKg: number | null
  bodyFatPct: number | null
  chestCm: number | null
  waistCm: number | null
  hipsCm: number | null
  armCm: number | null
  thighCm: number | null
  notes: string | null
}

// ─── Ejercicios ───────────────────────────────────────────────────────────────

export interface MuscleGroup {
  id: number
  name: string
  slug: string
}

export interface Exercise {
  id: number
  name: string
  primaryMuscleGroupId: number
  primaryMuscleGroupName?: string
  secondaryMuscleGroupIds: number[]
  equipmentType: string
  exerciseType: string
  description: string | null
  techniqueNotes: string | null
  imagePath: string | null
  isDefault: number
  createdAt: string
}

export type ExerciseCreate = Omit<Exercise, 'id' | 'createdAt' | 'primaryMuscleGroupName'>
export type ExerciseUpdate = Partial<ExerciseCreate> & { id: number }

// ─── Planes de Gimnasio ───────────────────────────────────────────────────────

export interface TrainingPlan {
  id: number
  clientId: number
  templateId: number | null
  name: string
  objective: string | null
  level: string | null
  notes: string | null
  startDate: string | null
  endDate: string | null
  isActive: number
  createdAt: string
  updatedAt: string
}

export interface TrainingPlanDay {
  id: number
  planId: number
  dayOfWeek: number
  name: string
  sortOrder: number
  exercises?: PlanDayExercise[]
}

export interface PlanDayExercise {
  id: number
  planDayId: number
  exerciseId: number
  exerciseName?: string
  primaryMuscleGroupName?: string
  sets: number
  reps: string
  weightKg: number | null
  restSeconds: number | null
  techniqueNotes: string | null
  sortOrder: number
}

// ─── Sesiones de Gimnasio ─────────────────────────────────────────────────────

export interface TrainingSession {
  id: number
  clientId: number
  planId: number | null
  planDayId: number | null
  planName?: string | null
  planDayName?: string | null
  sessionDate: string
  startedAt: string | null
  endedAt: string | null
  notes: string | null
  overallRpe: number | null
  createdAt: string
  setCount?: number
  totalVolume?: number
}

export interface SessionExerciseSet {
  id: number
  sessionId: number
  exerciseId: number
  exerciseName?: string
  setNumber: number
  repsDone: number | null
  weightKg: number | null
  rpe: number | null
  notes: string | null
  isPr: number
}

export interface SessionWithSets extends TrainingSession {
  sets: SessionExerciseSet[]
}

// ─── Récords Personales ───────────────────────────────────────────────────────

export interface PersonalRecord {
  id: number
  clientId: number
  exerciseId: number
  exerciseName?: string
  sessionId: number | null
  recordType: '1rm' | 'max_reps' | 'max_volume'
  value: number
  achievedAt: string
}

// ─── Plantillas ───────────────────────────────────────────────────────────────

export interface RoutineTemplate {
  id: number
  name: string
  description: string | null
  level: string | null
  daysPerWeek: number
  type: 'gym' | 'running'
  isDefault: number
  createdAt: string
}

// ─── Planes de Running ────────────────────────────────────────────────────────

export interface RunningPlan {
  id: number
  clientId: number
  templateId: number | null
  name: string
  goalRace: string | null
  goalDate: string | null
  goalTimeSeconds: number | null
  weeks: number | null
  isActive: number
  createdAt: string
}

export interface RunningPlanWeek {
  id: number
  planId: number
  weekNumber: number
  focus: string | null
  totalKmTarget: number | null
  sessions?: RunningPlanSession[]
}

export interface RunningPlanSession {
  id: number
  weekId: number
  dayOfWeek: number
  sessionType: string
  distanceKm: number | null
  durationMin: number | null
  paceTargetMinKm: number | null
  description: string | null
  intervalsConfig: string | null
}

// ─── Actividades de Running ───────────────────────────────────────────────────

export interface RunningActivity {
  id: number
  clientId: number
  planSessionId: number | null
  sourceFile: string | null
  sourceType: 'fit' | 'gpx' | 'manual'
  activityDate: string
  startedAt: string | null
  durationSeconds: number | null
  distanceMeters: number | null
  avgPaceMinKm: number | null
  avgSpeedKmh: number | null
  avgHeartRate: number | null
  maxHeartRate: number | null
  avgCadence: number | null
  elevationGainM: number | null
  elevationLossM: number | null
  calories: number | null
  vo2maxEstimate: number | null
  trainingEffectAerobic: number | null
  trainingEffectAnaerobic: number | null
  hrZone1Seconds: number | null
  hrZone2Seconds: number | null
  hrZone3Seconds: number | null
  hrZone4Seconds: number | null
  hrZone5Seconds: number | null
  hasGps: number
  notes: string | null
  createdAt: string
}

export interface RunningActivityLap {
  id: number
  activityId: number
  lapNumber: number
  distanceMeters: number | null
  durationSeconds: number | null
  avgPaceMinKm: number | null
  avgHeartRate: number | null
  avgCadence: number | null
  elevationGainM: number | null
}

export interface RunningActivityPoint {
  id: number
  activityId: number
  timestamp: string
  latitude: number | null
  longitude: number | null
  altitudeM: number | null
  heartRate: number | null
  cadence: number | null
  speedMs: number | null
  distanceMeters: number | null
}

// ─── Zonas de FC ──────────────────────────────────────────────────────────────

export interface HeartRateZones {
  id: number
  clientId: number
  maxHr: number
  zone1Min: number
  zone1Max: number
  zone2Min: number
  zone2Max: number
  zone3Min: number
  zone3Max: number
  zone4Min: number
  zone4Max: number
  zone5Min: number
  zone5Max: number
  calculationMethod: 'hrmax_pct' | 'karvonen'
  updatedAt: string
}

// ─── Configuración ────────────────────────────────────────────────────────────

export interface AppConfig {
  trainerName: string
  theme: 'light' | 'dark' | 'system'
  githubOwner: string | null
  githubRepo: string | null
  githubSetupDone: boolean
  backupPath: string | null
  backupFrequency: 'daily' | 'weekly' | 'off'
  inactivityAlertDays: number
  onboardingDone: boolean
  lastUpdateCheck: string | null
}

// ─── IPC Response ─────────────────────────────────────────────────────────────

export interface IpcResponse<T = unknown> {
  data: T | null
  error: string | null
}

// ─── Update ───────────────────────────────────────────────────────────────────

export interface UpdateInfo {
  version: string
  releaseNotes: string | null
  releaseDate: string | null
}
