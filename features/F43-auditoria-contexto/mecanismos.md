# mecanismos

Consulta: 2026-11-05 (todas las citas). Páginas bajadas con `curl -sL` a `/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/3d5d0b53-8b8d-4c92-bda3-69eff71de12b/scratchpad/f43-t03/` (fuera del repo) y buscadas con `grep -n` sobre texto extraído; los números de línea citados son de ese texto extraído. Docs locales de Pi: `/Users/franco/.pi/agent/install/releases/1.4.0/node_modules/@earendil-works/pi-coding-agent/docs`, con `grep -rn`.

Etiquetas: *confirmado* = cita textual corta verificada; *supuesto* = no verificado en la documentación consultada.

## Claude Code

- **Caché de prompt del proveedor con prefijo idéntico (Anthropic)**: evita recargar el prefijo ya cacheado; el lanzamiento siguiente lo cuenta como `cache_read_input_tokens`. Cita: https://docs.claude.com/en/docs/build-with-claude/prompt-caching («Automatic caching : Add a single cache_control field at the top level of your request», línea 2; «cache_read_input_tokens : Number of tokens retrieved from the cache for this request», línea 166; TTL de 5 minutos, línea 233). Consulta 2026-11-05. *confirmado*
- **Fork de subagente: caché compartido con la sesión principal**: evita recargar la conversación y el prompt del sistema. Cita: https://docs.claude.com/en/docs/claude-code/sub-agents (tabla «Prompt cache | Shared with main session | Separate cache», línea 1090; «its first request reuses the parent's prompt cache», línea 1091). Se activa por defecto en sesiones interactivas (línea 915) y se apaga con `CLAUDE_CODE_FORK_SUBAGENT=0` en settings.json (línea 918). Consulta 2026-11-05. *confirmado*
- **Subagente con contexto propio (no es ahorro)**: «Each subagent runs in its own context window» (misma URL, línea 442); en la tabla, un subagente nuevo tiene «Separate cache» (línea 1090). No reutiliza la conversación ni la caché. Consulta 2026-11-05. *confirmado*
- **Memoria persistente del subagente (`memory:`)**: directorio que sobrevive entre conversaciones; no evita recargar, porque al activarse el prompt incluye «the first 200 lines or 25KB of MEMORY.md» (misma URL, líneas 757–771). Campo de la definición del subagente, es decir, de un archivo. Consulta 2026-11-05. *confirmado*
- **CLAUDE.md y `omitClaudeMd`**: los subagentes personalizados cargan CLAUDE.md salvo que declaren `omitClaudeMd`; Explore y Plan no lo cargan (misma URL, línea 454). Reduce contexto, no es caché. Consulta 2026-11-05. *confirmado*
- **Resumen compartido entre subagentes (hash o resumen del archivo fuente)**: no verificado. En la página consultada no encontré un mecanismo que comparta resúmenes entre subagentes; la única coincidencia de «shared» es la caché con la sesión principal del fork. Consulta 2026-11-05. *supuesto*
- **`subagent-artifacts`**: no verificado. El término no aparece en la página de subagentes consultada (2026-11-05). *supuesto*
- **Campos de caché en el log local**: `scripts/consumo.mjs` líneas 478–481 mapea `usage.input_tokens` a `input`, `cache_read_input_tokens` a `cacheRead` y `cache_creation_input_tokens` a `cacheWrite`. Fuente: ruta local del repo, consulta 2026-11-05. *confirmado*

Respuestas (Claude Code):
1. ¿Hay mecanismo compartido entre subagentes? Solo el fork, con la caché de la sesión principal (*confirmado*). Un subagente nuevo no comparte caché.
2. ¿Lo habilita un archivo del repo sin crecer prompts? No verificado. `memory:` y `omitClaudeMd` son campos de archivo de subagente (*confirmado*), pero `memory:` sube el prompt; el fork se controla con una variable de entorno o settings, no con una skill. Ninguna de las páginas consultadas habilita un resumen compartido.
3. ¿Qué campos de caché trae el log? `input`, `cacheRead`, `cacheWrite` (*confirmado*, arriba).

## Pi

- **Caché de prompt del proveedor con retención larga**: evita recargar el prefijo en el proveedor. `PI_CACHE_RETENTION`: «Set to `long` for extended provider prompt caching where supported» (`docs/environment-variables.md`, línea 88). Consulta 2026-11-05. *confirmado*
- **Calentamiento de caché (`cacheWarming`)**: mantiene la caché caliente durante la corrida (`"streaming"`, valor por defecto) o entre corridas (`"idle"`); solo si el modelo declara lifetime y el ahorro estimado es de al menos 0,05 USD (`docs/settings.md`, líneas 21 y 23; «Global setting only»). Consulta 2026-11-05. *confirmado*
- **Lifetime de caché por modelo (`promptCache`)**: «Best-effort prompt cache lifetime in seconds» (`docs/models-configuration.md`, línea 51). Consulta 2026-11-05. *confirmado*
- **Sesión hija (`/fork`, `parentSession`)**: crea una sesión nueva desde un mensaje anterior (`docs/sessions.md`, línea 27; `docs/session-format.md`, línea 72). Que comparta caché o contexto con el padre no está verificado. Consulta 2026-11-05. *supuesto*
- **Subagentes y `subagent-artifacts`**: no verificado. `grep -rni subagent` sobre la carpeta de docs de Pi devuelve una sola línea, sobre codemode workers (`docs/environment-variables.md`, línea 87), y `subagent-artifacts` no aparece. Consulta 2026-11-05. *supuesto*
- **Caché del proveedor OpenAI y campos del log**: en `docs/json.md`, línea 98, el `usage` de Pi trae `input`, `cacheRead` y `cacheWrite`. Del lado de OpenAI, `usage.input_tokens_details.cached_tokens` y `prompt_cache_key` para agrupar peticiones con prefijo común (https://platform.openai.com/docs/guides/prompt-caching, texto extraído, líneas 1234 y 1238). Consulta 2026-11-05. *confirmado*

Respuestas (Pi):
1. ¿Hay mecanismo compartido entre subagentes? No verificado (*supuesto*): no hay documentación de subagentes en los docs locales.
2. ¿Lo habilita un archivo del repo sin crecer prompts? No verificado. Los docs de Pi citados configuran la caché por variable de entorno o settings, no por archivo del repo.
3. ¿Qué campos de caché trae el log? `input`, `cacheRead`, `cacheWrite` (*confirmado*, `docs/json.md`, línea 98).

## Para la prueba

Mecanismo elegido por herramienta a partir de las fuentes de este archivo (consulta 2026-11-05); la corrida real es de task-04.

- Claude Code: caché de prompt del proveedor con prefijo idéntico. Dos lanzamientos seguidos del mismo rol con la misma fuente; comparar `cacheRead` (`cache_read_input_tokens`) del segundo contra el primero.
- Pi: caché del proveedor con `PI_CACHE_RETENTION=long`. Medir `cacheRead` en el `usage` del modo JSON, con el mismo rol y la misma fuente en dos lanzamientos seguidos. No hay mecanismo compartido verificado entre subagentes en ninguna de las dos.
