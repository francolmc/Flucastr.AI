---
plan: plan.md
segment: 3
---

## Steps

### Segment 3 — Story: captura automática en Claude Code por hook
As a user running the builder in Claude Code I want que cada edición y comando quede en `progress.jsonl` so that verlos en `kit-status` sin que el builder haga nada.
Dependencies: Segment 1.
Contracts to keep: el hook de permisos (`scripts/permissions-hook.mjs`, `adapters/claude-code/hook.mjs`) y sus pruebas (`tests/permissions-contract`, `tests/permissions-v2.test.mjs`) no cambian; el hook nuevo nunca bloquea.
Paths likely to change: `adapters/claude-code/progress-hook.mjs` (nuevo), `adapters/claude-code/install-progress-hook.sh` (nuevo), `install.sh` (solo si hace falta llamarlo; si no, la persona lo corre a mano y se documenta), `tests/progress/run.mjs`.
Concrete example of the expected result: con stdin `{"hook_event_name":"PreToolUse","tool_name":"Edit","tool_input":{"file_path":"a/b.mjs"},"cwd":"<repo>"}` y un único plan `approved`, se anexa `{"tipo":"archivo_editado","archivo":"a/b.mjs","o":"hook"}`; el proceso sale 0.
Scope: `adapters/claude-code/progress-hook.mjs`, `adapters/claude-code/install-progress-hook.sh`.
Files: adapters/claude-code/progress-hook.mjs, adapters/claude-code/install-progress-hook.sh
WHEN el hook recibe `PreToolUse`/`PostToolUse` de `Edit`, `Write`, `MultiEdit` o `Bash` THEN anexa `archivo_editado`, `comando_iniciado` o `comando_terminado` (exit y `ms` desde el inicio con el mismo `tool_use_id`) (A1)
WHEN falla cualquier cosa (stdin inválido, plan no encontrado, escritura imposible) o hay 0 o más de 1 plan `approved` THEN sale 0 sin salida por stdout ni decisión de permiso (A2)
WHEN el comando o la ruta parece secreto o es un `.env` THEN se redacta o solo se registra el nombre, nunca el contenido (A3)
WHEN se instala el hook THEN `.claude/settings.local.json` queda con `PreToolUse` y `PostToolUse` para `Edit|Write|MultiEdit|Bash`, sin duplicar ni quitar el hook de permisos, y es idempotente; `quitar` lo retira (A4)
WHEN el hook corre THEN su duración por llamada es < 100 ms en p95 medida sobre 20 ejecuciones (A5)
Acceptance:
- A1: casos con stdin simulado y un repo temporal con un plan `approved`; check `node tests/progress/run.mjs`; expect pasa; el hook nunca imprime nada ni sale distinto de 0.
- A2: mismo caso que A1 (ver arriba)
- A3: mismo caso que A1 (ver arriba)
- A4: caso sobre un `settings.local.json` temporal con el hook de permisos presente: instalar dos veces deja una sola entrada nueva y el hook de permisos intacto; quitar deja el estado inicial; expect pasa.
- A5: medición de 20 ejecuciones; se anota la mediana y el p95 en Evidence; expect p95 < 100 ms; si no, se detiene.
- A6: se anota en Evidence si el payload real trae `agent_type` (leyendo la documentación del hook o una sesión real); si trae, el hook filtra por `builder`; si no, queda el residual declarado. Sin sesión real, se escribe «no probado» (no se inventa).
TODO:
- [x] Crear `adapters/claude-code/progress-hook.mjs` (lee stdin con tope de tamaño; usa `eventos.mjs`; `try/catch` global; siempre exit 0; sin decisión de permiso) (A1–A3). Check: caso A1; expect pasa.
- [x] Crear `adapters/claude-code/install-progress-hook.sh` con `instalar|quitar|comprobar` idempotente, siguiendo `install-permission-hook.sh` (A4). Check: caso A4; expect pasa.
- [x] Agregar los casos A1–A4 a `tests/progress/run.mjs` (A1–A4). Check: `node tests/progress/run.mjs`; expect todos ok.
- [x] Medir A5 y comprobar A6 con `adapters/claude-code/progress-hook.mjs`; dejar ambos en Evidence de `plan.md` (A5, A6). Check: números anotados; expect p95 < 100 ms.
Segment verification: `node tests/progress/run.mjs && node tests/permissions-contract/run.mjs` — level 1; exit 0; covers A1–A4 y que los permisos no cambian. (Si el segundo comando no existe con ese nombre, usar el que declare `tests/README.md`.)
Handoff: el hook no debe usar `onFailure: "block"` (a diferencia del de permisos). Resolver el plan: único `changes/*/plan.md` con `status: approved` bajo el `cwd` del payload; segmento desde su frontmatter. Nunca leer contenido de archivos ni `.env`.

## Evidence
