---
status: done
branch: feature/hook-parser
base: main
repos: [.]
executor: builder
segment: 4
continuity: continuous
type: code
---
# Hook de permisos que mira la estructura del comando

## Goal
El hook deja de bloquear texto inerte que solo menciona acciones protegidas y pasa a detectar las que hoy se cuelan.

## Exploration
- Solo decide `scripts/permissions-hook.mjs`: `accionProtegida` (l. 119) parte el texto por espacios; `decidir` (l. 244) responde `allow`, `deny` o nada. `adapters/claude-code/hook.mjs` instala el hook validador y `deny.mjs` las reglas deny: fuera de alcance.
- Reproducido solo con la función (`node changes/hook-parser/casos.mjs`): 97 casos en [tabla.md](tabla.md). Falsos positivos: P1–P10, C1–C9. Se cuelan hoy: E5–E10, E12–E17, `$(...)`, backticks, operadores pegados y formas ofuscadas.
- `accionProtegida` también la usa `tools/check/ejecutar.mjs`: no cambia.
- `tests/permissions-contract/hook.test.mjs`: 6/6; `./verify` no la ejecuta.
- Respuestas de la persona: sin bloqueo solo hacia `.md`, `.txt`, `.log`; `rm` como hoy; el hook evalúa el contenido de `bash`/`sh`/`zsh -c` (las reglas deny no cambian y siguen bloqueando `bash -c ls`); `git -C/-c` se bloquea con commit, push, merge o `-c alias.*`.

## Evaluation
- Parser (npm y PyPI, 2026-11-26): `shfmt` no está instalado; `bashlex` es Python, GPLv3+, de 2023; `mvdan-sh` está obsoleto; `sh-syntax` pesa 4,4 MB; `web-tree-sitter` más `tree-sitter-bash` ~25 MB e instalación con `node-gyp-build`. El kit no tiene `package.json` y el hook corre desde su carpeta. Recomendado: tokenizador propio, sin dependencias.
- Costo: un parser propio puede equivocarse. Se compensa: la regla textual actual sigue entera y solo se levanta si **toda** la línea es demostrablemente inerte; lo no soportado pregunta o bloquea.
- Riesgo operativo: el hook está activo en este repo y en todo proyecto que apunte al kit. Se conecta al final, con sus pruebas en verde.

## Assumptions
- `cd`, comentarios, asignaciones, estructuras compuestas y sustituciones impiden levantar un bloqueo (C5, C6).
- Límites que siguen igual y se documentan: script escrito antes y ejecutado después; destino que es un enlace simbólico; ruta ofuscada que llega a un shell por tubería; código dentro de otros intérpretes; `npm run deploy:prod` y `docker push` no cuentan como despliegue; `ls && rm -rf build` pasa; Pi y Codex no usan este hook.
- No comprobado: si las reglas deny de Claude Code bloquean además una línea de heredoc que empiece por un comando protegido.

## Decisions already taken
- Executor: builder, because it is not small (security) and has several segments.
- Cero reducción: solo P1–P9 pasan de `deny` a `normal`.

## Decisions
- `scripts/hook-shell.mjs` analiza; `scripts/hook-decidir.mjs` decide; `permissions-hook.mjs` solo conecta.
- Prioridad: `deny` > `ask` > sin decisión. Un fallo interno nunca queda sin decisión.
- (Segmento 2, menor) Si `textual` lanza, `evaluar` devuelve `deny` (no se sabe si la línea es textual).
- (Segmento 2, menor) Redirección inerte: una ruta absoluta (salvo `/dev/null`) no es inerte; el texto del plan no lo decía y se toma la forma más estricta.
- (Segmento 2, menor) `rg` aplica a sus rutas la regla de segmentos con punto tal cual; por eso `rg x .` no es inerte.
- (Segmento 2, menor) Solo la primera palabra cuenta como programa para `gh`, `bash`/`sh`/`zsh` y `eval`; `git` se mira en cualquier palabra, como pide el plan.
- (Revisión 2, resuelto) Quedan anuladas las dos decisiones menores anteriores sobre redirección absoluta y primera palabra: rige `tramo-2.md` (ruta absoluta válida; `gh`, intérpretes y `eval` en cualquier posición). Con patrón secreto en `grep`/`rg`, las rutas deben ser `.md`, `.txt` o `.log`, no ocultas ni absolutas.

