import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Dumbbell, Activity, TrendingUp, Plus, ArrowRight, Calendar } from 'lucide-react'
import { api, call } from '../utils/api'
import { useAppStore } from '../store/appStore'
import { PageHeader } from '../components/Layout'
import { Card, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { formatDate, formatDistance, formatDuration } from '../utils/formatters'
import type { Client, TrainingSession, RunningActivity } from '@shared/types'

export function Dashboard() {
  const config = useAppStore((s) => s.config)
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    call(() => api.clients.getAll())
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const activeClients = clients.filter((c) => c.isActive)
  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-6">
      <PageHeader
        title={`Buen día, ${config?.trainerName || 'entrenador'} 👋`}
        subtitle={today.charAt(0).toUpperCase() + today.slice(1)}
        actions={
          <Button onClick={() => navigate('/clientes/nuevo')} size="sm">
            <Plus className="w-4 h-4" /> Nuevo cliente
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-500" />}
          label="Clientes activos"
          value={activeClients.length}
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          icon={<Dumbbell className="w-5 h-5 text-purple-500" />}
          label="Total clientes"
          value={clients.length}
          bg="bg-purple-50 dark:bg-purple-900/20"
        />
        <StatCard
          icon={<Activity className="w-5 h-5 text-green-500" />}
          label="Módulo"
          value="Gym + Running"
          bg="bg-green-50 dark:bg-green-900/20"
          isText
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-orange-500" />}
          label="Estado"
          value="Activo"
          bg="bg-orange-50 dark:bg-orange-900/20"
          isText
        />
      </div>

      {/* Clients list */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Clientes activos</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/clientes')}>
            Ver todos <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeClients.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-3">No hay clientes aún</p>
              <Button onClick={() => navigate('/clientes/nuevo')} size="sm">
                <Plus className="w-4 h-4" /> Agregar primer cliente
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {activeClients.slice(0, 8).map((client) => (
                <button
                  key={client.id}
                  onClick={() => navigate(`/clientes/${client.id}`)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                    <span className="text-primary-700 dark:text-primary-300 font-semibold text-sm">
                      {client.firstName[0]}{client.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {client.goal ?? 'Sin objetivo definido'}
                    </p>
                  </div>
                  {client.level && (
                    <Badge
                      variant={
                        client.level === 'principiante' ? 'green' :
                        client.level === 'intermedio' ? 'yellow' : 'red'
                      }
                    >
                      {client.level}
                    </Badge>
                  )}
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function StatCard({
  icon, label, value, bg, isText,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  bg: string
  isText?: boolean
}) {
  return (
    <Card className="p-4">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {isText ? value : value.toLocaleString()}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </Card>
  )
}
