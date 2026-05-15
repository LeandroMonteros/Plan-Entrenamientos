import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { api, call } from './utils/api'
import { useAppStore } from './store/appStore'
import { Layout } from './components/Layout'
import { LoadingState } from './components/Layout'

import { Dashboard } from './pages/Dashboard'
import { Onboarding } from './pages/Onboarding'
import { ClientList } from './pages/clients/ClientList'
import { ClientProfile } from './pages/clients/ClientProfile'
import { ClientForm } from './pages/clients/ClientForm'
import { ExerciseLibrary } from './pages/exercises/ExerciseLibrary'
import { Settings } from './pages/Settings'

export default function App() {
  const { config, setConfig, setLoading, isLoading, theme } = useAppStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    call(() => api.config.get())
      .then((cfg) => {
        setConfig(cfg)
        // Apply theme
        applyTheme(cfg.theme)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (config) applyTheme(config.theme)
  }, [theme])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Iniciando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error al iniciar la aplicación</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!config?.onboardingDone) {
    return <Onboarding onComplete={(cfg) => setConfig(cfg)} />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<ClientList />} />
        <Route path="/clientes/nuevo" element={<ClientForm />} />
        <Route path="/clientes/:id" element={<ClientProfile />} />
        <Route path="/clientes/:id/editar" element={<ClientForm />} />
        <Route path="/ejercicios" element={<ExerciseLibrary />} />
        <Route path="/configuracion" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function applyTheme(theme: string) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) root.classList.add('dark')
    else root.classList.remove('dark')
  }
}