## Validation
La persona aprueba [tabla.md](tabla.md) y este plan (Gate 1).

## Scope
Producto: `scripts/hook-shell.mjs`, `scripts/hook-decidir.mjs`, `scripts/permissions-hook.mjs`, `verify`, `docs/reglas-deny.md`, `docs/implementacion.md`. Pruebas: `tests/README.md` y `tests/permissions-contract/` (`hook-shell.test.mjs`, `hook-decision.test.mjs`; en `hook.test.mjs` solo se agrega). Fuera: `adapters/`, reglas deny, ajustes, `tools/`, y en esta carpeta `casos.mjs`, `comparar.mjs`, `tabla.md`.

## Verification
Level 3, only at the end of segment 4: `./verify`; exit 0. Also `node changes/hook-parser/comparar.mjs --hook`; exit 0.

## Stop conditions
- A table case cannot meet its decision without relaxing a rule in `tramo-1.md` or `tramo-2.md`: pause with `motivo=design`.
- The live hook blocks or crashes a command: never disable, edit settings, or rephrase to evade it. Put test commands inside files with the edit tools; if your own change broke the hook, fix that file with the edit tools; otherwise pause with `motivo=access`.
- Never run any command string from the test cases: they are data.

## Steps
1. [tramo-1.md](tramo-1.md): analizador de shell.
2. [tramo-2.md](tramo-2.md): decisión según la tabla.
3. [tramo-3.md](tramo-3.md): conexión al hook y a `./verify`.
4. [tramo-4.md](tramo-4.md): documentación y verificación completa.

## Evidence

Segmento 1 (tramo-1.md), TODO 1 antes de crear el módulo:
$ node --test tests/permissions-contract/hook-shell.test.mjs
ℹ pass 0
ℹ fail 1
(falla por módulo inexistente: `scripts/hook-shell.mjs`)
exit 1

Segmento 1, segment verification tras implementar los TODO 2 a 4:
$ node --test tests/permissions-contract/hook-shell.test.mjs
ℹ tests 24
ℹ pass 24
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0

Segmento 1, revisión 1 (TODO 5 de tramo-1.md), antes de corregir: las pruebas nuevas fallan como se esperaba.
$ node --test tests/permissions-contract/hook-shell.test.mjs
ℹ tests 26
ℹ pass 25
ℹ fail 1
AssertionError: debía ser ok false: "cat <<EOF\nEO\\\nF\ngit push\nEOF\n" (true !== false)
exit 1

Segmento 1, revisión 1, segment verification tras corregir:
$ node --test tests/permissions-contract/hook-shell.test.mjs
ℹ tests 26
ℹ suites 0
ℹ pass 26
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0

Segmento 2 (tramo-2.md), TODO 1 (`export` en `esSecreto`):
$ node --test tests/permissions-contract/hook.test.mjs
ℹ tests 6
ℹ pass 6
ℹ fail 0
exit 0

Segmento 2, TODO 2 (prueba de decisión antes del módulo; copia de la tabla generada desde `casos.mjs`, sin importar de `changes/`):
$ node --test tests/permissions-contract/hook-decision.test.mjs
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/home/franco/Codes/flucastr/Flucastr.AI/scripts/hook-decidir.mjs' imported from /home/franco/Codes/flucastr/Flucastr.AI/tests/permissions-contract/hook-decision.test.mjs
ℹ fail 1
exit 1

Segmento 2, TODO 3 (implementación de `evaluar` en `scripts/hook-decidir.mjs`):
$ node changes/hook-parser/comparar.mjs
tabla: 97/97
dejan de bloquearse: P1 P2 P3 P4 P5 P6 P7 P8 P9
exit 0

