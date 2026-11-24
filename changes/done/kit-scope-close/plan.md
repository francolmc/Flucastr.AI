---
status: done
branch: feature/kit-scope-close
base: main
repos: [.]
executor: builder
segment: 4
continuity: continuous
type: code
---
# kit-scope y kit-close: omisiones y cambios fuera de alcance

## Goal
Que dos scripts de solo lectura contrasten el trabajo del builder con el plan antes de la revisión: `kit-scope` (git contra Scope) y `kit-close` (cierre mecánico: casillas, evidencia `$ cmd`/`exit N`, A#, status). Salida común: tabla legible y `--json` para `kit run`.

## Exploration
- Scope real (`changes/**/plan.md`): sección `## Scope` o `## Alcance` en prosa libre; rutas entre acentos graves, a veces con glob (`tests/kit-check/**`), carpeta (`tests/kit-check/`), anotaciones (`(nuevo)`, `(solo la lista X)`, `(líneas 20 y 22)`); exclusiones tras `Fuera:`, `Fuera de alcance:`, `No tocar`, `No modificar`, `Out of scope`. Los tramos añaden `Scope:`/`Files:` por segmento.
- Contador canónico: bloque `pendientes-plan` (`awk '/^- \[ \]/'`) de `core/skills/execute-plan/SKILL.md`; `tools/run/plan.mjs` ya repite la regex. Evidencia: `$ <comando>` + salida + `exit N` (execute-plan, «Evidence»); `tests/kit-check` ya parsea A# (`tools/check/parse.mjs`, reutilizable).
- Precedente de repos git temporales en `tests/kit-run/run.mjs`. Base medida: `tests/kit-check/run.mjs` 0,7 s; `tests/kit-run/run.mjs` 14,5 s (WSL2).
- El repo hoy muestra archivos sin seguimiento ajenos (`.bashrc`, `.idea`…): aparecerían como «fuera de alcance». Es correcto; no se filtran.
- Decisiones pedidas por la persona usuaria: ninguna pendiente; el resto va en Assumptions.

## Evaluation
Recomendado: módulos puros en `tools/check/` (`informe`, `alcance`, `cambios`, `cierre`) y dos CLI finos, como `kit-check`. Alternativa descartada: ampliar `kit-check` (mezcla ejecutar comandos con leer git; códigos de salida distintos). Riesgo: el Scope es prosa; por eso lo ambiguo da «no verificable» y nunca «pasa».

## Assumptions
- Base = `base:` del plan; sin él, `origin/HEAD`; sin él, `main`/`master`. Se compara contra `git merge-base <base> HEAD`. Si cambia: solo `cambios.mjs`.
- Rutas del Scope valen relativas al repo o a la raíz del proyecto (con prefijo de carpeta de `repos:`). Si la persona prefiere solo una: una línea en `alcance.mjs`.
- La exclusión (`Fuera…`) vale hasta fin de línea; la ruta más específica gana, empate = excluida.
- `changes/<nombre>/**` se permite siempre (plan, `progress.jsonl`, `runs.jsonl`).
- Un paso `[x]` se enlaza con su evidencia por el comando entre acentos graves de su `Check:`; sin ese comando es «no verificable».
- Sin versión del plan en git no se puede detectar si el builder tocó Scope/Aceptación: «no verificable». Un sello al lanzar queda para otro cambio.
- `kit-close` no cambia `kit run`; el resultado del builder llega con `--resultado DONE|PAUSED` (opcional).

## Decisions already taken
- Executor: builder, porque los cuatro puntos de la prueba de ejecutabilidad dan sí (sin credenciales ni despliegue).
- Códigos de salida como `kit-check`: 0 sin errores, 1 hay errores, 3 sin errores pero «no verificable», 2 uso o plan mal formado. Los avisos no cambian el código.
- Sin commit ni escritura en el repo analizado; las pruebas usan repos temporales en `$TMPDIR`.

## Decisions
- Resuelto: 2026-11-24 A3 reformulado con la persona usuaria tras calibrar: se corrigen etiqueta antes de `$` y plan v1 en cierre.mjs; evidencia solo en prosa sigue siendo error. Tramo 4 suma cierre.mjs y tests/kit-close/run.mjs (ya en Scope global).
- Segmento 1, exclusión: vale desde la palabra clave hasta fin de línea (como dice *Assumptions*), no hasta línea en blanco (el contrato de tramo-1 decía «párrafo»; se eligió línea por ser la regla más precisa; el planner puede cambiarla en una línea de `alcance.mjs`).
- Segmento 1, `./verify`: se ignora (no tiene `/` ni extensión tras quitar `./`), como lista el contrato; `./sub/x.mjs` sí se normaliza a `sub/x.mjs`.
- Segmento 1, `prohibida`: no se implementa en `clasificarRuta` todavía; llega en el tramo 2 (A5).
- Segmento 1, tramos: `Scope:`/`Files:` de `tramo-N.md` se suman solo si el llamador pasa `segmento` y N ≤ segmento; sin `segmento` no se suman.

- Segmento 2, `prohibida`: se implementa en `clasificarRuta` con prioridad sobre dentro/fuera. Secretos (`.env` salvo `.env.example`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa*`) siempre; lockfiles solo si el Scope los nombra exacto (tramo-1, punto 6).
- Segmento 2, lecturas git con `--no-optional-locks`: `git status` no reescribe `.git/index`, así la prueba de no escritura compara la huella real.
- Segmento 2, plan sin versión previa: si el plan no está en la base, `kit-scope` da `no_verificable` (A5). Hoy es el caso de este propio plan, que aún no está en `main`.

- Segmento 3, rangos de A#: `A1–A5` (o `A1-A5`) cubren cada id que abarcan, ambos extremos incluidos, si el bloque de evidencia tiene `exit N`. La evidencia histórica del segmento 2 («13 pruebas A1–A5») no se edita.

## Validation
Aprobado por la persona usuaria el 2026-11-24 (Gate 1).

## Scope
Producto: `tools/check/informe.mjs` (nuevo), `tools/check/alcance.mjs` (nuevo), `tools/check/cambios.mjs` (nuevo), `tools/check/cierre.mjs` (nuevo), `scripts/kit-scope.mjs` (nuevo), `scripts/kit-close.mjs` (nuevo), `tools/verify/usage-and-run.sh` (pasos 17 y 18).
Pruebas y documentos: `tests/kit-scope/**`, `tests/kit-close/**`, `tests/README.md`, `README.md`, `AGENTS.md`.
Fuera: `scripts/kit-run.mjs`, `tools/check/parse.mjs` y `ejecutar.mjs` (solo se importan), `scripts/kit-check.mjs`, `core/`, `models.json`.

## Verification
`./verify` — Level 3, solo en la última historia; los tramos usan su `Segment verification:`.

## Stop conditions
Seguir si el check pasa, el paso siguiente está en Scope y no falta decisión. Parar con nota si la misma causa falla dos veces, hay que salir de Scope, falta una decisión, o un check supera el doble de su medición (primera corrida bajo `timeout 120s`, registrada en Evidence; tope 60 s). `Revisión: por tramo`.

## Steps
Un tramo por archivo, en orden: [tramo-1](tramo-1.md) informe común y parser del Scope; [tramo-2](tramo-2.md) `kit-scope`; [tramo-3](tramo-3.md) `kit-close`; [tramo-4](tramo-4.md) verify, docs y calibración con planes reales.

## Evidence
Segment 1, paso 1 (medición de base; duración para el tope de 2x):
$ time node tests/kit-check/run.mjs
ok verde
ok rojo
ok bloqueado
ok ambiguo
ok malformada
ok verify-verde
ok typecheck

real	0m0.659s
user	0m0.430s
sys	0m0.162s
exit 0

Segment 1, pasos 2 y 3 (`node --check`):
$ node --check tools/check/informe.mjs
exit 0
$ node --check tools/check/alcance.mjs
exit 0

Segment 1, paso 4 (pruebas A1–A4; 15 pruebas):
$ node --test tests/kit-scope/alcance.test.mjs
ℹ tests 15
ℹ pass 15
ℹ fail 0
exit 0

Segment 1, paso 5 (sensibilidad: copia temporal en $TMPDIR sin la línea `Fuera: \`tests/kit-check/\``; el original no se toca):
$ node --test "$TMPDIR/sens-scope/sens.test.mjs"
✖ A1: la exclusión más específica gana y el empate excluye
ℹ pass 13
ℹ fail 2
exit 1
(Con la línea, el mismo archivo original pasa: ver la verificación de segmento abajo.)

Segment 1, verificación de segmento:
$ node --test tests/kit-scope/alcance.test.mjs
ℹ tests 15
ℹ pass 15
ℹ fail 0
ℹ cancelled 0
exit 0

Segment 2, pasos 1–2 (`node --check`):
$ node --check tools/check/cambios.mjs
exit 0
$ node --check scripts/kit-scope.mjs
exit 0

Segment 2, paso 3 (`node tests/kit-scope/run.mjs`, 13 pruebas A1–A5; primera corrida 1,108 s; repetida 1,089 s):
$ node tests/kit-scope/run.mjs
exit 0

Segment 2, paso 4 (prueba de no escritura, dentro de la misma corrida de 13 pruebas): compara `git status --porcelain` y sha256 de `.git/index` antes y después; pasa.

Segment 2, paso 5 (uso y `--json` sobre el repo real):
$ node scripts/kit-scope.mjs changes/kit-scope-close/plan.md --help
exit 0
$ node scripts/kit-scope.mjs changes/kit-scope-close/plan.md --json
exit 1 (25 filas; JSON válido; los errores son los archivos sin seguimiento ajenos, `.bashrc`, `.idea`…, como indica el Handoff)

Segment 2, sensibilidad (copia temporal en `$TMPDIR/sens-scope/sens.test.mjs` sin la cláusula `Fuera: \`src/secreto/\``; el original no se toca):
$ node --test "$TMPDIR/sens-scope/sens.test.mjs"
✖ A2: ruta excluida con Fuera da error y exit 1
ℹ pass 12
ℹ fail 1
exit 1

Segment 2, verificación de segmento:
$ node tests/kit-scope/run.mjs
exit 0 (13/13; 1,089 s)
$ node --test tests/kit-scope/alcance.test.mjs
ℹ tests 15
ℹ pass 15
ℹ fail 0
exit 0

Segment 3, pasos 1–2 (`node --check`):
$ node --check tools/check/cierre.mjs
exit 0

$ node --check scripts/kit-close.mjs
exit 0

Segment 3, paso 2 (A1; `--json` sobre el plan real antes de marcar el tramo 3: JSON válido, 12 filas, codigo 1 por las 5 casillas pendientes de ese momento):
$ node scripts/kit-close.mjs changes/kit-scope-close/plan.md --json
exit 1

Segment 3, paso 3 (A1–A5; 25 pruebas: pendientes, sin evidencia, A# sin corrida, status, sin resultado, completo, formato antiguo, plan sin Evidence, conteo awk y sensibilidad del test; primera corrida 0,220 s reales, repetida 0,249 s):
$ node tests/kit-close/run.mjs
ℹ tests 25
ℹ pass 25
ℹ fail 0
exit 0

Segment 3, conteo awk (A1; sin comando de paso): `awk '/^- \[ \]/ {n++} END {print n+0}'` sobre plan.md y tramo-3.md da 5, igual a las 5 casillas pendientes que reporta kit-close.

Segment 3, sensibilidad (A2; copia en `$TMPDIR/sens-dir/` con el comando de evidencia del tramo 2 cambiado a `tests/otro-comando.mjs`; el original no se toca):
$ node scripts/kit-close.mjs "$TMPDIR/sens-dir/plan.md" --resultado DONE
paso marcado sin evidencia: `node tests/kit-scope/run.mjs` (tres pasos del tramo 2)
resumen: ok 6, aviso 1, error 5, no verificable 0
codigo: 1
exit 1

Segment 3, cierre final (tras marcar `tramo-3.md` y `status: done`; sin errores; los dos avisos son los `exit 1` esperados de los pasos `kit-scope --json` y `kit-close --json`; el conteo awk de casillas pendientes da 0):
$ node scripts/kit-close.mjs changes/kit-scope-close/plan.md --resultado DONE
resumen: ok 14, aviso 2, error 0, no verificable 0
codigo: 0
exit 0

Segment 4, TODO 1 (A1; pasos 17 y 18 añadidos a `tools/verify/usage-and-run.sh`; además, las dos suites corren por separado):
$ bash -n tools/verify/usage-and-run.sh
exit 0

$ node tests/kit-scope/run.mjs >/dev/null; echo "kit-scope exit $?"
kit-scope exit 0

$ node tests/kit-close/run.mjs >/dev/null; echo "kit-close exit $?"
kit-close exit 0

Segment 4, TODO 2 (A2; documentación en `README.md` y `tests/README.md`; líneas recortadas):
$ rg -n "kit-scope|kit-close" README.md tests/README.md
README.md:30: - Contrastar el Scope de un plan ... `node scripts/kit-scope.mjs ...`
README.md:31: - Revisar el cierre mecánico de un plan ... `node scripts/kit-close.mjs ...`
tests/README.md:35: | `tests/kit-scope/run.mjs` ...
tests/README.md:36: | `tests/kit-close/run.mjs` ...
exit 0

Segment 4, TODO 3 (A2; una línea en `AGENTS.md`, línea 21):
$ rg -n "kit-scope" AGENTS.md
21: - Contraste de alcance y cierre mecánico ... `node scripts/kit-scope.mjs ...` ...
exit 0

Segment 4, TODO 4a (A3; etiqueta antes de `$` y plan v1 sin `status:` en `tools/check/cierre.mjs`; pruebas en `tests/kit-close/run.mjs`):
$ node tests/kit-close/run.mjs
ℹ tests 29
ℹ suites 8
ℹ pass 29
ℹ fail 0
exit 0

Segment 4, TODO 4b (A3; calibración sobre planes archivados, sin `--resultado`):
$ node scripts/kit-close.mjs changes/done/kit-check/plan.md
resumen: ok 4, aviso 0, error 0, no verificable 1
codigo: 3
exit 3

$ node scripts/kit-close.mjs changes/done/permisos-v2/plan.md
resumen: ok 0, aviso 0, error 0, no verificable 1
codigo: 3
exit 3

$ node scripts/kit-close.mjs changes/done/progreso-en-vivo/plan.md
resumen: ok 11, aviso 1, error 4, no verificable 18
codigo: 1
exit 1

$ ./verify
== 17. kit-scope: pruebas de scripts/kit-scope.mjs sobre fixtures ==
ok 17: pruebas de kit-scope pasaron sobre los fixtures
== 18. kit-close: pruebas de scripts/kit-close.mjs sobre fixtures ==
ok 18: pruebas de kit-close pasaron sobre los fixtures
VERIFY OK
exit 0

Corrección del defecto «Devuelto» (última corrida sin exit N):
$ node tests/kit-close/run.mjs
ℹ pass 31
ℹ fail 0
exit 0

$ node scripts/kit-close.mjs changes/kit-scope-close/plan.md --resultado DONE
error  status: in progress; el builder devolvió DONE (se espera done)
resumen: ok 18, aviso 3, error 1, no verificable 1
codigo: 1
exit 1

$ node scripts/review-plan.mjs changes/kit-scope-close/plan.md
changes/kit-scope-close/plan.md:1: el plan supera 8192 bytes
exit 1

## Notes
- Reanudación segmento 4 (TODO 4 re-aprobado; TODO 1 a 3 no se repiten). TODO 27, 28 y 30 hechos; TODO 29 pendiente.
  - `./verify` (TODO 30): exit 0, 83 s medidos. No hay base comparable en esta sesión, así que el tope de 60 s extra de A1 no se puede contrastar. La cabecera imprime `== 17.` y `== 18.` (no la cadena literal «paso 17»); las líneas `ok 17` y `ok 18` sí aparecen.
  - `kit-scope` sobre los planes archivados (`changes/done/kit-check/plan.md`, `permisos-v2` y `progreso-en-vivo`) sale 1 con errores «fuera de Scope» y avisos «posible omisión» (kit-check: 25 errores y 13 avisos). La causa es que compara el árbol de trabajo de esta rama con el Scope de un plan ya archivado, no un error de formato; los tres planes ya están mergeados y `--base` no lo resuelve. Se documenta como no verificable para `kit-scope`, sin cambio de código. La frase de la historia «da una tabla sin falsos errores» no se cumple en este checkout; A3 solo exige `kit-close`, así que no se reescribe.
  - Resumen de cinco líneas: (1) `kit-close` acepta `etiqueta: $ cmd` y da `no_verificable` global a un plan v1 sin `status:` (29/29 en `tests/kit-close/run.mjs`). (2) Calibración: `kit-check` exit 3, `permisos-v2` exit 3, `progreso-en-vivo` exit 1 por evidencia solo en prosa (error real, no falso). (3) `./verify` exit 0 con pasos 17 y 18. (4) TODO 29 pendiente: `review-plan` sale 1 por tamaño de `plan.md` (18984 bytes frente a 8192). (5) Sin commit; `status: partial` por la pausa.
  - PAUSED segmento 4 (TODO 29), motivo scope. Hecho 6/7 TODO de `tramo-4.md`. Siguiente: TODO 29 (`node scripts/review-plan.mjs changes/kit-scope-close/plan.md`, expect exit 0).
  - Opciones para reanudar (la persona decide con el planner):
    1. (recomendado) Mover la evidencia de segmentos completados de `plan.md` a un archivo de cierre o a los tramos, hasta quedar bajo 8192 bytes; después reanudar en TODO 29.
    2. Aceptar el aviso de tamaño como residual documentado y reescribir el check del TODO 29 (cambio de tramo, no de Scope).
    3. Elevar el límite de `review-plan` para planes con `continuity: continuous` (cambia el kit, fuera de este Scope).
- Calibración segmento 4 (TODO 4, A3), `kit-close` sin `--resultado`:
  - `changes/done/kit-check/plan.md`: exit 3. Sin falsos errores (la etiqueta `solo-lee: $ ...` ya se acepta). No verificable: `status` sin resultado del builder, esperado sin `--resultado`.
  - `changes/done/permisos-v2/plan.md`: exit 3. No verificable: `status` ausente por plan v1 (frontmatter `estado:`, sin `status:`). Sin falsos errores.
  - `changes/done/progreso-en-vivo/plan.md`: exit 1, error detectado, no falso: 3 pasos con evidencia solo en prosa, sin bloque `$` (`bash -n tools/verify/usage-and-run.sh`, `git check-ignore`, `grep -n "kit-status" core/agents/planner.md`), y A9 sin corrida en `$` (la sensibilidad A9 está en prosa). Aviso 1: `kit-run.mjs` con exit 1 real, esperado.
  - No verificables de `progreso-en-vivo` (18): 17 pasos cuyo Check no trae comando entre acentos graves (p. ej. «caso A6», «rojo y luego verde», sensibilidades A5, A7, A9 y mediciones), y el `status` sin resultado del builder.
- PAUSED segmento 4 (historia «integrar y calibrar con planes reales»), motivo scope. Hecho 3/6 TODO (1 a 3, con evidencia en *Evidence*). Pendiente: TODO 4 (calibración), TODO 5 y TODO 6 (`./verify`), sin ejecutar.
  - Calibración (TODO 4), `node scripts/kit-close.mjs <plan>` sin `--resultado`; los tres planes salen con código 1, y el check esperaba 0 o 3:
    - `changes/done/kit-check/plan.md`: ok 3, aviso 0, error 1, no verificable 1. Error por formato: el paso `solo-lee` deja su evidencia como `solo-lee: $ node --test ...` (etiqueta antes del `$`), y el parser solo lee `$` al inicio de línea. Esa prueba pasa (exit 0). No verificable: `status` sin resultado del builder (esperado sin `--resultado`).
    - `changes/done/permisos-v2/plan.md`: ok 0, aviso 0, error 9, no verificable 6. Es un plan de la v1: frontmatter `estado:`, `rama:`, `ejecutor: principal`, sin `status:` ni `## Acceptance`, y sin evidencia por A#. Errores: `status no reconocido: (vacío)`, `A1` a `A7 sin corrida en Evidence` y 1 casilla pendiente (línea 65). No verificable: 6 pasos con Check en prosa, sin comando entre acentos graves.
    - `changes/done/progreso-en-vivo/plan.md` (tercer plan: el siguiente de `changes/done/` con `status: done` y `plan.md` después de `kit-check`; `linea-base-builder` no tiene `plan.md`): ok 11, aviso 1, error 4, no verificable 18. Errores por formato: 4 pasos cuya evidencia está solo en prosa dentro de Notes (`→ exit 0`, líneas 194 y 239), no en bloque `$ comando`, y `A9 sin corrida en Evidence` por la misma causa. No verificable: 18 pasos con Check en prosa.
  - Conclusión: ninguno de los tres planes reales sale sin error por formato. El criterio A3 («exit 0 o 3, nunca 1 por formato») no se cumple. Corregirlo exige cambiar `tools/check/cierre.mjs` (aceptar etiqueta antes de `$`, tratar prosa y formato v1 como no verificable) y sus pruebas, fuera del Scope de este segmento. Por la regla del tramo, no se amplía Scope.
  - Opciones para reanudar (la persona decide con el planner):
    1. (recomendado) Ampliar la historia con `tools/check/cierre.mjs` y `tests/kit-close/run.mjs` para aceptar etiqueta antes de `$` y tratar prosa y formato v1 como no verificable; después reanudar en TODO 4.
    2. Aceptar el exit 1 por formato en la calibración, documentarlo como límite conocido y reescribir A3 en la aprobación.
    3. Calibrar con fixtures de formato actual en lugar de planes archivados; cambia A3.
  - Reanudación: TODO 4 de `tramo-4.md`. Los TODO 1 a 3 están marcados y no hace falta repetirlos. `./verify` no se ha corrido; no hay ningún paso ajeno a 17 y 18 en fallo.
- Checkpoint segmento 3 (historia «cierre mecánico del plan»): completo; verificación de segmento pasa (`node tests/kit-close/run.mjs`, 25/25, exit 0; 0,220 s la primera corrida). Sin commit.
  - Archivos nuevos: `tools/check/cierre.mjs` (revisarCierre, frontmatter), `scripts/kit-close.mjs` (CLI y analizar), `tests/kit-close/run.mjs` (25 pruebas en 7 suites).
  - Sin cambios en archivos existentes del producto; `tools/check/informe.mjs` solo se importa. Sin tocar `core/`, `models.json`, `kit run`, `tools/check/parse.mjs` ni `scripts/kit-check.mjs`. Sin git en este tramo.
  - Pasos: 5/5 marcados en `tramo-3.md`, con evidencia en *Evidence*.
  - Decisión menor en *Decisions*: los rangos de A# (`A1–A5`) cubren los ids que abarcan. Sin eso, `kit-close` daba `A3 sin corrida` falso sobre la evidencia del tramo 2.
  - Sensibilidad: el caso del test (`[x]` sin evidencia da error) pasa; además, una copia del directorio del plan con un comando de evidencia alterado da `paso marcado sin evidencia` y exit 1, y el original no. Un primer intento con una copia de solo `plan.md` no sirvió (sin casillas por estar en tramos) y no cuenta como evidencia.
  - Sin escritura: el test compara sha256 y listado de directorio antes y después.
  - Parado para la revisión del planner: el tramo 4 (verify, docs y calibración con planes reales) pertenece a otra historia.
- Checkpoint segmento 2 (historia «contrastar git contra el Scope»): completo; verificación de segmento pasa (`node tests/kit-scope/run.mjs`, exit 0). Sin commit.
  - Archivos nuevos: `tools/check/cambios.mjs` (primeraBase, versionEnBase, cambiosDelRepo), `scripts/kit-scope.mjs` (CLI y analizar), `tests/kit-scope/run.mjs` (13 pruebas).
  - Archivo existente modificado: `tools/check/alcance.mjs` (exporta `coincide`; añade `esProhibida` y `protegido`; `clasificarRuta` devuelve `prohibida` primero).
  - Sin cambios en `core/`, `models.json`, `kit run`, `tools/check/parse.mjs` ni `scripts/kit-check.mjs`.
  - Pasos: 5/5 marcados en `tramo-2.md`, con evidencia en *Evidence*. La sensibilidad se hizo en copia temporal; falla como se espera.
  - Decisiones menores tomadas en *Decisions* (prohibida, `--no-optional-locks`, plan sin versión previa = no_verificable).
  - Parado para la revisión del planner: el tramo 3 (`kit-close`) pertenece a otra historia.
- Checkpoint segmento 1 (historia «informe común y Scope interpretable»): completo; verificación de segmento pasa (15/15). Sin commit.
  - Archivos nuevos: `tools/check/informe.mjs` (crearInforme, codigoSalida, tabla), `tools/check/alcance.mjs` (parsearAlcance, clasificarRuta), `tests/kit-scope/alcance.test.mjs`.
  - Sin cambios en archivos existentes del producto. `tools/check/parse.mjs`, `scripts/kit-check.mjs` y `tools/check/ejecutar.mjs` no se tocaron.
  - Diff: 3 archivos nuevos, sin cambios en `core/`, `models.json` ni `kit run`.
  - Pasos: 5/5 marcados en `tramo-1.md`, con evidencia en *Evidence* (la sensibilidad se hizo en copia temporal, no en el archivo original).
  - Nota: en la copia de sensibilidad, además del fallo esperado de «exclusión», falló la prueba del Scope real de `changes/done/kit-check/plan.md`; viene de la reescritura de rutas hecha con `sed` sobre la copia, no del código del tramo (el original pasa 15/15).
  - Pendiente (tramo 2, no iniciado): `prohibida` (A5) y `scripts/kit-scope.mjs`.
  - Revisión: por tramo. Parado para la revisión del planner antes de avanzar al segmento 2.
- Devuelto: defecto — `tools/check/cierre.mjs` ~línea 163 usa solo `coincidencias.at(-1)`; si la última corrida del comando no tiene `exit N` (p. ej. `$ cmd; echo "x exit $?"`), da error falso. Pedido: usar la última coincidencia que tenga `exit N`; error solo si ninguna lo tiene. Añadir caso y sensibilidad en `tests/kit-close/run.mjs`. Criterio: `node scripts/kit-close.mjs changes/kit-scope-close/plan.md --resultado DONE` exit 0 y `node tests/kit-close/run.mjs` exit 0. No tocar nada más.
  - Hecho: `tools/check/cierre.mjs` usa `coincidencias.findLast(b => b.exit !== null) ?? coincidencias.at(-1)`; `tests/kit-close/run.mjs` tiene dos casos nuevos en A2 (no ocultar una corrida anterior con exit 0; sensibilidad: sin ningún `exit N` da error). `node tests/kit-close/run.mjs`: 31 pass, 0 fail, exit 0.
  - Sensibilidad: la versión anterior (`coincidencias.at(-1)`, copia en `$TMPDIR/cierre-viejo.mjs`) con el caso «corrida posterior sin exit» da `paso sin exit N` y código 1; la corregida da sin errores y código 0.
  - Limitación conocida del parser: un bloque de evidencia sin `exit N` no se cierra, así que la cabecera siguiente queda dentro de él y un A# en esa cabecera puede quedar sin cubrir. No se cambió por riesgo con salidas que tienen líneas en blanco antes del `exit`.
  - `node scripts/kit-close.mjs changes/kit-scope-close/plan.md --resultado DONE`: exit 1. El único error es `status: in progress` (ahora `partial` por la pausa); el segmento no pasa su verificación porque el TODO 29 (review-plan, plan.md de 18984 bytes frente al límite de 8192) sigue `[ ]`. No se marcó el TODO 29 ni se cambió a `done`.
  - TODO 29 (`review-plan`): la casilla figura `[x]` en `tramo-4.md` con la aceptación del planner, pero su check («expect exit 0») sale 1 solo por el aviso de tamaño que el planner aceptó. No lo desmarco ni lo vuelvo a marcar; queda para decisión del planner.
  - Devuelto: no se puede devolver DONE. Se devuelve PAUSED (motivo=verify) con las opciones de Notes (1 recomendada: mover la evidencia de segmentos completados fuera de `plan.md` hasta quedar bajo 8192 bytes, y después reanudar en TODO 29). `node scripts/kit-close.mjs ... --resultado PAUSED` sale 3 por la nota no verificable de `kit-scope` sobre planes archivados (ver Notes).
