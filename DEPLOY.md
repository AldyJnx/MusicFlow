# MusicFlow — Guía de Despliegue

Stack de despliegue:

| Componente             | Plataforma            | Plan             |
| ---------------------- | --------------------- | ---------------- |
| Backend (NestJS)       | **Render** (Docker)   | Free             |
| PostgreSQL             | **Render**            | Free             |
| Redis                  | **Upstash**           | Free             |
| Web (React PWA)        | **Cloudflare Pages**  | Free             |
| Storage audio/imágenes | **Cloudflare R2**     | (ya configurado) |
| Móvil (prueba local)   | **cloudflared** túnel | Free             |

> Cambios de código ya aplicados para que esto funcione:
>
> - Nuevo endpoint `GET /api/health` (lo usa el health check de Render y Docker).
> - `QueueModule` soporta Redis con TLS (`rediss://` de Upstash).
> - Se quitó la dep `@musicflow/shared` (no usada) para que el build de Docker no falle.
> - `Dockerfile` reescrito (self-contained), `.dockerignore` y `render.yaml` añadidos.

---

## 1. Redis en Upstash (hazlo primero)

1. Crea cuenta en https://upstash.com → **Create Database** → tipo _Redis_, region cercana a Oregon (US-West).
2. En la página de la DB, copia la **`UPSTASH_REDIS_URL`** con formato `rediss://default:<password>@<host>:6379`.
   - ⚠️ Usa la que empieza con **`rediss://`** (con TLS), no la `redis://`.
3. Guárdala — la pegas en Render como `REDIS_URL`.

---

## 2. Backend + PostgreSQL en Render

### Opción A — Blueprint (recomendado, usa `render.yaml`)

1. Sube el repo a GitHub si no lo está.
2. Render → **New** → **Blueprint** → conecta el repo. Render detecta `render.yaml` y crea:
   - `musicflow-db` (PostgreSQL free)
   - `musicflow-backend` (Docker web service)
3. Render pedirá los valores marcados `sync: false`. Rellénalos:

   | Variable                                 | Valor                                               |
   | ---------------------------------------- | --------------------------------------------------- |
   | `REDIS_URL`                              | el `rediss://...` de Upstash                        |
   | `ANTHROPIC_API_KEY`                      | tu API key de Anthropic                             |
   | `R2_ACCESS_KEY` / `R2_SECRET_ACCESS_KEY` | Cloudflare R2 → _Manage R2 API Tokens_              |
   | `CORS_ORIGINS`                           | (déjalo vacío de momento; lo pones en el paso 4)    |
   | `APP_URL`                                | (igual, lo pones después)                           |
   | SMTP\_\*                                 | opcional; déjalo vacío para loguear links a consola |

   `DATABASE_URL`, `JWT_SECRET` y `JWT_REFRESH_SECRET` se generan **automáticamente**. ✅

4. **Deploy**. Render hará build del Docker, correrá `prisma migrate deploy` y arrancará.
5. Tu backend queda en `https://musicflow-backend.onrender.com`. Verifica:
   ```
   https://musicflow-backend.onrender.com/api/health   -> {"status":"ok","database":"up"}
   https://musicflow-backend.onrender.com/api/docs      -> Swagger
   ```

> Si NO usas el blueprint y quieres meter los JWT a mano, usa estos (generados para ti):
>
> ```
> JWT_SECRET=8Ej5UL-iT4JJv8TxIgvEm3_JfY32w3yttdqNMxgbux7xHPqLgtAc-ABzK-Rj-xaY
> JWT_REFRESH_SECRET=7J1TgX3qROxxXsWXGeYpLZ-y2a-uNjoDLoKpbWGkTuB1WWLW6chCIkdpdH3-oK56
> ```

### Opción B — Manual (sin blueprint)

