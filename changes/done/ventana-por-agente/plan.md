---
status: done
branch: feature/ventana-por-agente
base: main
repos: [.]
executor: builder
segment: 10
continuity: continuous
type: code
---
# Ventana de compactación por agente y herramienta

## Goal
El kit fija la compactación por agente y herramienta; al reinstalar corrige lo que él escribió en los proyectos registrados, respeta lo puesto por la persona usuaria y avisa cuando el margen no alcanza.

## Exploration
Evidencia, estado instalado y hallazgos: [notes.md](notes.md).
- Claude Code 2.1.332: existen `--autocompact` (docs y `--help`) y `autoCompactWindow` en frontmatter de subagente (desde 2.1.296; solo baja la ventana heredada). No hace falta alternativa.
- Hoy: un valor (133000) para todos en `.claude/settings.local.json`; cualquier valor existente se respeta; los lanzadores y agentes huérfanos del manifiesto no se regeneran.
- Pisos medidos: solo planner en Claude Code, 71.097–102.971.
- 2026-11-25, ¿`claude-builder` lleva también `--autocompact 200000`? Sí.
- 2026-11-25, ¿133000 sin registrar? Es del kit: se actualiza con aviso; otro número se respeta.
- 2026-11-25, ¿Pi? Disparo = ventana − 92000.
- 2026-11-25, ¿revisor? Igual que planner; `kit run` pasa el límite Codex a builder y revisor.

## Evaluation
- Valor por agente y herramienta en `models.json`: una sola fuente y compatible con números antiguos. Recomendada.
- Valor global con desfases: menos claves, pero oculta la tabla. Descartada.
- Comprobación como comando del resolver (`ventanas`): determinista y probable sin modelo. Recomendada frente a ampliar la skill `diagnose`.

## Ventanas

| Agente | Claude Code (ventana / disparo) | Codex (disparo) | Pi con ventana 272000 (disparo) |
|---|---|---|---|
| planner | 300000 / 267000 | 200000 | 180000 |
| builder | 200000 / 167000 | 150000 | 180000 |
| revisor | 300000 / 267000 (hereda el proyecto) | 200000 | 180000 |

Margen sobre el peor piso (102.971): Claude planner 164.029; Codex planner 97.029 y Pi 77.029 quedan bajo 100.000 y `ventanas` los avisará.

## Assumptions
- El `modelos.json` personal no se edita; un planner antiguo con 60000 queda fuera de rango y solo se avisa. Si se quiere migrar, se añade un tramo.
- Un `reserveTokens` 172000 sin registrar en Pi es del kit y se reemplaza. Si es tuyo, se quita esa regla de S7.
- La regla del margen se aplica a Codex y Pi sobre el disparo. Si es solo de Claude Code, `ventanas` no avisa en ellos.
- Sin piso propio se usa el del mismo agente en otra herramienta, rotulado como prestado; builder queda «piso sin medir».
- Codex planner se queda en 200000, como pediste (205000 cumpliría el margen).
- Proyectos registrados sin nada de Claude Code solo se actualizan si ya tienen el campo.
- Un proyecto que nunca estuvo en el manifiesto necesita `--project` una vez.
- Un archivo con la marca del kit se regenera: las ediciones hechas a mano en él se pierden.
- El revisor en Claude Code usa la ventana del proyecto; ningún mecanismo lee un valor propio.
- El builder como subagente de Codex no cambia de límite.

## Decisions already taken
- Tabla de ventanas y las cuatro respuestas de Exploration.
- Aviso cuando disparo − piso < 100000, coherente con la regla `>=`.
- No cambian modelos, niveles, esfuerzos ni restricciones de seguridad.
- Executor: builder, porque requisitos, contexto y comprobaciones están escritos y no hay credenciales ni despliegue.
- Revisión: fin de historia.

