# Prompt maestro para Stitch: Panel administrativo de MusicFlow

Diseña y genera **todas las pantallas necesarias del panel administrativo de
MusicFlow** siguiendo exactamente esta especificación. No generes una landing
page, una tienda, una aplicación para oyentes ni una página de marketing. Debe
ser una aplicación operativa, profesional, compacta, clara y preparada para el
trabajo diario de SuperAdmins, Admins y Analistas.

No inventes módulos, destinos de navegación, acciones, datos ficticios ni roles
que no estén descritos aquí. Si una función pertenece a una sección existente,
debe aparecer como una pestaña, vista secundaria, drawer o modal dentro de esa
sección; nunca como una nueva opción del sidebar.

## 1. Objetivo del producto

El panel debe permitir:

- Consultar el estado general y las métricas de MusicFlow.
- Revisar artistas afiliados y administrar su verificación.
- Gestionar usuarios, roles globales, afiliaciones profesionales y equipos.
- Supervisar canciones, álbumes, géneros, letras y metadatos del catálogo.
- Atender moderación, solicitudes de IA, auditoría y seguridad desde una sección
  agrupada.
- Respetar una separación estricta entre los roles globales de MusicFlow y los
  permisos que una persona tenga dentro de un equipo de artista o disquera.

## 2. Identidad visual obligatoria

Mantén la identidad oscura de MusicFlow:

- Fondo principal: `#07131A`.
- Superficie base: `#132A36`.
- Superficie elevada: `#183746`.
- Cian primario: `#14E3F7`.
- Azul secundario: `#2C8DFF`.
- Texto principal: blanco.
- Texto secundario: `#9AA7B7`.
- Éxito: verde accesible.
- Advertencia: ámbar accesible.
- Error o suspensión: rojo accesible.
- Bordes finos con cian de baja opacidad.
- Radio máximo de 8 px para paneles, tablas, inputs y modales.

Utiliza una tipografía sans serif clara y compacta. Evita letter spacing
negativo, gradientes decorativos dominantes, fondos intensos, tarjetas dentro
de tarjetas, sombras excesivas y grandes espacios sin contenido.

La jerarquía visual debe distinguir claramente:

1. Título y acciones de la página.
2. Indicadores KPI.
3. Gráficos y rankings.
4. Tablas, filtros y acciones por registro.

## 3. Estructura general y navegación

### Sidebar

El sidebar debe mostrar el logo y nombre **MusicFlow** y contener exactamente
estas cinco opciones, en este orden:

1. **Resumen**
2. **Artistas**
3. **Usuarios y accesos**
4. **Catálogo**
5. **Operaciones**

No agregues al sidebar opciones independientes para Notificaciones, Álbumes,
Canciones, Analítica, Moderación, Solicitudes IA, Auditoría, Seguridad,
Configuración ni Exportar reporte.

### Navbar superior

El navbar debe incluir:

- Buscador global.
- Indicador compacto del estado del sistema.
- Icono de notificaciones con contador.
- Panel desplegable de notificaciones con estados leído/no leído.
- Avatar, nombre, rol global y menú del usuario conectado.
- Acceso a Configuración dentro del menú del perfil, visible solo para
  SuperAdmin.

Las notificaciones deben existir exclusivamente en el navbar y nunca como una
opción del sidebar.

### Responsive

- Diseña primero la versión desktop para una referencia de `1440 × 900`.
- En tablet, colapsa el sidebar a iconos y permite expandirlo.
- En móvil, reemplaza el sidebar por un drawer accesible desde el navbar.
- Conserva filtros y acciones esenciales sin crear una navegación inferior.
- Las tablas deben transformarse en listas compactas o permitir desplazamiento
  horizontal controlado, sin cortar acciones.

## 4. Pantallas obligatorias

Genera las vistas principales, detalles, pestañas, drawers y modales descritos a
continuación. No omitas pantallas secundarias necesarias para completar los
flujos.

### 4.1. Resumen

Crear un dashboard con:

- Título `Resumen`.
- Selector global de periodo: `7 días`, `30 días` y `90 días`.
- Periodo predeterminado: `30 días`.
- Comparación con el periodo anterior.
- Texto visible con la fecha y hora de la última actualización.
- Botón discreto para actualizar los datos.

Primera fila de KPI:

1. Usuarios registrados.
2. Usuarios conectados actualmente.
3. Artistas afiliados.
4. Reproducciones durante el periodo seleccionado.

