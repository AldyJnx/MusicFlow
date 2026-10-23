# Instrucciones del Asistente de IA NVIDIA (catálogo)

Documento de referencia del módulo de calidad de catálogo assisted por
`nvidia/nemotron-3-super-120b-a12b` (NVIDIA NIM).

El asistente **lee el catálogo, propone correcciones y las guarda como
hallazgos**. Nunca escribe en el catálogo por su cuenta: un administrador
revisa y aplica cada propuesta.

- Código: `apps/backend/src/modules/catalog-ai/`
- Migración: `apps/backend/prisma/migrations/20260927120000_catalog_ai/`
- Variables: `apps/backend/.env` y sus ejemplos

---

## 1. Qué es y qué no es

| Sí hace                                       | No hace                                         |
| --------------------------------------------- | ----------------------------------------------- |
| Detecta metadatos faltantes o incorrectos     | No inventa paths de audio ni sube archivos a R2 |
| Propone un valor concreto por hallazgo        | No escribe nunca en el catálogo sin aprobación  |
| Explica en español por qué propone cada valor | No devuelve texto de letras (derechos de autor) |
| Clasifica pistas en álbumes ya existentes     | No crea álbumes ni artistas nuevos              |
| Indica dónde buscar una foto oficial          | No devuelve URLs de imagen externas             |

La regla de oro: **propone, el administrador decide**.

---

## 2. Acceso: solo ADMIN

Todas las rutas cuelgan de `admin/catalog-ai` y están protegidas con
`JwtAuthGuard` + `RolesGuard` + `@Roles("ADMIN")`
(`catalog-ai.controller.ts:29-38`).

Esto es intencionado y no debe relaxarse:

- El asistente de usuario final vive en `/api/ai` y usa **Claude Haiku** con
  cuota mensual. No comparte nada con NVIDIA.
- NVIDIA usa **tablas propias** (`catalog_ai_runs`, `catalog_ai_findings`), no
  `ai_requests`, precisamente para no consumir la cuota de los usuarios ni
  contaminar el reporte `/admin/ai/costs`.
- Un usuario con rol `USER` recibe `403` en todas estas rutas.

---

## 3. Configuración

### Variables de entorno

| Variable                | Por defecto                           | Descripción                                      |
| ----------------------- | ------------------------------------- | ------------------------------------------------ |
| `NVIDIA_API_KEY`        | _(vacío)_                             | Clave `nvapi-`. **Vacía = función desactivada.** |
| `NVIDIA_AI_BASE_URL`    | `https://integrate.api.nvidia.com/v1` | Endpoint. Permite apuntar a un NIM propio.       |
| `NVIDIA_AI_MODEL`       | `nvidia/nemotron-3-super-120b-a12b`   | Modelo usado.                                    |
| `NVIDIA_AI_TIMEOUT_MS`  | `60000`                               | Timeout por petición.                            |
| `NVIDIA_AI_MAX_RETRIES` | `2`                                   | Reintentos ante 5xx / timeout / red.             |
| `CATALOG_AI_MAX_BATCH`  | `25`                                  | Ítems máximos por petición al modelo.            |

Los tres archivos de ejemplo (`.env.example`, `.env.staging.example`,
`.env.production.example`) ya los documentan. La clave **nunca** se versiona.

### Puesta en marcha

1. Crear una cuenta y una clave gratuita en
   <https://build.nvidia.com/settings/api-keys> (empieza con `nvapi-`).
2. Pegarla en `apps/backend/.env`:

   ```env
   NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxx
   ```

3. Aplicar la migración de las tablas nuevas:

   ```bash
   cd apps/backend
   pnpm exec prisma migrate deploy
   ```

   Sin este paso las rutas de corridas fallan porque las tablas no existen.
   `GET /api/admin/catalog-ai/status` sí funciona: solo cuenta con Prisma.

4. Reiniciar el backend.

> Si cambias `prisma/schema.prisma` mientras el backend corre, la regeneración
> del cliente de Prisma falla con `EPERM ... query_engine-windows.dll.node`.
> Detén primero el proceso `node dist/src/main.js`.

---

## 4. Las cuatro tareas

Las cuatro comparten el mismo ciclo: escaneo determinista → lotes → propuesta →
revisión humana.

