# Inventario del contrato del builder (solo lectura)

Estado: completo (inventario; no incluye propuesta).

Totales (contados sobre las filas de §2):

- Reglas: **82**.
- Duplicadas (Dup = Sí): **51**.
- En una contradicción o tensión: **24** reglas, en 12 casos (C1-C12: 2 directas, 10 tensiones; C13 no cuenta).
- Cubiertas por kit-check, kit-scope, kit-close, puerta.mjs o el hook y reglas deny: **17**, todas solo en parte; **0** completas. Con otros mecanismos (R01, R08, R49, R50, R52, R70, R71): 24.
Siglas: B = `core/agents/builder.md` (43 líneas); S = `core/skills/execute-plan/SKILL.md` (98 líneas).

## 1. Frases exigidas por las pruebas (no se pueden cambiar sin tocar la prueba)

### `tests/builder-contract.mjs`
Sobre B:
- «Respond in the language the user is currently using.» (hay mutación negativa) · «switch whenever they do.» · «Messages emitted by commands remain Spanish.»
- «before starting the next step; do not accumulate checkboxes until the end of the segment»
- «continuity: continuous» · «do not move to another story»
- «checkpoint to *Notes* with files changed» · «Do not commit between segments»
- «fails twice for the same cause» · «more than twice its measured duration»
- «may you also update `segment:`» · «add minor resolved questions to *Decisions*»
- «when using `PAUSED`, set `status: partial`» · «reapproves the plan before resumption»

Sobre S:
- regex «As soon as a step is complete and its check passes, mark `- [x]` … before starting the next step»
- regex «If a step has no explicit check, leave it unchecked … If interrupted or incomplete, leave it unchecked»
- «never edit *Scope* or *Acceptance*»
- «`### Segment N — Story: ...` identifies a self-contained story» · «`A#` criteria, TODO items, and *Handoff*»
- «For older plans, follow their existing steps and acceptance criteria» · «`tramo-<n>.md`»
- «By default, an execution ends when the active segment is complete» · «do not move on to another story»
- «checkpoint to *Notes* with changed files, a diff summary, and the check result; do not commit»
- «`Revisión: por tramo`» · «prior duration is recorded for the exact check in an equivalent environment»
- «timeout <2x-segundos>s <comando>» · «same cause returns, pause»
- «Also pause if work must leave scope or requires a user decision»
- «Record minor in-scope decisions under `Decisions` and continue»
- «a resumable note describing progress, remaining work, and cause»
- «set it to `partial` when pausing» · «For plans without continuity, preserve their existing procedure and content»

Además lee registros reales (`tests/review-plan/fixtures/a2-no-check.json`, `a2-interrupted.json`): paso sin comprobación o interrumpido queda `- [ ]` con una sola nota de una línea.

### `tools/verify/agent-contracts.sh`
- B: las 3 frases de idioma (líneas 53-55) · «1800000» y «session_id» (70-71)
- S: «1800000» y «session_id» (68-69) · «kit-verificado.mjs estado» y «Fingerprint: <12 hex>» (92-93)

### `tests/continuity/protocol.mjs` (no es parte del recorrido sin modelo: usa un lanzador real)
- B: las 3 frases de idioma (líneas 28-30)
- Comportamiento (líneas 158-175): retorno `^DONE:` / `^PAUSED:`, `motivo=verify`, `segment: 2`, nota con «misma causa|dos veces» y «pendiente|falta|retomar», sin checkpoint del tramo 2, y la causa se ejecuta exactamente 2 veces.
- Lee la skill instalada en `~/.agents/skills/execute-plan/SKILL.md`.

### Otras pruebas fuera de las tres pedidas (también exigen texto)
`tools/verify/segment-contract.sh`
- B: «DONE: plan=<path>; segment=<n>; verify=pasa» · «segment: <n>» · «segment=<n>» · «Long output» · «tramo-<n>.md»
- S: «If the plan frontmatter contains `segment: <n>`» · «### Segment N — Story:» · «rerun the same command and compare» · «Resuelto:» · «tramo-<n>.md» · «/compact» · «For long output»

