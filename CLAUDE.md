# CLAUDE.md — App de Seguimiento de Entrenamiento

Guía de desarrollo para Claude Code y cualquier agente de IA que trabaje en este proyecto.
Leer completo antes de modificar cualquier archivo.

---

## Stack y versiones

- **Runtime**: Node.js 20 LTS
- **Framework desktop**: Electron 30+
- **UI**: React 18 + TypeScript 5
- **Base de datos**: SQLite via `better-sqlite3`
- **ORM/migrations**: Drizzle ORM
- **Empaquetado**: electron-builder
- **Actualizaciones**: electron-updater → GitHub Releases
- **Parseo .FIT**: fit-parser
- **Parseo .GPX**: fast-xml-parser
- **Mapas**: Leaflet
- **Gráficos**: Recharts
- **Estado global**: Zustand
- **Testing**: Vitest + Playwright (E2E)
- **Linting**: ESLint + Prettier

---

## Estructura del proyecto

```
├── src/
│   ├── main/                  # Proceso principal de Electron (Node.js)
│   │   ├── index.ts           # Entry point main process
│   │   ├── ipc/               # Handlers de IPC (un archivo por dominio)
│   │   │   ├── clients.ts
│   │   │   ├── exercises.ts
│   │   │   ├── sessions.ts
│   │   │   ├── running.ts
│   │   │   └── updater.ts
│   │   ├── db/                # Todo lo relacionado con SQLite
│   │   │   ├── connection.ts  # Singleton de conexión
│   │   │   ├── migrations/    # Archivos .sql numerados (001_, 002_...)
│   │   │   ├── seed/          # Datos precargados (ejercicios, plantillas)
│   │   │   └── schema.ts      # Esquema Drizzle
│   │   ├── services/          # Lógica de negocio (sin IPC, sin DB directa)
│   │   │   ├── fitParser.ts
│   │   │   ├── gpxParser.ts
│   │   │   ├── progressionEngine.ts
│   │   │   └── githubUpdater.ts
│   │   └── store/             # electron-store (config cifrada)
│   │       └── secureStore.ts
│   ├── renderer/              # Proceso renderer (React)
│   │   ├── App.tsx
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/             # Zustand stores
│   │   └── utils/
│   └── shared/                # Tipos TypeScript compartidos main↔renderer
│       └── types.ts
├── resources/                 # Íconos, assets estáticos
├── migrations/                # SQL de migrations (fuente de verdad)
├── tests/
│   ├── unit/
│   └── e2e/
├── CLAUDE.md                  # Este archivo
├── package.json
└── electron-builder.yml
```

---

## Arquitectura y separación de procesos

### Regla fundamental

**El renderer NUNCA accede directamente a Node.js, SQLite, ni al sistema de archivos.**
Todo pasa por IPC (`ipcRenderer.invoke` → `ipcMain.handle`).

```
Renderer (React)
     │
     │  ipcRenderer.invoke('clients:getAll')
     ▼
Main Process
     │
     ├── Valida y sanitiza input
     ├── Llama al service correspondiente
     ├── El service usa la DB
     └── Retorna resultado serializado
```

### Reglas de IPC

- Nombrar canales como `dominio:accion` (ej: `clients:create`, `sessions:getByClient`)
- Cada dominio tiene su propio archivo en `src/main/ipc/`
- **Validar SIEMPRE el input en el main process**, nunca confiar en datos del renderer
- Usar `zod` para validar schemas de entrada en cada handler IPC
- Los handlers IPC no tienen lógica de negocio: delegan a services
- Retornar siempre `{ data, error }` — nunca lanzar excepciones crudas al renderer

```typescript
// Patrón obligatorio para handlers IPC
ipcMain.handle('clients:create', async (_event, input) => {
  try {
    const validated = ClientCreateSchema.parse(input);
    const result = await clientService.create(validated);
    return { data: result, error: null };
  } catch (err) {
    log.error('clients:create', err);
    return { data: null, error: serializeError(err) };
  }
});
```

---

## Base de datos

### Conexión

- Un único singleton de conexión en `src/main/db/connection.ts`
- Modo WAL habilitado siempre: `PRAGMA journal_mode = WAL`
- Foreign keys habilitadas siempre: `PRAGMA foreign_keys = ON`
- La conexión se abre en el main process, nunca en el renderer

### Migrations

- Archivos numerados secuencialmente: `001_initial.sql`, `002_add_running.sql`
- **Nunca modificar una migration ya aplicada en producción**
- Para cambios, crear una nueva migration
- Correr migrations automáticamente al iniciar la app
- Registrar migrations aplicadas en tabla `_migrations`

### Seed data

- Script separado: `src/main/db/seed/`
- Corre solo si la tabla `exercises` está vacía (primer inicio)
- Los datos seed son inmutables desde la UI (flag `is_default = 1`)
- El usuario puede agregar sus propios ejercicios pero no borrar los default

### Queries

- Usar Drizzle ORM para queries tipadas
- Queries complejas en archivos dedicados dentro de `src/main/db/`
- **No hacer queries en los handlers IPC** — siempre en services o repositories
- Usar transacciones para operaciones que modifican múltiples tablas

```typescript
// Correcto
const result = db.transaction(() => {
  const session = insertSession(data);
  insertSessionExercises(session.id, data.exercises);
  return session;
});
```

---

## Seguridad

### Electron

- `contextIsolation: true` — obligatorio, nunca deshabilitar
- `nodeIntegration: false` — obligatorio en el renderer
- `sandbox: true` — habilitar en todas las BrowserWindow
- `webSecurity: true` — nunca deshabilitar
- Definir `Content-Security-Policy` restrictivo en cada ventana
- Usar `preload.ts` para exponer SOLO las funciones necesarias via `contextBridge`