Segmento 2, TODO 4 y segment verification (`node --test tests/permissions-contract/hook-decision.test.mjs && node changes/hook-parser/comparar.mjs`, A3, A4, A5):
$ node --test tests/permissions-contract/hook-decision.test.mjs && node changes/hook-parser/comparar.mjs
✔ A3: cada caso de la tabla recibe la decisión aprobada
✔ A3: solo P1–P9 dejan de bloquearse frente a la regla textual actual
✔ A3: un comando sin acción protegida y sin nada peligroso sigue normal
✔ A4: cada acción protegida se deniega sola y encadenada, sustituida o agrupada
✔ A5: un análisis fallido nunca da normal
✔ A5: si textual lanza, la decisión no es normal
✔ A5: si secreto lanza, la decisión no es normal
ℹ tests 7
ℹ pass 7
ℹ fail 0
tabla: 97/97
dejan de bloquearse: P1 P2 P3 P4 P5 P6 P7 P8 P9
exit 0

Segmento 2, revisión 2 (tramo-2.md, TODO 5: casos devueltos como pruebas A3/A4), tras corregir `scripts/hook-decidir.mjs`:
$ node --test tests/permissions-contract/hook-decision.test.mjs
ℹ tests 22
ℹ pass 22
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
exit 0

Segmento 2, revisión 2, segment verification (`node --test tests/permissions-contract/hook-decision.test.mjs && node changes/hook-parser/comparar.mjs`, A3, A4, A5):
$ node --test tests/permissions-contract/hook-decision.test.mjs && node changes/hook-parser/comparar.mjs
ℹ tests 22
ℹ pass 22
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
tabla: 97/97
dejan de bloquearse: P1 P2 P3 P4 P5 P6 P7 P8 P9
exit 0

Segmento 2, revisión 2, regresión de las pruebas de permisos (hook-decision, hook-shell, hook):
$ node --test tests/permissions-contract/hook-decision.test.mjs tests/permissions-contract/hook-shell.test.mjs tests/permissions-contract/hook.test.mjs
ℹ tests 54
ℹ pass 54
ℹ fail 0
exit 0

Segmento 3 (tramo-3.md), TODO 1 (casos de proceso real antes de conectar; se espera que fallen los nuevos):
$ node --test tests/permissions-contract/hook.test.mjs
ℹ tests 7
ℹ pass 6
ℹ fail 1
AssertionError: cat > notas.md <<'EOF' / git push / EOF — 'deny' !== 'normal' (caso nuevo; los 6 anteriores pasan)
exit 1

Segmento 3, TODO 2 (conexión de `evaluar` en `scripts/permissions-hook.mjs`; el hook vivo sigue activo, y esta misma sesión ejecuta Bash con la nueva decisión):
$ node --test tests/permissions-contract/hook.test.mjs
ℹ tests 7
ℹ pass 7
ℹ fail 0
exit 0

Segmento 3, TODO 3 (paso 25 en `./verify`):
$ bash -n ./verify
exit 0

Segmento 3, segment verification (`node --test tests/permissions-contract/hook*.test.mjs && node changes/hook-parser/comparar.mjs --hook`, A6):
$ node --test tests/permissions-contract/hook*.test.mjs && node changes/hook-parser/comparar.mjs --hook
ℹ tests 55
ℹ suites 0
ℹ pass 55
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
tabla: 97/97
dejan de bloquearse: P1 P2 P3 P4 P5 P6 P7 P8 P9
exit 0

Segmento 4 (tramo-4.md), TODO 1 a 3 (documentos):
$ grep -c "inert" docs/reglas-deny.md
1
exit 0
$ grep -c "hook-decidir" docs/implementacion.md
1
exit 0
$ grep -c "hook-decision" tests/README.md
1
exit 0

