# MusicFlow — Stack Tecnológico y Justificación de Librerías

> **Documento de referencia** que explica **por qué** cada tecnología y librería fue elegida.
> No es una lista de dependencias — para eso ver `package.json` / `pubspec.yaml`.
> **Versión:** 1.0 · **Fecha:** Junio 2026

---

## Tabla de contenidos

1. Principios de selección
2. Backend (NestJS + Prisma)
3. Frontend Web + Desktop (React + Electron)
4. Frontend Mobile (Flutter)
5. Persistencia y caché
6. Audio y procesamiento de señal
7. IA — integración con Claude
8. Monorepo y herramientas de build
9. Calidad, testing y CI/CD
10. Seguridad y configuración
11. Librerías auxiliares por categoría
12. Tecnologías descartadas y por qué

---

## 1. Principios de selección

Toda decisión se evaluó contra cinco criterios, en este orden:

| #   | Criterio                                  | Razón                                                                                                |
| --- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | **Type-safety end-to-end**                | Reducir bugs en runtime; el monorepo permite compartir tipos.                                        |
| 2   | **Velocidad de iteración**                | Es un proyecto de tesis con sprints cortos: framework con scaffolding pesado > escribir todo a mano. |
| 3   | **Audio en tiempo real**                  | El core del producto es ecualización con baja latencia (<20ms); descarta soluciones lentas.          |
| 4   | **Multiplataforma con código compartido** | Web + Desktop + Mobile sin triplicar esfuerzo.                                                       |
| 5   | **Comunidad activa y mantenimiento**      | Cada librería debe tener releases en los últimos 6 meses y >5k stars (proxy).                        |

Se rechazaron alternativas que cumplen 4/5 pero fallan en 1 — ej. Tauri es excelente pero el ecosistema de audio en Rust es inmaduro para el caso de uso.

---

## 2. Backend — NestJS + Prisma

### NestJS 10

**Justificación:** arquitectura modular con DI nativa, decoradores que mapean 1:1 a la organización del dominio (auth, library, equalizer, ai-agent, sync, admin). Comparado con Express plano: 30-40% menos boilerplate, validación declarativa (`class-validator`), Swagger autogenerado, guards/interceptors testables.

**Alternativas descartadas:**

- **Express puro** → demasiado boilerplate; cada middleware/guard/validator hay que cablearlo a mano.
- **Fastify** → más rápido en benchmarks, pero el ecosistema de plugins de NestJS (auth, swagger, throttler, schedule, bullmq) está más maduro y compensa la diferencia de throughput, que no es nuestro cuello de botella.
- **Django** → cambio de lenguaje romperia la promesa de tipos compartidos vía monorepo.

### TypeScript 5.x sobre Node 20 LTS

**Justificación:** lenguaje único en backend + web + types compartidos en `packages/shared`. Node 20 da `--watch` nativo, `fetch` global, y mejor ESM.

### Prisma 5.x

**Justificación:** ORM con cliente type-safe generado desde un schema declarativo. Migraciones versionadas, `prisma studio` para inspección visual, soporte de transacciones interactivas. La curva de aprendizaje es lineal.

**Comparación:**
| | Prisma | TypeORM | Drizzle |
|---|---|---|---|
| Type-safety | ✅ Generado | ⚠️ Decoradores frágiles | ✅ Inferido |
| Migraciones | ✅ Declarativas | ⚠️ Mixtas | ⚠️ SQL puro |
| Madurez | ✅ Alta | ✅ Alta | ⚠️ Media |
| Performance | ⚠️ Cliente pesado | ✅ | ✅ Excelente |

Aceptamos el coste de Prisma (cliente más pesado) por la productividad.

### PostgreSQL 16

**Justificación:** JSON nativo (`Json` para campos de EQ bands), full-text search built-in (necesario para búsqueda global de tracks), índices compuestos avanzados, generated columns. Es la BD de facto para apps que mezclan datos relacionales con documentos.

