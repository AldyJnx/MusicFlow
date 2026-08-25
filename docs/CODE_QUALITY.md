# Calidad de código de MusicFlow

Las comprobaciones locales evitan defectos diferentes. Prettier detecta formato,
ESLint detecta reglas estáticas, TypeScript comprueba tipos, Jest comprueba
comportamiento y Playwright valida flujos web. Ninguna por sí sola sustituye a
las demás.

## Comandos no destructivos

```powershell
# Backend
pnpm --filter @musicflow/backend exec prettier --check "src/**/*.ts" "test/**/*.ts"
pnpm --filter @musicflow/backend exec eslint "{src,apps,libs,test}/**/*.ts" --max-warnings=0
pnpm --filter @musicflow/backend run typecheck
pnpm --filter @musicflow/backend run test -- --runInBand
pnpm --filter @musicflow/backend run test:cov -- --runInBand

# Web
pnpm --filter web exec prettier --check "src/**/*.{ts,tsx}"
pnpm --filter web run lint -- --max-warnings=0
pnpm --filter web run build
pnpm --filter web run test:e2e

# Cambios sin espacios o marcadores de conflicto
git diff --check
```

El script `lint` del backend actual usa `--fix`; por eso se invoca ESLint de
forma directa en la auditoría para no modificar código al medir calidad.

## Parámetros a seguir

| Indicador                                | Umbral inicial                   |
| ---------------------------------------- | -------------------------------- |
| Errores Prettier, ESLint, TypeScript     | 0                                |
| Tests relevantes                         | 100% pasan                       |
| Cobertura de líneas en código modificado | 80% o más                        |
| Cobertura de ramas en código modificado  | 70% o más                        |
| Autorización, pagos y mutaciones         | Pruebas focalizadas obligatorias |
| Vulnerabilidades/bloqueadores nuevos     | 0                                |

La cobertura global es una línea base, no una excusa: un archivo crítico puede
tener 100% de líneas y aún no probar permisos o casos de error.

## SonarQube opcional

SonarQube concentra deuda, complejidad, duplicación, cobertura y vulnerabilidades
en una Quality Gate. Requiere una instancia accesible, un `SONAR_TOKEN` y una
clave de proyecto propia; no hay token ni servidor en este repositorio, por lo
que no se deben inventar resultados.

Ejemplo de escaneo después de generar cobertura:

```powershell
$env:SONAR_HOST_URL = "https://sonar.tu-dominio.com"
$env:SONAR_TOKEN = "token-secreto-no-versionado"
pnpm dlx sonar-scanner -Dsonar.projectKey=musicflow -Dsonar.sources=apps/backend/src,apps/web/src -Dsonar.tests=apps/backend/src,apps/web/e2e -Dsonar.javascript.lcov.reportPaths=apps/backend/coverage/lcov.info
```

Configura la Quality Gate para fallar ante bugs o vulnerabilidades nuevas de
severidad blocker/critical, hotspots sin revisar, cobertura nueva menor a los
umbrales acordados y duplicación nueva no justificada. Integra el comando en CI
solo cuando el token se guarde como secreto del proveedor de CI.
