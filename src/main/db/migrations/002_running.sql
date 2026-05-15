-- Migration 002: tablas de running (planes, actividades, laps, puntos GPS)

CREATE TABLE IF NOT EXISTS running_plans (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id           INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id         INTEGER,
  name                TEXT NOT NULL,
  goal_race           TEXT,
  goal_date           DATE,
  goal_time_seconds   INTEGER,
  weeks               INTEGER,
  is_active           INTEGER NOT NULL DEFAULT 1,
  created_at          DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_running_plans_client ON running_plans(client_id);

CREATE TABLE IF NOT EXISTS running_plan_weeks (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id         INTEGER NOT NULL REFERENCES running_plans(id) ON DELETE CASCADE,
  week_number     INTEGER NOT NULL,
  focus           TEXT,
  total_km_target REAL
);

CREATE TABLE IF NOT EXISTS running_plan_sessions (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  week_id            INTEGER NOT NULL REFERENCES running_plan_weeks(id) ON DELETE CASCADE,
  day_of_week        INTEGER NOT NULL DEFAULT 0,
  session_type       TEXT NOT NULL DEFAULT 'rodaje_suave',
  distance_km        REAL,
  duration_min       INTEGER,
  pace_target_min_km REAL,
  description        TEXT,
  intervals_config   TEXT
);

CREATE TABLE IF NOT EXISTS running_activities (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id                 INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_session_id           INTEGER REFERENCES running_plan_sessions(id),
  source_file               TEXT,
  source_type               TEXT NOT NULL DEFAULT 'manual' CHECK(source_type IN ('fit','gpx','manual')),
  activity_date             DATE NOT NULL,
  started_at                DATETIME,
  duration_seconds          INTEGER,
  distance_meters           REAL,
  avg_pace_min_km           REAL,
  avg_speed_kmh             REAL,
  avg_heart_rate            INTEGER,
  max_heart_rate            INTEGER,
  avg_cadence               INTEGER,
  elevation_gain_m          REAL,
  elevation_loss_m          REAL,
  calories                  INTEGER,
  vo2max_estimate           REAL,
  training_effect_aerobic   REAL,
  training_effect_anaerobic REAL,
  hr_zone_1_seconds         INTEGER DEFAULT 0,
  hr_zone_2_seconds         INTEGER DEFAULT 0,
  hr_zone_3_seconds         INTEGER DEFAULT 0,
  hr_zone_4_seconds         INTEGER DEFAULT 0,
  hr_zone_5_seconds         INTEGER DEFAULT 0,
  has_gps                   INTEGER NOT NULL DEFAULT 0,
  notes                     TEXT,
  created_at                DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activities_client_date ON running_activities(client_id, activity_date);

CREATE TABLE IF NOT EXISTS running_activity_laps (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id      INTEGER NOT NULL REFERENCES running_activities(id) ON DELETE CASCADE,
  lap_number       INTEGER NOT NULL,
  distance_meters  REAL,
  duration_seconds INTEGER,
  avg_pace_min_km  REAL,
  avg_heart_rate   INTEGER,
  avg_cadence      INTEGER,
  elevation_gain_m REAL
);

CREATE INDEX IF NOT EXISTS idx_laps_activity ON running_activity_laps(activity_id);

CREATE TABLE IF NOT EXISTS running_activity_points (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id      INTEGER NOT NULL REFERENCES running_activities(id) ON DELETE CASCADE,
  timestamp        DATETIME,
  latitude         REAL,
  longitude        REAL,
  altitude_m       REAL,
  heart_rate       INTEGER,
  cadence          INTEGER,
  speed_ms         REAL,
  distance_meters  REAL
);

CREATE INDEX IF NOT EXISTS idx_points_activity ON running_activity_points(activity_id);
