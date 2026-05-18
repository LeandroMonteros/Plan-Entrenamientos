import Store from 'electron-store'
import { safeStorage } from 'electron'
import log from 'electron-log'

interface StoreSchema {
  trainerName: string
  theme: string
  onboardingDone: boolean
  githubOwner: string
  githubRepo: string
  githubSetupDone: boolean
  githubTokenEncrypted: string
  backupPath: string
  backupFrequency: string
  inactivityAlertDays: number
  lastUpdateCheck: string
}

const store = new Store<StoreSchema>({
  name: 'app-config',
  defaults: {
    trainerName: '',
    theme: 'system',
    onboardingDone: false,
    githubOwner: 'LeandroMonteros',
    githubRepo: 'Plan-Entrenamientos',
    githubSetupDone: false,
    githubTokenEncrypted: '',
    backupPath: '',
    backupFrequency: 'daily',
    inactivityAlertDays: 7,
    lastUpdateCheck: '',
  },
})

export const appStore = {
  get<K extends keyof StoreSchema>(key: K): StoreSchema[K] {
    return store.get(key)
  },

  set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void {
    store.set(key, value)
  },

  getGithubToken(): string | null {
    const encrypted = store.get('githubTokenEncrypted')
    if (!encrypted) return null

    if (safeStorage.isEncryptionAvailable()) {
      try {
        return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
      } catch (err) {
        log.error('Failed to decrypt GitHub token', err)
        return null
      }
    }

    // Dev fallback: token stored as plain text (base64 decoded)
    try {
      return Buffer.from(encrypted, 'base64').toString('utf-8')
    } catch {
      return null
    }
  },

  setGithubToken(token: string): void {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(token).toString('base64')
      store.set('githubTokenEncrypted', encrypted)
    } else {
      // Dev fallback
      store.set('githubTokenEncrypted', Buffer.from(token).toString('base64'))
    }
  },

  clearGithubToken(): void {
    store.set('githubTokenEncrypted', '')
  },
}
