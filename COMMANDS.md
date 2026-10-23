# Comandos de MusicFlow

Referencia operativa de los comandos disponibles en el repositorio. Salvo que
se indique otro directorio, ejecútalos desde la raíz de `MusicFlow`.

## Requisitos

- Node.js 20 o superior.
- pnpm 9 (`packageManager: pnpm@9.0.0`).
- Docker Desktop para PostgreSQL, Redis y MinIO locales.
- Flutter estable para `apps/mobile/`.
- Chrome/Chromium para Playwright y Lighthouse.
- k6 instalado únicamente para pruebas de carga.

No incluyas secretos en comandos, archivos versionados ni resultados de
pruebas. Usa `.env`, variables del entorno o secretos del CI.

## Proyecto completo

1. Instalar las dependencias del monorepo:

   ```powershell
   pnpm install --frozen-lockfile
   ```

2. Ejecutar en desarrollo los workspaces que tengan un script `dev`:

   ```powershell
   pnpm run dev
   ```

3. Compilar todos los workspaces:

   ```powershell
   pnpm run build
   ```

4. Ejecutar las verificaciones globales disponibles:

   ```powershell
   pnpm run lint
   pnpm run typecheck
   pnpm run test
   pnpm run test:e2e
   git diff --check
   ```

5. Formatear los archivos compatibles del repositorio:

   ```powershell
   pnpm run format
   ```

   Este comando modifica archivos. Para comprobar formato sin modificar:

   ```powershell
   pnpm exec prettier --check "**/*.{ts,tsx,js,jsx,json,md}"
   ```

## Infraestructura local

1. Levantar PostgreSQL, Redis y MinIO sin iniciar las aplicaciones:

   ```powershell
   docker compose up -d db redis minio
   ```

2. Consultar el estado y los logs:

   ```powershell
   docker compose ps
   docker compose logs -f db redis minio
   ```

3. Detener los contenedores conservando sus volúmenes:

   ```powershell
   docker compose stop db redis minio
   ```

4. Levantar también backend y web mediante Docker para desarrollo:

   ```powershell
   docker compose up -d --build
   ```

> `docker-compose.prod.yml` todavía describe una arquitectura Django/Celery
> antigua y no corresponde al backend NestJS actual. No debe usarse para un
> despliegue de MusicFlow hasta que sea reemplazado.

## Backend (`apps/backend/`)

Los comandos de esta sección pueden ejecutarse desde `apps/backend/`. Desde la
raíz, antepón `pnpm --filter @musicflow/backend` al script.

### Ejecución

1. Iniciar NestJS en desarrollo con recarga automática:

   ```powershell
   cd apps/backend
   pnpm run start:dev
   ```

2. Iniciar NestJS en modo normal. Solo verifica y aplica migraciones pendientes;
   no regenera Prisma ni recompila en cada inicio, por lo que usa el último
   `dist/` validado:

   ```powershell
   pnpm run start
   ```

   Para preparar explícitamente Prisma, migraciones y `dist/` antes de abrir el
   servidor, por ejemplo antes de una entrega local o cuando cambie el schema:

   ```powershell
   pnpm run start:verified
   ```

3. Iniciar con el depurador de Node:

   ```powershell
   pnpm run start:debug
   ```

4. Iniciar producción. `prestart:prod` aplica únicamente migraciones
   pendientes; el artefacto debe haber sido compilado por CI antes del despliegue:

   ```powershell
   pnpm run start:prod
   ```

### Prisma y base de datos

1. Generar Prisma Client:

   ```powershell
   pnpm run prisma:generate
   ```

2. Crear y aplicar una migración durante desarrollo:

   ```powershell
   pnpm exec prisma migrate dev --name nombre_descriptivo
   ```

3. Aplicar migraciones ya versionadas:

   ```powershell
   pnpm run prisma:migrate:deploy
   ```

4. Cargar los datos semilla:

   ```powershell
   pnpm run prisma:seed
   ```

5. Abrir Prisma Studio:

   ```powershell
   pnpm run prisma:studio
   ```

### Calidad y pruebas

1. Comprobar tipos y compilar:

   ```powershell
   pnpm run typecheck
   pnpm run build
   ```

2. Comprobar formato sin modificar archivos:

   ```powershell
   pnpm exec prettier --check "src/**/*.ts" "test/**/*.ts"
   ```

