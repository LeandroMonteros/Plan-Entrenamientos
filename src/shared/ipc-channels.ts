export const IPC = {
  // Clientes
  CLIENTS_GET_ALL: 'clients:getAll',
  CLIENTS_GET_BY_ID: 'clients:getById',
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_UPDATE: 'clients:update',
  CLIENTS_DELETE: 'clients:delete',
  CLIENTS_GET_MEASUREMENTS: 'clients:getMeasurements',
  CLIENTS_ADD_MEASUREMENT: 'clients:addMeasurement',

  // Ejercicios
  EXERCISES_GET_ALL: 'exercises:getAll',
  EXERCISES_GET_BY_ID: 'exercises:getById',
  EXERCISES_CREATE: 'exercises:create',
  EXERCISES_UPDATE: 'exercises:update',
  EXERCISES_DELETE: 'exercises:delete',
  EXERCISES_GET_MUSCLE_GROUPS: 'exercises:getMuscleGroups',
  EXERCISES_SET_MEDIA: 'exercises:setMedia',

  // Gym - Planes
  GYM_PLANS_GET_BY_CLIENT: 'gym:plans:getByClient',
  GYM_PLANS_GET_BY_ID: 'gym:plans:getById',
  GYM_PLANS_CREATE: 'gym:plans:create',
  GYM_PLANS_UPDATE: 'gym:plans:update',
  GYM_PLANS_DELETE: 'gym:plans:delete',
  GYM_PLAN_DAYS_ADD: 'gym:planDays:add',
  GYM_PLAN_DAYS_UPDATE: 'gym:planDays:update',
  GYM_PLAN_DAYS_DELETE: 'gym:planDays:delete',
  GYM_PLAN_DAYS_ADD_EXERCISE: 'gym:planDays:addExercise',
  GYM_PLAN_DAYS_UPDATE_EXERCISE: 'gym:planDays:updateExercise',
  GYM_PLAN_DAYS_REMOVE_EXERCISE: 'gym:planDays:removeExercise',

  // Gym - Sesiones
  GYM_SESSIONS_GET_BY_CLIENT: 'gym:sessions:getByClient',
  GYM_SESSIONS_GET_BY_ID: 'gym:sessions:getById',
  GYM_SESSIONS_CREATE: 'gym:sessions:create',
  GYM_SESSIONS_ADD_SET: 'gym:sessions:addSet',
  GYM_SESSIONS_UPDATE_SET: 'gym:sessions:updateSet',
  GYM_SESSIONS_DELETE_SET: 'gym:sessions:deleteSet',
  GYM_SESSIONS_FINISH: 'gym:sessions:finish',
  GYM_SESSIONS_GET_STATS: 'gym:sessions:getStats',
  GYM_SESSIONS_GET_PROGRESSION: 'gym:sessions:getProgression',
  GYM_SESSIONS_GET_PRS: 'gym:sessions:getPrs',

  // Running - Planes
  RUNNING_PLANS_GET_BY_CLIENT: 'running:plans:getByClient',
  RUNNING_PLANS_GET_BY_ID: 'running:plans:getById',
  RUNNING_PLANS_CREATE: 'running:plans:create',
  RUNNING_PLANS_UPDATE: 'running:plans:update',

  // Running - Actividades
  RUNNING_ACTIVITIES_GET_BY_CLIENT: 'running:activities:getByClient',
  RUNNING_ACTIVITIES_GET_BY_ID: 'running:activities:getById',
  RUNNING_ACTIVITIES_IMPORT: 'running:activities:import',
  RUNNING_ACTIVITIES_GET_LAPS: 'running:activities:getLaps',
  RUNNING_ACTIVITIES_GET_POINTS: 'running:activities:getPoints',
  RUNNING_ACTIVITIES_GET_STATS: 'running:activities:getStats',
  RUNNING_ACTIVITIES_DELETE: 'running:activities:delete',

  // HR Zones
  HR_ZONES_GET: 'hr:zones:get',
  HR_ZONES_SAVE: 'hr:zones:save',

  // Plantillas
  TEMPLATES_GET_ALL: 'templates:getAll',

  // Configuración
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_GET_GITHUB: 'config:getGithub',
  CONFIG_SET_GITHUB: 'config:setGithub',
  CONFIG_SETUP_GITHUB_REPO: 'config:setupGithubRepo',

  // Updates
  UPDATER_CHECK: 'updater:check',
  UPDATER_DOWNLOAD: 'updater:download',
  UPDATER_INSTALL: 'updater:install',
  UPDATER_STATUS: 'updater:status',

  // Backup
  BACKUP_NOW: 'backup:now',
  BACKUP_GET_STATUS: 'backup:getStatus',

  // File dialog
  DIALOG_OPEN_FILE: 'dialog:openFile',
  DIALOG_OPEN_FOLDER: 'dialog:openFolder',
} as const
