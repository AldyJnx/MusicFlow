# Reporte de seguridad y errores de MusicFlow

### Preferencias de distribución y gestos de pista no disponibles

- **Identificador:** BUG-2026-037
- **Fecha:** 2026-10-25
- **Entorno afectado:** `apps/web/` (navegador y Desktop Electron)
- **Síntoma:** el panel de cola y el sidebar no podían cambiar de lado desde
  Ajustes, el tamaño de la letra no era configurable y el asistente no tenía
  un control unificado de activación/arrastre. Los deslizamientos horizontales
  del trackpad tampoco avanzaban o retrocedían la pista.
- **Causa raíz:** las preferencias solo conservaban opciones visuales antiguas
  y no existía un puente para los eventos nativos de swipe; el navegador no
  tenía una ruta de respaldo para los eventos horizontales de precisión.
- **Solución:** se añadieron preferencias persistidas por cuenta para posición
  del sidebar/cola, escala de letras y estado/modo del asistente. Los paneles
  respetan esos docks, FlowIA puede ocultarse o arrastrarse y la vista de letras
  aplica la escala seleccionada. Electron reenvía swipes nativos y web/Electron
  acumulan el desplazamiento horizontal del trackpad para ejecutar siguiente o
  anterior sin bloquear el scroll vertical.
- **Verificación:** `pnpm exec tsc -b` en `apps/web/` correcto; sintaxis
  Electron pendiente de comprobación final tras el empaquetado.
- **Estado:** corregido; verificación de empaquetado pendiente.

- **Actualización 2026-10-25:** los gestos de tres dedos de algunos trackpads
  Windows se informan como `app-command` y no como `wheel`, por lo que no
  llegaban al renderer. Electron ahora convierte `browser-backward`,
  `browser-forward` y los comandos multimedia en la misma señal de pista. El
  renderer escucha el desplazamiento horizontal en fase de captura y reduce el
  umbral para trackpads de alta precisión; Safari conserva una ruta `gestureend`.
  La escala de letra se aplicó también al panel de letras alternativo. Cambiar
  FlowIA a estático restablece su desplazamiento a la posición inicial y la
  categoría heredada `People & Blogs` ya no aparece como filtro musical.

- **Reapertura 2026-10-25 (reproductor expandido):** el cierre preventivo al
  navegar se evaluaba cada vez que cambiaba `isExpanded`, incluso sin cambiar
  de ruta. Al pulsar el mini-reproductor, el estado se abría y el efecto lo
  cerraba de inmediato. El layout ahora compara la ruta actual con la anterior
  y solo cierra el reproductor cuando existe una navegación real fuera de
  `/now-playing`.

### Navbar y cola superpuestos por la barra de título de Electron

- **Identificador:** BUG-2026-036
- **Fecha:** 2026-10-23
- **Entorno afectado:** `apps/web/` (Desktop Electron)
- **Síntoma:** al ejecutar la aplicación empaquetada, la barra de título propia
  cubría la primera fila del navbar y de los paneles fijos; en la cola lateral
  algunos controles quedaban visualmente debajo de esa capa y no respondían al
  clic.
- **Causa raíz:** el `padding-top` aplicado al `body` no desplaza elementos con
  `position: fixed`, como el sidebar, el panel derecho y el drawer de cola.
- **Solución:** los paneles y el drawer usan una clase de viewport de Electron
  que reserva la altura de la barra de título. La capa de arrastre ahora tiene
  fondo y separador propios; los iconos de ventana usan minimizar, maximizar y
  restaurar convencionales según el estado real de la ventana.
- **Verificación:** typecheck y build web correctos; sintaxis de los procesos
  Electron y configuración de empaquetado revisadas.
- **Estado:** verificado.

### BUG-2026-035 — Bibliotecas sin gestión directa y controles del carrusel sin cobertura de clic

- **Identificador:** BUG-2026-035
- **Fecha:** 2026-10-22
- **Entorno afectado:** `apps/web/` (Desktop Electron)
- **Síntoma:** las bibliotecas de “Mi biblioteca” no exponían acciones para
  renombrarlas o eliminarlas y los controles Anterior/Siguiente del carrusel de
  Inicio no contaban con una verificación de interacción directa.
- **Causa raíz:** el sidebar solo trataba cada biblioteca como un destino de
  navegación. El API ya ofrecía `PATCH` y `DELETE` con comprobación de dueño,
  pero el cliente no los integraba. La prueba del carrusel validaba la rotación
  automática, no los clics de sus botones.
- **Solución:** el sidebar muestra, al pasar el cursor o enfocar una biblioteca,
  acciones animadas de editar y eliminar. El diálogo de edición desactiva
  Guardar cuando el nombre no cambió, confirma el borrado, actualiza la caché y
  vuelve a Inicio si se elimina la biblioteca abierta. Se añadió el cliente
  `updatePlaylist` y la prueba E2E ahora ejercita Anterior y Siguiente.
- **Verificación:** typecheck, ESLint sin errores (quedan advertencias
  preexistentes fuera de este cambio), build de producción y la prueba E2E
  focalizada `player-search-profile.spec.ts` correctos.
- **Estado:** verificado.

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

## Registro de bugs reportados

Esta sección registra los bugs comunicados desde la incorporación de la memoria
global del proyecto. El informe histórico anterior se conserva sin cambios y no
se reconstruyen bugs previos salvo solicitud expresa.

### Plantilla de registro

#### Título breve

- **Identificador:** BUG-AAAA-NNN
- **Fecha:** AAAA-MM-DD
- **Entorno afectado:** `apps/mobile/`, `apps/web/` y/o `apps/backend/`
- **Síntoma:** comportamiento observado y forma de reproducirlo.
- **Causa raíz:** explicación técnica confirmada mediante diagnóstico.
- **Solución:** cambios realizados para corregir el problema.
- **Verificación:** pruebas, compilaciones o comprobaciones ejecutadas.
- **Estado:** pendiente, en investigación, corregido o verificado.

### Artistas publicados sin foto de perfil

- **Identificador:** BUG-2026-001
- **Fecha:** 2026-09-24
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** algunos artistas aparecen publicados sin una fotografía de perfil
  real asociada.
- **Causa raíz:** la asociación automática desde R2 resolvió seis perfiles,
  pero no encontró una fotografía real para `Amen`, `The Black Eyed Peas` ni
  `The Smiths` dentro de los 41 objetos de fotos de artista inventariados.
- **Solución:** se añadió una validación de integridad que prohíbe placeholders,
  informa los faltantes y marca la sincronización como incompleta hasta asociar
  una foto real. Las listas públicas de web y mobile no publican perfiles sin
  foto; Administración sí los conserva visibles para corregirlos.
- **Verificación:** la auditoría posterior informa 3 fotos pendientes, 0
  duplicados, 0 álbumes incompletos y 0 portadas inconsistentes.
- **Estado:** en investigación; faltan los tres recursos reales de R2.

### Artistas duplicados en el catálogo

- **Identificador:** BUG-2026-002
- **Fecha:** 2026-09-24
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** aparecen perfiles repetidos o variantes del mismo artista; se
  reportaron casos como Black Eyed Peas y Gonzalo Genek.
- **Causa raíz:** la unicidad anterior solo comparaba el nombre literal, por lo
  que permitía variantes de capitalización, tildes o puntuación.
- **Solución:** se añadió identidad normalizada única y una migración que fusiona
  las variantes preservando canciones, álbumes, seguidores y colaboraciones.
- **Verificación:** la auditoría de PostgreSQL reporta 0 grupos duplicados.
- **Estado:** verificado.

### Ventana de Electron conservaba la identidad y los controles genéricos

- **Identificador:** BUG-2026-034
- **Fecha:** 2026-10-22
- **Entorno afectado:** `apps/web/` (Desktop Electron).
- **Síntoma:** al ejecutar MusicFlow Desktop, la barra de tareas mostraba el
  icono de Electron; la ventana dependía de controles genéricos que no
  reflejaban el cambio entre maximizar y restaurar, y no había zoom mediante
  `Ctrl` + `+` ni `Ctrl` + `-`.
- **Causa raíz:** la ventana no configuraba el icono de MusicFlow ni un
  identificador de aplicación para Windows. Tampoco existía un puente IPC
  acotado entre la interfaz y las operaciones nativas de ventana, ni manejo de
  los atajos de zoom en el proceso principal.