**Por qué no MySQL/MariaDB:** soporte de JSONB y window functions inferiores; menos extensiones para audio metadata.
**Por qué no MongoDB:** la mayoría del modelo es relacional (User → Track → Playlist → Segment), forzar documentos llevaría a refs manuales.

### Redis 7

**Justificación:** dos roles distintos pero complementarios:

- **Cache** de respuestas frecuentes (perfil, library count, dashboard admin).
- **Queue** vía BullMQ para jobs asíncronos (agregación de `ListeningStats`, recomputo de `ConflictLog`, envío de email, transcoding futuro).

### BullMQ 5

**Justificación:** queue robusta sobre Redis con retries, backoff exponencial, repeatable jobs y `@nestjs/bullmq`. Reemplaza el patrón "cron en cualquier lado" con jobs persistentes y observables.

### Passport.js + @nestjs/jwt

**Justificación:** estándar de la industria; estrategias intercambiables (JWT hoy, OAuth Google/Spotify mañana sin reescribir). `@nestjs/jwt` da control fino sobre payload, expiración y refresh tokens rotativos.

**Configuración elegida:**

- Access token: 15 min, firma HS256, en memoria del cliente.
- Refresh token: 7 días, rotativo, en `httpOnly` cookie (mitigación XSS).

### class-validator + class-transformer

**Justificación:** validación declarativa por DTOs con `@IsEmail`, `@Matches`, `@MinLength`, etc. Permite `ValidationPipe` global y rechaza payloads malformados antes de tocar el controller. Más mantenible que validación imperativa en cada handler.

### @nestjs/swagger

**Justificación:** API docs generadas desde decoradores; cero documentación fuera de sync. Cliente front puede generar tipos con `openapi-typescript`.

### @anthropic-ai/sdk

**Justificación:** cliente oficial de Anthropic; maneja retries, streaming, tool use y reporta `usage.input_tokens`/`output_tokens` necesarios para el dashboard de costos del admin.

### music-metadata

**Justificación:** parser de ID3v1/v2, Vorbis comments, M4A, FLAC. Extrae carátulas y metadatos completos sin shellouts a `ffprobe`. Lo usa el endpoint de upload de tracks.

### @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner

**Justificación:** compatible con MinIO (dev) y Cloudflare R2 (prod). URLs firmadas evitan exponer credenciales al cliente para streaming/download de audio. No usamos un wrapper porque el SDK oficial es estable y bien tipado.

### @nestjs/throttler

**Justificación:** rate limiting decorativo por ruta/usuario. Crítico para:

- `/auth/login` — anti brute force.
- `/ai/suggest` — limitar costo Anthropic por usuario/día.

### @nestjs/schedule

**Justificación:** decorator `@Cron` para tareas recurrentes (agregar stats diarios, limpiar refresh tokens expirados). Más simple que orquestar todo en BullMQ cuando no se necesitan retries.

### bcryptjs

**Justificación:** hashing de passwords (cost 10 por defecto). `bcryptjs` (no `bcrypt`) elimina la dependencia nativa que rompe en Alpine/musl. La diferencia de velocidad es despreciable para nuestro volumen.

---

## 3. Frontend Web + Desktop — React + Electron

### React 19 + TypeScript 5 + Vite

**Justificación combinada:**

- **React 19** — server components (futuro), nuevos hooks (`useOptimistic`, `useFormStatus`), patrones modernos sin reescribir.
- **TypeScript 5** — tipos compartidos con backend vía `packages/shared`.
- **Vite** — HMR <100ms, bundling esbuild en dev + Rollup en prod, plugin ecosystem rico (PWA, Electron). Alternativa Webpack: 5-10x más lento en dev sin ganancia clara.

### Electron 30+

**Justificación:** mismo código React empaqueta como app desktop nativa. La alternativa Tauri (Rust) tiene un footprint 5x menor pero:

1. Plugins de audio en Rust son menos maduros para Web Audio API equivalente.
2. Curva de aprendizaje Rust desvía del foco (la app, no la shell).
3. Electron tiene `electron-updater` listo para auto-update; en Tauri es manual.