Segmento 4, segment verification (`grep -q "hook-decision" tests/README.md && grep -q "hook-decidir" docs/implementacion.md`, A7):
$ grep -q "hook-decision" tests/README.md && grep -q "hook-decidir" docs/implementacion.md && echo SEGMENT_CHECK_OK
SEGMENT_CHECK_OK
exit 0

Segmento 4, TODO 4 (verificación final, nivel 3; límite 2× la duración previa ≈3 min de `escalera-recuperacion` y medido 128 s en `higiene-verify`: `timeout 360s`):
$ timeout 360s ./verify
verify: 35 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 90a91b183b14
VERIFY OK
Duración medida: 180 s (dentro del límite de 360 s).
exit 0

Segmento 4, check adicional de la verificación de `plan.md`:
$ node changes/hook-parser/comparar.mjs --hook
tabla: 97/97
dejan de bloquearse: P1 P2 P3 P4 P5 P6 P7 P8 P9
exit 0

Segmento 4, revisión 3 (tramo-4.md, TODO 5: documentos corregidos; `rm` fuera de la frase de encadenados y `allow` restituido en `docs/reglas-deny.md`; `rm` solo como primer comando en `docs/implementacion.md`), `./verify` tras corregir:
$ timeout 360s ./verify
verify: 35 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 94947fb423e1
VERIFY OK
exit 0
$ node changes/hook-parser/comparar.mjs --hook
tabla: 97/97
dejan de bloquearse: P1 P2 P3 P4 P5 P6 P7 P8 P9
exit 0

## Notes

Checkpoint segmento 1, revisión 1 (devolución del planner, defecto de `ok: true` con `git push` oculto):
- Archivos cambiados: `scripts/hook-shell.mjs` y `tests/permissions-contract/hook-shell.test.mjs`. Ningún otro archivo tocado.
- Diff resumen: (a) `continuaLinea`: una barra y salto de línea solo une si el carácter anterior es blanco; en cualquier otro caso `ok: false` (saltarBlancos, saltarEspacios, leer, comillas dobles). (b) Heredoc sin comillas: una línea que acaba en barra → `ok: false`; el heredoc citado conserva el cuerpo. (c) `$[` fuera de comillas simples o heredoc citado → `ok: false`. (d) Palabra en posición de comando o asignación con forma `nombre[` → `ok: false` (regla `SUBINDICE`).
- Pruebas: los 10 casos devueltos y 3 de guarda de la misma regla (`echo a\⏎b`, `echo $[1]` y `a[1]=3`) van en una sola prueba que recorre cada caso con su mensaje; la prueba de heredoc citado con barra va aparte.
- Check: `node --test tests/permissions-contract/hook-shell.test.mjs`, exit 0, 26/26. Pendientes en `tramo-1.md`: 0.
- El segmento 1 es una historia completa: no continúo con el segmento 2 (otra historia). Lo dejo para la revisión del planner en contexto nuevo.
- Incidente anterior, sin cambios: una línea de `progress.jsonl` (`doing` sin aprobación) quedó escrita antes; no se borró.

Checkpoint segmento 1 (historia: el hook distingue comandos de texto):
- Archivos nuevos: `scripts/hook-shell.mjs` (analizador sin dependencias, `analizar(texto)`) y `tests/permissions-contract/hook-shell.test.mjs` (24 pruebas de A1 y A2). Ningún archivo existente cambió; `git status` muestra solo `??` en esos dos archivos y en `changes/hook-parser/`.
- Check: `node --test tests/permissions-contract/hook-shell.test.mjs`, exit 0, 24/24.
- La historia del segmento 1 está completa. El segmento 2 es otra historia: no continúo y lo dejo para la revisión del planner en contexto nuevo.
- Incidente: ejecuté por error `node scripts/kit-nota.mjs ... doing "segmento 1 tramo 1 completado"`. No hay bloqueo ni aprobación de la persona para `doing`, así que la línea de `changes/hook-parser/progress.jsonl` no debía existir. El archivo es append-only y no la borré; el planner debe tenerla en cuenta al leer el progreso.
- Pendientes en `tramo-1.md`: 0.

