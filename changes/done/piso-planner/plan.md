---
status: done
branch: feature/piso-planner
base: main
repos: [.]
executor: builder
segment: 11
continuity: continuous
type: code
---
# Bajar el piso de contexto del planner

## Goal
Que el planner arrastre menos contexto tras compactar (meta 45k tokens; proyección 47k–54k solo con el kit) sin perder reglas de seguridad ni del contrato.

## Exploration
- Estado: `main` limpio y al día. Notas y mediciones: [notes.md](notes.md). Tabla antes/después y destino de cada regla: [reglas.md](reglas.md).
- Piso medido (66 compactaciones): mediana 84.388 tokens, máximo 102.971; prefijo fijo 31.478. Script: `changes/piso-planner/medir-piso.mjs`. No hay salida de `/context` de P0 en el repo: se usó esta medición.
- La definición de Artifact ocupa 38 KB de 80 KB de herramientas. Plugins, conectores y sandbox no los controla el kit.
- Pruebas con frases literales: `tools/verify/*.sh`, `tests/builder-contract.mjs`, `tests/continuity/protocol.mjs`. Con los borradores y las comprobaciones de la receta de esperas de Codex movidas, `./verify` dio OK en una copia temporal.
- Claude Code: `SessionStart` admite `compact` y su stdout entra al contexto. Codex 0.172.0: hooks estables, `SessionStart` con `source: compact`, en `.codex/hooks.json`, requieren aprobación. Fuente: documentación oficial leída el 2026-11-25, en parte resumida por el lector; el efecto en sesión real no está probado.
- Pi: no se midió y no recibe hook; le llega la regla de `notes.md` en `planner.md`.

### Preguntas y respuestas (2026-11-25)
- ¿Cómo llegar a la meta? → Quitar al planner Artifact, ScheduleWakeup, SendFeedback y ReportFindings.
- ¿Codex? → Hook `SessionStart` con matcher `compact`, no `compact_prompt`.
- ¿Subagente? → Solo regla en `planner.md`, sin agente nuevo.

## Evaluation
- Solo recortar textos: riesgo bajo; 65k–71k. Descartada.
- Recortar, quitar herramientas y hook: 47k–54k; con plugins desactivados 38k–47k. Riesgo medio: reglas pasan a lectura bajo demanda. Elegida.
- Agente `scout` nuevo: más control y varios tramos. Descartada.

## Assumptions
- «8 KB» y «6 KB» son 8192 y 6144 bytes; si son 8000 y 6000, hay que recortar 191 bytes de `planner.md`.
- Los borradores de `borradores/` son el texto a aprobar; si corriges alguno, se copia la versión corregida.
- La «próxima acción» del hook es un puntero (archivo y número de línea), no su texto; si quieres el texto, cambia el tramo 7.
- La salida del hook va en inglés por ser instrucción operativa; si la quieres en español, cambian textos y prueba del tramo 7.
- El hook se instala solo con `--project`; los proyectos ya instalados repiten ese comando.
- Las referencias del planner viven en `core/references/planner/` y se leen desde la raíz del kit; Claude Code puede pedir permiso al leer fuera del proyecto.

## Decisions already taken
- Executor: builder, porque requisitos, contexto y comprobaciones están escritos y no usa credenciales ni despliegue.
- Resuelto: 2026-11-25 quitar cuatro herramientas al planner; hook en Codex; subagente solo como regla.
- Un solo repo, rama `feature/piso-planner`, base `main`.
- No se toca `core/agents/builder.md` ni `execute-plan` (eso es `changes/reducir-contrato-builder`).

## Decisions
- Tramo 7 (builder): `Other active changes: N` se imprime solo si N ≥ 1. La próxima acción se busca solo en `notes.md`. Un JSON de entrada inválido se trata como entrada vacía (usa `process.cwd()`); nunca bloquea.
- Tramo 8 (builder): quitar sin entrada responde `omitido`; en Claude Code el archivo se conserva aunque quede sin claves; en Codex se borra el archivo y su carpeta solo si quedan vacíos; `hooks` que no sea objeto o JSON que no sea objeto sale con 1 sin escribir.
- Tramo 10 (builder): la desinstalación quita solo la entrada del kit; el archivo del proyecto se borra con su carpeta solo si queda vacío, y `--keep-settings` lo conserva (sin cambios respecto de A8).

## Validation
Opciones confirmadas el 2026-11-25. Plan completo, borradores y tabla: aprobados por la persona usuaria (Gate 1).

## Scope
`core/agents/planner.md`, `core/references/planner/`, `core/skills/plan-change/`, `AGENTS.md`, `docs/como-funciona.md`, `README.md`, `adapters/pi/agent-tools.mjs`, `adapters/shared/compact-hook.mjs`, `scripts/after-compact.mjs`, `install.sh`, `tools/install/compact-hook.sh`, `tools/uninstall/project.sh`, `tools/uninstall/global.sh`, `verify`, `tools/verify/agent-contracts.sh`, `tools/verify/segment-contract.sh`, `tests/context-size/`, `tests/after-compact/`.

Fuera: permisos y reglas deny, `models.json`, `builder.md`, `execute-plan`, plugins de la persona usuaria, `old/`.

## Verification
`./verify` — desde cero; termina en `VERIFY OK`. Duración medida ≈122 s en WSL2, node v24.22.1.