## Decisions
(durante la ejecución)
- Tramo 1: el revisor resuelve kit_run.reviewer → agents.planner → perfil → general (menor, dentro de S1).
- Resuelto: 2026-11-25 la precedencia de Claude Code es por archivo (local > proyecto > usuario) y, dentro de cada uno, `modelSettings.<modelo>.autoCompactWindow` antes que `autoCompactWindow`, según la documentación; corrige la redacción de A9. Sin medir en sesión real.

## Validation
Respuestas confirmadas el 2026-11-25. Plan aprobado el 2026-11-25; builder como subagente.

## Scope
Solo las rutas de `Files:` de cada tramo, `tests/compaction/` y `README.md` (S9). Fuera: instaladores de deny, sandbox y hooks; `core/`; configuración real de tu HOME; el error previo `${effort}` en el mensaje de los lanzadores.

## Verification
`./verify` — solo en el tramo 10. Base en main: salida 0, 122 s (WSL2, node v24.22.1), fingerprint b406b5d57f81.

## Stop conditions
- Reglas de lectura: ningún archivo de más de 150 líneas entero (offset y limit); toda salida larga (`./verify`, grep amplio, `git diff`) va a `$TMPDIR` y se lee `tail -n 20` o un conteo.
- Tras cada tramo, anotar hecho, pendiente y próxima acción en `changes/ventana-por-agente/notes.md`; tras compactar, retomar desde ahí.
- `changes/reducir-contrato-builder/` es un borrador previo ajeno: no tocarlo.
- Parar si la misma causa falla dos veces, si hay que salir de Scope, falta una decisión o una comprobación tarda más del doble de lo medido.
- La primera corrida de cada prueba nueva se mide con límite de 120 s; no es motivo de parada.
- Nunca ejecutar `install.sh` ni `uninstall.sh` con el HOME real. Las pruebas usan HOME temporal, fijan `PI_CODING_AGENT_DIR` y `CODEX_HOME` dentro de él y quitan `FLUCASTR_MODELOS`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW` y `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`.
- Los `spawnSync` de las pruebas usan `stdio` sin pipe en stdin (paso 19 de `./verify`).
- Cada prueba nueva incluye un caso que falla si se quita la regla que cubre.

## Stories
1. Claude Code con margen: S1 (abajo), [S2](tramo-2.md), [S3](tramo-3.md), [S4](tramo-4.md), [S5](tramo-5.md), [S6](tramo-6.md) — revisada: APPROVED (2026-11-25).
2. Pi y Codex: [S7](tramo-7.md), [S8](tramo-8.md) — revisada: APPROVED (2026-11-25).
3. Comprobar ventanas: [S9](tramo-9.md), [S10](tramo-10.md) — revisada: APPROVED (2026-11-25).

## Steps

### Segment 1 — Story: Claude Code con margen
As persona usuaria I want un valor por agente y herramienta so that el planner tenga margen.
Dependencies: none.
Contracts to keep: `compactar-codex <agente>` con un argumento; un `compact_at` numérico antiguo sigue valiendo; modelos y esfuerzos iguales.
Paths likely to change: `models.json`, `tools/model-resolution/models.mjs`, `tools/verify/codex-launcher.sh` (aserciones 1b y 1c).
Concrete example of the expected result: `node scripts/resolver.mjs compactar-codex planner` imprime 200000; con `reviewer`, 200000; con `builder`, 150000.
Scope: los tres archivos de Files y `tests/compaction/resolve.test.mjs`.
Files: models.json, tools/model-resolution/models.mjs, tools/verify/codex-launcher.sh
WHEN se resuelve el umbral de un agente THEN sale el valor de esa herramienta (A1).
Acceptance:
- A1: `models.json` tiene `compaction.work_margin` 100000, `compaction.floors.claude-code.planner` 102971, `agents.planner.compact_at` {claude-code 267000, codex 200000}, `agents.builder.compact_at` {claude-code 167000, codex 150000}, `kit_run.reviewer.compact_at` como planner, `profiles.pi-openai.compact_reserve` 92000, ventana 272000 para `openai/gpt-6.1-terra` y ningún `compact_at` global; `_readme` documenta «ventana >= piso medido + 33000 + margen de trabajo de al menos 100000» y que hoy Codex y Pi no la cumplen para planner. `models.mjs` exporta `compactarEn(c, agente, herramienta)`: valor del agente (objeto por herramienta o número) → `compact_at` del perfil → global; `reviewer` usa `kit_run.reviewer` y, sin valor, planner.
TODO:
- [x] Editar `./models.json` con las claves de A1 y su `_readme` (A1). Check: `node -e "JSON.parse(require('fs').readFileSync('./models.json'))"`; salida 0.
- [x] Añadir `compactarEn` en `tools/model-resolution/models.mjs` y usarla en `compactarCodex` (A1). Check: `node scripts/resolver.mjs compactar-codex reviewer`; imprime 200000.
- [x] En `tools/verify/codex-launcher.sh`, 1b borra también los objetos por agente y el del revisor; 1c espera `agents.<agente>.compact_at.codex` (A1). Check: `bash -n tools/verify/codex-launcher.sh`; salida 0.
- [x] Crear `tests/compaction/resolve.test.mjs`: valores de la tabla, número antiguo, revisor sin clave y sin ningún valor (A1). Check: `node --test tests/compaction/resolve.test.mjs`; salida 0.
Segment verification: `node --test tests/compaction/resolve.test.mjs` — level 1; exit 0; covers A1.
Handoff: Ejemplo: `{"compact_at":60000}` en planner devuelve 60000 en ambas herramientas. Hasta S5 y S7 la instalación de Claude Code y Pi informará `omitido-umbral`; es esperado.

## Evidence

$ node -e "JSON.parse(require('fs').readFileSync('./models.json'))"
(sin salida)
exit 0

$ node scripts/resolver.mjs compactar-codex reviewer
200000
exit 0

$ bash -n tools/verify/codex-launcher.sh
(sin salida)
exit 0

$ node --test tests/compaction/resolve.test.mjs
ℹ tests 8
ℹ suites 1
ℹ pass 8
ℹ fail 0
exit 0
```

