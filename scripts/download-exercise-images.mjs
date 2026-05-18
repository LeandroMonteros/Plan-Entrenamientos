/**
 * Descarga imágenes de ejercicios desde la API de wger (licencia CC-BY-SA 4.0)
 * https://wger.de/en/software/api
 *
 * Uso: node scripts/download-exercise-images.mjs
 */

import { createWriteStream, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { pipeline } from 'stream/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '..', 'resources', 'exercises')

mkdirSync(OUTPUT_DIR, { recursive: true })

// Mapeo: nombre local → wger exercise ID (language=2 = inglés)
// IDs verificados desde https://wger.de/api/v2/exercise/?format=json&language=2
const EXERCISE_MAP = [
  // Pecho
  { file: 'press_banca_plano.png',         wgerId: 192 }, // Bench Press
  { file: 'press_banca_inclinado.png',     wgerId: 868 }, // Incline Bench Press
  { file: 'press_banca_declinado.png',     wgerId: 875 }, // Decline Bench Press
  { file: 'aperturas_mancuernas.png',      wgerId: 844 }, // Dumbbell Flyes
  { file: 'crossover_polea.png',           wgerId: 313 }, // Cable Crossover
  { file: 'fondos_paralelas.png',          wgerId: 360 }, // Chest Dip
  { file: 'press_mancuernas_plano.png',    wgerId: 118 }, // Dumbbell Bench Press
  // Espalda
  { file: 'dominadas.png',                 wgerId:  31 }, // Pull-ups
  { file: 'jalon_pecho.png',               wgerId:  18 }, // Lat Pulldown
  { file: 'remo_barra.png',                wgerId: 222 }, // Barbell Row
  { file: 'remo_mancuerna.png',            wgerId: 109 }, // Dumbbell Row
  { file: 'pullover_mancuerna.png',        wgerId: 873 }, // Dumbbell Pullover
  { file: 'facepull.png',                  wgerId: 907 }, // Face Pull
  { file: 'encogimientos_barra.png',       wgerId: 112 }, // Barbell Shrug
  { file: 'remo_maquina.png',              wgerId: 854 }, // Seated Cable Row
  // Hombros
  { file: 'press_militar_barra.png',       wgerId:  78 }, // Overhead Press
  { file: 'press_arnold.png',              wgerId: 397 }, // Arnold Press
  { file: 'elevaciones_laterales.png',     wgerId:  85 }, // Lateral Raise
  { file: 'elevaciones_frontales.png',     wgerId:  84 }, // Front Raise
  { file: 'pajaros.png',                   wgerId:  88 }, // Rear Delt Fly
  { file: 'remo_menton.png',               wgerId: 111 }, // Upright Row
  // Bíceps
  { file: 'curl_barra.png',                wgerId:  71 }, // Barbell Curl
  { file: 'curl_martillo.png',             wgerId:  74 }, // Hammer Curl
  { file: 'curl_concentrado.png',          wgerId:  75 }, // Concentration Curl
  { file: 'curl_polea.png',                wgerId: 336 }, // Cable Curl
  { file: 'curl_inclinado.png',            wgerId:  72 }, // Incline Dumbbell Curl
  // Tríceps
  { file: 'press_frances.png',             wgerId: 128 }, // Skull Crusher
  { file: 'extension_polea.png',           wgerId: 116 }, // Tricep Pushdown
  { file: 'fondos_banco.png',              wgerId: 338 }, // Bench Dip
  { file: 'patada_triceps.png',            wgerId: 127 }, // Tricep Kickback
  { file: 'extension_cabeza.png',          wgerId: 126 }, // Overhead Tricep Extension
  // Piernas
  { file: 'sentadilla_libre.png',          wgerId: 339 }, // Back Squat
  { file: 'sentadilla_hack.png',           wgerId: 104 }, // Hack Squat
  { file: 'prensa_piernas.png',            wgerId:   8 }, // Leg Press
  { file: 'extension_cuadriceps.png',      wgerId:   9 }, // Leg Extension
  { file: 'curl_isquiotibiales.png',       wgerId:  10 }, // Leg Curl
  { file: 'peso_muerto_rumano.png',        wgerId: 156 }, // Romanian Deadlift
  { file: 'hip_thrust.png',               wgerId: 879 }, // Hip Thrust
  { file: 'gemelos_pie.png',              wgerId: 103 }, // Standing Calf Raise
  { file: 'gemelos_sentado.png',          wgerId:  25 }, // Seated Calf Raise
  { file: 'zancadas.png',                 wgerId:  99 }, // Lunges
  { file: 'sentadilla_goblet.png',        wgerId: 404 }, // Goblet Squat
  // Core
  { file: 'plancha.png',                  wgerId:   2 }, // Plank
  { file: 'crunch.png',                   wgerId:  91 }, // Crunches
  { file: 'elevacion_piernas.png',        wgerId: 105 }, // Leg Raise
  { file: 'rueda_abdominal.png',          wgerId: 176 }, // Ab Wheel
  { file: 'russian_twist.png',            wgerId: 168 }, // Russian Twist
  { file: 'dead_bug.png',                 wgerId: 908 }, // Dead Bug
  // Glúteos
  { file: 'abductor_maquina.png',         wgerId:  11 }, // Hip Abduction
  { file: 'patada_trasera_polea.png',     wgerId: 346 }, // Cable Kickback
  { file: 'monster_walk.png',             wgerId: 909 }, // Band Walk
]

async function fetchImageUrl(exerciseId) {
  const url = `https://wger.de/api/v2/exerciseimage/?format=json&exercise_base=${exerciseId}&is_main=true`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  if (data.results?.length > 0) return data.results[0].image
  // Fallback: any image for this exercise
  const url2 = `https://wger.de/api/v2/exerciseimage/?format=json&exercise_base=${exerciseId}`
  const res2 = await fetch(url2)
  if (!res2.ok) return null
  const data2 = await res2.json()
  return data2.results?.[0]?.image ?? null
}

async function downloadImage(imageUrl, outputPath) {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const ws = createWriteStream(outputPath)
  await pipeline(res.body, ws)
}

async function main() {
  let ok = 0, fail = 0
  for (const { file, wgerId } of EXERCISE_MAP) {
    const outputPath = join(OUTPUT_DIR, file)
    try {
      const imageUrl = await fetchImageUrl(wgerId)
      if (!imageUrl) { console.log(`  [skip] ${file} — no image for ID ${wgerId}`); fail++; continue }
      await downloadImage(imageUrl, outputPath)
      console.log(`  [ok]   ${file}`)
      ok++
    } catch (err) {
      console.log(`  [fail] ${file}: ${err.message}`)
      fail++
    }
    // Pequeña pausa para no saturar la API
    await new Promise(r => setTimeout(r, 150))
  }
  console.log(`\nResultado: ${ok} descargadas, ${fail} fallidas`)
}

main().catch(console.error)
