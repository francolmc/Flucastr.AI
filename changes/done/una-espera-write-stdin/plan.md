---
status: done
branch: fix/una-espera-write-stdin
base: main
repos: [.]
executor: builder
segment: 2
continuity: continuous
type: code
---
# Una sola espera con `write_stdin`: menos avisos «Send input to terminal»

> Revalidado el 2026-11-25 contra la estructura actual (`core/`, `tools/verify/`, `scripts/usage.mjs`). Reemplaza al draft anterior (rutas viejas, bloque 8p de `verify`).

## Goal
Que en Codex un `verify` largo pida permiso una vez al esperar, no 20 a 300 veces: cada `write_stdin` a una terminal lanzada fuera del sandbox pregunta «Would you like to send input to terminal N?». Además, poder medir el antes y el después con el medidor del kit.

## Qué cambió respecto al draft
- Rutas: `skills/ejecutar-plan`, `agentes/constructor.md`, `agentes/principal.md` y `modelos.json` pasan a `core/skills/execute-plan/SKILL.md`, `core/agents/builder.md` y `core/agents/planner.md`; el bloque de `verify` ahora vive en `tools/verify/agent-contracts.sh`.
- Ya cubierto, se quita del alcance: el lanzador fija `background_terminal_max_timeout=1800000` (`adapters/codex/install-launcher.sh:20`, probado en `tools/verify/codex-launcher.sh:81`); la receta de `wait` con `yield_time_ms: 300000` y «one long wait»/«do not count» están en los textos y protegidas por los bloques 8k y 8l.
- Sigue faltando: la receta de `session_id` + `write_stdin`, en los tres textos. Además `planner.md` dice hoy «Do not poll with `tail` or empty `write_stdin`», que contradice la receta; se reformula.
- Nuevo: el medidor no ve el efecto. `sondeos` solo cuenta `sleep`/`tail`/`watch`, y el Codex actual llama `write_stdin` dentro de `exec` (`tools.write_stdin({...})`), así que ni `sondeos` ni `esperas` ni `llamadas` lo captan. Se añade una columna `write_stdin` (tramo 2, aprobado por la persona usuaria).
- Se elimina el criterio A5 «mirar el log a mano»: la medición queda en el tramo 2 con el mismo medidor.

## Exploration
- `core/skills/execute-plan/SKILL.md:48` y `core/agents/builder.md:30` solo cubren «Script running with cell ID N → una llamada `wait`, `yield_time_ms: 300000`». `core/agents/planner.md:62` igual, más «Do not poll with `tail` or empty `write_stdin`». Ninguno cubre `session_id`.
- Evidencia del draft: 179 a 330 `write_stdin` por sesión, casi todos con `yield_time_ms` de 30000 o 1000. En el log local del 2026-11-16 hay 335 eventos `custom_tool_call` con `write_stdin` (ejemplo: `await tools.write_stdin({session_id:93980,chars:"",yield_time_ms:1000,max_output_tokens:4000})`).
- `tools/usage/codex.mjs` cuenta `esperas` y `sondeos` solo sobre `function_call` (líneas 60–61); `custom_tool_call` solo se mira para `apply_patch`. `scripts/usage.mjs:34` define `COLUMNAS_SESIONES`; `tools/usage/report.mjs:15` formatea `sondeos` con `?? "-"`.
- `tests/usage/run.mjs` compara filas de sesiones (≈178–202) y A5a–A5c; fixtures en `tests/usage/fixtures/`.
- Tiempos medidos hoy en esta máquina: `VERIFY_RAPIDO=1 ./verify` 1 min 33 s y `./verify` 1 min 35 s (ambos con `VERIFY OK`).
- Base: `git fetch` falló en el sandbox (`github.com:443`, 403). Antes de lanzar al builder hay que repetir la comprobación de base limpia y al día (`execute-plan`, «Before starting»).
- Preguntas de comportamiento: una, resuelta (ver Validation): incluir o no la columna del medidor.

## Evaluation
- Opción A (recomendada): receta en los tres textos + prueba con copia negativa + columna `write_stdin` en el medidor. Beneficio: el efecto se mide con el mismo medidor y queda protegido. Costo: dos tramos. Riesgo bajo: texto más una columna aditiva de solo lectura.
- Opción B: solo textos, el después se cuenta con `grep`. Más barato, pero sin medición reproducible ni prueba.
- Opción C: configurar Codex para silenciar el aviso. Fuera de este plan (es configuración de Codex, no del kit).