Cada KPI debe mostrar el valor principal, su variación porcentual y una
comparación comprensible con el periodo anterior. El indicador de usuarios
conectados debe verse como un dato en tiempo real.

Debajo de los KPI, mostrar:

- Gráfico temporal de evolución de usuarios registrados.
- Gráfico temporal de conexiones simultáneas.
- Ranking de artistas en tendencia.
- Ranking de canciones más escuchadas.
- Ranking de artistas más seguidos.
- Ranking de álbumes más escuchados.

Cada ranking debe incluir posición, portada o avatar, nombre, artista cuando
corresponda, valor principal y variación porcentual. Usa pestañas internas si
son necesarias para mantener una composición ordenada, pero no crees una
opción `Analítica` en el sidebar.

### 4.2. Artistas: directorio

Crear un directorio de artistas afiliados con:

- Título `Artistas afiliados`.
- Buscador por nombre artístico.
- Filtros por estado de verificación, género, país, equipo o disquera.
- Orden por seguidores, reproducciones, lanzamientos o actualización reciente.
- Paginación.

Usa únicamente estos artistas reconocibles como datos de muestra:

- Eminem.
- Romeo Santos.
- Enanitos Verdes.
- Bareto.
- Doja Cat.
- Michael Jackson.
- Billie Eilish.
- Bruno Mars.

No inventes artistas ficticios. Estos nombres son datos visuales de ejemplo y
no implican una afiliación comercial real.

La tabla debe tener exactamente estas columnas:

1. Artista y avatar.
2. Estado de verificación.
3. Equipo o disquera.
4. Seguidores.
5. Reproducciones del periodo.
6. Lanzamientos.
7. Última actualización.
8. Acciones.

No muestres un botón `Nuevo artista`. Los artistas llegan mediante una solicitud
de afiliación o mediante un catálogo importado. Desde la tabla solo se puede
abrir el detalle, revisar una solicitud o consultar el historial, según el
estado y los permisos del administrador.

### 4.3. Artistas: detalle y verificación

Crear una pantalla de detalle con:

- Avatar o portada, nombre artístico y check de verificación cuando corresponda.
- Estado actual claramente visible.
- Resumen de seguidores, reproducciones y lanzamientos.
- Información de identidad y contacto profesional.
- Equipo, manager y disquera vinculados.
- Catálogo asociado.
- Evidencias entregadas en la solicitud de afiliación.
- Historial cronológico de cambios de estado.
- Registro de quién realizó cada acción y cuándo ocurrió.

Usa exclusivamente estos estados:

- `PENDING`: pendiente de revisión.
- `VERIFIED`: verificado; muestra un check visible junto al nombre.
- `REJECTED`: solicitud rechazada.
- `SUSPENDED`: verificación suspendida.

Representa exactamente este flujo:

- `PENDING → VERIFIED` mediante aprobación.
- `PENDING → REJECTED` mediante rechazo.
- `VERIFIED → SUSPENDED` mediante suspensión.
- `REJECTED → PENDING` cuando exista una nueva solicitud de revisión.
- `SUSPENDED → VERIFIED` mediante restauración autorizada.

Reglas de interacción:

- Aprobar requiere un modal de confirmación.
- Rechazar, suspender o restaurar exige un motivo obligatorio.
- Cada cambio genera una entrada de auditoría.
- Una acción completada debe mostrar feedback inmediato.
- No uses un checkbox genérico para cambiar la verificación directamente.
- Admin puede aprobar, rechazar y suspender artistas.
- SuperAdmin puede realizar las mismas acciones, restaurar una verificación y
  resolver excepciones.
- Analista solo puede consultar el estado y el historial.

### 4.4. Usuarios y accesos: listado

Crear un listado con:

- Búsqueda por nombre, correo o identificador.
- Filtros por estado, rol global y afiliación profesional.
- Paginación.
- Estado de la cuenta.
- Rol global.
- Afiliaciones profesionales.
- Fecha de registro y último acceso.
- Acciones permitidas según el rol conectado.

### 4.5. Usuarios y accesos: detalle

El detalle del usuario debe mostrar:

- Datos básicos de la cuenta.
- Estado: activa, suspendida o bloqueada.
- Rol global.
- Afiliaciones profesionales.
- Equipos de artistas o disqueras vinculados.
- Nivel de acceso dentro de cada equipo.
- Sesiones y dispositivos recientes.
- Historial de accesos.
- Historial de cambios administrativos.

