# ventana-por-agente — avance

## Hecho

- Docs + `claude --help` (instalado 2.1.332; codex-cli 0.172.0; pi 1.5.2):
  - `--autocompact <auto|tokens>` existe (docs cli-reference y `--help`; desde 2.1.221).
  - Frontmatter de subagente `autoCompactWindow` existe (desde 2.1.296): solo puede bajar la ventana heredada; sin efecto con `claude --agent`.
  - `CLAUDE_CODE_AUTO_COMPACT_WINDOW` gana a `--autocompact`, `/autocompact` y al ajuste `autoCompactWindow`.
  - Sin documentar: `--autocompact` sobre subagentes; precedencia de `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`.
- Estado instalado (solo claves de compactación):
  - settings.local.json de este repo y de Kelvo.Agent: 133000; el manifiesto solo registra Kelvo (`claude:133000`).
  - `codex-planner` 60000, `codex-builder` 100000.
  - Pi overrides: sol y luna `reserveTokens` 172000 (disparo 100000); terra sin override.
  - Los valores «P0 a mano» del pedido (300000 / 200000 / 150000 / ~180000) no aparecen en esta máquina.
- Pisos medidos: solo planner Claude Code, 71.097–102.971 tras compactar (`changes/done/compactacion-planner/diagnostico.md`).
- Base: `./verify` en main rc=0, 122 s, fingerprint b406b5d57f81 (WSL2, node v24.22.1).

## Hallazgos de código

- `~/.flucastr-ai/manifiesto.txt`: CERO líneas `archivo`; agentes y lanzadores generados huérfanos (destino existe → OMITIDO y no se registra: `adapters/*/install-agent.sh`, `install-launcher.sh`; `tools/install/links.sh` `liberar` solo quita enlaces). Detonante original sin verificar.
- `install.sh` ~280-395: al reinstalar copia líneas `compactacion … claude:`; `instalar_compactacion_claude` solo corre con `--project` (precedente para iterar registrados: `refrescar_reglas_codex_registradas`).
- `adapters/claude-code/compaction.mjs`: `perfil.compact_at ?? c.compact_at` (ignora `agents.*`), colchón 33000, omitido-usuario ante cualquier valor.
- `adapters/pi/compaction-plan.mjs`: por modelo, no por agente; `models.json` no declara ventana de `openai/gpt-6.1-terra`.
- Pruebas: solo `tools/verify/codex-launcher.sh` cubre compactación (60-83, 116). `verify` llega al paso 21.
- `tools/run/commands.mjs`: kit run Codex no pasa `model_auto_compact_token_limit`.

## Decisiones confirmadas (2026-11-25)

- claude-builder: además del frontmatter, `--autocompact 200000` en su lanzador.
- 133000 sin registrar: se trata como del kit (se actualiza con aviso); otro número se respeta.
- Pi: disparo = ventana − 92000 (180000 con 272000); no cumple el margen sobre el peor piso (77k): el comando lo avisa.
- Revisor: igual que planner (267000 Claude / 200000 Codex); `kit run` pasa el límite Codex a builder y revisor.

## Diseño del plan

- Config: `compaction {work_margin, floors}`; `agents.<a>.compact_at {claude-code, codex}`; `kit_run.reviewer.compact_at`; `profiles.pi-openai.compact_reserve` 92000 + ventana terra; sin `compact_at` global en el archivo del kit (el código sigue aceptando números).
- S1 config+resolución · S2 frontmatter+`--autocompact` · S3 `liberar` + lanzadores Claude/Codex · S4 lanzadores Pi/kit-run · S5 fijar-compactacion con registrado · S6 refresco en install.sh · S7 Pi · S8 kit run · S9 comando `ventanas` · S10 paso 22 de `./verify`.

## Pendiente

- Gate 1 aprobado (2026-11-25, subagente). Rama `feature/ventana-por-agente` creada.
- Builder: historia A (tramos 1–6); después revisión; historias B (7–8) y C (9–10).

## Próxima acción

Lanzar el builder y esperar su retorno.

## Avance del builder (esta ejecución, historia A)

