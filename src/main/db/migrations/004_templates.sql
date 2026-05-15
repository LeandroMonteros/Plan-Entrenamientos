-- Migration 004: plantillas de rutinas

CREATE TABLE IF NOT EXISTS routine_templates (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  description   TEXT,
  level         TEXT,
  days_per_week INTEGER NOT NULL DEFAULT 3,
  type          TEXT NOT NULL DEFAULT 'gym' CHECK(type IN ('gym','running')),
  is_default    INTEGER NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS template_days (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL REFERENCES routine_templates(id) ON DELETE CASCADE,
  day_name    TEXT NOT NULL,
  focus       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS template_day_exercises (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  template_day_id  INTEGER NOT NULL REFERENCES template_days(id) ON DELETE CASCADE,
  exercise_id      INTEGER NOT NULL REFERENCES exercises(id),
  sets             INTEGER NOT NULL DEFAULT 3,
  reps             TEXT NOT NULL DEFAULT '10',
  weight_pct_1rm   REAL,
  rest_seconds     INTEGER DEFAULT 90,
  sort_order       INTEGER NOT NULL DEFAULT 0
);
