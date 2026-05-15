import Database from 'better-sqlite3'
import log from 'electron-log'
import { seedMuscleGroups } from './muscle_groups'
import { seedExercises } from './exercises'
import { seedTemplates } from './templates'

export function runSeed(db: Database.Database): void {
  const count = (db.prepare('SELECT COUNT(*) as n FROM muscle_groups').get() as { n: number }).n
  if (count > 0) {
    log.info('Seed data already present, skipping')
    return
  }

  log.info('Running seed data...')

  db.transaction(() => {
    seedMuscleGroups(db)
    seedExercises(db)
    seedTemplates(db)
  })()

  log.info('Seed data applied successfully')
}