- Tramo 1 (segmento 1): hecho. Comprobación `node --test tests/compaction/resolve.test.mjs` exit 0 (8 pruebas). Archivos: models.json, tools/model-resolution/models.mjs, tools/verify/codex-launcher.sh, tests/compaction/resolve.test.mjs.
- Tramo 2 (segmento 2): hecho. Comprobación `node --test tests/compaction/agents.test.mjs` exit 0 (7 pruebas); `ventana-claude planner` 300000; `agente-claude builder` con `autoCompactWindow: 200000`; `bash -n` del lanzador exit 0. Archivos: scripts/resolver.mjs, adapters/shared/markdown-agent.mjs, adapters/claude-code/install-launcher.sh, tests/compaction/agents.test.mjs.
- Próxima acción: leer tramo-3.md (S3, `liberar` + lanzadores Claude/Codex) y ejecutarlo.
- Tramo 3 (segmento 3): hecho. Comprobación `node --test tests/compaction/orphans.test.mjs` exit 0 (5 pruebas, ~11 s); `bash -n` de links.sh y de los dos lanzadores exit 0. Archivos: tools/install/links.sh, adapters/claude-code/install-launcher.sh, adapters/codex/install-launcher.sh, tests/compaction/orphans.test.mjs (nuevo). Corrección: la marca se busca en cualquier línea (va tras el shebang).
- Pendiente de historia A: tramos 4 a 6. Tramos 7 a 10 no se tocan en esta ejecución.
- Próxima acción: leer tramo-4.md (S4, lanzadores Pi/kit-run) y ejecutarlo.
- Tramo 4 (segmento 4): hecho. Comprobación `node --test tests/compaction/launchers.test.mjs` exit 0 (4 pruebas); `bash -n` de adapters/pi/install-launcher.sh y tools/install/kit-run-launcher.sh exit 0. Archivos: adapters/pi/install-launcher.sh, tools/install/kit-run-launcher.sh, tests/compaction/launchers.test.mjs (nuevo). Corrección: la prueba compara la raíz y no el archivo completo, porque el lanzador Pi lleva la ruta temporal de FLUCASTR_MODELOS.
- Tramo 5 (segmento 5): hecho. Comprobación `node --test tests/compaction/settings.test.mjs` exit 0 (18 pruebas); `node --check` de compaction.mjs y resolver.mjs exit 0; `bash -n` de install-compaction.sh exit 0. Archivos: adapters/claude-code/compaction.mjs, adapters/claude-code/install-compaction.sh, scripts/resolver.mjs, tests/compaction/settings.test.mjs (nuevo). La suposición abierta queda resuelta: sin `compact_at` del planner (y sin los del perfil) el resultado es `omitido-umbral`.
- Tramo 6 (segmento 6): hecho. Comprobación `node --test tests/compaction/install.test.mjs` exit 0 (9 pruebas, `$TMPDIR/tramo6-install.txt`); `bash -n` de install.sh y install-compaction.sh exit 0; regresión de `tests/compaction/` exit 0 (42 pruebas). Archivos: adapters/claude-code/install-compaction.sh (`compactacion_claude_en`, `refrescar_compactacion_claude_registrada`), install.sh (recogida antes de uninstall y llamada en el bloque de Claude), tests/compaction/install.test.mjs (nuevo).
- Historia A (tramos 1 a 6) completa. Pendiente para el tramo 10: prueba de `--only pi|codex` sin tocar Claude, prueba de «reinstalar sin cambios deja el HOME igual», paso 22 de `./verify`, y la confirmación de 1b/1c del lanzador Codex. Cosmético: `primera` sin uso en `liberar`. Tramos 7 a 10 no se tocan en esta ejecución.
- Próxima acción: devolver `DONE: plan=/home/franco/Codes/flucastr/Flucastr.AI/changes/ventana-por-agente/plan.md; segment=6; verify=pasa` a través de SubagentHandback (sin correr ./verify; el check del segmento es el de tramo-6.md).

## Avance del builder (esta ejecución, historia B: segmentos 7 y 8, Pi y Codex)

- Tramo 7 (segmento 7): hecho. `node --check adapters/pi/compaction-plan.mjs` exit 0; `node --test tests/compaction/pi.test.mjs` exit 0 (12 pruebas, 0 fallos). Archivos: `adapters/pi/compaction-plan.mjs` (reserva por `compact_reserve`, reemplazo exacto del 172000 con la línea «reemplazado 172000 en <modelo>»), `tests/compaction/pi.test.mjs` (nuevo).
- Tramo 8 (segmento 8): hecho. `node --check` de `tools/run/commands.mjs`, `tools/run/profiles.mjs` y `scripts/kit-run.mjs` exit 0; `node --test tests/compaction/kit-run.test.mjs` exit 0 (7 pruebas, 0 fallos). Archivos: `tools/run/commands.mjs`, `tools/run/profiles.mjs`, `scripts/kit-run.mjs`, `tests/compaction/kit-run.test.mjs` (nuevo).
- Regresión de la historia 2: `node --test tests/compaction/*.test.mjs` exit 0 (70 pruebas, 0 fallos).
- Historia B completa. Parada para la revisión del planner en contexto nuevo (fin de historia). No se ha corrido `./verify` completo (tramo 10), no se ha hecho commit, push ni PR. `segment: 8`, `status: in progress` en `plan.md`.
- Próxima acción (planner): revisar la historia B; después, historia C (segmentos 9 y 10) con el plan reaprobado si corresponde.

## Avance del builder (esta ejecución, historia C: segmentos 9 y 10)