### Revisión 1 (planner): RETURNED
Devuelto: defecto — tramo 1 — `scripts/hook-shell.mjs` (`leerCuerpos` l. 658, `expansionDolar` l. 490, `simple` l. 245), A1 y A2: `ok: true` y `plano: true` ocultando un `git push` que bash sí ejecuta. `⏎` es salto de línea:
- `cat <<EOF⏎EO\⏎F⏎git push⏎EOF` y la forma `<<-` con tabuladores (bash une las líneas y cierra el heredoc).
- `cat <<\⏎-A⏎x⏎A⏎git push⏎-A` (continuación dentro del operador).
- `echo "$\⏎(git push)"` y `cat <<A >a.md⏎$\⏎(git push)⏎A`.
- `echo $[1<<2]⏎git push⏎2]` y `echo $[ x<<E ]⏎git push⏎E`.
- `a[1<<2]=3⏎git push⏎2]=3`, `a[ 1 << 2 ]=3⏎git push⏎2`, `X=1 a[1<<2]=3⏎git push⏎2]=3`.

Se espera `ok: false` en todos (regla nueva en `tramo-1.md`, líneas de `#` y `ok: false`). Sigue válido: continuación precedida de espacio o tabulador. El hueco venía en parte del contrato del planner, que no precisaba estos casos.

Checkpoint segmento 2 (historia: la decisión sigue la tabla aprobada):
- Archivos cambiados: `scripts/hook-decidir.mjs` (nuevo: `evaluar(comando, { textual, secreto })`, sin importar `permissions-hook.mjs`); `scripts/permissions-hook.mjs` (solo `export` en `esSecreto`); `tests/permissions-contract/hook-decision.test.mjs` (nuevo: 97 casos copiados de `casos.mjs` con sus valores esperados, más A4 y A5). La copia de la tabla se generó con un script temporal fuera del repo. Ningún otro archivo cambió; `decidir` del hook en vivo sigue igual y `adapters/` no se tocó.
- Diff resumen: una función exportada; módulo nuevo con evaluación por nodo (redirecciones, asignaciones, nombres inertes, `git`, `gh`, intérpretes con `-c` y heredocs, `eval`), línea inerte y tratamiento de fallos (`deny` si textual, si no `ask`).
- Checks: `node --test tests/permissions-contract/hook.test.mjs`, 6/6, exit 0; segment verification `node --test tests/permissions-contract/hook-decision.test.mjs && node changes/hook-parser/comparar.mjs`, 7/7 y `tabla: 97/97`, exit 0.
- La historia del segmento 2 está completa. El segmento 3 es otra historia (conexión al hook): no continúo; queda para la revisión del planner en contexto nuevo. `segment:` queda en 2.
- Pendientes en `tramo-2.md`: 0.
- Observación: `git status` muestra archivos sin rastrear en la raíz del repo (`.bashrc`, `.gitconfig`, `.vscode`, `.idea`, etc.) que no creé ni toqué; no se han incluido en ningún cambio.

### Revisión 2 (planner): RETURNED
Devuelto: defecto — tramo 2 — `scripts/hook-decidir.mjs` (`lineaInerte` l. 151, `rutaEscribible` l. 186, `evaluarNodo` l. 66–69), A3 y A4. Casos y decisión esperada, con `accionProtegida` y `esSecreto` reales:
- `deny` (hoy quedan sin bloqueo): `grep ".env" .`, `grep ".env"`, `grep -c ".env" config`, `rg ".env" docs`, `grep -c "git push" .`.
- `deny`: `env bash -c 'g\it push'`, `find . -exec sh -c '/usr/bin/git push' \;`, `command eval "/usr/bin/git push"`, `bash -o pipefail -c '/usr/bin/git push'`, `sudo /usr/bin/gh pr create`.
- `ask`: `timeout 5 sh -c "$cmd"`, `bash -O extglob -c "$cmd"`.
- `normal` (la ruta absoluta es válida según el contrato; la decisión menor del segmento 2 queda anulada): `echo "git push" > /home/u/p/notas.md`. Siguen `deny` las absolutas con segmento oculto o sin esas extensiones.