Repetición tras la segunda revisión (E1, menores, E2; 2026-11-25):

```
$ bash -n ./verify
exit 0
$ ./verify > "$TMPDIR/w9/verify.log" 2>&1
ℹ tests 93
ℹ pass 93
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
VERIFY OK
resultado registrado: Fingerprint: f9ddc8130afe
verify exit 0 (2 min 29 s; base 122 s)
```

## Notes

Tramo 1 (segmento 1) — checkpoint:
- Archivos: `models.json`, `tools/model-resolution/models.mjs`, `tools/verify/codex-launcher.sh`, `tests/compaction/resolve.test.mjs` (nuevo).
- Diff: 3 archivos modificados (43 inserciones, 18 borrados) más la prueba nueva. models.json: `compaction {work_margin, floors}`, `compact_at` por agente y herramienta (planner, builder, kit_run.reviewer), `compact_reserve` 92000 en `pi-openai`, ventana 272000 para `gpt-6.1-terra`, sin `compact_at` global. models.mjs: `compactarEn` exportada; `compactarCodex` la usa.
- Decisión menor (Decisions): el revisor resuelve kit_run.reviewer → agents.planner → perfil → general.
- Check: `node --test tests/compaction/resolve.test.mjs` salida 0 (8 pruebas). `bash -n` sobre `codex-launcher.sh` salida 0; el comportamiento de 1b/1c se confirma en la verificación de tramo 10.

Tramo 2 (segmento 2) — checkpoint:
- Archivos: `scripts/resolver.mjs`, `adapters/shared/markdown-agent.mjs`, `adapters/claude-code/install-launcher.sh`, `tests/compaction/agents.test.mjs` (nuevo).
- Diff: `ventana-claude` y `ventanaAutoCompact` en el resolver; `autoCompactWindow` solo en Claude Code y solo si el agente tiene ventana menor que el planner; `--autocompact N` tras `--effort` en el lanzador.
- Check: `node --test tests/compaction/agents.test.mjs` salida 0 (7 pruebas); `ventana-claude planner` 300000; `agente-claude builder` contiene `autoCompactWindow: 200000`; `bash -n` salida 0. Detalle en `tramo-2.md`.