Incluye una pestaña `Administradores`, visible únicamente para SuperAdmin. Allí
se puede promover o degradar usuarios entre Admin y Analista, con confirmación y
motivo obligatorio. Admin no puede ver controles para modificar SuperAdmins,
Admins ni los privilegios de otros administradores.

Las dos cuentas fundadoras SuperAdmin deben mostrarse como protegidas. Ningún
Admin puede suspenderlas, degradarlas ni modificar sus permisos.

### 4.6. Catálogo

Crear una sola sección `Catálogo` con estas pestañas internas:

1. **Canciones**
2. **Álbumes**
3. **Géneros**
4. **Letras y metadatos pendientes**

No generes una opción independiente de Álbumes o Canciones en el sidebar.

Para canciones y álbumes, incluir:

- Búsqueda, filtros, orden y paginación.
- Portada, título, artista y estado de publicación.
- Asociación entre canción, álbum y artista.
- Detalle y edición de metadatos.
- Detección de duplicados.
- Indicador de contenido incompleto.
- Estado de letra sincronizada o pendiente.
- Historial de modificaciones.

Las operaciones de publicación, despublicación, fusión de duplicados o cambios
de asociación deben solicitar confirmación y quedar auditadas.

### 4.7. Operaciones

Crear una sola sección `Operaciones` con estas pestañas:

1. **Moderación de contenido**
2. **Uso y solicitudes de IA**
3. **Auditoría**
4. **Seguridad**

No conviertas ninguna de estas pestañas en un módulo independiente del sidebar.

Moderación debe mostrar incidencias, contenido reportado, derechos, prioridad,
responsable, estado y resolución.

Uso y solicitudes de IA debe mostrar tipo de solicitud, usuario, estado, costo,
tokens, latencia, resultado y fecha, sin mostrar claves ni secretos.

Auditoría debe mostrar actor, acción, recurso, fecha, resultado e IP anonimizada,
con filtros detallados.

Seguridad debe mostrar sesiones sospechosas, intentos fallidos, bloqueos y
límites de uso. Las acciones sensibles requieren confirmación.

SuperAdmin y Admin tienen acceso según sus permisos. Analista solo tendrá acceso
de lectura a datos operativos no sensibles. La configuración crítica de
seguridad será exclusiva de SuperAdmin.

### 4.8. Configuración

Crear una pantalla de Configuración accesible exclusivamente desde el menú del
perfil de un SuperAdmin. No debe aparecer en el sidebar.

Incluir:

- Configuración general de MusicFlow.
- Feature flags.
- Límites operativos.
- Preferencias de notificaciones.
- Estado de integraciones.

Los secretos deben mostrarse únicamente como `Configurado` o `No configurado`;
nunca deben exponerse valores reales.

## 5. Modelo de roles y permisos

Separa roles globales, afiliaciones profesionales y permisos de equipo. No los
mezcles en un único selector.

### Roles globales

#### SuperAdmin

- Reservado para los dos dueños o fundadores de MusicFlow.
- Acceso completo al panel.
- Configura la plataforma.
- Supervisa administradores.
- Puede promover o degradar Admins y Analistas.
- Puede restaurar verificaciones y resolver excepciones.
- Las cuentas fundadoras se muestran protegidas.

#### Admin

- Gestiona usuarios normales, artistas, catálogo, moderación y verificaciones.
- Puede aprobar, rechazar o suspender artistas.
- No puede modificar SuperAdmins.
- No puede otorgar el rol Admin.
- No puede cambiar el rol ni los permisos de otros administradores.
- No puede acceder a configuración crítica.

#### Analista

- Acceso de solo lectura a dashboard, gráficos, rankings y datos autorizados.
- Puede usar filtros y exportaciones contextuales.
- No puede modificar registros, roles, contenido ni estados.

#### Usuario

- Cuenta normal de MusicFlow.
- No tiene acceso al panel administrativo.

### Afiliaciones profesionales

Las siguientes afiliaciones describen la relación profesional de una persona;
no otorgan acceso administrativo global:

- **Artista:** propietario o representante autorizado de un perfil artístico.
- **Manager:** puede gestionar uno o varios equipos de artista.
- **Miembro de disquera:** pertenece a una organización con acceso a un roster o
  catálogo concreto.

Una misma cuenta puede ser Usuario y, al mismo tiempo, Manager de varios
artistas o miembro de una disquera. Artista, Manager y miembro de disquera solo
accederán al panel administrativo si además poseen un rol global autorizado.