```typescript
// preload.ts — exponer API mínima
contextBridge.exposeInMainWorld('api', {
  clients: {
    getAll: () => ipcRenderer.invoke('clients:getAll'),
    create: (data) => ipcRenderer.invoke('clients:create', data),
  },
  // ... solo lo necesario
});
```

### Token de GitHub

- Guardar en `electron-store` con `encryptionKey` derivada del sistema
- **Nunca** pasar el token al renderer process
- **Nunca** loguear el token
- **Nunca** incluir en errores serializados
- Toda llamada a la API de GitHub ocurre en el main process

```typescript
// Correcto — solo en main process
import { secureStore } from './store/secureStore';
const token = secureStore.get('githubToken'); // nunca sale del main
```

### Validación de archivos importados

- Validar extensión y magic bytes antes de parsear .FIT y .GPX
- Limitar tamaño máximo de archivo importable (configurar en constants)
- Parsear en un worker o proceso separado si el archivo es grande
- Nunca ejecutar contenido de archivos importados como código

### Actualizaciones

- Verificar firma de los releases antes de instalar (electron-updater lo hace automáticamente con el certificado de electron-builder)
- El chequeo de updates es silencioso si no hay conexión
- El usuario siempre confirma antes de instalar

---

## Patrones de código

### TypeScript

- `strict: true` en tsconfig — sin excepciones
- No usar `any` — usar `unknown` y narrowing
- Tipos compartidos entre main y renderer en `src/shared/types.ts`
- Interfaces para contratos de dominio, types para uniones y utilitarios

### Manejo de errores

- Nunca swallow errors silenciosamente
- Loguear con `electron-log` (archivos rotativos automáticos)
- Errores de usuario: mensajes en español, sin stack traces
- Errores internos: log completo en archivo, mensaje genérico al usuario
- Usar Result types o `{ data, error }` — no excepciones como flujo normal

### Constantes

- Todas en `src/shared/constants.ts`
- Sin magic numbers en el código
- Zonas de FC, límites de archivos, timeouts, versiones de schema — todo en constants

### Naming

- Archivos: `camelCase.ts` para módulos, `PascalCase.tsx` para componentes React
- Variables y funciones: `camelCase`
- Tipos e interfaces: `PascalCase`
- Canales IPC: `dominio:accion` en kebab-case
- Tablas SQLite: `snake_case` en plural (`training_sessions`, `exercise_sets`)
- Columnas SQLite: `snake_case`

---

## Testing

- **Unit tests** (Vitest): services, parsers, lógica de progresión, utilidades
- **Integration tests** (Vitest): handlers IPC con DB en memoria
- **E2E tests** (Playwright): flujos críticos (crear cliente, registrar sesión, importar .FIT)
- Cobertura mínima objetivo: 70% en services y parsers
- Los tests de DB usan una DB en memoria separada, nunca la de producción
- Ejecutar `pnpm test` antes de cada commit (configurar en husky)

---

## Proceso de desarrollo

### Commits

- Formato: `tipo(scope): descripción en español`
- Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Ejemplos:
  - `feat(running): agregar soporte para importar archivos .GPX`
  - `fix(db): corregir migration 003 para SQLite < 3.35`
  - `refactor(ipc): extraer validación de clientes a zod schema`
- Un commit por cambio lógico — no mezclar features con fixes

### Branches

- `main` — producción, protegida, solo merge via PR
- `develop` — integración
- `feature/nombre-corto` — nuevas funcionalidades
- `fix/nombre-corto` — bugfixes

### Releases

1. Bump de versión en `package.json` (semver)
2. Actualizar `CHANGELOG.md`
3. `pnpm build` — genera instaladores en `/dist`
4. Crear GitHub Release con tag `vX.Y.Z`
5. Subir los assets: `.exe`, `.dmg`, `.AppImage`
6. electron-updater detecta automáticamente el nuevo release

---

## Variables de entorno

```bash
# .env.development
VITE_APP_ENV=development
VITE_DISABLE_UPDATER=true       # No chequear updates en dev

# .env.production
VITE_APP_ENV=production
```

- **Nunca** poner tokens ni secrets en `.env` — van en `electron-store` cifrado
- `.env` nunca se commitea — está en `.gitignore`
- `.env.example` sí se commitea con todas las keys vacías

---

## Qué NO hacer

- No usar `remote` module de Electron (deprecado)
- No hacer queries SQL directamente en handlers IPC
- No pasar objetos complejos no serializables por IPC
- No usar `innerHTML` en el renderer (XSS)
- No guardar el token de GitHub en localStorage ni en el renderer
- No modificar migrations ya aplicadas
- No borrar ejercicios con `is_default = 1`
- No hacer fetch a APIs externas desde el renderer — solo desde main
- No commitear a `main` directamente
- No ignorar errores de TypeScript con `@ts-ignore` sin comentario explicativo

---

## Checklist antes de abrir un PR

- [ ] `pnpm typecheck` sin errores
- [ ] `pnpm lint` sin errores
- [ ] `pnpm test` pasa
- [ ] Nueva migration tiene número secuencial correcto
- [ ] Inputs IPC validados con zod
- [ ] Sin `console.log` en código de producción (usar `electron-log`)
- [ ] CHANGELOG.md actualizado si es feat o fix
- [ ] Sin secrets ni tokens en el código

---

## Contacto del proyecto

- Repositorio: configurado en primer inicio via onboarding
- Releases: GitHub Releases del repositorio configurado
- Logs de la app: `%APPDATA%/app-entrenamiento/logs/` (Windows) · `~/Library/Logs/app-entrenamiento/` (Mac) · `~/.config/app-entrenamiento/logs/` (Linux)