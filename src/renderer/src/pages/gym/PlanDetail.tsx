import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'
import { api, call } from '../../utils/api'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/Layout'
import { Modal } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import { DAY_NAMES } from '@shared/constants'
import type { TrainingPlan, TrainingPlanDay, Exercise } from '@shared/types'

interface Props {
  planId: number
  clientId: number
  onBack: () => void
}

type PlanWithDays = TrainingPlan & { days: TrainingPlanDay[] }

export function PlanDetail({ planId, clientId, onBack }: Props) {
  const [plan, setPlan] = useState<PlanWithDays | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState<number | null>(null)
  const [showAddDay, setShowAddDay] = useState(false)
  const [showAddExercise, setShowAddExercise] = useState<number | null>(null)

  useEffect(() => {
    loadPlan()
  }, [planId])

  async function loadPlan() {
    setLoading(true)
    try {
      const data = await call(() => api.gym.plans.getById(planId))
      setPlan(data as PlanWithDays)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteDay(dayId: number) {
    if (!confirm('¿Eliminar este día?')) return
    await call(() => api.gym.planDays.delete(dayId))
    loadPlan()
  }

  async function handleRemoveExercise(exerciseId: number) {
    await call(() => api.gym.planDays.removeExercise(exerciseId))
    loadPlan()
  }

  if (loading || !plan) return <LoadingState />

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{plan.name}</h2>
          {plan.objective && <p className="text-sm text-gray-500">{plan.objective}</p>}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {plan.days?.map((day) => (
          <Card key={day.id}>
            <button
              onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                  {DAY_NAMES[day.dayOfWeek]?.slice(0, 3) ?? 'D'}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">{day.name}</p>
                <p className="text-xs text-gray-500">{day.exercises?.length ?? 0} ejercicios</p>
              </div>
              {expandedDay === day.id ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {expandedDay === day.id && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                {day.exercises?.map((ex) => (
                  <div key={ex.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <Dumbbell className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ex.exerciseName}</p>
                      <p className="text-xs text-gray-500">
                        {ex.sets} series × {ex.reps} reps
                        {ex.weightKg ? ` @ ${ex.weightKg} kg` : ''}
                        {ex.restSeconds ? ` · ${ex.restSeconds}s descanso` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(ex.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="px-5 py-3 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddExercise(day.id)}
                  >
                    <Plus className="w-3 h-3" /> Agregar ejercicio
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDay(day.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" /> Eliminar día
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Button variant="secondary" size="sm" onClick={() => setShowAddDay(true)}>
        <Plus className="w-4 h-4" /> Agregar día
      </Button>

      {showAddDay && (
        <AddDayModal
          planId={planId}
          onClose={() => setShowAddDay(false)}
          onAdded={() => { setShowAddDay(false); loadPlan() }}
        />
      )}

      {showAddExercise && (
        <AddExerciseModal
          planDayId={showAddExercise}
          onClose={() => setShowAddExercise(null)}
          onAdded={() => { setShowAddExercise(null); loadPlan() }}
        />
      )}
    </div>
  )
}

function AddDayModal({ planId, onClose, onAdded }: { planId: number; onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('0')
  const [saving, setSaving] = useState(false)

  const dayOptions = DAY_NAMES.map((d, i) => ({ value: i.toString(), label: d }))

  async function handleAdd() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await call(() => api.gym.planDays.add(planId, { name: name.trim(), dayOfWeek: parseInt(dayOfWeek), sortOrder: 0 }))
      onAdded()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Agregar día de entrenamiento">
      <div className="space-y-4">
        <Input label="Nombre del día" placeholder="Ej: Pecho + Tríceps" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Select label="Día de la semana" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} options={dayOptions} />
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAdd} loading={saving}>Agregar</Button>
        </div>
      </div>
    </Modal>
  )
}

function AddExerciseModal({ planDayId, onClose, onAdded }: { planDayId: number; onClose: () => void; onAdded: () => void }) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('10')
  const [weight, setWeight] = useState('')
  const [rest, setRest] = useState('90')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    call(() => api.exercises.getAll()).then(setExercises).catch(console.error)
  }, [])

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAdd() {
    if (!selectedId) return
    setSaving(true)
    try {
      await call(() =>
        api.gym.planDays.addExercise(planDayId, {
          exerciseId: parseInt(selectedId),
          sets: parseInt(sets) || 3,
          reps: reps || '10',
          weightKg: weight ? parseFloat(weight) : null,
          restSeconds: parseInt(rest) || 90,
          sortOrder: 0,
        }),
      )
      onAdded()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Agregar ejercicio" size="lg">
      <div className="space-y-4">
        <Input
          placeholder="Buscar ejercicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelectedId(ex.id.toString())}
              className={`w-full text-left px-3 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                selectedId === ex.id.toString() ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : ''
              }`}
            >
              <span className="font-medium">{ex.name}</span>
              <span className="text-gray-400 ml-2 text-xs">{ex.primaryMuscleGroupName}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-3">
          <Input label="Series" type="number" min="1" value={sets} onChange={(e) => setSets(e.target.value)} />
          <Input label="Reps" placeholder="10 / 8-12" value={reps} onChange={(e) => setReps(e.target.value)} />
          <Input label="Peso (kg)" type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <Input label="Descanso (s)" type="number" value={rest} onChange={(e) => setRest(e.target.value)} />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAdd} loading={saving} disabled={!selectedId}>Agregar</Button>
        </div>
      </div>
    </Modal>
  )
}