- **Solución:** la ventana carga `Logo_Music_Flow-FormatoIco.ico`, lo establece también
  en la ventana y usa un App User Model ID de MusicFlow. Se añadió una barra de
  título sin marco, arrastrable, con controles accesibles; el botón central
  alterna y representa Maximizar/Restaurar. El preload solo expone esas
  acciones concretas y el proceso principal aplica zoom entre 50 % y 200 % con
  `Ctrl`/`Cmd` + `+` y `Ctrl`/`Cmd` + `-`.
- **Verificación:** `node --check` de main/preload, ESLint, `tsc -b`, build de
  Vite y empaquetado Windows temporal correctos. El paquete contiene
  `MusicFlow.exe`, `resources/musicflow.ico` y `resources/dist/index.html`.
- **Reapertura 2026-10-22 (barra superior):** al hacer scroll, los encabezados
  `sticky top-0` de la aplicación regresaban al borde superior del viewport y
  quedaban por debajo de la barra de controles de Electron. La barra se vuelve
  visualmente transparente y los encabezados del escritorio ahora respetan el
  área reservada de 36 px; el contenido y sus botones dejan de quedar tapados.
- **Actualización 2026-10-22 (identidad Windows):** se sustituye el WebP por
  `Logo_Music_Flow-FormatoIco.ico` tanto en desarrollo como en el ejecutable
  empaquetado, que además contiene ese recurso como `extraResource`.
- **Estado:** verificado.

- **Reapertura 2026-10-22 (OAuth y sesión de escritorio):** al completar
  Google OAuth en Electron, el `APP_URL` devolvía la navegación al cliente web
  en vez del renderer local; por eso la aplicación quedaba otra vez en Login.
  Además, la sesión compartía el adaptador `sessionStorage` del navegador, que
  se descarta al cerrar la ventana de Electron.
- **Causa raíz de la reapertura:** no existía un manejador de navegación para
  capturar el ticket de un solo uso de la devolución OAuth ni un almacén nativo
  persistente para el contexto desktop.
- **Solución de la reapertura:** el proceso principal intercepta únicamente la
  ruta de callback que contiene `ticket`, cancela la navegación externa y abre
  la ruta local `#/auth/google/callback` para intercambiarlo. En Electron,
  Zustand persiste la sesión bajo `userData` mediante `safeStorage` cifrado;
  web conserva `sessionStorage` aislado por pestaña. La aplicación espera la
  hidratación antes de evaluar rutas protegidas o redirigir Login.
- **Verificación de la reapertura:** comprobaciones sintácticas de main y
  preload, `pnpm --filter web exec tsc -b` y ESLint sin errores. La validación
  manual de consentimiento Google requiere una cuenta y configuración OAuth
  del entorno, por lo que queda pendiente de ejecución interactiva.
- **Estado:** corregido; validación interactiva pendiente.

### Carga de audio de catálogo y sincronización R2 bloqueante

- **Identificador:** BUG-2026-022
- **Reapertura 2026-10-08:** una carga de `Wanksta` para `50Cent` volvió a
  crear `catalog/<UUID>.wav`. La comparación entre fuente y artefacto compilado
  confirmó que `src` ya generaba `50Cent - Wanksta.wav`, pero `dist` conservaba
  el flujo antiguo y `pnpm run start` no recompilaba antes de ejecutarlo. Se
  añadió compilación obligatoria a `prestart` y `prestart:prod`, una prueba de
  regresión para la clave exacta y un rechazo explícito del folder `catalog`
  en el uploader genérico.
- **Seguimiento 2026-10-08:** R2 contenía dos objetos huérfanos bajo
  `catalog/<UUID>.wav`, sin referencia en el PostgreSQL configurado. Después de
  la inspección dejaron de existir y tampoco existe aún la clave canónica
  `50Cent - Wanksta.wav`. El WAV original mostrado en la unidad `E:` no es
  accesible desde el entorno de ejecución, por lo que debe volver a subirse
  desde Admin con el backend recompilado. La reparación no inventa ni sustituye
  contenido de audio ausente.
- **Actualización 2026-10-08 (activos de catálogo):** el mismo defecto de
  nombres no canónicos existía para fotos y letras: perfil usaba
  `artists/<UUID>`, portada de álbum `albums/<UUID>` y letras `<trackId>.lrc`.
  Ahora cada flujo resuelve sus metadatos antes de escribir en R2 y usa la
  clave raíz exacta: `{artista}.webp|avif` en `music-flow-artist-image`,
  `{álbum} - {artista}.webp|avif` en `music-flow-images` y
  `{artista} - {canción}.lrc` en `music-flow-songs-lyrics`. Las sustituciones
  deliberadamente reemplazan la misma clave canónica, sin crear carpetas ni
  UUIDs.
- **Fecha:** 2026-10-08
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** la carga de una canción de catálogo aceptaba formatos ajenos a
  WAV/FLAC y generaba una clave R2 basada en el nombre local con UUID, en vez
  de `Artista - Canción`. El botón de sincronización podía permanecer cargando
  porque encadenaba importación, reparación y validación completa del catálogo.
- **Causa raíz:** el endpoint administrativo reutilizaba el filtro y el método
  de almacenamiento de bibliotecas privadas; el flujo de sincronización
  inspeccionaba, descargaba y validaba todos los objetos en una petición HTTP.
- **Solución:** se introdujo un filtro exclusivo de catálogo WAV/FLAC y el
  backend resuelve al artista antes de crear una clave R2 determinista,
  rechazando colisiones sin sobrescribir el objeto existente. `Sync R2` ahora
  solo ejecuta el importador incremental: compara el índice de R2 con el estado
  local, procesa objetos nuevos o modificados y evita listar portadas cuando
  no hay cambios. La reconciliación destructiva queda para una ejecución
  explícita de mantenimiento `--full`.
- **Verificación:** `pnpm run typecheck`, `pnpm run build` y las 33 pruebas
  focalizadas de catálogo/almacenamiento del backend correctas; build de
  producción web correcto y `git diff --check` sin errores.
- **Estado:** corrección de código verificada; recuperación y comprobación del
  objeto `50Cent - Wanksta.wav` pendientes de una nueva carga del WAV original.

- **Reapertura 2026-10-09 (featuring):** una carga cuyo nombre incluía los
  créditos, por ejemplo `Sean Paul ft. Dua Lipa - No Lie`, se interpretaba como
  título completo. El objeto terminaba como `Sean Paul - Sean Paul ft. Dua Lipa
  - No Lie.wav` y no se creaban créditos de colaboración.
- **Causa raíz de la reapertura:** la clave canónica se formaba directamente
  con el texto recibido por el formulario, sin separar al artista principal ya
  seleccionado, el título y los colaboradores del nombre de archivo.
- **Solución de la reapertura:** el backend ahora normaliza el nombre de carga
  antes de escribir en R2. Conserva el artista seleccionado como principal,
  registra los colaboradores por canción y usa exactamente
  `Artista - Canción (feat. Colaborador 1 - Colaborador 2).wav|flac`. Por
  ejemplo, `The Weeknd ft. JENNIE - Lily Rose Depp - One Of The Girls` produce
  `The Weeknd - One Of The Girls (feat. JENNIE - Lily Rose Depp)`.
- **Verificación de reapertura:** pruebas unitarias cubren sencillo, featuring
  único y múltiples colaboradores; `pnpm run test -- catalog.service.spec.ts`
  (32/32), typecheck y build del backend correctos.

- **Reapertura 2026-10-11 (validación de carga completa):** volvió a aparecer
  en R2 una clave como `Sean Paul - Sean Paul ft. Keyshia Cole - When You
Gonna Give It UpTo Me.wav`, que repite al artista principal. La clave indica
  que la solicitud fue atendida por una instancia anterior al normalizador.
- **Causa raíz de la segunda reapertura:** la prueba anterior validaba la
  transformación aislada, pero no cubría la llamada completa que forma la
  clave R2 ni los créditos persistidos. Una instancia Nest ya iniciada no toma
  nuevos artefactos `dist` hasta reiniciarse.
- **Solución de la segunda reapertura:** se añadió una prueba de carga integral
  que exige la llamada exacta a almacenamiento:
  `Sean Paul - When You Gonna Give It UpTo Me (feat. Keyshia Cole).wav`; también
  cubre que, con varios colaboradores, el último guion define el título. El
  proceso backend debe iniciarse con `pnpm run start` o `pnpm run start:dev`
  después de compilar para usar el artefacto actual.