3. Comprobar ESLint sin aplicar correcciones:

   ```powershell
   pnpm exec eslint "{src,apps,libs,test}/**/*.ts"
   ```

4. Aplicar formato o correcciones de ESLint:

   ```powershell
   pnpm run format
   pnpm run lint
   ```

5. Ejecutar las pruebas unitarias, una suite focalizada o modo observación:

   ```powershell
   pnpm run test
   pnpm run test -- catalog.service.spec.ts
   pnpm run test:watch
   ```

6. Ejecutar cobertura y pruebas E2E:

   ```powershell
   pnpm run test:cov
   pnpm run test:e2e
   ```

7. Depurar una prueba Jest:

   ```powershell
   pnpm run test:debug -- catalog.service.spec.ts
   ```

### Catálogo y Cloudflare R2

Estos comandos necesitan las variables de PostgreSQL y R2 configuradas en
`apps/backend/.env`.

1. Importar desde R2 únicamente objetos de audio nuevos o modificados:

   ```powershell
   pnpm run seed:r2
   ```

2. Ejecutar una reconciliación completa, incluyendo objetos retirados de R2:

   ```powershell
   pnpm run seed:r2 -- --full
   ```

3. Enriquecer catálogo, letras y álbumes:

   ```powershell
   pnpm run seed:enrich
   pnpm run seed:lyrics
   pnpm run seed:albums
   ```

4. Validar y reparar relaciones del catálogo:

   ```powershell
   pnpm run validate:catalog
   pnpm run repair:featuring
   pnpm run repair:featuring:apply
   pnpm run backfill:catalog
   ```

   `repair:featuring` muestra una vista previa sin modificar PostgreSQL.
   Revísala antes de ejecutar `repair:featuring:apply`, que reasigna las pistas
   heredadas y sus álbumes cuando todas las pistas del álbum se resuelven al
   mismo artista registrado.

5. Simular y aplicar la migración segura de objetos legacy
   `catalog/<UUID>` hacia `Artista - Canción.ext`:

   ```powershell
   pnpm run repair:r2-catalog-keys
   pnpm run repair:r2-catalog-keys -- --apply --keep-source
   pnpm run repair:r2-catalog-keys -- --apply
   pnpm run repair:r2-catalog-keys -- --apply --prune-orphans
   pnpm run repair:r2-catalog-keys -- --source-key="catalog/UUID.wav" --artist="Artista" --title="Canción"
   pnpm run repair:r2-catalog-keys -- --check-key="Artista - Canción.wav"
   pnpm run repair:r2-catalog-keys -- --search="Canción"
   ```

   El modo sin `--apply` no modifica R2 ni PostgreSQL. Los objetos legacy que
   no estén referenciados por una canción se reportan y permanecen intactos,
   salvo que se solicite explícitamente `--prune-orphans` después de revisar la
   simulación.

   Usa `--keep-source` para copiar y verificar la clave canónica sin eliminar
   el objeto original; es la opción indicada cuando aún no se autorizó una
   eliminación permanente.

   El mapeo manual exige los tres argumentos `--source-key`, `--artist` y
   `--title`; primero ejecútalo sin `--apply` y revisa el destino mostrado.

6. Generar picos de waveform, reflejar letras e inspeccionar R2:

   ```powershell
   pnpm run peaks:backfill
   pnpm run mirror:lyrics
   pnpm run r2:inventory
   ```

### Pruebas de carga con k6

Ejecuta carga solo contra local o staging autorizado. Verifica primero
`<BASE_URL>/health`; no uses producción de forma predeterminada. El script usa
rampa, pausa entre peticiones y umbrales de error `<1 %`, p95 `<800 ms` y p99
`<2 s`.

1. Prueba local pequeña y resumen JSON:

   ```powershell
   $env:BASE_URL="http://localhost:8000/api"
   $env:TARGET_VUS="10"
   $env:RAMP_UP="30s"
   $env:HOLD_DURATION="1m"
   $env:RAMP_DOWN="30s"
   k6 run --summary-export=load-tests/summary-10.json load-tests/api-load.js
   ```

