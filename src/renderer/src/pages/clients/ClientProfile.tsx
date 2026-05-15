import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, Dumbbell, Activity, TrendingUp, Scale } from 'lucide-react'
import { api, call } from '../../utils/api'
import { LoadingState, EmptyState } from '../../components/Layout'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge, LevelBadge } from '../../components/ui/Badge'
import { formatDate, calcBMI, bmiLabel } from '../../utils/formatters'
import { GymTab } from './tabs/GymTab'
import { RunningTab } from './tabs/RunningTab'
import type { Client } from '@shared/types'

type Tab = 'perfil' | 'gym' | 'running'

export function ClientProfile() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const clientId = Number(id)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('perfil')

  useEffect(() => {
    call(() => api.clients.getById(clientId))
      .then(setClient)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) return <div className="p-6"><LoadingState /></div>
  if (!client) return <div className="p-6"><EmptyState title="Cliente no encontrado" /></div>

  const bmi = calcBMI(client.weightKg, client.heightCm)
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'perfil', label: 'Perfil', icon: <Scale className="w-4 h-4" /> },
    { id: 'gym', label: 'Gimnasio', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'running', label: 'Running', icon: <Activity className="w-4 h-4" /> },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/clientes')}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
            <span className="text-primary-700 dark:text-primary-300 font-bold text-lg">
              {client.firstName[0]}{client.lastName[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {client.firstName} {client.lastName}
              </h1>
              <LevelBadge level={client.level} />
              {!client.isActive && <Badge variant="gray">Inactivo</Badge>}
            </div>
            {client.goal && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{client.goal}</p>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/clientes/${id}/editar`)}
          >
            <Edit className="w-4 h-4" /> Editar
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === t.id
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'perfil' && <ProfileTab client={client} bmi={bmi} />}
        {tab === 'gym' && <GymTab clientId={clientId} />}
        {tab === 'running' && <RunningTab clientId={clientId} />}
      </div>
    </div>
  )
}

function ProfileTab({ client, bmi }: { client: Client; bmi: number | null }) {
  const fields: { label: string; value: string | null }[] = [
    { label: 'Email', value: client.email },
    { label: 'Teléfono', value: client.phone },
    { label: 'Fecha de nacimiento', value: formatDate(client.birthDate) },
    { label: 'Sexo', value: client.sex === 'M' ? 'Masculino' : client.sex === 'F' ? 'Femenino' : client.sex },
    { label: 'Peso', value: client.weightKg ? `${client.weightKg} kg` : null },
    { label: 'Altura', value: client.heightCm ? `${client.heightCm} cm` : null },
    { label: 'IMC', value: bmi ? `${bmi} — ${bmiLabel(bmi)}` : null },
    { label: 'Objetivo', value: client.goal },
  ]

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold">Información personal</h3>
        </div>
        <CardBody className="grid grid-cols-2 gap-y-4">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-xs text-gray-500 dark:text-gray-400">{f.label}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                {f.value ?? '—'}
              </p>
            </div>
          ))}
        </CardBody>
      </Card>

      {client.medicalNotes && (
        <Card>
          <CardBody>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Historial médico</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{client.medicalNotes}</p>
          </CardBody>
        </Card>
      )}

      {client.injuryHistory && (
        <Card>
          <CardBody>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lesiones</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{client.injuryHistory}</p>
          </CardBody>
        </Card>
      )}

      {client.privateNotes && (
        <Card>
          <CardBody>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">🔒 Notas privadas</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{client.privateNotes}</p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
