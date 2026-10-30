# Memoria persistente de MusicFlow

Este archivo contiene reglas permanentes para el trabajo realizado en el
repositorio. Son objetivos globales y deben aplicarse independientemente de las
skills utilizadas en cada tarea.

## Calidad, seguridad y corrección

- Genera siempre código seguro, mantenible y de calidad.
- Antes de entregar un cambio, verifica los entornos afectados:
  `apps/mobile/`, `apps/web/` y/o `apps/backend/`.
- Si una modificación provoca un error, investiga y documenta su causa raíz;
  no te limites a ocultar el síntoma.
- Corrige los errores introducidos por el cambio y ejecuta verificaciones
  proporcionales al riesgo, como formato, análisis estático, compilación y
  pruebas relevantes.
- No des por terminado un trabajo mientras permanezcan errores causados por la
  implementación o mientras falte una verificación razonablemente accesible.
- Conserva los cambios preexistentes del usuario y evita modificar partes no
  relacionadas con la tarea.

## Legibilidad del código

- El código fuente de `apps/mobile/`, `apps/web/` y `apps/backend/` debe tener
  saltos de línea y una estructura legible.
- No comprimas varias declaraciones, condiciones, propiedades o bloques en una
  sola línea cuando eso perjudique la lectura o el mantenimiento.
- Respeta los formateadores y convenciones establecidos por cada entorno.
- Esta regla no exige modificar archivos generados, compilados, minificados o
  pertenecientes a dependencias externas.

## Integridad permanente del catálogo

Estas invariantes deben comprobarse después de cada sincronización con
Cloudflare R2 y después de cualquier operación administrativa que modifique
artistas, álbumes, canciones, portadas o colaboraciones.

### 1. Fotografías de artistas

- Todo artista publicado debe tener una fotografía de perfil real, válida y
  accesible; ningún artista puede quedar sin `imageUrl` ni depender de un
  placeholder genérico.
- Si la fotografía no existe en R2 ni en la base de datos, registra el faltante
  como error bloqueante. La sincronización no puede declararse completamente
  exitosa hasta cargar y asociar el recurso real.

### 2. Portada autoritativa del álbum

- El álbum es la fuente autoritativa de la portada de todas sus canciones.
  Toda canción con `albumId` debe usar exactamente la misma portada que su
  álbum asociado.
- Al reasignar una canción a otro álbum desde Admin, actualiza de forma
  transaccional su `albumId`, el artista correspondiente y la portada del nuevo
  álbum en PostgreSQL.
- Una canción asociada a un álbum no puede conservar una portada personalizada
  ni la portada del álbum anterior.

### 3. Artistas únicos

- La lista y la base de datos nunca deben contener artistas duplicados. Verifica
  la identidad mediante un nombre normalizado que contemple mayúsculas,
  minúsculas, tildes, puntuación y alias confirmados.
- Cuando existan duplicados, fusiona canciones, álbumes, seguidores y
  colaboraciones en un único artista canónico antes de eliminar los registros
  sobrantes.
- No elimines directamente un artista duplicado hasta comprobar que todas sus
  relaciones fueron preservadas y que el registro quedó sin referencias.

### 4. Colaboraciones featuring

- Modela el featuring por canción y permite múltiples colaboradores para una
  misma canción.
- Conserva siempre el nombre original de cada colaborador. Si ese artista
  existe en el catálogo, enlaza su `artistId`; si no existe, conserva el nombre
  y usa `artistId: null`, nunca el texto literal `"None"`.
- La detección de featuring no debe crear perfiles de artista duplicados ni
  convertir automáticamente una colaboración en artista principal.

### 5. Precedencia de Admin sobre la sincronización R2

- La sincronización desde el botón de Admin debe incorporar canciones,
  artistas, álbumes, portadas y letras nuevas sin sobrescribir decisiones
  editoriales realizadas previamente desde Admin.
- Las relaciones entre canción, artista y álbum, así como los nombres y
  portadas curados manualmente, tienen precedencia sobre los metadatos inferidos
  desde nombres de archivos en R2.
- La sincronización puede actualizar campos técnicos de almacenamiento, como la
  URL, hash, tamaño, codec o disponibilidad del archivo, sin modificar los
  metadatos administrados.
- Al finalizar, verifica fotografías, álbumes completos, coherencia de
  portadas, artistas duplicados y colaboraciones. Cualquier incumplimiento debe
  aparecer en el resultado y evita marcar la sincronización como totalmente
  exitosa.

### 6. Álbumes completos

- Todo álbum publicado debe tener nombre, portada real y artista asociado.
  Ningún artista puede presentar álbumes conocidos incompletos o ausentes.
- Para descubrir portadas en R2, usa el nombre del archivo, su normalización y
  alias confirmados. Por ejemplo, `10años-Bareto.webp` corresponde al artista
  Bareto.
- No asocies automáticamente una portada cuando el nombre sea ambiguo. Registra
  el caso como error bloqueante hasta confirmar la relación correcta.