`tools/verify/operating-contract.sh`
- B: «siguiente=» · «no_intentado=» · «Read and follow the `execute-plan` skill» · «status`, `diff`, `branch --show-current`, `rev-parse --verify --quiet`, and `symbolic-ref» · «rereading relevant material after edits or recovery»
- B prohibido: «grep -c '^- \[ \]'» · «no releas lo ya leído» · «Git permitido, solo en las carpetas de `repos:`»
- S: «bash pendientes-plan» · «awk» · «3 runs»

`tools/verify/workflow-contract.sh`
- B: «timeoutMs» (y el agente de Claude resuelto debe traer `timeoutMs:`)
- S: «git status» · «base branch» · «base:»

`tools/verify/verification-contracts.sh` — S: «Comprobación rápida»
`tools/verify/workspace-contracts.sh` — S: «repos:» · «with `<folder>` as the command's working directory»; prohibido «git -C <»
`tools/verify/agent-resolution.sh` — B (frontmatter): línea exacta «skills: execute-plan»
`tests/permissions-contract/structure.test.mjs` — S: «never use `git -C` or `git -c`, which are blocked»
Acoplamiento de formato: `tools/check/cierre.mjs` replica el contador canónico de S; `tools/run/prompts.mjs` nombra «execute-plan».

## 2. Reglas (una fila por regla, ordenadas por el archivo donde nacen)

Criterio: una fila por obligación o prohibición distinta. Dup = Sí si aparece en dos o más lugares, en uno o ambos archivos. Contra = número de la sección 3.
Herr: `P:` = alguna herramienta la impide o la detecta **solo en parte** (una herramienta de IA, un flujo o un caso); `—` = ninguna (ver sección 5).
No son filas: frontmatter de configuración (B5-6) ni las remisiones (S22, S86, S98).

### 2.1 `builder.md` (con sus repeticiones en la skill)