Tramo 3 (segmento 3) — checkpoint:
- Archivos: `tools/install/links.sh` (`liberar` libera también un archivo regular con una línea que empieza por la marca), `adapters/claude-code/install-launcher.sh` y `adapters/codex/install-launcher.sh` (guarda con `liberar`), `tests/compaction/orphans.test.mjs` (nuevo, 5 pruebas).
- Diff: 3 archivos con cambios acotados y 1 prueba nueva.
- Check: `node --test tests/compaction/orphans.test.mjs` salida 0 (5 pruebas); `bash -n` de los tres archivos salida 0. Detalle en `tramo-3.md`.

Tramo 4 (segmento 4) — checkpoint:
- Archivos: `adapters/pi/install-launcher.sh`, `tools/install/kit-run-launcher.sh` (guarda con `liberar`), `tests/compaction/launchers.test.mjs` (nuevo, 4 pruebas).
- Diff: 2 guardas cambiadas y 1 prueba nueva.
- Check: `node --test tests/compaction/launchers.test.mjs` salida 0 (4 pruebas); `bash -n` de los dos archivos salida 0. Detalle en `tramo-4.md`.

Tramo 5 (segmento 5) — checkpoint:
- Archivos: `adapters/claude-code/compaction.mjs` (reescrito: `analizarFijarClaude`, `fijarCompactacionClaude` con el orden de A5; `quitarCompactacionClaude` sin cambios frente a HEAD), `adapters/claude-code/install-compaction.sh` (registro por ruta con `registrados_claude`, `quitar_registro_claude`, `dejar_un_registro_claude`; casos fijado, actualizado, ya-estaba, sin-campo, omitido-*), `scripts/resolver.mjs` (import, despacho, cabecera y uso de `fijar-compactacion claude`), `tests/compaction/settings.test.mjs` (nuevo, 18 pruebas).
- Diff: 3 archivos modificados y 1 prueba nueva; solo se toca `autoCompactWindow` y el registro `compactacion` de Claude Code.
- Check: `node --test tests/compaction/settings.test.mjs` salida 0 (18 pruebas, 0 fallos); `node --check` de `compaction.mjs` y `resolver.mjs` salida 0; `bash -n` de `install-compaction.sh` salida 0. Detalle en `tramo-5.md`.

Tramo 6 (segmento 6) — checkpoint:
- Archivos: `adapters/claude-code/install-compaction.sh` (`compactacion_claude_en <ajustes>` por ruta; `refrescar_compactacion_claude_registrada`), `install.sh` (recoge `REFRESCO_COMPACTACION_CLAUDE` antes de `uninstall.sh`; llama al refresco dentro del bloque de Claude), `tests/compaction/install.test.mjs` (nuevo, 9 pruebas).
- Diff: 2 archivos modificados (refresco y recogida) y 1 prueba nueva; con `--only pi|codex` no se toca Claude.
- Check: `node --test tests/compaction/install.test.mjs` salida 0 (9 pruebas, 0 fallos); `bash -n` de `install.sh` y `install-compaction.sh` salida 0; regresión de las suites de `tests/compaction/` salida 0 (42 pruebas). Detalle en `tramo-6.md`.

Tramo 7 (segmento 7) — checkpoint:
- Archivos: `adapters/pi/compaction-plan.mjs` (`reservaPi` con `compact_reserve` del perfil, o el cálculo anterior sin él; `esReservaKitAntigua` para reemplazar `{reserveTokens:172000}` exacto con la línea `reemplazado 172000 en <modelo>`), `tests/compaction/pi.test.mjs` (nuevo, 12 pruebas).
- Diff: 1 archivo modificado (reserva y reemplazo en `planFijarPi`; `aplicarFijarPi` y `quitarOverridePi` sin cambios) y 1 prueba nueva.
- Check: `node --check adapters/pi/compaction-plan.mjs` salida 0; `node --test tests/compaction/pi.test.mjs` salida 0 (12 pruebas, 0 fallos). Detalle en `tramo-7.md`.