2. Añadir una lectura autenticada usando un token de prueba de corta duración:

   ```powershell
   $env:AUTH_TOKEN="TOKEN_DE_PRUEBA"
   k6 run --summary-export=load-tests/summary-auth.json load-tests/api-load.js
   Remove-Item Env:AUTH_TOKEN
   ```

3. Escenarios de capacidad para staging autorizado:

   ```powershell
   $env:TARGET_VUS="10000"
   k6 run --summary-export=load-tests/summary-10k.json load-tests/api-load.js

   $env:TARGET_VUS="20000"
   k6 run --summary-export=load-tests/summary-20k.json load-tests/api-load.js

   $env:TARGET_VUS="30000"
   k6 run --summary-export=load-tests/summary-30k.json load-tests/api-load.js
   ```

   Para 10k o más usuarios virtuales suele ser necesario un generador k6
   distribuido; un equipo local saturado no representa el límite del servidor.

## Web (`apps/web/`)

Los comandos pueden ejecutarse desde `apps/web/` o desde la raíz usando
`pnpm --filter web`.

### Ejecución y build

1. Iniciar Vite en desarrollo:

   ```powershell
   cd apps/web
   pnpm run dev
   ```

2. Compilar TypeScript y generar el build de producción:

   ```powershell
   pnpm run build
   ```

3. Servir localmente el build producido:

   ```powershell
   pnpm run preview -- --host 127.0.0.1 --port 4173
   ```

4. Regenerar iconos PWA o comprimir imágenes cuando cambien esos recursos:

   ```powershell
   pnpm run pwa-icons
   pnpm run compress-images
   ```

### Calidad y pruebas

1. Comprobar TypeScript sin generar el bundle y ejecutar ESLint:

   ```powershell
   pnpm exec tsc -b
   pnpm run lint
   ```

2. Comprobar formato sin modificar archivos:

   ```powershell
   pnpm exec prettier --check "src/**/*.{ts,tsx}" "e2e/**/*.ts"
   ```

3. Instalar Chromium de Playwright la primera vez y ejecutar todos los E2E:

   ```powershell
   pnpm exec playwright install chromium
   pnpm run test:e2e
   ```

4. Ejecutar solo un navegador, archivo o prueba concreta:

   ```powershell
   pnpm run test:e2e -- --project=chromium
   pnpm run test:e2e -- e2e/auth.spec.ts --project=chromium
   pnpm run test:e2e -- --grep "texto de la prueba"
   ```

5. Abrir la interfaz interactiva de Playwright:

   ```powershell
   pnpm exec playwright test --ui
   ```

### Rendimiento web con Lighthouse

Con `pnpm run preview` activo, ejecuta tres muestras después de una visita de
calentamiento y compara la mediana de rendimiento, LCP, TBT/INP, CLS, tamaño
transferido y solicitudes fallidas.

```powershell
pnpm dlx lighthouse http://127.0.0.1:4173 --output=json --output-path=lighthouse-1.json --chrome-flags="--headless"
pnpm dlx lighthouse http://127.0.0.1:4173 --output=json --output-path=lighthouse-2.json --chrome-flags="--headless"
pnpm dlx lighthouse http://127.0.0.1:4173 --output=json --output-path=lighthouse-3.json --chrome-flags="--headless"
```

Lighthouse mide entrega y experiencia de una página; no sustituye las pruebas
de concurrencia de API realizadas con k6.

## Mobile (`apps/mobile/`)

Ejecuta esta sección desde `apps/mobile/`.

### Preparación y ejecución

1. Comprobar Flutter, listar dispositivos e instalar dependencias:

   ```powershell
   cd apps/mobile
   flutter doctor -v
   flutter devices
   flutter pub get
   ```

2. Ejecutar con la configuración de desarrollo versionada:

   ```powershell
   flutter run --dart-define-from-file=config/development.json
   ```

3. Ejecutar en emulador Android apuntando al backend del host:

   ```powershell
   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000/api
   ```

4. Seleccionar un dispositivo concreto:

   ```powershell
   flutter run -d ID_DEL_DISPOSITIVO --dart-define-from-file=config/development.json
   ```

### Generación, calidad y pruebas

1. Regenerar código de Freezed, JSON y Riverpod:

   ```powershell
   dart run build_runner build --delete-conflicting-outputs
   ```

