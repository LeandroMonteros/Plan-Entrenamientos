import { spawn } from 'child_process'

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

spawn('electron-vite', ['dev'], { stdio: 'inherit', shell: true, env })
  .on('exit', (code) => process.exit(code ?? 0))