- **Verificación de la segunda reapertura:** `pnpm run test --
catalog.service.spec.ts` correcto (34/34), además de `pnpm run typecheck` y
  `pnpm run build` del backend.

- **Actualización 2026-10-11 (regla universal):** se eliminó la comparación
  literal del prefijo de artista. El parser compara la identidad normalizada
  del artista seleccionado y del encabezado del archivo, por lo que funciona
  para cualquier nombre y también ante variantes como `50Cent`/`50 Cent`,
  mayúsculas, tildes o puntuación. La regla sigue siendo: después de `ft.` o
  `feat.`, el último `-` es la canción y los fragmentos anteriores son los
  colaboradores; no existe ningún nombre de artista codificado en producción.
- **Verificación de la actualización:** `catalog.service.spec.ts` correcto
  (35/35), typecheck y build del backend correctos.

- **Actualización 2026-10-11 (prefijo de fotos heredado):** el script de
  enriquecimiento seguía copiando fotos del bucket
  `music-flow-artist-image` al prefijo `artists/` de `music-flow-images`.
  Esa copia creaba una carpeta no solicitada dentro del bucket de álbumes y
  duplicaba activos. El script ahora referencia directamente la clave raíz
  AVIF/WEBP de su bucket de fotos; ya no escribe bajo `artists/` ni bajo
  `albums/` en `music-flow-images`.
- **Verificación de la actualización:** `pnpm run typecheck` y `pnpm run
build` del backend correctos. No se ejecutó una sincronización R2 porque
  alteraría recursos remotos.

### Letras existentes no visibles en el editor administrativo

- **Identificador:** BUG-2026-029
- **Fecha:** 2026-10-08
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** al abrir una canción que ya tenía un archivo `.lrc` en R2, el
  modal mostraba el campo de enlace y el editor vacíos, como si no hubiera
  letra; por tanto tampoco distinguía entre Importar y Editar.
- **Causa raíz:** `GET /library/tracks/:id/lyrics` devolvía `{ lrc, text }`,
  mientras que el editor administrativo intentaba leer `lyricsLrc` y
  `lyricsText`. Además, la respuesta no exponía la URL pública de la clave LRC
  que realmente había sido encontrada en R2.
- **Solución:** el endpoint devuelve `lrc`, `text`, `hasLyrics` y `lyricsUrl`
  cuando localiza un objeto R2. El modal consume ese contrato, precarga texto y
  enlace, y muestra **Editar** si existe letra; conserva **Importar** para una
  pista sin letra.
- **Verificación:** 51 pruebas focalizadas de catálogo, almacenamiento y
  FlowIA correctas; typecheck y build del backend correctos; build de
  producción web correcto; `git diff --check` sin errores.
- **Estado:** verificado.

- **Reapertura 2026-10-11 (URL LRC duplicada):** al pegar una URL ya existente
  de Cloudflare R2, el endpoint descargaba el LRC y lo reflejaba otra vez en el
  bucket de letras, creando un objeto duplicado.
- **Causa raíz de la reapertura:** `updateLyrics` trataba la URL como el
  contenido de un archivo y ejecutaba el mismo espejo R2 reservado para texto
  pegado o archivos locales.
- **Solución de la reapertura:** la pista conserva ahora `lyricsUrl` como una
  referencia HTTPS R2 validada. La asociación no descarga ni escribe en R2;
  al solicitar la letra, el backend la lee bajo demanda desde esa URL para
  mantener la reproducción sin duplicarla. Una edición por texto o archivo
  local elimina la referencia y usa el flujo canónico de guardado.
- **Verificación de la reapertura:** prueba focalizada de catálogo (38/38),
  typecheck y build backend correctos. La migración
  `20261011180000_track_lyrics_url` debe aplicarse en el entorno antes de usar
  la nueva columna.

- **Reapertura 2026-10-13 (eliminación y referencia obsoleta):** el editor no
  ofrecía eliminar una letra y, si un objeto LRC enlazado se eliminaba
  directamente desde R2, el panel administrativo seguía mostrando que la
  canción tenía letra.
- **Causa raíz de la reapertura:** solo existía una operación de actualización;
  no había borrado coordinado de PostgreSQL y R2. La lectura de una URL LRC
  tampoco distinguía un `404` definitivo de otros errores temporales.
- **Solución de la reapertura:** el editor permite eliminar la letra y borra el
  objeto correspondiente de `music-flow-songs-lyrics` antes de limpiar sus
  campos. Al leer una URL vinculada, una respuesta `404` o `410` elimina solo
  la referencia obsoleta y devuelve que ya no hay letra; fallos de red no
  borran datos.
- **Verificación de la reapertura:** pruebas focalizadas de catálogo y cuotas
  (55/55), typecheck y build del backend, y typecheck/build web correctos.
- **Estado:** verificado.

### URLs antiguas de audio del catálogo

- **Identificador:** BUG-2026-030
- **Fecha:** 2026-10-08
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** algunas canciones, incluidas de Luis Miguel y Reik, no iniciaban
  reproducción aunque su WAV seguía presente en Cloudflare R2.
- **Causa raíz:** la sincronización incremental solo comparaba hash y fecha de
  modificación. Si el dominio público cambiaba, una fila existente podía
  conservar una URL anterior sin que el objeto R2 se considerara modificado.
- **Solución:** Sync R2 ahora compara también la URL pública construida desde
  la clave de audio. Se ejecutó la sincronización: 210 objetos fueron
  reconciliados y las URLs de los artistas afectados apuntan al dominio R2
  actual.
- **Verificación:** solicitudes HTTP `HEAD` a las 8 pistas actuales de Luis
  Miguel y Reik devolvieron `200 audio/wav`.
- **Estado:** verificado.

- **Reapertura 2026-10-12 (reproducción interrumpida):** se reportaron
  canciones que quedaban cargando o se detenían al reproducirse desde la web.
- **Causa raíz de la reapertura:** dos filas del catálogo aún apuntaban a
  claves eliminadas de R2 y devolvían `404`. Además, el motor precargaba el
  audio completo de la siguiente pista mientras descargaba la actual; con WAV
  o FLAC de gran tamaño ambas transferencias podían competir y aparentar un
  bloqueo.
- **Solución de la reapertura:** se corrigieron las dos referencias verificadas
  de R2 para que respondan `206 audio/wav`. La precarga de la siguiente pista
  quedó limitada a sus metadatos y la carga activa caduca tras 15 segundos en
  vez de permanecer indefinidamente en estado de reproducción.
- **Verificación de la reapertura:** auditoría HTTP por rangos sobre 222 pistas
  del catálogo; las dos referencias corregidas devolvieron `206 audio/wav`.
  Pruebas focalizadas de catálogo (40/40), typecheck y build backend, y
  typecheck y build web correctos.
- **Estado:** verificado.

### Alcance insuficiente y nombre incorrecto del asistente administrativo

- **Identificador:** BUG-2026-031
- **Fecha:** 2026-10-08
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** el asistente aparecía como “Asistente NVIDIA” y rechazaba
  consultas válidas de curaduría, como biografías breves de artistas o el año
  de lanzamiento de álbumes.
- **Causa raíz:** el prompt limitaba explícitamente al modelo a cuatro tareas
  mecánicas de calidad de catálogo y el campo de entrada no permitía saltos de
  línea.
- **Solución:** se renombró a FlowIA, se amplió su alcance de solo lectura a
  MusicFlow, curaduría y contexto musical útil, manteniendo el bloqueo de
  programación, tareas académicas y asuntos ajenos. El cuadro admite salto de
  línea con Alt+Enter y envía con Enter.
- **Verificación:** 51 pruebas focalizadas de catálogo, almacenamiento y
  FlowIA correctas; typecheck y build del backend correctos; build de
  producción web correcto; `git diff --check` sin errores.
- **Estado:** verificado.

### Artistas duplicados por featuring

- **Identificador:** BUG-2026-025
- **Fecha:** 2026-10-01
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** el catálogo duplicaba perfiles cuando el artista incluía colaboradores.
- **Causa raíz:** la importación heredada tomaba la cadena completa del crédito como artista principal.
- **Solución:** una reparación idempotente separa `feat.`, `ft.` y créditos separados por coma, vincula la canción al artista principal y guarda los invitados en `track_featured_artists` con `artistId` solo cuando existe un perfil canónico. Las tarjetas compuestas se ocultan del catálogo.
- **Verificación:** reparación sobre los datos actuales y 28/28 pruebas de `CatalogService` correctas.
- **Estado:** corregido.