## Stop conditions
Modo continuo por historia. Parar con nota si: la misma comprobación falla dos veces por la misma causa; hace falta salir de *Scope*; falta una decisión; una prueba existente falla por algo distinto de las comprobaciones movidas (tramo 6); o una comprobación tarda más del doble de su referencia.

Duraciones de referencia (WSL2, node v24.22.1): `cmp`, `wc`, `grep` y `node tests/builder-contract.mjs` ≈1 s (medido 0,1 s); pruebas nuevas que ejecutan `install.sh` ≈30 s (equivalente medido: `node --test tests/compaction/install.test.mjs`, 28 s); pruebas nuevas sin instalador ≈5 s (estimado, se registra al correrlas); `./verify` ≈122 s.

Revisión: fin de historia; el tramo 6 (núcleo del planner) declara `Revisión: por tramo`.

## Steps
Orden y estado. El builder lee este archivo y solo el tramo activo.
Historias para el modo continuo: A = tramos 1–2 (plan-change); B = 3–6 (planner); C = 7–10 (hook); D = 11–12 (AGENTS.md y verify). El «Story:» de cada tramo es su resultado dentro de esa historia; se revisa al terminar cada historia.

1. [Referencias de plan-change](tramo-1.md) — A1 — pendiente
2. [Núcleo de plan-change](tramo-2.md) — A2 — pendiente
3. [Referencias del planner, parte 1](tramo-3.md) — A3 — pendiente
4. [Referencias del planner, parte 2](tramo-4.md) — A4 — pendiente
5. [Pi sin disallowedTools](tramo-5.md) — A5 — pendiente
6. [Núcleo del planner y pruebas movidas](tramo-6.md) — A6 — pendiente
7. [Script de punteros tras compactar](tramo-7.md) — A7 — pendiente
8. [Instalador del hook](tramo-8.md) — A8 — pendiente
9. [install.sh instala el hook](tramo-9.md) — A9 — pendiente
10. [Desinstalar el hook](tramo-10.md) — A10 — pendiente
11. [AGENTS.md corto](tramo-11.md) — A11 — pendiente
12. [Tamaños, verify y README](tramo-12.md) — A12 — pendiente

## Después del commit (persona usuaria, no es del builder)
1. `bash install.sh --project <proyecto>`; en Codex, aprobar el hook nuevo.
2. En `claude-planner`: `/context` no lista las cuatro herramientas; `/compact` muestra las líneas del hook.
3. Opcional: desactivar plugins y conectores sin uso.
4. Tras tres compactaciones reales: `node changes/done/piso-planner/medir-piso.mjs ~/.claude/projects/<proyecto> <fecha de reinstalación>` y comparar la mediana (`first med`) con 84.388.

## Evidence

Tramo 1 (A1), 3 de 3 pasos, verificación del segmento 1:
$ cp changes/piso-planner/borradores/references/{template,rules,segments}.md core/skills/plan-change/references/ (tras mkdir -p core/skills/plan-change/references)
$ cmp changes/piso-planner/borradores/references/template.md core/skills/plan-change/references/template.md
(sin salida)
exit 0
$ cmp changes/piso-planner/borradores/references/rules.md core/skills/plan-change/references/rules.md
(sin salida)
exit 0
$ cmp changes/piso-planner/borradores/references/segments.md core/skills/plan-change/references/segments.md
(sin salida)
exit 0
$ cmp changes/piso-planner/borradores/references/template.md core/skills/plan-change/references/template.md && cmp changes/piso-planner/borradores/references/rules.md core/skills/plan-change/references/rules.md && cmp changes/piso-planner/borradores/references/segments.md core/skills/plan-change/references/segments.md
(sin salida)
exit 0
Pendientes tramo-1.md: 0

Tramo 2 (A2), 3 de 3 pasos, verificación del segmento 2:
$ cp changes/piso-planner/borradores/references/verification.md core/skills/plan-change/references/verification.md && cmp changes/piso-planner/borradores/references/verification.md core/skills/plan-change/references/verification.md
(sin salida)
exit 0
$ timeout 10s node --test tests/context-size/sizes.test.mjs  (antes del reemplazo, con SKILL.md de 18747 bytes; debe fallar por tamaño)
  AssertionError [ERR_ASSERTION]: SKILL.md mide 18747 bytes; el límite es 6144
exit 1 (rojo esperado por tamaño; duración 0,087 s)
$ cp changes/piso-planner/borradores/plan-change.md core/skills/plan-change/SKILL.md && cmp changes/piso-planner/borradores/plan-change.md core/skills/plan-change/SKILL.md
(sin salida)
exit 0
$ timeout 10s node --test tests/context-size/sizes.test.mjs
✔ SKILL.md pesa 6144 bytes o menos
✔ cada references/<archivo>.md nombrado en SKILL.md existe
ℹ pass 2
ℹ fail 0
exit 0
$ node --test tests/context-size/sizes.test.mjs && node tests/builder-contract.mjs && cmp changes/piso-planner/borradores/plan-change.md core/skills/plan-change/SKILL.md   (verificación del segmento 2)
ok A1
ok A2
ok A3
ok A5
ok A4
(sin salida de cmp)
exit 0
Pendientes tramo-2.md: 0
Tamaño de SKILL.md: 4366 bytes (`wc -c`), límite 6144.

