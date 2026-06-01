# MusicFlow

Plataforma multiplataforma de reproduccion musical con ecualizacion granular asistida por IA.

## Vision del Producto

MusicFlow es una plataforma (Web + Desktop + Mobile) de reproduccion musical enfocada en la personalizacion granular de la ecualizacion asistida por un agente de inteligencia artificial.

### Propuesta de Valor

"El primer reproductor que entiende tu musica a nivel de segundo. Ecualiza el coro distinto al puente, cada cancion distinto al resto, cada playlist con su propia personalidad - todo manualmente o pidiendoselo a una IA en lenguaje natural."

### Diferenciadores Clave

| Caracteristica               | MusicFlow | Competencia |
| ---------------------------- | --------- | ----------- |
| EQ global                    | Si        | Si          |
| EQ por playlist              | Si        | No          |
| EQ por cancion               | Si        | Parcial     |
| EQ por segmento temporal     | Si        | No          |
| Agente IA para configurar EQ | Si        | No          |
| Modo hibrido (local + cloud) | Si        | Parcial     |
| Web + Desktop + Mobile       | Si        | Parcial     |

---

## Estructura del Proyecto (Monorepo)

```
MusicFlow/
├── apps/
│   ├── backend/             # NestJS API
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── prisma/      # PrismaService
│   │   │   ├── common/      # Guards, decorators, filters
│   │   │   └── modules/
│   │   │       ├── auth/        # Registro, login JWT, devices
│   │   │       ├── library/     # Tracks y playlists
│   │   │       ├── equalizer/   # Presets, configs, segments
│   │   │       ├── ai-agent/    # Integracion con Claude
│   │   │       ├── analytics/   # PlayHistory, stats
│   │   │       ├── sync/        # Sincronizacion hibrida
│   │   │       ├── preferences/ # Preferencias de usuario
│   │   │       ├── storage/     # Cliente R2 / S3-compatible
│   │   │       └── admin/       # Panel de administracion
│   │   └── prisma/schema.prisma
│   │
│   ├── web/                 # React 19 + Electron (Web + Desktop)
│   │   ├── electron/        # main.cjs, preload.cjs, ipc/
│   │   └── src/
│   │       ├── auth/pages/  # Login, Register, ForgotPassword, etc.
│   │       ├── client/      # Vista cliente (pages, features, layout)
│   │       ├── shared/      # ui/, hooks/, stores/, utils/
│   │       └── audio/       # Motor Web Audio API (en desarrollo)
│   │
│   └── mobile/              # Flutter (Android + iOS) - externo a pnpm
│       └── lib/
│           ├── app/         # router.dart, routes.dart, theme.dart
│           └── features/    # auth, library, player, equalizer, ai_agent, etc.
│
├── packages/
│   ├── shared/              # @musicflow/shared (types, constants, utils)
│   ├── ui/                  # @musicflow/ui (shadcn components)
│   └── config/              # @musicflow/config (TSConfig, ESLint)
│
├── docs/                    # Documentacion
├── infra/                   # Configuracion de despliegue
├── docker-compose.yml       # Servicios de desarrollo (Postgres, Redis)
├── docker-compose.prod.yml  # Produccion
├── pnpm-workspace.yaml
├── turbo.json
├── Scrum.md                 # Backlog y roadmap de sprints
└── CLAUDE.md                # Reglas de desarrollo para agentes IA
```

---

## Stack Tecnologico

### Backend (`apps/backend`)

- **NestJS 10.x** + TypeScript 5
- **Prisma 5.x** ORM
- **PostgreSQL 16**
- **Redis 7** (BullMQ para jobs)
- **Passport + JWT** (`@nestjs/jwt`, `@nestjs/passport`)
- **class-validator** + class-transformer (DTOs)
- **Swagger** / OpenAPI (`@nestjs/swagger`)
- **Claude API** (`@anthropic-ai/sdk`)
- **Cloudflare R2** para storage de audio e imagenes (S3-compatible)
- **Jest** + Supertest (testing)

### Frontend Web + Desktop (`apps/web`)

- **React 19** + TypeScript 5
- **Vite 8** (bundler)
- **Electron 41** (desktop wrapper)
- **React Router 7**
- **TailwindCSS 3**
- **lucide-react** (iconos)
- **Web Audio API** (ecualizacion en tiempo real - en desarrollo)

> Nota: El cliente HTTP (axios/TanStack Query), Zustand, abstraccion platform/desktop y PWA estan planificados en `Scrum.md` pero **no estan instalados todavia** en `package.json`. Hoy las paginas funcionan con datos mock.

### Mobile (`apps/mobile`)

- **Flutter 3.11+** + Dart 3.11
- `flutter_launcher_icons`
- _Pendientes de integrar:_ Riverpod, Dio, Drift, just_audio, go_router

### Monorepo

- **pnpm 9.x** (workspaces)
- **Turborepo 2.x** (build orchestration)

### Infraestructura

- **Docker** + Docker Compose
- **Cloudflare R2** (storage S3-compatible)
- **GitHub Actions** (CI/CD - `.github/workflows/ci.yml`)
- **Dependabot** (actualizaciones)

