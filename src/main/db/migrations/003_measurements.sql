-- Migration 003: mediciones corporales, fotos de progreso, zonas de FC, PRs

CREATE TABLE IF NOT EXISTS body_measurements (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id    INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  measured_at  DATE NOT NULL,
  weight_kg    REAL,
  body_fat_pct REAL,
  chest_cm     REAL,
  waist_cm     REAL,
  hips_cm      REAL,
  arm_cm       REAL,
  thigh_cm     REAL,
  notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_measurements_client ON body_measurements(client_id, measured_at);

CREATE TABLE IF NOT EXISTS progress_photos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id  INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  photo_path TEXT NOT NULL,
  taken_at   DATE NOT NULL,
  notes      TEXT
);

CREATE INDEX IF NOT EXISTS idx_photos_client ON progress_photos(client_id);

CREATE TABLE IF NOT EXISTS heart_rate_zones (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id            INTEGER NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  max_hr               INTEGER NOT NULL DEFAULT 190,
  zone1_min            INTEGER NOT NULL DEFAULT 0,
  zone1_max            INTEGER NOT NULL DEFAULT 114,
  zone2_min            INTEGER NOT NULL DEFAULT 114,
  zone2_max            INTEGER NOT NULL DEFAULT 133,
  zone3_min            INTEGER NOT NULL DEFAULT 133,
  zone3_max            INTEGER NOT NULL DEFAULT 152,
  zone4_min            INTEGER NOT NULL DEFAULT 152,
  zone4_max            INTEGER NOT NULL DEFAULT 171,
  zone5_min            INTEGER NOT NULL DEFAULT 171,
  zone5_max            INTEGER NOT NULL DEFAULT 200,
  calculation_method   TEXT NOT NULL DEFAULT 'hrmax_pct' CHECK(calculation_method IN ('hrmax_pct','karvonen')),
  updated_at           DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS personal_records (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id    INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  exercise_id  INTEGER NOT NULL REFERENCES exercises(id),
  session_id   INTEGER REFERENCES training_sessions(id),
  record_type  TEXT NOT NULL DEFAULT '1rm' CHECK(record_type IN ('1rm','max_reps','max_volume')),
  value        REAL NOT NULL,
  achieved_at  DATE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prs_client ON personal_records(client_id, exercise_id);
