# Sondeo de viabilidad: soporte a Codex (OpenAI Codex CLI)

Fecha: 2026-10-31. Solo lectura e investigación; borrador. No se tocó código, `definitions/` ni `STATUS.md`. No se abrió `~/.codex/auth.json`. De `~/.codex/config.toml` solo se listaron los nombres de las tablas `[...]` y las claves `model*`, filtrando cualquier línea con token, key, secret o bearer.

## 0. Qué hay en este equipo y qué calidad de evidencia tiene

- **Codex SÍ está instalado.** `which codex` -> `/Users/franco/.local/bin/codex` -> `~/.codex/packages/standalone/releases/0.160.0-aarch64-apple-darwin/bin/codex`; `codex --version` -> `codex-cli 0.160.0`.
- **No hay documentación local** en el paquete (solo binario, `codex-resources/voice|zsh`, `codex-path/rg`). No existe un equivalente a `docs/` de Pi. Fuentes usadas, de más a menos fiable:
  1. **Salida de comandos** (`codex --help`, `codex exec --help`, `codex features list`, `codex debug models`): evidencia firme de lo que el binario ofrece.
  2. **Archivos reales en `~/.codex/`**: `config.toml` (claves visibles), `hooks.json`, `skills/spec-driven-ai-workflow/SKILL.md`.
  3. **Cadenas de texto del binario** (`strings`, mensajes de error y nombres de campos de configuración). Prueban que un campo o ruta existe en el código, **no** su semántica exacta ni su precedencia. En este informe se marcan como «binario».
- Nada de lo que sigue viene de la web ni de memoria sobre Codex. Todo lo que no cae en 1 o 2 está marcado NO VERIFICADO.

## 1. Tabla CONFIRMADO / NO VERIFICADO por pregunta

### P1. Subagentes con modelo propio

| CONFIRMADO | NO VERIFICADO |
| --- | --- |
| `codex features list`: `multi_agent` = stable, **true** (activo); `multi_agent_v2` = stable, false; `enable_fanout`, `multi_agent_mode` = removed. | Formato exacto del archivo de rol y su ruta de descubrimiento. |
| `hooks.json` del usuario tiene eventos `SubagentStart` y `SubagentStop`; `config.toml` tiene `hooks.state.*subagent_start/stop`: los subagentes existen como concepto de primera clase. | Que un agente principal pueda delegar a un rol **por nombre** y que ese rol use el modelo declarado (mi lectura del binario es que sí, ver «binario»). |
| Binario: existe la herramienta `spawn_agent` (el texto dice que los subagentes «heredan tu modelo actual por defecto» y que no se fije `model` salvo que el usuario lo pida). | Si se puede **restringir qué roles** puede invocar un agente (equivalente a `Agent(arquitecto, planificador, constructor)` de Claude Code). |
| Binario: carga de «agent role files» (`agent-roles/src/loader.rs`, `discovery.rs`). Un archivo de rol es una tabla TOML con `name` (letras, dígitos, espacios, guion, guion bajo), `description`, `nickname_candidates` y **`developer_instructions` obligatorio y no vacío**. Roles también declarables en config con `description` y `config_file` (archivo existente). Mensajes: «This role's model is set to X and its reasoning effort is set to Y. These settings cannot be changed» -> **un rol puede fijar modelo y esfuerzo de razonamiento**. | Si los archivos de rol se buscan en `~/.codex/agents/` y/o `<proyecto>/.codex/agents/` (la cadena `.codex/agents` aparece, pero junto a la migración desde otras herramientas; podría ser solo origen de migración). |
| Binario: opciones `[agents]` de configuración: `max_depth`, `max_concurrent_threads_per_session`, `default_subagent_model`, `default_subagent_reasoning_effort`, `job_max_runtime_secs`. | Si un subagente puede a su vez delegar (nuestro kit no lo necesita: el coordinador es el único que delega). |

**Lectura:** plausible y, por la evidencia del binario, más cercano a Claude Code que Pi. Pero el formato **no es Markdown con encabezado** (como `agentes/*.md`): es TOML con `developer_instructions`. Hay que generarlo desde el `.md`.

### P2. Skills