Tramo 8 (segmento 8) — checkpoint (fin de historia 2, S7–S8):
- Archivos: `tools/run/commands.mjs` (`crearComando` acepta `resolverCompactacion(agente)` opcional y añade `-c model_auto_compact_token_limit=<valor>` tras `model_reasoning_effort`, solo con valor no vacío), `tools/run/profiles.mjs` (`resolverCompactacion` con `compactar-codex <agente>`), `scripts/kit-run.mjs` (conexión a `crearComando`; BUILDER → `builder`, revisor → `reviewer`), `tests/compaction/kit-run.test.mjs` (nuevo, 7 pruebas).
- Diff: 3 archivos modificados (inserciones pequeñas en la bandera, el resolutor y la conexión) y 1 prueba nueva. `KIT_RUN_<ROL>`, argumentos, sandbox y política de aprobación sin cambios.
- Check: `node --check` de los tres archivos salida 0; `node --test tests/compaction/kit-run.test.mjs` salida 0 (7 pruebas, 0 fallos); `node --test tests/compaction/*.test.mjs` salida 0 (70 pruebas, 0 fallos). Detalle en `tramo-8.md`.
- Estado: historia 2 completa (S7–S8). Parada para revisión del planner en contexto nuevo; `segment: 8`, `status: in progress`. No se ejecutó `./verify` completo (tramo 10).

Revisión historia 1 (S1–S6) — APPROVED (2026-11-25):
1. A1–A6 cumplidos y conectados a `install.sh`; `node --test tests/compaction/*.test.mjs`: 51 pasan, 0 fallan.
2. Cambios solo dentro de Scope; ninguna prueba de aceptación previa tocada; sin cambios de modelos, esfuerzos ni restricciones.
3. Sin ejecutar: `./verify` completo (incluye 1b/1c de `codex-launcher.sh`) queda para S10; sin medición en sesión real.
4. Avisar al cerrar: con `--copy`, un `modelos.json` personal antiguo (planner 60000) da 93000, fuera de rango, y queda el 133000.
5. Contratos sin prueba propia: `--only` sin Claude (S6, cumplido por lectura de `install.sh`) y «reinstalar sin cambios deja el HOME idéntico» (S3, confirmar con `./verify` en S10). Sigue: S7–S8 (historia 2).

Revisión historia 2 (S7–S8) — APPROVED (2026-11-25):
1. A7 y A8 cumplidos y conectados: Pi vía `fijar-compactacion pi`; Codex vía `kit-run.mjs` → `compactar-codex <rol>`. `node --test tests/compaction/*.test.mjs`: 70 pasan, 0 fallan.
2. Cambios solo dentro de Scope; ninguna prueba previa tocada; argumentos, sandbox y política de aprobación sin cambios.
3. Sin ejecutar: `./verify` completo (incluye `tests/kit-run/`), queda para S10; sin medición en sesión real de Pi ni de `kit run` con Codex.
4. Mejora sugerida (no implementar aquí): el mensaje `omitido-umbral` de `adapters/pi/install-compaction.sh` línea 32 solo menciona `compact_at`, aunque ahora también aplica a `compact_reserve`.
5. Sigue: S9–S10 (historia 3).

Tramo 9 (segmento 9) — checkpoint:
- Archivos: `tools/resolver/windows.mjs` (nuevo: `calcularVentanas`, `formatearVentanas`, `proyectosDelManifiesto`), `scripts/resolver.mjs` (comando `ventanas`, cabecera y uso con opción sale 2), `README.md` (sección «Ventanas de compactación», sin menciones a 133000 que corregir), `tests/compaction/windows.test.mjs` (nuevo, 13 pruebas).
- Diff: 2 archivos modificados y 2 nuevos. Solo lectura: no escribe ajustes ni lanzadores.
- Check: `node --check` de `tools/resolver/windows.mjs` y `scripts/resolver.mjs` salida 0; `git diff --check -- README.md scripts/resolver.mjs` salida 0; `node --test tests/compaction/windows.test.mjs` salida 0 (13 pruebas, 0 fallos, 1 s con HOME temporal).
- Estado: segmento 9 completo; `segment: 10`, `status: in progress`. Sin `./verify` completo (tramo 10).

