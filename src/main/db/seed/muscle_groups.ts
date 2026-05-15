import Database from 'better-sqlite3'

const GROUPS = [
  { name: 'Pecho', slug: 'pecho' },
  { name: 'Espalda', slug: 'espalda' },
  { name: 'Hombros', slug: 'hombros' },
  { name: 'Bíceps', slug: 'biceps' },
  { name: 'Tríceps', slug: 'triceps' },
  { name: 'Piernas', slug: 'piernas' },
  { name: 'Core', slug: 'core' },
  { name: 'Glúteos', slug: 'gluteos' },
  { name: 'Antebrazos', slug: 'antebrazos' },
  { name: 'Trapecio', slug: 'trapecio' },
]

export function seedMuscleGroups(db: Database.Database): void {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO muscle_groups (name, slug) VALUES (@name, @slug)',
  )
  for (const group of GROUPS) insert.run(group)
}

export function getMuscleGroupIdMap(db: Database.Database): Record<string, number> {
  const rows = db.prepare('SELECT id, slug FROM muscle_groups').all() as {
    id: number
    slug: string
  }[]
  return Object.fromEntries(rows.map((r) => [r.slug, r.id]))
}
