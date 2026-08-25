# Reporte de seguridad y errores de MusicFlow

Fecha de revisión: 17 de agosto de 2026

## Alcance y límites

Revisión estática de `apps/web`, `apps/mobile` y de los controles del API en
`apps/backend`. Se revisaron autenticación JWT, rutas protegidas, validación,
almacenamiento local, PWA, Cast y dependencias. No sustituye un pentest con un
entorno desplegado, DAST, análisis de infraestructura ni prueba física de Cast.

## Resumen ejecutivo

- Críticas confirmadas: 0.
- Altas: JWT web accesible a JavaScript, refresh tokens sin revocación y
  dependencias con avisos de seguridad.
- Medias: protección insuficiente contra credential stuffing/fuerza bruta,
  CSP ligada a Swagger y configuración HTTPS dependiente del entorno.
- Corregido durante esta revisión: restauración visual de sesión web, caché PWA
  de respuestas autenticadas y configuración nativa faltante de Cast.

`pnpm audit --prod` reportó 3 rutas de dependencia bajas, 37 moderadas y 31
altas, sin críticas. Entre los avisos relevantes aparecen Axios, React Router,
NestJS, Multer, Nodemailer, `music-metadata`, Lodash y dependencias transitivas.
Las cantidades son rutas afectadas, no 71 vulnerabilidades únicas.

## Hallazgos prioritarios

### SEC-01 - Tokens web en localStorage (Alta)

`apps/web/src/shared/stores/authStore.ts` persiste access token, refresh token y
usuario en `localStorage`. Esto permite restaurar la sesión, pero cualquier XSS
que alcance el origen puede extraer ambos tokens. Mobile no tiene este problema:
usa `flutter_secure_storage` respaldado por Keystore/Keychain.

Recomendación: migrar web a un access token corto en memoria y refresh token
rotativo en cookie `HttpOnly`, `Secure` y `SameSite`, preferiblemente mediante
un BFF. Aplicar una CSP estricta y no incluir secretos en URLs o logs.

### SEC-02 - Refresh token stateless y no revocable (Alta)

`POST /auth/refresh` verifica y reemplaza tokens, pero el backend no conserva
`jti`, familia ni estado de revocación. `POST /auth/logout` no invalida el token
en servidor. Un refresh robado sigue siendo reutilizable hasta expirar.

Recomendación: almacenar hash, familia, dispositivo, expiración y fecha de uso;
rotar en cada renovación y revocar la familia al detectar reutilización.

### SEC-03 - Credential stuffing y fuerza bruta (Alta)

Existe throttling global y límites específicos para IA, pero login, registro,
forgot/reset y refresh no tienen límites más estrictos por IP y por cuenta. Un
límite global de 100 solicitudes por minuto no es suficiente contra ataques
distribuidos.

Recomendación: límites progresivos por IP/cuenta, backoff, alertas, CAPTCHA tras
riesgo, contraseñas filtradas y códigos de recuperación de un solo uso.

### SEC-04 - Dependencias vulnerables (Alta)

El lockfile contiene versiones alcanzadas por avisos conocidos. Priorizar
actualizaciones compatibles de Axios, React Router, NestJS/Multer, Nodemailer y
el parser antiguo `music-metadata` del backend. Ejecutar tests y revisar los
cambios mayores antes de actualizar; no usar `--force` a ciegas.

### SEC-05 - Caché PWA con datos autenticados (Alta, corregida)

Workbox almacenaba respuestas GET de biblioteca, EQ y cuota sin variar la clave
por `Authorization`. En un navegador compartido podía reaparecer información
del usuario anterior. Se eliminó ese runtime cache y el arranque borra el caché
heredado `musicflow-api`; audio e imágenes públicas de R2 conservan caché
independiente.

### SEC-06 - CSP desactivable con Swagger (Media)

Helmet está activo, pero `contentSecurityPolicy` se desactiva cuando Swagger
está habilitado. En producción, Swagger debe restringirse o servirse con una
CSP explícita compatible.

### SEC-07 - HTTPS dependiente del despliegue (Media)

Android release bloquea tráfico claro y debug permite HTTP local. Web y API
deben publicarse exclusivamente sobre HTTPS con HSTS. JWT Bearer sobre HTTP
permite sidejacking aunque no se utilicen cookies.

## Evaluación de los 15 ataques