| CONFIRMADO | NO VERIFICADO |
| --- | --- |
| `~/.codex/skills/spec-driven-ai-workflow/SKILL.md` existe y usa el mismo formato que las skills del kit: encabezado `---` con `name` y `description`, luego Markdown. Lleva además una subcarpeta `assets/`. | Que cualquier campo extra del encabezado de nuestras skills sea tolerado (las siete skills solo usan `name` y `description`; se asume compatible, sin probar). |
| Binario: texto del skill-creator de Codex: las skills se instalan en `$CODEX_HOME/skills/<nombre>` (por defecto `~/.codex/skills`). | Ruta de skills de **proyecto**. El binario menciona `.agents`, «repo skills root» y `project_root_markers = [".git"]`; sugiere `<proyecto>/.agents/skills/`, pero no se leyó la regla. Ojo: es la misma ruta que en Pi se descartó por ser compartida con otras herramientas. |
| `codex features list`: `skill_search` y `skill_mcp_dependency_install` stable; `skip_host_skill_discovery` en desarrollo. | Si las skills de proyecto exigen **confianza de proyecto** (en `config.toml` hay `[projects."<ruta>"]` con `trust_level`, lo que indica que la confianza por proyecto existe; no se probó que condicione las skills). |
| Binario: existe `skills.config` por entrada (`path`, `name`, `bundled`, `include_instructions`, `max_context_tokens`). | Si hay una restricción «fuera del workspace» como la de Pi y si sigue enlaces simbólicos. Por analogía con Pi, **copiar** en vez de enlazar sigue siendo lo seguro. |

### P3. Instrucciones del proyecto y agente predeterminado

| CONFIRMADO | NO VERIFICADO |
| --- | --- |
| Binario: carga `AGENTS.override.md`, luego `AGENTS.md`, y nombres alternativos en `project_doc_fallback_filenames`; recorre desde la raíz del proyecto (`project_root_markers`, por defecto `[".git"]`) y tiene tope de bytes (`max_total`). Existe `$CODEX_HOME` global con el mismo mecanismo (`codex-home/src/instructions`). **Codex lee `AGENTS.md`.** | El límite de bytes por defecto: nuestro `AGENTS.md` es breve, pero conviene medirlo. |
| `codex --help`: la opción `-c clave=valor` sobreescribe cualquier clave de `config.toml`, y `-p/--profile` carga `$CODEX_HOME/<nombre>.config.toml` sobre la config base. Binario: `model_instructions_file`, `developer_instructions`. | **No hay evidencia de un ajuste de proyecto del tipo `"agent": "arquitecto"`** (lo que hoy hace `fijar-agente` en `.claude/settings.local.json`). Candidatos: perfil que añada `developer_instructions`, o `-c` en un lanzador. Hay que probarlo. |

**Lectura:** el «agente predeterminado» no se fija en el proyecto; se haría con **lanzadores** (`codex-<agente>`), igual que en Pi. Eso es consistente con el diseño actual de Pi.

### P4. Modelos por agente o perfil

| CONFIRMADO | NO VERIFICADO |
| --- | --- |
| `config.toml` del usuario: `model = "gpt-6-sol"`, `model_reasoning_effort = "medium"`. Flags: `-m/--model`, `-p/--profile`, `-c model="..."`. | Cómo se escribe el modelo en un archivo de rol (campo `model` en el TOML del rol; binario sugiere que sí). |
| `codex debug models` (catálogo local, sin red): `gpt-6.1-sol`, `gpt-6-astra`, `gpt-6.1-terra`, `gpt-6-sol`, `gpt-6-luna`, `gpt-5.6-sol/terra/luna`. **Coinciden con el perfil `pi-openai`** de `modelos.json` (`gpt-6-astra` alto, `gpt-6.1-sol` medio, `gpt-6-luna` bajo), solo que **sin el prefijo `openai/`**. | Que el modelo de la cuenta de Franco permita los tres niveles (depende del plan; `gpt-reserve` y `codex-auto-review` aparecen ocultos). |

**Encaje con `modelos.json`:** bueno. Un perfil nuevo `codex-openai` (`"herramienta": "codex"`) con los tres niveles y `perfil_por_defecto.codex`; `resolver.mjs` necesita aceptar `codex` como herramienta y un modo `agente-codex` que emita TOML. Alternativa de cero código nuevo en el resolver: reutilizar `pi-openai` y recortar el prefijo `openai/` (frágil, descartada).

### P5. Permisos (listas cerradas de comandos y denegar `.env`)