- Inicio: plan `status: in progress`, `segment: 9`. Tramo 9 pendiente.
- Tramo 9 (segmento 9): hecho. `node --check tools/resolver/windows.mjs` y `scripts/resolver.mjs` exit 0; `git diff --check -- README.md scripts/resolver.mjs` exit 0; `node --test tests/compaction/windows.test.mjs` exit 0 (13 pruebas, 0 fallos, 1 s). Archivos: `tools/resolver/windows.mjs` (nuevo), `scripts/resolver.mjs`, `README.md`, `tests/compaction/windows.test.mjs` (nuevo). Mutación del aviso de entorno: 3 fallos, restaurado. Checkpoint en `plan.md` *Notes*; `segment: 10`.
- Próxima acción: tramo 10 (paso 22 en `./verify`; `bash -n ./verify`; `./verify > "$TMPDIR/verify.log" 2>&1`; `tail -n 20`).
- Tramo 10 (segmento 10): hecho. `bash -n ./verify` exit 0; `./verify` exit 0 en 148 s con `tests 83`, `pass 83`, `fail 0`, `VERIFY OK`, `Fingerprint: 83812daf1d3b`. Archivo: `verify` (paso 22 antes de `VERIFY OK`). Pruebas pendientes anotadas en `plan.md` *Notes*, no añadidas.
- Historia C completa; `segment: 10`, `status: done` en `plan.md`. Parada para la revisión del planner (fin de historia 3). Sin commit, push, PR, merge ni instalación real.
- Próxima acción (planner): revisar la historia C y cerrar el plan (archivo en `changes/done/`, commit y PR los hace la persona usuaria con el planner).

## Revisión del planner, historia C (2026-11-25)

- Hecho: revisión de S9–S10: RETURNED (D1–D3 en `plan.md` *Notes*; pasos en `tramo-9.md`, «Correcciones»). `status: approved`, `segment: 9`.
- Pendiente: builder corrige (relanzamiento 1 de 2); después repite S10.
- Próxima acción (planner): al volver el builder, revisar solo el diff de las correcciones y la huella de `./verify`.

## Avance del builder (correcciones D1–D3 y repetición de verify, 2026-11-25)

- Checkpoint tramo 9 (correcciones): archivos `tools/resolver/windows.mjs` (D1: filas `claude-<agente>`, `sesión`, `subagente` y revisor; D2: `modelSettings.<modelo>.autoCompactWindow` por archivo, aviso con modelo y archivo), `tests/compaction/windows.test.mjs` (19 pruebas), `README.md` (D3: tabla de ventanas, regla, celdas bajo margen y precedencia por archivo). Checks: `node --check tools/resolver/windows.mjs` exit 0; `node --test tests/compaction/windows.test.mjs` exit 0, 19 pasan; `git diff --check -- README.md` exit 0.
- Checkpoint tramo 10: `bash -n ./verify` exit 0; `./verify > "$TMPDIR/verify.log" 2>&1` exit 0, `tests 89`, `pass 89`, `fail 0`, `VERIFY OK`, `Fingerprint: f45251bef1d9`.
- Historia 3 (S9–S10) completa; `segment: 10`, `status: done` en `plan.md`. Parada para la revisión del planner en contexto nuevo. Sin commit, push, PR, merge ni instalación real; `changes/reducir-contrato-builder/` no tocado.

## Segunda revisión del planner, historia C (2026-11-25)

- Hecho: RETURNED (E1, E2 y menores en `plan.md` *Notes*; pasos en `tramo-9.md`, «Correcciones (segunda revisión)»). `status: approved`, `segment: 9`.
- Pendiente: builder corrige (relanzamiento 2 de 2) y repite S10. Si sigue defectuoso, el cambio queda `partial`.
- Próxima acción (planner): al volver el builder, revisar solo ese diff y la huella de `./verify`.

## Avance del builder (segunda revisión, relanzamiento 2 de 2, reanudación)

- Inicio: plan `status: approved`, `segment: 9`. Pendientes: E1, menores (windows.mjs), prueba de E1 en windows.test.mjs, E2 (README línea 36), y repetir `./verify` (último TODO de tramo-10).
- Correcciones segunda revisión listas (E1, menores, prueba E1 con 23 pruebas en verde, E2 con grep 0). Checkboxes de tramo-9 marcadas. Pendiente: repetir ./verify (último TODO de tramo-10).
- Cierre del builder (2026-11-25): `./verify > "$TMPDIR/w9/verify.log" 2>&1` exit 0, `tests 93`, `pass 93`, `fail 0`, `VERIFY OK`, `Fingerprint: f9ddc8130afe`. Casilla de tramo-10 marcada; `plan.md` en `status: done`, `segment: 10`. Parada para la revisión del planner; sin commit, push ni PR.

## Revisión final (2026-11-25)

- Hecho: historia 3 APPROVED; las tres historias aprobadas.
- Pendiente: Gate 2 (aprobación de la persona usuaria).
- Próxima acción (planner): tras aprobar, actualizar `AGENTS.md`, mover la carpeta a `changes/done/` y proponer el commit.

## Cierre (2026-11-25)

- Hecho: Gate 2 aprobado; `AGENTS.md` actualizado; carpeta en `changes/done/ventana-por-agente/`.
- Pendiente (persona usuaria): commit, PR a `main` y `bash install.sh`.
