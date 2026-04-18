# MusicFlow

Plataforma multiplataforma de reproduccion musical con ecualizacion inteligente asistida por IA.

## Vision del Producto

MusicFlow es una plataforma multiplataforma (Desktop + Mobile + Web) de reproduccion musical enfocada en la personalizacion granular de la ecualizacion asistida por un agente de inteligencia artificial.

### Propuesta de Valor

"El primer reproductor que entiende tu musica a nivel de segundo. Ecualiza el coro distinto al puente, cada cancion distinto al resto, cada playlist con su propia personalidad - todo manualmente o pidiendoselo a una IA en lenguaje natural."

### Diferenciadores Clave

| Caracteristica              | MusicFlow | Competencia |
|-----------------------------|-----------|-------------|
| EQ global                   | Si        | Si          |
| EQ por playlist             | Si        | No          |
| EQ por cancion              | Si        | Parcial     |
| EQ por segmento temporal    | Si        | No          |
| Agente IA para configurar EQ| Si        | No          |
| Modo hibrido (local + cloud)| Si        | Parcial     |
| Web + Desktop + Mobile      | Si        | Parcial     |

---

## Estructura del Proyecto

```
MusicFlow/
├── backend/                 # Django REST API
│   ├── apps/
│   │   ├── auth_app/        # Autenticacion y usuarios
│   │   ├── library/         # Tracks y playlists
│   │   ├── equalizer/       # EQ presets, configs, segmentos
│   │   ├── ai_agent/        # Integracion con Claude API
│   │   ├── analytics/       # Historial y estadisticas
│   │   ├── sync/            # Sincronizacion hibrida
│   │   ├── preferences/     # Preferencias de usuario
│   │   └── admin_dashboard/ # Panel de administracion
│   ├── config/              # Settings Django
│   ├── core/                # Utilidades compartidas
│   └── requirements/        # Dependencias Python
│
├── frontend/                # React + Electron (Web + Desktop)
│   ├── electron/            # Proceso principal Electron
│   ├── src/
│   │   ├── admin/           # Vista administrador
│   │   ├── client/          # Vista cliente
│   │   ├── shared/          # Componentes, stores, API
│   │   ├── platform/        # Abstraccion Web vs Desktop
│   │   └── audio/           # Motor de audio Web Audio API
│   └── public/              # Assets y PWA manifest
│
├── mobile/                  # Flutter (Android + iOS)
│   └── lib/
│       ├── app/             # Configuracion app
│       ├── features/        # Modulos por feature
│       ├── core/            # API, DB, audio
│       └── shared/          # Modelos y utilidades
│
├── docs/                    # Documentacion
├── infra/                   # Configuracion Nginx
├── docker-compose.yml       # Desarrollo
└── docker-compose.prod.yml  # Produccion
```

---

## Stack Tecnologico

### Backend
- Python 3.12+
- Django 5.x + Django REST Framework 3.x
- PostgreSQL 16
- Redis 7
- Celery 5
- djangorestframework-simplejwt (JWT)
- Claude API (Anthropic) via anthropic SDK
- mutagen (metadata de audio)
- pytest + factory_boy (testing)

### Frontend Web + Desktop
- React 18 + TypeScript 5
- Vite (bundler)
- Electron 30+ (desktop)
- Zustand (estado)
- TanStack Query + Axios (HTTP)
- TailwindCSS + shadcn/ui
- Dexie.js (IndexedDB para web)
- better-sqlite3 (SQLite para desktop)
- Web Audio API (ecualizacion)
- Vitest + Playwright (testing)

### Mobile
- Flutter 3.x + Dart 3.x
- Riverpod 2.x (estado)
- Dio (HTTP)
- Drift (SQLite)
- Hive (key-value storage)
- just_audio + audio_service

### Infraestructura
- Docker + Docker Compose
- Nginx (reverse proxy)
- MinIO (S3-compatible storage)
- GitHub Actions (CI/CD)

---

## Requisitos

- Python 3.12+
- Node.js 20+
- Flutter 3.x
- Docker y Docker Compose (opcional, recomendado)
- PostgreSQL 16 (si no usas Docker)
- Redis 7 (si no usas Docker)

---

## Inicio Rapido

### Opcion 1: Con Docker (Recomendado)

```bash
# Clonar repositorio
git clone <repo-url>
cd MusicFlow

# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Detener servicios
docker-compose down
```

Servicios disponibles:
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- MinIO Console: http://localhost:9001

### Opcion 2: Desarrollo Local

#### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements/dev.txt

# Copiar variables de entorno
cp .env.example .env

# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

#### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Desarrollo web
npm run dev

# Desarrollo desktop (Electron)
npm run dev:electron

# Build web
npm run build

# Build desktop
npm run build:electron
```

#### Mobile

```bash
cd mobile

# Obtener dependencias
flutter pub get

# Ejecutar en dispositivo/emulador
flutter run

# Build Android
flutter build apk

