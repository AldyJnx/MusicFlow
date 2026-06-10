# MusicFlow

Plataforma multiplataforma de reproducción musical con ecualización granular asistida por IA.

## Visión del Producto

MusicFlow es una plataforma (Web + Desktop + Mobile) de reproducción musical enfocada en la personalización granular de la ecualización, asistida por un agente de inteligencia artificial.

### Propuesta de Valor

> "El primer reproductor que entiende tu música a nivel de segundo. Ecualiza el coro distinto al puente, cada canción distinto al resto, cada playlist con su propia personalidad — todo manualmente o pidiéndoselo a una IA en lenguaje natural."

### Diferenciadores Clave

| Característica                | MusicFlow | Competencia |
| ----------------------------- | --------- | ----------- |
| EQ global                     | Sí        | Sí          |
| EQ por playlist               | Sí        | No          |
| EQ por canción                | Sí        | Parcial     |
| EQ por segmento temporal      | Sí        | No          |
| Agente IA para configurar EQ  | Sí        | No          |
| Detección de segmentos con IA | Sí        | No          |
| Modo híbrido (local + cloud)  | Sí        | Parcial     |
| Web + Desktop + Mobile        | Sí        | Parcial     |

---

## Funcionalidades Principales

### Reproductor y biblioteca

- Catálogo y biblioteca personal (canciones guardadas / "Me gustan").
- Reproductor con cola de reproducción, reproductor expandido (portada + letra sincronizada), mini-player y ecualizador en tiempo real.
- Importación de canciones y navegación por artistas y álbumes.

### Playlists

- Crear, listar y eliminar playlists.
- **Agregar canciones a playlists** desde la biblioteca, el reproductor expandido y la cola.
- **Página de detalle de playlist**: ver y reproducir su contenido, reordenar canciones, quitar pistas y abrir el EQ propio de la playlist.

### Ecualización granular

- EQ de 10 bandas (31 Hz – 16 kHz) más bass boost, virtualizer, loudness y reverb.
- Cascada de prioridad: Segmento → Track → Playlist → Global.
- **Editor de segmentos**: definir zonas de tiempo con EQ independiente por canción.
- **Detección automática de segmentos con IA**: divide la canción en secciones (intro, verso, coro, puente, outro) y propone un EQ para cada una.

### Agente de IA

- Sugerencias de EQ en lenguaje natural ("quiero más graves en el coro del 1:30 al 2:10").
- Historial de peticiones, aceptación/rechazo y feedback.
- Control de cuota mensual por usuario y límites anti-ráfaga.

### Analítica de escucha

- Registro de reproducciones con tiempo escuchado real.
- "Reproducido recientemente" y "Más escuchadas" en el inicio y el sidebar.
- Panel de estadísticas en el perfil (tiempo de escucha, artistas y canciones únicas, top de artistas).

### Sincronización híbrida

- Pull/push de cambios entre dispositivos.
- Resolución de conflictos: el cliente gana, el servidor gana o **merge a nivel de campo**.

### Administración

