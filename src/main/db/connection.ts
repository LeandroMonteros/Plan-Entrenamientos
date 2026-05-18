import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import { runMigrations } from './migrate'
import { runSeed } from './seed'
import { backfillExerciseImages } from './seed/exercises'

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.')
  return _db
}

export function initDb(): void {
  const dbPath = join(app.getPath('userData'), 'entrenamiento.db')
  log.info('Opening database at:', dbPath)

  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  _db.pragma('busy_timeout = 5000')

  runMigrations(_db)
  runSeed(_db)

  const exercisesResourceDir = app.isPackaged
    ? join(process.resourcesPath, 'exercises')
    : join(app.getAppPath(), 'resources', 'exercises')
  const mediaDestDir = join(app.getPath('userData'), 'media', 'exercises')
  backfillExerciseImages(_db, exercisesResourceDir, mediaDestDir)

  log.info('Database initialized successfully')
}

export function closeDb(): void {
  if (_db) {
    _db.close()
    _db = null
    log.info('Database closed')
  }
}