| ID | Regla | Dónde | Dup | Contra | Herr |
|---|---|---|---|---|---|
| R01 | Solo con `status: approved`; si no, parar sin cambios | B3, B17, S12 | Sí | — | P: `kit-run.mjs` L149 |
| R02 | No preguntar ni llamar a otros agentes; si no puede seguir, `PAUSED` | B11, B27 | Sí | C10 | — |
| R03 | Seguir `execute-plan`, única fuente del procedimiento | B4, B11 | Sí | C11 | — |
| R04 | Responder en el idioma de la persona usuaria y cambiar con ella | B13 | No | — | — |
| R05 | Conservar marcadores e identificadores; mensajes de comandos en español | B13 | No | — | — |
| R06 | Leer el plan por tramos; cada `tramo-<n>.md` justo antes de usarlo | B18, S12, S30, S34 | Sí | — | — |
| R07 | Operar solo en las carpetas de `repos:` | B24, S13 | Sí | — | — |
| R08 | Git con la carpeta como directorio de trabajo; nunca `git -C` ni `git -c` | S13 | No | C1 | P: reglas de Codex |
| R09 | Git de lectura limitado a la lista (`status`, `diff`, `branch --show-current`, `rev-parse`, `symbolic-ref`), «con o sin `-C`» | B24 | No | C1 | — |
| R10 | Única escritura Git: `switch -c <rama>` autorizada | B24, S18 | Sí | — | — |
| R11 | Estado `in progress` al empezar | B19, S20 | Sí | — | — |
| R12 | `done` solo con verificación aprobada; `partial` solo con `PAUSED`; ningún otro | B19, S32, S98 | Sí | C12 | P: `cierre.mjs` (kit-close) |
| R13 | No cerrar, no mover a `done/` («do not mark work done») | B3, B19 | Sí | C12 | — |
| R14 | Cambiar código solo dentro de *Scope* | B20, S46, S81 | Sí | — | P: kit-scope (vía puerta) |
| R15 | En el plan editar solo casillas, evidencia, `status`, *Evidence*, *Notes* | B20, S43 | Sí | C5 | — |
| R16 | Excepción de continuidad: además `segment:` y *Decisions* | B20, B23, S32 | Sí | C5 | — |
| R17 | Nunca editar *Scope* ni *Acceptance* | B20, S32, S43 | Sí | — | P: kit-scope (solo si el plan existe en la base) |
| R18 | Con `segment: <n>`, ejecutar ese tramo | B18, S28, S34 | Sí | — | — |
| R19 | Seguir el *Handoff* y solo los TODO de la historia | B18, S28 | Sí | — | — |
| R20 | Comprobar cada criterio `A#` referenciado | B18, S28 | Sí | — | P: kit-check |
| R21 | Respetar dependencias; si faltan, parar y anotar dónde retomar | B18, S28 | Sí | C2 | — |
| R22 | Planes antiguos: seguir y preservar sus pasos y aceptación | B18, B20, S28, S32 | Sí | — | — |
| R23 | Sin continuidad, solo el tramo activo y terminar | B18, S30, S34 | Sí | — | — |
| R24 | Con continuidad aprobada, solo tramos aprobados de la misma historia | B18, B22, S30 | Sí | — | — |
| R25 | Punto de control por tramo (archivos, resumen del diff, comprobación) | B22, S30, S34 | Sí | C8 | — |
| R26 | No hacer commit entre tramos | B22, S30 | Sí | — | P: hook y deny |
| R27 | Al terminar la historia, parar para revisión en contexto nuevo | B22, S30, S34 | Sí | — | — |
| R28 | `Revisión: por tramo`: esperar esa revisión | B22, S30 | Sí | — | — |
| R29 | Avanzar solo si pasa, sigue en *Scope* y no falta decisión; si no, pausar | B22, B23, S32 | Sí | — | — |
| R30 | Al avanzar, actualizar `segment:` y mantener `in progress` | B23, S32 | Sí | — | — |
| R31 | Sin duración previa válida de la comprobación, pausar antes de ejecutarla | B23, S32 | Sí | C2 | — |
| R32 | Límite del doble de la duración; si vence, casilla pendiente y pausa | B23, S32 | Sí | C2 | — |
| R33 | Continuidad: la misma causa falla dos veces → pausa | B23, S32 | Sí | C3 | — |
| R34 | Pausa de continuidad: nota retomable, `partial`; el planner reaprueba | B23, S32 | Sí | — | P: `cierre.mjs` (`partial` y *Notes*) |
| R35 | Anotar decisiones menores (*Decisions* o *Notes*) | B22, S32, S97 | Sí | C9 | — |
| R36 | Marcar `[x]` y anotar evidencia apenas se comprueba, antes del paso siguiente | B21, S43, S68, S93 | Sí | — | P: `cierre.mjs` (evidencia, no inmediatez) |
| R37 | Paso sin comprobación: pendiente y nota; no inventarla | B21, S44 | Sí | — | P: `cierre.mjs` |
| R38 | Incompleto o interrumpido: pendiente y dónde retomar | B21, S44, S76 | Sí | — | P: `cierre.mjs` |
| R39 | No marcar un paso cuya comprobación falló | B23, S43 | Sí | — | P: `cierre.mjs` (solo avisa) |
| R40 | **No commit, push, PR ni merge** | B3, B24 | Sí | — | P: hook y deny (Claude), reglas (Codex) |
| R41 | **No desplegar** | B24 | No | — | P: hook (`deploy`, `deployment`) |
| R42 | **No leer ni imprimir `.env`, llaves ni credenciales** (`.env.example` sí) | B26 | No | (C13) | P: hook, deny y sandbox (Claude) |
| R43 | `progress.jsonl`: solo anexar con `kit-nota`; no tocar `progress-resumen.md` | B25 | No | — | — |
| R44 | Leer por trozos (`offset`, `limit`) | B28 | No | — | — |
| R45 | Releer tras editar o recuperarse está permitido | B28 | No | C4 | — |
| R46 | Editar archivos con `edit` | B28 | No | — | — |
| R47 | Salida larga: solo cola y errores | B29, S47 | Sí | — | — |
| R48 | Esperar comandos largos con una llamada (receta por herramienta) | B30, S48 | Sí | — | — |
| R49 | Nunca sondear (`sleep`, `tail`, bucles) | B30, S48 | Sí | — | P: `pegado.mjs` (`kit run`, solo observa) |
| R50 | Formato de la línea `DONE`/`PAUSED`; sin `segment=` si no hay tramo | B34-39, S86, S98 | Sí | — | P: `kit-run.mjs` L235-240 (solo prefijo) |
| R51 | `DONE`: máximo 5 líneas; `PAUSED`: problema y 2-3 opciones, una recomendada | B41 | No | — | — |
| R52 | Terminar solo con `DONE`/`PAUSED`; si queda trabajo en *Scope*, seguir | B43, S77 | Sí | C6 | P: `kit-run.mjs` L240 |