- Panel admin: gestión de usuarios (rol, premium, estado), métricas globales y auditoría del agente de IA.

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
│   │   │       ├── library/     # Tracks, playlists, saves
│   │   │       ├── equalizer/   # Presets, configs, segments
│   │   │       ├── ai-agent/    # Agente IA (sugerencias y detección)
│   │   │       ├── analytics/   # PlayHistory, stats
│   │   │       ├── sync/        # Sincronización híbrida
│   │   │       ├── billing/     # Premium / cuotas / Stripe
│   │   │       ├── preferences/ # Preferencias de usuario
│   │   │       ├── storage/     # Cliente R2 / S3-compatible
│   │   │       └── admin/       # Panel de administración
│   │   └── prisma/schema.prisma
│   │
│   ├── web/                 # React + Electron (Web + Desktop)
│   │   ├── electron/        # main.cjs, preload.cjs, ipc/
│   │   └── src/
│   │       ├── auth/pages/  # Login, Register, ForgotPassword, etc.
│   │       ├── client/      # Vista cliente (pages, features, layout, stores)
│   │       ├── admin/       # Vista de administración
│   │       ├── shared/      # api/, ui/, hooks/, stores/, utils/
│   │       └── audio/       # Motor Web Audio API (EQ, segmentos, efectos)
│   │
│   └── mobile/              # Flutter (Android + iOS) — externo a pnpm
│       └── lib/
│           ├── app/         # router.dart, routes.dart, theme.dart
│           └── features/    # auth, library, player, equalizer, ai_agent, etc.
│
├── packages/
│   ├── shared/              # @musicflow/shared (types, constants, utils)
│   ├── ui/                  # @musicflow/ui (componentes shadcn)
│   └── config/              # @musicflow/config (TSConfig, ESLint)
│
├── docs/                    # Documentación
├── infra/                   # Configuración de despliegue
├── docker-compose.yml       # Servicios de desarrollo (Postgres, Redis)
├── docker-compose.prod.yml  # Producción
├── pnpm-workspace.yaml
├── turbo.json
└── Scrum.md                 # Backlog y roadmap de sprints
```

---

## Stack Tecnológico

### Backend (`apps/backend`)

- **NestJS 10** + TypeScript 5
- **Prisma 5** ORM
- **PostgreSQL 16**
- **Redis 7** (BullMQ para jobs)
- **Passport + JWT** (`@nestjs/jwt`, `@nestjs/passport`)
- **class-validator** + class-transformer (DTOs)
- **Swagger** / OpenAPI (`@nestjs/swagger`)
- **Integración con IA** mediante SDK (`@anthropic-ai/sdk`); incluye un modo mock para desarrollo sin API key
- **Cloudflare R2** para storage de audio e imágenes (S3-compatible)
- **Stripe** (checkout / webhooks de suscripción)
- **Jest** + Supertest (testing)

### Frontend Web + Desktop (`apps/web`)

- **React 18/19** + TypeScript 5
- **Vite** (bundler)
- **Electron** (wrapper desktop)
- **React Router**
- **TanStack Query** + **Axios** (datos remotos)
- **Zustand** (estado de cliente: player, auth, preferencias)
- **TailwindCSS 3**
- **lucide-react** (iconos)
- **Web Audio API** (ecualización y segmentos en tiempo real)

### Mobile (`apps/mobile`)

- **Flutter 3.11+** + Dart 3.11
- Paridad parcial con la web (en desarrollo)

### Monorepo

- **pnpm 9** (workspaces)
- **Turborepo 2** (orquestación de builds)

### Infraestructura

- **Docker** + Docker Compose
- **Cloudflare R2** (storage S3-compatible)
- **GitHub Actions** (CI/CD)

---

## Requisitos

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker y Docker Compose (recomendado para Postgres / Redis)
- Flutter 3.11+ (solo para la app mobile)

---

## Inicio Rápido

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd MusicFlow
pnpm install
```

### 2. Levantar infraestructura (Postgres + Redis)

```bash
docker-compose up -d
```

### 3. Backend (NestJS)

```bash
cd apps/backend

cp .env.example .env        # editar con valores reales

pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm prisma db seed         # presets globales (Flat, Rock, Jazz, etc.)

pnpm start:dev
```

- API: `http://localhost:8000/api`
- Swagger: `http://localhost:8000/api/docs`

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

### 6. Comandos desde la raíz (Turborepo)

```bash
pnpm dev                                # Todos los servicios en paralelo
pnpm build                              # Build de todo el monorepo
pnpm lint                               # Lint en todos los packages
pnpm test                               # Tests en todos los packages
pnpm typecheck                          # Type-check en todos los packages

# Filtrar por workspace
pnpm --filter @musicflow/backend dev
pnpm --filter web dev
```

---

## Variables de Entorno

### Backend (`apps/backend/.env`)

```env
# App
NODE_ENV=development
PORT=8000

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
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_AUDIO=music-flow
R2_BUCKET_IMAGES=music-flow-images
R2_PUBLIC_AUDIO_URL=https://<bucket-audio>.r2.dev
R2_PUBLIC_IMAGES_URL=https://<bucket-images>.r2.dev

# IA (proveedor de modelo de lenguaje)
# Si no se define, el agente usa respuestas mock deterministas.
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=<id-del-modelo>

# Stripe (opcional, billing)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Frontend (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:8000
```

> **Importante:** nunca commitear `.env` con secretos. `R2_ACCESS_KEY`, `R2_SECRET_ACCESS_KEY`, `ANTHROPIC_API_KEY` y las claves de Stripe se gestionan fuera del repositorio (Vault, secrets de CI, etc.).

---

## Modelos de Datos Principales (Prisma)

Definidos en `apps/backend/prisma/schema.prisma`.

- **User** — UUID, email, username, role (ADMIN/CLIENT), isPremium
- **Device** — sesiones por dispositivo
- **Track** — metadata completa + soporte híbrido (LOCAL / SYNCED / BOTH), `fileHash`, peaks
- **Playlist** + **PlaylistTrack** — colecciones ordenadas, soporte de compartir
- **UserLibrarySave** — canciones guardadas / "Me gustan"
- **EQPreset** — 10 bandas, bassBoost, virtualizer, loudness, reverb
- **EQConfig** — EQ aplicado a un scope (GLOBAL / PLAYLIST / TRACK / SEGMENT)
- **EQSegment** — EQ para un rango de tiempo dentro de una canción (manual o IA)
- **AIRequest** — peticiones del agente con prompt, response, feedback, costos
- **PlayHistory** + **ListeningStats** — tracking de reproducción y estadísticas
- **UserPreferences** — tema, layouts, crossfade, etc.
- **SyncLog** + **ConflictLog** — auditoría y resolución de sincronización