**Hardening obligatorio:**

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- Preload mínimo con `contextBridge.exposeInMainWorld('electronAPI', ...)`.

### electron-builder

**Justificación:** empaquetado para Windows (.exe NSIS), macOS (.dmg notarizado), Linux (.deb/.AppImage). Soporta auto-update con feed propio.

### Zustand

**Justificación:** estado global mínimo (auth session, player state, current EQ). Bundle ~1kB vs Redux ~10kB + sus middlewares.

**Por qué no Redux:** boilerplate desproporcionado para nuestro tamaño de estado. RTK alivia pero sigue siendo más conceptos (slices, thunks, selectors).
**Por qué no Jotai/Recoil:** atómico es genial pero overkill para 4-5 stores globales.
**Por qué no Context API puro:** re-renders no granulares; Zustand permite seleccionar slices.

### TanStack Query (React Query)

**Justificación:** cache de datos server-side con invalidación, refetch, optimistic updates, suspense. Reemplaza ~80% del estado global que sería redundante guardar en Zustand (todo lo que viene del API).

**Patrón en este proyecto:** Zustand = estado del cliente (UI, sesión, player). TanStack Query = estado del servidor (tracks, playlists, eq configs, ai requests).

### Axios

**Justificación:** interceptors para refresh token automático, transformación de respuestas, manejo uniforme de errores. `fetch` puro requiere reescribir esa lógica.

### React Router 6

**Justificación:** estándar; soporte de loaders/actions, layouts anidados (perfecto para shells admin/cliente diferenciados de E16), nested routes con `<Outlet>`.

### TailwindCSS 3 + shadcn/ui

**Justificación combinada:**

- **Tailwind** — utilidades atómicas, JIT, sin CSS hand-written, design tokens en `tailwind.config`.
- **shadcn/ui** — componentes copiados al repo (no instalados como dep), totalmente editables, accesibles por defecto (Radix UI por debajo).

**Por qué no MUI/Chakra:** opinionados visualmente; difícil customizar para un look "audio pro" oscuro y minimalista. shadcn nos da los building blocks accesibles sin imponer estética.

### Radix UI Primitives

**Justificación:** vienen incluidos por shadcn; resuelven a11y compleja (popovers, dropdowns, focus traps, ARIA roles) sin reinventar.

### lucide-react

**Justificación:** set de iconos tree-shakeable; consistente con la estética minimal. Alternativa Heroicons también válida pero Lucide tiene mayor cobertura.

### wavesurfer.js (PB-101)

**Justificación:** waveform interactivo sobre `<canvas>` con regions (segmentos), zoom, scroll. Lo decisivo: permite plugins de regions arrastrables que mapean 1:1 a `EQSegment.startMs/endMs`. Construirlo desde cero llevaría semanas.

### recharts

**Justificación:** gráficas declarativas sobre SVG, suficientes para el dashboard admin (sparklines, área, barras). Más liviano que Highcharts/Chart.js para nuestros usos.

### Workbox + Vite PWA Plugin

**Justificación:** service worker generado con estrategias declarativas (stale-while-revalidate para API, cache-first para assets). Convierte la web en PWA instalable y le da modo offline básico.

### Dexie.js (PB-087)

**Justificación:** wrapper de IndexedDB con API tipo Promise + Liveness queries. Necesario para cache local en navegador (no podemos usar SQLite sin WASM o nativo). Schema migrations versionadas, hooks de cambio.

### File System Access API + fallback `<input type="file">`

**Justificación:** Chrome/Edge soportan el API nativo (lectura/escritura de carpetas); fallback en Safari/Firefox con `<input>` multi-file. La abstracción `platform/web/fileSystem.ts` esconde la diferencia.

---

## 4. Frontend Mobile — Flutter

### Flutter 3.x + Dart 3

**Justificación:** UI nativa a 60fps en Android e iOS con un solo código base; widgets propios (no bridge a UIKit/Compose) eliminan diferencias visuales. Es la opción más madura para apps que necesitan rendimiento gráfico y plugins nativos profundos (audio).