Tramo 10 (segmento 10) — checkpoint (fin de historia 3, S9–S10):
- Archivos: `verify` (paso 22: `node --test tests/compaction/*.test.mjs || fallo "22: …"` antes de `VERIFY OK`). Ningún otro archivo tocado en este tramo.
- Check: `bash -n ./verify` salida 0; `./verify > "$TMPDIR/verify.log" 2>&1` salida 0 en 148 s; cola: `tests 83`, `pass 83`, `fail 0`, `VERIFY OK`, `Fingerprint: 83812daf1d3b`.
- Estado: historia 3 completa; `segment: 10`, `status: done` (verify pasó). Cierre y archivo en `changes/done/` lo hace el planner.
- Pendientes detectados, anotados y no añadidos (para el planner):
  - `--only pi|codex` sin tocar Claude: no probado por prueba propia.
  - «Reinstalar sin cambios deja el HOME idéntico»: no probado por prueba propia; confirmar fuera de este plan.
  - Confirmación de 1b/1c de `tools/verify/codex-launcher.sh`: no se confirmó por separado aquí.
  - Cosmético: `primera` sin uso en `liberar`.
  - Mejora sugerida: el mensaje `omitido-umbral` de `adapters/pi/install-compaction.sh` línea 32 solo menciona `compact_at`.
- Sin commit, push, PR, merge ni instalación real. `$TMPDIR/verify.log` conservado.

Revisión historia 3 (S9–S10) — RETURNED (2026-11-25), relanzamiento 1 de 2:
- A10 cumplido (paso 22; `./verify` exit 0, fingerprint 83812daf1d3b). Sin pruebas previas alteradas; cambios dentro de Scope.
- D1 (A9) `tools/resolver/windows.mjs` ~193–208: nunca se lee `claude-builder --autocompact`; faltan las filas por lanzador y por sesión de planner y builder.
- D2 (A9) `tools/resolver/windows.mjs` líneas 60 y 81–84: `modelSettings` es por modelo (`modelSettings.<modelo>.autoCompactWindow`); se lee un nivel equivocado y avisa por la sola presencia (en esta máquina solo hay `effortLevel`: aviso falso y salida 1).
- D3 (A9, TODO 3 de tramo-9) `README.md`, «Ventanas de compactación»: falta la tabla de ventana por agente y herramienta.
- Detalle y pasos: tramo-9.md, «Correcciones».
- Corrección historia 3 (2026-11-25), sin relanzar revisor: D1, D2 y D3 cumplidos en `tools/resolver/windows.mjs` y `README.md`. `node --check tools/resolver/windows.mjs` → exit 0; `node --test tests/compaction/windows.test.mjs` → 19 pasan, 0 fallan; `git diff --check -- README.md` → exit 0.
- Segmento 10 (2026-11-25): `bash -n ./verify` → exit 0; `./verify > "$TMPDIR/verify.log" 2>&1` → exit 0, `ℹ tests 89`, `ℹ pass 89`, `ℹ fail 0`, `VERIFY OK`, `Fingerprint: f45251bef1d9`. Historia 3 (S9–S10) completa; se detiene para la revisión del planner en contexto nuevo.

Revisión historia 3 (S9–S10) — RETURNED (2026-11-25), relanzamiento 2 de 2 (el último):
- D2, D3 y A10 cumplidos; huella f45251bef1d9 verificada, sin pruebas previas alteradas.
- E1 (A9) `tools/resolver/windows.mjs` ~223–233: las filas `claude-<agente>` usan solo el lanzador. Con `CLAUDE_CODE_AUTO_COMPACT_WINDOW=133000` y lanzador 300000, la fila muestra `300000 267000 lanzador OK` (falso OK); la fila `sesión` sí muestra 133000. Debe ganar entorno o bloque `env`.
- E2 (A9) `README.md` línea 36: cita `changes/ventana-por-agente/plan.md`, ruta que cambia al archivar.
- Menores (A9) `windows.mjs`: línea 78, la vía debe ser `modelSettings.<modelo>`; líneas 63–65, el comentario describe mal la precedencia.
- Detalle y pasos: tramo-9.md, «Correcciones (segunda revisión)».