### Canciones de álbum ausentes o mostradas con relación errónea en el editor

- **Identificador:** BUG-2026-026
- **Fecha:** 2026-10-01
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** un álbum podía mostrar canciones asociadas sin que aparecieran
  disponibles en el editor. Además, una canción movida a otro álbum podía
  conservar el título o portada del álbum anterior; al quitarla, seguía
  mostrando esa portada. Esto causaba mensajes visuales falsos como indicar
  que `Heaven Can Wait` no tenía álbum aunque estuviera en `Invincible`.
- **Causa raíz:** filas heredadas con `albumId` y sin `artistId` no se incluían
  en el detalle. Las operaciones de asignación solo escribían `albumId`, sin
  actualizar o limpiar los campos denormalizados `album` y `coverArt`; la web
  podía presentar el texto heredado en vez de la relación real.
- **Solución:** el detalle combina, deduplica y ordena canciones directas y
  asociadas mediante álbumes. Asignar, reordenar, editar o eliminar un álbum
  actualiza transaccionalmente `albumId`, orden, título de álbum y portada; al
  desasignar, se limpian título, orden y portada. La web resuelve el nombre
  visual desde `albumId` y la lista actual de álbumes, no desde texto obsoleto.
- **Verificación:** las pruebas focalizadas de catálogo/almacenamiento (33),
  typecheck y build del backend, y build de producción web finalizaron sin
  errores. Falta únicamente la comprobación visual autenticada sobre la
  instancia que se reinicie con este `dist`.
- **Estado:** corregido; verificación visual pendiente.

### Duraciones WAV inconsistentes

- **Identificador:** BUG-2026-027
- **Fecha:** 2026-10-01
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** la lista mostraba duraciones como 0:47 o 1:07 mientras el minirreproductor reportaba otra duración.
- **Causa raíz:** el sincronizador medía el objeto WAV completo, incluidos metadatos, en lugar del chunk `data` de audio.
- **Solución:** la sincronización calcula la duración desde el tamaño del chunk `data` y actualiza pistas existentes.
- **Verificación:** sincronización iniciada sobre 292 objetos y typecheck del backend correcto.
- **Estado:** corregido.

### Carga administrativa no localizable en R2

- **Identificador:** BUG-2026-028
- **Fecha:** 2026-10-01
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** una canción cargada desde Administración no se encontraba al buscar su nombre en el bucket de audio.
- **Causa raíz:** la clave R2 era únicamente un UUID interno.
- **Actualización 2026-10-08:** se eliminó también el sufijo UUID. Las cargas
  de catálogo usan exclusivamente `Artista - Canción.wav|flac` en la raíz del
  bucket; las privadas continúan aisladas por usuario.
- **Verificación:** pruebas de claves canónicas, typecheck y build backend, y
  build web correctos.
- **Estado:** verificado.

### Ajuste de la separaciÃ³n real de consumo IA por producto

- **Identificador:** BUG-2026-021
- **Fecha:** 2026-09-30
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **SÃ­ntoma:** el filtro de Usuario, Admin y Todos podÃ­a separar solicitudes
  por el rol de la cuenta en vez de por el modelo que consumiÃ³ los tokens. Esto
  mezclaba el asistente Haiku con administraciÃ³n y podÃ­a ocultar NVIDIA del
  desglose de modelos. Los agregados no aplicaban de forma uniforme el perÃ­odo
  solicitado.
- **Causa raÃ­z:** las preguntas NVIDIA se guardan con
  `context.source = "NVIDIA_ADMIN"`, mientras las tareas NVIDIA se guardan en
  `catalog_ai_runs`; el cÃ¡lculo inicial solo distinguÃ­a parte de estas fuentes
  mediante el rol de usuario.
- **SoluciÃ³n:** el backend usa ahora el origen persistido para clasificar las
  solicitudes: Haiku como Usuario, preguntas `NVIDIA_ADMIN` y ejecuciones de
  `catalog_ai_runs` como Admin. El mismo rango se aplica a totales, actividad,
  gasto diario y tokens por modelo. La consulta de la web se invalida por
  Ã¡mbito, por lo que ambos grÃ¡ficos reciben exactamente el mismo conjunto real
  de datos para Usuario, Admin o Todos.
- **VerificaciÃ³n:** suite focalizada de `AdminService.getAiCosts` correcta,
  incluyendo el modelo NVIDIA, las tareas de catÃ¡logo y la separaciÃ³n por
  origen; typecheck del backend correcto.
- **Estado:** verificado.

### Duraciones de catálogo y auditoría de NVIDIA

- **Identificador:** BUG-2026-018
- **Fecha:** 2026-09-29
- **Entorno afectado:** `apps/mobile/`, `apps/web/` y `apps/backend/`
- **Síntoma:** varias canciones de catálogo mostraban duraciones inverosímiles
  como 0:47. El panel de solicitudes IA mostraba Haiku, pero omitía las
  consultas del asistente administrativo NVIDIA y no permitía exportar el
  resumen estadístico en PDF.
- **Causa raíz:** la sincronización R2 solo refrescaba campos de almacenamiento
  de una pista existente, conservando su duración de respaldo errónea. Las
  consultas NVIDIA no se registraban en el flujo común de auditoría `AIRequest`.
- **Solución:** la sincronización vuelve a sondear WAV y corrige la duración de
  filas existentes; el reproductor móvil publica la duración decodificada por
  el motor. Las consultas NVIDIA se auditan sin afectar cuota y el panel ofrece
  un reporte imprimible/guardable como PDF con métricas por modelo.
- **Verificación:** `git diff --check` sin errores; queda pendiente validar una
  sincronización R2 y la exportación en navegador autenticado.
- **Estado:** corregido; verificación funcional pendiente.

### Exportación PDF de analítica IA según plantilla oficial

- **Identificador:** BUG-2026-019
- **Fecha:** 2026-09-29
- **Entorno afectado:** `apps/web/`
- **Síntoma:** la exportación en PDF generaba una captura monocromática oscura de
  una sola página en lugar de seguir la estructura y diseño de la plantilla
  oficial de reporte estadístico de 7 páginas (`Plantilla de Reporte MusicFlow Estadistica.pdf`).
- **Causa raíz:** la función anterior `buildAiReportPdf` construía un único
  lienzo rectangular plano sin cargar la plantilla base de la empresa ni
  distribuir las secciones en las diapositivas correspondientes (portada con
  vinilo 3D, índice, actividad diaria, métricas consolidadas, distribución por
  modelo, eficacia/aceptación y portada de cierre).
- **Solución:** se implementó el generador `generateAiReportPdf` en
  `src/shared/utils/generateAiReportPdf.ts` usando `pdf-lib` y la plantilla
  vectorial ubicada en `public/templates/report-template.pdf`. El generador
  dibuja dinámicamente mes/año en portada, índice de contenidos, gráfico y
  tarjetas de actividad diaria, tarjetas azules de métricas e inversión total,
  desglose de modelos (Claude Haiku, NVIDIA) y tasa de eficacia con finalidades,
  manteniendo la estética visual de la plantilla.
- **Verificación:** `tsc -b` y `vite build` en `apps/web` completaron con éxito
  (código de salida 0); validación de renderizado de las 7 páginas en PDF.
- **Estado:** corregido y verificado.

### Cambio de pista conserva audio anterior con repetición activa

- **Identificador:** BUG-2026-016
- **Fecha:** 2026-09-29
- **Entorno afectado:** `apps/mobile/`
- **Síntoma:** al reproducir una pista desde el perfil de Paulo Londra y luego
  avanzar a la siguiente con el bucle de una pista activo, la interfaz podía
  indicar `Chance` mientras seguía sonando `Adán y Eva`.
- **Causa raíz:** el controlador adelantaba el estado visible de la cola antes
  de que el motor de audio confirmara el cambio y usaba `seekToNext`, operación
  que puede conservar la fuente actual bajo `LoopMode.one`.
- **Solución:** siguiente, anterior y la selección desde cola solicitan ahora
  explícitamente el índice destino con `skipToQueueItem`; el estado visible se
  actualiza mediante el `mediaItem` confirmado por el motor. Un contador de
  versión descarta comandos de cola obsoletos durante cambios rápidos.
