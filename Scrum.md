# 🎵 MusicFlow — Scrum & Technical Specification

> **Documento maestro del proyecto** — Product Backlog, Roadmap de Sprints, Arquitectura y Modelo de Datos.
> **Versión:** 2.0
> **Fecha:** Abril 2026
> **Rol:** Scrum Master + Full Stack Architect

---

## 📑 Tabla de Contenidos

1. Visión del Producto
2. Objetivos SMART
3. Stakeholders y Roles
4. Stack Tecnológico
5. Arquitectura General
6. Modelo de Datos Completo
7. Épicas del Producto
8. Product Backlog
9. DetalladoRoadmap de Sprints
10. Definition of Ready / Done
11. Ceremonias Scrum
12. Métricas y KPIs
13. Gestión de Riesgos

## 1. Visión del Producto

**MusicFlow** es una plataforma multiplataforma (Desktop + Mobile) de reproducción musical enfocada en la **personalización granular de la ecualización** asistida por un  **agente de inteligencia artificial** .

### Propuesta de Valor Única

> *"El primer reproductor que entiende tu música a nivel de segundo. Ecualiza el coro distinto al puente, cada canción distinto al resto, cada playlist con su propia personalidad — todo manualmente o pidiéndoselo a una IA en lenguaje natural."*

### Diferenciadores Clave

| Característica                                | MusicFlow | Competencia (Spotify, Poweramp, etc.) |
| ---------------------------------------------- | --------- | ------------------------------------- |
| EQ global                                      | ✅        | ✅                                    |
| EQ por playlist                                | ✅        | ❌                                    |
| EQ por canción                                | ✅        | Parcial                               |
| **EQ por segmento temporal**             | ✅        | ❌                                    |
| **Agente IA para configurar EQ**         | ✅        | ❌                                    |
| Modo híbrido (local + cloud)                  | ✅        | Parcial                               |
| **Disponible en Web + Desktop + Mobile** | ✅        | Parcial                               |

### 🌐 Disponibilidad Multiplataforma

MusicFlow se distribuye en **3 formatos** con un código base compartido al máximo:

1. **🌐 Web (PWA)** — Accesible desde cualquier navegador en `app.musicflow.com`. Instalable como PWA. Ideal para prueba rápida y uso ocasional.
2. **🖥️ Desktop (Electron)** — Aplicación nativa para Windows, macOS y Linux con acceso completo al sistema de archivos, widgets, atajos globales y mejor rendimiento.
3. **📱 Mobile (Flutter)** — App nativa para Android e iOS con features específicas de móvil (widgets, Android Auto, CarPlay, background playback optimizado).

> La versión **web y desktop comparten el 95% del código** (React + TypeScript). Solo cambia la capa de acceso al sistema (archivos, DB local, notificaciones) mediante una abstracción.

### Mercado Objetivo

* **Primario:** Audiófilos y entusiastas de la música (18-45 años) que valoran la calidad de audio.
* **Secundario:** Usuarios casuales que quieren una experiencia sonora mejorada sin conocimientos técnicos (uso del agente IA).
* **Terciario:** Productores y DJs que buscan herramientas de personalización rápida.

---

## 2. Objetivos SMART

| #  | Objetivo                                                         | Métrica                                    | Plazo     |
| -- | ---------------------------------------------------------------- | ------------------------------------------- | --------- |
| O1 | Lanzar MVP con EQ multi-nivel funcional en desktop y mobile      | App publicada en stores y descargable       | Sprint 7  |
| O2 | Implementar agente IA con ≥85% de satisfacción de usuario      | Feedback `good`/`total`en `AIRequest` | Sprint 8  |
| O3 | Lograr sincronización híbrida confiable con ≤2% de conflictos | Logs de sync exitosos                       | Sprint 9  |
| O4 | Cubrir ≥80% del código backend con tests automatizados         | Coverage report                             | Sprint 10 |
| O5 | Alcanzar tiempo de carga de biblioteca <3s para 1000 tracks      | Benchmark de performance                    | Sprint 10 |

---

## 3. Stakeholders y Roles

### Equipo Scrum

| Rol                                  | Responsabilidad                                      | Cantidad      |
| ------------------------------------ | ---------------------------------------------------- | ------------- |
| **Product Owner**              | Prioriza backlog, define visión, valida entregables | 1             |
| **Scrum Master**               | Facilita ceremonias, elimina bloqueos                | 1             |
| **Backend Developer**          | NestJS, Prisma, PostgreSQL, Redis, integración IA   | 2             |
| **Frontend Desktop Developer** | Electron + React (admin + cliente)                   | 2             |
| **Mobile Developer**           | Flutter (cliente)                                    | 1-2           |
| **UX/UI Designer**             | Diseño de interfaces, wireframes, prototipos        | 1             |
| **QA Engineer**                | Testing manual y automatizado                        | 1             |
| **DevOps**                     | CI/CD, infraestructura, monitoreo                    | 1 (part-time) |

### Stakeholders Externos

* Usuarios finales (beta testers)
* Inversionistas / sponsors del proyecto
* Proveedores: Anthropic (Claude API), proveedor de cloud (AWS/GCP)

---

## 4. Stack Tecnológico

### 🔵 Backend (NestJS + Prisma) ✅ MIGRADO

```yaml
Framework: NestJS 10.x
Lenguaje: TypeScript 5.x / Node.js 20 LTS
ORM: Prisma 5.x
Base de datos: PostgreSQL 16
Cache / Queue: Redis 7 (con BullMQ para jobs)
Auth: Passport.js + JWT (@nestjs/jwt, @nestjs/passport)
Storage: AWS S3 / MinIO (archivos de audio)
WebSockets: @nestjs/websockets (Socket.IO)
IA: Claude API (Anthropic) vía @anthropic-ai/sdk
Validación: class-validator + class-transformer
API Docs: Swagger (@nestjs/swagger)
Testing: Jest + Supertest
```

### 📦 Estructura Monorepo ✅ IMPLEMENTADO

```yaml
Package Manager: pnpm 9.x
Build Orchestration: Turborepo 2.x
Workspaces:
  - apps/backend      # @musicflow/backend (NestJS)
  - apps/web          # @musicflow/web (React + Electron)
  - apps/mobile       # Flutter (externo a pnpm)
  - packages/shared   # @musicflow/shared (tipos, utils)
  - packages/ui       # @musicflow/ui (shadcn/ui)
  - packages/config   # @musicflow/config (TSConfig, ESLint)
```

### 🟢 Frontend Web + Desktop (React + Electron)

> **Estrategia dual:** el mismo código React se despliega como **aplicación web** (navegador) y se empaqueta con **Electron** para Windows, macOS y Linux. Se usa una capa de abstracción para acceder a capacidades específicas de cada entorno.

```yaml
# Código compartido (web + desktop)
Framework: React 19 + TypeScript 5
Bundler: Vite
Estado: Zustand
Routing: React Router 6
UI: TailwindCSS + shadcn/ui
Cliente HTTP: TanStack Query + Axios
Audio: Web Audio API (ecualización en tiempo real)
Testing: Vitest + React Testing Library + Playwright (E2E)

# Específico Desktop
Shell: Electron 30+
DB local: SQLite (vía better-sqlite3) con IPC
File System: Node.js fs (acceso completo)
Auto-updater: electron-updater
Build: electron-builder

# Específico Web
PWA: Workbox (service workers para offline parcial)
DB local: IndexedDB con Dexie.js
File System: File System Access API (donde disponible)
Deployment: Nginx + CDN (Cloudflare)
Hosting sugerido: Vercel, Netlify o VPS propio
```

### 🔀 Estrategia Multi-Target

```typescript
// src/shared/platform/detector.ts
export const platform = {
  isElectron: typeof window !== 'undefined' && !!window.electronAPI,
  isWeb: typeof window !== 'undefined' && !window.electronAPI,
  isPWAInstalled: window.matchMedia('(display-mode: standalone)').matches,
};

// src/shared/services/localDB.ts - Abstracción
export interface LocalDB {
  getTrack(id: string): Promise<Track | null>;
  saveTrack(track: Track): Promise<void>;
  // ...
}

export const localDB: LocalDB = platform.isElectron
  ? new ElectronSQLiteDB()
  : new WebIndexedDB();
```

### 🟣 Frontend Mobile (Flutter)

```yaml
Framework: Flutter 3.41 / Dart 3.11.1
Estado: Riverpod 2.x
Audio: just_audio + audio_service
EQ: plugin nativo custom (Android AudioEffects / iOS AVAudioUnitEQ)
HTTP: Dio
DB local: Drift (SQLite)
Almacenamiento clave-valor: Hive
Testing: flutter_test + integration_test
```

### 🛠️ DevOps e Infraestructura

```yaml
Contenedores: Docker + Docker Compose
Orquestación: Kubernetes (producción) o Docker Swarm (staging)
CI/CD: GitHub Actions
Monitoreo: Sentry (errores) + Grafana + Prometheus (métricas)
Logs: ELK Stack o Loki
Reverse Proxy: Nginx
Dominio / CDN: Cloudflare
```

---

## 5. Arquitectura General

