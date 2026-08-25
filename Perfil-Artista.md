# Prompt para Stitch: Perfil Artista MusicFlow

Diseña el portal de artista de MusicFlow como una herramienta real de gestión,
no como página promocional. Debe permitir publicar música, cuidar la identidad
del artista y comprender su audiencia desde desktop, tablet y mobile.

## Identidad visual

Respeta la paleta MusicFlow: fondo `#07131A`, superficies `#132A36`, superficie
elevada `#183746`, cian `#14E3F7`, azul `#2C8DFF`, blanco y gris `#9AA7B7`.
Usa la portada y foto del artista como contenido, no como fondo borroso
decorativo. Paneles sobrios de radio máximo 8 px, contraste AA, iconos Lucide y
jerarquía tipográfica compacta.

## Navegación

Incluye Inicio, Música, Lanzamientos, Letras, Analítica, Audiencia,
Notificaciones, Perfil público, Equipo y Configuración. Barra superior con
búsqueda, selector de perfil artístico, alertas y avatar. Adapta la navegación a
drawer o barra inferior en mobile.

## Pantallas y funciones

- Inicio: resumen de reproducciones, oyentes, seguidores, minutos y canciones
  destacadas, con comparación del periodo anterior.
- Música: lista de tracks y álbumes con portada, título, duración, género, fecha,
  estado y acciones de editar, previsualizar o retirar.
- Lanzamiento: asistente por pasos para WAV, metadatos, portada, créditos,
  derechos, fecha, lyrics LRC y revisión previa. Mostrar progreso y errores por
  campo sin perder datos.
- Letras: editor LRC sincronizado con preview del efecto glow de karaoke.
- Analítica: reproducciones, finalizaciones, saltos, guardados y fuentes de
  descubrimiento por canción, álbum y rango temporal.
- Audiencia: crecimiento, seguidores, afinidad de géneros y canciones; evitar
  exponer datos personales de oyentes.
- Perfil público: foto, biografía, enlaces, discografía y vista previa exacta de
  cómo lo verán web/mobile.
- Equipo: invitaciones y permisos separados para manager, editor y analista.
- Configuración: identidad, notificaciones, seguridad, sesiones y eliminación o
  transferencia del perfil con confirmación fuerte.

## Estados y reglas

Incluye borrador, en revisión, publicado, rechazado y retirado; skeletons,
estados vacíos, reintentos y guardado automático visible. No permitas publicar
sin archivo, derechos, metadata y portada válidos. Las métricas deben provenir
del backend y cada acción sensible debe quedar auditada.