- **Verificación:** pendiente de análisis estático y prueba manual en emulador
  con repetición de una pista activa.
- **Estado:** corregido; verificación en curso.

### Interacciones de teclado y navegación móvil

- **Identificador:** BUG-2026-017
- **Fecha:** 2026-09-29
- **Entorno afectado:** `apps/mobile/`
- **Síntoma:** se reportaron fallos en interacciones con el teclado móvil y una
  experiencia de navegación menos ágil que la aplicación web. No se adjuntó la
  pantalla ni una secuencia reproducible del teclado.
- **Causa raíz:** en investigación; sin una secuencia concreta no es posible
  atribuir el fallo a foco, insets del teclado, acción IME o un formulario.
- **Solución:** se añadió una regla permanente para preservar foco, visibilidad
  y acciones IME en toda pantalla con campos. La carga no crítica de Home ya
  permanece diferida y con caché temporal, evitando bloquear la navegación.
- **Verificación:** pendiente de probar los formularios afectados con teclado
  visible en emulador o dispositivo Android.
- **Estado:** en investigación.

### Asistente NVIDIA de administrador, OAuth móvil y selector de idioma

- **Identificador:** BUG-2026-015
- **Fecha:** 2026-09-27
- **Entorno afectado:** `apps/backend/`, `apps/web/` y `apps/mobile/`
- **Síntoma:** el panel administrativo no exponía un acceso conversacional al
  modelo NVIDIA configurado; el login móvil podía quedar sin OAuth Google si la
  herramienta de compilación no propagaba el `dart-define`; y se exponía un
  selector de idioma de relleno.
- **Causa raíz:** el módulo NVIDIA solo estaba disponible por rutas técnicas de
  tareas de catálogo, mientras que el ID público de OAuth dependía de la
  invocación de Flutter y los selectores seguían renderizándose en ajustes.
- **Solución:** se añadió un botón flotante exclusivo de Admin que consulta una
  ruta JWT + rol ADMIN, de solo lectura y limitada a las cuatro tareas de
  calidad del catálogo. El ID OAuth público tiene respaldo para cualquier build
  móvil y conserva la validación de audiencia en backend. Se retiraron los
  selectores Español/Inglés de las vistas web; mobile no tenía uno renderizado.
- **Verificación:** `pnpm --dir apps/backend run typecheck`,
  `pnpm --dir apps/web run build`, `dart analyze` focalizado y `flutter test`
  completaron sin errores.
- **Actualización (2026-09-27):** se eliminó el mensaje inicial del chat, se
  agregó el icono Google y los errores de acceso ahora se muestran en diálogo.
  La ruta NVIDIA se compiló y el backend local ya responde en
  `/api/admin/catalog-ai/assistant` (401 sin JWT, como corresponde). La
  consulta de letras usa conteos deterministas del catálogo.
- **Actualización (2026-09-28, fidelidad del reproductor):** la composición
  anterior todavía mantenía una portada cuadrada central, distinta a la
  referencia. Se retiró esa portada de primer plano: la carátula ahora ocupa
  exclusivamente el fondo ambiental, las tres siguientes canciones reales se
  leen sobre ese fondo y los controles se concentran abajo en un arco orbital
  con progreso curvo, tiempos, anterior, reproducir y siguiente. La cola,
  favoritos, biblioteca y letras conservan sus acciones existentes.
- **Verificación adicional:** `git diff --check` sin errores. El análisis
  focalizado de Dart quedó pendiente porque el proceso local no devolvió un
  resultado antes del límite de ejecución.
- **Actualización (2026-09-28, controles orbitales):** la barra curva no
  respondía a un toque directo y el bucle solo alternaba entre apagado y una
  canción, sin señal visual clara. Ahora tocar o arrastrar la franja de
  progreso busca inmediatamente esa posición; el bucle alterna entre apagado,
  repetir la cola y repetir una canción, y refleja el modo activo mediante
  color e icono `repeat`/`repeat_one` tanto en la vista ampliada como en el
  minirreproductor.
- **Verificación adicional:** `git diff --check` correcto y búsqueda de los
  símbolos anteriores de bucle sin referencias restantes en `apps/mobile/lib`.
- **Bloqueo externo OAuth:** Google requiere registrar en su proyecto Cloud un
  cliente Android con paquete `com.musicflow.app` y SHA-1 de debug
  `F4:81:BF:68:E6:58:AF:63:4A:A2:00:A0:3F:B0:A0:00:74:9D:DC:A5`.
  Un `.env` o `10.0.2.2` no autorizan el binario ante Google. El cliente ahora
  muestra este diagnóstico en lugar de ocultarlo; falta ese registro, que
  exige acceso al proyecto Google Cloud.
- **Actualización (2026-09-28):** en móvil se reemplazó el bloque estático
  “MusicFlow Mix” por un carrusel automático de recomendaciones reales, se
  muestra el contador de seguidores que devuelve el catálogo y se refresca al
  seguir/dejar de seguir. El perfil incorpora los artistas más escuchados. La
  IA queda oculta y deshabilitada para cuentas gratuitas. También se rediseñó
  la vista ampliada del reproductor con carátula protagonista y controles
  orbitales, sin retirar cola, favoritos, biblioteca, letras, EQ ni segmentos.
  El balance L/R fue sustituido por Reset de las diez bandas de EQ.
- **Actualización (2026-09-28, visual):** el modo Brillo móvil ya no pinta un
  resplandor de color. Calcula el avance de cada palabra de la línea LRC activa
  usando su intervalo hasta la siguiente línea y la rellena gradualmente en
  blanco, equivalente al karaoke de web. El reproductor ampliado pasó de un
  panel rectangular a una composición circular con progreso superior, tiempos,
  controles laterales y botón principal central, manteniendo los colores del
  tema activo y los accesos existentes.
- **Actualización (2026-09-28, composición):** se corrigió la interpretación
  anterior del prototipo: la carátula actual ahora también se proyecta como
  fondo ambiental atenuado, mientras la portada principal se mantiene al centro
  y hasta tres canciones reales de la cola siguiente se distribuyen detrás de
  ella. Los controles permanecen agrupados en el tercio inferior, con el botón
  de reproducción central, en vez de limitar el rediseño a sus iconos.
- **Actualización (2026-09-28, ajuste final):** se eliminó la cola de la zona
  central/fondo para que no compita con la canción actual. Las pistas anterior
  y siguientes se muestran únicamente alrededor del arco de reproducción. El
  lienzo del arco ahora tiene al menos el mismo alto que su diámetro, evitando
  el recorte que desalineaba la circunferencia. En el área visual de la canción
  se añadieron gestos: deslizar a la izquierda pasa a la siguiente pista y a la
  derecha vuelve a la anterior.
- **Actualización (2026-09-28, arco y búsqueda):** se retiraron también los
  nombres que todavía quedaban alrededor del arco. La búsqueda temporal deja
  de convertir la coordenada horizontal en tiempo: ahora traduce el ángulo del
  toque o arrastre sobre el arco a su fracción de reproducción. El arco se
  amplió y su barrido va desde abajo a la izquierda sobre la parte superior,
  con la abertura hacia arriba, como la referencia visual.
- **Actualización (2026-09-28, trayectoria y Brillo):** el arco se fijó a un
  semicírculo superior de tamaño constante; los extremos terminan al mismo
  nivel y no cambian con los minutos de la canción. Brillo ahora interpola cada
  avance de palabra durante 180 ms en lugar de aplicar el siguiente porcentaje
  instantáneamente, logrando un relleno continuo equivalente al de web.
- **Estado:** pendiente de configuración OAuth externa.

### Álbumes ausentes o incompletos

- **Identificador:** BUG-2026-003
- **Fecha:** 2026-09-24
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** algunos artistas no muestran todos sus álbumes o presentan
  álbumes sin nombre, portada o asociación completa.
- **Causa raíz:** las portadas y relaciones de álbum podían quedar desalineadas
  al mezclar metadatos inferidos desde R2 con asignaciones existentes.
- **Solución:** el álbum pasó a ser la fuente autoritativa de portada y la
  auditoría corrige transaccionalmente las canciones que no coinciden.
- **Verificación:** se repararon 40 portadas; el resultado posterior informa 0
  álbumes incompletos y 0 portadas inconsistentes.
- **Estado:** verificado.