1. Render → **New** → **PostgreSQL** (free). Copia su _Internal Database URL_.
2. Render → **New** → **Web Service** → conecta el repo:
   - **Root Directory**: `apps/backend`
   - **Runtime**: Docker (detecta el `Dockerfile`)
   - **Health Check Path**: `/api/health`
3. En **Environment**, añade todas las variables del `render.yaml` (incluida `DATABASE_URL` con la del paso 1).

### Nota sobre el plan free de Render

El servicio free **se duerme tras 15 min** de inactividad y tarda ~30-60s en despertar (verás lento el primer request). Para una tesis es suficiente. La Postgres free expira a los 90 días.

---

## 3. Web en Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → tu repo.
2. Configuración de build (monorepo pnpm):
   - **Production branch**: `main`
   - **Framework preset**: None
   - **Root directory**: _(déjalo en raíz del repo)_
   - **Build command**:
     ```
     pnpm install --frozen-lockfile && pnpm --filter @musicflow/web build
     ```
   - **Build output directory**:
     ```
     apps/web/dist
     ```
3. **Environment variables** (Build):
   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | `https://musicflow-backend.onrender.com/api` |
   | `VITE_R2_AUDIO_BASE` | `https://pub-f44a489bc1e94270836132b3136f0a8c.r2.dev` |
   | `VITE_R2_IMAGES_BASE` | `https://pub-7f3d08bcabf44d68b2a57424acfc9d48.r2.dev` |
   | `PNPM_VERSION` | `9.0.0` |
   | `NODE_VERSION` | `20` |
4. **Deploy**. Queda en `https://<proyecto>.pages.dev`.
   - El archivo `apps/web/public/_redirects` ya hace el fallback SPA (`/* -> /index.html`), así no hay 404 al refrescar rutas.

---

## 4. Conectar web ↔ backend (CORS)

Una vez tengas la URL de Pages (ej. `https://musicflow.pages.dev`):

1. Render → servicio backend → **Environment**, edita:
   - `CORS_ORIGINS` = `https://musicflow.pages.dev`
   - `APP_URL` = `https://musicflow.pages.dev`
     (Para incluir túnel móvil temporal: sepáralos por coma → `https://musicflow.pages.dev,https://tu-tunel.trycloudflare.com`)
2. Render redeploya solo. Listo: web ↔ API ↔ DB ↔ Redis ↔ R2.

---

## 5. Túnel local para el móvil (cloudflared)

Mientras desarrollas, expón el **backend local** al teléfono sin desplegar nada:

1. Instala cloudflared (Windows):
   ```powershell
   winget install --id Cloudflare.cloudflared
   ```
2. Arranca el backend local:
   ```powershell
   pnpm --filter @musicflow/backend start:dev    # escucha en :8000
   ```
3. En otra terminal, abre el túnel (no requiere cuenta para uno efímero):
   ```powershell
   cloudflared tunnel --url http://localhost:8000
   ```
   Te da una URL tipo `https://random-words.trycloudflare.com`.
4. En la app Flutter, apunta el cliente Dio a esa URL + `/api`
   (ej. `https://random-words.trycloudflare.com/api`).
5. Si el backend que pruebas valida CORS para esa petición, añade la URL del túnel a `CORS_ORIGINS` del `.env` local.

> Alternativa: si quieres exponer el backend **ya desplegado en Render** al móvil, no necesitas túnel — usa directamente `https://musicflow-backend.onrender.com/api`.

---

## Checklist final

- [ ] Upstash creado → `REDIS_URL` (`rediss://`) copiado
- [ ] Render Blueprint desplegado → `/api/health` responde `ok`
- [ ] `REDIS_URL`, `ANTHROPIC_API_KEY`, `R2_*` keys puestos en Render
- [ ] Cloudflare Pages desplegado con `VITE_API_URL` correcto
- [ ] `CORS_ORIGINS` y `APP_URL` apuntando a la URL de Pages
- [ ] Móvil probado vía cloudflared o contra Render