La tabla aprobada no cambia. Los dos primeros grupos vienen en parte del contrato del planner; `tramo-2.md` quedó precisado.

Checkpoint segmento 2, revisión 2 (historia: la decisión sigue la tabla aprobada; devolución corregida):
- Archivos cambiados: `scripts/hook-decidir.mjs` y `tests/permissions-contract/hook-decision.test.mjs` (15 pruebas nuevas al final, `A3/A4 devuelto:`, con los valores de la revisión 2). `changes/hook-parser/tramo-2.md` (TODO 5 marcado). Este `plan.md` (estado, Evidence, Decisions, Notes). Ningún otro archivo del repo cambió; `permissions-hook.mjs` sigue solo con el `export`.
- Diff resumen: (a) `evaluarNodo` mira `git`, `gh`, intérpretes y `eval` en cualquier posición; heredocs y `<<<` se evalúan si el nodo tiene un intérprete. (b) `reglaInterprete(palabras, k)`: una opción corta con `o`/`O` consume su valor; con `-c` evalúa el script (`timeout 5 sh -c "$cmd"` y `bash -O extglob -c "$cmd"` dan `ask`). (c) `evaluarInerte`: con patrón secreto en `grep`/`rg`, las rutas deben existir y terminar en `.md`, `.txt` o `.log`, sin ser ocultas ni absolutas. (d) `lineaInerte`: `grep` y `rg` revisan rutas dudosas (absolutas, `~`, segmentos con punto); `rg` exige al menos una ruta. (e) `rutaEscribible` acepta rutas absolutas; `~` no.
- Checks: segment verification, exit 0; 22/22 y `tabla: 97/97`. Regresión de permisos, exit 0; 54/54.
- Incidente: un comando de prueba con acciones protegidas en un heredoc fue bloqueado por el hook en vivo (PreToolUse). No se tocaron ajustes ni el hook: el contenido se pasó a archivos en la carpeta temporal de la sesión, fuera del repo, y se ejecutaron solo esos archivos, como indica *Stop conditions*. El bloqueo no vino de un cambio mío (el hook vivo no cambió salvo el `export`).
- La historia del segmento 2 está completa. El segmento 3 es otra historia (conexión al hook): no continúo; queda para la revisión del planner en contexto nuevo. `segment:` queda en 2; `status: done` según el estado de verificación del segmento.
- Pendientes en `tramo-2.md`: 0.

Checkpoint segmento 3 (historia: el hook real aplica la nueva decisión):
- Archivos cambiados: `scripts/permissions-hook.mjs` (importa `evaluar` de `hook-decidir.mjs`; nueva `decisionAnalizada(cmd)` con el respaldo del contrato; `decidir` mapea `deny`, `ask` y `normal`; `comandoSeguro` sigue primero), `tests/permissions-contract/hook.test.mjs` (una prueba nueva al final; las 6 anteriores sin cambios), `verify` (paso 25 antes de `VERIFY OK`), `changes/hook-parser/tramo-3.md` (TODO marcados) y este `plan.md`.
- Diff resumen: la conexión del hook vivo; la decisión de `comandoSeguro` no cambia; `esSecreto` y `accionProtegida` se usan igual.
- Checks: segment verification, exit 0; 55/55 en las tres suites de hook y `tabla: 97/97`. `bash -n ./verify`, exit 0. El paso 25 corre en la verificación completa del segmento 4 (nivel 3).
- Incidente: ninguno. El hook vivo no bloqueó ninguna orden de esta corrida.
- La historia del segmento 3 está completa. El segmento 4 es otra historia (documentación y verificación completa): no continúo; queda para la revisión del planner en contexto nuevo. `segment:` queda en 3; `status: done` según el estado de verificación del segmento.
- Pendientes en `tramo-3.md`: 0.