| Ataque                     | Estado                    | Evidencia y acción                                                                                                                                |
| -------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fijación de sesión         | Riesgo bajo actual        | JWT no usa un Session ID fijado por el cliente. Añadir `jti`, rotación y revocación evita equivalentes con refresh tokens.                        |
| Secuestro de sesión        | Riesgo alto               | `localStorage` expone JWT ante XSS y HTTP expondría Bearer en tránsito. Aplicar SEC-01 y HTTPS obligatorio.                                       |
| Credential stuffing        | Protección insuficiente   | Hay throttling global, no defensa adaptativa por cuenta/IP en auth. Aplicar SEC-03.                                                               |
| Fuerza bruta               | Protección insuficiente   | Password reset es genérico y token aleatorio/hasheado, pero faltan límites específicos en auth.                                                   |
| LFI/RFI                    | No evidenciado            | No se encontró ruta o archivo controlado por usuario ejecutado o leído directamente. Mantener allowlists y storage abstraído.                     |
| SSRF                       | No evidenciado            | Las llamadas salientes inspeccionadas usan destinos fijos/configurados. No aceptar URLs arbitrarias sin validación de esquema, DNS e IP.          |
| Manipulación de parámetros | Parcialmente mitigado     | ValidationPipe usa whitelist y rechaza campos extra; rol/plan se consulta en BD. Faltan pruebas negativas completas de precio, premium y límites. |
| IDOR                       | No evidenciado en muestra | Playlists, tracks, EQ y administración inspeccionados aplican usuario/guards. Añadir tests cruzados usuario A/B a todos los IDs.                  |
| Deserialización insegura   | No evidenciado            | JSON pasa por DTO y ValidationPipe; no hay deserializadores de objetos ejecutables. Mantener límites de tamaño y tipos.                           |
| CSRF                       | Riesgo bajo actual        | Authorization Bearer no se adjunta automáticamente entre sitios. Si el refresh migra a cookie, añadir protección CSRF y validar Origin.           |
| Clickjacking               | Mitigado                  | Helmet emite protección de frame. Confirmar `frame-ancestors 'none'` en producción.                                                               |
| XSS                        | Riesgo residual alto      | React escapa texto y no se encontró `dangerouslySetInnerHTML`/`eval`; el impacto sería alto por SEC-01. Mantener CSP y sanitizar HTML futuro.     |
| Prototype pollution        | Dependencia afectada      | No se encontró deep merge de entrada remota en código propio, pero el audit marca Axios/Lodash transitivos. Actualizar dependencias.              |
| Cache poisoning            | Hallazgo corregido        | Se retiró el caché PWA de API autenticada. El CDN debe ignorar respuestas privadas y respetar `Cache-Control`.                                    |
| Response splitting         | No evidenciado            | No se encontraron cabeceras construidas con entrada de usuario. Actualizar Nodemailer/FormData y rechazar CR/LF en valores de cabecera.           |

## Sesión web: causa del cierre aparente

La sesión ya se guardaba con Zustand Persist, pero `/` renderizaba Login incluso
cuando el estado persistido indicaba autenticación. Login ahora redirige la
sesión existente a `/library` o `/admin`. Esto corrige la experiencia, no el
riesgo de almacenar tokens en `localStorage` descrito en SEC-01.

## Google Cast mobile

- Android/iOS inicializan el SDK, descubren dispositivos, abren selector y
  cargan audio remoto con título, artista, álbum, portada, duración y MIME.
- Se añadió `MediaNotificationService` en Android y Bonjour/permiso de red local
  en iOS. El servicio Flutter ahora usa opciones y metadata multiplataforma.
- El receiver visto en Cast Console estaba sin publicar. Mientras siga así,
  cada Chromecast/Google TV de prueba debe registrarse por serial y reiniciarse.
- Falta validación física final: misma Wi-Fi sin aislamiento AP, receiver listo,
  URL R2 HTTPS pública, `GET`/`HEAD`/ranges y MIME correcto.

## Orden recomendado

1. Actualizar dependencias afectadas y ejecutar toda la suite.
2. Diseñar refresh rotativo revocable y sacar el refresh token de localStorage.
3. Endurecer auth con rate limits por cuenta/IP y observabilidad.
4. Mantener Swagger interno o aplicar una CSP específica.
5. Añadir pruebas IDOR A/B, DAST y análisis de imágenes/infraestructura.
6. Certificar Cast en Android e iOS con un receiver físico registrado.