Tramo 3 (A3), 3 de 3 pasos, verificación del segmento 3:
$ cmp changes/piso-planner/borradores/references/planner/progress-report.md core/references/planner/progress-report.md && cmp changes/piso-planner/borradores/references/planner/paused-and-interrupted.md core/references/planner/paused-and-interrupted.md && cmp changes/piso-planner/borradores/references/planner/codex-waits.md core/references/planner/codex-waits.md
(sin salida)
exit 0
Pendientes tramo-3.md: 0

Tramo 4 (A4), 2 de 2 pasos, verificación del segmento 4:
$ cmp changes/piso-planner/borradores/references/planner/review-extras.md core/references/planner/review-extras.md && cmp changes/piso-planner/borradores/references/planner/planning.md core/references/planner/planning.md
(sin salida)
exit 0
Pendientes tramo-4.md: 0

Tramo 5 (A5), 2 de 2 pasos, verificación del segmento 5:
$ timeout 10s node --test tests/context-size/frontmatter.test.mjs   (antes del cambio en el adaptador: rojo esperado en Pi)
✖ Pi: la cabecera no contiene disallowedTools (AssertionError: agente-pi conserva disallowedTools)
exit 1 (rojo esperado; duración 0,16 s)
$ timeout 10s node --test tests/context-size/frontmatter.test.mjs   (tras `bashPlano` quita `disallowedTools:`)
ℹ fail 0
exit 0
Pendientes tramo-5.md: 0

Tramo 6 (A6), 4 de 4 pasos, verificación del segmento 6:
$ cmp changes/piso-planner/borradores/planner.md core/agents/planner.md && test "$(wc -c < core/agents/planner.md)" -le 8192 && timeout 60s node tests/builder-contract.mjs
ok A4
exit 0 (wc -c de planner.md: 8191)
$ node --test tests/context-size/frontmatter.test.mjs
ℹ fail 0
exit 0
$ T8="$(mktemp -d)" bash "$TMPDIR/h.sh" tools/verify/<workspace-contracts|operating-contract|workflow-contract|agent-contracts|verification-contracts|segment-contract|small-change-contract>.sh   (arnés del Handoff; los siete)
ok 11 negativa: copia sin «For long output» en core/skills/execute-plan/SKILL.md rechazada con su mensaje   (última línea de segment-contract)
exit 0 en los siete
$ git diff --stat -- tools/verify
tools/verify/agent-contracts.sh | 32 ++++-----; tools/verify/segment-contract.sh | 4 ++--
exit 0
Pendientes tramo-6.md: 0

Tramo 7 (A7), 2 de 2 pasos, verificación del segmento 7:
$ timeout 60s node --test tests/after-compact/after-compact.test.mjs   (antes de crear el script: rojo esperado)
exit 1 (falla por ausencia de scripts/after-compact.mjs)
$ timeout 60s node --test tests/after-compact/after-compact.test.mjs
ℹ pass 10
ℹ fail 0
exit 0
$ node tests/spawn-seguro/estatico.mjs
estatico: OK 24 llamadas en 114 archivos (3 exentas: helper o control marcado)
exit 0
Pendientes tramo-7.md: 0

Tramo 7 (A7), corrección de la devolución (builder, 2026-11-25), 1 de 1 paso:
$ timeout 60s node --test tests/after-compact/after-compact.test.mjs   (antes del cambio en scripts/after-compact.mjs: rojo esperado en las dos pruebas nuevas)
✖ con «Próxima acción» antigua antes de «Next action» apunta a la última cabecera (AssertionError)
✖ con «Next action» antes de «Próxima acción» apunta a la última cabecera (AssertionError)
exit 1
$ timeout 60s node --test tests/after-compact/after-compact.test.mjs
ℹ pass 12
ℹ fail 0
exit 0
$ node tests/spawn-seguro/estatico.mjs
estatico: OK 24 llamadas en 118 archivos (3 exentas: helper o control marcado)
exit 0
Pendientes tramo-7.md: 0

Tramo 8 (A8), 2 de 2 pasos, verificación del segmento 8:
$ timeout 60s node --test tests/after-compact/install.test.mjs   (antes de crear el módulo: rojo esperado)
ℹ pass 2
ℹ fail 14
exit 1
$ timeout 60s node --test tests/after-compact/install.test.mjs
ℹ pass 16
ℹ fail 0
exit 0
$ node tests/spawn-seguro/estatico.mjs
estatico: OK 24 llamadas en 116 archivos (3 exentas: helper o control marcado)
exit 0
Pendientes tramo-8.md: 0

Tramo 8 (A8), corrección de la devolución (builder, 2026-11-25), 2 de 2 pasos:
$ timeout 60s node --test tests/after-compact/install.test.mjs   (antes del cambio en compact-hook.mjs: rojo esperado en las pruebas nuevas)
✖ claude: quitar en un grupo compact con hook propio deja el propio (AssertionError)
✖ claude: un hook propio con tools/my-after-compact.mjs no cuenta como del kit (AssertionError)
✖ codex: quitar en un grupo compact con hook propio deja el propio (AssertionError)
✖ codex: un hook propio con tools/my-after-compact.mjs no cuenta como del kit (AssertionError)
ℹ pass 16
ℹ fail 4
exit 1
$ timeout 60s node --test tests/after-compact/install.test.mjs   (tras el cambio de marca y de quitar por hook)
ℹ pass 20
ℹ fail 0
exit 0
$ node tests/spawn-seguro/estatico.mjs
estatico: OK 24 llamadas en 118 archivos (3 exentas: helper o control marcado)
exit 0
Pendientes tramo-8.md: 0