Checkpoint segmento 4 (historia: el comportamiento y sus límites quedan documentados; última historia del plan):
- Archivos cambiados: `docs/reglas-deny.md` (dos viñetas del hook reescritas, más viñetas de límites y de lo sin comprobar), `docs/implementacion.md` (frase del hook en la viñeta de Claude Code y pruebas del hook en la descripción de `./verify`), `tests/README.md` (dos suites nuevas en la fila de permisos). Ningún otro archivo del producto cambió. `tramo-4.md` (TODO marcados) y este `plan.md`.
- Diff resumen: solo texto en español; cada afirmación nueva corresponde a un caso de la tabla o a un límite de *Assumptions*.
- Checks: segment verification, exit 0 (`SEGMENT_CHECK_OK`). `./verify` nivel 3, exit 0, `VERIFY OK`, `Fingerprint: 90a91b183b14`, 180 s. `node changes/hook-parser/comparar.mjs --hook`, exit 0, `tabla: 97/97`.
- Estado: `status: done`. No hay commit: lo hace la persona usuaria. `segment:` queda en 4.
- Pendientes en `tramo-4.md`: 0.
- Observación: `git status` muestra archivos sin rastrear en la raíz (`.bashrc`, `.gitconfig`, `.idea`, `.vscode`, etc.) que no se tocaron; no están en el cambio.

### Veredicto (planner): RETURNED, sin relanzar (límite de 2 devoluciones usado)
Aceptación: A1, A2, A3, A4, A5 y A6 cumplen (55/55; `comparar.mjs --hook` 97/97, solo P1–P9 se levantan; `hook.test.mjs` solo con líneas agregadas; `adapters/` sin cambios; huella `90a91b183b14` vigente, nivel aceptación). A7 no cumple.

Devuelto: defecto — tramo 4 — A7:
- `docs/reglas-deny.md` (viñeta «El hook deniega las acciones protegidas») y `docs/implementacion.md` (viñeta de Claude Code) prometen `rm` y acciones protegidas «también encadenadas o sustituidas»; `rm` solo se mira como primer comando (`ls && rm -rf build` pasa, E18, y la viñeta de límites lo dice). Excluir `rm` de esa frase en ambos archivos.
- `docs/reglas-deny.md`: se perdió que el hook autoriza (`allow`) el comando declarado; restituirlo.

No cambia código.

La persona autorizó una tercera ronda solo para esta corrección de documentos.

Checkpoint segmento 4, revisión 3 (historia: documentos alineados con la tabla; última historia del plan):
- Archivos cambiados: `docs/reglas-deny.md` (viñeta del hook: `allow` restituido; `rm` sale de la frase de acciones encadenadas y queda como primer comando), `docs/implementacion.md` (viñeta de Claude Code: `rm` excluido de la frase de encadenados). `tramo-4.md` (TODO 5 marcado) y este `plan.md`. Ningún código cambió.
- Diff resumen: solo texto en español; `rm` se describe como primer comando (`ls && rm -rf build` pasa, E18), y `allow` vuelve a figurar.
- Checks: `grep` del segmento, `SEGMENT_CHECK_OK`; `./verify` nivel aceptación, exit 0, `VERIFY OK`, `Fingerprint: 94947fb423e1`; `comparar.mjs --hook`, exit 0, `tabla: 97/97`.
- Estado: `status: done`. No hay commit: lo hace la persona usuaria. `segment:` queda en 4.
- Pendientes en `tramo-4.md`: 0.

### Veredicto final (planner): APPROVED
A1–A7 cumplen. Huella `94947fb423e1` vigente (nivel aceptación, comprobada por el planner); en la tercera ronda solo cambiaron los dos documentos y la evidencia. Pendiente de la persona: probar un heredoc real (no comprobado si las reglas deny lo frenan).