## Assumptions
- `yield_time_ms: 1800000` lo acepta `write_stdin` porque el lanzador fija `background_terminal_max_timeout=1800000`; no se probó con `write_stdin` (solo `wait` tras `sleep 90`, prueba `espera-unica`). Si una sesión lo rechaza, se usa el valor más alto aceptado, nunca un bucle; el texto lo dice. Si la persona usuaria prefiere otro valor, cambia la cadena en tres textos y en la prueba.
- Una llamada JS con `tools.write_stdin(` dentro de un bucle cuenta una vez; la columna cuenta ocurrencias del texto en la entrada de cada `custom_tool_call` (aproximación, como `sondeos`). Si se quiere exactitud por iteración, hay que ejecutar el JS, fuera de alcance.
- El «antes» se recalcula con el mismo medidor sobre los rollouts locales que existan; si no se pueden leer desde el sandbox del builder, lo anota como bloqueo y la persona usuaria pega la cifra.

## Decisions already taken
- Executor: builder, porque (1) los requisitos están cubiertos, (2) los archivos son accesibles, (3) cada paso tiene comprobación y resultado esperado, (4) no hay credenciales ni producción.
- Receta, en una línea: si `exec_command` devuelve un `session_id`, **una sola** llamada `write_stdin` con `chars` vacío y `yield_time_ms: 1800000`; repetirla solo mientras el comando siga corriendo, nunca cada pocos segundos.
- Se conservan `yield_time_ms: 300000`, «one long wait» y «do not count» (los exigen los bloques 8k y 8l).
- La columna nueva se llama `write_stdin`; solo Codex la llena. Claude Code y Pi la dejan sin valor y se muestran como `-`.
- Bloque nuevo de `verify`: `8p` (libre hoy; hay un `8m` duplicado preexistente que no se toca).
- Sin cambios en `models.json` ni `install.sh`.

## Decisions
(las anota el builder)

## Validation
2026-11-25: la persona usuaria pidió revalidar el plan y confirmó incluir la columna `write_stdin` en el medidor (opción A). Sin aprobación explícita del plan completo sigue en `draft`.

## Scope
Puede cambiar (producto): `core/skills/execute-plan/SKILL.md`, `core/agents/builder.md`, `core/agents/planner.md` (tramo 1); `tools/usage/codex.mjs`, `scripts/usage.mjs`, `tools/usage/report.mjs` (tramo 2).
Pruebas y documentos: `tools/verify/agent-contracts.sh`, `tests/usage/run.mjs`, `tests/usage/fixtures/codex-write-stdin/`, `docs/evaluaciones/costos.md`, `tests/README.md` si lista columnas.
Fuera: `models.json`, `install.sh`, `adapters/`, `tools/usage/claude.mjs`, `tools/usage/pi.mjs`, los proyectos que usan el kit.

## Verification
`./verify` — sin Docker del proyecto; debe terminar en exit 0 con `VERIFY OK` (≈1 min 35 s medido el 2026-11-25).

## Stop conditions
Continuar si la comprobación pasa, el siguiente paso sigue dentro de Scope y no falta una decisión de la persona usuaria. Detenerse con nota (hecho, pendiente, motivo) si la misma causa falla dos veces, el trabajo sale de Scope, falta una decisión o una comprobación tarda más del doble de lo medido (≈3 min). Si no se pueden leer los rollouts de Codex, anotarlo y seguir con el resto.
Revisión: fin de historia.

## Steps

Historias en documentos propios (el builder lee `plan.md` y solo el tramo activo):
- [Tramo 1](tramo-1.md): la receta de `session_id` en los tres textos y su bloque 8p.
- [Tramo 2](tramo-2.md): la columna `write_stdin` del medidor y el antes registrado.

## Evidence
Tramo 1 (historia «la receta de `session_id` está en los tres textos»): evidencia completa en [tramo-1.md](tramo-1.md), sección Evidence. Resumen: `grep -c '1800000'` da 1 en `execute-plan/SKILL.md` y en `builder.md`; `grep -c 'session_id'` da 1 en `planner.md`; `grep -c 'empty \`write_stdin\`'` da 0; `grep -c '^# 8p'` da 1; `VERIFY_RAPIDO=1 ./verify` sale con 0 y termina con `VERIFY OK`, con `ok 8p` en la salida.

Tramo 2 (historia «el medidor cuenta `write_stdin` y el antes queda registrado»): evidencia completa en [tramo-2.md](tramo-2.md), sección Evidence. Resumen: `node scripts/usage.mjs --sessions --tool codex --codex-dir tests/usage/fixtures/codex-write-stdin --json` da `write_stdin` 3 y 0; `node tests/usage/run.mjs` sale 0 con 21 de 21 (incluye A5w); la copia sin la rama de `custom_tool_call` hace fallar A5w y el árbol real vuelve a pasar; `costos.md` define la columna, registra el antes (300 sesiones, 152 con `write_stdin`, mediana 14, máximo 955; `corridas_verify` ≥ 1: 0 de 300 por la limitación de `exec`) y dice cómo medir el después; `./verify` sale con 0 y termina con `VERIFY OK`.

