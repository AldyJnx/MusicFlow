# MusicFlow — Guía de Despliegue

Deploy temporal con **buen rendimiento y sin cold starts** (para demos / fin de semana).

| Componente       | Plataforma           | Notas                                       |
| ---------------- | -------------------- | ------------------------------------------- |
| Backend (NestJS) | **Railway** (Docker) | Siempre despierto, red privada con DB/Redis |
| PostgreSQL       | **Railway**          | Mismo proyecto → baja latencia              |
| Redis (BullMQ)   | **Railway**          | Mismo proyecto                              |
| Web (React PWA)  | **Cloudflare Pages** | CDN global, gratis, mismo ecosistema que R2 |
| Audio/imágenes   | **Cloudflare R2**    | Ya configurado (audio comprimido AAC)       |

> La auth usa tokens en el body (no cookies), así que el cross-site Pages↔Railway no necesita config extra.
>
> **Validado localmente**: la imagen Docker del backend construye, corre `prisma migrate deploy`, arranca (`node dist/src/main.js`) y responde `/api/health` → `{"status":"ok","database":"up"}`, con login y catálogo funcionando.

---

## 0. Requisito: código en GitHub

Railway y Cloudflare Pages despliegan desde GitHub. Commitea y pushea la rama:

```bash
git push -u origin feat/optimizacion-carga-musica
```

Podés desplegar desde esta rama (ambos permiten elegirla) o mergear a `main` primero.

---

## A. Railway — Backend + PostgreSQL + Redis

1. https://railway.app → **Login with GitHub** → **New Project**.
2. **+ New → Database → Add PostgreSQL**.
3. **+ New → Database → Add Redis**.
4. **+ New → GitHub Repo →** elegí `MusicFlow` (rama `feat/optimizacion-carga-musica`).
   - Servicio del backend → **Settings → Source → Root Directory**: `apps/backend`
   - Railway detecta el `Dockerfile` solo. **No** configures build/start commands.
5. Backend → **Variables** → agregá lo de la tabla. Para DB/Redis usá referencias de Railway:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `REDIS_URL` = `${{Redis.REDIS_URL}}`
   - **No** definas `PORT` (Railway lo inyecta; `main.ts` ya lo lee).
6. Deploy. El `Dockerfile` corre `prisma migrate deploy` (crea el esquema) y arranca.
7. Backend → **Settings → Networking → Generate Domain**. Copiá la URL
   (ej. `musicflow-backend-production.up.railway.app`).
   - API base = `https://<dominio>/api`
   - Probá: `https://<dominio>/api/health` → `{"status":"ok","database":"up"}`

### Variables del backend

| Variable                                                 | Valor                                                     |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `NODE_ENV`                                               | `production`                                              |
| `DATABASE_URL`                                           | `${{Postgres.DATABASE_URL}}`                              |
| `REDIS_URL`                                              | `${{Redis.REDIS_URL}}`                                    |
| `JWT_SECRET`                                             | _(cadena larga aleatoria — `openssl rand -hex 32`)_       |
| `JWT_EXPIRES_IN`                                         | `15m`                                                     |
| `JWT_REFRESH_SECRET`                                     | _(otra distinta)_                                         |
| `JWT_REFRESH_EXPIRES_IN`                                 | `7d`                                                      |
| `CORS_ORIGINS`                                           | `https://<tu-dominio-pages>` _(se completa en el paso D)_ |
| `R2_ENDPOINT` · `R2_ACCESS_KEY` · `R2_SECRET_ACCESS_KEY` | _(de tu `apps/backend/.env`)_                             |
| `R2_REGION`                                              | `auto`                                                    |
| `R2_BUCKET_AUDIO`                                        | `music-flow`                                              |
| `R2_BUCKET_IMAGES`                                       | `music-flow-images`                                       |
| `R2_BUCKET_LYRICS`                                       | `music-flow-songs-lyrics`                                 |
| `R2_BUCKET_ARTIST_IMAGES`                                | `music-flow-artist-image`                                 |
| `R2_PUBLIC_AUDIO_URL` · `R2_PUBLIC_IMAGES_URL`           | _(de tu `.env`)_                                          |
| `ANTHROPIC_API_KEY` · `ANTHROPIC_MODEL`                  | _(de tu `.env`)_                                          |
| `THROTTLE_TTL` / `THROTTLE_LIMIT`                        | `60` / `100`                                              |

---

## B. Importar los datos (142 canciones + usuarios + todo)

El esquema lo crea `prisma migrate deploy` en el primer deploy. Después cargá los datos
exportados de tu DB local (URLs de audio ya transcodificadas a AAC).

1. Railway → **Postgres → Connect →** copiá la **Postgres Connection URL** pública.
2. Desde tu máquina (con Docker):

```bash
docker run --rm -i postgres:16-alpine \
  psql "<URL_PUBLICA_DE_RAILWAY>" < musicflow_import.sql
```

> El archivo `musicflow_import.sql` (te lo paso aparte) desactiva las FK durante la carga,
> así el orden no importa y no borra nada del esquema.

**Login de prueba** tras importar: `admin@musicflow.app` / `Admin123!`

---

## C. Cloudflare Pages — Frontend

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git →** tu repo.
2. Build (monorepo pnpm):
   - **Production branch**: la rama que desplegás
   - **Framework preset**: `None`
   - **Root directory**: _(raíz del repo, vacío)_
   - **Build command**: `pnpm install --frozen-lockfile && pnpm --filter web build`
   - **Build output directory**: `apps/web/dist`
3. **Environment variables** (Build):

   | Variable              | Valor                                                 |
   | --------------------- | ----------------------------------------------------- |
   | `VITE_API_URL`        | `https://<tu-dominio-railway>/api` _(¡con `/api`!)_   |
   | `VITE_R2_AUDIO_BASE`  | `https://pub-f44a489bc1e94270836132b3136f0a8c.r2.dev` |
   | `VITE_R2_IMAGES_BASE` | `https://pub-7f3d08bcabf44d68b2a57424acfc9d48.r2.dev` |
   | `PNPM_VERSION`        | `9.0.0`                                               |
   | `NODE_VERSION`        | `20`                                                  |

4. Deploy → queda en `https://<proyecto>.pages.dev`.
   - `apps/web/public/_redirects` ya hace el fallback SPA (`/* → /index.html 200`), sin 404 al refrescar rutas.

---

## D. Conectar (CORS) y verificar

1. Railway → Backend → **Variables** → `CORS_ORIGINS` = `https://<tu-dominio-pages>` _(sin barra final)_.
   - Railway reinicia el backend solo al guardar.
2. Abrí `https://<tu-dominio-pages>`, logueá (`admin@musicflow.app` / `Admin123!`) y reproducí una canción. 🎧

---

## Notas

- **Costo**: Railway Hobby (con tarjeta) no cobra por unos días de una app chica; consume centavos. Pages y R2 son gratis.
- **Apagar al terminar**: en Railway pausá o borrá el proyecto para no gastar crédito.
- Si cambia el dominio de Pages, actualizá `CORS_ORIGINS` en Railway.

### Alternativa 100% gratis sin tarjeta (con cold starts)

Existe `render.yaml` para desplegar el backend en **Render Free** (+ Redis en Upstash). Es gratis y sin
tarjeta, pero el backend **se duerme tras ~15 min** y tarda ~30-60s en despertar. Sirve si no querés usar
tarjeta y no te molesta el arranque lento del primer request. Para "buenos tiempos de respuesta" preferí Railway.
