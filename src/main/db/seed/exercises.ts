import Database from 'better-sqlite3'
import { getMuscleGroupIdMap } from './muscle_groups'

interface ExerciseSeed {
  name: string
  primary: string
  secondary: string[]
  equipment: string
  type: string
  description: string
}

const EXERCISES: ExerciseSeed[] = [
  // Pecho
  { name: 'Press banca plano', primary: 'pecho', secondary: ['triceps', 'hombros'], equipment: 'barra', type: 'libre', description: 'Tumbado en banco plano, bajar la barra hasta el pecho y empujar hacia arriba.' },
  { name: 'Press banca inclinado', primary: 'pecho', secondary: ['triceps', 'hombros'], equipment: 'barra', type: 'libre', description: 'Banco a 30-45 grados, trabaja la parte superior del pecho.' },
  { name: 'Press banca declinado', primary: 'pecho', secondary: ['triceps'], equipment: 'barra', type: 'libre', description: 'Banco declinado, trabaja la parte inferior del pecho.' },
  { name: 'Aperturas con mancuernas', primary: 'pecho', secondary: [], equipment: 'mancuernas', type: 'libre', description: 'Abrir y cerrar los brazos en arco con mancuernas, estirando el pectoral.' },
  { name: 'Crossover en polea', primary: 'pecho', secondary: [], equipment: 'polea', type: 'polea', description: 'Cruzar los cables de la polea por delante del cuerpo, aislando el pectoral.' },
  { name: 'Fondos en paralelas', primary: 'pecho', secondary: ['triceps', 'hombros'], equipment: 'peso_corporal', type: 'peso_corporal', description: 'En paralelas, bajar el cuerpo doblando los codos con el torso inclinado hacia adelante.' },
  { name: 'Press con mancuernas plano', primary: 'pecho', secondary: ['triceps', 'hombros'], equipment: 'mancuernas', type: 'libre', description: 'Igual que el press banca pero con mancuernas para mayor rango de movimiento.' },

  // Espalda
  { name: 'Dominadas', primary: 'espalda', secondary: ['biceps', 'antebrazos'], equipment: 'peso_corporal', type: 'peso_corporal', description: 'Colgado de una barra, tirar del cuerpo hacia arriba hasta que la barbilla supere la barra.' },
  { name: 'Jalón al pecho', primary: 'espalda', secondary: ['biceps', 'antebrazos'], equipment: 'polea', type: 'polea', description: 'Sentado en la máquina, tirar del bar hacia el pecho manteniendo el torso erguido.' },
  { name: 'Remo con barra', primary: 'espalda', secondary: ['biceps', 'antebrazos'], equipment: 'barra', type: 'libre', description: 'Torso inclinado, tirar la barra hacia el abdomen apretando los omóplatos.' },
  { name: 'Remo con mancuerna', primary: 'espalda', secondary: ['biceps', 'antebrazos'], equipment: 'mancuernas', type: 'libre', description: 'Apoyado en banco, tirar la mancuerna hacia la cadera con una mano.' },
  { name: 'Pull-over con mancuerna', primary: 'espalda', secondary: ['pecho'], equipment: 'mancuernas', type: 'libre', description: 'Tumbado en banco, mover la mancuerna en arco desde la cadera hasta sobre la cabeza.' },
  { name: 'Facepull', primary: 'hombros', secondary: ['espalda'], equipment: 'polea', type: 'polea', description: 'De pie frente a la polea, tirar la cuerda hacia la cara con los codos altos.' },
  { name: 'Encogimientos con barra', primary: 'trapecio', secondary: ['antebrazos'], equipment: 'barra', type: 'libre', description: 'De pie con barra colgando, subir los hombros hacia las orejas.' },
  { name: 'Remo en máquina', primary: 'espalda', secondary: ['biceps', 'antebrazos'], equipment: 'maquina', type: 'maquina', description: 'Sentado en máquina de remo, tirar hacia el cuerpo.' },

  // Hombros
  { name: 'Press militar con barra', primary: 'hombros', secondary: ['triceps', 'trapecio'], equipment: 'barra', type: 'libre', description: 'De pie o sentado, empujar la barra por encima de la cabeza desde la altura de los hombros.' },
  { name: 'Press Arnold', primary: 'hombros', secondary: ['triceps'], equipment: 'mancuernas', type: 'libre', description: 'Con mancuernas, rotar las palmas mientras se empuja hacia arriba.' },
  { name: 'Elevaciones laterales', primary: 'hombros', secondary: [], equipment: 'mancuernas', type: 'libre', description: 'Elevar los brazos a los lados hasta la altura de los hombros.' },
  { name: 'Elevaciones frontales', primary: 'hombros', secondary: [], equipment: 'mancuernas', type: 'libre', description: 'Elevar los brazos hacia adelante hasta la altura de los hombros.' },
  { name: 'Pájaros', primary: 'hombros', secondary: ['espalda'], equipment: 'mancuernas', type: 'libre', description: 'Inclinado hacia adelante, elevar los brazos a los lados (deltoides posterior).' },
  { name: 'Remo al mentón', primary: 'hombros', secondary: ['trapecio', 'biceps'], equipment: 'barra', type: 'libre', description: 'Tirar la barra hacia el mentón con codos altos.' },

  // Bíceps
  { name: 'Curl con barra', primary: 'biceps', secondary: ['antebrazos'], equipment: 'barra', type: 'libre', description: 'De pie con barra, flexionar los codos para subir la barra hacia los hombros.' },
  { name: 'Curl martillo', primary: 'biceps', secondary: ['antebrazos'], equipment: 'mancuernas', type: 'libre', description: 'Curl con mancuernas con agarre neutro (pulgar arriba).' },
  { name: 'Curl concentrado', primary: 'biceps', secondary: [], equipment: 'mancuernas', type: 'libre', description: 'Sentado, apoyar el codo en la pierna y flexionar con una mancuerna.' },
  { name: 'Curl en polea', primary: 'biceps', secondary: [], equipment: 'polea', type: 'polea', description: 'Curl con la polea baja para tensión constante.' },
  { name: 'Curl inclinado', primary: 'biceps', secondary: [], equipment: 'mancuernas', type: 'libre', description: 'En banco inclinado, mayor estiramiento del bíceps.' },

  // Tríceps
  { name: 'Press francés', primary: 'triceps', secondary: [], equipment: 'barra', type: 'libre', description: 'Tumbado en banco, bajar la barra hasta la frente doblando los codos.' },
  { name: 'Extensión en polea', primary: 'triceps', secondary: [], equipment: 'polea', type: 'polea', description: 'De pie frente a la polea alta, extender los codos hacia abajo.' },
  { name: 'Fondos en banco', primary: 'triceps', secondary: ['hombros'], equipment: 'peso_corporal', type: 'peso_corporal', description: 'Manos en banco detrás del cuerpo, bajar y subir con los codos.' },
  { name: 'Patada de tríceps', primary: 'triceps', secondary: [], equipment: 'mancuernas', type: 'libre', description: 'Inclinado hacia adelante, extender el brazo hacia atrás con mancuerna.' },
  { name: 'Extensión por encima de la cabeza', primary: 'triceps', secondary: [], equipment: 'mancuernas', type: 'libre', description: 'Con mancuerna sobre la cabeza, bajar hacia la nuca.' },

  // Piernas
  { name: 'Sentadilla libre', primary: 'piernas', secondary: ['gluteos', 'core'], equipment: 'barra', type: 'libre', description: 'Con barra en la espalda alta, bajar hasta que los muslos queden paralelos al suelo.' },
  { name: 'Sentadilla hack', primary: 'piernas', secondary: ['gluteos'], equipment: 'maquina', type: 'maquina', description: 'En máquina hack squat, énfasis en cuádriceps.' },
  { name: 'Prensa de piernas', primary: 'piernas', secondary: ['gluteos'], equipment: 'maquina', type: 'maquina', description: 'Sentado en la prensa, empujar la plataforma con los pies.' },
  { name: 'Extensión de cuádriceps', primary: 'piernas', secondary: [], equipment: 'maquina', type: 'maquina', description: 'En máquina, extender las piernas para trabajar el cuádriceps en aislamiento.' },
  { name: 'Curl de isquiotibiales', primary: 'piernas', secondary: [], equipment: 'maquina', type: 'maquina', description: 'Tumbado en máquina, flexionar las rodillas para trabajar isquios.' },
  { name: 'Peso muerto rumano', primary: 'piernas', secondary: ['gluteos', 'espalda'], equipment: 'barra', type: 'libre', description: 'Con barra, bajar manteniendo las piernas semi-extendidas para isquios y glúteos.' },
  { name: 'Hip thrust', primary: 'gluteos', secondary: ['piernas'], equipment: 'barra', type: 'libre', description: 'Apoyado en banco con barra en la cadera, empujar la cadera hacia arriba.' },
  { name: 'Gemelos de pie', primary: 'piernas', secondary: [], equipment: 'maquina', type: 'maquina', description: 'En máquina de pie, elevar los talones para trabajar el gastrocnemio.' },
  { name: 'Gemelos sentado', primary: 'piernas', secondary: [], equipment: 'maquina', type: 'maquina', description: 'En máquina sentado, trabajar el sóleo.' },
  { name: 'Zancadas', primary: 'piernas', secondary: ['gluteos'], equipment: 'mancuernas', type: 'libre', description: 'Pasos largos hacia adelante, bajando la rodilla trasera hacia el suelo.' },
  { name: 'Sentadilla goblet', primary: 'piernas', secondary: ['gluteos', 'core'], equipment: 'kettlebell', type: 'libre', description: 'Sentadilla sosteniendo una pesa rusa o mancuerna frente al pecho.' },

  // Core
  { name: 'Plancha', primary: 'core', secondary: ['hombros'], equipment: 'peso_corporal', type: 'peso_corporal', description: 'Posición de plancha apoyado en los antebrazos, mantener el cuerpo recto.' },
  { name: 'Crunch', primary: 'core', secondary: [], equipment: 'peso_corporal', type: 'peso_corporal', description: 'Tumbado, flexionar el torso levantando los hombros del suelo.' },
  { name: 'Elevación de piernas', primary: 'core', secondary: [], equipment: 'peso_corporal', type: 'peso_corporal', description: 'Tumbado o colgado, elevar las piernas rectas hacia arriba.' },
  { name: 'Rueda abdominal', primary: 'core', secondary: ['hombros', 'espalda'], equipment: 'peso_corporal', type: 'peso_corporal', description: 'Con rueda abdominal, extender y contraer el cuerpo desde las rodillas.' },
  { name: 'Russian twist', primary: 'core', secondary: [], equipment: 'peso_corporal', type: 'peso_corporal', description: 'Sentado, rotar el torso de lado a lado.' },
  { name: 'Dead bug', primary: 'core', secondary: [], equipment: 'peso_corporal', type: 'peso_corporal', description: 'Tumbado, extender brazo y pierna opuesta manteniendo la espalda baja en el suelo.' },

  // Glúteos
  { name: 'Abductor en máquina', primary: 'gluteos', secondary: [], equipment: 'maquina', type: 'maquina', description: 'Sentado en máquina, abrir las piernas contra resistencia.' },
  { name: 'Patada trasera en polea', primary: 'gluteos', secondary: [], equipment: 'polea', type: 'polea', description: 'De pie, empujar la pierna hacia atrás contra la polea.' },
  { name: 'Monster walk', primary: 'gluteos', secondary: ['piernas'], equipment: 'banda', type: 'banda', description: 'Con banda en los tobillos, caminar en cuclillas en semi-sentadilla.' },
]

export function seedExercises(db: Database.Database): void {
  const idMap = getMuscleGroupIdMap(db)

  const insert = db.prepare(`
    INSERT OR IGNORE INTO exercises
      (name, primary_muscle_group_id, secondary_muscle_group_ids, equipment_type, exercise_type, description, is_default)
    VALUES
      (@name, @primaryId, @secondaryIds, @equipment, @type, @description, 1)
  `)

  for (const ex of EXERCISES) {
    const primaryId = idMap[ex.primary]
    if (!primaryId) continue

    const secondaryIds = ex.secondary
      .map((s) => idMap[s])
      .filter(Boolean)

    insert.run({
      name: ex.name,
      primaryId,
      secondaryIds: JSON.stringify(secondaryIds),
      equipment: ex.equipment,
      type: ex.type,
      description: ex.description,
    })
  }
}