### 4.1 `ALBUM_YEAR` — Año de lanzamiento

**Qué detecta:** álbumes con `year = null`.

**Qué recibe el modelo:** por álbum, el ID, el título, el artista, hasta 12
títulos de pistas y los años que esas pistas ya tienen
(`yearsFoundOnSiblingTracks`). Ese año es la señal local más fuerte, y se le
entrega en vez de dejarlo adivinar desde cero.

**Qué devuelve:** `albumId`, `year` (el esquema pide 1950–2026), `confidence`,
`reasoning`.

**Se puede aplicar:** sí, vía `CatalogService.updateAlbum`.

**Notas:** el prompt pide explícitamente que omita el álbum antes que inventar
un dato, y advierte que un vivo o un greatest hits puede tener un año distinto
al del estudio.

### 4.2 `TRACK_ALBUM_MATCH` — Asignación de pista a álbum

**Qué detecta:** pistas del catálogo con `albumId = null` y un `artistId` válido.

**Qué recibe el modelo:** por pista, el ID, título, artista, el campo de texto
`album` (suele venir de nombres de archivo en R2), duración, y hasta **10
álbumes candidatos del mismo artista** con hasta **50 pistas cada una** y su
`albumOrder`. El modelo elige entre esos candidatos y deduce la posición
contando las pistas conocidas.

**Qué devuelve:** `trackId`, `albumId`, `albumOrder` (≥ 1), `confidence`,
`reasoning`.

**Se puede aplicar:** sí, vía `CatalogService.assignTrack`. Esto actualiza de
forma transaccional `albumId`, `artistId` y `coverArt`, cumpliendo la
invariante de portada autoritativa de `MEMORY.md`.

**Filtro crítico:** el backend descarta cualquier `albumId` que **no** estuviera
en la lista de candidatos enviados. El modelo no puede inventar un álbum ni
asignar a un artista equivocado, y no se crean álbumes nuevos.

### 4.3 `MISSING_LYRICS` — Búsqueda de letras faltantes

**Qué detecta:** pistas del catálogo con `lyricsLrc` nulo o vacío.

**Qué recibe el modelo:** ID, título, artista, álbum, año y duración.

**Qué devuelve:** `trackId`, `searchHint` (consulta de búsqueda en español),
`isLikelyInstrumental`, `confidence`, `reasoning`.

**Se puede aplicar:** **no, es orientativo.** El hallazgo se marca `FAILED` con
un mensaje en español que explica que la letra se carga desde la ficha de la
pista.

**Por qué no se aplica:** el prompt prohíbe explícitamente que el modelo escriba
o copie texto de letra. El texto es material con derechos de autor y además el
modelo no lo reproduce de forma fiable. Lo útil aquí es la pista de búsqueda.

**Atajo útil:** si el modelo reconoce un instrumental conocido, marca
`isLikelyInstrumental: true` para que el administrador lo marque como tal y no
gaste tiempo buscándolo.

### 4.4 `MISSING_ARTIST_IMAGE` — Imagen de artista faltante

**Qué detecta:** artistas con `imageUrl` nulo o vacío. Cubre la invariante 1
de `MEMORY.md` (ningún artista publicado puede quedarse sin foto real).

**Qué recibe el modelo:** ID, nombre, géneros y hasta 400 caracteres de la
biografía.

**Qué devuelve:** `artistId`, `searchHint`, `suggestedSource`, `confidence`,
`reasoning`.

**Se puede aplicar:** **no, es orientativo.** El hallazgo se marca `FAILED` con
un mensaje que indica subir la imagen desde la ficha del artista.

**Por qué no se aplica:** `CatalogService.uploadArtistImageFromCloudflare`
(`catalog.service.ts:382-394`) solo acepta URLs HTTPS de `*.r2.dev` o
`*.r2.cloudflarestorage.com` con extensión AVIF o WEBP, y un peso máximo de 5 MB.
Una imagen de Wikipedia o del sitio del artista se rechazaría. Además, la
invariante de `MEMORY.md` pide que la foto viva en el bucket propio de
MusicFlow, no referenciada en caliente.

---

## 5. Endpoints

Base: `http://localhost:8000/api/admin/catalog-ai`. Requieren `Authorization:
Bearer <token de un ADMIN>`.

