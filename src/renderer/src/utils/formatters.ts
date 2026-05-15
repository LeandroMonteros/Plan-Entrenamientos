export function formatPace(minKm: number | null | undefined): string {
  if (!minKm) return '—'
  const min = Math.floor(minKm)
  const sec = Math.round((minKm - min) * 60)
  return `${min}:${sec.toString().padStart(2, '0')} /km`
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDistance(meters: number | null | undefined): string {
  if (!meters) return '—'
  const km = meters / 1000
  return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(meters)} m`
}

export function formatWeight(kg: number | null | undefined): string {
  if (kg == null) return '—'
  return `${kg} kg`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  } catch {
    return dateStr
  }
}

export function formatVolume(vol: number | null | undefined): string {
  if (!vol) return '—'
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k kg`
  return `${Math.round(vol)} kg`
}

export function calcBMI(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm) return null
  const h = heightCm / 100
  return Math.round((weightKg / (h * h)) * 10) / 10
}

export function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Bajo peso'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Sobrepeso'
  return 'Obesidad'
}

export function todayISODate(): string {
  return new Date().toISOString().split('T')[0]
}