### La sincronización R2 puede sobrescribir cambios de Admin

- **Identificador:** BUG-2026-004
- **Fecha:** 2026-09-24
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** existe el riesgo de que una sincronización desde R2 reemplace
  nombres, portadas o asociaciones de canciones y álbumes curadas desde Admin.
- **Causa raíz:** el importador R2 actualizaba metadatos visuales y de álbum de
  pistas existentes al detectar una coincidencia de portada.
- **Solución:** la sincronización ahora actualiza solo campos técnicos de
  almacenamiento para filas existentes; Admin conserva relaciones, nombres y
  portadas curadas. El backfill únicamente llena relaciones vacías.
- **Verificación:** pruebas enfocadas del servicio y revisión del flujo de
  sincronización; falta una prueba e2e automatizada con R2 simulado.
- **Estado:** corregido.

### Persistencia de sesión y sincronización incremental

- **Identificador:** BUG-2026-011
- **Fecha:** 2026-09-24
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** la sesión web terminaba al cerrar la pestaña y Sincronizar R2
  permanecía cargando durante reconstrucciones completas.
- **Causa raíz:** Zustand usaba `sessionStorage` y el endpoint lanzaba cinco
  scripts de catálogo completos en una única petición HTTP.
- **Solución:** la sesión web se persiste en `localStorage`; la sincronización
  ejecuta la importación idempotente incremental de R2 y su auditoría.
- **Verificación:** typecheck y build de los entornos afectados en curso.
- **Estado:** corregido.

### Catálogo administrativo no carga

- **Identificador:** BUG-2026-005
- **Fecha:** 2026-09-24
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** al abrir Catálogo desde Administración, no se muestra contenido.
- **Causa raíz:** además de la ruta API ausente en la instancia anterior, las
  rutas hijas de Admin se declaraban como absolutas dentro de `/admin/*`. Por
  ello `/admin/catalog` no coincidía con la rama del panel. El modal de
  colaboradores también se renderizaba fuera del componente que poseía su
  estado, lo que impedía compilar la página.
- **Solución:** las rutas de Admin y Artista son ahora relativas a sus prefijos;
  se conserva la ruta API protegida y el modal de colaboradores se renderiza en
  el editor del artista que administra su estado.
- **Verificación:** `tsc -b` y compilación de producción Vite correctas; ESLint
  web sin errores; typecheck backend y 27 pruebas de catálogo correctas.
- **Estado:** verificado.

### Edición de canciones y validación de recursos del catálogo

- **Identificador:** BUG-2026-006
- **Fecha:** 2026-09-24
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** Administración no permitía editar de manera independiente una
  canción ni importar letras mediante enlace R2 o arrastre de un archivo LRC;
  las portadas aceptaban formatos y dimensiones no normalizados.
- **Causa raíz:** el catálogo solo tenía operaciones para asociación de álbum y
  una edición de letra basada en texto, mientras que la validación de imágenes
  aceptaba formatos heterogéneos sin inspeccionar dimensiones.
- **Solución:** se añadió edición de título por canción, importación segura de
  `.lrc` desde R2 y por arrastre, y validación backend de AVIF/WEBP a 640×637 px.
  Las canciones con álbum conservan la portada autoritativa de ese álbum.
- **Verificación:** compilación y validación funcional del backend y web en
  curso; falta comprobación manual autenticada.
- **Estado:** en investigación.

### Reconstrucción Docker de la aplicación web no disponible

- **Identificador:** BUG-2026-007
- **Fecha:** 2026-09-24
- **Entorno afectado:** infraestructura local y `apps/web/`
- **Síntoma:** `docker compose up --build web` falla antes de construir porque
  el servicio referencia `apps/web/Dockerfile`, archivo que no existe.
- **Causa raíz:** el `docker-compose.yml` declara un Dockerfile de frontend no
  incluido en el repositorio.
- **Solución:** pendiente; el backend se puede reconstruir de forma aislada.
- **Verificación:** fallo reproducido con Docker Compose.
- **Estado:** en investigación.

### Error EPERM al renombrar la DLL del motor de Prisma en Windows

- **Identificador:** BUG-2026-008
- **Fecha:** 2026-09-24
- **Entorno afectado:** `apps/backend/`
- **Síntoma:** `pnpm run start` en `apps/backend` falla con
  `EPERM: operation not permitted, rename '...\.prisma\client\query_engine-windows.dll.node.tmpNNNN' -> '...\query_engine-windows.dll.node'`.
- **Causa raíz:** en Windows, la DLL `query_engine-windows.dll.node` queda
  bloqueada por procesos vivos de instancias previas del backend que ya la
  tenían cargada. Al ejecutar `prestart` (que corre `prisma generate`), el
  motor intenta renombrar el archivo temporal sobre la DLL bloqueada y Windows
  devuelve `EPERM`. Se detectaron dos instancias activas (`node dist/src/main.js`
  y `node dist/src/main` vía `nest start --watch`).
- **Solución:** se detuvieron los procesos del backend en ejecución, se
  eliminaron los archivos temporales huérfanos
  `query_engine-windows.dll.node.tmp*` y se volvió a ejecutar `prisma generate`.
- **Verificación:** `pnpm run prisma:generate` completó satisfactoriamente tras
  la limpieza; la carpeta `client` quedó solo con el binario final válido.
- **Estado:** corregido. Para evitarlo, detener las instancias previas del
  backend antes de ejecutar `pnpm run start`.

- **Reapertura 2026-10-12 (arranque innecesariamente lento):** aun sin
  procesos Node, Prisma o Electron activos, `pnpm run start` ejecutaba en cada
  arranque `prisma generate`, `prisma migrate deploy` y una compilación Nest.
  La migración sin cambios tomó 1.33 s, la compilación 10.77 s y
  `prisma generate` volvió a fallar con `EPERM` al renombrar la DLL, por lo que
  el servicio podía no llegar a escuchar el puerto.
- **Causa raíz de la reapertura:** tareas de preparación de build y generación
  de cliente se habían puesto en `prestart`, que pnpm ejecuta para cada inicio
  normal, aunque `start` consume el artefacto `dist` ya compilado.
- **Solución de la reapertura:** el arranque normal solo comprueba/aplica
  migraciones pendientes y arranca `dist`; `start:verified` conserva la ruta
  explícita para regenerar Prisma, migrar y compilar cuando se requiere. El
  origen exacto del bloqueo externo de Windows queda pendiente de identificar,
  pero ya no bloquea la operación normal del servidor.
- **Verificación de la reapertura:** `prisma migrate status` confirmó 22
  migraciones aplicadas; el servidor inició y expuso Swagger en el puerto 8001
  con el nuevo flujo.

### Sincronización administrativa R2 no inicia en Windows

- **Identificador:** BUG-2026-009
- **Fecha:** 2026-09-24
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** el botón Sincronizar R2 respondía con `spawn EINVAL`.
- **Causa raíz:** `execFile` intentaba iniciar directamente `pnpm.cmd`, un shim
  de Windows no ejecutable por esa API de Node.
- **Solución:** la sincronización usa `cmd.exe` con comandos internos fijos en
  Windows y conserva la ejecución directa de `pnpm` en otros sistemas.
- **Verificación:** typecheck y build backend correctos.
- **Estado:** corregido.

### Biblioteca de usuario e identidad pública de artistas

- **Identificador:** BUG-2026-010
- **Fecha:** 2026-09-24
- **Entorno afectado:** `apps/web/`, `apps/mobile/` y `apps/backend/`
- **Síntoma:** el botón + importaba canciones, y el listado público podía incluir
  artistas solo colaboradores o perfiles duplicados.
- **Causa raíz:** la UI de usuario reutilizaba el importador y la consulta
  pública no distinguía artistas principales de créditos featuring.
- **Solución:** + crea una biblioteca; se retiraron accesos de importación de la
  UI web y la consulta pública exige canciones principales y deduplica por
  identidad normalizada.
- **Verificación:** compilación TypeScript correcta.
- **Estado:** corregido.

### Gestión de foto y seguimiento de artistas

- **Identificador:** BUG-2026-012
- **Fecha:** 2026-09-25
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** el catálogo mostraba un filtro de géneros redundante y un botón
  textual `URL` para la foto; además, algunos perfiles públicos no encontraban
  su artista de catálogo y por ello no presentaban seguimiento ni seguidores.
