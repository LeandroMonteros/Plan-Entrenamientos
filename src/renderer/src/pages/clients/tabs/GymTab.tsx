import { useEffect, useState } from 'react'
import { Plus, ChevronRight, Calendar, Weight, Trophy, Play } from 'lucide-react'
import { api, call } from '../../../utils/api'
import { Card, CardBody } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { EmptyState, LoadingState } from '../../../components/Layout'
import { Badge } from '../../../components/ui/Badge'
import { formatDate, formatVolume } from '../../../utils/formatters'
import { NewPlanModal } from '../../gym/NewPlanModal'
import { PlanDetail } from '../../gym/PlanDetail'
import { SessionForm } from '../../gym/SessionForm'
import type { TrainingPlan, TrainingSession, PersonalRecord } from '@shared/types'

export function GymTab({ clientId }: { clientId: number }) {
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [prs, setPrs] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'plan' | 'session'>('list')
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [showNewPlan, setShowNewPlan] = useState(false)
  const [showNewSession, setShowNewSession] = useState(false)
  const [stats, setStats] = useState<{ totalSessions: number; totalVolume: number; lastSessionDate: string | null } | null>(null)

  useEffect(() => {
    loadData()
  }, [clientId])

  async function loadData() {
    setLoading(true)
    try {
      const [p, s, pr, st] = await Promise.all([
        call(() => api.gym.plans.getByClient(clientId)),
        call(() => api.gym.sessions.getByClient(clientId, 5)),
        call(() => api.gym.sessions.getPrs(clientId)),
        call(() => api.gym.sessions.getStats(clientId)),
      ])
      setPlans(p)
      setSessions(s)
      setPrs(pr.slice(0, 5))
      setStats(st)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingState />

  if (view === 'plan' && selectedPlanId) {
    return (
      <PlanDetail
        planId={selectedPlanId}
        clientId={clientId}
        onBack={() => { setView('list'); loadData() }}
      />
    )
  }

  if (view === 'session') {
    return (
      <SessionForm
        clientId={clientId}
        plans={plans}
        onBack={() => { setView('list'); loadData() }}
      />
    )
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalSessions}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sesiones</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatVolume(stats.totalVolume)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Volumen total</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatDate(stats.lastSessionDate)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Última sesión</p>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setView('session')}>
          <Play className="w-4 h-4" /> Nueva sesión
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowNewPlan(true)}>
          <Plus className="w-4 h-4" /> Nuevo plan
        </Button>
      </div>

      {/* Plans */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold">Planes de entrenamiento</h3>
        </div>
        {plans.length === 0 ? (
          <CardBody>
            <EmptyState
              title="Sin planes"
              description="Creá un plan para organizar los entrenamientos"
            />
          </CardBody>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => { setSelectedPlanId(plan.id); setView('plan') }}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{plan.name}</span>
                    {plan.isActive ? (
                      <Badge variant="green">Activo</Badge>
                    ) : (
                      <Badge variant="gray">Inactivo</Badge>
                    )}
                  </div>
                  {plan.objective && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{plan.objective}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold">Últimas sesiones</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {s.planDayName ?? 'Sesión libre'}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(s.sessionDate)}</p>
                </div>
                {s.totalVolume ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatVolume(s.totalVolume)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* PRs */}
      {prs.length > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" /> Récords personales
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {prs.map((pr) => (
              <div key={pr.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{pr.exerciseName}</p>
                  <p className="text-xs text-gray-500">{formatDate(pr.achievedAt)}</p>
                </div>
                <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  {Math.round(pr.value)} kg·rep
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showNewPlan && (
        <NewPlanModal
          clientId={clientId}
          onClose={() => setShowNewPlan(false)}
          onCreated={(plan) => {
            setShowNewPlan(false)
            setPlans((prev) => [plan, ...prev])
            setSelectedPlanId(plan.id)
            setView('plan')
          }}
        />
      )}
    </div>
  )
}