**Por qué no React Native:**

1. Bridge JS↔nativo añade latencia (problema con audio en tiempo real).
2. Ecosistema de plugins de audio menos maduro (`react-native-track-player` vs `just_audio` + `audio_service`).
3. Hot reload de Flutter es más rápido y consistente.

**Por qué no nativo separado (Kotlin + Swift):** duplica trabajo de mantener UI/lógica en dos lenguajes; el tesista trabaja solo o en equipo chico.

### Riverpod 2

**Justificación:** state management reactivo, compile-safe (no string-based como Provider), code generation para reducir boilerplate. Mejor que Bloc para apps no-event-driven.

### just_audio + audio_service

**Justificación:** par estándar para reproducción nativa con notificación persistente y controles en lockscreen / Android Auto / CarPlay. Soporte para gapless, crossfade y streams remotos.

### EQ nativo via plugin custom

**Justificación:** Android `AudioEffect.Equalizer` + iOS `AVAudioUnitEQ` son nativos y dan baja latencia. Hacerlo en Dart sería 10x más lento.

### Drift (SQLite)

**Justificación:** ORM type-safe para SQLite local en mobile; mirror del schema Prisma para la lógica de sync delta. Migrations versionadas.

### Dio

**Justificación:** HTTP client con interceptors equivalentes a Axios (refresh token, error handling). `http` package estándar es muy básico.

### go_router

**Justificación:** routing declarativo con soporte de deep links, redirects guards y type-safe. Estándar recomendado por el equipo de Flutter.

---

## 5. Persistencia y caché — resumen cruzado

| Capa                | Tecnología                | Por qué aquí                          |
| ------------------- | ------------------------- | ------------------------------------- |
| BD principal        | PostgreSQL 16             | JSON + FTS + transacciones            |
| Cache + queue       | Redis 7 + BullMQ          | Cache de hot endpoints + jobs         |
| Object storage dev  | MinIO                     | API S3 sin coste, contenedor local    |
| Object storage prod | Cloudflare R2             | Sin egress fees, API S3 compatible    |
| Desktop local       | SQLite via better-sqlite3 | Sync nativa rápida (Electron)         |
| Web local           | IndexedDB via Dexie       | Único storage en navegador con cuota  |
| Mobile local        | SQLite via Drift          | Equivalente al desktop con ORM tipado |

---

## 6. Audio y procesamiento de señal

### Web (Web Audio API)

**Justificación:** API nativa del navegador para audio en tiempo real. Permite construir un grafo de nodos:

```
<audio> source → AudioContext.createMediaElementSource()
  → BiquadFilterNode x10 (10 bandas)
  → GainNode (bass boost, master)
  → ConvolverNode (reverb por impulse response)
  → AnalyserNode (visualizador)
  → AudioContext.destination
```

**Latencia típica:** 5-20 ms — cumple el SLA de PB-094.
**Pitfall conocido:** Safari iOS requiere `AudioContext` creado por gesto del usuario; ya manejado en el hook `usePlayerEngine`.

### Mobile

Para Android y iOS no se usa Web Audio. Se usa el equalizer nativo del sistema vía un plugin de Flutter custom. Misma curva de EQ se envía como configuración por banda.

### Reverb (ConvolverNode)

**Justificación:** simula salas con respuestas al impulso (.wav cortos). Los presets `SMALL_ROOM`, `LARGE_HALL`, `CATHEDRAL` apuntan a archivos en `assets/impulses/`.

### Detección de segmentos (futuro PB-101)

**Plan:** llamar a la API de Anthropic con metadata (BPM, duración, género) — Claude infiere estructura. Análisis DSP local (con `essentia.js`) queda como opción si la calidad de Claude no convence.

---

## 7. IA — integración con Claude

### Modelo elegido — Claude Haiku 4.5 / Sonnet 4

**Justificación:**

- **Haiku** para suggestions rápidas (latencia <2s, costo bajo) — uso por defecto en plan free.
- **Sonnet** para detección de segmentos y razonamiento más complejo — uso en premium o cuando el admin lo configura.