- **Causa raíz:** la interfaz exponía controles de administración sin un flujo
  explícito de selección de origen y la resolución del artista exigía igualdad
  literal de nombre, sensible a mayúsculas, espacios y tildes; además, el
  perfil de usuario usaba el listado reservado a administradores.
- **Solución:** se eliminó el combobox; el lápiz abre un modal con tarjetas de
  URL pública R2 o archivo AVIF/WEBP de 640 × 637 px. El perfil normaliza el
  nombre antes de resolver el artista y consulta su endpoint público. Conserva
  el seguimiento persistente en backend, con actualización optimista, entre
  pestañas y por sondeo.
- **Verificación:** typecheck de backend y typecheck/build de producción web
  correctos.
- **Estado:** verificado.

- **Reapertura 2026-10-09 (URL R2):** al pegar una URL pública ya existente de
  Cloudflare R2, el backend la descargaba y la subía de nuevo con la clave
  canónica del artista, duplicando el objeto en el bucket.
- **Causa raíz de la reapertura:** el flujo de URL reutilizaba el uploader de
  archivos, aunque el activo ya residía en Cloudflare R2.
- **Solución de la reapertura:** tras validar que la URL HTTPS corresponde a un
  AVIF/WEBP público de R2, se persiste esa URL y se actualizan las canciones
  del artista en una transacción, sin descargar ni escribir un objeto nuevo.
- **Verificación de reapertura:** prueba unitaria confirma que el uploader no
  se invoca; `pnpm run test -- catalog.service.spec.ts` (32/32), typecheck y
  build del backend correctos.

- **Reapertura 2026-10-13 (edición consecutiva y renombre):** al editar la
  URL R2 de la foto de un segundo artista, el campo podía conservar la URL del
  primero. Además, renombrar un artista dejaba la columna histórica de sus
  pistas con el nombre anterior, haciendo que el perfil existente pareciera
  vacío o separado.
- **Causa raíz de la reapertura:** el selector de imagen mantenía su estado
  local al cambiar el artista seleccionado; el rename solo actualizaba la fila
  `artists`, no la representación denormalizada de sus pistas.
- **Solución de la reapertura:** el selector de foto se remonta por `artistId`
  para iniciar con una URL vacía. El renombre se ejecuta en transacción y
  actualiza las pistas con el mismo `artistId`, conservando el mismo perfil,
  álbumes, seguidores y relaciones existentes.
- **Verificación de la reapertura:** prueba de renombre preserva `artistId` y
  actualiza la representación de pista; pruebas focalizadas (55/55),
  typecheck/build backend y typecheck/build web correctos.
- **Estado:** verificado.

- **Actualización 2026-10-11 (retiro de foto):** Administración no permitía
  retirar una foto ya asociada sin eliminar al artista. Se añadió el endpoint
  protegido `DELETE /admin/catalog/artists/:id/image` y el control de papelera
  en el editor. La operación limpia `Artist.imageUrl` y `Track.artistImage` en
  una transacción; conserva el objeto R2, porque puede ser un activo compartido
  o cargado manualmente y no se debe borrar de forma irreversible al editar el
  perfil.
- **Verificación de la actualización:** `catalog.service.spec.ts` (37/37),
  typecheck y build del backend correctos; typecheck y build web correctos.

### Rankings musicales y editor de segmentos

- **Identificador:** BUG-2026-013
- **Fecha:** 2026-09-25
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** una canción eliminada podía permanecer temporalmente en el
  ranking de menos escuchadas. Al crear un segmento, se mostraba de inmediato
  el texto de confirmación de eliminación y el botón Probar no reproducía una
  canción ya seleccionada pero pausada.
- **Causa raíz:** el ranking de Dashboard se almacenaba en una consulta de
  React Query distinta de la que se invalidaba al borrar del catálogo. El
  estado de confirmación se renderizaba como error del editor y la vista previa
  solo buscaba la posición, sin reanudar el motor de audio.
- **Solución:** la eliminación invalida también `music-insights`; el backend
  ya calcula el ranking exclusivamente desde la tabla actual de canciones y
  las relaciones de historial se eliminan en cascada. La confirmación se mueve
  a un diálogo que solo abre con el tacho rojo y Probar aplica los cambios tras
  cargar la pista, busca el inicio y llama a reproducción explícitamente.
- **Verificación:** typecheck backend y build de producción web correctos;
  `git diff --check` sin errores.
- **Estado:** verificado.

- **Reapertura 2026-10-09:** el ranking seguía incluyendo filas históricas de
  `tracks` aunque la canción ya no fuera parte del catálogo publicado o su
  artista hubiese sido eliminado. Las consultas de más/menos escuchadas y de
  artistas escuchados ahora exigen `is_catalog = true` y una unión con el
  artista existente; los artistas más seguidos también requieren al menos una
  canción publicada. Esto elimina de las estadísticas canciones como “A quien
  quiero mentirle” cuando ya no pertenecen a MusicFlow.
- **Verificación de reapertura:** prueba unitaria de `getMusicInsights`, 39
  pruebas focalizadas de administración/catálogo, typecheck y build backend, y
  build web correctos.

### Selector de featuring no representaba colaboradores registrados

- **Identificador:** BUG-2026-032
- **Fecha:** 2026-10-09
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** el modal de Featuring exigía escribir una cadena separada por
  comas, no permitía elegir visualmente artistas del catálogo ni diferenciaba
  colaboradores sin perfil. El cliente tampoco mostraba de forma uniforme los
  créditos en resultados de búsqueda y reproducción.
- **Causa raíz:** la interfaz reducía los créditos a nombres de texto y perdía
  el `artistId` que permite enlazar un colaborador registrado; la respuesta de
  biblioteca no incluía los créditos de featuring.
- **Solución:** el modal usa tarjetas seleccionables de artistas, permite varios
  créditos y añade una tarjeta “Artista no registrado” que persiste el nombre
  con `artistId: null`. La API de canciones devuelve los créditos ordenados,
  permite buscar por ellos y la web presenta `Artista principal ft. …` en
  biblioteca, búsqueda y reproductor, sin fabricar perfiles para los nombres
  no registrados.
- **Verificación:** 39 pruebas focalizadas de backend, typecheck/build backend
  y build de producción web correctos.
- **Estado:** verificado.

- **Reapertura 2026-10-11 (perfiles compuestos heredados):** una canción con
  texto como `Sean Paul ft. Dua Lipa` podía abrir o conservar un perfil público
  sintético con ese nombre, en vez de tratar a Sean Paul y Dua Lipa como
  artistas independientes.
- **Causa raíz de la reapertura:** aunque los créditos nuevos se persistían por
  canción, aún se admitían nombres compuestos en el CRUD y las rutas paginadas
  o el reproductor podían reutilizar el texto de registros legacy como destino
  de navegación.
- **Solución de la reapertura:** el CRUD rechaza nombres de artista con
  `ft.`, `feat.`, `featuring` o listas; las lecturas públicas excluyen y
  responden 404 para perfiles compuestos. Las filas heredadas se interpretan al
  leerlas como artista principal y créditos por canción, y el reproductor usa
  el nombre principal separado para navegar al perfil. Los créditos siguen
  visibles en la etiqueta de reproducción.
- **Verificación de la reapertura:** `catalog.service.spec.ts` (37/37),
  typecheck/build backend y typecheck/build web correctos.

- **Reapertura 2026-10-12 (enlaces individuales en reproductor):** el
  reproductor normal y expandido seguían tratando la etiqueta completa
  `principal ft. invitado` como un único enlace, por lo que no permitían abrir
  el perfil de cada colaborador por separado.
- **Causa raíz:** `PlayerTrack` conservaba únicamente la cadena formateada y
  descartaba los créditos ordenados que ya devolvía la API.
- **Solución:** la cola conserva los créditos de featuring con su `artistId` y
  ambos reproductores renderizan enlaces individuales para el artista principal
  y cada colaborador registrado. Los invitados no registrados se muestran como
  texto y no intentan abrir un perfil inexistente. Estado: corregido;
  verificación de compilación pendiente en la tarea actual.

- **Reapertura 2026-10-12 (perfil compuesto `Elton John, Dua Lipa`):** una
  pista legacy y su álbum estaban ligados a un perfil compuesto, aunque solo
  Dua Lipa existe como artista de MusicFlow y Elton John es un colaborador sin
  perfil. El reparador ahora reconoce listas separadas por comas, elige el
  artista registrado como principal y conserva los demás nombres como créditos
  no enlazables. Primero emite una vista previa; solo `repair:featuring:apply`
  persiste las reasignaciones de pistas y de álbumes cuyo contenido completo
  resuelve al mismo artista. La modificación de la base local queda pendiente
  de confirmación explícita antes de aplicarla.

