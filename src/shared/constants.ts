export const DB_VERSION = 4

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

export const INACTIVITY_ALERT_DEFAULT_DAYS = 7

export const BACKUP_RETENTION_DEFAULT = 7

export const FIT_MAGIC_BYTES = [0x0e, 0x10] // first 2 bytes of .FIT

export const GPX_MAGIC_STRING = '<?xml'

export const MUSCLE_GROUPS = [
  { slug: 'pecho', name: 'Pecho' },
  { slug: 'espalda', name: 'Espalda' },
  { slug: 'hombros', name: 'Hombros' },
  { slug: 'biceps', name: 'Bíceps' },
  { slug: 'triceps', name: 'Tríceps' },
  { slug: 'piernas', name: 'Piernas' },
  { slug: 'core', name: 'Core' },
  { slug: 'gluteos', name: 'Glúteos' },
  { slug: 'antebrazos', name: 'Antebrazos' },
  { slug: 'trapecio', name: 'Trapecio' },
] as const

export const EQUIPMENT_TYPES = [
  { value: 'barra', label: 'Barra' },
  { value: 'mancuernas', label: 'Mancuernas' },
  { value: 'maquina', label: 'Máquina' },
  { value: 'polea', label: 'Polea' },
  { value: 'peso_corporal', label: 'Peso corporal' },
  { value: 'banda', label: 'Banda elástica' },
  { value: 'kettlebell', label: 'Kettlebell' },
] as const

export const RUNNING_SESSION_TYPES = [
  { value: 'rodaje_suave', label: 'Rodaje suave' },
  { value: 'tempo', label: 'Tempo' },
  { value: 'intervalos', label: 'Intervalos' },
  { value: 'fondo_largo', label: 'Fondo largo' },
  { value: 'recuperacion', label: 'Recuperación' },
] as const

export const CLIENT_LEVELS = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
] as const

export const SEX_OPTIONS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
] as const

export const DAY_NAMES = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const

export const HR_ZONE_LABELS = ['Z1 Recuperación', 'Z2 Base', 'Z3 Aeróbico', 'Z4 Umbral', 'Z5 Máximo'] as const

export const PLAN_TYPES = [
  { value: 'gym', label: 'Gimnasio' },
  { value: 'running', label: 'Running' },
] as const