| CONFIRMADO | NO VERIFICADO |
| --- | --- |
| `codex exec --help`: `-s/--sandbox read-only | workspace-write | danger-full-access`; `--add-dir` (directorios escribibles extra); `--ignore-rules` («no cargar archivos `.rules` de execpolicy de usuario o proyecto» -> **existen reglas de execpolicy en archivos `.rules`**). | Sintaxis y ubicación exactas de `.rules`. Binario: `core/src/exec_policy.rs` carga `default.rules`; errores «rules prefix_rule at index N has an empty pattern / is missing a decision / invalid pattern token»; decisiones tipo permitir/preguntar/prohibir; «blocked by policy», «approval required by policy rule». **Un `prefix_rule(pattern=[...], decision=...)` con prefijos de comando parece el equivalente directo a `Bash(git switch -c *)`.** Falta confirmar si una lista **cerrada** (denegar todo lo demás) es posible o si solo se permiten/prohíben prefijos concretos con el resto sujeto a sandbox y aprobación. |
| `hooks.json` real del usuario: eventos `PreToolUse`, `PermissionRequest`, `PostToolUse`; `codex features list`: `hooks` stable true. Un hook `PreToolUse` puede inspeccionar y (si Codex lo soporta) bloquear. | Si un hook `PreToolUse` puede **vetar** una llamada (en Claude Code sí; aquí solo se ve que existen los eventos). Sería la vía técnica para negar lectura de `.env`. |
| Binario: `permissions.filesystem.deny_read` (rutas) y `default_permissions` / perfiles de permisos con herencia (`extends`). **Existe un mecanismo de denegar lectura por ruta.** | Si acepta globs (`**/.env`) o solo rutas absolutas; si aplica a lecturas hechas por herramientas y por shell. Es la pieza más importante para la regla «no leer `.env`». |
| Binario: `approval_policy` = `untrusted | on-request | granular | never`; `AskForApproval::Granular`. | Qué ocurre en `codex exec` sin pantalla ante una aprobación requerida (probablemente falla o se detiene; sin probar). |

**Qué se podría garantizar (si las suposiciones de arriba se confirman) y qué no:**

| Regla del kit | Posible garantía técnica en Codex | Estado |
| --- | --- | --- |
| Constructor: solo `git switch -c`/`git switch`/`git branch --show-current` | `prefix_rule` permitiendo esos tres y prohibiendo `git commit/push/merge/reset/rebase/checkout`. Sería **más fuerte que Pi**, parecido a Claude Code, pero ojo: probablemente prohibir lo listado, no «solo esto». | NO VERIFICADO |
| Coordinador: solo 3 comandos `node scripts/...` | Igual: permitir esos prefijos; el resto, aprobación/sandbox. Pasar de «cerrada» a «preguntar» en `codex exec` equivale a bloquear. | NO VERIFICADO |
| No leer `.env` | `deny_read` (si acepta patrón) y/o hook `PreToolUse`. | NO VERIFICADO |
| Escribir solo en el repo / `definitions/` (arquitecto) | `-s workspace-write` + `--add-dir`; no distingue carpetas dentro del workspace. | Parcial: la restricción por carpeta seguiría siendo instruccional |
| Sin commit/push/PR/merge/despliegue | `prefix_rule` prohibiendo `git commit`, `git push`, `gh pr`; red limitada por sandbox. | NO VERIFICADO |

Con lo ya confirmado, el peor caso es **igual que Pi**: «la contención es solo instruccional». No es peor que lo aceptado en `2026-10-30-coordinador-pi.md`.

### P6. Modo no interactivo y registro de eventos

| CONFIRMADO | NO VERIFICADO |
| --- | --- |
| `codex exec [PROMPT]` (alias `e`): no interactivo, el prompt puede venir por stdin. | Que el registro JSONL de `--json` incluya los comandos Bash ejecutados con campos que el comprobador actual pueda reusar sin cambios (`pruebas/comprobaciones/`). Hay que escribir un adaptador, como el de Pi. |
| `--json`: eventos en JSONL por stdout (equivale a `--mode json` de Pi y `--output-format` de Claude Code). `-o/--output-last-message <archivo>`; `--output-schema`; `--ephemeral` (sin persistir sesión, equivale a `--no-session`); `-C/--cd`; `--skip-git-repo-check`; `--ignore-user-config`; `--ignore-rules`; `--strict-config`. | Que `--json` registre **el modelo usado por cada subagente** (necesario para la prueba de niveles que hacen `lanzar-modelos-*.sh`). Alternativa: `~/.codex/sessions/` guarda rollouts y las bases `*.sqlite` guardan hilos; el binario tiene `SubAgentActivityEvent` y `CollabAgent*Event`, **inferido**, no leído. |
| No hay `timeout` en macOS: el patrón de `lanzar-pi.sh` (vigía con `kill`) se traslada igual. | Costo por corrida y comportamiento ante límites de la cuenta. **No se ejecutó ningún `codex exec`** (gastaría cuota y habría que usar la autenticación). |

