export const MIGRATIONS: { filename: string; sql: string }[] = [
  {
    filename: '001_initial.sql',
    sql: `
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
        template_id INTEGER,
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
    `,
  },
  {
    filename: '002_running.sql',
    sql: `
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
        plan_session_id           INTEGER,
        source_file               TEXT,
        source_type               TEXT NOT NULL DEFAULT 'manual',
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
    `,
  },
  {
    filename: '003_measurements.sql',
    sql: `
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
        calculation_method   TEXT NOT NULL DEFAULT 'hrmax_pct',
        updated_at           DATETIME NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS personal_records (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id    INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        exercise_id  INTEGER NOT NULL REFERENCES exercises(id),
        session_id   INTEGER REFERENCES training_sessions(id),
        record_type  TEXT NOT NULL DEFAULT '1rm',
        value        REAL NOT NULL,
        achieved_at  DATE NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_prs_unique ON personal_records(client_id, exercise_id, record_type);
      CREATE INDEX IF NOT EXISTS idx_prs_client ON personal_records(client_id, exercise_id);
    `,
  },
  {
    filename: '004_templates.sql',
    sql: `
      CREATE TABLE IF NOT EXISTS routine_templates (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL,
        description   TEXT,
        level         TEXT,
        days_per_week INTEGER NOT NULL DEFAULT 3,
        type          TEXT NOT NULL DEFAULT 'gym',
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
    `,
  },
  {
    filename: '005_exercise_media.sql',
    sql: `ALTER TABLE exercises ADD COLUMN video_path TEXT;`,
  },
]