| Método | Ruta                   | Función                                         |
| ------ | ---------------------- | ----------------------------------------------- |
| `GET`  | `/status`              | Reporte determinista + si la IA está disponible |
| `GET`  | `/tasks`               | Lista de tareas con su etiqueta y entidad       |
| `POST` | `/runs/:task`          | Ejecuta una tarea y guarda los hallazgos        |
| `GET`  | `/runs`                | Historial de corridas                           |
| `GET`  | `/findings`            | Hallazgos, filtrables por `runId` y `status`    |
| `POST` | `/findings/:id/apply`  | Aplica un hallazgo                              |
| `POST` | `/findings/:id/reject` | Descarta un hallazgo                            |

### Ejemplos

Reportar qué falta (funciona **sin** clave de NVIDIA):

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/api/admin/catalog-ai/status
```

```json
{
  "aiEnabled": true,
  "model": "nvidia/nemotron-3-super-120b-a12b",
  "batchSize": 25,
  "counts": {
    "ALBUM_YEAR": 12,
    "TRACK_ALBUM_MATCH": 40,
    "MISSING_LYRICS": 88,
    "MISSING_ARTIST_IMAGE": 3
  }
}
```

Ejecutar una tarea sobre 25 elementos:

```bash
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 25}' \
  http://localhost:8000/api/admin/catalog-ai/runs/ALBUM_YEAR
```

Revisar y aplicar:

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:8000/api/admin/catalog-ai/findings?status=PROPOSED"

curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/api/admin/catalog-ai/findings/<ID>/apply
```

---

## 6. Flujo de trabajo del administrador

1. `GET /status` para ver cuánto falta, sin gastar IA.
2. `POST /runs/:task` con un `limit` acotado.
3. Revisar los hallazgos `PROPOSED`: mira `confidence` y `reasoning`.
   - `LOW` → vérifieralo a mano antes de aprobar.
   - Descartar con `/reject` lo que no encaje.
4. Aplicar uno a uno con `/apply`. `ALBUM_YEAR` y `TRACK_ALBUM_MATCH` se
   escriben de verdad; las otras dos tareas son informes de trabajo.
5. Para letras y fotos, terminar el trabajo en las pantallas normales de
   catálogo, que es donde las invariantes de R2 se cumplen.
6. Ejecutar el validador de integridad del catálogo tras cada tanda:

   ```bash
   cd apps/backend
   pnpm exec ts-node scripts/validate-catalog-integrity.ts
   ```

Los contadores de la corrida (`proposed`, `applied`, `rejected`, `failed`) se
recalculan solos tras cada `apply`.

---

## 7. Salvaguardas

- **`guided_json`**: el decoder se constrain al esquema, así que la respuesta
  siempre viene con la forma correcta.
- **Filtro de IDs**: toda propuesta cuyo ID no estaba en la entrada se
  descarta y se registra en el log. El `guided_json` garantiza la forma, no el
  contenido. Cubierto por `catalog-ai.service.spec.ts`.
- **Rango de año**: el esquema guía al modelo a 1950–2026 y el backend valida
  de forma independiente que el año sea un entero entre 1950 y 2100.
- **Álbumes candidatos**: en `TRACK_ALBUM_MATCH` solo se admiten los álbumes
  realmente ofrecidos.
- **Escrituras**: pasan por `CatalogService`, nunca por Prisma directo, para no
  romper la propagación de portadas ni el espejo de letras en R2.
- **Errores por hallazgo**: un fallo al aplicar marca ese hallazgo `FAILED` con
  el motivo; no tumba el resto.
- **Trazabilidad**: cada corrida guarda modelo, tokens, duración y el motivo de
  fallo, porque el endpoint gratuito es _best effort_.

---

## 8. Límites del endpoint gratuito

`integrate.api.nvidia.com` es para prototipado:

- Aproximadamente **40 peticiones por minuto**.
- **Sin SLA** y sujeto a cierres no anunciados.
- **401/403** casi siempre es una clave inválida o expirada.
- **429** significa que se agotó la cuota por minuto; espera un minuto.

Por eso el lote por defecto es 25 y los reintentos usan backoff exponencial
respetando `Retry-After`. Ante 401, 403 y 429 **no** se reintenta: se reporta
el error al administrador en lugar de insistir.

