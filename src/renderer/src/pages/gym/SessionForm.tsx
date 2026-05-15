import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Trash2, Check, ChevronDown } from 'lucide-react'
import { api, call } from '../../utils/api'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { todayISODate } from '../../utils/formatters'
import type { TrainingPlan, TrainingSession, TrainingPlanDay, SessionExerciseSet, Exercise } from '@shared/types'

interface Props {
  clientId: number
  plans: TrainingPlan[]
  onBack: () => void
}

interface SetEntry {
  exerciseId: number
  exerciseName: string
  setNumber: number
  repsDone: string
  weightKg: string
  rpe: string
}

export function SessionForm({ clientId, plans, onBack }: Props) {
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [selectedDayId, setSelectedDayId] = useState('')
  const [planDays, setPlanDays] = useState<TrainingPlanDay[]>([])
  const [sets, setSets] = useState<SetEntry[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [sessionDate] = useState(todayISODate())
  const [saving, setSaving] = useState(false)
  const [started, setStarted] = useState(false)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState('')
  const [exerciseSearch, setExerciseSearch] = useState('')

  useEffect(() => {
    if (selectedPlanId) {
      call(() => api.gym.plans.getById(Number(selectedPlanId)))
        .then((plan) => { if (plan) setPlanDays((plan as { days: TrainingPlanDay[] }).days ?? []) })
        .catch(console.error)
    } else {
      setPlanDays([])
    }
    setSelectedDayId('')
  }, [selectedPlanId])

  useEffect(() => {
    call(() => api.exercises.getAll()).then(setExercises).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedDayId && planDays.length > 0) {
      const day = planDays.find((d) => d.id === Number(selectedDayId))
      if (day?.exercises) {
        // Pre-populate with planned exercises
        const newSets: SetEntry[] = day.exercises.flatMap((ex) =>
          Array.from({ length: ex.sets }, (_, i) => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName ?? 'Ejercicio',
            setNumber: i + 1,
            repsDone: '',
            weightKg: ex.weightKg?.toString() ?? '',
            rpe: '',
          })),
        )
        setSets(newSets)
      }
    }
  }, [selectedDayId, planDays])

  async function startSession() {
    setSaving(true)
    try {
      const session = await call(() =>
        api.gym.sessions.create({
          clientId,
          planId: selectedPlanId ? Number(selectedPlanId) : null,
          planDayId: selectedDayId ? Number(selectedDayId) : null,
          sessionDate,
        }),
      )
      setSessionId(session.id)
      setStarted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  function updateSet(idx: number, field: keyof SetEntry, value: string) {
    setSets((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)))
  }

  async function saveSet(idx: number) {
    if (!sessionId) return
    const s = sets[idx]
    if (!s.repsDone && !s.weightKg) return

    try {
      await call(() =>
        api.gym.sessions.addSet(sessionId, {
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          repsDone: s.repsDone ? parseInt(s.repsDone) : null,
          weightKg: s.weightKg ? parseFloat(s.weightKg) : null,
          rpe: s.rpe ? parseInt(s.rpe) : null,
        }),
      )
    } catch (err) {
      console.error(err)
    }
  }

  async function handleFinish() {
    if (!sessionId) return
    setSaving(true)
    try {
      // Save all sets
      for (let i = 0; i < sets.length; i++) {
        await saveSet(i)
      }
      await call(() => api.gym.sessions.finish(sessionId))
      onBack()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  function addExerciseRow() {
    if (!selectedExercise) return
    const ex = exercises.find((e) => e.id === Number(selectedExercise))
    if (!ex) return

    const existing = sets.filter((s) => s.exerciseId === ex.id)
    setSets((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        exerciseName: ex.name,
        setNumber: existing.length + 1,
        repsDone: '',
        weightKg: '',
        rpe: '',
      },
    ])
    setSelectedExercise('')
    setShowAddExercise(false)
  }

  const planOptions = [{ value: '', label: 'Sesión libre' }, ...plans.map((p) => ({ value: p.id.toString(), label: p.name }))]
  const dayOptions = [{ value: '', label: 'Seleccionar día' }, ...planDays.map((d) => ({ value: d.id.toString(), label: d.name }))]
  const filteredExercises = exercises.filter((e) => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))

  // Group sets by exercise
  const grouped = sets.reduce<Record<string, SetEntry[]>>((acc, s) => {
    const key = `${s.exerciseId}-${s.exerciseName}`
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Nueva sesión</h2>
      </div>

      {!started ? (
        <Card>
          <CardBody className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Fecha: <strong>{sessionDate}</strong></p>
            <Select label="Plan" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} options={planOptions} />
            {planDays.length > 0 && (
              <Select label="Día" value={selectedDayId} onChange={(e) => setSelectedDayId(e.target.value)} options={dayOptions} />
            )}
            <Button onClick={startSession} loading={saving} className="w-full">
              Iniciar sesión
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([key, exSets]) => (
            <Card key={key}>
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{exSets[0].exerciseName}</p>
              </div>
              <CardBody className="p-0">
                <div className="grid grid-cols-4 px-5 py-2 text-xs font-medium text-gray-400 border-b border-gray-50 dark:border-gray-700">
                  <span>Serie</span><span>Reps</span><span>Peso (kg)</span><span>RPE</span>
                </div>
                {exSets.map((s, i) => {
                  const globalIdx = sets.findIndex((gs) => gs === s)
                  return (
                    <div key={i} className="grid grid-cols-4 gap-2 px-5 py-2 border-b border-gray-50 dark:border-gray-700 last:border-0 items-center">
                      <span className="text-sm text-gray-500">#{s.setNumber}</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="—"
                        value={s.repsDone}
                        onChange={(e) => updateSet(globalIdx, 'repsDone', e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="—"
                        value={s.weightKg}
                        onChange={(e) => updateSet(globalIdx, 'weightKg', e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      <input
                        type="number"
                        min="1"
                        max="10"
                        placeholder="—"
                        value={s.rpe}
                        onChange={(e) => updateSet(globalIdx, 'rpe', e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  )
                })}
                <div className="px-5 py-2">
                  <button
                    onClick={() => {
                      const ex = exSets[0]
                      setSets((prev) => [...prev, {
                        exerciseId: ex.exerciseId,
                        exerciseName: ex.exerciseName,
                        setNumber: exSets.length + 1,
                        repsDone: '',
                        weightKg: '',
                        rpe: '',
                      }])
                    }}
                    className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Agregar serie
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}

          {/* Add exercise */}
          {showAddExercise ? (
            <Card>
              <CardBody className="space-y-3">
                <input
                  type="text"
                  placeholder="Buscar ejercicio..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  autoFocus
                />
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                  {filteredExercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => setSelectedExercise(ex.id.toString())}
                      className={`w-full text-left px-3 py-2 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        selectedExercise === ex.id.toString() ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700' : ''
                      }`}
                    >
                      {ex.name}
                      <span className="text-xs text-gray-400 ml-2">{ex.primaryMuscleGroupName}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addExerciseRow} disabled={!selectedExercise}>Agregar</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddExercise(false)}>Cancelar</Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setShowAddExercise(true)}>
              <Plus className="w-4 h-4" /> Agregar ejercicio
            </Button>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={handleFinish} loading={saving} className="flex-1">
              <Check className="w-4 h-4" /> Finalizar sesión
            </Button>
            <Button variant="secondary" onClick={onBack}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  )
}