### 2.2 `execute-plan/SKILL.md` (reglas que no nacen en `builder.md`)

| ID | Regla | Dónde | Dup | Contra | Herr |
|---|---|---|---|---|---|
| R53 | Carpeta sin `.git`: anotar y seguir | S14 | No | — | — |
| R54 | Ya en la rama pedida: seguir | S15 | No | — | — |
| R55 | La rama ya existe: `PAUSED access` | S16 | No | — | — |
| R56 | Base correcta y sin cambios fuera de `changes/<name>/`; si no, `PAUSED access` | S17 | No | — | — |
| R57 | Falta `repos:`: `PAUSED ambiguous` | S19 | No | — | — |
| R58 | `type: docs`: solo `*.md` o `docs/`; si no, `PAUSED scope` | S24 | No | — | — |
| R59 | Pasos en orden | S38 | No | — | — |
| R60 | Agrupar lecturas y leer cada archivo una vez | S40 | No | C4 | — |
| R61 | Capturar estado inicial, cambiar, repetir y comparar | S41 | No | — | — |
| R62 | Cambio mínimo sin omitir, diferir ni simplificar lo pedido | S41 | No | — | — |
| R63 | `Comprobación rápida` tras cada unidad; si no hay, `verify` | S42 | No | C7 | — |
| R64 | `verify` con Docker reservado a la final y a `Segment verification:` | S42 | No | C7 | — |
| R65 | Usar `Segment verification:`; en el último tramo también *Verification* completa | S34, S42 | Sí | — | — |
| R66 | Contar pendientes con `pendientes-plan`; error de lectura no es 0 | S45, S51-62 | Sí | — | P: `cierre.mjs` |
| R67 | Corregir problemas relacionados dentro de *Scope* y anotarlos | B3, S46, S97 | Sí | — | — |
| R68 | Navegador o contenedor: un script fijo del repo; no encadenar `docker run` | S49 | No | — | — |
| R69 | Ejecutar *Verification* exactamente como está escrita antes de marcar su paso | S66, S93 | Sí | — | P: `cierre.mjs` |
| R70 | No repetir una suite idéntica sin cambio o diagnóstico nuevo | S66, S69 | Sí | — | P: `kit-verificado` (informa) |
| R71 | Antes de relanzar, `kit-verificado estado` (3 no relanzar, 0 no repetir) | S69 | No | — | P: `kit-verificado` (informa) |
| R72 | Anotar `Fingerprint:` junto a cada comando en *Evidence* | S70 | No | — | — |
| R73 | Fallo (también de test ajeno): causa raíz, corregir en *Scope*, repetir | S69, S78 | Sí | — | — |
| R74 | Máximo 3 corridas finales; misma causa tras 2 arreglos → `PAUSED verify` | S66, S71, S84 | Sí | C3 | — |
| R75 | Terminar solo con aceptación cumplida, verificación aprobada y sin pendientes | B43, S72 | Sí | — | P: puerta y `cierre.mjs` |
| R76 | Evidencia real: `$ comando`, cola de hasta 1,5 KB y `exit N` | B3, S93 | Sí | — | P: `cierre.mjs` (formato, no veracidad) |
| R77 | Aviso de corte: guardar avance; no `DONE`; queda `in progress` | S76 | No | C6 | — |
| R78 | Pausar **solo** por `ambiguous`, `design`, `scope`, `access` o `verify` | B37, S79-84 | Sí | C2 | — |
| R79 | Antes de pausar por `ambiguous` o `access`, buscar `Resuelto:` | S85 | No | C9 | — |
| R80 | `kit-nota blocked` una vez antes de retornar por un bloqueo | S87 | No | — | — |
| R81 | `kit-nota doing` solo con aprobación de la persona usuaria | S87 | No | C10 | — |
| R82 | No adivinar: pausar y dejar intacto lo hecho | S89 | No | — | — |

## 3. Contradicciones y tensiones

