import { app, BrowserWindow, shell, protocol, net } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import { initDb, closeDb } from './db/connection'
import { registerClientHandlers } from './ipc/clients'
import { registerExerciseHandlers } from './ipc/exercises'
import { registerGymHandlers } from './ipc/gym'
import { registerRunningHandlers } from './ipc/running'
import { registerConfigHandlers } from './ipc/config'

// Registro previo al ready: necesario para que el scheme sea reconocido en el renderer
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { secure: true, standard: true, supportFetchAPI: true } },
])

log.transports.file.level = 'info'
log.info('App starting...')

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId(app.isPackaged ? 'com.entrenamiento.app' : process.execPath)
  }

  // Sirve archivos locales de media (imágenes/videos de ejercicios) al renderer
  protocol.handle('media', (request) => {
    const filePath = decodeURIComponent(request.url.replace('media://', ''))
    return net.fetch(`file:///${filePath.replace(/\\/g, '/')}`)
  })

  try {
    initDb()
  } catch (err) {
    log.error('Failed to initialize database:', err)
  }

  registerClientHandlers()
  registerExerciseHandlers()
  registerGymHandlers()
  registerRunningHandlers()
  registerConfigHandlers()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDb()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  closeDb()
})