### 5.1 Diagrama de Componentes ✅ ACTUALIZADO

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CAPA CLIENTE                                 │
│                                                                         │
│  ┌─────────────────────────────────────────┐  ┌───────────────┐         │
│  │     REACT + TYPESCRIPT (mismo código)   │  │    Flutter    │         │
│  │                                         │  │    CLIENTE    │         │
│  │  ┌───────────────┐  ┌────────────────┐  │  │   (Mobile)    │         │
│  │  │   WEB (PWA)   │  │   DESKTOP      │  │  │               │         │
│  │  │   navegador   │  │  (Electron)    │  │  │ Android / iOS │         │
│  │  │               │  │                │  │  │               │         │
│  │  │ Admin+Cliente │  │ Admin+Cliente  │  │  │ Solo Cliente  │         │
│  │  │               │  │                │  │  │               │         │
│  │  │  IndexedDB    │  │  SQLite nativo │  │  │  Drift (SQL)  │         │
│  │  └───────────────┘  └────────────────┘  │  └───────┬───────┘         │
│  │     Deployment:        Deployment:      │          │                 │
│  │  Vercel/Nginx+CDN   electron-builder    │          │                 │
│  │                     (.exe, .dmg, .deb)  │          │                 │
│  └──────────────────┬──────────────────────┘          │                 │
│                     │                                 │                 │
└─────────────────────┼─────────────────────────────────┼─────────────────┘
                      │     HTTPS / JWT                 │
                      └────────────────┬────────────────┘
                                       │
