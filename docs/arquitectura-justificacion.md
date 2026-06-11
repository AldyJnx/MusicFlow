# MusicFlow — Arquitectura y Justificación Tecnológica

> Documento de apoyo para exposición. Acompaña a los diagramas en
> [diagrams/architecture.png](diagrams/architecture.png) y [diagrams/mer.png](diagrams/mer.png).

---

## 1. Visión general

**MusicFlow** es un reproductor musical multiplataforma cuyo diferenciador es la
**ecualización granular por segmento temporal asistida por IA**: distintos ajustes
de EQ para la intro, el verso, el coro, etc., sugeridos en lenguaje natural por un
agente basado en Claude.

Esto impone tres exigencias que condicionan toda la arquitectura:

1. **Multiplataforma real** — Web, Desktop (Win/Mac/Linux) y Móvil (Android/iOS).
2. **Audio de baja latencia** en cada plataforma, con un motor de EQ por capas
   (Global → Playlist → Track → Segmento).
3. **Funcionamiento híbrido** — usable offline y con sincronización a la nube.

---

## 2. Estilo arquitectónico

| Decisión                          | Qué es                                                                          | Por qué                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Monorepo** (pnpm + Turborepo)   | Un solo repositorio con `apps/` y `packages/`                                   | Comparte tipos, constantes y utilidades entre backend y frontend; un solo flujo de CI y versionado coherente |
| **Cliente–servidor** con API REST | Clientes “tontos” + backend central como fuente de verdad                       | Permite múltiples clientes heterogéneos (React/Flutter) contra un mismo contrato                             |
| **Backend modular** (NestJS)      | Módulos por dominio: auth, library, equalizer, ai-agent, analytics, sync, admin | Separación de responsabilidades, testeable e independiente por feature                                       |
| **Offline-first híbrido**         | Caché/DB local + sincronización con resolución de conflictos                    | El usuario nunca queda bloqueado sin red; la nube unifica dispositivos                                       |
| **Roles (admin/client)**          | Un mismo frontend web sirve dos roles                                           | Reutiliza UI y reduce superficie de mantenimiento                                                            |

---

## 3. Justificación por capa

### 3.1 Backend — NestJS 10 + Prisma 5 + PostgreSQL 16

- **NestJS**: framework opinado sobre Node/TypeScript. Su sistema de **módulos,
  inyección de dependencias y guards** encaja con un dominio que crece por features.
  Los `@UseGuards(JwtAuthGuard)` y los **DTOs con class-validator** dan seguridad y
  validación de entrada de forma declarativa y uniforme.
- **Prisma 5**: ORM type-safe. El esquema (`schema.prisma`) es **única fuente de
  verdad** del modelo de datos y genera tipos que se comparten con el resto del
  monorepo. Migraciones versionadas y reproducibles.
- **PostgreSQL 16**: base relacional madura. El dominio es **fuertemente relacional**
  (usuarios → tracks → segmentos → configs de EQ → historial) y se beneficia de
  integridad referencial, índices compuestos y tipos como `Json`, `Decimal` y `Date`.
- **Redis**: caché y **cola de trabajos (BullMQ)** para tareas pesadas/asíncronas
  (p. ej. procesamiento de waveform, llamadas a IA, jobs de sync) sin bloquear la API.

### 3.2 Web / Desktop — React 18 + Vite 5 + Electron 30

- **React 18 + Vite**: ecosistema dominante, render por componentes y HMR rápido en
  desarrollo. Permite construir la **PWA** y, con el mismo código, el desktop.
- **Electron 30+**: una sola base de código React se empaqueta como app de escritorio
  nativa para Windows/Mac/Linux. Configurado con `contextIsolation: true` y
  `nodeIntegration: false` por seguridad.
- **Zustand** (estado) + **TanStack Query** (datos de servidor): se separan los dos
  tipos de estado. Zustand para estado de UI/player local (ligero, sin boilerplate);
  TanStack Query para caché, reintentos e invalidación de datos remotos.
