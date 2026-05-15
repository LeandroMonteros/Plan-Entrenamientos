import { useEffect, useState } from 'react'
import { Upload, Activity, Timer, MapPin, TrendingUp } from 'lucide-react'
import { api, call, callOpt } from '../../../utils/api'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { EmptyState, LoadingState } from '../../../components/Layout'
import { formatDate, formatDistance, formatDuration, formatPace } from '../../../utils/formatters'
import { ActivityDetail } from '../../running/ActivityDetail'
import type { RunningActivity } from '@shared/types'

export function RunningTab({ clientId }: { clientId: number }) {
  const [activities, setActivities] = useState<RunningActivity[]>([])
  const [weeklyStats, setWeeklyStats] = useState<{ week: string; totalKm: number; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [clientId])

  async function loadData() {
    setLoading(true)
    try {
      const [acts, stats] = await Promise.all([
        call(() => api.running.activities.getByClient(clientId, 20)),
        call(() => api.running.activities.getStats(clientId)),
      ])
      setActivities(acts)
      setWeeklyStats(stats)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    try {
      const result = await callOpt(() => api.dialog.openFile([
        { name: 'Actividades Garmin', extensions: ['fit', 'gpx'] },
      ]))
      if (!result) return

      setImporting(true)
      await call(() => api.running.activities.import(clientId, result))
      await loadData()
    } catch (err) {
      console.error('Import error:', err)
      alert(`Error al importar: ${(err as Error).message}`)
    } finally {
      setImporting(false)
    }
  }

  if (loading) return <LoadingState />

  if (selectedId) {
    return (
      <ActivityDetail
        activityId={selectedId}
        onBack={() => { setSelectedId(null); loadData() }}
      />
    )
  }

  const totalKm = weeklyStats.reduce((sum, w) => sum + w.totalKm, 0)

  return (
    <div className="max-w-2xl space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activities.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Actividades</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalKm.toFixed(0)} km</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total (12 sem)</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {weeklyStats[0]?.totalKm.toFixed(1) ?? 0} km
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Esta semana</p>
        </Card>
      </div>

      {/* Import */}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleImport} loading={importing}>
          <Upload className="w-4 h-4" /> Importar .FIT / .GPX
        </Button>
      </div>

      {/* Activities */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold">Actividades recientes</h3>
        </div>
        {activities.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Sin actividades"
              description="Importá un archivo .FIT o .GPX de tu Garmin"
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {activities.map((act) => (
              <button
                key={act.id}
                onClick={() => setSelectedId(act.id)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(act.activityDate)}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    {act.distanceMeters && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" /> {formatDistance(act.distanceMeters)}
                      </span>
                    )}
                    {act.durationSeconds && (
                      <span className="flex items-center gap-0.5">
                        <Timer className="w-3 h-3" /> {formatDuration(act.durationSeconds)}
                      </span>
                    )}
                    {act.avgPaceMinKm && (
                      <span className="flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" /> {formatPace(act.avgPaceMinKm)}
                      </span>
                    )}
                  </div>
                </div>
                {act.avgHeartRate && (
                  <span className="text-xs text-red-500 font-medium shrink-0">
                    ♥ {act.avgHeartRate} bpm
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
