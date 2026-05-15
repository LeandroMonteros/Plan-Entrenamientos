import { useState } from 'react'
import { api, call } from '../../utils/api'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { CLIENT_LEVELS } from '@shared/constants'
import type { TrainingPlan } from '@shared/types'

interface Props {
  clientId: number
  onClose: () => void
  onCreated: (plan: TrainingPlan) => void
}

const LEVEL_OPTS = [{ value: '', label: 'Seleccionar nivel' }, ...CLIENT_LEVELS]

export function NewPlanModal({ clientId, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [objective, setObjective] = useState('')
  const [level, setLevel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim()) { setError('El nombre del plan es obligatorio'); return }
    setSaving(true)
    setError(null)
    try {
      const plan = await call(() =>
        api.gym.plans.create({
          clientId,
          name: name.trim(),
          objective: objective.trim() || null,
          level: level || null,
          isActive: 1,
        }),
      )
      onCreated(plan)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Nuevo plan de entrenamiento">
      <div className="space-y-4">
        <Input
          label="Nombre del plan *"
          placeholder="Ej: Hipertrofia - Ciclo 1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <Input
          label="Objetivo"
          placeholder="Ej: Ganar masa muscular"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
        />
        <Select label="Nivel" value={level} onChange={(e) => setLevel(e.target.value)} options={LEVEL_OPTS} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleCreate} loading={saving}>Crear plan</Button>
        </div>
      </div>
    </Modal>
  )
}
