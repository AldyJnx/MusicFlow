# Pruebas de carga de MusicFlow

`apps/backend/load-tests/api-load.js` usa k6 para medir la API. Una prueba de
10 000 VUs significa 10 000 usuarios virtuales concurrentes, no necesariamente
10 000 conexiones TCP ni 10 000 solicitudes por segundo. Con el intervalo por
defecto de cinco segundos, cada usuario ejecuta aproximadamente 0,2 iteraciones
por segundo; si se entrega el token de prueba, cada iteración hace dos lecturas.

## Antes de ejecutar

- Ejecuta contra local, staging o un entorno autorizado. Nunca contra producción
  sin una ventana de pruebas y aprobación explícita.
- Asegura que `/api/health` responde y que PostgreSQL y Redis están disponibles.
- Para incluir catálogo autenticado, crea una cuenta de prueba y exporta un JWT
  de corta vida como `AUTH_TOKEN`; nunca lo guardes en archivos ni terminales
  compartidos.
- Durante la prueba captura `docker stats --no-stream`, conexiones PostgreSQL,
  métricas Redis y logs de errores. k6 por sí solo no mide CPU, RAM ni pool DB.
- El limitador global protege la aplicación real. En el entorno aislado de
  carga, súbelo temporalmente (por ejemplo `THROTTLE_LIMIT=1000000`) o el
  resultado medirá bloqueos 429, no capacidad. Nunca desactives esa protección
  en producción para ejecutar una prueba.

## Ejecutar con Docker

Desde la raíz del repositorio, PowerShell:

```powershell
$workspace = (Get-Location).Path
docker run --rm -i -v "${workspace}:/work" -e BASE_URL=http://host.docker.internal:8000/api -e TARGET_VUS=10000 -e RAMP_UP=10m -e HOLD_DURATION=15m -e RAMP_DOWN=5m -e REQUEST_INTERVAL_SECONDS=5 grafana/k6 run /work/apps/backend/load-tests/api-load.js
```

Para una prueba autenticada añade `-e AUTH_TOKEN=$env:MUSICFLOW_LOAD_TOKEN`.
En Windows, `host.docker.internal` permite que el contenedor de k6 llegue al
backend local. Para un staging HTTPS reemplaza `BASE_URL` por su URL pública.

20k y 30k usan el mismo comando cambiando `TARGET_VUS`. No asumas que una sola
laptop puede generar esa carga: distribuye k6 entre varios generadores o usa
k6 Cloud. El límite observado de una sola máquina mide el generador, no la
capacidad de MusicFlow.

## Criterio inicial de estabilidad

Una ejecución pasa provisionalmente si, durante la fase estable:

| Métrica                   | Objetivo                                              |
| ------------------------- | ----------------------------------------------------- |
| `http_req_failed`         | menor de 1%                                           |
| `checks`                  | mayor de 99%                                          |
| latencia p95              | menor de 800 ms                                       |
| latencia p99              | menor de 2 s                                          |
| CPU/RAM y pool PostgreSQL | sin saturación sostenida                              |
| Redis y logs              | sin desconexiones, timeouts ni errores 5xx sostenidos |

El RPS real aparece en el resumen de k6. Registra junto al resultado el commit,
la configuración de VUs/intervalos, tamaño de base de datos, CPU/RAM del host,
pool Prisma y versión de la imagen. Sin esos datos no se puede afirmar una
capacidad de producción.

## Rendimiento web

Lighthouse evalúa entrega y experiencia de una sesión web; no representa 10k
usuarios. Úsalo junto a k6 para completar el diagnóstico:

```powershell
pnpm --filter web run build
pnpm --filter web run preview -- --host 127.0.0.1
pnpm dlx lighthouse http://127.0.0.1:4173 --only-categories=performance --only-categories=accessibility --only-categories=best-practices --only-categories=seo --output=html --output-path=./artifacts/lighthouse.html
```

Haz tres ejecuciones tras una carga de calentamiento y toma la mediana de
Performance, LCP, INP/TBT, CLS, transferencia y solicitudes fallidas. Usa React
Profiler únicamente si Lighthouse o una interacción concreta apunta a renders
excesivos; el Profiler explica qué componente renderiza, Lighthouse mide el
resultado para el usuario.