### P7. Instalación y manifiesto

| CONFIRMADO | NO VERIFICADO |
| --- | --- |
| `$CODEX_HOME` o `~/.codex/` como base (binario + directorio real). Skills de usuario en `~/.codex/skills/`; hay ya una skill ajena allí (`spec-driven-ai-workflow`): la lógica de `OMITIDO` ante lo ajeno aplica. | Carpeta de roles de usuario (`~/.codex/agents/`?). |
| `~/.local/bin` ya está en uso (el binario `codex` vive allí): `BIN_DIR` de `instalar.sh` sirve para `codex-<agente>`. | Si `$CODEX_HOME` se ve afectado por el aviso del binario sobre enlaces simbólicos: el binario menciona `allow_symlinked_codex_home`, con advertencia de que los destinos fuera de `CODEX_HOME` no son de confianza. **Esto sugiere que los enlaces simbólicos a skills del repo (modo repo) podrían ser rechazados o avisados; hay que probar.** Para Codex, usar copia por defecto es lo prudente. |

Encaje en `instalar.sh`: nuevo `INSTALAR_CODEX` (detectado por `[ -d ~/.codex ]` o `command -v codex`, como Claude/Pi), `--solo codex`, `CODEX_DIR`, `instalar_skills "$CODEX_DIR/skills"` (reusa `enlazar_skills`/`copiar_skills`), `generar_agente_codex` (como `generar_agente_pi`, pero emite TOML) y `generar_lanzador_codex`. Manifiesto: mismos tipos `archivo`/`enlace`/`directorio`, sin tipos nuevos. Un riesgo extra: `config.toml` **no** se debe tocar (tiene configuración personal); por eso, si los roles requieren registrarse en `config.toml`, habría que usar archivos de rol descubiertos por ruta y no editar la config. Eso es parte del NO VERIFICADO.

## 2. Qué se traslada directo y qué requiere diseño nuevo

**Directo (sin rediseño):**
- `AGENTS.md` y `definitions/*`, skills `SKILL.md` (mismo formato `name`+`description`; ya hay una instalada que lo confirma), `modelos.json` (agregar un perfil), `registrar.mjs`, `archivar.mjs`.
- Patrón de lanzador con `--model` resuelto (`codex-<agente> -> codex -m <modelo> -c developer_instructions=...` o perfil), igual a `generar_lanzador_pi`.
- Patrón de pruebas Capa 1 (HOME falso, sin red) y vigía de tiempo de `lanzar-pi.sh`.

**Diseño nuevo:**
1. **Resolver:** herramienta `codex`, modo `agente-codex` (Markdown -> TOML con `name`, `description`, `developer_instructions`, `model`), manejo de comillas/multilínea TOML y de `Bash(...)` -> reglas.
2. **Permisos:** traducir `tools: Bash(...)` a `.rules` (si se confirma) y `deny_read` para `.env`; hoy no existe nada parecido en el kit.
3. **Delegación del coordinador:** cómo nombra a los roles; ya existe el «Respaldo sin subagentes» (`agentes/coordinador.md:134`) para el caso de que no funcione.
4. **Adaptador del registro** de `--json` para `pruebas/comprobaciones/`.
5. **Agente predeterminado de proyecto:** solo lanzadores (no hay ajuste de proyecto conocido).
6. **Instalación/desinstalación** y sus pruebas Capa 1.

## 3. Estimación de tareas y riesgo

| # | Tarea | Riesgo |
| --- | --- | --- |
| 0 | **Spike en el PC de Franco** (sin código del kit): comprobar los NO VERIFICADO críticos (ver sección 5) | Bajo (solo lectura/experimento), pero **decide todo** |
| 1 | `modelos.json` + `resolver.mjs`: herramienta `codex`, `agente-codex`, pruebas | Bajo |
| 2 | `instalar.sh`/`desinstalar.sh`: detección, skills de usuario por copia, `--solo codex`, manifiesto, Capa 1 | Medio (regresión sobre Claude/Pi) |
| 3 | Lanzadores `codex-<agente>` con instrucciones + modelo | Bajo |
| 4 | Roles de subagente (TOML) y delegación del coordinador | Alto (formato no verificado) |
| 5 | Permisos: `.rules` + `deny_read` (+ hook si hace falta) para constructor, coordinador y `.env` | Alto (semántica «lista cerrada» no verificada) |
| 6 | Scripts de prueba con modelo (`lanzar-codex*.sh`) + adaptador del registro | Medio |
| 7 | Corridas reales y informe (como `2026-10-29-pi*.md`, `2026-10-30-coordinador-*.md`) | Medio (cuota y variabilidad) |
| 8 | Documentación (`README`, `ARCHITECTURE`, `WORKFLOW`, `AGENTS.md`) | Bajo |

