# App de Entrenamientos

Aplicación de escritorio para entrenadores personales. Junta en un solo lugar los dos
mundos que normalmente no se hablan: el gimnasio —planes, series, repeticiones,
progresión de cargas, mediciones— y el running y ciclismo, donde el dato ya existe pero
está atrapado adentro de un reloj en formato `.FIT`, un binario que ninguna planilla abre.

Sin esto, el entrenador termina con una planilla de Excel por cliente, capturas de
Strava en WhatsApp y ningún lugar donde ver si el alumno mejoró.

---

## Por qué escritorio y no web

Es una decisión deliberada. Los archivos `.FIT` están en la computadora del entrenador
y pesan. Subirlos a un servidor para después bajarlos procesados es trabajo y costo sin
beneficio. Electron con SQLite local resuelve el caso sin infraestructura, sin cuenta
de usuario y sin conexión.

---

## Stack

| Capa | Qué se usa |
|---|---|
| Escritorio | Electron + electron-vite, empaquetado con electron-builder |
| Interfaz | React, TypeScript, Tailwind |
| Estado | Zustand |
| Base de datos | SQLite vía `better-sqlite3`, con Drizzle ORM y migraciones numeradas |
| Parseo | `fit-file-parser` para `.FIT`, `fast-xml-parser` para `.GPX` |
| Visualización | Leaflet para el recorrido sobre mapa, Recharts para las series |
| Validación | Zod en la frontera de entrada |
| Actualizaciones | `electron-updater` contra GitHub Releases |

---

## Arquitectura

La separación estándar de Electron, con una regla propia: **la lógica de negocio no
toca ni IPC ni la base de datos**.

```
src/
├── main/                 # Proceso principal (Node.js)
│   ├── ipc/              # Un archivo por dominio: clients, exercises,
│   │                     #   sessions, running, updater
│   ├── db/               # Conexión SQLite (singleton), esquema Drizzle,
│   │                     #   migrations/ numeradas, seed/ precargado
│   └── services/         # Lo que importa: fitParser, cálculos, informes.
│                         #   Reciben datos y devuelven datos: se pueden
│                         #   probar sin levantar Electron.
├── preload/              # Puente seguro entre main y renderer
├── renderer/             # React + TypeScript
└── shared/               # Tipos compartidos entre procesos
```

### Decisiones que vale la pena explicar

**Drizzle en vez de SQL a mano.** Con migraciones numeradas y esquema tipado, el
renderer y el proceso principal comparten los mismos tipos: si cambia una columna, el
compilador señala los dos lados.

**`better-sqlite3` y no una base cliente-servidor.** Es síncrona y embebida. En una app
de escritorio de un solo usuario, la asincronía de un driver de red es complejidad sin
contrapartida.

**Zod en la frontera.** Un `.FIT` es un binario que viene de un dispositivo de terceros
y puede traer cualquier cosa. Los tipos de TypeScript no existen en tiempo de
ejecución; validar en el borde es la diferencia entre un error legible y una pantalla
en blanco.

**`electron-updater`.** Si la app vive en la máquina del usuario y no hay forma de
actualizarla, la primera versión es la única.

---

## Cómo se corre

Requiere Node.js 20 o superior.

```bash
pnpm install
pnpm dev
```

Para empaquetar:

```bash
pnpm build
```

---

## Alcance y estado

El alcance está definido en `REQUIREMENTS.md`: gestión de clientes con mediciones y
fotos de progreso, biblioteca de ejercicios, planes de gimnasio, planes de running e
informes en PDF.

**Es más de lo que está implementado.** Escribir el documento completo se sintió como
planificar; en la práctica fue construir un proyecto demasiado grande para terminarlo
solo. Si lo rehiciera, recortaría el alcance a la mitad antes de escribir la primera
línea.

Antes de esta versión hubo una en C# sobre .NET Framework, con capas de clases,
gestores e interfaces. Aquella resolvía el ABM; esta intenta resolver el problema de
verdad, que era el `.FIT`.

---

Leandro Monteros — Córdoba, Argentina.