El switch lo controla el admin desde PB-106.

### Por qué Anthropic Claude vs alternativas

|                                       | Claude            | GPT-4     | Llama hosted   |
| ------------------------------------- | ----------------- | --------- | -------------- |
| Calidad razonamiento musical (curado) | ✅ Alta           | ✅ Alta   | ⚠️ Variable    |
| Costo por 1M tokens                   | ✅ Bajo (Haiku)   | ⚠️ Medio  | ✅ Bajo        |
| Latencia p95 (cita)                   | ✅ <2s Haiku      | ⚠️ 3-5s   | Depende host   |
| Output estructurado (tool use)        | ✅ Nativo         | ✅ Nativo | ⚠️ Prompt-only |
| Privacidad de prompts                 | ✅ Política clara | ✅        | Depende        |

### Prompt caching

**Justificación:** el system prompt (PB-042) es largo (~1000 tokens) y se reusa en cada request. Anthropic permite cachearlo y reducir el costo 90% del input repetido. Implementación en PB-109.

### Validación de respuesta

**Justificación:** Claude devuelve JSON pero ningún LLM es 100% confiable. Validamos con `class-validator` el shape antes de aplicar al EQ. Si falla, se hace un retry pidiendo corrección.

---

## 8. Monorepo y herramientas de build

### pnpm 9

**Justificación:** instalación 2-3x más rápida que npm, content-addressable store (sin duplicación entre apps), soporte nativo de workspaces (`workspace:*`).

### Turborepo 2 (pinned por CVE-2025-36852)

**Justificación:** cache de tareas inteligente (no rebuild si nada cambió en el subgrafo de archivos relevantes). Pipelines declarativos en `turbo.json`. Reduce CI time ~70% en ejecuciones cacheables.

### Workspaces compartidos

- `@musicflow/shared` → tipos TS, constantes (EQ_FREQUENCIES), utilities (time formatting).
- `@musicflow/ui` → componentes shadcn/ui copiados, usables desde web y desktop.
- `@musicflow/config` → tsconfig base, ESLint config, Prettier config compartidos.
- `@musicflow/audio-core` → motor de audio (Web Audio) usable en web + electron.

### Husky + lint-staged

**Justificación:** pre-commit hooks que corren Prettier solo sobre archivos staged. Evita commits con código sin formatear.

---

## 9. Calidad, testing y CI/CD

### Jest + Supertest (backend)

**Justificación:** estándar para Nest; Supertest permite tests E2E contra la app montada sin levantar HTTP server.

### Vitest + React Testing Library (web)

**Justificación:** Vitest es API-compatible con Jest pero usa Vite — mismos transforms que dev, sin doble configuración.

### Playwright (E2E web + electron)

**Justificación:** corre contra browser real y soporta Electron como target nativo. Un mismo test suite cubre web y desktop.

### flutter_test + integration_test (mobile)

**Justificación:** estándares oficiales.

### GitHub Actions

**Justificación:** integrado con el repo, ya hay Actions configuradas (`.github/workflows`). Free tier suficiente para tesis.

### Dependabot

**Justificación:** PRs automáticos para bumps de seguridad — clave porque ya tenemos dos CVEs activos (CVE-2025-55305 NestJS, CVE-2025-36852 Turbo).

---

## 10. Seguridad y configuración

### @nestjs/config

**Justificación:** parsing de `.env` tipado con validación al boot — si falta `JWT_SECRET`, el servidor no arranca (mejor que descubrirlo en producción).

### JWT con refresh rotativo

**Decisión clave:** access token corto (15 min) en memoria + refresh largo (7 días) en cookie `httpOnly` `Secure` `SameSite=Strict`. Refresh tokens se rotan en cada uso — si un refresh viejo se reutiliza, asumimos robo y revocamos toda la familia.

### CORS estricto

**Justificación:** `CORS_ORIGINS` en `.env` solo permite `localhost:5173` en dev. En prod, lista blanca de dominios.

