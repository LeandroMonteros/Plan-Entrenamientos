import { useEffect, useState } from 'react'
import { Save, Github, Palette, Database, Info } from 'lucide-react'
import { api, call } from '../utils/api'
import { useAppStore } from '../store/appStore'
import { PageHeader } from '../components/Layout'
import { Card, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'

export function Settings() {
  const { config, setConfig } = useAppStore()
  const [trainerName, setTrainerName] = useState(config?.trainerName ?? '')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(config?.theme ?? 'system')
  const [githubToken, setGithubToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [githubInfo, setGithubInfo] = useState<{ owner: string | null; repo: string | null; setupDone: boolean } | null>(null)

  useEffect(() => {
    call(() => api.config.getGithub())
      .then((info) => setGithubInfo(info as { owner: string | null; repo: string | null; setupDone: boolean }))
      .catch(console.error)
  }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await call(() => api.config.set('trainerName', trainerName.trim()))
      await call(() => api.config.set('theme', theme))
      const updated = await call(() => api.config.get())
      setConfig(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)

      // Apply theme immediately
      const root = document.documentElement
      if (theme === 'dark') root.classList.add('dark')
      else if (theme === 'light') root.classList.remove('dark')
      else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark')
        else root.classList.remove('dark')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveGithub() {
    if (!githubToken.trim()) { setError('Ingresá un token de GitHub'); return }
    setSaving(true)
    setError(null)
    try {
      await call(() => api.config.setGithub({ token: githubToken.trim() }))
      setGithubToken('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const themeOptions = [
    { value: 'system', label: 'Sistema (automático)' },
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
  ]

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title="Configuración" />

      {/* General */}
      <Card className="mb-4">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <Info className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold">General</h3>
        </div>
        <CardBody className="space-y-4">
          <Input
            label="Nombre del entrenador"
            value={trainerName}
            onChange={(e) => setTrainerName(e.target.value)}
          />
          <div className="flex gap-4">
            <Select
              label="Tema de la interfaz"
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
              options={themeOptions}
            />
          </div>
        </CardBody>
      </Card>

      {/* GitHub */}
      <Card className="mb-4">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <Github className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold">Actualizaciones (GitHub)</h3>
        </div>
        <CardBody className="space-y-4">
          {githubInfo?.setupDone ? (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-400">
                ✓ Conectado a <strong>{githubInfo.owner}/{githubInfo.repo}</strong>
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Conectá un repositorio de GitHub para recibir actualizaciones automáticas.
            </p>
          )}
          <Input
            label={githubInfo?.setupDone ? 'Actualizar token de GitHub' : 'Token de GitHub (PAT)'}
            type="password"
            placeholder="ghp_xxxxxxxxxxxx"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Necesitás un Personal Access Token con permiso <code>repo</code>.
          </p>
          <Button variant="secondary" size="sm" onClick={handleSaveGithub} loading={saving} disabled={!githubToken.trim()}>
            Guardar token
          </Button>
        </CardBody>
      </Card>

      {/* App info */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <Database className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold">Información</h3>
        </div>
        <CardBody>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400 text-xs">Versión</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">0.1.0</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Base de datos</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">SQLite local</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {saved && <p className="text-sm text-green-600 dark:text-green-400 mb-4">✓ Cambios guardados</p>}

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4" /> Guardar configuración
        </Button>
      </div>
    </div>
  )
}