| N | Tipo | Detalle | Reglas |
|---|---|---|---|
| C1 | Directa | B24 permite leer Git «with or without `-C`»; S13 lo prohíbe y Codex lo bloquea. La frase de S13 la exigen dos pruebas | R08, R09 |
| C2 | Tensión | S79 «pausar solo en estos casos», pero duración ausente o vencida y dependencia incompleta mandan parar y no encajan en ningún motivo | R78, R21, R31, R32 |
| C3 | Tensión | Continuidad pausa a la 2.ª falla por la misma causa (S32, B23); S71 admite 3 corridas. No dice cuál manda | R33, R74 |
| C4 | Directa | S40 «leer cada archivo una vez»; B28 permite releer | R45, R60 |
| C5 | Tensión | S43 da una lista cerrada de campos editables sin excepción; B20 y S32 agregan `segment:` y *Decisions* | R15, R16 |
| C6 | Tensión | S76: la interrupción queda `in progress` sin `PAUSED`; B43 y S77: terminar solo con `DONE`/`PAUSED` | R52, R77 |
| C7 | Tensión | S42: «si no hay rápida, `verify`» y a la vez reserva el `verify` con Docker | R63, R64 |
| C8 | Tensión | S34 pide punto de control al cerrar cada tramo; B22 y S30 solo en continuidad | R25 |
| C9 | Tensión | Decisiones menores en *Decisions* (S32) o en *Notes* (S97); `Resuelto:` se busca en *Decisions already taken* | R35, R79 |
| C10 | Tensión | S87 pide aprobación para `doing`; B27 prohíbe preguntar | R02, R81 |
| C11 | Tensión | B11 «única fuente», pero B18-B30 repiten el procedimiento (origen de C1 y C4) | R03 |
| C12 | Tensión | La descripción (B3) dice «do not mark work done»; B19 manda poner `done` | R12, R13 |
| C13 | Texto contra herramienta (no cuenta en las cifras) | B26 permite `.env.example`; el hook, las reglas deny y el sandbox usan patrones que también lo alcanzan (`alcance.mjs` sí lo excluye) | R42 |

## 4. `docs/investigaciones/fiabilidad-constructor.md` (solo L99-109, L160-162 y grep)

- L10 y L37: hay instrucciones incompatibles sobre cuándo pausar, qué verificar y qué Git leer; conviene resolver contradicciones y duplicación antes que agregar reglas.
- L99-108 describe archivos de la v1. Hoy: el Git de lectura ya está listado (B24) pero queda C1; «no releas» se corrigió en B28 y queda C4; interrupción frente a término se trata en S76 y queda C6; pausa y verificación siguen con C2, C3 y C7; el procedimiento duplicado sigue (C11).
- L108: las contradicciones existen en los archivos; no está probado que causaran detenciones.
- L160 (Prioridad 2): una sola fuente de procedimiento, sin contradicciones sobre pausa, lectura, Git y verificación; distinguir avance, bloqueo, interrupción y entrega; conservar las restricciones de seguridad.

## 5. Cobertura por herramientas (límites)

Ninguna regla queda garantizada en las tres herramientas de IA y en todos los flujos: **«P» no autoriza a quitar la regla del texto.**

- `puerta.mjs` (kit-check, kit-scope, kit-close) corre solo en `kit run`; con exit 2 o 3 pasa al revisor. Como subagente o en ventana propia depende de que alguien los ejecute.
- kit-scope: compara solo las carpetas de `repos:`, exime `changes/<name>/` y protege *Scope* y líneas `A#` solo si el plan tiene versión previa en la base (un plan nuevo da «no verificable»). Prohíbe secretos y lockfiles no autorizados.
- kit-check: ejecuta los `A#` automatizables; las acciones protegidas salen bloqueadas.
- kit-close: casillas, bloque de evidencia, `A#` con corrida y estado. No comprueba veracidad, fingerprint, inmediatez ni la línea de retorno.
- Hook de Claude (`permissions-hook.mjs`): solo Bash; niega commit, push, merge, `gh pr create|merge`, secretos, borrado fuera de temporales y palabras de despliegue. No decide sobre `reset`, `checkout`, `add`, `stash` ni `switch`.
- Reglas deny y sandbox de Claude: commit, push, merge, `bash -c`, lectura de secretos; sin regla de despliegue. Codex: commit, push, merge, `git -C/-c`, `bash -c`; sin regla de `.env`. Pi: sin equivalente.
- kit-nota solo anexa, pero nada impide editar `progress.jsonl` por otra vía.