- **Aplicación 2026-10-12:** con autorización, `Cold Heart PNAU Remix` quedó
  asociado a Dua Lipa y Elton John quedó como crédito con `artistId: null`, por
  lo que se muestra pero no abre un perfil. Como ya existía un álbum canónico
  de Dua Lipa con el mismo título, la pista se movió a dicho álbum; no se
  fusionaron ni borraron los álbumes legacy. El reparador conserva esta misma
  protección ante colisiones de pista o álbum. Finalmente retiró los perfiles
  compuestos huérfanos (sin canciones, seguidores ni créditos enlazados),
  incluido `Elton John, Dua Lipa`.
- **Verificación de la aplicación:** lectura directa de PostgreSQL confirmó el
  `artistId` de Dua Lipa, el único crédito `Elton John` sin enlace, el álbum
  canónico de Dua Lipa y la ausencia del perfil compuesto; typecheck y build
  del backend correctos.

### Aislamiento de cuenta, OAuth móvil, EQ de biblioteca y análisis IA

- **Identificador:** BUG-2026-014
- **Fecha:** 2026-09-26
- **Entorno afectado:** `apps/mobile/`, `apps/web/` y `apps/backend/`
- **Síntoma:** el botón Google no aparecía en ejecuciones móviles de desarrollo;
  un login de administrador reemplazaba la cuenta de otra pestaña; el tema se
  compartía entre cuentas; la EQ de una playlist no se aplicaba al reproducir,
  y el análisis de solicitudes IA no tenía exportación Excel.
- **Causa raíz:** Flutter solo recibía el ID OAuth al ejecutar con un
  `dart-define`; la autenticación web usaba `localStorage` global y las
  preferencias no se asociaban a una identidad. La reproducción omitía el
  `playlistId`, y una configuración desde preset guardaba bandas vacías.
- **Solución:** el build debug móvil tiene el ID público de desarrollo como
  respaldo; la sesión web es por pestaña y las preferencias se persisten por
  usuario. La cola propaga el `playlistId`, el backend materializa los valores
  del preset autorizado y la pantalla IA exporta todas las filas filtradas.
- **Verificación:** build de producción web, typecheck backend, prueba unitaria
  de resolución EQ, prueba Flutter y análisis focalizado de configuración
  móvil correctos; `git diff --check` sin errores.
- **Estado:** verificado.

- **Actualización 2026-10-11 (destino inicial web):** el flujo posterior a la
  sugerencia de audífonos llevaba a usuarios normales a Biblioteca. Ahora la
  transición autenticada termina en `/inicio`, que corresponde a Descubrir;
  el acceso de administrador permanece en su panel.
- **Verificación de la actualización:** `pnpm exec tsc -b` web correcto;
  build de producción correcto en esta tarea.

### Consumo NVIDIA ausente en la analítica de peticiones IA

- **Actualización 2026-10-09 (interacción inicial):** al alternar por primera
  vez entre Usuario, Admin y Todos, la web podía pintar temporalmente la
  respuesta almacenada para el ámbito previo. El segundo clic parecía corregir
  el gráfico porque ya existía caché para ambas consultas.
- **Causa raíz de la actualización:** el componente de gráficos no verificaba
  que `report.scope` correspondiera al estado seleccionado antes de reutilizar
  su lienzo de Chart.js.
- **Solución de la actualización:** la vista ahora espera el informe del ámbito
  actual y remonta el tablero por ámbito; así nunca se muestran datos o series
  del filtro anterior durante el primer cambio.
- **Verificación de la actualización:** typecheck y build web pendientes de
  esta tarea: `pnpm exec tsc -b` y `pnpm run build` correctos.

### Burbuja FlowIA no desplazable

- **Identificador:** BUG-2026-033
- **Fecha:** 2026-10-09
- **Entorno afectado:** `apps/web/`
- **Síntoma:** la entrada flotante de FlowIA permanecía fija en la esquina y
  no se podía reubicar para evitar contenido de administración.
- **Causa raíz:** el componente solo implementaba el evento de clic y no
  gestionaba eventos de puntero ni posición persistente dentro de la sesión.
- **Solución:** la burbuja admite arrastre con mouse o táctil, captura el
  puntero, limita su posición al viewport y evita abrir/cerrar el chat al
  terminar un arrastre.
- **Verificación:** `pnpm exec tsc -b` y `pnpm run build` en web correctos.

- **Reapertura 2026-10-12 (panel desanclado):** después de arrastrar la
  burbuja, el panel se renderizaba dentro del flujo vertical del lanzador, por
  lo que se abría desde una coordenada equivocada y podía separar o desplazar
  visualmente la burbuja. El panel ahora se posiciona de forma absoluta con la
  burbuja como ancla, abre arriba cuando existe espacio y abajo cerca del borde
  superior, y se alinea al borde derecho cuando es necesario para no salirse
  del viewport. Estado: corregido; verificación de compilación pendiente en la
  tarea actual.

**ActualizaciÃ³n 2026-09-30:** se retirÃ³ del panel la secciÃ³n visual de
analÃ­tica de peticiones; queda Ãºnicamente el grÃ¡fico de tokens consumidos por
modelo. Sus filtros Usuario, Admin y Todos siguen consultando el agregado real
del backend, incluyendo `NVIDIA_ADMIN` y `catalog_ai_runs`.

- **Identificador:** BUG-2026-020
- **Reapertura 2026-09-30:** la consulta directa a PostgreSQL encontrÃ³ 7
  solicitudes Haiku y ninguna fila NVIDIA, ni ejecuciones en
  `catalog_ai_runs`. Por lo tanto, el problema no era una serie visual vacÃ­a:
  el backend estaba devolviendo respuestas NVIDIA sin garantizar su auditorÃ­a.
  Se cambiÃ³ el guardado a obligatorio; una respuesta administrativa ya no se
  considera exitosa si no se pudo insertar su registro con
  `context.source = "NVIDIA_ADMIN"` y el modelo configurado. El histÃ³rico que
  nunca fue persistido no se inventa ni se puede reconstruir sin una fuente de
  auditorÃ­a externa.
- **Fecha:** 2026-09-30
- **Entorno afectado:** `apps/web/` y `apps/backend/`
- **Síntoma:** en “Peticiones IA”, el gráfico “Tokens consumidos por modelo”
  ignoraba el consumo de NVIDIA ya implementado para el administrador, y la
  sección “Analítica de Peticiones IA” solo agregaba las solicitudes de los
  usuarios. No existía forma de comparar por separado el consumo de usuarios y
  del administrador, aunque sus costes difieren.
- **Causa raíz:** el consumo de NVIDIA se guarda en dos fuentes distintas. Las
  preguntas del asistente se registran en `ai_requests` con
  `context.source = "NVIDIA_ADMIN"`, pero las tareas administrativas se registran
  en `catalog_ai_runs`, y `AdminService.getAiCosts` solo consultaba `ai_requests`.
  Además, el endpoint no distinguía el origen del gasto, por lo que las
  ejecuciones de catálogo no se sumaban a ningún total ni modelo.
- **Solución:** `getAiCosts` acepta el ámbito `all`, `user` o `admin` y agrega en
  paralelo las solicitudes de usuarios, las de administradores y las ejecuciones
  de NVIDIA; los totales, la actividad por día, el gasto diario y el desglose por
  modelo incluyen las tres fuentes, con origen `USERS` o `ADMINS` por modelo y
  fusión de las preguntas NVIDIA con las tareas de catálogo. La web muestra el
  selector de ámbito, la comparación de fuentes y el origen en el gráfico, y el
  PDF recoge ambos datos. Se corrigió además la prueba del cliente NVIDIA, que
  seguía esperando el campo `nvext.guided_json` retirado del endpoint.
- **Verificación:** 136 pruebas unitarias del backend correctas, incluida la
  nueva suite de `AdminService.getAiCosts`; typecheck y ESLint del backend sin
  errores; agregaciones comprobadas contra PostgreSQL local con una ejecución
  NVIDIA temporal; typecheck, lint y build de producción web correctos.
- **Estado:** verificado.