---

## Servicios Cloud Configurados

### Cloudflare R2 - Buckets

| Bucket              | Uso                 | URL publica                                           |
| ------------------- | ------------------- | ----------------------------------------------------- |
| `music-flow`        | Archivos de audio   | `https://pub-f44a489bc1e94270836132b3136f0a8c.r2.dev` |
| `music-flow-images` | Portadas / avatares | `https://pub-7f3d08bcabf44d68b2a57424acfc9d48.r2.dev` |

**Endpoint S3-compatible:** `https://e6059b4515b414d738310669c6ca5977.r2.cloudflarestorage.com`

Las credenciales (`R2_ACCESS_KEY`, `R2_SECRET_ACCESS_KEY`) se cargan via variables de entorno - nunca en el repositorio.

---

## Requisitos

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Flutter 3.11+
- Docker y Docker Compose (recomendado para Postgres / Redis)

---

## Inicio Rapido

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd MusicFlow

# Instala todas las dependencias del monorepo
pnpm install
```

### 2. Levantar servicios de infraestructura (Postgres + Redis)

```bash
docker-compose up -d
```

### 3. Backend (NestJS)

```bash
cd apps/backend

# Configurar variables de entorno
cp .env.example .env   # editar con valores reales

# Generar cliente Prisma y aplicar migraciones
pnpm prisma generate
pnpm prisma migrate dev --name init

# Sembrar presets globales (Flat, Rock, Jazz, etc.)
pnpm prisma db seed

# Arrancar en modo desarrollo
pnpm start:dev
```

API en `http://localhost:3000` - Swagger en `http://localhost:3000/api/docs`.

### 4. Frontend Web

```bash
cd apps/web
pnpm dev          # Vite dev server en http://localhost:5173
pnpm electron     # Lanza Electron contra el dev server
```

### 5. Mobile (Flutter)

```bash
cd apps/mobile
flutter pub get
flutter run
```

### 6. Comandos desde la raiz (Turborepo)

```bash
pnpm dev                                   # Todos los servicios en paralelo
pnpm build                                 # Build de todo el monorepo
pnpm lint                                  # Lint en todos los packages
pnpm test                                  # Tests en todos los packages

# Filtrar por workspace
pnpm --filter @musicflow/backend dev
pnpm --filter web dev
```

---

## Configuracion de Variables de Entorno

### Backend (`apps/backend/.env`)

```env
# App
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://musicflow:musicflow@localhost:5432/musicflow

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=cambia-este-valor
JWT_REFRESH_SECRET=cambia-este-valor-tambien
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Cloudflare R2 (Storage)
R2_ENDPOINT=https://e6059b4515b414d738310669c6ca5977.r2.cloudflarestorage.com
R2_ACCESS_KEY=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_AUDIO=music-flow
R2_BUCKET_IMAGES=music-flow-images
R2_PUBLIC_AUDIO_URL=https://pub-f44a489bc1e94270836132b3136f0a8c.r2.dev
R2_PUBLIC_IMAGES_URL=https://pub-7f3d08bcabf44d68b2a57424acfc9d48.r2.dev

# Anthropic (Claude)
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

### Frontend (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:3000
VITE_R2_AUDIO_BASE=https://pub-f44a489bc1e94270836132b3136f0a8c.r2.dev
VITE_R2_IMAGES_BASE=https://pub-7f3d08bcabf44d68b2a57424acfc9d48.r2.dev
```

> **Importante:** Nunca commitear `.env` con secretos. Los campos `R2_ACCESS_KEY`, `R2_SECRET_ACCESS_KEY` y `ANTHROPIC_API_KEY` se gestionan fuera del repositorio (Vault, secrets de GitHub Actions, etc.).

---

## Modelos de Datos Principales (Prisma)

Definidos en `apps/backend/prisma/schema.prisma`.

- **User** - UUID, email, username, role (ADMIN/CLIENT), isPremium
- **Device** - Sesiones por dispositivo (DESKTOP_WIN/MAC/LINUX, MOBILE_ANDROID/IOS)
- **Track** - Metadata completa + soporte hibrido (LOCAL / SYNCED / BOTH), `fileHash`
- **Playlist** + **PlaylistTrack** - Colecciones con orden, soporte de compartir
- **EQPreset** - 10 bandas (31Hz-16kHz), bassBoost, virtualizer, loudness, reverb
- **EQConfig** - EQ aplicado a un scope (GLOBAL / PLAYLIST / TRACK / SEGMENT)
- **EQSegment** - EQ para un rango de tiempo dentro de una cancion
- **AIRequest** - Peticiones al agente con prompt, response, feedback, costos
- **PlayHistory** + **ListeningStats** - Tracking de reproduccion
- **UserPreferences** - Tema, layouts, crossfade, scrobbling, etc.
- **SyncLog** + **ConflictLog** - Auditoria de sincronizacion

---

## API Endpoints (Resumen)

Documentacion completa en Swagger: `http://localhost:3000/api/docs`.

