# Convención de commits de MusicFlow

Norma obligatoria para agentes y desarrolladores al preparar commits en este
repositorio. Los commits deben crearse únicamente cuando el cambio y sus
verificaciones hayan terminado. El `push`, los tags, los pull requests y la
reescritura del historial requieren una solicitud expresa del usuario.

## Mensajes de commit

- Escribe el mensaje en español y comienza con mayúscula.
- Describe la acción y el resultado con términos como `agregado`, `actualizada`,
  `eliminado`, `corregida`, `documentado` o `preparado`.
- No uses prefijos Conventional Commits como `feat:`, `fix:` o `chore:`.
- Mantén el mensaje breve e informativo, sin nombres de variables, clases ni
  identificadores internos.
- Puedes unir cambios relacionados con `y` o una coma.
- Usa paréntesis solo cuando aporten contexto, por ejemplo `(agregado)`,
  `(corregido)` o `(movido)`.

## Ejemplos

- Portal de artistas y verificación de perfiles agregados
- Gestión de géneros musicales corregida
- Navegación del reproductor y carrusel actualizadas
- Configuración visual de administrador agregada
- Despliegue del backend y PostgreSQL en VPS preparado
- Registro de errores reproducibles actualizado

## Alcance de cada commit

- Un commit debe representar un cambio coherente y revisable.
- Separa backend, web, mobile, infraestructura y documentación cuando no formen
  una única unidad funcional.
- Agrega archivos o directorios concretos. Está prohibido usar `git add .`,
  `git add -A` o cualquier agregado masivo equivalente.
- Si solo cambió una parte de un entorno, agrega esa ruta específica; por
  ejemplo, `git add apps/web/src/shared/hooks` y no todo `apps/web/`.
- Revisa que el área preparada no arrastre archivos generados, cachés, reportes,
  binarios, secretos o cambios ajenos.

## Procedimiento obligatorio

1. Termina la implementación, verificación o análisis.
2. Revisa `git status`, `git diff` y `git log --oneline -10`.
3. Ejecuta las puertas de calidad aplicables indicadas en `COMMANDS.md`.
4. Agrega únicamente las rutas relacionadas mediante `git add` explícito.
5. Revisa el área preparada con `git diff --cached --stat` y
   `git diff --cached`.
6. Confirma que no contiene `.env`, credenciales, tokens, claves ni datos
   personales.
7. Crea el commit con un mensaje acorde a esta convención.
8. Si un hook falla, corrige la causa, vuelve a agregar las rutas necesarias y
   crea el commit normalmente. No uses `--no-verify` ni `--amend`.
9. No hagas `push`, `force-push`, `rebase`, tags ni pull requests salvo petición
   expresa.
