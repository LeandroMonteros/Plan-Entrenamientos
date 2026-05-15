-- Migration 001: tablas base (clientes, ejercicios, planes de gym, sesiones)

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS muscle_groups (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS exercises (
  id                         INTEGER PRIMARY KEY AUTOINCREMENT,
  name                       TEXT NOT NULL,
  primary_muscle_group_id    INTEGER NOT NULL REFERENCES muscle_groups(id),
  secondary_muscle_group_ids TEXT NOT NULL DEFAULT '[]',
  equipment_type             TEXT NOT NULL DEFAULT 'peso_corporal',
  exercise_type              TEXT NOT NULL DEFAULT 'libre',
  description                TEXT,
  technique_notes            TEXT,
  image_path                 TEXT,
  is_default                 INTEGER NOT NULL DEFAULT 0,
  created_at                 DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_exercises_muscle ON exercises(primary_muscle_group_id);

CREATE TABLE IF NOT EXISTS clients (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  birth_date      DATE,
  sex             TEXT CHECK(sex IN ('M','F','otro')),
  weight_kg       REAL,
  height_cm       REAL,
  goal            TEXT,
  level           TEXT CHECK(level IN ('principiante','intermedio','avanzado')),
  medical_notes   TEXT,
  injury_history  TEXT,
  private_notes   TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1,
  avatar_path     TEXT,
  created_at      DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at      DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS training_plans (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id   INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES routine_templates(id),
  name        TEXT NOT NULL,
  objective   TEXT,
  level       TEXT,
  notes       TEXT,
  start_date  DATE,
  end_date    DATE,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_plans_client ON training_plans(client_id);

CREATE TABLE IF NOT EXISTS training_plan_days (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id     INTEGER NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL DEFAULT 0,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_plan_days_plan ON training_plan_days(plan_id);

CREATE TABLE IF NOT EXISTS plan_day_exercises (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_day_id     INTEGER NOT NULL REFERENCES training_plan_days(id) ON DELETE CASCADE,
  exercise_id     INTEGER NOT NULL REFERENCES exercises(id),
  sets            INTEGER NOT NULL DEFAULT 3,
  reps            TEXT NOT NULL DEFAULT '10',
  weight_kg       REAL,
  rest_seconds    INTEGER DEFAULT 90,
  technique_notes TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pde_day ON plan_day_exercises(plan_day_id);

CREATE TABLE IF NOT EXISTS training_sessions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id    INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_id      INTEGER REFERENCES training_plans(id),
  plan_day_id  INTEGER REFERENCES training_plan_days(id),
  session_date DATE NOT NULL,
  started_at   DATETIME,
  ended_at     DATETIME,
  notes        TEXT,
  overall_rpe  INTEGER CHECK(overall_rpe BETWEEN 1 AND 10),
  created_at   DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_client_date ON training_sessions(client_id, session_date);

CREATE TABLE IF NOT EXISTS session_exercise_sets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  INTEGER NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  set_number  INTEGER NOT NULL DEFAULT 1,
  reps_done   INTEGER,
  weight_kg   REAL,
  rpe         INTEGER CHECK(rpe BETWEEN 1 AND 10),
  notes       TEXT,
  is_pr       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sets_session ON session_exercise_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise ON session_exercise_sets(exercise_id);