### Permisos por equipo

Cada equipo de artista o disquera utiliza permisos independientes:

- `TEAM_OWNER`: propietario del equipo.
- `TEAM_ADMIN`: administra miembros y permisos del equipo.
- `TEAM_EDITOR`: edita contenido autorizado del equipo.
- `TEAM_VIEWER`: acceso de solo lectura.

Muestra las afiliaciones y permisos de equipo como entidades separadas del rol
global para evitar confundir, por ejemplo, `Admin` con `TEAM_ADMIN`.

## 6. Componentes y patrones de interacción

Usa componentes consistentes para:

- Tablas con encabezado fijo, filtros y paginación.
- Chips de estado con texto e icono; nunca depender solo del color.
- Gráficos con leyenda y valores accesibles.
- Drawers para notificaciones y detalles rápidos.
- Modales para confirmaciones y acciones sensibles.
- Tooltips en iconos sin etiqueta visible.
- Breadcrumbs solo en pantallas de detalle.
- Toast o aviso inline después de una operación.

No coloques acciones destructivas como acción primaria. No muestres controles
que el rol conectado no pueda ejecutar. Las autorizaciones deben asumirse
validadas por backend; ocultar un botón no reemplaza la seguridad del servidor.

## 7. Estados obligatorios

Genera y representa en las pantallas relevantes:

- Skeleton de carga.
- Estado vacío con explicación y acción válida.
- Error recuperable con opción de reintento.
- Sin resultados para una búsqueda o filtro.
- Sin permisos.
- Datos parcialmente disponibles.
- Confirmación de operación completada.

Los filtros deben persistir al abrir un detalle y regresar al listado.

## 8. Accesibilidad

- Garantiza contraste mínimo WCAG AA.
- Permite navegación completa por teclado.
- Muestra foco visible.
- Asocia labels a inputs y controles.
- Añade nombres accesibles a iconos.
- No comuniques estados únicamente mediante color.
- Usa tablas semánticas y encabezados correctamente jerarquizados.
- Respeta reducción de movimiento.

## 9. Restricciones explícitas para Stitch

- Genera todas las pantallas descritas, sin excepciones.
- No agregues destinos extra al sidebar.
- No inventes artistas ni nombres de muestra fuera de la lista indicada.
- No generes `Nuevo artista`.
- No dupliques navegación entre sidebar, navbar y pestañas.
- No separes Álbumes, Canciones o Analítica como módulos principales.
- No coloques Notificaciones ni Configuración en el sidebar.
- No mezcles roles globales con afiliaciones o permisos de equipo.
- No otorgues acceso administrativo automático a Artista, Manager o Disquera.
- No muestres secretos, tokens, contraseñas ni claves de integración.
- No uses lorem ipsum; utiliza textos funcionales en español.

## 10. Criterios de aceptación del prototipo

El resultado será válido únicamente si:

- El sidebar contiene exactamente las cinco opciones definidas y en el orden
  indicado.
- Notificaciones aparece únicamente en el navbar.
- Configuración se abre desde el menú del SuperAdmin.
- Resumen contiene los cuatro KPI, los dos gráficos temporales y los cuatro
  rankings solicitados.
- El periodo puede alternarse entre 7, 30 y 90 días.
- El directorio de artistas usa nombres reconocibles de la lista proporcionada.
- Los estados `PENDING`, `VERIFIED`, `REJECTED` y `SUSPENDED` aparecen con su
  flujo correcto.
- El check de verificación solo aparece para artistas `VERIFIED`.
- Admin y SuperAdmin muestran diferencias reales en acciones y permisos.
- Las dos cuentas SuperAdmin fundadoras aparecen protegidas.
- Artista, Manager y miembro de disquera se muestran como afiliaciones, no como
  privilegios globales.
- Catálogo agrupa canciones, álbumes, géneros, letras y metadatos.
- Operaciones agrupa moderación, IA, auditoría y seguridad.
- Existen estados de carga, vacío, error, sin resultados y sin permisos.
- El diseño se adapta coherentemente a desktop, tablet y móvil.
- No existen módulos redundantes, artistas ficticios ni acciones no
  especificadas.

Genera el sistema completo en español y presenta las pantallas con suficiente
detalle para que un equipo de frontend pueda implementarlas sin tomar nuevas
decisiones de arquitectura o navegación.