Checkpoint historia 3 tras la segunda revisión (segmentos 9 y 10, relanzamiento 2 de 2, 2026-11-25):
- Archivos: `tools/resolver/windows.mjs` (E1: filas `claude-planner` y `claude-builder` con la ventana efectiva del lanzador, donde entorno y bloque `env` ganan; se quita `deLanzador`; menores: vía `modelSettings.<modelo>` y comentario de precedencia reescrito), `tests/compaction/windows.test.mjs` (4 pruebas nuevas de E1; 23 en total), `README.md` (E2: quitada la referencia a `changes/ventana-por-agente/plan.md` en la línea 36), `changes/ventana-por-agente/tramo-9.md` y `tramo-10.md` (casillas y evidencia).
- Diff: E1 cambia las dos filas `claude-<agente>` y elimina `deLanzador`; README solo cambia la línea 36.
- Mutación de E1 (filas `claude-*` vuelven a leer solo el lanzador, en copia de trabajo): `node --test tests/compaction/windows.test.mjs` sale 1 con 3 fallos; archivo restaurado y comparado con `cmp`.
- Checks: `node --check tools/resolver/windows.mjs` exit 0; `node --test tests/compaction/windows.test.mjs` exit 0, 23 pasan, 0 fallan; `grep -c 'changes/ventana-por-agente' README.md` → 0; `./verify > "$TMPDIR/w9/verify.log" 2>&1` exit 0, `tests 93`, `pass 93`, `fail 0`, `VERIFY OK`, `Fingerprint: f9ddc8130afe`.
- Residuos (no añadidos como pruebas; ya anotados por el planner): la vía `modelSettings.<modelo>` no se imprime (la columna vía muestra `sesión`); `--only pi|codex` sin tocar Claude; «reinstalar sin cambios deja el HOME idéntico»; confirmación 1b/1c de `tools/verify/codex-launcher.sh`; `primera` sin uso en `liberar`; mejora sugerida en `adapters/pi/install-compaction.sh` línea 32.
- Historia 3 (S9–S10) completa: `status: done`, `segment: 10`. Sin commit, push, PR, merge ni instalación real; `changes/reducir-contrato-builder/` no tocado. Se detiene para la revisión del planner.

Revisión final historia 3 — APPROVED (2026-11-25):
- A9 y A10 cumplidos (E1, E2 y menores corregidos); `windows.test.mjs` 23/23; huella f9ddc8130afe verificada, no se repitió `./verify`; sin pruebas previas alteradas.
- Hecho: ventana por agente y herramienta en `models.json`; el instalador escribe y actualiza lanzadores, builder y ajustes registrados, y respeta los valores propios.
- Hecho: `node scripts/resolver.mjs ventanas` lista la ventana efectiva y avisa. En este equipo aún avisa: falta reinstalar.
- Sin verificar: efecto de `--autocompact` en subagentes; frontmatter según resúmenes de la documentación; precedencia de `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` y de `modelSettings`; pisos de builder, revisor, Codex y Pi; ventana 272000 de Pi (solo catálogo incluido); efecto del límite de Codex en el builder como subagente; claves propias de `~/.pi/agent/settings.json` frente a «sin fijar»; causa de los registros perdidos del manifiesto; ninguna sesión real.
- Con `--copy`, un `modelos.json` personal antiguo (planner 60000) deja 133000 (`omitido-rango`).
- Pruebas pendientes: `--only pi|codex` sin tocar Claude, reinstalación idempotente, 1b/1c de `codex-launcher.sh`; menores: `primera` sin uso en `liberar`, la tabla no imprime la vía `modelSettings.<modelo>` en filas `sesión`.