### Auth (`/auth`)

- `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- `POST /auth/forgot-password`, `/auth/reset-password`
- `GET /auth/me`

### Users (`/users`) y Devices (`/devices`)

- `GET/PATCH /users/me`, upload de avatar, change password
- `GET/POST/DELETE /devices`

### Library (`/tracks`, `/playlists`)

- CRUD de tracks con paginacion, filtros por artist/album/genre
- `GET /tracks/artists`, `/tracks/albums`, `/tracks/genres`
- CRUD de playlists + reorder

### Equalizer (`/equalizer`)

- `GET/POST/PATCH/DELETE /equalizer/presets`
- `GET /equalizer/configs?scopeType=...` - obtener config por scope
- `GET /equalizer/configs/resolve/:trackId` - resolver EQ efectivo
- `POST /equalizer/configs` - upsert
- `GET/POST/PATCH/DELETE /equalizer/segments/:trackId`
- `GET /equalizer/segments/:trackId/active?position=...` - segmento activo

### AI Agent (`/ai-agent`)

- `POST /ai-agent/suggest` - sugerencia de EQ via Claude
- `POST /ai-agent/:requestId/accept` - aplicar sugerencia
- `POST /ai-agent/:requestId/feedback` - calificar resultado
- `GET /ai-agent/history`

### Sync (`/sync`)

- `GET /sync/pull?since=...` - cambios desde timestamp
- `POST /sync/push` - subir cambios locales
- `GET /sync/conflicts`, `POST /sync/conflicts/:id/resolve`
- `GET /sync/logs`

### Analytics (`/analytics`)

- `POST /analytics/plays` - registrar reproduccion
- `GET /analytics/stats?period=DAY|WEEK|MONTH|ALL_TIME`

### Admin (`/admin`)

- Gestion de usuarios (rol, premium, bloquear)
- Metricas globales y logs del agente IA

---

## Prioridad de EQ en Reproduccion

Implementado en `apps/backend/src/modules/equalizer/configs.service.ts` (`resolveForTrack`):

1. **Segmento activo** (si hay uno cuyo rango cubre el `currentMs`)
2. **Configuracion del track**
3. **Configuracion de la playlist activa**
4. **Configuracion global del usuario**
5. **Flat** (sin ecualizacion)

---

## Flujo de Datos - Agente IA

```
Usuario: "Quiero mas bajos en el coro del minuto 1:30 al 2:10"
    |
    v
Cliente (React/Flutter) -> POST /ai-agent/suggest
    |
    v
NestJS AiAgentController -> AiAgentService
    |
    +-> Enriquece contexto (track, artist, album, genre, EQ actual)
    |
    v
Claude API (@anthropic-ai/sdk)  [HOY: mock segun keywords del prompt]
    |
    v
Validacion de respuesta (DTOs) + Prisma:
    - Guarda AIRequest
    - Crea/actualiza EQSegment
    |
    v
Respuesta al cliente con preview aplicable
    |
    v
Usuario acepta/rechaza -> POST /ai-agent/:id/accept o /feedback
```

---

## Testing

> Estado actual: Sin tests escritos. Pendientes en epica E15 del Scrum.

```bash
# Backend (cuando existan tests)
cd apps/backend
pnpm test
pnpm test:cov
pnpm test:e2e

# Frontend (cuando existan tests)
cd apps/web
pnpm test
pnpm test:e2e   # Playwright (planificado)

# Mobile
cd apps/mobile
flutter test
flutter test integration_test/
```

---

## Despliegue

### Produccion con Docker

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Builds Desktop (Electron)

```bash
cd apps/web
pnpm build              # Build web
pnpm build:electron     # Genera instaladores (.exe, .dmg, .deb)  [pendiente configurar electron-builder]
```

### Builds Mobile

```bash
cd apps/mobile
flutter build apk --release          # Android APK
flutter build appbundle --release    # Android App Bundle (Play Store)
flutter build ios --release          # iOS
```

---

## Estado del Proyecto

Backlog detallado, sprints y avance por epica: ver **[Scrum.md](./Scrum.md)**.

Reglas obligatorias para contribuir y guias por area (NestJS, React/Electron, Flutter): ver **[CLAUDE.md](./CLAUDE.md)** y `.claude/skills/`.

---

## Contribucion

1. Crear rama desde `main`: `git checkout -b feature/PB-XXX-descripcion`
2. Commits siguiendo Conventional Commits
3. Pull Request hacia `main` - GitHub Actions valida lint + tests
4. Review + aprobacion + merge

### Convenciones de Commits

```
feat(equalizer): agregar EQ por segmentos temporales
fix(auth): corregir refresh de token expirado
docs(readme): actualizar instrucciones de setup
test(ai): anadir tests del parser de respuestas
refactor(sync): simplificar logica de conflictos
chore(deps): actualizar dependencias de Dependabot
```

---

## Licencia

Propiedad privada - Todos los derechos reservados.

---

## Contacto

Para preguntas sobre el proyecto, contactar al equipo de desarrollo.
