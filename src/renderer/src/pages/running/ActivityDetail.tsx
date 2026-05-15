import { useEffect, useState } from 'react'
import { ArrowLeft, MapPin, Timer, Activity, Heart, TrendingUp, Mountain } from 'lucide-react'
import { api, call } from '../../utils/api'
import { Card, CardBody } from '../../components/ui/Card'
import { LoadingState } from '../../components/Layout'
import { formatDate, formatDistance, formatDuration, formatPace } from '../../utils/formatters'
import type { RunningActivity, RunningActivityLap } from '@shared/types'

interface Props {
  activityId: number
  onBack: () => void
}

export function ActivityDetail({ activityId, onBack }: Props) {
  const [activity, setActivity] = useState<RunningActivity | null>(null)
  const [laps, setLaps] = useState<RunningActivityLap[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      call(() => api.running.activities.getById(activityId)),
      call(() => api.running.activities.getLaps(activityId)),
    ])
      .then(([act, l]) => {
        setActivity(act)
        setLaps(l)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activityId])

  if (loading) return <LoadingState />
  if (!activity) return <div className="text-center py-8 text-gray-500">Actividad no encontrada</div>

  const stats = [
    { label: 'Distancia', value: formatDistance(activity.distanceMeters), icon: <MapPin className="w-4 h-4 text-blue-500" /> },
    { label: 'Tiempo', value: formatDuration(activity.durationSeconds ?? undefined), icon: <Timer className="w-4 h-4 text-purple-500" /> },
    { label: 'Pace promedio', value: formatPace(activity.avgPaceMinKm), icon: <TrendingUp className="w-4 h-4 text-green-500" /> },
    { label: 'FC media', value: activity.avgHeartRate ? `${activity.avgHeartRate} bpm` : '—', icon: <Heart className="w-4 h-4 text-red-500" /> },
    { label: 'FC máxima', value: activity.maxHeartRate ? `${activity.maxHeartRate} bpm` : '—', icon: <Heart className="w-4 h-4 text-red-400" /> },
    { label: 'Cadencia', value: activity.avgCadence ? `${activity.avgCadence} spm` : '—', icon: <Activity className="w-4 h-4 text-yellow-500" /> },
    { label: 'Elevación +', value: activity.elevationGainM ? `${activity.elevationGainM} m` : '—', icon: <Mountain className="w-4 h-4 text-orange-500" /> },
    { label: 'Calorías', value: activity.calories ? `${activity.calories} kcal` : '—', icon: <Activity className="w-4 h-4 text-pink-500" /> },
  ]

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Actividad del {formatDate(activity.activityDate)}
          </h2>
          <p className="text-sm text-gray-500 capitalize">{activity.sourceType}</p>
        </div>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.slice(0, 4).map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 mb-2">{s.icon}<p className="text-xs text-gray-500">{s.label}</p></div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.slice(4).map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 mb-2">{s.icon}<p className="text-xs text-gray-500">{s.label}</p></div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* HR Zones */}
      {(activity.hrZone1Seconds ?? 0) > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold">Tiempo en zonas de FC</h3>
          </div>
          <CardBody>
            {[
              { label: 'Z1 Recuperación', seconds: activity.hrZone1Seconds ?? 0, color: 'bg-blue-400' },
              { label: 'Z2 Base aeróbica', seconds: activity.hrZone2Seconds ?? 0, color: 'bg-green-400' },
              { label: 'Z3 Aeróbico', seconds: activity.hrZone3Seconds ?? 0, color: 'bg-yellow-400' },
              { label: 'Z4 Umbral', seconds: activity.hrZone4Seconds ?? 0, color: 'bg-orange-400' },
              { label: 'Z5 Máximo', seconds: activity.hrZone5Seconds ?? 0, color: 'bg-red-500' },
            ].map((z) => {
              const total = (activity.durationSeconds ?? 1)
              const pct = Math.round((z.seconds / total) * 100)
              return (
                <div key={z.label} className="mb-3 last:mb-0">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>{z.label}</span>
                    <span>{formatDuration(z.seconds)} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${z.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardBody>
        </Card>
      )}

      {/* Laps */}
      {laps.length > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold">Vueltas / Intervalos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-5 py-2 text-left">#</th>
                  <th className="px-5 py-2 text-right">Distancia</th>
                  <th className="px-5 py-2 text-right">Tiempo</th>
                  <th className="px-5 py-2 text-right">Pace</th>
                  <th className="px-5 py-2 text-right">FC media</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {laps.map((lap) => (
                  <tr key={lap.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-5 py-2.5 text-gray-500">{lap.lapNumber}</td>
                    <td className="px-5 py-2.5 text-right">{formatDistance(lap.distanceMeters)}</td>
                    <td className="px-5 py-2.5 text-right">{formatDuration(lap.durationSeconds ?? undefined)}</td>
                    <td className="px-5 py-2.5 text-right">{formatPace(lap.avgPaceMinKm)}</td>
                    <td className="px-5 py-2.5 text-right text-red-500">{lap.avgHeartRate ? `${lap.avgHeartRate}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activity.notes && (
        <Card>
          <CardBody>
            <p className="text-xs text-gray-500 mb-1">Notas</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{activity.notes}</p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
