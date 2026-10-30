# Despliegue de MusicFlow en una VPS

Esta guía publica el backend NestJS, PostgreSQL, Redis y el proxy HTTPS en una
VPS de Contabo mediante Docker Compose. La aplicación web puede permanecer en
Cloudflare Pages y Cloudflare R2 continúa almacenando audio, imágenes, letras y
evidencias.

## Arquitectura

| Componente    | Destino              | Exposición                 |
| ------------- | -------------------- | -------------------------- |
| API NestJS    | Contenedor `backend` | Solo a través de Caddy     |
| PostgreSQL 16 | Contenedor `db`      | Red interna de Docker      |
| Redis 7       | Contenedor `redis`   | Red interna de Docker      |
| HTTPS         | Contenedor `caddy`   | Puertos 80 y 443           |
| Web React     | Cloudflare Pages     | CDN público                |
| Objetos       | Cloudflare R2        | URLs públicas configuradas |

PostgreSQL y Redis no publican puertos en la VPS. Caddy obtiene y renueva el
certificado TLS y reenvía las solicitudes al backend.

## 1. Preparar Contabo

Se recomienda Ubuntu 24.04 LTS, acceso mediante clave SSH y un usuario con
permisos de `sudo`.

1. Actualiza el sistema e instala Docker Engine con el complemento Compose
   siguiendo la documentación oficial de Docker para Ubuntu.
2. Permite únicamente SSH, HTTP y HTTPS en el firewall:

   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. Crea un registro DNS `A`, por ejemplo `api.musicflow.app`, dirigido a la IP
   pública de la VPS. Antes de iniciar Caddy, confirma que el registro resuelve.
4. Si se utiliza el proxy de Cloudflare, usa SSL/TLS **Full (strict)**. Durante
   la primera emisión del certificado puede dejarse el registro como _DNS only_.

No expongas los puertos 5432 ni 6379 en el firewall.

## 2. Preparar variables y secretos

Desde la raíz del repositorio en la VPS:

```bash
cp .env.vps.example .env.vps
chmod 600 .env.vps
```

Edita `.env.vps` y reemplaza todos los valores de ejemplo. Genera dos secretos
JWT distintos:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Usa una contraseña PostgreSQL larga y compatible con una URL, evitando `@`,
`:`, `/`, `?` y `#`. Configura además:

- `API_DOMAIN` con el dominio de la API, sin `https://`.
- `TLS_EMAIL` con el correo que recibirá avisos del certificado.
- `CORS_ORIGINS` con los orígenes web permitidos separados por coma.
- Las credenciales y buckets reales de Cloudflare R2.
- Las credenciales reales de Google OAuth y las APIs de IA habilitadas.
- `FIREBASE_SERVICE_ACCOUNT_JSON` si se enviarán notificaciones push; el valor
  debe ser el JSON completo de la cuenta de servicio en una sola línea.
- Mercado Pago, SMTP y Sentry solo cuando esas integraciones se habiliten.

En Google Cloud, la URI de retorno de producción debe coincidir exactamente con
`https://<API_DOMAIN>/api/auth/google/callback`.

Nunca se debe agregar `.env.vps` a Git.

## 3. Validar y construir

Ejecuta primero la validación de Compose:

```bash
docker compose --env-file .env.vps -f docker-compose.prod.yml config --quiet
```

Construye la imagen reproducible del backend:

```bash
docker compose --env-file .env.vps -f docker-compose.prod.yml build backend migrate
```

La construcción usa `pnpm-lock.yaml`, genera Prisma y compila NestJS. No usa
dependencias instaladas en la máquina anfitriona.

## 4. Restaurar la base de datos existente

Antes de copiar datos, crea un respaldo de la base local con PostgreSQL 16. No
uses exportaciones manuales parciales si necesitas conservar relaciones,
usuarios y reproducciones.

Ejemplo local:

```bash
docker compose exec -T db pg_dump -U musicflow -d musicflow -Fc > musicflow.dump
```

Copia `musicflow.dump` a la VPS mediante `scp`. Inicia solo PostgreSQL y espera
que esté saludable:

