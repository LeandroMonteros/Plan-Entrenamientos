import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { api, call } from '../../utils/api'
import { PageHeader } from '../../components/Layout'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { CLIENT_LEVELS, SEX_OPTIONS } from '@shared/constants'
import type { Client } from '@shared/types'

const LEVEL_OPTIONS = [{ value: '', label: 'Seleccionar nivel' }, ...CLIENT_LEVELS]
const SEX_OPTS = [{ value: '', label: 'Seleccionar' }, ...SEX_OPTIONS]

export function ClientForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    sex: '',
    weightKg: '',
    heightCm: '',
    goal: '',
    level: '',
    medicalNotes: '',
    injuryHistory: '',
    privateNotes: '',
  })

  useEffect(() => {
    if (isEdit) {
      setLoading(true)
      call(() => api.clients.getById(Number(id)))
        .then((c) => {
          if (c) fillForm(c)
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [id])

  function fillForm(c: Client) {
    setForm({
      firstName: c.firstName ?? '',
      lastName: c.lastName ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      birthDate: c.birthDate ?? '',
      sex: c.sex ?? '',
      weightKg: c.weightKg?.toString() ?? '',
      heightCm: c.heightCm?.toString() ?? '',
      goal: c.goal ?? '',
      level: c.level ?? '',
      medicalNotes: c.medicalNotes ?? '',
      injuryHistory: c.injuryHistory ?? '',
      privateNotes: c.privateNotes ?? '',
    })
  }

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('El nombre y apellido son obligatorios')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      birthDate: form.birthDate || null,
      sex: (form.sex || null) as Client['sex'],
      weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
      heightCm: form.heightCm ? parseFloat(form.heightCm) : null,
      goal: form.goal.trim() || null,
      level: (form.level || null) as Client['level'],
      medicalNotes: form.medicalNotes.trim() || null,
      injuryHistory: form.injuryHistory.trim() || null,
      privateNotes: form.privateNotes.trim() || null,
      isActive: 1,
      avatarPath: null,
    }

    try {
      if (isEdit) {
        await call(() => api.clients.update({ ...payload, id: Number(id) }))
        navigate(`/clientes/${id}`)
      } else {
        const created = await call(() => api.clients.create(payload))
        navigate(`/clientes/${created.id}`)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <PageHeader title={isEdit ? 'Editar cliente' : 'Nuevo cliente'} />
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold">Datos personales</h3>
          </div>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre *"
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                required
              />
              <Input
                label="Apellido *"
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              <Input label="Teléfono" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Fecha de nacimiento" type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
              <Select label="Sexo" value={form.sex} onChange={(e) => set('sex', e.target.value)} options={SEX_OPTS} />
            </div>
          </CardBody>
        </Card>

        <Card className="mb-4">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold">Datos físicos</h3>
          </div>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Peso (kg)" type="number" step="0.1" min="0" value={form.weightKg} onChange={(e) => set('weightKg', e.target.value)} />
              <Input label="Altura (cm)" type="number" step="1" min="0" value={form.heightCm} onChange={(e) => set('heightCm', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Nivel" value={form.level} onChange={(e) => set('level', e.target.value)} options={LEVEL_OPTIONS} />
              <Input label="Objetivo" value={form.goal} onChange={(e) => set('goal', e.target.value)} placeholder="Ej: Bajar de peso" />
            </div>
          </CardBody>
        </Card>

        <Card className="mb-6">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold">Notas</h3>
          </div>
          <CardBody className="space-y-4">
            <Textarea
              label="Historial médico / lesiones"
              value={form.medicalNotes}
              onChange={(e) => set('medicalNotes', e.target.value)}
              rows={2}
              placeholder="Condiciones médicas relevantes..."
            />
            <Textarea
              label="Historial de lesiones"
              value={form.injuryHistory}
              onChange={(e) => set('injuryHistory', e.target.value)}
              rows={2}
              placeholder="Lesiones previas..."
            />
            <Textarea
              label="Notas privadas del entrenador"
              value={form.privateNotes}
              onChange={(e) => set('privateNotes', e.target.value)}
              rows={2}
              placeholder="Solo visible para vos..."
            />
          </CardBody>
        </Card>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            <Save className="w-4 h-4" />
            {isEdit ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </div>
      </form>
    </div>
  )
}