- La sincronización no puede declararse completamente exitosa mientras exista
  un álbum sin nombre, sin portada válida o sin artista asociado.

## Coherencia visual, letras y reproducción

- Todas las alertas transitorias de éxito, error, descarga o acción completada
  deben mostrarse en la zona superior de la interfaz, con un estado semántico,
  texto claro y una forma de descartarlas. No coloques avisos de este tipo en
  medio de tablas, formularios o contenido desplazable.

- Cada tema de UI/UX debe aplicarse de manera coherente a todos los elementos
  visuales. Los colores de controles, superficies, estados e iconos deben
  proceder de la paleta del tema activo; no se permiten componentes con colores
  ajenos o contradictorios (por ejemplo, rojo y amarillo en un tema azul y
  blanco) salvo que comuniquen un estado semántico indispensable.
- Todo gráfico debe incluir leyendas explícitas y legibles para sus ejes X e Y;
  el título de su tarjeta no sustituye la identificación de la métrica, unidad
  o periodo que representa cada eje.
- Las animaciones de letras Clásico y Brillo deben conservar el mismo
  comportamiento perceptible en `apps/web/` y `apps/mobile/`. En particular,
  Brillo debe avanzar de forma fluida, palabra por palabra, conforme avanza el
  reloj de reproducción. Cualquier cambio en una plataforma debe revisarse en
  la otra para mantener esa paridad.
- La pista indicada por la cola y la interfaz debe ser siempre la que el motor
  de audio reproduce realmente. Al cambiar de pista, incluso con repetición de
  una canción activa, el motor debe seleccionar explícitamente el elemento de
  cola solicitado antes de actualizar el estado visible; nunca puede continuar
  sonando una pista anterior.

## Rendimiento y accesibilidad de interacción

## Roles, planes y autorización

- Los roles `CLIENT`, `ARTIST` y `ADMIN` son responsabilidades distintas:
  `CLIENT` consume MusicFlow, `ARTIST` obtiene permisos mediante una membresía
  aprobada sobre un perfil concreto y `ADMIN` opera el catálogo y sus revisiones.
  Nunca se debe deducir acceso por el nombre, correo o una decisión del cliente.
- La autorización se impone siempre en el backend. Los controles de web y móvil
  solo reflejan el permiso para evitar acciones engañosas; no sustituyen guards,
  validaciones ni comprobaciones de membresía en el servidor.
- El plan FREE permite escuchar y administrar la biblioteca personal. FlowIA,
  sus accesos en reproductores, ecualizador, cola, rutas y burbujas son una
  funcionalidad exclusiva de PREMIUM. Un usuario FREE no puede invocarla aunque
  conserve una URL, estado local o un control de una sesión anterior.
- El plan PREMIUM incluye FlowIA. Las demás capacidades de pago deben declararse
  explícitamente en la fuente de verdad de planes antes de mostrarse como tales;
  no se deben etiquetar funcionalidades como Premium por apariencia.
- Un sello de artista verificado solo se muestra cuando `Artist.isVerified` fue
  aprobado por un administrador. Las solicitudes requieren una membresía activa
  de OWNER o MANAGER y una revisión administrativa; nunca se autoaprueban.

- Prioriza los tiempos de carga y la respuesta de navegación en todos los
  entornos, especialmente en `apps/web/` y `apps/mobile/`. Una navegación no
  debe esperar lecturas de red no críticas: usa carga diferida, cachés acotadas,
  paginación y renderizado perezoso para que ambos clientes mantengan una
  respuesta equivalente y rápida.
- Las interacciones de teclado en `apps/mobile/` deben conservar foco, evitar
  que el contenido quede oculto por el teclado y responder correctamente a las
  acciones del IME (siguiente, enviar, buscar y cerrar). Cualquier pantalla con
  campos debe verificarse con el teclado visible en un dispositivo o emulador.

## Cumplimiento obligatorio de solicitudes

- Cada requisito explícito indicado por el usuario es obligatorio. No se puede
  declarar una tarea finalizada mientras alguno permanezca incumplido,
  sustituido por una alternativa no autorizada o sin verificación razonable.
- Si una implementación no cumple el resultado solicitado, debe corregirse e
  iterarse hasta cumplirlo; los bloqueos externos o de entorno deben comunicarse
  con evidencia, sin presentarlos como una finalización satisfactoria.

## Registro de bugs

- Todo bug reportado por el usuario debe documentarse en `REPORTE-BUG.md`.
- Añade el registro cuando exista información suficiente sobre su diagnóstico
  y solución. Si sigue abierto, registra lo conocido y marca su estado como
  pendiente o en investigación.
- Cada registro debe incluir: identificador, fecha, entorno afectado, síntoma,
  causa raíz, solución, verificación y estado.
- Mantén actualizado el mismo registro si el bug se reabre o requiere una
  corrección adicional; evita crear entradas duplicadas para el mismo problema.