---

## API Endpoints (Resumen)

Documentación completa en Swagger: `http://localhost:8000/api/docs`. Todas las rutas cuelgan del prefijo global `/api`.

### Auth (`/auth`)

- `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- `POST /auth/forgot-password`, `/auth/reset-password`
- `GET /auth/me`

### Library (`/library`)

- `GET /library/tracks` con paginación y filtros (artist/album/genre)
- `GET /library/tracks/artists`, `/library/tracks/albums`, `/library/tracks/genres`
- `GET/POST/DELETE /library/playlists`, `GET /library/playlists/:id`, `PATCH /library/playlists/:id`
- `POST/DELETE /library/playlists/:id/tracks`, `PATCH /library/playlists/:id/tracks/reorder`
- `GET/POST/DELETE /library/saves` ("Me gustan")

### Equalizer (`/equalizer`)

- `GET/POST/PATCH/DELETE /equalizer/presets`
- `GET /equalizer/configs/resolve/:trackId` — resolver EQ efectivo
- `POST /equalizer/configs` — upsert por scope
- `GET/POST/PATCH/DELETE /equalizer/segments/:trackId`

### Agente IA (`/ai`)

- `POST /ai/suggest` — sugerencia de EQ en lenguaje natural
- `POST /ai/detect-segments` — detección automática de segmentos
- `POST /ai/:requestId/accept`, `POST /ai/:requestId/feedback`
- `GET /ai/history`

### Analytics (`/analytics`)

- `POST /analytics/play` — registrar reproducción
- `GET /analytics/stats?period=DAY|WEEK|MONTH|ALL_TIME`
- `GET /analytics/recently-played`, `GET /analytics/most-played`, `GET /analytics/history`

### Sync (`/sync`)

- `GET /sync/pull?since=...`, `POST /sync/push`
- `GET /sync/conflicts`, `POST /sync/conflicts/:id/resolve` (LOCAL_WINS / SERVER_WINS / MERGE)
- `GET /sync/logs`

### Admin (`/admin`)

- Gestión de usuarios (rol, premium, estado)
- Métricas globales y logs del agente IA

---

## Prioridad de EQ en Reproducción

Implementado en `apps/backend/src/modules/equalizer/configs.service.ts`:

1. **Segmento activo** (si su rango cubre la posición actual)
2. **Configuración del track**
3. **Configuración de la playlist activa**
4. **Configuración global del usuario**
5. **Flat** (sin ecualización)

---

## Testing

```bash
# Backend (Jest + Supertest)
cd apps/backend
pnpm test
pnpm test:cov
pnpm test:e2e

# Frontend
cd apps/web
pnpm typecheck

# Mobile
cd apps/mobile
flutter test
```

El backend incluye pruebas unitarias para auth, billing/cuotas, EQ configs, library saves y resolución de conflictos de sync.

---

## Despliegue

### Producción con Docker

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Builds Desktop (Electron)

```bash
cd apps/web
pnpm build
pnpm build:electron     # genera instaladores (.exe, .dmg, .deb)
```

### Builds Mobile

```bash
cd apps/mobile
flutter build apk --release
flutter build appbundle --release
flutter build ios --release
```

---

## Estado del Proyecto

Backlog detallado, sprints y avance por épica: ver **[Scrum.md](./Scrum.md)**.

Áreas en desarrollo / pendientes conocidos:

- App mobile (Flutter) en paridad parcial con la web.
- Historial conversacional del agente IA en la interfaz.
- Cobertura de tests en frontend y mobile.

---

## Contribución

1. Crear rama desde `main`: `git checkout -b feature/PB-XXX-descripcion`
2. Commits siguiendo Conventional Commits
3. Pull Request hacia `main` (CI valida lint + tests)
4. Review, aprobación y merge

### Convenciones de Commits

```
feat(equalizer): agregar EQ por segmentos temporales
fix(auth): corregir refresh de token expirado
docs(readme): actualizar instrucciones de setup
test(ai): añadir tests del parser de respuestas
refactor(sync): simplificar lógica de conflictos
chore(deps): actualizar dependencias
```

---

## Licencia

Propiedad privada — Todos los derechos reservados.