┌──────────────────────────────────────▼─────────────────────────┐
│                        CAPA BACKEND                            │
│                                                                │
│  ┌────────────────────────────────────────────────────────────┐│
│  │              NestJS REST API (Node.js + Nginx)             ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   ││
│  │  │   Auth   │ │ Library  │ │    EQ    │ │  AI Agent    │   ││
│  │  │  Module  │ │  Module  │ │  Module  │ │   Module     │   ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   ││
│  │  │   Sync   │ │Analytics │ │  Admin   │ │ Notifications│   ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   ││
│  └────────────────────────────────────────────────────────────┘│
│        │              │                │                │      │
│        ▼              ▼                ▼                ▼      │
│  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌───────────────┐  │
│  │PostgreSQL│ │  Redis Cache │ │  BullMQ  │ │   S3/MinIO    │  │
│  │ + Prisma │ │  + BullMQ    │ │  Workers │ │(archivos audio│  │
│  └──────────┘ └──────────────┘ └────┬─────┘ └───────────────┘  │
│                                     │                          │
│                                     ▼                          │
│                              ┌────────────┐                    │
│                              │ Claude API │                    │
│                              │ (Anthropic)│                    │
│                              └────────────┘                    │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 Flujo de Datos Clave — Agente IA ✅ ACTUALIZADO

```
Usuario: "Quiero más bajos en el coro del minuto 1:30 al 2:10"
   │
   ▼
Cliente (React/Flutter) → POST /api/ai/eq-suggest
   │ {prompt, trackId, currentEq, context}
   ▼
NestJS Controller (AIAgentController)
   │
   ├─► AIAgentService construye prompt enriquecido
   │   (contexto de canción, género, EQ actual)
   │
   ▼
Claude API (@anthropic-ai/sdk)
   │ Respuesta JSON estructurada:
   │ { "bands": [-2, 0, 3, 5, 4, 2, 0, 0, 0, 0], "segment": {"start": 90000, "end": 130000}, "explanation": "..." }
   ▼
Parser + Validador (class-validator DTO)
   │
   ├─► Prisma: Guarda AIRequest en DB
   ├─► Prisma: Crea/actualiza EQSegment
   │
   ▼
Respuesta al cliente con preview aplicable
   │
   ▼
Usuario acepta/rechaza → feedback loop
```

### 5.3 Estrategia de Sincronización Híbrida

1. **Los archivos de audio** pueden vivir:
   * Solo locales (`source=local`)
   * Solo en servidor (`source=synced`)
   * En ambos lados (`source=both`)
2. **La metadata y configuraciones EQ** SIEMPRE viven en el servidor + caché local (SQLite/Drift).
3. **Sync delta** : cada entidad tiene `updated_at`. El cliente pregunta `GET /api/sync?since=<timestamp>` y recibe solo los cambios.
4. **Resolución de conflictos** : Last-Write-Wins por `updated_at`. En caso de edits críticos, se marca `conflict=true` para revisión manual.
5. **Modo offline** : todas las operaciones se encolan localmente en una tabla `pending_sync` y se envían al reconectar.

---

## 6. Modelo de Datos Completo

### 6.1 Diagrama Entidad-Relación

```mermaid
erDiagram
    User ||--o{ Track : owns
    User ||--o{ Playlist : owns
    User ||--o{ EQPreset : creates
    User ||--o{ EQConfig : owns
    User ||--o{ EQSegment : creates
    User ||--o{ AIRequest : makes
    User ||--o{ PlayHistory : generates
    User ||--|| UserPreferences : has
    User ||--o{ Device : registers

    Playlist ||--o{ PlaylistTrack : contains
    Track ||--o{ PlaylistTrack : in
    Track ||--o{ EQSegment : has
    Track ||--o{ PlayHistory : plays

    EQPreset ||--o{ EQConfig : uses
    EQConfig ||--o{ EQSegment : applied_in
    EQConfig ||--o{ PlayHistory : was_used

    AIRequest }o--|| Track : references

    User {
        UUID id PK
        string username
        string email
        string role
        boolean is_active
        datetime created_at
    }

    Track {
        UUID id PK
        UUID user_id FK
        string title
        string artist
        string album
        int duration_ms
        string file_path_local
        string file_url_remote
        string file_hash
        string source
        string sync_status
        datetime updated_at
    }

    Playlist {
        UUID id PK
        UUID user_id FK
        string name
        string description
        boolean is_public
        datetime updated_at
    }

    EQPreset {
        UUID id PK
        UUID user_id FK
        string name
        boolean is_global
        json bands
        int bass_boost
        int virtualizer
        int loudness
        string reverb_preset
        int reverb_amount
    }

    EQConfig {
        UUID id PK
        UUID user_id FK
        string scope_type
        UUID scope_id
        UUID preset_id FK
        json bands
        boolean is_active
    }

    EQSegment {
        UUID id PK
        UUID track_id FK
        UUID user_id FK
        UUID eq_config_id FK
        string label
        int start_ms
        int end_ms
        int transition_ms
        string created_by
    }

    AIRequest {
        UUID id PK
        UUID user_id FK
        UUID track_id FK
        text prompt
        json response
        string applied_to
        boolean was_accepted
        string feedback
    }
```

### 6.2 Definición Detallada de Modelos (Prisma) ✅ MIGRADO

> **Archivo:** `apps/backend/prisma/schema.prisma`

#### 📘 User & Device

```prisma
// Enums
enum Role {
  ADMIN
  CLIENT
}

enum DeviceType {
  DESKTOP_WIN
  DESKTOP_MAC
  DESKTOP_LINUX
  MOBILE_ANDROID
  MOBILE_IOS
}

// User Model
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  username      String    @unique
  passwordHash  String    @map("password_hash")
  role          Role      @default(CLIENT)
  avatar        String?
  isPremium     Boolean   @default(false) @map("is_premium")
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  devices       Device[]
  tracks        Track[]
  playlists     Playlist[]
  eqPresets     EQPreset[]
  eqConfigs     EQConfig[]
  eqSegments    EQSegment[]
  aiRequests    AIRequest[]
  playHistory   PlayHistory[]
  preferences   UserPreferences?
  stats         ListeningStats[]
  syncLogs      SyncLog[]
  conflicts     ConflictLog[]

  @@index([email, role])
  @@map("users")
}

// Device Model
model Device {
  id          String      @id @default(uuid())
  userId      String      @map("user_id")
  deviceType  DeviceType  @map("device_type")
  deviceName  String      @map("device_name")
  lastSyncAt  DateTime?   @map("last_sync_at")
  fcmToken    String?     @map("fcm_token")
  createdAt   DateTime    @default(now()) @map("created_at")

  // Relations
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  syncLogs    SyncLog[]

  @@map("devices")
}
```

#### 📘 Track & Playlist

```prisma
enum TrackSource {
  LOCAL
  SYNCED
  BOTH
}

enum SyncStatus {
  PENDING
  SYNCED
  FAILED
}

model Track {
  id              String      @id @default(uuid())
  userId          String      @map("user_id")

  // Metadata
  title           String
  artist          String
  album           String
  albumArtist     String?     @map("album_artist")
  genre           String?
  year            Int?
  trackNumber     Int?        @map("track_number")
  discNumber      Int?        @map("disc_number")
  composer        String?
  comment         String?
  durationMs      Int         @map("duration_ms")

  // Files
  filePathLocal   String?     @map("file_path_local")
  fileUrlRemote   String?     @map("file_url_remote")
  fileHash        String      @map("file_hash")
  fileSizeBytes   BigInt?     @map("file_size_bytes")
  codec           String?
  bitrate         Int?
  sampleRate      Int?        @map("sample_rate")
  coverArt        String?     @map("cover_art")

  // Hybrid sync
  source          TrackSource @default(LOCAL)
  syncStatus      SyncStatus  @default(PENDING) @map("sync_status")

  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  // Relations
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  playlists       PlaylistTrack[]
  segments        EQSegment[]
  playHistory     PlayHistory[]
  aiRequests      AIRequest[]

  @@unique([userId, fileHash])
  @@index([artist])
  @@index([album])
  @@index([genre])
  @@index([userId, fileHash])
  @@index([userId, syncStatus])
  @@index([userId, updatedAt(sort: Desc)])
  @@map("tracks")
}

model Playlist {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  name        String
  description String?
  coverArt    String?   @map("cover_art")
  isPublic    Boolean   @default(false) @map("is_public")
  shareToken  String?   @unique @map("share_token")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tracks      PlaylistTrack[]

  @@index([userId, updatedAt(sort: Desc)])
  @@map("playlists")
}

model PlaylistTrack {
  id          String    @id @default(uuid())
  playlistId  String    @map("playlist_id")
  trackId     String    @map("track_id")
  position    Int
  addedAt     DateTime  @default(now()) @map("added_at")

  // Relations
  playlist    Playlist  @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  track       Track     @relation(fields: [trackId], references: [id], onDelete: Cascade)

  @@unique([playlistId, trackId])
  @@index([position])
  @@map("playlist_tracks")
}
```

#### 📘 EQ Models (Preset, Config, Segment)

```prisma
enum ReverbPreset {
  NONE
  SMALL_ROOM
  MEDIUM_ROOM
  LARGE_ROOM
  SMALL_HALL
  LARGE_HALL
  CATHEDRAL
  PLATE
  SPRING
}

enum ScopeType {
  GLOBAL
  PLAYLIST
  TRACK
  SEGMENT
}

enum CreatedBy {
  MANUAL
  AI
}

// ⭐ EQ Preset - Plantillas de ecualización
model EQPreset {
  id            String        @id @default(uuid())
  userId        String?       @map("user_id")
  name          String
  isGlobal      Boolean       @default(false) @map("is_global")

  // 10 bands: 31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1k, 2k, 4k, 8k, 16k
  // Values: -15 to +15 dB
  bands         Json          @default("[0,0,0,0,0,0,0,0,0,0]")

  bassBoost     Int           @default(0) @map("bass_boost")
  virtualizer   Int           @default(0)
  loudness      Int           @default(0)
  reverbPreset  ReverbPreset  @default(NONE) @map("reverb_preset")
  reverbAmount  Int           @default(0) @map("reverb_amount")

  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  // Relations
  user          User?         @relation(fields: [userId], references: [id], onDelete: Cascade)
  configs       EQConfig[]

  @@index([userId, isGlobal])
  @@map("eq_presets")
}

// ⭐ EQ Config - Configuración aplicada a un scope específico
model EQConfig {
  id            String        @id @default(uuid())
  userId        String        @map("user_id")
  scopeType     ScopeType     @map("scope_type")
  scopeId       String?       @map("scope_id")

  // Option 1: Use existing preset
  presetId      String?       @map("preset_id")

  // Option 2: Custom config (if preset is null)
  bands         Json          @default("[0,0,0,0,0,0,0,0,0,0]")
  bassBoost     Int           @default(0) @map("bass_boost")
  virtualizer   Int           @default(0)
  loudness      Int           @default(0)
  reverbPreset  ReverbPreset  @default(NONE) @map("reverb_preset")
  reverbAmount  Int           @default(0) @map("reverb_amount")

  isActive      Boolean       @default(true) @map("is_active")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  // Relations
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  preset        EQPreset?     @relation(fields: [presetId], references: [id], onDelete: SetNull)
  segment       EQSegment?
  playHistory   PlayHistory[]

  @@unique([userId, scopeType, scopeId])
  @@index([userId, scopeType, scopeId])
  @@index([userId, updatedAt(sort: Desc)])
  @@map("eq_configs")
}

// ⭐⭐ EQ Segment - FEATURE ESTRELLA: EQ por rango de tiempo
model EQSegment {
  id            String      @id @default(uuid())
  trackId       String      @map("track_id")
  userId        String      @map("user_id")
  eqConfigId    String      @unique @map("eq_config_id")

  label         String?     // "Coro", "Puente", "Intro", etc.
  startMs       Int         @map("start_ms")
  endMs         Int         @map("end_ms")
  transitionMs  Int         @default(500) @map("transition_ms")

  createdBy     CreatedBy   @default(MANUAL) @map("created_by")
  aiRequestId   String?     @map("ai_request_id")

  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  // Relations
  track         Track       @relation(fields: [trackId], references: [id], onDelete: Cascade)
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  eqConfig      EQConfig    @relation(fields: [eqConfigId], references: [id], onDelete: Cascade)
  aiRequest     AIRequest?  @relation(fields: [aiRequestId], references: [id], onDelete: SetNull)

  @@index([trackId, startMs, endMs])
  @@index([userId, updatedAt(sort: Desc)])
  @@map("eq_segments")
}
```

#### 📘 AI Agent

```prisma
enum AppliedTo {
  GLOBAL
  PLAYLIST
  TRACK
  SEGMENT
}

enum Feedback {
  GOOD
  BAD
  NEUTRAL
}

// ⭐⭐ AI Request - Registro de peticiones al agente IA
model AIRequest {
  id              String      @id @default(uuid())
  userId          String      @map("user_id")
  trackId         String?     @map("track_id")

  prompt          String
  context         Json        @default("{}")  // genre, current EQ, mood, etc.
  response        Json        @default("{}")  // EQ generated by AI
  explanation     String?

  appliedTo       AppliedTo?  @map("applied_to")
  appliedId       String?     @map("applied_id")

  wasAccepted     Boolean     @default(false) @map("was_accepted")
  feedback        Feedback?
  feedbackComment String?     @map("feedback_comment")

  tokensInput     Int         @default(0) @map("tokens_input")
  tokensOutput    Int         @default(0) @map("tokens_output")
  costUsd         Decimal     @default(0) @map("cost_usd") @db.Decimal(10, 6)
  responseTimeMs  Int         @default(0) @map("response_time_ms")
  modelUsed       String      @default("claude-sonnet-4-20250514") @map("model_used")

  createdAt       DateTime    @default(now()) @map("created_at")

  // Relations
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  track           Track?      @relation(fields: [trackId], references: [id], onDelete: SetNull)
  segments        EQSegment[]

  @@index([userId, createdAt(sort: Desc)])
  @@index([feedback, createdAt(sort: Desc)])
  @@map("ai_requests")
}
```

#### 📘 Analytics

```prisma
enum PlayDevice {
  DESKTOP
  MOBILE
  AUTO
}

enum StatsPeriod {
  DAY
  WEEK
  MONTH
  ALL_TIME
}

model PlayHistory {
  id                String      @id @default(uuid())
  userId            String      @map("user_id")
  trackId           String      @map("track_id")

  playedAt          DateTime    @map("played_at")
  durationListenedMs Int        @map("duration_listened_ms")
  completed         Boolean     @default(false)
  skipped           Boolean     @default(false)

  eqConfigUsedId    String?     @map("eq_config_used_id")
  device            PlayDevice

  // Relations
  user              User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  track             Track       @relation(fields: [trackId], references: [id], onDelete: Cascade)
  eqConfigUsed      EQConfig?   @relation(fields: [eqConfigUsedId], references: [id], onDelete: SetNull)

  @@index([userId, playedAt(sort: Desc)])
  @@index([trackId, playedAt(sort: Desc)])
  @@map("play_history")
}

// Métricas agregadas pre-calculadas (BullMQ job)
model ListeningStats {
  id            String      @id @default(uuid())
  userId        String      @map("user_id")
  period        StatsPeriod
  periodStart   DateTime    @map("period_start") @db.Date

  totalPlays    Int         @default(0) @map("total_plays")
  totalTimeMs   BigInt      @default(0) @map("total_time_ms")
  uniqueTracks  Int         @default(0) @map("unique_tracks")
  uniqueArtists Int         @default(0) @map("unique_artists")

  topTracks     Json        @default("[]") @map("top_tracks")
  topArtists    Json        @default("[]") @map("top_artists")
  topAlbums     Json        @default("[]") @map("top_albums")
  topEqPresets  Json        @default("[]") @map("top_eq_presets")

  computedAt    DateTime    @updatedAt @map("computed_at")

  // Relations
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, period, periodStart])
  @@index([userId, period, periodStart(sort: Desc)])
  @@map("listening_stats")
}
```

#### 📘 Preferences

```prisma
enum PlayerLayout {
  COMPACT
  STANDARD
  EXPANDED
  MINIMAL
}

enum LibraryLayout {
  LIST
  GRID
  CARD
}

model UserPreferences {
  userId                  String        @id @map("user_id")

  // Visual theme
  theme                   String        @default("dark_default")
  dynamicThemeEnabled     Boolean       @default(false) @map("dynamic_theme_enabled")
  dynamicThemeIntensity   Int           @default(50) @map("dynamic_theme_intensity")

  // Layouts
  playerLayout            PlayerLayout  @default(STANDARD) @map("player_layout")
  libraryLayout           LibraryLayout @default(LIST) @map("library_layout")
  showAlbumArt            Boolean       @default(true) @map("show_album_art")
  showVisualizer          Boolean       @default(false) @map("show_visualizer")
  visualizerType          String        @default("bars") @map("visualizer_type")

  // Playback
  crossfadeEnabled        Boolean       @default(false) @map("crossfade_enabled")
  crossfadeDurationMs     Int           @default(3000) @map("crossfade_duration_ms")
  gaplessEnabled          Boolean       @default(true) @map("gapless_enabled")
  replayGain              Boolean       @default(false) @map("replay_gain")
  skipSilence             Boolean       @default(false) @map("skip_silence")

  // Sleep timer
  sleepTimerDefaultMin    Int?          @map("sleep_timer_default_min")
  sleepTimerFadeOut       Boolean       @default(true) @map("sleep_timer_fade_out")

  // Scrobbling
  lastfmUsername          String?       @map("lastfm_username")
  lastfmSessionKey        String?       @map("lastfm_session_key")
  scrobbleEnabled         Boolean       @default(false) @map("scrobble_enabled")
  scrobbleThreshold       Int           @default(50) @map("scrobble_threshold")

  // Lyrics
  lyricsFontSize          Int           @default(16) @map("lyrics_font_size")
  lyricsAutoScroll        Boolean       @default(true) @map("lyrics_auto_scroll")

  updatedAt               DateTime      @updatedAt @map("updated_at")

  // Relations
  user                    User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}
```

#### 📘 Sync

```prisma
model SyncLog {
  id                  String    @id @default(uuid())
  userId              String    @map("user_id")
  deviceId            String    @map("device_id")

  startedAt           DateTime  @default(now()) @map("started_at")
  finishedAt          DateTime? @map("finished_at")

  entitiesUploaded    Int       @default(0) @map("entities_uploaded")
  entitiesDownloaded  Int       @default(0) @map("entities_downloaded")
  conflictsDetected   Int       @default(0) @map("conflicts_detected")

  success             Boolean   @default(false)
  errorMessage        String?   @map("error_message")

  // Relations
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  device              Device    @relation(fields: [deviceId], references: [id], onDelete: Cascade)

  @@map("sync_logs")
}

model ConflictLog {
  id            String    @id @default(uuid())
  userId        String    @map("user_id")

  entityType    String    @map("entity_type")  // 'EQConfig', 'Playlist', etc.
  entityId      String    @map("entity_id")

  localVersion  Json      @map("local_version")
  serverVersion Json      @map("server_version")

  resolved      Boolean   @default(false)
  resolution    String?   // 'local_wins', 'server_wins', 'merge'

  createdAt     DateTime  @default(now()) @map("created_at")
  resolvedAt    DateTime? @map("resolved_at")

  // Relations
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("conflict_logs")
}
```

### 6.3 Lógica de Aplicación EQ (Prioridad Jerárquica) ✅ MIGRADO

```typescript
// apps/backend/src/modules/equalizer/services/eq-resolver.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EQConfig, ScopeType } from '@prisma/client';

type EQSource = 'segment' | 'track' | 'playlist' | 'global' | 'flat';

@Injectable()
export class EQResolverService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resuelve qué configuración EQ aplicar en el momento actual.
   * Prioridad: Segmento > Track > Playlist activa > Global > Flat.
   */
  async resolveEQForPlayback(
    userId: string,
    trackId: string,
    currentMs: number,
    activePlaylistId?: string,
  ): Promise<{ config: EQConfig | null; source: EQSource }> {
    // 1. Buscar segmento activo en el momento actual
    const segment = await this.prisma.eQSegment.findFirst({
      where: {
        trackId,
        userId,
        startMs: { lte: currentMs },
        endMs: { gt: currentMs },
      },
      include: { eqConfig: true },
    });
    if (segment) {
      return { config: segment.eqConfig, source: 'segment' };
    }

    // 2. EQ específico del track
    const trackEq = await this.prisma.eQConfig.findFirst({
      where: {
        userId,
        scopeType: ScopeType.TRACK,
        scopeId: trackId,
        isActive: true,
      },
    });
    if (trackEq) {
      return { config: trackEq, source: 'track' };
    }

    // 3. EQ de la playlist activa
    if (activePlaylistId) {
      const playlistEq = await this.prisma.eQConfig.findFirst({
        where: {
          userId,
          scopeType: ScopeType.PLAYLIST,
          scopeId: activePlaylistId,
          isActive: true,
        },
      });
      if (playlistEq) {
        return { config: playlistEq, source: 'playlist' };
      }
    }

    // 4. EQ global
    const globalEq = await this.prisma.eQConfig.findFirst({
      where: {
        userId,
        scopeType: ScopeType.GLOBAL,
        isActive: true,
      },
    });
    if (globalEq) {
      return { config: globalEq, source: 'global' };
    }

    // 5. Fallback: Flat
    return { config: null, source: 'flat' };
  }
}
```

---

## 7. Épicas del Producto

### 🎯 Matriz de Cobertura por Plataforma

| Feature                           | Web (PWA)                              | Desktop (Electron)    | Mobile (Flutter)  |
| --------------------------------- | -------------------------------------- | --------------------- | ----------------- |
| Auth y gestión de cuenta         | ✅                                     | ✅                    | ✅                |
| Biblioteca desde servidor         | ✅                                     | ✅                    | ✅                |
| Escaneo de archivos locales       | ⚠️ limitado (File System Access API) | ✅ completo           | ✅ completo       |
| Upload de tracks al servidor      | ✅                                     | ✅                    | ✅                |
| Reproducción de audio            | ✅                                     | ✅                    | ✅                |
| **Ecualizador 10 bandas**⭐ | ✅                                     | ✅                    | ✅                |
| **EQ multi-nivel**⭐        | ✅                                     | ✅                    | ✅                |
| **EQ por segmentos**⭐⭐    | ✅                                     | ✅                    | ✅                |
| **Agente IA**⭐⭐           | ✅                                     | ✅                    | ✅                |
| Playlists y búsqueda             | ✅                                     | ✅                    | ✅                |
| Sincronización híbrida          | ✅                                     | ✅                    | ✅                |
| SQLite local offline              | ❌ (usa IndexedDB)                     | ✅                    | ✅                |
| Background playback               | ⚠️ (si tab activa)                   | ✅                    | ✅                |
| Notificaciones del sistema        | ⚠️ (del navegador)                   | ✅ nativas            | ✅ nativas        |
| Panel de administración          | ✅                                     | ✅                    | ❌ (solo cliente) |
| Widgets de escritorio/inicio      | ❌                                     | ✅                    | ✅                |
| Atajos globales de teclado        | ❌                                     | ✅                    | ❌                |
| Android Auto / CarPlay            | ❌                                     | ❌                    | ✅                |
| Instalación como app             | ⚠️ PWA                               | ✅ instalador         | ✅ stores         |
| Auto-actualización               | ✅ (instantánea)                      | ✅ (electron-updater) | ✅ (stores)       |

**Leyenda:** ✅ completo · ⚠️ limitado · ❌ no disponible

---

## 7.1 Listado de Épicas

| #   | Épica                                      | Story Points  | Sprint(s)            |
| --- | ------------------------------------------- | ------------- | -------------------- |
| E01 | Infraestructura y Arquitectura Base         | 32            | 1                    |
| E02 | Autenticación y Gestión de Usuarios       | 34            | 1-2                  |
| E03 | Gestión de Biblioteca Musical              | 45            | 2-3                  |
| E04 | Reproductor Core Multiplataforma            | 50            | 3-4                  |
| E05 | Sistema de Ecualización Multi-Nivel ⭐     | 55            | 4-5                  |
| E06 | EQ por Segmentos Temporales ⭐⭐            | 42            | 5-6                  |
| E07 | Agente IA de Ecualización ⭐⭐             | 50            | 6-7                  |
| E08 | Playlists, Búsqueda y Organización        | 34            | 7                    |
| E09 | Sincronización Híbrida                    | 45            | 7-8                  |
| E10 | Personalización Visual                     | 34            | 8                    |
| E11 | Features Complementarias                    | 42            | 9                    |
| E12 | Panel de Administración                    | 34            | 9                    |
| E13 | Mobile App Flutter                          | 55            | 8-10                 |
| E14 | **Features Web Específicas (PWA)**🆕 | 21            | 8-9                  |
| E15 | Testing, QA y Despliegue                    | 42            | 10                   |
|     | **TOTAL**                             | **615** | **10 sprints** |

---

## 8. Product Backlog Detallado

### 🏗️ ÉPICA E01 — Infraestructura y Arquitectura Base (28 SP)

#### PB-001: Setup del Monorepo (5 SP) - COMPLETADO

**Como** desarrollador, **quiero** un monorepo con los tres proyectos (`backend`, `frontend`, `mobile`) **para** mantener versiones coordinadas.

**Criterios de aceptación:**

* [x] Estructura: `/backend`, `/frontend` (React para web + desktop), `/mobile` (Flutter), `/docs`, `/infra`
* [x] README principal con instrucciones de setup para cada target
* [x] `.gitignore`, `.editorconfig`, convenciones de commits (Conventional Commits)
* [ ] Husky + lint-staged configurados
* [x] Variables de entorno separadas por target (`.env.web`, `.env.electron`, `.env.mobile`)

#### PB-002: Backend NestJS inicial (8 SP) - COMPLETADO ✅ MIGRADO

**Como** desarrollador, **quiero** un proyecto NestJS con Prisma configurado **para** empezar a construir la API.

**Criterios de aceptación:**

* [x] NestJS 10.x + Prisma 5.x + PostgreSQL + Redis configurados
* [x] Estructura modular: `src/modules/auth`, `src/modules/library`, `src/modules/equalizer`, `src/modules/ai-agent`, `src/modules/analytics`, `src/modules/sync`, `src/modules/admin`
* [x] Configuración con `@nestjs/config` por ambiente
* [x] Variables de entorno con `.env` y `ConfigService`
* [x] CORS configurado en `main.ts`
* [x] Swagger/OpenAPI con `@nestjs/swagger`

#### PB-003: Frontend React inicial (web + desktop) (8 SP) - COMPLETADO

* [x] Proyecto React 19 + TypeScript + Vite
* [x] TailwindCSS + shadcn/ui
* [x] Rutas base: `/login`, `/app/*` (cliente), `/admin/*` (admin)
* [x] Zustand + TanStack Query configurados
* [x] **Capa de abstracción de plataforma** (`platform/detector.ts`)
* [x] **Wrapper Electron** con `electron-builder` para Windows/Mac/Linux
* [x] **Configuración PWA** con Workbox (manifest, service worker básico)
* [x] Scripts de build separados: `build:web`, `build:electron`, `dev:web`, `dev:electron`
* [x] Preload script de Electron con API segura (`contextBridge`)

#### PB-004: Frontend Flutter inicial (3 SP) - COMPLETADO

* [x] Flutter 3.22 + Dart 3.4
* [x] Riverpod + Dio + Drift
* [x] Rutas base con `go_router`
* [ ] Build Android e iOS

#### PB-005: Docker Compose y CI/CD (5 SP) - EN PROGRESO

* [x] `docker-compose.yml` con NestJS, PostgreSQL, Redis, MinIO ✅ MIGRADO
* [ ] GitHub Actions: lint + test en PRs
* [ ] Build automático de imágenes Docker

#### PB-006: Documentación inicial (2 SP) - EN PROGRESO

* [ ] `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`
* [ ] Diagramas de arquitectura en `/docs`
* [x] Guía de onboarding (README.md completo)

---

### 🔐 ÉPICA E02 — Autenticación y Gestión de Usuarios (34 SP)

#### PB-007: Modelo User custom con roles (5 SP) - COMPLETADO

* [x] Implementar `User` con UUID, `role`, `is_premium`
* [ ] Migración inicial
* [x] Admin de Django personalizado

#### PB-008: Registro de usuarios (5 SP)

* Endpoint `POST /api/auth/register`
* Validación de email único, password fuerte
* Email de verificación (Celery task)

#### PB-009: Login con JWT (5 SP)

* Endpoints `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`
* JWT con refresh token rotativo
* Almacenamiento seguro en cliente (httpOnly cookie o keychain)

#### PB-010: Recuperación de contraseña (5 SP)

* Forgot password con token temporal (15 min)
* Reset password endpoint
* Email con link de reseteo

#### PB-011: Perfil de usuario (5 SP)

* `GET/PATCH /api/users/me`
* Upload de avatar (S3/MinIO)
* Cambio de password

#### PB-012: Gestión de dispositivos (4 SP)

* Registro de `Device` al hacer login
* Listado de dispositivos activos
* Revocar sesión en dispositivo específico

#### PB-013: UI de autenticación (Desktop + Mobile) (5 SP)

* Pantallas de login/registro/forgot
* Validación de formularios
* Manejo de errores visible

---

### 📚 ÉPICA E03 — Gestión de Biblioteca Musical (42 SP)

#### PB-014: Modelo Track completo (5 SP) - COMPLETADO

* [x] Campos completos (metadata + archivos + híbrido)
* [x] Validaciones
* [x] Admin

#### PB-015: Upload de tracks desde desktop (8 SP)

* Drag & drop de archivos de audio
* Extracción de metadata con `mutagen`
* Cálculo de `file_hash` para evitar duplicados
* Subida a S3/MinIO (backend) con progreso
* Feedback visual de progreso

#### PB-016: Escaneo local en desktop (8 SP)

* Electron accede al sistema de archivos
* Recorre carpetas configuradas
* Extrae metadata con `music-metadata`
* Guarda Tracks con `source='local'`

#### PB-017: Escaneo local en mobile (8 SP)

* Flutter con permisos de almacenamiento
* Scan de audio files con `on_audio_query`
* Almacena en Drift (local) y marca para sync

#### PB-018: Extracción de portadas (3 SP)

* Extraer `cover_art` de ID3 tags
* Fallback a placeholder

#### PB-019: Listado de biblioteca (5 SP)

* `GET /api/tracks?search=&artist=&album=&page=`
* Paginación, filtros, orden
* Respuesta optimizada con `only()`

#### PB-020: Vistas de biblioteca (5 SP)

* Tabs: Songs, Albums, Artists
* Grid de álbumes, avatares de artistas
* Pull-to-refresh (mobile)

---

### 🎵 ÉPICA E04 — Reproductor Core Multiplataforma (50 SP)

#### PB-021: Playback engine Desktop (Web Audio API) (13 SP)

* Load, play, pause, seek, stop
* Cola de reproducción con next/prev
* Eventos (onEnded, onTimeUpdate)
* Abstracción `PlayerEngine` para swap local/remote

#### PB-022: Playback engine Mobile (Flutter) (13 SP)

* `just_audio` + `audio_service`
* Background playback
* Notificación persistente con controles
* Integración con controles de hardware (auriculares, etc.)

#### PB-023: Mini reproductor (5 SP)

* Visible en todas las pantallas
* Controles básicos + progreso
* Tap para expandir

#### PB-024: Cola de reproducción (5 SP)

* Modal con lista de canciones en cola
* Reordenar (drag & drop)
* Eliminar tracks de la cola
* Indicador de canción actual

#### PB-025: Reproductor expandido (8 SP)

* Pantalla de "Now Playing"
* Album art grande
* Controles completos + shuffle + repeat
* Acceso rápido a EQ y agente IA

#### PB-026: Persistencia de estado del player (3 SP)

* Al cerrar/abrir la app, recordar última canción y posición
* Guardar cola actual

#### PB-027: Streaming de tracks remotos (3 SP)

* Cuando `source='synced'`, stream desde S3 con URL firmada
* Manejo de buffering

---

### 🎛️ ÉPICA E05 — Sistema de Ecualización Multi-Nivel ⭐ (55 SP)

#### PB-028: Modelo EQPreset + presets del sistema (5 SP) - EN PROGRESO

* [x] Modelo EQPreset creado con todos los campos
* [ ] Crear los 10 presets globales (Flat, Rock, Jazz, Pop, Classical, Electronic, Hip-Hop, Metal, Vocal Boost, Bass Heavy)
* [ ] Fixture / data migration

#### PB-029: Modelo EQConfig con scope_type (8 SP) - EN PROGRESO

* [x] Modelo EQConfig creado con scope_type
* [ ] Migración + validaciones
* [ ] Manager custom con método `resolve_for()`

#### PB-030: Ecualizador en Desktop (Web Audio API) (13 SP)

* `BiquadFilterNode` x 10 bandas (31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1k, 2k, 4k, 8k, 16k)
* Aplicación en tiempo real
* Bass boost, virtualizer, loudness, reverb (ConvolverNode)
* UI con sliders verticales

#### PB-031: Ecualizador en Mobile (Flutter) (13 SP)

* Plugin nativo: Android `Equalizer` + iOS `AVAudioUnitEQ`
* Bridge con el player
* UI responsive

#### PB-032: CRUD de EQConfig por scope (5 SP)

* `POST/PATCH/DELETE /api/eq-configs`
* `GET /api/eq-configs/resolve?track_id=&playlist_id=`
* Validación de unicidad por scope

#### PB-033: Gestión de presets personalizados (5 SP)

* Guardar configuración actual como preset
* Listar, editar, eliminar presets custom
* Aplicar preset con un tap

#### PB-034: UI de selección de presets (3 SP)

* Lista horizontal scrollable
* Indicador visual de preset activo
* Preview antes de aplicar

#### PB-035: Curva de frecuencia visual (3 SP)

* Dibujo SVG de la respuesta del EQ
* Animación al cambiar bandas

---

### ⏱️ ÉPICA E06 — EQ por Segmentos Temporales ⭐⭐ (42 SP)

#### PB-036: Modelo EQSegment completo (5 SP) - EN PROGRESO

* [x] Modelo EQSegment creado con todos los campos
* [ ] Migración con índices
* [x] Validación de no superposición
* [ ] Manager con método `active_at(ms)`

#### PB-037: Editor de segmentos en Desktop (13 SP)

* Timeline visual de la canción (forma de onda opcional)
* Crear segmento: seleccionar rango de tiempo
* Asignar EQConfig al segmento
* Bloques de colores en timeline
* Editar/eliminar segmentos existentes

#### PB-038: Editor de segmentos en Mobile (13 SP)

* UI adaptada a móvil (touch-friendly)
* Gesto de pinch para zoom en timeline
* Creación de segmentos con selectores de tiempo

#### PB-039: Aplicación de EQ por segmento en playback (8 SP)

* Hook/servicio que escucha `onTimeUpdate`
* Al cambiar de segmento, interpolar transición (fade de `transition_ms`)
* Evitar glitches de audio

#### PB-040: Visualización de segmentos en el player (3 SP)

* Barra de progreso con marcas de segmentos
* Tooltip con nombre del segmento actual

---

### 🤖 ÉPICA E07 — Agente IA de Ecualización ⭐⭐ (50 SP)

#### PB-041: Setup de integración con Claude API (5 SP)

* Configurar `anthropic` SDK en Django
* Gestión de API key por variables de entorno
* Cliente singleton con retry logic
* Rate limiting por usuario

#### PB-042: Diseño del prompt del agente (5 SP)

* System prompt que define:
  * Rol: "Eres un ingeniero de audio experto en ecualización"
  * Formato de salida JSON estricto
  * Rangos válidos de cada parámetro
* Schema Pydantic para validar respuestas

**Ejemplo de system prompt:**

```
Eres un ingeniero de audio experto. Recibes peticiones en lenguaje natural
sobre cómo el usuario quiere que suene su música, y respondes con una
configuración de ecualizador en formato JSON.

Las 10 bandas del EQ son: 31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz.
Cada banda acepta valores entre -15 y +15 dB.

Responde SIEMPRE en este formato JSON:
{
  "bands": [número, ...10 números],
  "bass_boost": 0-100,
  "virtualizer": 0-100,
  "loudness": 0-100,
  "reverb_preset": "none|small_room|large_hall|...",
  "reverb_amount": 0-100,
  "segment": {"start_ms": int, "end_ms": int} | null,
  "explanation": "Explicación breve en español de los cambios"
}
```

#### PB-043: Endpoint AI eq-suggest (8 SP)

* `POST /api/ai/eq-suggest`
* Body: `{prompt, track_id?, playlist_id?, current_eq?, context?}`
* Enriquece contexto: género, BPM, EQ actual, duración
* Llama a Claude, valida respuesta, guarda `AIRequest`
* Devuelve `{eq_config, explanation, request_id}`

#### PB-044: Parser de tiempo en lenguaje natural (5 SP)

* "del minuto 1:30 al 2:10" → `{start_ms: 90000, end_ms: 130000}`
* "en el coro" → detectar con análisis de track (opcional, fase 2)
* "al inicio" → `0 a 30000`
* Usar el propio agente IA para hacer este parsing

#### PB-045: UI de chat con el agente (Desktop) (8 SP)

* Panel de chat al lado del player o modal
* Input de texto + sugerencias rápidas ("más bajos", "más cálido", etc.)
* Muestra historial de la sesión
* Preview del EQ sugerido antes de aplicar

#### PB-046: UI de chat con el agente (Mobile) (8 SP)

* Bottom sheet o pantalla completa
* Input de voz (opcional, con `speech_to_text`)
* Aplicar sugerencia con un tap

#### PB-047: Feedback loop (5 SP)

* Botones 👍 / 👎 después de aplicar sugerencia
* Comentario opcional
* Guardar en `AIRequest.feedback`
* Dashboard admin para revisar feedbacks

#### PB-048: Estimación de costos y límites (3 SP)

* Calcular `cost_usd` por request
* Límite diario/mensual por usuario (configurable por `is_premium`)
* Avisar al usuario cuando se acerque al límite

#### PB-049: Shortcuts / plantillas predefinidas (3 SP)

* Botones de un tap: "Cálido", "Brillante", "Cinemático", "Club", etc.
* Internamente envían un prompt predefinido

---

### 📋 ÉPICA E08 — Playlists, Búsqueda y Organización (34 SP)

#### PB-050: CRUD de Playlists (8 SP)

* `POST/GET/PATCH/DELETE /api/playlists`
* UI con modal de creación/edición
* Long-press para menú contextual

#### PB-051: Agregar/quitar tracks de playlist (5 SP)

* Endpoint `POST /api/playlists/{id}/tracks`
* Multi-selección en biblioteca
* Drag & drop para reordenar (desktop)

#### PB-052: Búsqueda global (8 SP)

* Backend: `GET /api/search?q=&type=`
* Full-text search en PostgreSQL (`SearchVector`)
* Filtros: All, Songs, Albums, Artists, Playlists
* Resultados agrupados

#### PB-053: Playlists compartibles (5 SP)

* `is_public=True` genera `share_token`
* Link público: `/p/{share_token}`
* Vista de solo lectura para no-dueños

#### PB-054: Playlists inteligentes/automáticas (8 SP)

* "Recién reproducidas", "Más escuchadas", "Descubrimientos" (random)
* Generadas por backend con queries específicas

---

### 🔄 ÉPICA E09 — Sincronización Híbrida (42 SP)

#### PB-055: Estrategia y diseño de sync (3 SP)

* Documento técnico con flujo de sync
* Definición de qué entidades se sincronizan
* Orden de prioridad

#### PB-056: Endpoint de sync delta (8 SP)

* `GET /api/sync/pull?since=<timestamp>&entities=track,eqconfig,...`
* Devuelve cambios desde `since`
* Paginación por cantidad de entidades

#### PB-057: Push de cambios locales (8 SP)

* `POST /api/sync/push` con array de entidades modificadas
* Detección de conflictos (comparar `updated_at`)
* Response con conflictos sin resolver

#### PB-058: Cliente sync en Desktop (8 SP)

* Cola de cambios pendientes en SQLite
* Sync automático al reconectar
* Progress UI

#### PB-059: Cliente sync en Mobile (8 SP)

* Equivalente en Drift
* Sync en background

#### PB-060: Resolución de conflictos (5 SP)

* Last-Write-Wins por defecto
* Para conflictos críticos, UI de resolución manual
* Registro en `ConflictLog`

#### PB-061: Sync de archivos de audio (2 SP)

* Upload en background si `source=local` y usuario quiere backup
* Download al detectar tracks `synced` sin archivo local

---

### 🎨 ÉPICA E10 — Personalización Visual (34 SP)

#### PB-062: Motor de temas (Desktop + Mobile) (8 SP)

* Sistema de tokens de diseño (colores, spacing, tipografía)
* Context/Provider para tema activo
* 8 temas predefinidos

#### PB-063: Tema dinámico desde album art (8 SP)

* Extracción de colores dominantes (librería: `node-vibrant` / `palette_generator`)
* Generación de paleta complementaria
* Control de intensidad
* Actualización al cambiar canción

#### PB-064: Layouts personalizables (8 SP)

* 4 layouts de player + 3 de biblioteca
* Toggles de album art, visualizer, mini player
* Persistencia

#### PB-065: Efectos visuales opcionales (5 SP)

* Partículas animadas
* Pulsos, transiciones
* Toggle para deshabilitar (ahorrar batería)

#### PB-066: Visualizadores de audio (5 SP)

* Barras, circular, forma de onda
* Web Audio API `AnalyserNode` (desktop)
* Plugin nativo o FFT manual (mobile)

---

### 🎙️ ÉPICA E11 — Features Complementarias (42 SP)

#### PB-067: Letras sincronizadas (LRC) (8 SP)

* Upload / paste de LRC
* Parser de formato
* Display sincronizado

#### PB-068: Sleep timer (5 SP)

* 6 presets (15, 30, 45, 60, 90, 120 min)
* Fade out opcional
* Persistencia

#### PB-069: Estadísticas de escucha (8 SP)

* Tracking en `PlayHistory`
* Endpoint `GET /api/stats?period=`
* Celery job para agregar en `ListeningStats`
* Dashboard en cliente

#### PB-070: Scrobbling a Last.fm (8 SP)

* OAuth real con Last.fm
* Envío de now playing + scrobbles
* Cola con retry

#### PB-071: Editor de metadata (8 SP)

* Edit por track o batch
* Guardar en DB (no en archivo)
* Historial (últimas 100) con undo

#### PB-072: Crossfade y Gapless (3 SP)

* Configuración desde settings
* Implementación en engines

#### PB-073: Notificaciones push (2 SP)

* FCM (mobile)
* Notificaciones del sistema (desktop)

---

### 🛠️ ÉPICA E12 — Panel de Administración (34 SP)

#### PB-074: Dashboard principal admin (8 SP)

* Métricas globales: usuarios activos, tracks totales, reproducciones/día
* Gráficos con Recharts
* Filtros por fecha

#### PB-075: Gestión de usuarios (8 SP)

* Listado paginado con filtros
* Ver detalle, editar, bloquear, cambiar rol
* Ver dispositivos de cada usuario

#### PB-076: Gestión de presets globales (5 SP)

* CRUD de presets del sistema
* Publicar/despublicar

#### PB-077: Logs del agente IA (8 SP)

* Tabla de `AIRequest` con filtros
* Detalle: prompt, response, feedback
* Métricas: satisfacción, tokens, costo
* Detección de prompts abusivos

#### PB-078: Moderación de contenido (5 SP)

* Playlists públicas reportadas
* Tracks con metadata sospechosa

---

### 📱 ÉPICA E13 — Mobile App Flutter (55 SP)

> **Nota:** Muchas features ya se cubren en épicas anteriores con implementación mobile. Esta épica se enfoca en features mobile-específicas.

#### PB-079: Widgets de pantalla de inicio (Android) (13 SP)

* 3 tamaños (2x2, 4x2, 4x4)
* Actualización en tiempo real
* Controles

#### PB-080: Live Activities (iOS) (8 SP)

* Equivalente a widgets en iOS 16+
* Now playing en Dynamic Island

#### PB-081: Android Auto (13 SP)

* `MediaBrowserService`
* Navegación por biblioteca
* Voice commands

#### PB-082: CarPlay (13 SP)

* Integración con CarPlay
* UI adaptada

#### PB-083: Compartir a redes sociales (5 SP)

* "Escuchando ahora" con imagen
* Link a playlist pública

#### PB-084: Modo offline completo (3 SP)

* Download de tracks para offline
* Indicador visual

---

### 🌐 ÉPICA E14 — Features Web Específicas (PWA) 🆕 (21 SP)

> **Objetivo:** asegurar que la versión web tenga la mejor experiencia posible dentro de las limitaciones del navegador, y que sea instalable como PWA.

#### PB-085: Configuración PWA completa (5 SP)

* `manifest.json` con iconos, splash screen, theme color
* Service Worker con Workbox (cache de assets, estrategia stale-while-revalidate)
* Botón "Instalar app" cuando el navegador lo permite
* Funcionamiento offline básico (UI cargada, sin conexión al backend)

#### PB-086: Abstracción de File System (5 SP)

* Wrapper que usa `File System Access API` en Chrome/Edge
* Fallback a `<input type="file" multiple>` en navegadores sin soporte
* Guardado de handles con IndexedDB para re-acceso
* UI que explica limitaciones al usuario

#### PB-087: IndexedDB con Dexie para cache local (5 SP)

* Implementar interfaz `LocalDB` con Dexie
* Mismo esquema que SQLite (Tracks, Playlists, EQConfigs, etc.)
* Migración de versiones de esquema
* Cuota de almacenamiento con `navigator.storage.estimate()`

#### PB-088: Media Session API (3 SP)

* Controles de media en el navegador y OS (notificación, lockscreen en mobile web)
* Metadata (título, artista, portada)
* Handlers para play/pause/next/prev

#### PB-089: Deployment web automatizado (3 SP)

* Pipeline CI/CD para deploy web a Vercel/Nginx
* Versiones separadas: `app.musicflow.com` (web) y releases de desktop
* Analytics (Plausible o similar, respetando privacidad)

---

### 🧪 ÉPICA E15 — Testing, QA y Despliegue (42 SP)

#### PB-090: Tests unitarios backend (8 SP)

* pytest con ≥80% coverage
* Factories con factory_boy
* Mocks de Claude API

#### PB-091: Tests de integración backend (5 SP)

* Tests de endpoints con APIClient
* Casos de autorización

#### PB-092: Tests frontend (web + desktop) (8 SP)

* Vitest + React Testing Library (unit)
* Playwright E2E con dos configuraciones: web y Electron
* Casos: login, reproducción, EQ, editor de segmentos, agente IA

#### PB-093: Tests mobile Flutter (5 SP)

* Widget tests
* Integration tests

#### PB-094: Performance benchmarks (3 SP)

* Carga de 1000 tracks <3s (web y desktop)
* Latencia EQ <20ms en Web Audio API
* Tiempo de respuesta IA <5s
* Lighthouse score web >90

#### PB-095: Documentación completa (5 SP)

* `ARCHITECTURE.md`, `API.md`, `DEPLOYMENT.md`
* Swagger autogenerado
* Videos de features clave

#### PB-096: Setup de producción (5 SP)

* Servidores backend, certificados, dominios
* CDN para web (Cloudflare)
* Monitoring con Sentry + Grafana
* Backups automáticos

#### PB-097: Release a stores y distribución (3 SP)

* Google Play (Android)
* App Store (iOS)
* GitHub Releases (Desktop: .exe, .dmg, .deb, .AppImage)
* Deploy web productivo (app.musicflow.com)

---

## 9. Roadmap de Sprints

> **Duración por sprint:** 2 semanas
> **Velocidad estimada:** 55-60 SP por sprint (equipo de 6-8 personas)
> **Duración total:** ~20 semanas (5 meses)

| Sprint              | Semanas | Objetivo Principal                       | SP            | Entregables Clave                                                     |
| ------------------- | ------- | ---------------------------------------- | ------------- | --------------------------------------------------------------------- |
| **Sprint 1**  | 1-2     | Fundamentos e infraestructura            | 58            | Monorepo, Django, React (web+desktop), Flutter, Docker, Auth básica  |
| **Sprint 2**  | 3-4     | Auth completa + biblioteca básica       | 60            | Login JWT, registro, upload de tracks, modelo Track                   |
| **Sprint 3**  | 5-6     | Biblioteca + player básico              | 62            | Escaneo local (desktop+mobile, web limitado), listado, playback       |
| **Sprint 4**  | 7-8     | Player completo + EQ base                | 60            | Mini player, cola, EQ 10 bandas global + presets                      |
| **Sprint 5**  | 9-10    | EQ multi-nivel                           | 62            | EQ por playlist/track, prioridad jerárquica, presets custom          |
| **Sprint 6**  | 11-12   | EQ por segmentos ⭐                      | 58            | Modelo EQSegment, editor timeline, aplicación en tiempo real         |
| **Sprint 7**  | 13-14   | Agente IA ⭐                             | 62            | Integración Claude, chat UI, preview, feedback loop                  |
| **Sprint 8**  | 15-16   | Sincronización + personalización + PWA | 62            | Sync delta, resolución de conflictos, temas, layouts, PWA setup      |
| **Sprint 9**  | 17-18   | Features complementarias + admin         | 60            | Lyrics, sleep timer, stats, scrobbling, dashboard admin, features web |
| **Sprint 10** | 19-20   | QA, mobile avanzado y release            | 71            | Tests, widgets, Android Auto/CarPlay, deploy web+desktop+mobile       |
|                     |         | **TOTAL**                          | **615** |                                                                       |

### 🎯 Milestones Clave

* **M1 (fin Sprint 2):** Usuario puede registrarse, loguearse y ver biblioteca vacía
* **M2 (fin Sprint 4):** Usuario puede reproducir música con EQ global funcional
* **M3 (fin Sprint 6):** **EQ por segmentos funcional (primera feature estrella)**
* **M4 (fin Sprint 7):** **Agente IA operativo (segunda feature estrella) — MVP completo**
* **M5 (fin Sprint 9):** Beta pública con admin y features complementarias
* **M6 (fin Sprint 10):** Release 1.0 en producción

---

## 10. Definition of Ready / Done

### ✅ Definition of Ready (DoR) — Una historia está lista para ser tomada si:

* [ ] Tiene título, descripción y criterios de aceptación claros
* [ ] Fue estimada en story points por el equipo
* [ ] Dependencias identificadas y resueltas
* [ ] Diseño/wireframes aprobados (si aplica UI)
* [ ] Tamaño razonable (≤13 SP, idealmente 3-8)
* [ ] El PO validó el valor de negocio

### ✅ Definition of Done (DoD) — Una historia está terminada si:

* [ ] Código implementado y subido a rama feature
* [ ] Tests unitarios escritos y pasando (≥80% coverage del nuevo código)
* [ ] Code review aprobado por al menos 1 persona
* [ ] Sin errores de linter ni warnings de tipos
* [ ] Criterios de aceptación validados manualmente
* [ ] Documentación actualizada (README, API docs, etc.)
* [ ] Mergeado a `develop` vía PR
* [ ] Desplegado en ambiente de staging
* [ ] QA manual aprobado
* [ ] PO acepta la historia en el Sprint Review

---

## 11. Ceremonias Scrum

| Ceremonia                      | Cuándo                   | Duración | Participantes         | Objetivo                                           |
| ------------------------------ | ------------------------- | --------- | --------------------- | -------------------------------------------------- |
| **Sprint Planning**      | Lunes semana 1 del sprint | 3h        | Equipo completo       | Seleccionar historias del backlog y descomponerlas |
| **Daily Standup**        | Cada día laboral, 9:30am | 15 min    | Dev team + SM         | Sincronizar avances, bloqueos, plan del día       |
| **Refinement**           | Miércoles semana 1       | 1.5h      | PO + Dev team         | Refinar y estimar historias futuras                |
| **Sprint Review**        | Viernes semana 2, 10am    | 1.5h      | Equipo + stakeholders | Demo del incremento, feedback del PO               |
| **Sprint Retrospective** | Viernes semana 2, 2pm     | 1h        | Dev team + SM         | Qué funcionó, qué mejorar, acciones             |

---

## 12. Métricas y KPIs

### Métricas del Equipo (Scrum)

* **Velocity:** SP completados por sprint (objetivo: 55-60)
* **Burndown chart:** Progreso diario del sprint
* **Cycle time:** Tiempo promedio de una historia en "In Progress" a "Done"
* **Defect rate:** Bugs encontrados post-sprint / historias entregadas
* **Code coverage:** ≥80% backend, ≥70% frontend

### Métricas de Producto (Post-launch)

* **Usuarios activos mensuales (MAU)**
* **Tasa de retención D7 / D30**
* **Tiempo promedio de sesión**
* **Canciones reproducidas por sesión**
* **Adopción de features estrella:**
  * % usuarios que usan EQ por segmentos
  * % usuarios que usan el agente IA
  * # requests al agente IA / usuario / semana
* **Satisfacción del agente IA:** % de feedbacks `good`
* **NPS (Net Promoter Score)**

### Métricas Técnicas

* **Uptime:** ≥99.5%
* **Latencia API (p95):** <200ms
* **Latencia IA (p95):** <5s
* **Tasa de errores:** <0.5%
* **Tamaño de app:** <80MB (mobile), <150MB (desktop)

---

## 13. Gestión de Riesgos

| #   | Riesgo                                          | Probabilidad | Impacto | Mitigación                                                                                        |
| --- | ----------------------------------------------- | ------------ | ------- | -------------------------------------------------------------------------------------------------- |
| R1  | Calidad del agente IA insuficiente              | Media        | Alto    | Prompt engineering iterativo, feedback loop temprano, A/B testing                                  |
| R2  | Performance del EQ en tiempo real en mobile     | Media        | Alto    | Usar plugins nativos (no JS bridge), benchmarks desde sprint 4                                     |
| R3  | Conflictos de sincronización complejos         | Alta         | Medio   | Estrategia LWW simple, logs detallados, UI de resolución manual                                   |
| R4  | Costos de la API de Claude inesperados          | Media        | Medio   | Rate limiting, límites por plan, caché de respuestas similares                                   |
| R5  | Complejidad del editor de segmentos (UX)        | Alta         | Alto    | Prototipos tempranos con usuarios, iteración de diseño                                           |
| R6  | Retrasos en aprobación de stores               | Media        | Bajo    | Empezar submit 2 semanas antes, tener fallback web                                                 |
| R7  | Dependencia de plugins nativos Flutter          | Media        | Alto    | Spikes tempranos (sprint 3), buscar alternativas                                                   |
| R8  | Escalabilidad del backend con muchos usuarios   | Baja         | Alto    | Diseño stateless, caché Redis, read replicas PostgreSQL                                          |
| R9  | Privacidad de datos (GDPR/LGPD)                 | Media        | Alto    | Consentimiento explícito, export/delete de datos, legal review                                    |
| R10 | Churn del equipo                                | Baja         | Alto    | Documentación exhaustiva, pair programming, knowledge sharing                                     |
| R11 | Limitaciones del navegador para features core   | Alta         | Medio   | Abstracción de plataforma, UI que comunica limitaciones al usuario web, promover descarga desktop |
| R12 | Diferencias de comportamiento entre navegadores | Media        | Medio   | Tests E2E multi-browser con Playwright, browserslist estricto                                      |

---

## 📎 Anexos

### A. Convenciones de Código

**Branches:**

* `main`: producción
* `develop`: integración
* `feature/PB-XXX-descripcion`: nuevas features
* `bugfix/PB-XXX-descripcion`: correcciones
* `hotfix/descripcion`: fixes urgentes en producción

**Commits (Conventional Commits):**

```
feat(equalizer): agregar EQ por segmentos temporales
fix(auth): corregir refresh de token expirado
docs(readme): actualizar instrucciones de setup
test(ai): añadir tests del parser de respuestas
refactor(sync): simplificar lógica de conflictos
```

### B. Estructura de Carpetas del Backend ✅ MIGRADO (NestJS)

```
apps/backend/
├── src/
│   ├── main.ts                    # Entry point
│   ├── app.module.ts              # Root module
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── common/                    # Shared utilities
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   └── modules/
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── dto/
│       │   └── strategies/
│       ├── library/
│       │   ├── tracks/
│       │   └── playlists/
│       ├── equalizer/
│       │   ├── presets/
│       │   ├── configs/
│       │   └── segments/
│       ├── ai-agent/
│       │   ├── ai-agent.module.ts
│       │   ├── ai-agent.controller.ts
│       │   └── ai-agent.service.ts
│       ├── analytics/
│       ├── sync/
│       └── admin/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── nest-cli.json
├── tsconfig.json
├── package.json
└── Dockerfile
```

### C. Estructura Frontend React (Web + Desktop con Electron) ✅ MIGRADO

```
apps/web/
├── electron/                   # Proceso principal de Electron (solo desktop)
│   ├── main.js                 # Entry point de Electron
│   ├── preload.js              # Bridge seguro con contextBridge
│   └── ipc/                    # Handlers IPC
│       ├── fileSystem.ts       # Acceso a archivos locales
│       ├── sqlite.ts           # Queries a SQLite
│       └── shortcuts.ts        # Atajos globales
│
├── public/
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker (Workbox)
│
├── src/
│   ├── admin/                  # Vista administrador (web + desktop)
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── UsersPage.tsx
│   │   │   ├── AIRequestsPage.tsx
│   │   │   └── PresetsPage.tsx
│   │   └── components/
│   │
│   ├── client/                 # Vista cliente (web + desktop)
│   │   ├── pages/
│   │   │   ├── LibraryPage.tsx
│   │   │   ├── PlaylistsPage.tsx
│   │   │   ├── NowPlayingPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── features/
│   │   │   ├── player/
│   │   │   ├── equalizer/
│   │   │   ├── segments/       # Editor de segmentos EQ
│   │   │   ├── ai-agent/       # Chat con agente IA
│   │   │   ├── library/
│   │   │   └── playlists/
│   │   └── components/
│   │
│   ├── shared/                 # Compartido admin + cliente + web + desktop
│   │   ├── ui/                 # shadcn components (via @musicflow/ui)
│   │   ├── api/                # Clientes HTTP (TanStack Query)
│   │   ├── stores/             # Zustand stores
│   │   ├── hooks/
│   │   └── utils/
│   │
│   ├── platform/               # 🔑 Abstracción web vs desktop
│   │   ├── detector.ts         # isElectron, isWeb, isPWA
│   │   ├── types.ts            # Interfaces comunes
│   │   ├── web/                # Implementaciones web
│   │   │   ├── fileSystem.ts   # File System Access API
│   │   │   ├── localDB.ts      # IndexedDB + Dexie
│   │   │   └── notifications.ts
│   │   └── desktop/            # Implementaciones Electron
│   │       ├── fileSystem.ts   # window.electronAPI.fs
│   │       ├── localDB.ts      # window.electronAPI.sqlite
│   │       └── notifications.ts
│   │
│   ├── audio/                  # Motor de audio (Web Audio API, compartido)
│   │   ├── engine.ts
│   │   ├── equalizer.ts
│   │   ├── segments.ts         # Aplicación de EQ por segmento
│   │   └── effects.ts
│   │
│   └── App.tsx
│
├── vite.config.ts              # Build web + Electron
├── tailwind.config.js
├── tsconfig.json
└── package.json                # @musicflow/web
```

**Scripts `package.json`:**

```json
{
  "name": "@musicflow/web",
  "scripts": {
    "dev": "vite",
    "dev:electron": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "build": "tsc -b && vite build",
    "build:electron": "tsc -b && vite build && electron-builder"
  },
  "dependencies": {
    "@musicflow/shared": "workspace:*",
    "@musicflow/ui": "workspace:*"
  }
}
```

### D. Estructura Mobile (Flutter) ✅ MIGRADO

```
apps/mobile/                    # Externo a pnpm workspaces
├── lib/
│   ├── main.dart
│   ├── app/
│   │   ├── routes.dart
│   │   └── theme.dart
│   ├── features/
│   │   ├── auth/
│   │   ├── library/
│   │   ├── player/
│   │   ├── equalizer/
│   │   ├── segments/
│   │   ├── ai_agent/
│   │   ├── playlists/
│   │   └── settings/
│   ├── core/
│   │   ├── api/
│   │   ├── db/            # Drift
│   │   ├── audio/         # player engine
│   │   └── widgets/
│   └── shared/
│       ├── models/        # Mirrors @musicflow/shared types
│       └── utils/
├── android/
├── ios/
└── pubspec.yaml
```

### E. Estructura de Packages Compartidos ✅ NUEVO

```
packages/
├── shared/                     # @musicflow/shared
│   ├── src/
│   │   ├── types/              # Interfaces TypeScript compartidas
│   │   │   ├── index.ts
│   │   │   ├── user.ts
│   │   │   ├── track.ts
│   │   │   ├── eq.ts
│   │   │   └── ai.ts
│   │   ├── constants/
│   │   │   ├── index.ts
│   │   │   └── eq.ts           # EQ_FREQUENCIES, EQ_PRESETS
│   │   └── utils/
│   │       ├── index.ts
│   │       └── time.ts
│   ├── package.json
│   └── tsconfig.json
│
├── ui/                         # @musicflow/ui
│   ├── src/
│   │   ├── components/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...             # shadcn/ui components
│   │   └── utils/
│   │       └── cn.ts           # clsx + tailwind-merge
│   ├── tailwind.config.js
│   ├── package.json
│   └── tsconfig.json
│
└── config/                     # @musicflow/config
    ├── tsconfig/
    │   ├── base.json
    │   ├── react.json
    │   └── node.json
    ├── eslint/
    │   └── index.js
    └── package.json
```

---

## pConclusión

Este documento es la **fuente de verdad** del proyecto MusicFlow. Debe vivir en el repositorio (`/docs/SCRUM.md`) y actualizarse al final de cada sprint con:

* Historias completadas
* Nuevas historias surgidas
* Re-estimaciones
* Lecciones aprendidas de las retrospectivas

**Siguientes pasos recomendados:**

1. Validar con el Product Owner la priorización del backlog
2. Realizar Sprint 0 (kickoff técnico, instalaciones, accesos)
3. Comenzar Sprint 1 con las historias PB-001 a PB-006
4. Crear el board en Jira / Linear / GitHub Projects
5. Configurar el repositorio con las protecciones de branch

> **"El mejor plan de Scrum es aquel que se adapta al aprendizaje del equipo. Este documento es un punto de partida, no una camisa de fuerza."**

---

*Documento generado por el equipo de Scrum Master + Full Stack Architecture*
*Última actualización: Abril 2026*