### Content-type validation (CVE-2025-55305)

**Justificación:** middleware que rechaza requests no-JSON para endpoints JSON — mitigación del CVE de NestJS reportado.

### PgBouncer ≥ 1.21 (decisión documentada)

**Justificación:** versiones anteriores rompen las prepared statements de Prisma. Si se usa pooling en prod, pinear la versión.

### Helmet (a añadir)

**Justificación:** headers de seguridad (CSP, HSTS, X-Content-Type-Options). Pendiente de incorporación a `main.ts`.

---

## 11. Librerías auxiliares por categoría

### Backend

| Librería                                | Versión | Para qué                                            |
| --------------------------------------- | ------- | --------------------------------------------------- |
| `uuid`                                  | ^9      | Generación de IDs cuando no usamos `cuid` de Prisma |
| `nodemailer` + `@nestjs-modules/mailer` | ^8      | Envío de email (verify, reset password)             |
| `handlebars`                            | ^4      | Templates de email                                  |
| `reflect-metadata`                      | ^0.2    | Requerido por NestJS para decoradores               |
| `rxjs`                                  | ^7      | Streams de NestJS (no es Observable everywhere)     |

### Frontend Web

| Librería                     | Para qué                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| `axios`                      | Cliente HTTP con interceptors                                |
| `clsx` + `tailwind-merge`    | Composición de clases Tailwind sin duplicados                |
| `date-fns` o `dayjs`         | Formato de fechas pequeño y tree-shakeable                   |
| `zod`                        | Validación cliente-side de respuestas API (defense in depth) |
| `react-hook-form` (opcional) | Formularios complejos del admin                              |

### Mobile

| Librería                 | Para qué                         |
| ------------------------ | -------------------------------- |
| `hive`                   | Key-value local para settings    |
| `flutter_secure_storage` | Tokens JWT en Keystore/Keychain  |
| `on_audio_query`         | Escaneo de audio del dispositivo |
| `palette_generator`      | Tema dinámico desde carátula     |

---

## 12. Tecnologías descartadas y por qué

| Tecnología        | Por qué se evaluó         | Por qué se descartó                                                                      |
| ----------------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| **Tauri**         | Footprint mínimo, Rust    | Ecosistema de audio inmaduro; sale de la zona del equipo                                 |
| **Solid.js**      | Más rápido que React      | Comunidad menor, ecosistema shadcn no portado                                            |
| **Drizzle ORM**   | Más rápido que Prisma     | Madurez menor; migraciones más manuales                                                  |
| **GraphQL**       | Schema fuerte             | Endpoints ya estables, REST + Swagger suficiente; overhead de aprendizaje no justificado |
| **React Native**  | Web + Mobile mismo código | Bridge JS↔nativo es ruido para audio; Flutter más maduro para audio nativo               |
| **Bun runtime**   | Speed                     | NestJS no soporta oficialmente Bun en prod; riesgos no compensan                         |
| **MongoDB**       | Schemaless                | Modelo es relacional; perderíamos transacciones                                          |
| **OpenAI GPT**    | Calidad similar           | Costo mayor por token y latencia p95 peor en nuestros benchmarks                         |
| **AWS S3** (prod) | Estándar                  | Cloudflare R2 tiene mismo API sin egress fees → ~5x más barato a escala                  |

---

## Conclusión

La elección global busca **un solo lenguaje (TS) compartido entre backend y dos frontends de los tres**, **un ORM con seguridad de tipos**, **un framework de UI con accesibilidad por defecto**, y **un proveedor de IA con costos predecibles**. Las únicas concesiones a esta unidad son:

- Flutter/Dart en mobile (razón: rendimiento de audio nativo).
- Plugin custom de EQ en mobile (razón: latencia <20 ms inalcanzable con Web Audio Wrapper).

Toda otra dependencia tiene un mantenedor activo, releases en los últimos 6 meses, y es reemplazable sin reescribir más del 10% del código gracias a las abstracciones en `packages/shared` y `apps/web/src/platform`.
