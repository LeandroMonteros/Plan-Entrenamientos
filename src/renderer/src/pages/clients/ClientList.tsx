import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ArrowRight, User } from 'lucide-react'
import { api, call } from '../../utils/api'
import { PageHeader, EmptyState, LoadingState } from '../../components/Layout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import type { Client } from '@shared/types'

export function ClientList() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    setLoading(true)
    try {
      const data = await call(() => api.clients.getAll())
      setClients(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6">
      <PageHeader
        title="Clientes"
        subtitle={`${clients.filter((c) => c.isActive).length} activos`}
        actions={
          <Button onClick={() => navigate('/clientes/nuevo')} size="sm">
            <Plus className="w-4 h-4" /> Nuevo cliente
          </Button>
        }
      />

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <Card>
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'Sin resultados' : 'No hay clientes aún'}
            description={search ? 'Probá con otro nombre' : 'Agregá tu primer cliente para comenzar'}
            action={
              !search && (
                <Button onClick={() => navigate('/clientes/nuevo')} size="sm">
                  <Plus className="w-4 h-4" /> Agregar cliente
                </Button>
              )
            }
          />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((client) => (
              <button
                key={client.id}
                onClick={() => navigate(`/clientes/${client.id}`)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <div className="w-11 h-11 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <span className="text-primary-700 dark:text-primary-300 font-semibold">
                    {client.firstName[0]}{client.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {client.firstName} {client.lastName}
                    </span>
                    {!client.isActive && (
                      <Badge variant="gray">Inactivo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {client.email ?? (client.goal ?? 'Sin datos adicionales')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
