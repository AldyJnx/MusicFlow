# Contributing to MusicFlow

Gracias por tu interes en contribuir a MusicFlow. Este documento describe las pautas para contribuir al proyecto.

## Requisitos Previos

- Node.js >= 20.x
- pnpm >= 9.x
- Docker y Docker Compose
- Git

## Setup del Entorno

```bash
# Clonar el repositorio
git clone https://github.com/AldyJnx/MusicFlow.git
cd MusicFlow

# Instalar dependencias
pnpm install

# Iniciar servicios (PostgreSQL, Redis, MinIO)
docker-compose up -d db redis minio

# Generar cliente Prisma
pnpm --filter @musicflow/backend prisma:generate

# Ejecutar migraciones
pnpm --filter @musicflow/backend prisma:migrate:dev

# Iniciar desarrollo
pnpm dev
```

## Estructura del Proyecto

```
musicflow/
├── apps/
│   ├── backend/    # NestJS API
│   ├── web/        # React + Electron
│   └── mobile/     # Flutter
├── packages/
│   ├── shared/     # Tipos y utilidades compartidas
│   ├── ui/         # Componentes UI (shadcn/ui)
│   └── config/     # Configuraciones compartidas
└── .github/        # GitHub Actions workflows
```

## Flujo de Trabajo

### 1. Crear una rama

```bash
git checkout -b feature/nombre-descriptivo
# o
git checkout -b fix/descripcion-del-bug
```

### 2. Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): descripcion corta

fix(auth): corregir validacion de token
feat(equalizer): agregar preset de jazz
docs(readme): actualizar instrucciones de instalacion
refactor(api): simplificar middleware de auth
test(library): agregar tests para servicio de tracks
```

**Scopes comunes:** `auth`, `library`, `equalizer`, `ai-agent`, `player`, `admin`, `mobile`, `web`, `api`, `docs`

### 3. Antes de hacer Push

```bash
# Verificar que el codigo compila
pnpm build

# Ejecutar tests
pnpm test

# Verificar linting
pnpm lint
```

### 4. Pull Request

1. Asegurate de que tu rama este actualizada con `main`
2. Crea un PR con una descripcion clara
3. Vincula el issue relacionado si existe
4. Espera la revision del codigo

## Estilo de Codigo

### TypeScript/JavaScript

- Usar TypeScript strict mode
- Preferir `const` sobre `let`
- Usar arrow functions cuando sea apropiado
- Documentar funciones publicas con JSDoc

### NestJS (Backend)

- Usar DTOs con class-validator para validacion
- Implementar guards para autorizacion
- Siempre verificar ownership de recursos
- Usar transacciones Prisma para operaciones multiples

### React (Frontend)

- Componentes funcionales con hooks
- Zustand para estado global
- TanStack Query para server state
- Tailwind CSS para estilos

### Flutter (Mobile)

- Riverpod para state management
- Drift para base de datos local
- Seguir las guias de estilo de Dart

## Tests

- **Backend:** Jest para unit e integration tests
- **Web:** Vitest para unit tests, Playwright para E2E
- **Mobile:** flutter_test para widget tests

## Reportar Bugs

Usa el template de issues de GitHub incluyendo:

1. Descripcion del problema
2. Pasos para reproducir
3. Comportamiento esperado vs actual
4. Version del sistema/navegador
5. Screenshots si aplica

## Preguntas

Si tienes preguntas, abre un issue con el label `question`.
