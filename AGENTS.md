# Instrucciones globales de MusicFlow

Antes de analizar, modificar o verificar cualquier parte de este repositorio,
lee completamente [`MEMORY.md`](MEMORY.md) y aplica sus reglas durante toda la
tarea.

Estas instrucciones son globales y se aplican a todos los entornos del
proyecto:

- `apps/mobile/`
- `apps/web/`
- `apps/backend/`

Las skills especializadas complementan estas instrucciones, pero no reemplazan
ni anulan la memoria global. Para trabajos de React en `apps/web/`, continúa
aplicando la skill `vercel-react-best-practices` cuando corresponda.

Si el usuario reporta un bug, registra su diagnóstico y resolución en
[`REPORTE-BUG.md`](REPORTE-BUG.md), siguiendo la plantilla definida en ese
archivo. Solo se registran automáticamente los bugs reportados desde la
incorporación de esta regla; no reconstruyas el historial anterior salvo que el
usuario lo solicite expresamente.

## Comandos del proyecto

Antes de iniciar, verificar, probar, compilar, ejecutar una migración, operar
Cloudflare R2 o realizar pruebas de carga, consulta completamente
[`COMMANDS.md`](COMMANDS.md) y usa el comando correspondiente al entorno y al
objetivo real.

- No inventes scripts ni invoques comandos documentados como inexistentes.
- Ejecuta cada comando desde el directorio indicado y respeta sus requisitos,
  advertencias de seguridad y alcance.
- Empieza por la verificación más focalizada y amplía a las puertas de calidad
  del entorno afectado antes de declarar finalizada una tarea.
- Las pruebas de estrés solo se ejecutan contra local o staging autorizado;
  nunca contra producción de forma predeterminada.
- Si se agrega, elimina o modifica un script de `package.json`, una tarea de
  Flutter, un flujo Electron, una migración, una herramienta de calidad o un
  procedimiento operativo, actualiza `COMMANDS.md` en la misma tarea.
