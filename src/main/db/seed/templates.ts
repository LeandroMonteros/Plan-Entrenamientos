import Database from 'better-sqlite3'

interface TemplateDef {
  name: string
  description: string
  level: string
  daysPerWeek: number
  type: 'gym' | 'running'
  days: {
    dayName: string
    focus: string
  }[]
}

const TEMPLATES: TemplateDef[] = [
  {
    name: 'Fullbody 3 días',
    description: 'Rutina de cuerpo completo para principiantes. Lunes, miércoles y viernes.',
    level: 'principiante',
    daysPerWeek: 3,
    type: 'gym',
    days: [
      { dayName: 'Día A (Lunes)', focus: 'Cuerpo completo - Énfasis press' },
      { dayName: 'Día B (Miércoles)', focus: 'Cuerpo completo - Énfasis jalón' },
      { dayName: 'Día C (Viernes)', focus: 'Cuerpo completo - Énfasis piernas' },
    ],
  },
  {
    name: 'Torso / Pierna 4 días',
    description: 'División torso/pierna para nivel intermedio. 4 días semanales.',
    level: 'intermedio',
    daysPerWeek: 4,
    type: 'gym',
    days: [
      { dayName: 'Torso A (Lunes)', focus: 'Pecho + Espalda + Hombros + Brazos' },
      { dayName: 'Pierna A (Martes)', focus: 'Cuádriceps + Isquios + Glúteos + Gemelos' },
      { dayName: 'Torso B (Jueves)', focus: 'Pecho + Espalda + Hombros + Brazos' },
      { dayName: 'Pierna B (Viernes)', focus: 'Cuádriceps + Isquios + Glúteos + Gemelos' },
    ],
  },
  {
    name: 'PPL — Push / Pull / Legs',
    description: 'Push/Pull/Pierna 6 días para nivel avanzado.',
    level: 'avanzado',
    daysPerWeek: 6,
    type: 'gym',
    days: [
      { dayName: 'Push A (Lunes)', focus: 'Pecho + Hombros + Tríceps' },
      { dayName: 'Pull A (Martes)', focus: 'Espalda + Bíceps' },
      { dayName: 'Pierna A (Miércoles)', focus: 'Cuádriceps + Isquios + Glúteos' },
      { dayName: 'Push B (Jueves)', focus: 'Pecho + Hombros + Tríceps' },
      { dayName: 'Pull B (Viernes)', focus: 'Espalda + Bíceps' },
      { dayName: 'Pierna B (Sábado)', focus: 'Cuádriceps + Isquios + Glúteos' },
    ],
  },
  {
    name: 'Plan Running Base 5K',
    description: 'Plan de 8 semanas para completar tu primer 5K. 3 días de carrera por semana.',
    level: 'principiante',
    daysPerWeek: 3,
    type: 'running',
    days: [
      { dayName: 'Día 1', focus: 'Rodaje suave / Intervalos cortos' },
      { dayName: 'Día 2', focus: 'Ritmo continuo' },
      { dayName: 'Día 3', focus: 'Tirada larga' },
    ],
  },
  {
    name: 'Plan 10K Intermedio',
    description: 'Plan de 12 semanas para bajar de 60 minutos en 10K. 4 días de carrera.',
    level: 'intermedio',
    daysPerWeek: 4,
    type: 'running',
    days: [
      { dayName: 'Día 1', focus: 'Recuperación' },
      { dayName: 'Día 2', focus: 'Intervalos / Tempo' },
      { dayName: 'Día 3', focus: 'Rodaje continuo' },
      { dayName: 'Día 4', focus: 'Tirada larga' },
    ],
  },
  {
    name: 'Plan Media Maratón',
    description: 'Plan de 16 semanas para completar una media maratón. 5 días de carrera.',
    level: 'avanzado',
    daysPerWeek: 5,
    type: 'running',
    days: [
      { dayName: 'Día 1', focus: 'Recuperación activa' },
      { dayName: 'Día 2', focus: 'Intervalos en pista' },
      { dayName: 'Día 3', focus: 'Rodaje a ritmo de competición' },
      { dayName: 'Día 4', focus: 'Rodaje suave' },
      { dayName: 'Día 5', focus: 'Tirada larga' },
    ],
  },
]

export function seedTemplates(db: Database.Database): void {
  const insertTemplate = db.prepare(`
    INSERT OR IGNORE INTO routine_templates
      (name, description, level, days_per_week, type, is_default)
    VALUES
      (@name, @description, @level, @daysPerWeek, @type, 1)
  `)

  const insertDay = db.prepare(`
    INSERT INTO template_days (template_id, day_name, focus, sort_order)
    VALUES (@templateId, @dayName, @focus, @sortOrder)
  `)

  for (const tpl of TEMPLATES) {
    const result = insertTemplate.run({
      name: tpl.name,
      description: tpl.description,
      level: tpl.level,
      daysPerWeek: tpl.daysPerWeek,
      type: tpl.type,
    })

    if (result.changes === 0) continue // already seeded

    for (let i = 0; i < tpl.days.length; i++) {
      insertDay.run({
        templateId: result.lastInsertRowid,
        dayName: tpl.days[i].dayName,
        focus: tpl.days[i].focus,
        sortOrder: i,
      })
    }
  }
}