Tramo 9 (A9), 3 de 3 pasos, verificación del segmento 9:
$ timeout 60s node --test tests/after-compact/wiring-install.test.mjs   (antes de tocar install.sh: rojo esperado)
ℹ pass 1
ℹ fail 4
exit 1 (duración ≈11 s)
$ bash -n tools/install/compact-hook.sh && bash -n install.sh
(sin salida)
exit 0
$ timeout 60s node --test tests/after-compact/wiring-install.test.mjs
ℹ pass 5
ℹ fail 0
exit 0 (duración ≈12 s)
$ timeout 60s node --test tests/compaction/install.test.mjs   (verificación del segmento, con la prueba nueva)
ℹ pass 9
ℹ fail 0
exit 0 (duración ≈29 s; referencia 28 s)
$ node tests/spawn-seguro/estatico.mjs
estatico: OK 24 llamadas en 117 archivos (3 exentas: helper o control marcado)
exit 0
Pendientes tramo-9.md: 0

Tramo 10 (A10), 3 de 3 pasos, verificación del segmento 10:
$ timeout 120s node --test tests/after-compact/wiring-uninstall.test.mjs   (antes de tocar los desinstaladores: rojo esperado)
ℹ pass 2
ℹ fail 2
exit 1 (duración ≈11 s)
$ bash -n tools/uninstall/project.sh && bash -n tools/uninstall/global.sh && bash -n uninstall.sh
bash -n ok
exit 0
$ timeout 120s node --test tests/after-compact/wiring-uninstall.test.mjs
ℹ pass 4
ℹ fail 0
exit 0 (duración ≈11 s)
$ timeout 120s node --test tests/after-compact/wiring-install.test.mjs   (verificación del segmento)
ℹ pass 5
ℹ fail 0
exit 0 (duración ≈12 s)
$ node tests/spawn-seguro/estatico.mjs
estatico: OK 24 llamadas en 118 archivos (3 exentas: helper o control marcado)
exit 0
Pendientes tramo-10.md: 0

Verificación de segmentos 7–10 tras la corrección de la historia C (builder, 2026-11-25; comandos de los tramos 7 a 10, sin repetir la historia A ni B):
$ timeout 120s node --test tests/after-compact/after-compact.test.mjs
ℹ pass 12
ℹ fail 0
exit 0
$ timeout 120s node --test tests/after-compact/install.test.mjs
ℹ pass 20
ℹ fail 0
exit 0
$ timeout 120s node --test tests/after-compact/wiring-install.test.mjs
ℹ pass 5
ℹ fail 0
exit 0
$ timeout 120s node --test tests/after-compact/wiring-uninstall.test.mjs
ℹ pass 4
ℹ fail 0
exit 0
$ timeout 180s node --test tests/compaction/install.test.mjs
ℹ pass 9
ℹ fail 0
ℹ duration_ms 28295 (referencia 28 s)
exit 0
$ bash -n tools/install/compact-hook.sh && bash -n install.sh && bash -n tools/uninstall/project.sh && bash -n tools/uninstall/global.sh && bash -n uninstall.sh
exit 0
$ node tests/spawn-seguro/estatico.mjs
estatico: OK 24 llamadas en 118 archivos (3 exentas: helper o control marcado)
exit 0
Pendientes tramo-7.md: 0; tramo-8.md: 0 (awk, contador canónico).

Tramo 11 (A11), 3 de 3 pasos, verificación del segmento 11 (builder, historia D):
$ node --test tests/context-size/sizes.test.mjs   (antes de copiar el borrador: rojo esperado, AGENTS.md mide 16310 bytes; límite 6144)
exit 1
$ cp changes/piso-planner/borradores/AGENTS.borrador.md AGENTS.md && node --test tests/context-size/sizes.test.mjs
ℹ pass 5
ℹ fail 0
exit 0
$ node --test tests/context-size/sizes.test.mjs && cmp changes/piso-planner/borradores/AGENTS.borrador.md AGENTS.md && (viñetas de main en docs/como-funciona.md: grep -cvxFf ... = 0)
exit 0
wc -c AGENTS.md: 4250 bytes. Pendientes tramo-11.md: 0.