## Notes
Checkpoint, tramo 1 (2026-11-25):
- Archivos cambiados: `core/skills/execute-plan/SKILL.md` (1 línea), `core/agents/builder.md` (1 línea), `core/agents/planner.md` (1 línea: receta de `write_stdin` tras la de `wait`, y «empty `write_stdin`» cambiado por «repeated short `write_stdin` calls»), `tools/verify/agent-contracts.sh` (+24 líneas, bloque `8p` con copias negativas). Diff total: 27 inserciones, 3 eliminaciones en `core/` y `tools/`.
- Check: `VERIFY_RAPIDO=1 timeout 180s ./verify` salió con 0 y `VERIFY OK`. No se midió la duración exacta de esta corrida; terminó dentro del límite de 180 s (dos veces lo medido).
- Pendientes del tramo 1: 0 (`- [ ]` en tramo-1.md).
- Rama: `fix/una-espera-write-stdin` ya era la rama actual, así que no se creó ni se comprobó la base. Sin commit.
- Fuera de alcance, sin tocar: en la raíz del repo hay archivos sin seguimiento (`.bashrc`, `.gitconfig`, `.zshrc`, `.idea`, `.vscode`, etc.) que ya estaban antes de empezar. No se borraron ni se añadieron.
- Revisión del planner, tramo 1 (2026-11-25): APPROVED. Diff dentro de Scope (3 textos + bloque 8p), `grep` de A1/A2 correctos, bloques 8k/8l intactos. Avanza el tramo 2 con `segment: 2`.
- Parada: el tramo 2 («el medidor cuenta `write_stdin`…») es otra historia. El plan declara `Revisión: fin de historia`, así que el builder se detiene aquí para la revisión del planner en contexto nuevo. Para retomar: el planner revisa, pone `segment: 2` y `status: approved`, y relanza el builder con `tramo-2.md`.

Checkpoint, tramo 2 (2026-11-25, ejecutado en esta corrida por petición explícita de la persona usuaria con `segment: 2`; el tramo 1 no se tocó):
- Archivos cambiados: `tools/usage/codex.mjs` (cuenta `write_stdin` directo y `tools.write_stdin(` dentro de `custom_tool_call` de `exec`), `scripts/usage.mjs` (columna `write_stdin` tras `sondeos`, comentarios y ayuda), `tools/usage/report.mjs` (`write_stdin ?? "-"`), `tests/usage/run.mjs` (fila de Codex con `write_stdin: 0` y prueba A5w), `docs/evaluaciones/costos.md` (definición, antes y método del después), y la fixture nueva `tests/usage/fixtures/codex-write-stdin/`. Diff de los cinco archivos existentes: 49 inserciones, 7 eliminaciones.
- Check: `./verify` salió con 0 y `VERIFY OK` (paso 12 «medidor de costos»: 21 de 21 ok). Duración medida ≈1 min 35 s, dentro del límite de 3 min.
- Desviación 1: la fixture estaba fechada 2026-11-10, fuera de la ventana por defecto de 7 días de `--since`, y devolvía lista vacía. Se movió a `2026/11/25` y se reescribieron las fechas dentro de los archivos, así que A5 pasa sin `--since`.
- Desviación 2: el check de A6 con Pi (`--pi-dir tests/usage/fixtures/pi-sesiones` sin `--since`) dice «sin sesiones desde 2026-11-18», porque la fixture es de 2026-11-08. Con `--since 2026-01-01` la fila sale con `write_stdin` = `-`. El check de la tabla se hizo con esa opción.
- Hallazgo fuera de Scope, sin corregir: `corridas_verify` solo cuenta `exec_command` y `shell`, así que un `./verify` lanzado dentro de `exec` no se cuenta. Por eso el antes da 0 de 300 sesiones con `corridas_verify` ≥ 1. Queda anotado en `costos.md`. Para el planner: decidir si el medidor debe contar `exec` con `./verify`.
- Pendientes del tramo 2: 0 (`- [x]` en tramo-2.md).
- Git: sin commit, sin push. Los archivos sin seguimiento de la raíz (`.bashrc`, `.gitconfig`, `.zshrc`, `.idea`, `.vscode`, etc.) ya estaban antes; no se tocaron. La carpeta `tests/usage/fixtures/codex-write-stdin/` es nueva y sin seguimiento.
- Revisión: el plan declara `Revisión: fin de historia`; esta historia queda completa y `status: done` por verify pasado. El planner revisa en contexto nuevo antes de archivar.