Para producción, apunta `NVIDIA_AI_BASE_URL` a un NIM autoalojado o a un
endpoint contratado. `MEMORY.md` exige ejecutar las verificaciones de
integridad tras cada operación administrativa; aplica también después de
aplicar hallazgos de este módulo.

---

## 9. Solución de problemas

| Síntoma                                          | Causa                                      | Solución                                          |
| ------------------------------------------------ | ------------------------------------------ | ------------------------------------------------- |
| `NVIDIA_API_KEY no está configurada`             | Clave vacía o placeholder                  | Pega la clave `nvapi-` y reinicia                 |
| `relation "catalog_ai_runs" does not exist`      | Migración no aplicada                      | `pnpm exec prisma migrate deploy`                 |
| HTTP 401/403 al modelo                           | Clave inválida                             | Regenera la clave en build.nvidia.com             |
| HTTP 429                                         | Límite de 40/min                           | Reduce `CATALOG_AI_MAX_BATCH`, espera un minuto   |
| Corridas `PARTIAL`                               | Algún lote falló                           | Revisa `error` en la corrida; reintenta esa tarea |
| `La respuesta de NVIDIA no devolvió JSON válido` | Decodificación guiado falló                | Suele ser transitorio; reintenta                  |
| `No se encontró la URL de NVIDIA`                | `prisma generate` con el backend corriendo | Detén `node dist/src/main.js` y reintenta         |

Los logs del módulo salen con el tag `[CatalogAiService]` y `[NvidiaNimClient]`.

---

## 10. Añadir una nueva tarea

1. **Prisma**: añade el valor al enum `CatalogAiTask` en `prisma/schema.prisma`
   y crea la migración.
2. **Tarea**: en `catalog-ai.tasks.ts`, declara un `CatalogAiTaskDefinition` con
   `label`, `description`, `entityType`, `maxTokens`, `schema` (JSON Schema para
   `guided_json`) y `system` (prompt en español) y regístrala en `DEFINITIONS`.
3. **Escaneo**: añade el `case` en `collectCandidates()` y el método que
   consulta Prisma en `catalog-ai.service.ts`.
4. **Mapeo**: añade el `case` en `toProposed()`, y `readId()` si la tarea usa
   una clave de ID distinta de las ya contempladas.
5. **Aplicación**: añade el `case` en `applyFinding()`. Para que sea aplicable,
   debe escribir vía `CatalogService`, no con Prisma directo.
6. **Pruebas**: extiende `catalog-ai.service.spec.ts`. Como mínimo, prueba que
   un ID inventado se descarta y que un valor fuera de rango se rechaza.
7. **Verifica**: `pnpm exec tsc --noEmit -p tsconfig.json`, `pnpm run build`,
   `pnpm exec jest`.

`CATALOG_AI_TASKS` se deriva de `DEFINITIONS`, así que `/tasks` y la
documentación de Swagger se actualizan solos.

---

## 11. Verificación del estado actual

| Comprobación                       | Resultado                                       |
| ---------------------------------- | ----------------------------------------------- |
| `tsc --noEmit`                     | Sin errores                                     |
| `nest build`                       | Correcto                                        |
| ESLint del módulo                  | Sin errores                                     |
| Prettier                           | Formateado                                      |
| `jest` (backend completo)          | 126/126, 24 de ellos nuevos                     |
| `prisma validate`                  | Válido                                          |
| `prisma migrate diff` vs migración | 14/14 sentencias DDL idénticas                  |
| `prisma migrate deploy`            | **Pendiente**, requiere la base de datos activa |

Tests propios del módulo:

- `nvidia-nim.client.spec.ts` — 11 pruebas: estado desactivado, cabeceras,
  `guided_json`, `enable_thinking`, limpieza de ```json, 401/403/429 sin
  reintento, reintento en 5xx, no reintento en 400, JSON inválido, modelo y
  base URL personalizados.
- `catalog-ai.service.spec.ts` — 13 pruebas: bloqueo sin clave, corrida vacía,
  descarte de IDs inventados, año fuera de rango, confianza normalizada,
  estado `PARTIAL`, filtrado de álbumes no candidatos, aplicación de año,
  rechazo de la tarea de letras, hallazgo ya aplicado, reporte sin IA.