2. Comprobar formato y análisis estático sin modificar archivos:

   ```powershell
   dart format --output=none --set-exit-if-changed lib test integration_test
   dart analyze lib test integration_test
   ```

3. Aplicar formato:

   ```powershell
   dart format lib test integration_test
   ```

4. Ejecutar todas las pruebas o una prueba de widgets concreta:

   ```powershell
   flutter test
   flutter test test/artist_onboarding_screen_test.dart
   ```

5. Ejecutar las pruebas de integración con un emulador o dispositivo activo:

   ```powershell
   flutter test integration_test
   ```

6. Generar iconos de la aplicación:

   ```powershell
   dart run flutter_launcher_icons
   ```

### Builds móviles

1. Generar APK de desarrollo o release:

   ```powershell
   flutter build apk --debug --dart-define-from-file=config/development.json
   flutter build apk --release --dart-define-from-file=config/production.json
   ```

2. Generar Android App Bundle firmado para distribución:

   ```powershell
   flutter build appbundle --release --dart-define-from-file=config/production.json
   ```

3. Generar iOS release desde macOS con firma configurada:

   ```powershell
   flutter build ios --release --dart-define-from-file=config/production.json
   ```

`config/production.json` y las credenciales de firma se crean fuera del
repositorio a partir de secretos. No uses los archivos `*.example.json` como
configuración real.

## Desktop Electron (`apps/web/`)

Electron reutiliza React/Vite de `apps/web/`. En desarrollo necesita dos
terminales:

1. Terminal 1, iniciar Vite:

   ```powershell
   pnpm --filter web run dev
   ```

2. Terminal 2, abrir Electron:

   ```powershell
   pnpm --filter web run electron
   ```

3. Usar otra URL de Vite cuando el puerto sea diferente:

   ```powershell
   $env:VITE_DEV_SERVER_URL="http://localhost:5174"
   pnpm --filter web run electron
   Remove-Item Env:VITE_DEV_SERVER_URL
   ```

4. Verificar la sintaxis de los procesos Electron y compilar el renderer:

   ```powershell
   node --check apps/web/electron/main.cjs
   node --check apps/web/electron/preload.cjs
   pnpm --filter web run build
   ```

5. Ejecutar las pruebas del renderer compartido:

   ```powershell
   pnpm --filter web run test:e2e -- --project=chromium
   ```

6. Generar el instalador convencional de Windows (`.exe`) en
   `apps/web/release/`:

   ```powershell
   pnpm --filter web run dist:win
   ```

   El artefacto se llama `MusicFlow-Setup-<version>.exe`. Electron Builder es
   el empaquetador de distribución activo; Electron Forge está instalado para
   mantener compatibilidad con su flujo de trabajo, pero no genera el release
   para evitar dos configuraciones de empaquetado en conflicto.

7. Generar los instalables de Linux o macOS:

   ```powershell
   # Linux x64: AppImage y .deb; ejecútalo en Linux o CI Ubuntu.
   pnpm --filter web run dist:linux

   # macOS universal: .dmg y .zip; ejecútalo en macOS o CI macOS.
   pnpm --filter web run dist:mac
   ```

   macOS debe compilarse en un runner macOS. Para distribución pública se
   necesita además firma y notarización de Apple; sin ellas el instalador se
   genera, pero Gatekeeper puede pedir una confirmación adicional.

8. Publicar el instalador como un activo descargable en GitHub Releases:

   ```powershell
   git tag desktop-v1.0.0
   git push origin desktop-v1.0.0
   ```

   La acción `Desktop Release` crea y adjunta los artefactos de Windows,
   macOS y Linux a la release `desktop-v1.0.0`. Antes de publicar para usuarios
   finales, configura firma de código de Windows y firma/notarización de Apple;
   sin ellas SmartScreen o Gatekeeper pueden mostrar advertencias.

## Selección rápida desde la raíz

```powershell
# Backend
pnpm --filter @musicflow/backend run start:dev
pnpm --filter @musicflow/backend run typecheck
pnpm --filter @musicflow/backend run test

# Web
pnpm --filter web run dev
pnpm --filter web run build
pnpm --filter web run test:e2e -- --project=chromium

# Electron
pnpm --filter web run electron
```

Flutter no pertenece al workspace pnpm; sus comandos se ejecutan dentro de
`apps/mobile/`.
