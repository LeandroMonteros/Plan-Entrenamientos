import Database from 'better-sqlite3'
import log from 'electron-log'
import { MIGRATIONS } from './migrations'

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      filename   TEXT NOT NULL UNIQUE,
      applied_at DATETIME NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const applied = new Set(
    (db.prepare('SELECT filename FROM _migrations').all() as { filename: string }[]).map(
      (r) => r.filename,
    ),
  )

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.filename)) continue

    log.info(`Applying migration: ${migration.filename}`)

    db.transaction(() => {
      db.exec(migration.sql)
      db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(migration.filename)
    })()

    log.info(`Migration applied: ${migration.filename}`)
  }
}