# Build iOS
flutter build ios
```

---

## Configuracion

### Variables de Entorno Backend (.env)

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=musicflow
DB_USER=musicflow
DB_PASSWORD=musicflow
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1

# AWS S3 / MinIO
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_STORAGE_BUCKET_NAME=musicflow
AWS_S3_ENDPOINT_URL=http://localhost:9000

# Anthropic (Claude)
ANTHROPIC_API_KEY=your-api-key
```

### Variables de Entorno Frontend (.env)

```env
VITE_API_URL=http://localhost:8000/api
```

---

## Modelos de Datos Principales

### User
- UUID, email, username, role (admin/client), is_premium

### Track
- Metadata completa (title, artist, album, genre, duration, etc.)
- Soporte hibrido (local, synced, both)
- Hash de archivo para evitar duplicados

### Playlist
- Colecciones de tracks con orden personalizado
- Soporte para compartir (is_public, share_token)

### EQPreset
- 10 bandas de ecualizacion (31Hz a 16kHz)
- Bass boost, virtualizer, loudness, reverb

### EQConfig
- Configuracion EQ aplicada a un scope (global, playlist, track, segment)

### EQSegment
- EQ especifico para un rango de tiempo dentro de una cancion
- Label (coro, puente, etc.), start_ms, end_ms, transition_ms

### AIRequest
- Registro de peticiones al agente IA
- Prompt, response, feedback, metricas de uso

---

## API Endpoints

### Autenticacion
- POST /api/auth/login/ - Login con JWT
- POST /api/auth/refresh/ - Refrescar token
- POST /api/auth/register/ - Registro de usuario

### Library
- GET /api/library/tracks/ - Listar tracks
- POST /api/library/tracks/ - Subir track
- GET /api/library/playlists/ - Listar playlists

### Equalizer
- GET /api/equalizer/presets/ - Listar presets
- POST /api/equalizer/configs/ - Crear configuracion EQ
- GET /api/equalizer/segments/ - Listar segmentos

### AI Agent
- POST /api/ai/eq-suggest/ - Solicitar sugerencia de EQ

### Sync
- GET /api/sync/pull/ - Obtener cambios desde servidor
- POST /api/sync/push/ - Enviar cambios al servidor

### Documentacion API
- GET /api/docs/ - Swagger UI
- GET /api/redoc/ - ReDoc

---

## Testing

### Backend

```bash
cd backend

# Ejecutar todos los tests
pytest

# Con coverage
pytest --cov=apps

# Tests especificos
pytest apps/auth_app/tests/
```

### Frontend

```bash
cd frontend

# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

### Mobile

```bash
cd mobile

# Unit tests
flutter test

# Integration tests
flutter test integration_test/
```

---

## Despliegue

### Produccion con Docker

```bash
# Configurar variables de entorno de produccion
cp .env.example .env.prod
# Editar .env.prod con valores de produccion

# Construir y desplegar
docker-compose -f docker-compose.prod.yml up -d --build
```

### Builds de Escritorio

```bash
cd frontend

# Windows
npm run build:electron  # Genera .exe en dist-electron/

# El build genera:
# - Windows: .exe, portable
# - macOS: .dmg, .zip
# - Linux: .AppImage, .deb
```

### Builds Mobile

```bash
cd mobile

# Android (APK)
flutter build apk --release

# Android (App Bundle para Play Store)
flutter build appbundle --release

# iOS
flutter build ios --release
```

---

## Arquitectura

### Flujo de Datos - Agente IA

```
Usuario: "Quiero mas bajos en el coro del minuto 1:30 al 2:10"
    |
    v
Cliente (React/Flutter) -> POST /api/ai/eq-suggest
    |
    v
Django View (AIAgentView)
    |
    +-> Construye prompt enriquecido (contexto de cancion, genero, EQ actual)
    |
    v
Claude API (genera configuracion EQ en JSON)
    |
    v
Parser + Validador (Pydantic schema)
    |
    +-> Guarda AIRequest en DB
    +-> Crea/actualiza EQSegment
    |
    v
Respuesta al cliente con preview aplicable
    |
    v
Usuario acepta/rechaza -> feedback loop
```

### Prioridad de EQ en Reproduccion

1. Segmento activo (si existe para el momento actual)
2. Configuracion del track
3. Configuracion de la playlist activa
4. Configuracion global del usuario
5. Flat (sin ecualizacion)

---

## Contribucion

1. Crear rama desde `develop`: `git checkout -b feature/PB-XXX-descripcion`
2. Hacer commits siguiendo Conventional Commits
3. Crear Pull Request hacia `develop`
4. Esperar review y aprobacion

### Convenciones de Commits

```
feat(equalizer): agregar EQ por segmentos temporales
fix(auth): corregir refresh de token expirado
docs(readme): actualizar instrucciones de setup
test(ai): anadir tests del parser de respuestas
refactor(sync): simplificar logica de conflictos
```

---

## Licencia

Propiedad privada - Todos los derechos reservados.

---

## Contacto

Para preguntas sobre el proyecto, contactar al equipo de desarrollo.