```bash
docker compose --env-file .env.vps -f docker-compose.prod.yml up -d db
docker compose --env-file .env.vps -f docker-compose.prod.yml ps
```

Restaura el respaldo en una base vacía:

```bash
docker compose --env-file .env.vps -f docker-compose.prod.yml exec -T db \
  pg_restore --clean --if-exists --no-owner \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" < musicflow.dump
```

Si la shell no tiene exportadas esas variables, sustituye ambos nombres por los
valores de `.env.vps`. Mantén una copia del respaldo fuera de la VPS.

## 5. Iniciar producción

```bash
docker compose --env-file .env.vps -f docker-compose.prod.yml up -d
docker compose --env-file .env.vps -f docker-compose.prod.yml ps
docker compose --env-file .env.vps -f docker-compose.prod.yml logs --tail=200 migrate backend caddy
```

El servicio `migrate` ejecuta `prisma migrate deploy` antes de iniciar la API.
Un fallo de migración impide que el backend arranque; no lo omitas ni uses
`prisma migrate dev` en producción.

Comprueba el endpoint público:

```bash
curl --fail --show-error https://<API_DOMAIN>/api/health
```

La respuesta debe indicar estado saludable y conexión activa con PostgreSQL.
Después valida login, catálogo, reproducción, R2, IA y el portal de artistas
desde la web desplegada.

## 6. Conectar Cloudflare Pages

En el build de `apps/web/` configura, como mínimo:

```text
VITE_API_URL=https://<API_DOMAIN>/api
```

Agrega el dominio final de Pages o el dominio personalizado a `CORS_ORIGINS`.
Si cambia un origen, actualiza `.env.vps` y recrea el backend:

```bash
docker compose --env-file .env.vps -f docker-compose.prod.yml up -d --force-recreate backend
```

## 7. Operación y actualizaciones

Antes de cada actualización:

1. Crea y descarga un respaldo PostgreSQL.
2. Revisa las migraciones incluidas en la nueva versión.
3. Actualiza el código únicamente desde una rama o etiqueta verificada.
4. Reconstruye y observa los registros:

   ```bash
   git pull --ff-only
   docker compose --env-file .env.vps -f docker-compose.prod.yml build backend migrate
   docker compose --env-file .env.vps -f docker-compose.prod.yml up -d
   docker compose --env-file .env.vps -f docker-compose.prod.yml logs --tail=200 migrate backend
   ```

Comandos útiles:

```bash
docker compose --env-file .env.vps -f docker-compose.prod.yml ps
docker compose --env-file .env.vps -f docker-compose.prod.yml logs -f backend
docker compose --env-file .env.vps -f docker-compose.prod.yml restart backend
```

`docker compose down` conserva los volúmenes. No ejecutes `down --volumes` en
producción: eliminaría los datos persistentes.

## 8. Respaldo y recuperación

Automatiza respaldos cifrados fuera de la VPS y prueba su restauración. Un
respaldo no verificado no debe considerarse recuperable.

```bash
mkdir -p backups
docker compose --env-file .env.vps -f docker-compose.prod.yml exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc \
  > "backups/musicflow-$(date +%Y%m%d-%H%M%S).dump"
```

Conserva varias generaciones y aplica una política de retención. Antes de una
restauración, detén el backend y crea otro respaldo del estado actual.

## Lista de comprobación previa a publicar

- [ ] DNS de la API apunta a la VPS.
- [ ] SSH usa claves y el acceso de administrador está restringido.
- [ ] `.env.vps` tiene secretos únicos y no está versionado.
- [ ] PostgreSQL y Redis no publican puertos.
- [ ] `docker compose config --quiet` finaliza correctamente.
- [ ] La imagen se construye con el lockfile sin errores.
- [ ] `prisma migrate deploy` finaliza correctamente.
- [ ] Backend, PostgreSQL, Redis y Caddy aparecen saludables.
- [ ] `/api/health` responde por HTTPS.
- [ ] CORS permite únicamente los dominios requeridos.
- [ ] Login, OAuth, R2, reproducción e IA fueron probados en producción.
- [ ] Existe un respaldo externo cuya restauración fue comprobada.
- [ ] Hay monitoreo de disponibilidad, uso de disco y errores.
