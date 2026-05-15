import { create } from 'zustand'
import type { AppConfig } from '@shared/types'

interface AppState {
  config: AppConfig | null
  isLoading: boolean
  theme: 'light' | 'dark' | 'system'
  setConfig: (config: AppConfig) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  config: null,
  isLoading: true,
  theme: 'system',

  setConfig: (config) => set({ config }),
  setTheme: (theme) => set({ theme }),
  setLoading: (isLoading) => set({ isLoading }),
}))