- **Web Audio API**: motor de EQ en el navegador (filtros biquad por banda), que
  aplica las configuraciones por segmento en tiempo real.

### 3.3 Móvil — Flutter 3 + Riverpod 2 + Drift + just_audio

- **Flutter**: un solo código Dart para **Android e iOS** con rendimiento nativo y UI
  consistente; evita mantener dos apps separadas.
- **Riverpod 2**: gestión de estado y dependencias testeable, con disposición
  determinista de recursos (`ref.onDispose`), importante para liberar controladores
  de audio.
- **Drift (SQLite)**: base local para el modo **offline-first**; almacena tracks,
  presets y cambios pendientes de sincronizar.
- **just_audio**: reproducción y pipeline de audio nativo donde se inyecta la cadena
  de EQ por segmento.
- **Dio**: cliente HTTP con interceptores (auth, reintentos) contra la misma API REST.

### 3.4 Agente IA — Claude API

- El módulo `ai-agent` traduce peticiones en lenguaje natural (“dale más cuerpo al
  coro”) a **configuraciones de EQ estructuradas** y a la detección de segmentos.
- Se registra cada petición con tokens, costo y feedback (`AIRequest`) para
  trazabilidad, control de gasto y mejora del producto.

### 3.5 Sincronización híbrida

- El móvil trabaja sobre Drift y empuja/recibe cambios vía el módulo `sync`.
- Los conflictos se modelan explícitamente (`SyncLog`, `ConflictLog` con estrategias
  `LOCAL_WINS` / `SERVER_WINS` / `MERGE`), lo que hace **auditable** la convergencia
  entre dispositivos.

---

## 4. Modelo de datos (resumen)

El **User** es la entidad central. De él cuelgan dispositivos, biblioteca (tracks y
playlists), el sistema de EQ multinivel (**EQPreset → EQConfig → EQSegment**), las
peticiones de IA, la analítica (**PlayHistory**, **ListeningStats**) y la
sincronización (**SyncLog**, **ConflictLog**). El detalle completo está en el
[diagrama MER](diagrams/mer.png) y en `apps/backend/prisma/schema.prisma`.

Puntos de diseño a destacar:

- **EQ por capas**: `EQConfig.scopeType` (GLOBAL/PLAYLIST/TRACK/SEGMENT) permite que
  una misma estructura sirva a los cuatro niveles de granularidad.
- **Catálogo vs. biblioteca privada**: `Track.isCatalog` + `UserLibrarySave` modelan
  un catálogo público estilo streaming sobre la misma tabla de tracks.
- **Trazabilidad de IA**: `EQSegment.createdBy` (MANUAL/AI) enlaza con `AIRequest`.

---

## 5. Decisiones transversales de seguridad

- **JWT** con access (15 min) + refresh (7 d) en cookies **HttpOnly**.
- **Validación de ownership** en cada servicio (`if (recurso.userId !== userId) → 403`).
- **DTOs obligatorios** — nunca `any` como entrada.
- **CVE-2025-55305**: validación de content-type en requests.
- **PgBouncer ≥ 1.21** para prepared statements con Prisma.
- **CVE-2025-36852**: versión de Turbo fijada en el monorepo.

---

## 6. Guion sugerido para la exposición (5–7 min)

1. **Problema y diferenciador** (30 s): EQ por segmento + IA, multiplataforma.
2. **Vista de arquitectura** (1–2 min): recorrer el diagrama de capas — clientes →
   API → datos → externos.
3. **Por qué monorepo y cliente-servidor** (1 min): tipos compartidos, un contrato,
   varios clientes.
4. **Tres justificaciones fuertes** (2 min): NestJS+Prisma+Postgres (dominio
   relacional y type-safety), React/Electron + Flutter (multiplataforma sin duplicar
   esfuerzo), offline-first con sync auditable.
5. **Modelo de datos** (1 min): User central + EQ multinivel sobre el MER.
6. **Cierre** (30 s): seguridad por defecto y escalabilidad por módulos.