Total: **9 tareas** (1 spike + 8). Sin subagentes ni permisos finos (tareas 4 y 5): **7 tareas**, riesgo medio-bajo. Aviso: el árbol ya tiene un `2026-11-02-cambio-contrato-alcance-a.md` en la carpeta de resultados (fecha futura respecto de hoy); se siguió la convención `AAAA-MM-DD-<tema>.md`.

## 4. Recomendación

**Hacerlo parcial, en dos fases, con el spike primero.**

- **Fase 1 (recomendada ya):** tareas 0, 1, 2, 3, 6 (parte básica) y 8: Codex usa las skills del kit, `AGENTS.md`, modelos por nivel y lanzadores por agente; el coordinador trabaja con el **«Respaldo sin subagentes»**. Contención del mismo nivel que Pi (instruccional), dicho explícitamente en la documentación. Bajo riesgo y el beneficio se ve de inmediato.
- **Fase 2 (condicionada al spike):** roles de subagente y permisos con `.rules`/`deny_read`. Solo si el spike confirma delegación por nombre con modelo propio y reglas por prefijo.
- **No hacer** una versión «completa» sin spike: dos de las tres piezas más valiosas (subagentes y permisos) descansan en inferencias del binario, no en documentación.

Por qué vale la pena: los tres niveles ya están en el catálogo de Codex, el formato de skills y `AGENTS.md` coinciden, y hay indicios de más control técnico que en Pi.

## 5. Qué debería comprobar Franco (spike, tarea 0)

1. **Roles:** crear un rol mínimo de prueba (archivo TOML con `name`, `description`, `developer_instructions`, `model`) en `~/.codex/agents/` o `<proyecto>/.codex/agents/` y ver si aparece en la lista de roles disponibles (`Available roles`) de una sesión. Si no, buscar en la documentación oficial de OpenAI («Codex subagents / custom agents») la ruta correcta.
2. **Delegación:** pedir a un agente principal que lance ese rol y confirmar en el registro qué modelo usó el subagente.
3. **Skills de proyecto:** copiar una skill del kit a `<proyecto>/.agents/skills/<skill>/` (y probar `~/.codex/skills/` con un enlace simbólico y con copia); ver si se cargan, y si piden confianza del proyecto.
4. **Reglas:** crear un `.rules` mínimo con `prefix_rule` que prohíba `git commit` y comprobar que un intento de commit se bloquea en `codex exec` (sin pantalla). Probar también si se puede cerrar la lista (todo lo no listado, prohibido).
5. **`.env`:** probar `permissions.filesystem.deny_read` con una ruta y con un glob sobre un archivo `.env` de prueba **sin credenciales reales**.
6. **`--json`:** una corrida corta de `codex exec --json --ephemeral` en un directorio de prueba; comprobar si el registro trae comandos y modelo (por agente).
7. **Límite de `AGENTS.md`** y precedencia con `AGENTS.override.md` (el kit solo usa `AGENTS.md`).
8. **Confianza de proyecto:** qué pasa en `codex exec` en un proyecto no listado en `[projects."..."]`.

Cada punto es una corrida de minutos; las que usan el modelo gastan cuota (puntos 2 y 6).

## 6. Resumen de evidencia

- Instalado: Codex 0.160.0. Sin documentación local; evidencia de comandos, archivos reales y cadenas del binario.
- Confirmado por comando o archivo: `exec`, `--json`, `-m`, `-p`, `-c`, `-s`, `--ephemeral`, `--ignore-rules`; modelos `gpt-6-astra/6.1-sol/6-luna` en el catálogo; formato `SKILL.md`; `multi_agent` activo; eventos de hooks.
- Solo por binario (inferido): roles TOML, `.rules`/`prefix_rule`, `deny_read`, `AGENTS.override.md`, `.agents/skills`, `allow_symlinked_codex_home`.
- No verificado: rutas de roles y de skills de proyecto, semántica de listas cerradas, bloqueo por hook, registro de modelos por subagente.