Tramo 12 (A12), 4 de 4 pasos, verificación del segmento 12 (`./verify`, nivel 3; builder, historia D):
$ bash -n verify
exit 0
$ grep -c after-compact README.md ; grep -c after-compact docs/como-funciona.md
2
3
$ ./verify   (paso 23: node --test tests/context-size/*.test.mjs tests/after-compact/*.test.mjs)
ℹ tests 48
ℹ pass 48
ℹ fail 0
VERIFY OK
resultado registrado: Fingerprint: b397c1c5d405
exit 0 (duración 163 s; referencia ≈122 s más pruebas nuevas; el doble de la referencia es 244 s)
Líneas «estatico: FALLO …» del paso 19: son las de sus fixtures negativas, que el propio paso exige («falló como se esperaba»); no son fallos del repo.
Bytes finales: `core/agents/planner.md` 8191; `core/skills/plan-change/SKILL.md` 4366; `AGENTS.md` 4250; `docs/como-funciona.md` 16915; `README.md` 6868. Diff: `git diff --stat -- verify README.md AGENTS.md` → 3 archivos, 32 inserciones, 35 borrados.
Pendientes tramo-12.md: 0.

Tramo 11, correcciones (a) y (b) (2026-11-25, builder):
$ cp changes/piso-planner/borradores/AGENTS.borrador.md AGENTS.md && diff <(git show main:AGENTS.md | sed -n '/^## Reglas/,$p') <(sed -n '/^## Reglas/,$p' AGENTS.md)
(sin salida)
exit 0
$ wc -c < AGENTS.md  →  4434
$ grep -c "$(wc -c < AGENTS.md) hoy" docs/como-funciona.md
1
exit 0
$ node --test tests/context-size/sizes.test.mjs && cmp changes/piso-planner/borradores/AGENTS.borrador.md AGENTS.md && diff ... && test "$(grep -cvxFf docs/como-funciona.md "$TMPDIR/b.txt")" = 0   (verificación de segmento 11)
ℹ tests 5
ℹ pass 5
ℹ fail 0
exit 0 (duración ≈0,06 s)
$ ./verify   (verificación final tras la devolución de A11; nivel 3, árbol cambiado)
ℹ tests 48
ℹ pass 48
ℹ fail 0
VERIFY OK
resultado registrado: Fingerprint: d2307ec11296
exit 0 (duración no medida en esta corrida; referencia ≈122 s, medida previa 163 s)

## Notes

Revisión de historia C (planner, 2026-11-25): RETURNED (relanzamiento 1 de 2). Correcciones en las casillas pendientes de `tramo-7.md` y `tramo-8.md`.
Devuelto: defecto — tramo 8 — adapters/shared/compact-hook.mjs:47-57, A8: quitar borra el grupo entero; un hook propio en el mismo grupo `compact` se pierde (el archivo queda `{}`).
Devuelto: omision — tramo 8 — adapters/shared/compact-hook.mjs:11-17, A8: por la marca del Handoff, `node tools/my-after-compact.mjs` propio cuenta como del kit: instalar dice `ya-estaba` y quitar lo borra.
Devuelto: omision — tramo 7 — scripts/after-compact.mjs:58-64, A7: con dos cabeceras apunta a la primera (vieja); en este repo notes.md:46 en vez de la vigente :57.

Checkpoint historia C, tramo 8 (modo continuo, builder):
- Archivos nuevos: `adapters/shared/compact-hook.mjs` (CLI `instalar|quitar|comprobar claude|codex <proyecto> [--dry-run]`; salidas `fijado|ya-estaba|quitado|omitido|instalado|ausente`; JSON inválido → exit 1 sin escribir) y `tests/after-compact/install.test.mjs` (16 pruebas: archivo inexistente, hooks ajenos, doble instalación, quitar, `--dry-run`, JSON inválido, borrado de `.codex/hooks.json` solo si queda vacío).
- Comprobación: primer run rojo (2 pasan, 14 fallan, exit 1) sin el módulo; después 16/16 exit 0 (duración ≈0,4 s). `node tests/spawn-seguro/estatico.mjs` exit 0.
- Decisiones menores (en `Decisions`): quitar sin entrada responde `omitido`; en Claude Code el archivo se conserva aunque quede `{}`; `hooks` no-objeto o JSON no objeto se trata como error exit 1.
- Estado: `segment: 9`, `status: in progress`; sin commit.

Checkpoint historia C, tramo 9 (modo continuo, builder):
- Archivos: `tools/install/compact-hook.sh` (nuevo; `instalar_hook_compact claude|codex`, avisa y sigue, registra `hook-compact<TAB>archivo<TAB>herramienta` una vez); `install.sh` (+6 líneas: `source` del módulo; `grep` de `hook-compact` al copiar el registro nuevo; `instalar_hook_compact claude` tras `instalar_hook_permisos_claude`; `instalar_hook_compact codex` tras `instalar_deny_codex`); `tests/after-compact/wiring-install.test.mjs` (nuevo, 5 pruebas con HOME y proyectos temporales).
- Diff: `git diff --stat -- install.sh` → 6 inserciones, 0 borrados.
- Comprobación: segment check (`wiring-install` 5/5 y `compaction/install` 9/9, ambos exit 0); `bash -n` exit 0; `estatico` exit 0.
- Decisiones menores: el aviso de aprobación de Codex sale en cada instalación con proyecto (también si ya estaba) y no es un error.
- Estado: `segment: 10`, `status: in progress`; sin commit.

Checkpoint historia C, tramo 10 (modo continuo, builder):
- Archivos: `tools/uninstall/project.sh` (caso `hook-compact)` para `.claude/settings.local.json` y `.codex/hooks.json`, con simulación y `rmdir` solo si quedan vacíos); `tools/uninstall/global.sh` (caso `hook-compact)`, omitido con `CONSERVAR_AJUSTES` y con simulación); `tests/after-compact/wiring-uninstall.test.mjs` (nuevo, 4 pruebas: `--project`, global, `--keep-settings`, `--dry-run`). `uninstall.sh` no se tocó.
- Diff: `git diff --stat -- tools/uninstall` → 37 inserciones, 0 borrados.
- Comprobación: primer run rojo (2 pasan, 2 fallan) antes de editar; después 4/4 y `wiring-install` 5/5, ambos exit 0; `bash -n` exit 0; `estatico` exit 0.
- Estado: `segment: 10`, `status: in progress`; historia C completa en modo continuo. Sin commit. Parada para la revisión del planner en contexto nuevo; el tramo 11 no se ha tocado.

Checkpoint historia A (tramos 1–2, modo continuo), 2026-11-25:
- Archivos de producto cambiados: `core/skills/plan-change/SKILL.md` (modificado: 18747 → 4366 bytes); `core/skills/plan-change/references/{template,rules,segments,verification}.md` (nuevos, copia exacta de `borradores/references/`); `tests/context-size/sizes.test.mjs` (nuevo, 2 pruebas `node:test`).
- Diff resumido: `git diff --stat -- core` → 29 inserciones, 78 borrados en SKILL.md; las cuatro referencias suman 165 líneas.
- Comprobación de segmento: `node --test tests/context-size/sizes.test.mjs && node tests/builder-contract.mjs && cmp ...` → exit 0 (A1, A2, A3, A4, A5 ok en `builder-contract`).
- Historia A completa; no se hizo commit. Fin de historia: parada para la revisión del planner en contexto nuevo. Pendiente de las historias B, C y D (tramos 3–12) sin tocar.
- Duración de referencia: `sizes.test.mjs` medido 0,087 s; `builder-contract.mjs` con límite de 2 s (la referencia del plan es ≈1 s; no se midió el tiempo exacto).
- Las casillas de los tramos 1 y 2 están marcadas en `tramo-1.md` y `tramo-2.md`; los pasos 1–12 de la lista *Steps* conservan `pendiente` por no ser casillas (solo cambian las casillas y esta sección).
- Las entradas sin seguimiento en la raíz (`.bashrc`, `.gitconfig`, etc.) son dispositivos del sandbox y no se tocaron; `git status` las muestra como `??`.
- Estado: `status: done` por verificación de segmento pasada (regla de *Limits*); el planner decide el cierre o la reaprobación de las historias restantes. `segment: 2`.
- Rama creada `feature/piso-planner` desde `main` (ded8280), sin commit ni push.

Resumen de historia A (revisión del planner, 2026-11-25): APPROVED.
- A1 y A2 cumplidos: cuatro referencias iguales a los borradores; SKILL.md 4366 B (antes 18747).
- Repetidas por el planner: cmp, tests/context-size/sizes.test.mjs (2/2) y tests/builder-contract.mjs, exit 0.
- Diff dentro de Scope; sin cambios en pruebas existentes; sin commit.
- Siguiente: historia B (tramos 3–6), segment: 3, rama feature/piso-planner ya creada; revisión al terminar el tramo 6.

Checkpoint historia B, tramo 3 (modo continuo, 2026-11-25):
- Archivos nuevos: `core/references/planner/progress-report.md`, `paused-and-interrupted.md`, `codex-waits.md` (copia exacta de `borradores/references/planner/`).
- Comprobación: tres `cmp` exit 0; `grep -c "yield_time_ms: 300000" codex-waits.md` → 1.

Checkpoint historia B, tramo 4:
- Archivos nuevos: `core/references/planner/review-extras.md`, `planning.md` (copia exacta de los borradores; texto sin cambios).
- Comprobación: dos `cmp` exit 0; `grep -c "kit-verificado.mjs estado" review-extras.md` → 1.

Checkpoint historia B, tramo 5:
- Archivos: `adapters/pi/agent-tools.mjs` (modificado: `bashPlano` quita las líneas `disallowedTools:`; Claude Code no pasa por esta función), `tests/context-size/frontmatter.test.mjs` (nuevo, 2 pruebas).
- Comprobación: la prueba de Pi fue roja antes del cambio y verde después; la de Claude Code verde en ambos casos. `node --test tests/context-size/frontmatter.test.mjs` exit 0.
- Duración medida: 0,16 s (el plan estimaba ≈5 s para pruebas nuevas sin instalador; el timeout de 10 s queda por debajo del doble de esa estimación).

Checkpoint historia B, tramo 6 (fin de historia; revisión por tramo):
- Archivos: `core/agents/planner.md` (reemplazado por el borrador, 8191 bytes ≤ 8192); `tools/verify/agent-contracts.sh` (8l y 8p apuntan a `core/references/planner/codex-waits.md`, sus copias negativas usan esa ruta y crean su carpeta); `tools/verify/segment-contract.sh` (entrada `send_message` a `codex-waits.md` y ese archivo añadido a `copiar_tramos`).
- Diff: `planner.md` 127 líneas cambiadas; `agent-contracts.sh` solo en los bloques 8l y 8p; `segment-contract.sh` dos líneas.
- Frases movidas, verificado: `planner.md` ya no trae `yield_time_ms: 300000`, `session_id` ni `send_message` (0 apariciones cada una); `codex-waits.md` sí. `do not count` sigue en `planner.md` y en `codex-waits.md`.
- Comprobaciones: segment check (cmp, tamaño, `builder-contract`, frontmatter) exit 0; los siete contratos de `tools/verify` con el arnés del Handoff exit 0; los casos negativos siguen fallando (los scripts lo exigen).
- Prueba existente que no pasa, ajena al cambio: `node tests/continuity/protocol.mjs` sale 1 en este sandbox (`Read-only file system (os error 30)` al crear alias de PATH y `network-outbound ab.chatgpt.com:443` denegado). Un `git archive HEAD` extraído a un temporal sale 1 con el mismo error, así que no viene de este tramo. Sus aserciones de idioma sobre `planner.md` siguen cumpliéndose. Queda por ejecutarla fuera del sandbox (la persona usuaria).
- Otras pruebas que leen `planner.md` y pasan: `tests/kit-scope/alcance.test.mjs` (15/15), `tests/compaction/agents.test.mjs` (7/7).
- No se ejecutó `./verify` completo: corresponde a la verificación final del tramo 12.
- Estado: `status: done` (segment check de la historia pasado), `segment: 6`. Pendiente para el planner: revisar la historia B en contexto nuevo antes de reaprobar la historia C (tramos 7–10). No hay commit ni push.

Resumen de historia B (revisión del planner, 2026-11-25): APPROVED.
- A3–A6 cumplidos: planner.md (8191 B) y cinco referencias iguales a los borradores; disallowedTools solo en la cabecera de Claude Code (Pi y Codex sin ella).
- Repetidas por el planner: cmp, tests/context-size (4/4), builder-contract y siete contratos de tools/verify, exit 0.
- En tools/verify solo cambia el archivo de las frases movidas; ninguna comprobación quitada; diff dentro de Scope.
- Sin verificar: tests/continuity/protocol.mjs completo (fuera de ./verify; falla en sandbox; sus frases de planner.md siguen presentes). Siguiente: historia C, segment: 7.

Checkpoint historia C, tramo 7 (modo continuo, builder):
- Archivos nuevos: `scripts/after-compact.mjs` (punteros, máximo 20 líneas, solo lectura, siempre exit 0; usa `tools/spawn/sync-seguro.mjs` para `git branch --show-current`) y `tests/after-compact/after-compact.test.mjs` (10 pruebas: sin `changes/`, compactar con notas, `source: startup`, JSON inválido, dos cambios con rama, carpeta inválida, estado inválido, segmento no numérico, marcador secreto, exit 0 con `changes` como archivo).
- Decisiones menores (en `Decisions`): la línea `Other active changes: N` solo aparece si N ≥ 1; la «próxima acción» se busca solo en `notes.md`; un JSON inválido se trata como entrada vacía (usa `process.cwd()`).
- Comprobación: el primer run fue rojo (exit 1) sin el script; tras crearlo, `node --test tests/after-compact/after-compact.test.mjs` pasa 10/10 (exit 0; duración ≈0,3 s). `node tests/spawn-seguro/estatico.mjs` exit 0.
- Estado: `segment: 8`, `status: in progress`; sin commit.

Checkpoint historia C, tramo 7 (corrección de la devolución, builder, 2026-11-25):
- Archivos: `scripts/after-compact.mjs` (`lineaProximaAccion` devuelve la última cabecera, no la primera); `tests/after-compact/after-compact.test.mjs` (+2 pruebas: «Próxima acción» antigua antes y después de «Next action»).
- Diff: una función cambiada en el script; dos pruebas nuevas. Rojo antes del cambio (2 fallos), verde después (12/12).
- Estado: `segment: 7` cerrado; sin commit.

Checkpoint historia C, tramo 8 (corrección de la devolución, builder, 2026-11-25):
- Archivos: `adapters/shared/compact-hook.mjs` (marca = comando con `.flucastr-ai/raiz` y `/scripts/after-compact.mjs`; `quitar` filtra hooks dentro de cada grupo y borra el grupo solo si queda sin hooks); `tests/after-compact/install.test.mjs` (+4 pruebas, dos por herramienta: grupo compact con hook propio; hook propio `node tools/my-after-compact.mjs`).
- Diff: el editor cambia en `esHookKit`, `esGrupoKit` y `quitar`; la prueba queda 20/20.
- Comprobación: rojo 4 fallos antes; verde 20/20 después; `estatico` exit 0.
- Tramos 9 y 10 sin cambios de código: sus pruebas repetidas (wiring-install 5/5, wiring-uninstall 4/4, compaction/install 9/9) pasan con el editor corregido.
- Estado: historia C completa (tramos 7–10), `segment: 10`, `status: done`. Parada para la revisión del planner en contexto nuevo. El tramo 11 no se ha tocado. Sin commit ni push.

Resumen de historia C (revisión del planner, 2026-11-25): APPROVED tras 1 relanzamiento.
- A7–A10 cumplidos: el hook imprime solo punteros (probado en este repo: apunta a notes.md:57); instalar y desinstalar tocan solo la entrada del kit.
- Reproducciones repetidas en temporales, Claude y Codex: grupo mixto conserva el hook propio; `my-after-compact.mjs` propio no se toca.
- Repetidas: after-compact, compaction/install y context-size 54/54, estatico exit 0.
- Sin verificar: hook en sesión real de Claude Code y Codex. Siguiente: historia D, segment: 11.

Checkpoint historia D, tramo 11 (modo continuo, builder):
- Archivos: `docs/como-funciona.md` (nuevo; las 34 viñetas de «Cómo funciona (v2)» de `main:AGENTS.md`, literales, con encabezado `# Cómo funciona el kit (v2)`, más «Lo de la v1» con los dos párrafos literales); `tests/context-size/sizes.test.mjs` (+3 pruebas: `planner.md` ≤ 8192, referencias de `core/references/planner/` nombradas en `planner.md` existen, `AGENTS.md` ≤ 6144); `AGENTS.md` (reemplazado por `borradores/AGENTS.borrador.md`, 16310 → 4250 bytes).
- Diff: `git diff --stat -- AGENTS.md` → 18 inserciones, 35 borrados.
- Aviso para el planner (A11 «Reglas y Límites iguales»): «Reglas» es idéntica a `main`. «Límites» difiere en una línea: el borrador acorta «Lo de la v1…» a «Lo de la v1 está en `old/v1/`; borrar `old/` es decisión de la persona usuaria.»; el texto completo de `main` queda literal en `docs/como-funciona.md`. Se aplicó el borrador aprobado porque la instrucción de la persona usuaria pide la copia exacta; la comprobación mecánica del segmento no compara «Límites».
- Comprobación: `sizes.test.mjs` 5/5 exit 0; comando de viñetas exit 0. Duración de la prueba ≈0,1 s.
- Estado: `segment: 12`, `status: in progress`; sin commit.

Checkpoint historia D, tramo 12 (modo continuo, builder):
- Archivos: `verify` (paso 23 tras el 22, con `|| fallo "23: …"`; `bash -n` exit 0); `README.md` (sección «Hook tras compactar y piso del planner»: instalación, aprobación en Codex, Pi sin hook, desinstalación, lo no probado, paso 23); `docs/como-funciona.md` (sección «Piso de contexto del planner»: tamaños, referencias del planner y de plan-change, herramientas excluidas, marca y salida del hook, lo no probado).
- Comprobación: `./verify` completo exit 0, `VERIFY OK`, 163 s, `Fingerprint: b397c1c5d405`.
- Decisión menor: el hook se documenta con lo que hace el código actual (ambas marcas, solo quita la entrada del kit, puntero a la última cabecera de próxima acción, sin prueba en sesión real, Pi sin hook).
- Estado: historia D completa (tramos 11–12); `segment: 12`, `status: done` por verificación final pasada. Sin commit ni push.

Resumen de historia D (builder, 2026-11-25): pendiente de la revisión del planner en contexto nuevo.
- A11: `AGENTS.md` 4250 bytes (antes 16310) con el borrador aprobado; bullets de «Cómo funciona» de `main` literales en `docs/como-funciona.md`. Aviso: la línea «Lo de la v1…» de «Límites» cambia en el borrador; su texto completo queda en `docs/como-funciona.md`. Por eso «Reglas y Límites iguales» solo se cumple en «Reglas».
- A12: `verify` paso 23 y documentación; `./verify` completo en verde.
- Sin verificar: hook en sesión real de Claude Code y Codex; `tests/continuity/protocol.mjs` (fuera de `./verify`, falla en este sandbox según la historia B).
- Sin commit ni push.

Revisión de historia D (planner, 2026-11-25): RETURNED. Correcciones en las casillas pendientes de `tramo-11.md`; después repetir `./verify` completo.
Devuelto: defecto — tramo 11 — AGENTS.md:37, A11: «Límites» no es igual a main; la línea «Lo de la v1…» pierde el detalle y la condición para borrar `old/` (error del borrador del planner).

Checkpoint tramo 11, devolución de historia D (builder, 2026-11-25):
- Archivos: `AGENTS.md` (copia de `borradores/AGENTS.borrador.md`, 4434 bytes; «Reglas» y todo lo posterior a «## Reglas» igual a `main`, incluida la línea «Lo de la v1…» completa); `docs/como-funciona.md` (referencia del tamaño de `AGENTS.md`: «4250 hoy» → «4434 hoy»); `changes/piso-planner/tramo-11.md` (casillas (a) y (b) marcadas).
- Comprobación de segmento: `sizes.test.mjs` 5/5, cmp, diff de «Reglas» y viñetas de «Cómo funciona» en `docs/como-funciona.md`, exit 0.
- `./verify` completo: `VERIFY OK`, `Fingerprint: d2307ec11296`, exit 0.
- Nota: la comprobación de «Límites» a la que apunta la devolución queda cubierta por el diff de todo lo posterior a «## Reglas», que ya no difiere de `main`. Sin commit ni push.
- Estado: `status: done`, `segment: 11`.

Revisión final (planner, 2026-11-25): APPROVED. A1–A12 cumplidos.
- `kit-verificado estado --nivel aceptacion` exit 0, Fingerprint d2307ec11296 igual a Evidence: no se repitió `./verify`. Diff desde «## Reglas» contra main vacío; 0 viñetas perdidas.
- Bytes finales: AGENTS.md 4434, planner.md 8191, plan-change/SKILL.md 4366. Pruebas existentes en `tests/` sin cambios.
- `kit-scope` sale 1 por falsos positivos: máscaras del sandbox sin seguimiento y `verify`, que sí está en Scope.
- `kit-close` sale 1: tres pasos del tramo 6 sin el comando literal en Evidence; el planner repitió `git diff tools/verify` y el arnés de contratos en la revisión de B (exit 0).
- Sin verificar: hook en sesión real (Claude Code y Codex), piso medido tras reinstalar, `node tests/continuity/protocol.mjs` fuera del sandbox.
