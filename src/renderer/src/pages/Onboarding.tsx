import { useState } from 'react'
import { Activity, ArrowRight, Github, User, Check } from 'lucide-react'
import { api, call } from '../utils/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import type { AppConfig } from '@shared/types'

interface Props {
  onComplete: (config: AppConfig) => void
}

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [trainerName, setTrainerName] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [githubRepoName, setGithubRepoName] = useState('app-entrenamiento-backup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [githubDone, setGithubDone] = useState(false)

  async function handleName() {
    if (!trainerName.trim()) return
    setLoading(true)
    try {
      await call(() => api.config.set('trainerName', trainerName.trim()))
      setStep(2)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGitHub() {
    if (!githubToken.trim() || !githubRepoName.trim()) return
    setLoading(true)
    setError(null)
    try {
      await call(() =>
        api.config.setupGithubRepo({ token: githubToken.trim(), repoName: githubRepoName.trim() }),
      )
      setGithubDone(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleFinish() {
    setLoading(true)
    try {
      await call(() => api.config.set('onboardingDone', true))
      const cfg = await call(() => api.config.get())
      onComplete(cfg)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">App Entrenamiento</h1>
            <p className="text-sm text-gray-400">Gestión de entrenamiento físico</p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                s === step ? 'bg-primary-500' : s < step ? 'bg-primary-700' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        <div className="bg-gray-800 rounded-2xl p-6">
          {/* Step 1: Name */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">¡Bienvenido!</h2>
                  <p className="text-sm text-gray-400">¿Cómo querés que te llamemos?</p>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Tu nombre"
                  placeholder="Ej: Carlos García"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleName()}
                  autoFocus
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                />
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button
                  onClick={handleName}
                  loading={loading}
                  disabled={!trainerName.trim()}
                  className="w-full"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: GitHub (opcional) */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center">
                  <Github className="w-5 h-5 text-gray-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Actualizaciones automáticas</h2>
                  <p className="text-sm text-gray-400">Conectá con GitHub para recibir updates</p>
                </div>
              </div>

              {githubDone ? (
                <div className="flex items-center gap-3 p-4 bg-green-900/30 rounded-xl border border-green-700 mb-4">
                  <Check className="w-5 h-5 text-green-400 shrink-0" />
                  <p className="text-sm text-green-400">Repositorio creado exitosamente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    label="Token de GitHub (PAT)"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    label="Nombre del repositorio"
                    placeholder="app-entrenamiento-backup"
                    value={githubRepoName}
                    onChange={(e) => setGithubRepoName(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-500">
                    Necesitás un token con permiso <code className="text-gray-400">repo</code>. Podés omitir este paso y configurarlo después.
                  </p>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <Button
                    onClick={handleGitHub}
                    loading={loading}
                    disabled={!githubToken.trim() || !githubRepoName.trim()}
                    className="w-full"
                  >
                    Crear repositorio
                  </Button>
                </div>
              )}

              <button
                onClick={() => setStep(3)}
                className="mt-3 w-full text-sm text-gray-500 hover:text-gray-400 transition-colors py-2"
              >
                {githubDone ? 'Continuar →' : 'Omitir por ahora →'}
              </button>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary-600/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-primary-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">¡Todo listo, {trainerName}!</h2>
              <p className="text-sm text-gray-400 mb-6">
                La aplicación está configurada. Ya podés empezar a agregar clientes y registrar entrenamientos.
              </p>
              {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
              <Button onClick={handleFinish} loading={loading} className="w-full" size="lg">
                Comenzar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
