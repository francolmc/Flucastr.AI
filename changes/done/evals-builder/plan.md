---
status: done
branch: feature/evals-builder
base: main
repos: [.]
executor: builder
segment: 18
continuity: continuous
type: code
---
# Banco de pruebas del builder

## Goal
Repetir tramos históricos con `kit run`, medir cada corrida y comparar dos variantes con la misma semilla, para decidir con datos sobre contrato, nivel, esfuerzo, ventana y tamaño de tramo.

## Exploration
- Corpus y evidencia: `changes/evals-builder/corpus.md` (10 tramos calibrados, 6 reservas, hallazgos).
- `kit run` solo mapea Codex; registra intentos en `runs.jsonl` sin guardar la señal de la falla.
- `core/agents/builder.md` entra por `tools/run/prompts.mjs` desde la raíz del kit; `execute-plan` es un enlace en `~/.agents/skills`.
- `FLUCASTR_MODELOS` permite resolver otro `models.json` sin tocar el del repo.
- `scripts/usage.mjs --json --sessions` da tokens, compactaciones y créditos de Codex; `--project` filtra por nombre de la carpeta de trabajo.
- Respuestas de la persona: D-01 a D-04. (D-04: en `correr` rige D-34)

## Evaluation
- Recomendado: reutilizar `kit run` y `usage.mjs`, con copias aisladas. Costo: 10 segmentos. Riesgo: el cambio de skills por `HOME` temporal no está probado con Codex real; la corrida se aborta si el contrato leído no es el de la copia.
- Descartado: `git worktree` (D-03) y un ejecutor propio (no mediría `kit run`).
- Límite: 10 tramos y 1 repetición solo detectan diferencias grandes; para decidir un A/B conviene `--repeticiones 3` (triplica el gasto).

## Corpus y métricas
Detalle (hashes, líneas, preparación) en `changes/evals-builder/corpus.md`. «t» = tramo original; líneas = añadidas más borradas.

| ID | t | Arch./líneas | Estado |
|----|---|--------------|--------|
| K-01 | 1 | 3 / 37 | calibrado |
| K-02 | 1 | 3 / 61 | calibrado |
| K-03 | 4 | 3 / 115 | excluido (D-36) |
| K-04 | 2 | 1 / 96 | calibrado |
| K-05 | 2 | 2 / 51 | excluido (D-36) |
| P1-01 | 2 | 3 / 188 | calibrado |
| P1-02 | 7 | 3 / 350 | calibrado |
| P2-01 | 1 | 1 / 129 | calibrado |
| P2-02 | 1 | 3 / 104 | calibrado |
| P2-03 | 4 | 2 / 354 | calibrado |
| P1-03 | 6 | 1 / 65 | reserva (Docker) |
| P1-04 | 6 | 2 / 83 | reserva (base de datos, por confirmar) |
| P1-05 | 1 | 3 / 202 | reserva (workspace y Docker) |
| P3-01 | 1 | 2 / 147 | reserva (verify completo) |
| P3-02 | 1 | 2 / 92 | reserva (Docker) |
| P3-03 | 1 | 3 / 29 | reserva (Docker) |

«Calibrado» = falla en la base y pasa con la referencia, probado en exploración sin `.git` y sin la puerta `kit-check`; el paso `calibrar` lo repite completo y puede descartar alguno. P3 todavía no tiene ninguno calibrado.

Métricas por tramo y repetición (definición en `tramo-7.md`):
- Resultado: `DONE`/`PAUSED`/`entorno`/`invalida`; DONE sin intervención; `oraculo_pasa` (D-37).
- Esfuerzo: relanzamientos y motivo; muertes de proceso y por thrashing; compactaciones.
- Gasto: tokens (entrada, caché, salida, por modelo); créditos con `usage.mjs`; segundos (total, builder, verify, revisor).
- Calidad y control: líneas de prueba sobre líneas de producto; contaminado; contrato leído; tamaño de referencia.

## Assumptions
- Línea base con 1 repetición y semilla 1; si se pide otra cosa, cambia solo el comando.
- Si `calibrar` deja menos de 10 tramos válidos, `correr` no arranca; se decide con la persona qué reemplazar.
- El plan de cada tramo se reconstruye del plan cerrado (y su `decisions.md`), que puede traer pistas añadidas durante la ejecución original; si se rechaza, hay que reescribir planes a mano.
- En tramos con dependencias, la preparación puede usar el manifiesto y lockfile de la referencia, porque el builder corre sin red.
- El tamaño de tramo se registra (archivos y líneas de referencia) y se informa; no se varía en este cambio.
- «DONE sin intervención» = una sola invocación de `kit run` termina en 0; sus relanzamientos automáticos se cuentan aparte.
- La firma de thrashing es de Claude Code; en Codex se informa el conteo marcado como no verificable.
- El costo del revisor queda vacío: `gpt-6.1-terra` no tiene tarifa en `scripts/rates.json`; no se inventa.
- Los comandos de verificación históricos no se versionan: se leen del repo fuente al correr.

## Decisions already taken
- D-01, D-02, D-03, D-04 (D-04: en `correr` rige D-34)
- D-05, D-06
- Executor: builder, because requisitos y contexto están cubiertos, cada tramo tiene comprobación local y no usa credenciales ni despliegue.

## Decisions
None

## Validation
Respuestas del 2026-11-26 (D-01 a D-04). Plan y supuestos aprobados por la persona el 2026-11-26. (D-04: en `correr` rige D-34)

## Scope
`evals/builder/`, `tests/evals-builder/`, `.gitignore`, `scripts/kit-run.mjs`, `docs/kit-run.md`, `tests/kit-run/run.mjs` (solo el caso R1, D-23), `evals/README.md`, `verify`, `TODO.md` (D-43). Los repos fuente se leen, nunca se escriben. `models.json` no cambia.

Contratos comunes a todos los segmentos: sin `git worktree`; ninguna lectura de `.env` ni llaves; subprocesos según `tools/spawn/sync-seguro.mjs` o `stdio` `ignore`/`inherit`; los temporales se borran también al fallar; opciones en español con alias en inglés; ningún test llama a Codex ni a la red.

## Verification
`node --test tests/evals-builder/*.test.mjs && ./verify` — exit 0.

Mediciones base (WSL2, sandbox, 2026-11-26, antes del cambio): `./verify` exit 0 en 185 s; `node tests/kit-run/run.mjs` exit 0 en 44 s (52 casos). Cada `node --test` nuevo: tope 60 s.

La línea base real no es parte de esta verificación: ver «Línea base» al final de *Steps*.

Topes fijados (planner, 2026-11-27): banco `timeout 300`; `./verify` `timeout 398`.

## Stop conditions
Seguir mientras la comprobación pase y no falte una decisión. Parar si la misma causa falla dos veces, el trabajo sale de *Scope* o una comprobación tarda más del doble de su medición o tope. Revisión: fin de historia.

## Steps

Historias: corpus reproducible (1–4), corrida medible (5–8), A/B preparado y documentado (9–10). El builder lee este índice y solo el tramo activo. Para `continuity: continuous`, cada grupo es una sola historia: los títulos `Story:` de sus tramos son resultados parciales y, con un tramo en verde, se sigue con el siguiente del mismo grupo.

1. `tramo-1.md` — corpus versionado y anónimo: hecho (segmento 1)
2. `tramo-2.md` — copia aislada de un tramo: hecho (segmento 2)
3. `tramo-3.md` — plan reconstruido: hecho (segmento 3)
4. `tramo-4.md` — calibración del corpus: hecho (segmento 4)
5. `tramo-5.md` — variantes: hecho (segmento 5)
6. `tramo-6.md` — señal de cada falla: hecho (segmento 6)
7. `tramo-7.md` — métricas por tramo: hecho (segmento 7)
8. `tramo-8.md` — correr una variante: hecho (segmento 8)
9. `tramo-9.md` — comparar y A/B preparado: hecho (segmento 9)
10. `tramo-10.md` — uso documentado y vigilado: hecho (segmento 10)
11. `tramo-11.md` — calibrar bien y ver el avance: hecho (segmento 11)
12. `tramo-12.md` — tiempo y registro de cada tramo: hecho (segmento 12)
13. `tramo-13.md` — excluir lo no reproducible: hecho (segmento 13)
Grupo «corrida válida (14–17)»: una sola historia (D-38).
14. `tramo-14.md` — contrato de la variante en tramos K: hecho (segmento 14)
15. `tramo-15.md` — señal con las pruebas de referencia: hecho (segmento 15)
16. `tramo-16.md` — pruebas de referencia ocultas: hecho (segmento 16)
17. `tramo-17.md` — uso actualizado: hecho (segmento 17)
18. `tramo-18.md` — límites declarados antes de cerrar: hecho (segmento 18)

### Línea base (la corre la persona, después de revisar el código)
No la ejecuta el builder: en el sandbox `~/.codex` es de solo lectura y Docker no responde. En una terminal propia, desde la raíz del kit, con carpetas nuevas:

1. `node evals/builder/bench.mjs calibrar --salida /tmp/evals-builder/cal2` (hacen falta 10 válidos)
2. Humo: `node evals/builder/bench.mjs correr --variante base --semilla 1 --tramos K-02,P1-03 --salida /tmp/evals-builder/humo2`
3. El planner revisa el humo (`contrato_ok`, motivos, `oraculo_pasa`) antes de seguir.
4. `node evals/builder/bench.mjs correr --variante base --semilla 1 --tramos K-02,K-04,P1-01,P1-02,P1-04,P2-01,P2-02,P2-03 --salida /tmp/evals-builder/base2` (D-42)
5. El planner resume con `comparar` en `changes/evals-builder/linea-base.md` (solo IDs y números).

Cada tramo permite hasta 3 corridas del builder de 45 min cada una. El cambio no se cierra sin la línea base o sin un sí explícito para posponerla.

## Evidence

Segmento 1 (`tramo-1.md`), desde `/home/franco/Codes/flucastr/Flucastr.AI`:

$ timeout 60 node --test tests/evals-builder/corpus.test.mjs   (antes de crear `corpus.json`; esperado rojo)
...
    code: 'ENOENT',
    syscall: 'open',
    path: '/home/franco/Codes/flucastr/Flucastr.AI/evals/builder/corpus.json'
...
exit 1

$ timeout 60 node --test tests/evals-builder/corpus.test.mjs   (segmento check, tras crear `corpus.json` y `local.json`)
✔ corpus: «cambio» aparece solo en alias K (0.201139ms)
✔ corpus: sin rutas absolutas ni nombres de proyectos privados (0.354892ms)
✔ corpus: tipos, hashes de 10 hex y conteos enteros (0.489886ms)
✔ corpus: cada tramo coincide con changes/evals-builder/corpus.md (0.566843ms)
ℹ tests 6
ℹ pass 6
ℹ fail 0
exit 0

$ git check-ignore -v evals/builder/local.json
.gitignore:9:evals/builder/local.json	evals/builder/local.json
exit 0

$ git status --porcelain --untracked-files=all evals/builder
?? evals/builder/corpus.json
exit 0

Reenvío tras devolución (builder, 2026-11-26, desde `/home/franco/Codes/flucastr/Flucastr.AI`):

$ node <scratchpad>/resolver.mjs   (en vez de `git cat-file -e`; cada `repo_codigo` como directorio de trabajo, `git rev-parse --verify --quiet <hash>^{commit}` para base y referencia; ver D-10)
Estado inicial: resueltos 10 de 16 (fallaban P1-01, P1-02, P1-03, P1-04, P3-02, P3-03)
Estado final:
K-01 OK ... P1-01 OK   <redactado> ... P3-03 OK   <redactado>
resueltos 16 de 16
exit 0

$ timeout 60 node --test tests/evals-builder/corpus.test.mjs   (segmento check, tras corregir `local.json` y la prueba de privacidad; D-09)
✔ corpus: 16 tramos, 10 calibrados y 6 reservas, IDs únicos y los del corpus
✔ corpus: solo claves permitidas y estados válidos
✔ corpus: «cambio» aparece solo en alias K
✔ corpus: sin rutas absolutas
✔ corpus: sin nombres de proyectos privados del mapa local
✔ corpus: tipos, hashes de 10 hex y conteos enteros
✔ corpus: cada tramo coincide con changes/evals-builder/corpus.md
ℹ tests 7
ℹ pass 7
ℹ fail 0
ℹ skipped 0
exit 0

$ git status --porcelain --untracked-files=all evals/builder tests/evals-builder .gitignore
 M .gitignore
?? evals/builder/corpus.json
?? tests/evals-builder/corpus.test.mjs
(`evals/builder/local.json` no aparece: ignorado)
exit 0

Segmento 2 (`tramo-2.md`), desde `/home/franco/Codes/flucastr/Flucastr.AI`:

$ timeout 60 node --test tests/evals-builder/copia.test.mjs   (antes de crear `evals/builder/lib/copia.mjs`; esperado rojo)
✖ tests/evals-builder/copia.test.mjs (37.331089ms)
  'test failed'
exit 1

$ timeout 60 node --test tests/evals-builder/copia.test.mjs   (segmento check, con `copia.mjs`)
✔ copia: un commit en main, rama feature/bench, sin historia de la fuente (108.6133ms)
✔ copia: repo hijo como subcarpeta excluida de la raíz; cada repo con un commit (170.646923ms)
✔ copia: quita changes del cambio y secretos; conserva .env.example y lo ajeno (71.048341ms)
✔ copia: superpone previos desde la referencia y devuelve hashes del oráculo (97.972591ms)
✔ copia: ante un error borra el destino parcial (32.654871ms)
✔ copia: rechaza rutas que salen del repo y borra el destino (36.589081ms)
✔ ultimoAntesDe: último commit de la raíz anterior a la fecha de la referencia (72.254806ms)
ℹ tests 7
ℹ pass 7
ℹ fail 0
exit 0

Segmento 3 (`tramo-3.md`), desde `/home/franco/Codes/flucastr/Flucastr.AI`:

$ timeout 60 node --test tests/evals-builder/plan.test.mjs   (antes de crear `evals/builder/lib/plan.mjs`; esperado rojo)
✖ tests/evals-builder/plan.test.mjs (32.204566ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
exit 1

$ timeout 60 node --test tests/evals-builder/plan.test.mjs   (segmento check)
✔ plan: reconstruye solo la historia N, sin resultados ni líneas de devolución (1.326307ms)
✔ plan: en el repo hijo, Verification entra con cd a la subcarpeta (0.227275ms)
✔ plan: kit-check y kit-scope no salen con 2 sobre el plan reconstruido (148.160219ms)
✔ plan: escribe el plan en la copia y copia decisions.md solo si existe (0.66408ms)
✔ plan: la fuente se lee del HEAD del repo raíz (27.499683ms)
ℹ tests 5
ℹ pass 5
ℹ fail 0
exit 0

$ node scripts/kit-check.mjs <plan reconstruido de prueba, segmento 2> --segment 2
A2 | pasa | node -e "process.exit(0)" | -
kit-check: pasa=1 falla=0 bloqueado=0 no-automatizable=0 revisado=0
exit 0

$ node scripts/kit-scope.mjs <plan reconstruido de prueba, segmento 2>
resumen: ok 0, aviso 1, error 32, no verificable 0
codigo: 1
exit 1
(kit-scope compara los cambios del repo del kit con el Scope de prueba, no la copia; el código 1 no es el 2 que exige A3.)

Segmento 4 (`tramo-4.md`), desde `/home/franco/Codes/flucastr/Flucastr.AI`:

$ timeout 60 node --test tests/evals-builder/calibrar.test.mjs   (antes de crear `calibrar.mjs`; esperado rojo)
✖ tests/evals-builder/calibrar.test.mjs — Cannot find module .../evals/builder/lib/calibrar.mjs
ℹ fail 1
exit 1

$ timeout 60 node --test tests/evals-builder/calibrar.test.mjs   (segmento check)
✔ calibrar: válido cuando la base falla, la referencia pasa y kit-check no falla
✔ calibrar: base verde da motivo base-verde
✔ calibrar: referencia roja da motivo referencia-roja
✔ calibrar: kit-check en falla da motivo kit-check-falla
✔ calibrar: calibracion.json lleva el hash del corpus y no contiene salida ni rutas
✔ calibrar: orden desconocida sale con código 2
ℹ tests 6
ℹ pass 6
ℹ fail 0
exit 0
Fingerprint: 67355a0b76db   (árbol del repo, calculado con `fingerprintCurrent` sin borrar resultados)

$ timeout 120 node --test tests/evals-builder/*.test.mjs   (todas las pruebas del banco)
ℹ tests 25
ℹ pass 25
ℹ fail 0
exit 0

$ node evals/builder/bench.mjs no-existe
bench: orden desconocida: no-existe
exit 2

$ node evals/builder/bench.mjs calibrar --salida <temporal>   (sin ejecutor real)
calibrar: la corrida real necesita los repos de local.json y Docker; la hace la persona (tramo-4.md)
exit 1   (sin calibracion.json escrito)

$ docker info   (dependencia externa; solo corridas reales, no la prueba del tramo)
exit 1   (Docker no responde desde el sandbox; no bloquea el tramo, ver D-12)

Reenvío tras devolución (builder, segmentos 3 y 4, desde `/home/franco/Codes/flucastr/Flucastr.AI`):

$ timeout 60 node --test tests/evals-builder/plan.test.mjs   (segmento 3, tras la devolución A3)
✔ plan: reconstruye solo la historia N, sin resultados ni líneas de devolución (1.332507ms)
✔ plan: todas las casillas quedan vacías aunque la fuente las marque (A3) (0.260685ms)
✔ plan: en el repo hijo, Verification entra con cd a la subcarpeta (0.187742ms)
✔ plan: kit-check y kit-scope no salen con 2 sobre el plan reconstruido (142.331678ms)
✔ plan: escribe el plan en la copia y copia decisions.md solo si existe (0.714775ms)
✔ plan: la fuente se lee del HEAD del repo raíz (29.174237ms)
ℹ tests 6
ℹ pass 6
ℹ fail 0
exit 0

$ node <scratchpad>/a3/check.mjs   (las 16 fuentes reales; solo IDs y conteos)
sin casillas marcadas: 16 de 16
exit 0

$ timeout 60 node --test tests/evals-builder/calibrar.test.mjs   (segmento 4, antes de implementar `ejecutarTramo`, con su prueba ya escrita)
✖ tests/evals-builder/calibrar.test.mjs (35.368782ms)
  'test failed'
ℹ fail 1
exit 1

$ timeout 60 node --test tests/evals-builder/calibrar.test.mjs   (segmento check, tras `prepararTramo` y `ejecutarTramo`)
✔ calibrar: ejecutor real con raíz sola: base falla, referencia pasa, kit-check no falla y se borra la copia (A4) (245.036395ms)
✔ calibrar: ejecutor real con repo hijo: la verificación entra con cd y la base sale del hijo (A4) (295.814685ms)
✔ calibrar: prepararTramo deja la copia lista con el plan y la base, sin Files de la referencia (A4) (133.819749ms)
✔ calibrar: --local falso con un repo inexistente da motivo fijo y sale con 0 (A4) (1.148445ms)
✔ calibrar: --tramos con un ID desconocido sale con código 2 (0.618099ms)
ℹ tests 11
ℹ pass 11
ℹ fail 0
exit 0

$ timeout 120 node --test tests/evals-builder/*.test.mjs   (banco completo, regresión)
ℹ tests 31
ℹ pass 31
ℹ fail 0
exit 0

$ node evals/builder/bench.mjs no-existe
bench: orden desconocida: no-existe
exit 2

$ awk '/^- \[ \]/ { n++ } END { print n+0 }' changes/evals-builder/tramo-4.md
0
exit 0

Tercera relanzada, segmento 3 (builder, 2026-11-26, desde `/home/franco/Codes/flucastr/Flucastr.AI`; D-17):

$ timeout 60 node --test tests/evals-builder/plan.test.mjs   (segmento 3, tras *Verification* entre comillas y el punto final de `Files:`)
✔ plan: reconstruye solo la historia N, sin resultados ni líneas de devolución (1.419222ms)
✔ plan: todas las casillas quedan vacías aunque la fuente las marque (A3) (0.256936ms)
✔ plan: en el repo hijo, Verification entra con cd a la subcarpeta (0.19316ms)
✔ plan: tools/run lee el comando de Verification del plan reconstruido (A3) (0.325814ms)
✔ plan: quita el punto final de la última ruta de Files: (A3) (0.200351ms)
✔ plan: kit-check y kit-scope no salen con 2 sobre el plan reconstruido (141.710925ms)
✔ plan: escribe el plan en la copia y copia decisions.md solo si existe (0.564427ms)
✔ plan: la fuente se lee del HEAD del repo raíz (27.779928ms)
ℹ tests 8
ℹ pass 8
ℹ fail 0
exit 0

Tercera relanzada, segmento 4 (builder, 2026-11-26, desde `/home/franco/Codes/flucastr/Flucastr.AI`; D-17, D-18):

$ timeout 60 node --test tests/evals-builder/calibrar.test.mjs   (segmento 4, tras `comandoVerificacion`, el punto final y `error-preparacion`)
✔ calibrar: válido cuando la base falla, la referencia pasa y kit-check no falla (1.299419ms)
✔ calibrar: base verde da motivo base-verde (0.120407ms)
✔ calibrar: referencia roja da motivo referencia-roja (0.095067ms)
✔ calibrar: kit-check en falla da motivo kit-check-falla (0.095956ms)
✔ calibrar: calibracion.json lleva el hash del corpus y no contiene salida ni rutas (1.032047ms)
✔ calibrar: orden desconocida sale con código 2 (26.339749ms)
✔ calibrar: ejecutor real con raíz sola: base falla, referencia pasa, kit-check no falla y se borra la copia (A4) (236.647662ms)
✔ calibrar: ejecutor real con repo hijo: la verificación entra con cd y la base sale del hijo (A4) (296.360782ms)
✔ calibrar: prepararTramo deja la copia lista con el plan y la base, sin Files de la referencia (A4) (145.013813ms)
✔ calibrar: --local falso con un repo inexistente da motivo fijo y sale con 0 (A4) (1.52595ms)
✔ calibrar: --tramos con un ID desconocido sale con código 2 (0.802474ms)
✔ calibrar: Files: con punto final aplica la referencia de esa ruta (A4) (245.613858ms)
✔ calibrar: ruta propia sin base ni referencia da error-preparacion (A4) (170.044845ms)
ℹ tests 13
ℹ pass 13
ℹ fail 0
exit 0

$ timeout 120 node --test tests/evals-builder/*.test.mjs   (banco completo, regresión)
ℹ tests 35
ℹ pass 35
ℹ fail 0
exit 0

$ node evals/builder/bench.mjs no-existe
bench: orden desconocida: no-existe
exit 2

$ awk '/^- \[ \]/ { n++ } END { print n+0 }' changes/evals-builder/tramo-4.md
0
exit 0

$ awk '/^- \[ \]/ { n++ } END { print n+0 }' changes/evals-builder/tramo-3.md
0
exit 0

$ node scripts/kit-verificado.mjs estado --nivel rapida   (solo lectura; no es la verificación final, que no toca este segmento)
Fingerprint: 3d27f7a9ce7e
verificar: motivo=huella_distinta
exit 1

Segmento 5 (`tramo-5.md`), desde `/home/franco/Codes/flucastr/Flucastr.AI`:

$ timeout 60 node --test tests/evals-builder/variante.test.mjs   (antes de crear `evals/builder/lib/variante.mjs` y `base.json`; esperado rojo; cola)
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 43.25367

✖ failing tests:

test at tests/evals-builder/variante.test.mjs:1:1
✖ tests/evals-builder/variante.test.mjs (36.179621ms)
  'test failed'
exit 1

$ timeout 60 node --test tests/evals-builder/variante.test.mjs   (segmento check, con `variante.mjs` y `base.json`; `base.json` se creó antes del módulo y su prueba corre en esta misma corrida)
✔ variante: aplica contrato, nivel, esfuerzo y ventana en la copia; models.json del repo igual (A5) (7.092108ms)
✔ variante: HOME temporal enlaza .agents/skills a la copia y .codex a la carpeta real (A5) (1.870869ms)
✔ variante: huellas separadas; cambiar solo el contrato no cambia la del kit (A5) (3.564438ms)
✔ variante: contrato nulo, igual al base, o valores inválidos fallan con 2 y no dejan destino (A5) (1.349427ms)
✔ variante: al limpiar, el destino de los enlaces queda intacto y no se lee la carpeta de Codex (A5) (1.872529ms)
✔ variante base: solo nombre; la copia queda con los mismos valores del kit (A5) (1.582397ms)
ℹ tests 6
ℹ pass 6
ℹ fail 0
exit 0

$ node -e <prepararVariante(evals/builder/variantes/base.json) sobre el árbol real; huellas, env, limpiar> (humo fuera del banco)
kit b50ff4bfa59e contrato acdb03920f08
env FLUCASTR_MODELOS ok: true
skills enlazadas: 7
tras limpiar, existe copia: false home: false
exit 0

Pendientes de `tramo-5.md`: 0 (contado con `pendientes-plan` / awk). Sin commit; ningún repo fuente se escribió.

Segmento 6 (`tramo-6.md`), desde `/home/franco/Codes/flucastr/Flucastr.AI`, parcial (el segmento sigue `in progress`):

$ timeout 60 node --test tests/evals-builder/senal.test.mjs   (antes de añadir `senal` a `scripts/kit-run.mjs`; esperado rojo)
✖ senal: un builder que muere con thrashing deja senal thrashing y clase infra en cada intento (A6)
✖ senal: un intento DONE deja senal null y clase null (A6)
ℹ tests 2 · ℹ pass 0 · ℹ fail 2
exit 1

$ timeout 60 node --test tests/evals-builder/senal.test.mjs   (tras añadir `senal` a `scripts/kit-run.mjs`)
✔ senal: un builder que muere con thrashing deja senal thrashing y clase infra en cada intento (A6)
✔ senal: un intento DONE deja senal null y clase null (A6)
ℹ tests 2 · ℹ pass 2 · ℹ fail 0
exit 0

$ timeout 88 node tests/kit-run/run.mjs   (tras añadir `senal`)
ok … (51 casos ok)
FALLO R1 registro: una corrida aprobada deja 1 línea con los 18 campos y duraciones enteras ≥ 0
  + actual: incluye 'senal' · esperado: los 18 campos de CAMPOS_REGISTRO (tests/kit-run/run.mjs:541)
kit-run: 1 caso(s) fallaron
exit 1

$ rg -n 'senal' docs/kit-run.md | wc -l
1

Pendientes de `tramo-6.md`: 1 (casilla 2, `senal` en `scripts/kit-run.mjs`, por R1).

Continuación segmento 6 (builder, 2026-11-26, desde `/home/franco/Codes/flucastr/Flucastr.AI`; D-19):

$ git diff tests/kit-run/run.mjs   (casilla R1; salida real, recortada a las 4 líneas cambiadas, con «…» donde se omite texto)
@@ -538,14 +538,14 @@ caso("V5 la nota del plan lleva revisor=<modelo>:<esfuerzo>", () => {
-const CAMPOS_REGISTRO = [… "resuelto_por"];
+const CAMPOS_REGISTRO = [… "resuelto_por", "senal"];
-// R1: … 18 campos …
+// R1: … 19 campos …
-caso("R1 registro: … 18 campos …
+caso("R1 registro: … 19 campos …
exit 0

$ timeout 60 node --test tests/evals-builder/senal.test.mjs   (segment check, parte 1; cola)
ℹ tests 2
ℹ pass 2
ℹ fail 0
ℹ duration_ms 808.971138
exit 0

$ timeout 88 node tests/kit-run/run.mjs   (segment check, parte 2; casilla kit-run.mjs)
ok puerta-verde-revisor: con la puerta en verde el revisor recibe su resultado
ok puerta-roja-relanza: A# en rojo no llega al revisor y el builder recibe la lista exacta y el resumen
ok puerta-fuera-de-alcance: un archivo fuera de Scope bloquea sin revisor y la segunda falla pide consejo con motivo scope
ok puerta-tercer-fallo: la segunda corrida con la puerta en rojo pide consejo con exit 1 y sin revisor
ok runs-report-puerta: el informe acepta el motivo puerta y los campos nuevos
ok D1 progreso normal: con avance cada 100 ms no hay corte aunque el modo sea cortar
ok D2 cortar: bucle de sondeos sin avance deja PAUSED motivo=access, partial, nota y casillas intactas
ok D3 observar: el bucle de sondeos no corta y queda registrado en runs.jsonl y progress.jsonl
ok D4 comando declarado largo: ./verify en curso sin escribir no se corta
ok D5 KIT_RUN_PEGADO=0: no se evalúa nada aunque haya bucle de sondeos
ok M2 mutación sensible: sin la compuerta de la puerta la roja-relanza falla
kit-run: 52 casos pasaron
exit 0

Segmento 6 completo: `senal.test.mjs` 2/2 y `kit-run` 52/52 (el R1 pasa con los 19 campos). Casillas de `tramo-6.md`: 4/4.

Segmento 7 (`tramo-7.md`), desde `/home/franco/Codes/flucastr/Flucastr.AI` (builder, 2026-11-26):

$ timeout 60 node --test tests/evals-builder/metricas.test.mjs   (antes de crear `evals/builder/lib/metricas.mjs`; esperado rojo; cola)
ℹ tests 1
ℹ pass 0
ℹ fail 1
ℹ duration_ms 36.669843

✖ failing tests:

test at tests/evals-builder/metricas.test.mjs:1:1
✖ tests/evals-builder/metricas.test.mjs (30.216915ms)
  'test failed'
exit 1

$ timeout 60 node --test tests/evals-builder/metricas.test.mjs   (segment check, con `metricas.mjs`; líneas «✔» con su duración)
✔ metricas: dos intentos y DONE dan relanzamientos 1 y líneas 20/80 con razón 0.25 (A7) (2.594126ms)
✔ metricas: tiene todos los campos de «Métricas» (A7) (0.24756ms)
✔ metricas: segundos, compactaciones, créditos y tokens salen de los datos sin inventar (A7) (0.247083ms)
✔ metricas: dato ausente da null, nunca 0 (A7) (0.182258ms)
✔ metricas: una sesión sin tarifa deja créditos null y cuenta sin_tarifa (A7) (0.167891ms)
✔ metricas: muertes por infraestructura y thrashing; claude verifica la firma, codex no (A7) (0.220588ms)
✔ metricas: resultado distingue DONE, PAUSED, entorno e invalida (A7) (0.286556ms)
✔ metricas: contrato_ok exige citar la copia y no la instalación viva (A7) (0.205426ms)
✔ metricas: lineas excluye changes/, docs/, .md y lockfiles; prueba es tests y *.test.* (0.226865ms)
✔ metricas: referencia suma archivos y líneas; sin intentos, lo que depende de ellos es null (A7) (0.284599ms)
✔ metricas: el resultado no incluye rutas de los cambios (D-05) (0.216957ms)
ℹ tests 11
ℹ pass 11
ℹ fail 0
ℹ duration_ms 52.274619
exit 0

Pendientes de `tramo-7.md`: 0 (contado con awk).

Segmento 8 (builder, 2026-11-26): `tramo-8.md` 4/4 casillas.
$ timeout 60 node --test tests/evals-builder/correr.test.mjs
exit 1 (antes del módulo: Cannot find module correr.mjs)
$ timeout 60 node --test tests/evals-builder/correr.test.mjs
ℹ tests 11 / pass 11 / fail 0 — exit 0 (A8, A9)
$ timeout 60 node --test tests/evals-builder/calibrar.test.mjs
ℹ tests 13 / pass 13 — exit 0 (regresión de prepararTramo)
$ timeout 300 node --test tests/evals-builder/*.test.mjs
ℹ tests 65 / pass 65 / fail 0 — exit 0
$ node evals/builder/bench.mjs correr
correr: falta --salida (o --output) — exit 2
Fingerprint: no lo imprimen `node --test` ni `bench.mjs` (no hay línea `Fingerprint:` en estas salidas).

Tercera relanzada, segmento 5 (builder, 2026-11-26, desde `/home/franco/Codes/flucastr/Flucastr.AI`; D-26):

$ timeout 60 node --test tests/evals-builder/variante.test.mjs   (segmento 5, tras `adapters/` en la copia, huella `modelos` aparte y la prueba nueva)
ℹ tests 7
ℹ pass 7
ℹ fail 0
exit 0

$ timeout 60 node --test tests/evals-builder/correr.test.mjs   (tras quitar la copia de `adapters/` de `correr.mjs`)
ℹ tests 21
ℹ pass 21
ℹ fail 0
exit 0

$ timeout 300 node --test tests/evals-builder/*.test.mjs   (banco completo, regresión)
ℹ tests 76
ℹ pass 76
ℹ fail 0
exit 0

$ awk '/^- \[ \]/ { n++ } END { print n+0 }' changes/evals-builder/tramo-5.md
0
exit 0

Segmento 9 (`tramo-9.md`), desde `/home/franco/Codes/flucastr/Flucastr.AI` (builder, 2026-11-26):

$ timeout 60 node --test tests/evals-builder/comparar.test.mjs   (antes de crear `comparar.mjs`; esperado rojo; cola)
ℹ pass 0
ℹ fail 1
✖ tests/evals-builder/comparar.test.mjs (39.427344ms)
exit 1

$ timeout 60 node --test tests/evals-builder/comparar.test.mjs   (segment check, con `comparar.mjs` y `contrato-b.json`)
ℹ tests 8
ℹ pass 8
ℹ fail 0
exit 0

$ node -e <leerVariante(evals/builder/variantes/contrato-b.json)>   (A10: las dos rutas en null; antes del JSON, la lectura fallaba con ENOENT)
ruta de contrato inválida: builder codigo 2
exit 2

$ node evals/builder/bench.mjs comparar <carpeta-a> <carpeta-b>   (dos corridas ficticias en el scratchpad, borradas al terminar)
comparar: pareadas n=3, excluidas=1
difieren: contrato, modelos
par      A     B       dif_relanzamientos  dif_segundos
K-01-r1  DONE  PAUSED  2                   300
K-02-r1  DONE  DONE    -1                  -150
K-04-r1  DONE  DONE    0                   0
excluidos:
K-03-r1 A entorno
A: n=3 done=1 sin_intervencion=1 mediana_relanzamientos=0 mediana_segundos=100 mediana_tokens=110 mediana_creditos=1
B: n=3 done=0.6667 sin_intervencion=0.6667 mediana_relanzamientos=0 mediana_segundos=100 mediana_tokens=110 mediana_creditos=1
por tamaño:
tamaño          A_n  A_done  B_n  B_done
hasta-60        3    1       2    0.5
61-150          0    -       0    -
mas-de-150      0    -       1    1
sin-referencia  0    -       0    -
exit 0

$ node evals/builder/bench.mjs comparar <carpeta-a>   (una sola carpeta)
corrida: n=3 excluidas=1
excluidos:
K-03-r1 entorno
resumen: n=3 done=1 sin_intervencion=1 mediana_relanzamientos=0 mediana_segundos=100 mediana_tokens=110 mediana_creditos=1
(tabla por tamaño igual que arriba)
exit 0

$ node evals/builder/bench.mjs comparar <carpeta-a> <carpeta-b-con-semilla-2>   (no pareable)
comparar: corridas no pareables (semilla)
exit 2

$ awk '/^- \[ \]/ { n++ } END { print n+0 }' changes/evals-builder/tramo-9.md
0
exit 0

Segmento 10 (`tramo-10.md`), desde `/home/franco/Codes/flucastr/Flucastr.AI` (builder, 2026-11-26):

$ rg -n 'calibrar|correr|comparar|contrato-b' evals/builder/README.md | wc -l
13
exit 0   (las cuatro palabras aparecen; el README trae los comandos de calibrar, correr, comparar y contrato-b)

$ rg -n 'builder/README.md' evals/README.md
29:El [banco del builder](builder/README.md) calibra un corpus de tramos históricos, corre una variante con semilla fija y compara dos corridas pareadas. Sus pruebas (`tests/evals-builder/`) no llaman a Codex ni a la red y forman parte de `./verify`.
exit 0   (una línea)

$ node --test tests/evals-builder/*.test.mjs
ℹ tests 84
ℹ pass 84
ℹ fail 0
exit 0

$ ./verify   (paso 26 «banco del builder: tests/evals-builder/*.test.mjs»; salida real del resumen)
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 215ba3a21046
VERIFY OK
verify exit 0

$ awk '/^- \[ \]/ { n++ } END { print n+0 }' changes/evals-builder/tramo-10.md
0
exit 0

### Segmento 9, paso «medianas y totales» (builder, 2026-11-26)

$ node --test tests/evals-builder/comparar.test.mjs   (antes del cambio, rojo: la prueba nueva falla)
AssertionError: actual undefined, expected 2 (medianas.compactaciones)
exit 1

$ node --test tests/evals-builder/comparar.test.mjs   (después del cambio)
ℹ tests 9
ℹ pass 9
ℹ fail 0
exit 0

### Segmento 10, README y variante B (builder, 2026-11-26)

$ extraer el bloque ```json de la sección 5 de evals/builder/README.md a un temporal y llamar a leerVariante sobre él (awk + node -e, temporal borrado)
aceptado contrato-b ["builder","execute_plan"]
exit 0

Lectura de README contra `calibrar.mjs` (motivos de descarte), `correr.mjs` (mínimo de 10 tramos válidos), `variante.mjs` y `copia.mjs` (limpieza: copias, HOME temporal con enlaces, `~/.codex` sin tocar) y `comparar.mjs` (campos de medianas y totales): sin contradicciones.

$ node --test tests/evals-builder/*.test.mjs   (paso 1 de Verification)
ℹ tests 85
ℹ pass 85
ℹ fail 0
exit 0

$ ./verify   (Verification, paso 2 tras el banco; `timeout 370 ./verify`; corrida 1 de 3 finales; 199 s)
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: ae9cc3ed3386
VERIFY OK
exit 0

### Segmento 11, `tramo-11.md` (builder, 2026-11-27)

$ timeout 60 node --test --test-name-pattern="se toma de ella" tests/evals-builder/calibrar.test.mjs   (A4, antes del cambio: filtro temporal «HEAD para toda citada»; esperado rojo)
✖ calibrar: prueba citada presente en la referencia se toma de ella, no de HEAD; la ausente sí de HEAD (A4)
exit 1   (arreglo restaurado después)

$ timeout 120 node --test tests/evals-builder/correr.test.mjs tests/evals-builder/calibrar.test.mjs
ℹ tests 37
ℹ pass 37
ℹ fail 0
exit 0

$ timeout 300 node --test tests/evals-builder/*.test.mjs   (banco completo)
ℹ tests 88
ℹ pass 88
ℹ fail 0
exit 0

$ timeout 398 ./verify   (comprobación de segmento, nivel 3; corrida 2 de 3 de *Verification* sobre el árbol actual)
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 019b8469cb84
VERIFY OK
exit 0

$ node scripts/kit-verificado.mjs estado --nivel aceptacion
Fingerprint: 019b8469cb84
ya verificado: nivel=aceptacion fase=26
exit 0

$ awk '/^- \[ \]/ { n++ } END { print n+0 }' changes/evals-builder/tramo-11.md
0
exit 0

Segmento 12 (`tramo-12.md`), desde `/home/franco/Codes/flucastr/Flucastr.AI` (builder, 2026-11-27):

$ timeout 60 node --test tests/evals-builder/metricas.test.mjs   (antes del cambio, con una copia temporal de `metricas.mjs` con la lógica anterior de `msDe` y del total: 3 pruebas rojas, incluidas las dos nuevas del ejemplo y del PAUSED)
✖ metricas: el tiempo suma las fases registradas de cada intento; sin revisor, esa fase no cuenta (A7, D-32)
✖ metricas: un PAUSED sin revisor da total con builder y verify (A7, D-32)
✖ metricas: dato ausente da null, nunca 0 (A7)
exit 1   (corrida temporal; el archivo del repo no cambió)

$ timeout 60 node --test tests/evals-builder/metricas.test.mjs   (después del cambio)
ℹ tests 13
ℹ pass 13
ℹ fail 0
exit 0

$ timeout 120 node --test --test-name-pattern="A13" tests/evals-builder/correr.test.mjs   (la prueba de kit run fallido, tras el cambio)
✔ main: cada par deja runs.jsonl y la salida de kit run en logs, sin rutas en resultados (A13, D-33)
✔ main: un kit run que falla (builder inexistente) deja su intento entorno y la salida en logs (A13, D-33)
exit 0   (la segunda prueba se renombró y cambió tras esta corrida; queda cubierta por el banco completo)

$ timeout 300 node --test tests/evals-builder/*.test.mjs   (banco completo, paso 1 de Verification)
ℹ tests 92
ℹ pass 92
ℹ fail 0
exit 0

$ timeout 398 ./verify   (paso 2 de Verification; corrida 1 de 3 finales; tope 2x de 199 s medidos en el tramo 10; ~200 s)
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: a0dd43a70849
VERIFY OK
exit 0

$ node scripts/kit-verificado.mjs estado --nivel aceptacion   (después del verify; solo lectura)
Fingerprint: 44e038498cd2
verificar: motivo=huella_distinta
(la huella ahora difiere de la registrada; ver Revisar)

$ awk '/^- \[ \]/ { n++ } END { print n+0 }' changes/evals-builder/tramo-12.md
0
exit 0

Segmento 13 (`tramo-13.md`), desde `/home/franco/Codes/flucastr/Flucastr.AI` (builder, 2026-11-27), parcial:

$ timeout 60 node --test tests/evals-builder/corpus.test.mjs
ℹ tests 7
ℹ pass 7
ℹ fail 0
exit 0

$ timeout 60 node --test tests/evals-builder/calibrar.test.mjs
✔ calibrar: un tramo excluido se reporta sin ejecutarlo (A14, D-36) (ver tramo-13.md)
ℹ tests 16
ℹ pass 16
ℹ fail 0
exit 0

Comprobación de segmento `node --test tests/evals-builder/*.test.mjs`: no ejecutada (sin duración registrada; pausa `motivo=verify`).

### Segmento 14, `tramo-14.md` (builder, 2026-11-27)

$ timeout 60 node --test tests/evals-builder/copia.test.mjs   (paso 1: copia con contrato)
ℹ tests 8
ℹ pass 8
ℹ fail 0
exit 0

$ timeout 60 node --test tests/evals-builder/calibrar.test.mjs   (paso 2: K cambia, P no; sin contrato explícito, el del kit)
ℹ tests 17
ℹ pass 17
ℹ fail 0
exit 0

$ timeout 120 node --test tests/evals-builder/correr.test.mjs   (paso 3: contrato_ok con ruta relativa en K)
ℹ tests 25
ℹ pass 25
ℹ fail 0
exit 0

$ timeout 300 node --test tests/evals-builder/*.test.mjs   (comprobación de segmento, nivel 2; 7 s, medición previa 5 s, tope 2x = 10 s)
ℹ tests 96
ℹ pass 96
ℹ fail 0
ℹ duration_ms 6965.709478
exit 0

### Segmento 15, `tramo-15.md` (builder, 2026-11-27)

$ timeout 120 node --test tests/evals-builder/correr.test.mjs tests/evals-builder/metricas.test.mjs tests/evals-builder/comparar.test.mjs   (pasos 1 a 3: oraculo_pasa, metricas, comparar)
ℹ tests 48
ℹ pass 48
ℹ fail 0
exit 0

$ timeout 300 node --test tests/evals-builder/*.test.mjs   (comprobación de segmento, nivel 2; 6,3 s real)
ℹ tests 97
ℹ pass 97
ℹ fail 0
exit 0

### Segmento 16, `tramo-16.md` (builder, 2026-11-27)

$ timeout 60 node --test tests/evals-builder/plan.test.mjs   (paso 1: extra de Scope y bloqueDe)
ℹ tests 11
ℹ pass 11
ℹ fail 0
exit 0

$ timeout 120 node --test tests/evals-builder/calibrar.test.mjs   (paso 2: ocultarOraculo en raíz e hijo, oraculoOcultas)
ℹ tests 21
ℹ pass 21
ℹ fail 0
exit 0

$ timeout 180 node --test tests/evals-builder/correr.test.mjs   (paso 3: builder falso crea la prueba oculta)
ℹ tests 26
ℹ pass 26
ℹ fail 0
exit 0

$ timeout 300 node --test tests/evals-builder/*.test.mjs   (comprobación de segmento, nivel 2; 7,1 s real)
ℹ tests 105
ℹ pass 105
ℹ fail 0
exit 0

Fingerprint: no lo imprime `node --test`.

### Segmento 17, `tramo-17.md` (builder, 2026-11-27)

$ timeout 300 node --test tests/evals-builder/*.test.mjs   (paso 1 de la comprobación de segmento)
ℹ tests 105
ℹ pass 105
ℹ fail 0
exit 0

$ rg -n 'oraculo_pasa|excluido|K-02,P1-03' evals/builder/README.md   (check del tramo: las tres cadenas)
exit 0 (líneas 23, 36, 52, 76, 102 y las de excluido)

$ rg -n 'pruebas_alteradas|`oraculo`' evals/builder/README.md   (sin restos del vocabulario viejo)
exit 1 (sin coincidencias)

$ timeout 398 ./verify   (paso 2, nivel 3; en segundo plano, 36 pasos)
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: fb6ea8e88855
VERIFY OK
exit 0

Segmento 18 (`tramo-18.md`, builder, 2026-11-27, desde `/home/franco/Codes/flucastr/Flucastr.AI`; último segmento, con *Verification* completa):

$ rg -n 'changes/done/evals-builder/linea-base.md' evals/builder/README.md
3:> **Aviso: la línea base del 2026-11-27 no sirve para decidir un A/B.** ... `changes/done/evals-builder/linea-base.md` ...
144:- **Línea base no válida.** ... `changes/done/evals-builder/linea-base.md`. ...
exit 0

$ rg -n 'evals/builder' TODO.md
58:## Banco de pruebas del builder (`evals/builder/`)
60:- La línea base del 2026-11-27 no sirve para decidir un A/B (`changes/done/evals-builder/linea-base.md`, D-43). ...
exit 0

$ rg -n 'changes/evals-builder' evals/builder/README.md   (A18: sin resultados)
exit 1

$ timeout 60 node --test tests/evals-builder/corpus.test.mjs   (segment check)
✔ corpus: 16 tramos, 8 calibrados, 6 reservas y 2 excluidos, IDs únicos y los del corpus (2.034338ms)
ℹ tests 7
ℹ pass 7
ℹ fail 0
exit 0

$ awk '/^- \[ \]/ { n++ } END { print n+0 }' changes/evals-builder/tramo-18.md
0
exit 0

$ timeout 300 node --test tests/evals-builder/*.test.mjs   (Verification, parte 1)
ℹ tests 105
ℹ pass 105
ℹ fail 0
exit 0

$ timeout 398 ./verify   (Verification, parte 2; detalle en pruebas/.temporales/verify.log)
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 3fce0d651256
VERIFY OK
verify exit 0

Notas de la corrección: el README decía «Quedan justo 10 tramos válidos»; con K-03 y K-05 excluidos (D-36) el corpus tiene 8 calibrados (el test del corpus lo confirma). Se corrigió la frase en `evals/builder/README.md` sección 6 (D-27, D-42).

## Notes

Checkpoint segmento 18 (final): archivos cambiados: `evals/builder/README.md` (aviso al inicio, defectos 1 a 4 en «Límites», rutas bajo `changes/done/evals-builder/`, corrección del conteo de tramos válidos), `TODO.md` (sección «Banco de pruebas del builder»), y las casillas de `tramo-18.md`. Sin commit, sin push, sin tocar `changes/done/`.
Resultado: segment check pasa; *Verification* completa pasa (banco 105/105; `./verify` exit 0, Fingerprint 3fce0d651256). Casillas de `tramo-18.md`: 2/2.
Revisar (planner): la carpeta `changes/evals-builder/` debe moverse a `changes/done/evals-builder/` (y los enlaces del README ya la apuntan ahí); la línea base no es válida (D-43) y el planner decide su cierre.

Checkpoint segmento 17 (builder, 2026-11-27): README al día con el código (A11). `evals/builder/README.md`: `resultado` sin «pruebas alteradas»; `oraculo_pasa` sustituye a `oraculo` y `pruebas_alteradas`; `calibrar` con `excluido` (D-36) y motivos; recalibrar con carpeta de salida nueva; humo `--tramos K-02,P1-03`; pruebas ocultas (D-34, D-41), contrato K (D-35); `comparar` con la tasa y las columnas de `oraculo_pasa`; límite de `calibrar` dentro de Codex y 10 tramos. Revisar: los puntos de Notes del tramo 16 siguen abiertos.

Checkpoint segmento 16 (builder, 2026-11-27): pruebas de referencia ocultas al builder (A17, D-41). `evals/builder/lib/calibrar.mjs`: `oraculoOcultas` elige las pruebas del oráculo que el bloque nombra (token completo o sufijo `/`; por nombre de archivo solo si es único); `prepararTramo({ ocultarOraculo })` las añade a Scope con el prefijo del repo hijo, no las escribe en la copia y las registra con el hash de la referencia; `reaplicarOraculo` las escribe al medir. `correr` activa la opción; `calibrar` no cambia. `plan.mjs`: `reconstruirPlan({ extra })` añade a Scope sin tocar `Files:`; `bloqueDe` se exporta. Revisar: (1) aparecieron dotfiles sin seguir en la raíz del repo (`.bashrc`, `.zshrc`, `.gitconfig` y otros) que no estaban al inicio; el builder no los creó ni los tocó. (2) `tests/evals-builder/calibrar.test.mjs` cambió en disco durante el segmento; se conserva su contenido actual. (3) Ninguna prueba ejecuta `kit-scope` sobre las ocultas; el alcance se cubre porque van en Scope y el caso de `correr` termina en DONE. (4) La corrida real con Codex y `calibrar` real no se hicieron.

Checkpoint segmento 15 (builder, 2026-11-27): las pruebas de referencia como señal (A16, D-37, D-40). `evals/builder/lib/correr.mjs`: tras cada par con intentos, `oraculoPasa(copia)` reaplica las pruebas de referencia (si el hash no coincide, null sin verificar) y corre `verificar("oraculo")`, cuya salida va a `<salida>/logs`; una verificación que lanza error da null. Líneas y sesiones se miden antes de reaplicar. `evals/builder/lib/metricas.mjs`: publica `oraculo_pasa` (true, false o null) y ya no `oraculo` ni `pruebas_alteradas`; `resultado` no lo usa. `evals/builder/lib/comparar.mjs`: `resumirCorrida` da `tasas.oraculo_pasa` sobre los pares con dato y `con_oraculo`; `formatearPares` añade `oraculo_A` y `oraculo_B` (`-` sin dato). Pruebas: `correr.test` (verde, rojo, sin hash y excepción; los logs incluyen el paso oraculo), `metricas.test` (DONE con señal false), `comparar.test` (tasa sobre pares con dato y `-`). Banco 97/97 en 6 s; exit 0. Pendientes de `tramo-15.md`: 0 (contado con awk). Archivos: `evals/builder/lib/correr.mjs`, `evals/builder/lib/metricas.mjs`, `evals/builder/lib/comparar.mjs`, `tests/evals-builder/correr.test.mjs`, `tests/evals-builder/metricas.test.mjs`, `tests/evals-builder/comparar.test.mjs`, `changes/evals-builder/tramo-15.md` (3 casillas), `changes/evals-builder/decisions.md` (D-40), este plan (*Evidence*, *Notes*, frontmatter `segment: 16`). Sin commit; repos fuente no tocados; `local.json` no se leyó.
Revisar: (1) `evals/builder/README.md` (líneas 68 y 70) aún nombra `pruebas_alteradas` y `oraculo`; A11 del tramo 17 lo corrige. (2) Un par con `entorno` también corre la verificación (D-40): cuesta tiempo y su `oraculo_pasa` no dice nada del builder; `comparar` ya lo excluye. (3) La señal no está medida en una corrida real: la corrida base la hace la persona.

Checkpoint segmento 14 (builder, 2026-11-27): el contrato de la variante también en los tramos K (A15, D-35, D-39). `evals/builder/lib/copia.mjs`: `CONTRATO_RUTAS`, `contratoDe(dir)` y `prepararCopia({ contrato })`, que escribe el contrato en la raíz solo si el archivo existe en la base, antes del commit sintético. `evals/builder/lib/calibrar.mjs`: `prepararTramo({ contrato })` (por omisión, el del kit actual) lo aplica solo con `alias === "K"`. `evals/builder/lib/correr.mjs`: la copia recibe el contrato de la variante (`contratoDe(kitDestino)`) y `contrato_ok` acepta en K la ruta relativa `core/skills/execute-plan/SKILL.md`; la ruta viva sigue invalidando. Pruebas nuevas: `copia.test` (contrato escrito o no según la base, `git status` vacío), `calibrar.test` (K con contrato explícito, P sin cambio, K por omisión), `correr.test` (builder que lee en modo relativo, `contrato_ok` true y contenido de la variante). Banco 96/96 en 7 s; exit 0. Pendientes de `tramo-14.md`: 0 (contado con awk). Archivos: `evals/builder/lib/copia.mjs`, `evals/builder/lib/calibrar.mjs`, `evals/builder/lib/correr.mjs`, `tests/evals-builder/copia.test.mjs`, `tests/evals-builder/calibrar.test.mjs`, `tests/evals-builder/correr.test.mjs`, `changes/evals-builder/tramo-14.md` (3 casillas), `changes/evals-builder/decisions.md` (D-39), este plan (*Evidence*, *Notes*, frontmatter `segment: 15`). Diff dentro de *Scope*; sin commit; repos fuente no tocados; `local.json` no se leyó.
Revisar: (1) la corrida real sobre los repos (`calibrar` real) no se hizo; la línea base sigue con la persona. (2) El plan de cada tramo (`changes/<id>/plan.md`) y `runs.jsonl` quedan sin seguir en la copia, como antes (D-39). (3) Sigue `tramo-15.md` (mismo grupo 14–17, D-38).

Checkpoint segmento 13 (builder, 2026-11-27, pausa): `evals/builder/corpus.json` marca K-03 y K-05 `excluido` (D-36); `tests/evals-builder/corpus.test.mjs` acepta `excluido` y cuenta 8/6/2; `evals/builder/lib/calibrar.mjs` no llama a `ejecutar` para un tramo excluido (A14). Pruebas: corpus 7/7, calibrar 16/16. Casillas de `tramo-13.md`: 2/2. Falta: el banco completo (segment check) y la verificación final. Pausa `motivo=verify` porque el banco no tiene duración registrada para fijar su tope. Reanudar: correr `node --test tests/evals-builder/*.test.mjs` con el tope que fije el planner y seguir con `tramo-14.md`. Archivos: `evals/builder/corpus.json`, `evals/builder/lib/calibrar.mjs`, `tests/evals-builder/corpus.test.mjs`, `tests/evals-builder/calibrar.test.mjs`, `changes/evals-builder/tramo-13.md`, este plan. Sin commit; repos fuente no tocados.

Checkpoint segmento 12 (builder, 2026-11-27): tiempo y registro de cada tramo. `evals/builder/lib/metricas.mjs`: `msDe` suma cada fase sobre los intentos donde se registró (D-32); `segundos.total` suma las fases registradas y es null solo si no hay ninguna. `evals/builder/lib/correr.mjs`: `guardarRegistros` copia el `runs.jsonl` de la copia y la salida cruda de `kit run` a `<salida>/logs/<ID>-r<rep>-runs.jsonl` y `<ID>-r<rep>-kit-run.log` antes de borrar la copia, también si `kit run` falla (D-33); `ejecutorReal` recibe `salida`. `evals/builder/README.md`: tiempo por fase, los dos registros y que `--salida` va fuera del repo. Pruebas: `metricas.test.mjs` 13/13 (dos nuevas del ejemplo y PAUSED; la afirmación de total nulo cambió a 0.011, D-32); `correr.test.mjs` con dos pruebas A13 (`kit run` real con builder falso, y uno que falla). Banco 92/92; `./verify` exit 0 (36 pasos, Fingerprint a0dd43a70849). Pendientes de `tramo-12.md`: 0. Archivos: `evals/builder/lib/metricas.mjs`, `evals/builder/lib/correr.mjs`, `evals/builder/README.md`, `tests/evals-builder/metricas.test.mjs`, `tests/evals-builder/correr.test.mjs`, `changes/evals-builder/tramo-12.md`, este plan (*Evidence*, *Notes*, frontmatter `status: done`). Sin commit; repos fuente no tocados.
Revisar: (1) la prueba de «sin intentos» (registro vacío) no se ejercita: el `kit run` fallido sí deja un intento `entorno`; la rama vacía solo está en el código. (2) `kit-verificado estado` muestra `huella_distinta` (44e038498cd2) tras el verify registrado (a0dd43a70849); no encontré la causa en el árbol, el planner decide si se repite la corrida 2 de 3. (3) Los logs de `correr` pueden traer rutas y texto de proyectos: `--salida` debe quedar fuera del repo (dicho en el README). (4) Sigue la línea base con la persona.

Checkpoint segmento 11 (builder, 2026-11-27): calibrar bien y ver el avance. `evals/builder/lib/calibrar.mjs`: `prepararTramo` toma de `HEAD` solo las pruebas citadas ausentes en la referencia; si existen en la referencia, usa la versión de la referencia (D-30, A4); `calibrar` avisa por stderr «[n/N] ID» al empezar y «[n/N] ID válido» o «descartado: motivo» al terminar, también con error (D-31, A12). `evals/builder/lib/correr.mjs`: un aviso por par («[k/N] ID rR» y el resultado, o «saltado (ya terminado)» al reanudar; «límite de uso» al cortar) (A12). `evals/builder/README.md`: avance y pruebas citadas. Pruebas nuevas: A4 (roja antes del arreglo, verde después), A12 en calibrar y correr. Banco 88/88; `./verify` exit 0 (36 pasos, Fingerprint 019b8469cb84). Pendientes de `tramo-11.md`: 0. Archivos: `evals/builder/lib/calibrar.mjs`, `evals/builder/lib/correr.mjs`, `evals/builder/README.md`, `tests/evals-builder/calibrar.test.mjs`, `tests/evals-builder/correr.test.mjs`, `changes/evals-builder/tramo-11.md`, este plan (*Evidence*, *Notes*, frontmatter `status: done`). Sin commit; repos fuente no se tocaron; la calibración real sobre `local.json` no se corrió.
Revisar: (1) `./verify` de este segmento es también la corrida 2 de 3 de *Verification* (mismo comando, árbol nuevo). (2) El índice de *Steps* sigue «pendiente» en el tramo 11 (lo actualiza el planner). (3) La línea base sigue con la persona (*Línea base*); `calibracion.json` de la base debe recalibrarse con el avance nuevo. (4) `git status` muestra archivos sin seguimiento en la raíz (`.bashrc`, `.gitconfig`, `.zshrc`, etc.) que no creé; no se tocaron.

Checkpoint segmento 10, devolución (builder, 2026-11-26): cierra los dos pasos devueltos de `tramo-10.md` (variante B con rutas bajo `contrato-b/`, sin `..`; y qué se borra y los campos de `comparar`). Comprobación `leerVariante` sobre el ejemplo: aceptado. Pendientes de `tramo-10.md`: 0 (contado con awk). Banco 85/85; `./verify` exit 0 (36 pasos, Fingerprint ae9cc3ed3386). Frontmatter `status: done`: sin commit. Cierre: el planner.
Revisar: (1) `./verify` es la corrida 1 de 3 de *Verification*. (2) `comparar` imprime `(no verificable)` con Codex; sin probar con corridas reales. (3) Índice de *Steps* (9 y 10 «devuelto en revisión») lo actualiza el planner. (4) Archivos sin seguimiento en la raíz (`.bashrc`, `.gitconfig`, `.zshrc`, `.vscode`) que no se tocaron.

Checkpoint segmento 9, paso 4 (builder, 2026-11-26): `comparar.mjs` añade `medianas.compactaciones`, `medianas.razon_prueba_producto`, `totales.muertes_proceso` y `totales.muertes_thrashing` (`total` y `verificable`; `(no verificable)` en la salida si alguna línea no es de Claude Code). Sin dato da `-`. Caso nuevo en `comparar.test.mjs` (9/9). Pendientes de `tramo-9.md`: 0 (contado con awk). Sigue la verificación del segmento 9.

Checkpoint segmento 10 (builder, 2026-11-26): uso documentado y vigilado. `evals/builder/README.md` (nuevo: órdenes `calibrar`, `correr` y `comparar`, fuera del sandbox, métricas, variante B con `contrato-b.json` y límites: n pequeño, costo del revisor vacío, thrashing solo en Claude Code, reservas con Docker); `evals/README.md` (sección «Banco del builder» con el enlace); `verify` (paso 26 con `tests/evals-builder/*.test.mjs`, antes de `VERIFY OK`). Comprobaciones de segmento: las tres de `tramo-10.md` pasan; `./verify` exit 0 (36 pasos, Fingerprint 215ba3a21046). Pendientes de `tramo-10.md`: 0. Archivos: esos tres, `tramo-10.md` (3 casillas), este plan (*Evidence*, *Notes*, frontmatter `status: done`). Sin commit.
Revisión del grupo 9–10 (builder): historia 3 completa; paro para la revisión del planner (D-11). El planner actualiza el índice de *Steps* (9 y 10 siguen «pendiente») y decide el cierre; el cambio no se cierra aquí.
Revisar: (1) `versionCodex` null bloquea el pareo (D-28); sin probar con Codex real. (2) La línea base sigue con la persona (*Línea base*); el README documenta los comandos. (3) `git status` muestra archivos sin seguimiento en la raíz (`.bashrc`, `.gitconfig`, `.zshrc`, `.vscode`) que no creé; no se tocaron.

Checkpoint segmento 9 (builder, 2026-11-26): `evals/builder/lib/comparar.mjs` (`leerCorrida`, `noPareables`, `compararCorridas`, `resumirUna`, `resumirCorrida`, `main`), `evals/builder/variantes/contrato-b.json` (dos rutas en null; `leerVariante` la rechaza con 2) y `tests/evals-builder/comparar.test.mjs` (8 pruebas). Comprobación de segmento: `node --test tests/evals-builder/comparar.test.mjs` exit 0 (8/8). Pendientes de `tramo-9.md`: 0 (contado con awk). Archivos: esos tres, `tramo-9.md` (3 casillas), `decisions.md` (D-28, D-29), este plan (*Evidence*, *Notes*, frontmatter `segment: 10`). Sin commit. Sigue `tramo-10.md` (mismo grupo 9–10, D-11).
Revisar: (1) `versionCodex` null bloquea el pareo (D-28): si `codex --version` no responde en la corrida real, las corridas no se pueden comparar. (2) `comparar` no tiene opciones, solo carpetas (D-29). (3) Sin probar con corridas reales de Codex.

Checkpoint segmento 8 (builder, 2026-11-26): correr una variante con el ejecutor real. `evals/builder/lib/correr.mjs`: `main` mezcla `process.env` con el de la variante, pasa `codexReal`, limpia la variante siempre, copia `adapters/` del kit (D-25) y escribe `modelos` resueltos y `version` en `corrida.json`; `ejecutorReal` cuenta cambios por repo (raíz e hijo, ruta relativa a la copia), filtra `usage.mjs` por la carpeta de la copia y lee las sesiones de Codex de la copia para `textos` (`contrato_ok`, `contaminado`); una corrida sin intentos deja `entorno` con motivo `sin-intentos`; `versionCodex`. `evals/builder/lib/calibrar.mjs`: `prepararTramo` devuelve `referencia` y `carpetas`. `tests/evals-builder/correr.test.mjs`: 21 pruebas (10 nuevas con el ejecutor real, builder y revisor falsos).
- Archivos: `evals/builder/lib/correr.mjs`, `evals/builder/lib/calibrar.mjs`, `tests/evals-builder/correr.test.mjs`, `changes/evals-builder/tramo-8.md`, `changes/evals-builder/decisions.md` (D-25), `changes/evals-builder/notes.md`, este plan (*Notes*, frontmatter `status`). Diff dentro de *Scope*; `variante.mjs` se revirtió (fuera de *Scope*).
- Comprobación de segmento: `node --test tests/evals-builder/correr.test.mjs` exit 0 (21/21). Banco: `timeout 300 node --test tests/evals-builder/*.test.mjs` exit 0 (75/75). Pendientes de `tramo-8.md`: 0 (contado con awk).
- Revisar: (1) `variante.mjs` (tramo 5) no copia `adapters/`, que `kit run` importa; la copia de `prepararVariante` sola no corre y el planner decide si lo añade allí (D-25). (2) Grupo 5–8 completo: el planner lo revisa antes de 9–10. (3) `git status` muestra archivos sin seguimiento en la raíz (`.bashrc`, `.gitconfig`, `.zshrc`, `.vscode`) que no creé; no se tocaron. (4) El Fingerprint de `tools/run/tree-fingerprint.mjs` falla con EACCES en `.bash_profile` (sin seguimiento, fuera de *Scope*); no se obtuvo huella.

Checkpoint segmento 6 (builder, 2026-11-26, pausa): `senal` añadido a cada intento en `scripts/kit-run.mjs` (en la inicialización, en builder muerto, builder PAUSED, verify, puerta `puerta`, revisor, revisor `RETURNED` y en el cierre; `null` en DONE). Documentado en `docs/kit-run.md`. Pruebas `senal.test.mjs` 2/2 (rojo antes del cambio). Bloqueo: `node tests/kit-run/run.mjs` falla R1, que fija la lista de 18 campos en `tests/kit-run/run.mjs:541`; ese archivo está fuera del *Scope* de `tramo-6.md`. Una corrección en `tests/kit-run/run.mjs` o no añadir la clave rompe A6. Se pide decisión a la persona (ver `PAUSED`).

Checkpoint segmento 5 (builder, 2026-11-26): `evals/builder/lib/variante.mjs` (`leerVariante`, `prepararVariante`: copia de `core/`, `scripts/`, `tools/` y `models.json` con contrato, nivel, esfuerzo y ventana solo en la copia; HOME temporal con `.agents/skills` enlazado por skill y `.codex` enlazado a la carpeta real, resuelta antes de cambiar HOME; `limpiar` idempotente; `ErrorVariante` con código 2), `evals/builder/variantes/base.json` (solo `nombre`), `tests/evals-builder/variante.test.mjs` (6 pruebas, con kit y Codex falsos en temporal). Archivos: esos tres, `tramo-5.md` (3 casillas), `decisions.md` (D-19), este plan. Sin commit. Comprobación de segmento: `timeout 60 node --test tests/evals-builder/variante.test.mjs` exit 0 (6/6). Pendientes de `tramo-5.md`: 0. Sigue `tramo-6.md` (mismo grupo 5–8, D-11).

Checkpoint segmento 4 (tercera relanzada, builder, 2026-11-26): fin de la historia «corpus reproducible (1–4)». `evals/builder/lib/calibrar.mjs`: `comandoDeVerificacion` usa `comandoVerificacion` de `tools/run/plan.mjs` (D-18); `filesDe` quita el punto final (también en previos); `aplicarReferencia` lanza `error-preparacion` si una ruta propia no está ni en la base ni en la referencia. `tests/evals-builder/calibrar.test.mjs` 13/13 (dos pruebas nuevas). Banco completo 35/35. Pendientes de `tramo-4.md`: 0. Archivos: `evals/builder/lib/calibrar.mjs`, `tests/evals-builder/calibrar.test.mjs`, `tramo-4.md`, `decisions.md` (D-18). Sin commit; los repos fuente no se tocaron.
Revisar: (1) el planner revisa el grupo 1–4 completo (tercera relanzada, D-17). (2) La calibración real (repos de `local.json` y Docker) y la línea base siguen con la persona. (3) `git status` muestra archivos sin seguimiento en la raíz (`.bashrc`, `.gitconfig`, `.zshrc`, etc.) que no creé; revisar antes de cualquier commit.

Checkpoint segmento 3 (tercera relanzada, builder, 2026-11-26): `evals/builder/lib/plan.mjs` (*Verification* entre comillas invertidas, D-18; `Files:` sin punto final). `tests/evals-builder/plan.test.mjs` 8/8 (dos pruebas nuevas: `comandoVerificacion` de `tools/run/plan.mjs` y punto final). Pendientes de `tramo-3.md`: 0. Sigue el segmento 4 (mismo grupo, `continuity: continuous`).

Checkpoint segmentos 3 y 4 tras devolución (builder, 2026-11-26): grupo «corpus reproducible (1–4)» completo en esta corrida (una sola historia, D-11).
- Archivos: `evals/builder/lib/plan.mjs` (casillas vacías, D-14), `tests/evals-builder/plan.test.mjs` (+1 prueba A3), `evals/builder/lib/calibrar.mjs` (`prepararTramo`, `ejecutarTramo`, `main` con ejecutor real por defecto, motivos fijos; D-15, D-16), `tests/evals-builder/calibrar.test.mjs` (11 pruebas con repos falsos), `changes/evals-builder/tramo-4.md` (4 casillas), `changes/evals-builder/decisions.md` (D-14 a D-16).
- Diff: solo dentro de *Scope* (`evals/builder/`, `tests/evals-builder/`, `changes/evals-builder/`). Sin commit. Los repos fuente no se escribieron ni se ejecutó la calibración sobre `local.json`.
- Comprobación de segmento 4: `node --test tests/evals-builder/calibrar.test.mjs` exit 0 (11/11). Banco completo 31/31.
- Corrección: el checkpoint del segmento 4 de abajo decía «pendientes 0»; quedaban 4 casillas, ya cerradas aquí. Pendientes de `tramo-3.md` y `tramo-4.md`: 0 (contado con awk).
- Revisar: (1) el planner revisa el grupo 1–4 (historia completa). (2) La calibración real (repos de `local.json` y Docker) la hace la persona (D-13). (3) `git status` muestra archivos sin seguimiento en la raíz (`.bashrc`, `.gitconfig`, `.zshrc`, etc.) fuera de *Scope*. (4) Línea base sigue pendiente de la persona.

Checkpoint segmento 4 (builder, 2026-11-26): grupo «corpus reproducible (1–4)» completo en el banco. Tramo 4: `evals/builder/bench.mjs` (carga `lib/<orden>.mjs` y llama `main`; orden desconocida → 2) y `evals/builder/lib/calibrar.mjs` (`clasificar`: base verde, referencia roja, kit-check en falla o válido; `calibracion.json` con hash del corpus y solo id/valido/motivo; opciones `--salida`/`--output`, `--tramos`/`--segments`, `--local`). `--local` se acepta pero aún no se lee. La corrida real de calibración (repos de `local.json` y Docker) queda para la persona (D-12). Pendientes de tramos 2–4: 0. D-12 registrado en `decisions.md`.

Checkpoint segmento 3 (builder, 2026-11-26): `evals/builder/lib/plan.mjs` (reconstruye solo la historia N: Scope = Files:, Verification con `cd` en repo hijo, Evidence y Notes vacías, sin Resuelto/Devuelto/Consejo ni continuity; `escribirPlanEnCopia`, `leerFuente` por `git show HEAD:`) y `tests/evals-builder/plan.test.mjs` (5 pruebas). Comprobación `node --test tests/evals-builder/plan.test.mjs` exit 0 (5/5). Pendientes de `tramo-3.md`: 0. Sigue `tramo-4.md`.

Checkpoint segmento 1 (2026-11-26):
- Archivos: `tests/evals-builder/corpus.test.mjs` (nuevo, 6 pruebas), `evals/builder/corpus.json` (nuevo, 16 entradas: 10 calibrado, 6 reserva), `.gitignore` (+1 línea: `evals/builder/local.json`), `evals/builder/local.json` (nuevo, ignorado, no versionado; mapa local de `scratchpad`).
- Diff: solo esos cuatro archivos dentro de *Scope*. Sin commit.
- Comprobación de segmento: `node --test tests/evals-builder/corpus.test.mjs` exit 0 (6/6).
- Pendientes de `tramo-1.md`: 4 al empezar, 0 al cerrar (contado con `pendientes-plan`).
- Decisiones: D-07 (nombres de cambio K en `local.json`), D-08 (tope de 60 s como timeout, sin medición previa). Ambas en `decisions.md`.
- Rama: `feature/evals-builder` ya era la actual; no se creó rama.
- Historia: el segmento 1 cierra el tramo «corpus versionado y anónimo»; con `continuity: continuous`, el grupo «corpus reproducible (1–4)» es una sola historia (*Steps*, D-11), así que se sigue con `tramo-2.md` en esta corrida. La revisión del planner es al final del grupo.
- Revisar: (1) `git status` muestra archivos sin seguimiento en la raíz (`.bashrc`, `.gitconfig`, `.zshrc`, etc.) que no creé; fuera de *Scope*, revisar antes de cualquier commit. (2) `git status --porcelain evals/builder` lista la carpeta; la verificación de `local.json` se hizo con `--untracked-files=all`. (3) Línea base sigue pendiente de la persona.

Devuelto: defecto — tramo 1 — evals/builder/local.json, A1: `repo_codigo` apunta a carpetas inexistentes en P1-01, P1-02, P1-03, P1-04, P3-02 y P3-03.
Devuelto: defecto — tramo 1 — tests/evals-builder/corpus.test.mjs:81, A1 (D-05): la prueba versiona nombres de proyectos privados; comprobar la privacidad sin escribirlos.

Checkpoint segmento 1 tras devolución (builder, 2026-11-26): `local.json` corregido (16 de 16 resuelven, D-10); prueba de privacidad leída del mapa local (D-09); `tests/evals-builder/corpus.test.mjs` 7/7. Archivos: `evals/builder/local.json` (ignorado), `evals/builder/corpus.json`, `tests/evals-builder/corpus.test.mjs`, `.gitignore`. Pendientes de `tramo-1.md`: 0.

Checkpoint segmento 2 (builder, 2026-11-26): archivos nuevos `evals/builder/lib/copia.mjs` (extraer con `git archive`, commit sintético en `main`, rama `feature/bench`, superposición, limpieza y borrado ante error) y `tests/evals-builder/copia.test.mjs` (7 pruebas con repos falsos en temporal). Sin cambios en repos fuente; sin `git -C`/`git -c` en el código de la lib (identidad por `git config` local). Comprobación `node --test tests/evals-builder/copia.test.mjs` exit 0 (7/7). Pendientes de `tramo-2.md`: 0. Decisión: D-11 (grupo 1–4 es una historia). Sigue `tramo-3.md`.

Revisión del grupo 1–4 (planner, 2026-11-26): RETURNED. A1 y A2 cumplen en revisión de código y pruebas (D-09, D-10, D-03, D-04); A3 y A4 no. (D-04: en `correr` rige D-34)
Devuelto: defecto — tramo 3 — evals/builder/lib/plan.mjs:41-47, A3: en las 16 fuentes reales el plan reconstruido conserva todas las casillas marcadas (0 abiertas).
Devuelto: omision — tramo 4 — evals/builder/lib/calibrar.mjs:60-79, A4: no hay ejecutor real; `calibrar` siempre sale con 1, `--local` no se lee y `--tramos` filtra por número de tramo en vez de ID (D-13).
Devuelto: defecto — tramo 2 — changes/evals-builder/plan.md (Evidence), D-05: la evidencia escribió nombres y rutas de proyectos privados; el planner los redactó. La evidencia solo lleva IDs y conteos.

Revisión del grupo 1–4 (planner, 2026-11-26, segunda pasada): RETURNED; queda `partial` por haber agotado las 2 relanzadas. Las casillas vacías y el ejecutor real están; 31/31 pruebas del banco pasan.
Devuelto: defecto — tramo 3 — evals/builder/lib/plan.mjs, A3: *Verification* se escribe sin comillas invertidas; `tools/run/plan.mjs:32-35` entonces devuelve `./verify` y `kit run` no correría la comprobación del tramo.
Devuelto: defecto — tramo 4 — evals/builder/lib/calibrar.mjs:114-117 y plan.mjs:57, A3/A4: el punto final de `Files:` no se quita; en 8 de 16 fuentes reales se pierde la última ruta (sin él, 37 de 37 existen en la referencia).

Resuelto: la persona autorizó una tercera relanzada del grupo 1–4 (2026-11-26, D-17). Sigue desde `tramo-3.md`.

Revisión del grupo 1–4 (planner, 2026-11-26, tercera pasada): APPROVED. 35/35 pruebas del banco.
| A# | Resultado | Evidencia |
|----|-----------|-----------|
| A1 | pasa | corpus.test 7/7 (D-05, D-09, D-10) |
| A2 | pasa | copia.test; sin prueba con repos reales, la cubre la calibración (D-03, D-04) | (D-04: en `correr` rige D-34)
| A3 | pasa | 16/16 planes reales: comando que lee kit run, Scope completo, 0 casillas marcadas, kit-check los analiza (D-14, D-18) |
| A4 | pasa | calibrar.test 13/13; la corrida real la hace la persona (D-13, D-15, D-18) |

Planner: tramo-8 suma `calibrar.mjs` (nombre de la carpeta de copia y hashes del oráculo, que `prepararTramo` aún no expone), para cumplir A8.

Pausa tramo 6 (motivo=scope): A6 añade `senal` a `runs.jsonl` y el caso R1 de `tests/kit-run/run.mjs:541` fija la lista exacta de campos; ese archivo no está en *Scope*. Espera decisión de la persona.
Resuelto: D-23 (la persona autorizó ajustar el caso R1); sigue la casilla 2 de `tramo-6.md`.

Checkpoint segmento 6 (builder, 2026-11-26, continuación): `senal` ya estaba en `scripts/kit-run.mjs` y en `docs/kit-run.md`; se añadió solo en `tests/kit-run/run.mjs` (R1: `"senal"` en `CAMPOS_REGISTRO`, «18»→«19» en comentario y título; D-19). Segment check: `senal.test.mjs` 2/2 y `kit-run` 52/52, exit 0. Casillas de `tramo-6.md`: 4/4. Archivos: `scripts/kit-run.mjs`, `docs/kit-run.md`, `tests/evals-builder/senal.test.mjs`, `tests/kit-run/run.mjs`, `changes/evals-builder/tramo-6.md`, este plan. Sin commit.
Índice de *Steps* (línea 6, «pendiente») no se cambió: está fuera de lo que este plan permite editar; el planner lo actualiza.
Revisar: (1) `decisions.md` tiene dos filas `D-19` (prepararVariante y caso R1); conviene renumerar la de R1. (2) `git status` sigue mostrando archivos sin seguimiento en la raíz (`.bashrc`, `.gitconfig`, etc.) que no creé. Sigue `tramo-7.md` (mismo grupo 5–8, D-11).

Checkpoint segmento 7 (builder, 2026-11-26): `evals/builder/lib/metricas.mjs` (`calcularMetricas`, función pura con los campos de «Métricas»; D-20) y `tests/evals-builder/metricas.test.mjs` (11 pruebas, con datos ficticios). Comprobación: `node --test tests/evals-builder/metricas.test.mjs` exit 0 (11/11; rojo antes del módulo). Pendientes de `tramo-7.md`: 0. Archivos: esos dos, `tramo-7.md` (2 casillas), `decisions.md` (D-20), este plan. Sin commit. Sigue `tramo-8.md` (mismo grupo).

Checkpoint segmento 8 (builder, 2026-11-26): `evals/builder/lib/correr.mjs` (`correr`, `permutar`, `main`), `evals/builder/lib/calibrar.mjs` (`prepararTramo` acepta `carpeta` y devuelve `oraculo` y `reaplicarOraculo`) y `tests/evals-builder/correr.test.mjs` (11 pruebas con builder y revisor falsos). Comprobaciones: `correr.test.mjs` exit 0 (11/11, rojo antes del módulo); `calibrar.test.mjs` exit 0 (13/13); banco 65/65 exit 0. Archivos: esos tres, `calibrar.mjs`, `tramo-8.md` (4 casillas), `decisions.md` (D-21, D-22), este plan.
Revisar: (1) el ejecutor real no lee el texto de las sesiones: `contaminado` y `contrato_ok` quedan null en la corrida real y el corte por contrato solo se activa con datos (D-21). (2) Usé `git -C .` en una comprobación de estado: incumple el contrato del builder (solo lectura, sin efecto); ya estaba en la lista de revisar del segmento 1. (3) Hay archivos sin seguimiento en la raíz (`.bashrc`, `.gitconfig`, `.vscode`, etc.) que no creé y no toqué. (4) Los índices de *Steps* siguen «pendiente» para los tramos 6–10 (lo actualiza el planner). Historia 2 (segmentos 5–8) completa: paro para la revisión del planner en contexto nuevo (no sigo a la historia 3). Lo siguiente es `tramo-9.md`; `segment: 9` queda como puntero. Sin commit.

Revisión del grupo 5–8 (planner, 2026-11-26): RETURNED (primera). Las 11 pruebas de `correr` usan un ejecutor falso; el real no se prueba.
Devuelto: defecto — tramo 8 — evals/builder/lib/correr.mjs:185-186,294: A8: `kit run` recibe solo `HOME` y `FLUCASTR_MODELOS`, sin `PATH` ni el resto del entorno.
Devuelto: defecto — tramo 8 — evals/builder/lib/correr.mjs:189-190: A7: `--project` recibe la ruta completa y `usage.mjs` filtra por nombre de carpeta; tokens y compactaciones quedan null.
Devuelto: defecto — tramo 8 — evals/builder/lib/correr.mjs:204: A7/A9: `contaminado`, `contrato_ok` y `referencia` quedan null (D-24).
Devuelto: defecto — tramo 8 — evals/builder/lib/correr.mjs:192-200: A7: en tramos de repo hijo solo se cuentan líneas de la raíz.
Devuelto: defecto — tramo 8 — evals/builder/lib/correr.mjs:278,289: A8: `corrida.json` lleva `version: null` y la configuración sin resolver en vez de los modelos.
Devuelto: defecto — tramo 8 — evals/builder/lib/correr.mjs:267-299: A5/A8: nunca se llama `variante.limpiar()` y el HOME temporal queda en disco.
Devuelto: defecto — tramo 8 — evals/builder/lib/correr.mjs:292: A7: `codexReal` no viene de `prepararVariante` y se ignora `CODEX_HOME`.
Devuelto: defecto — tramo 8 — evals/builder/lib/correr.mjs:185-187: A9: si `kit run` no deja `runs.jsonl`, se anota una línea sin resultado y la corrida sigue.

Revisión del grupo 5–8 (planner, 2026-11-26, segunda pasada): ejecutor real conectado; 75/75 del banco, `kit-run` 52/52, temporales 14/14. A6–A9 pasan (D-23, D-24, D-25); sin probar con Codex real.
Devuelto: omision — tramo 5 — evals/builder/lib/variante.mjs (`huellasDe`), A5: la huella `kit` incluye `models.json` y el plan pide rechazar huellas distintas; falta además `adapters/` (D-26). Omisión del plan.

Checkpoint segmento 5 (tercera relanzada, builder, 2026-11-26, tras devolución D-26): `evals/builder/lib/variante.mjs`: `COPIAS` incluye `adapters/`; `huellasDe` devuelve `kit` (sin contrato ni `models.json`), `modelos` (hash de `models.json` con los valores de la variante) y `contrato`. `evals/builder/lib/correr.mjs`: se quitó la copia manual de `adapters/` y el import `cpSync` que quedó sin uso. `tests/evals-builder/variante.test.mjs`: kit falso con `adapters/` y una prueba nueva (7/7). Segment check: `variante.test.mjs` 7/7 exit 0; `correr.test.mjs` 21/21 exit 0; banco completo 76/76 exit 0. Pendientes de `tramo-5.md`: 0 (dos casillas cerradas aquí). Archivos: `evals/builder/lib/variante.mjs`, `evals/builder/lib/correr.mjs`, `tests/evals-builder/variante.test.mjs`, `changes/evals-builder/tramo-5.md`, `changes/evals-builder/notes.md`, este plan (*Evidence*, *Notes*, frontmatter `status: done`). Sin commit; los repos fuente no se tocaron.
Revisar: (1) la historia 2 (5–8) queda completa otra vez: paro para la revisión del planner; no sigo a `segment: 9` (historia 3). `segment: 5` no cambia hasta esa revisión. (2) `git status` muestra archivos sin seguimiento en la raíz (`.bashrc`, `.gitconfig`, `.zshrc`, `.vscode`, etc.) que no creé; no se tocaron. (3) La línea base sigue con la persona (D-27).

Revisión del grupo 5–8 (planner, 2026-11-26, tercera pasada): APPROVED. 76/76 pruebas del banco.
| A# | Resultado | Evidencia |
|----|-----------|-----------|
| A5 | pasa | variante.test 7/7; huellas separadas (D-26) |
| A6 | pasa | senal.test y `kit-run` 52/52; en R1 solo cambia la lista (D-23) |
| A7 | pasa | metricas.test y corrida de punta a punta con falsos (D-24) |
| A8 | pasa | correr.test 21/21 (D-24, D-26); sin probar con Codex real |
| A9 | pasa | correr.test 21/21 (D-22, D-24, D-27) |

Revisión del grupo 9–10 (planner, 2026-11-26): RETURNED (primera).
Devuelto: defecto — tramo 10 — evals/builder/README.md:90-100, A11: el ejemplo de la variante B usa `..` y `variante.mjs` lo rechaza con 2.
Devuelto: omision — tramo 9 — evals/builder/lib/comparar.mjs:89-110, A10: los resúmenes omiten compactaciones, muertes (incluido thrashing) y razón prueba/producto.

Revisión del grupo 9–10 y del plan completo (planner, 2026-11-26): APPROVED. Gate 2 pendiente.
| A# | Resultado | Evidencia |
|----|-----------|-----------|
| A10 | pasa | comparar.test 9/9; resúmenes con compactaciones, muertes y razón (D-01, D-28) |
| A11 | pasa | `kit-verificado estado --nivel aceptacion` exit 0, Fingerprint: ae9cc3ed3386 (fase 26); el ejemplo de variante B del README lo acepta `leerVariante` (D-27) |
Alcance: solo rutas de *Scope*; en `tests/kit-run/run.mjs`, solo R1 (D-23). Sin nombres de proyectos privados en lo versionable.
Sin probar: Codex real (cambio de `HOME`, lectura de sesiones, versión), `calibrar` sobre los repos reales y Docker. Pendiente: línea base o un sí explícito para posponerla; no se cierra antes.

Hallazgos en la calibración real (planner, 2026-11-27); pendientes de decisión:
Devuelto: defecto — tramo 4 — evals/builder/lib/calibrar.mjs (citadas), A4: pisa con HEAD toda prueba citada aunque exista en la referencia (solo debía añadir las que faltan); afecta a K-01, que queda `referencia-roja`.
Devuelto: omision — tramo 4 — evals/builder/lib/calibrar.mjs, A4: no muestra avance y escribe `calibracion.json` solo al final; la persona lo creyó detenido.

Revisión del tramo 11 (planner, 2026-11-27): APPROVED. Gate 2 pendiente.
| A# | Resultado | Evidencia |
|----|-----------|-----------|
| A4 | pasa | de `HEAD` solo la citada ausente en la referencia; `kit-verificado estado --nivel aceptacion` exit 0, Fingerprint: 019b8469cb84 (D-30) |
| A12 | pasa | misma huella; avisos por stderr en `calibrar` y `correr`, solo posición, ID y resultado (D-31) |
Falta: recalibrar con el código nuevo (K-01), humo K-02, corrida base.

Humo real (persona, 2026-11-27): recalibración 12 de 16 válidos; K-02 DONE, `contrato_ok` true, sin contaminación, 1 relanzamiento por puerta.
Devuelto: defecto — tramo 7 — evals/builder/lib/metricas.mjs:15-19, A7: `segundos.total` queda null si algún intento no llegó al revisor (puerta o verify), así que se pierde el tiempo de los tramos relanzados.
Devuelto: omision — tramo 8 — evals/builder/lib/correr.mjs, A8: no guarda `runs.jsonl` ni la salida de `kit run` en `<salida>/logs`; no se puede saber por qué relanzó la puerta.
Aviso de review-plan en tramo-12 (mezcla A7 y A13): aceptado; son dos arreglos chicos de la misma corrida, comparten README y verificación.

Revisión del tramo 12 (planner, 2026-11-27): APPROVED. Gate 2 pendiente.
| A# | Resultado | Evidencia |
|----|-----------|-----------|
| A7 | pasa | suma de fases registradas (D-32); 92/92 del banco y `./verify` exit 0 corridos por el planner, Fingerprint: 44e038498cd2 |
| A13 | pasa | misma corrida; `guardarRegistros` escribe en `<salida>/logs` antes de borrar la copia (D-33) |
Sin prueba propia: registro vacío cuando no hay `runs.jsonl`. Falta la corrida base.

Primera corrida base real (persona, 2026-11-27): detenida en 3 de 12 (K-05 `entorno`, P1-03 `PAUSED`, K-03 `invalida`). La línea base no es válida. Causas (planner, desde `logs/` y sesiones):
Devuelto: defecto — tramo 3 — evals/builder/lib/plan.mjs (reconstruirPlan), A3: *Scope* = `Files:`; en P1-03 un paso pide editar una prueba del oráculo, queda fuera de alcance y el builder pausa.
Devuelto: defecto — tramo 7 — evals/builder/lib/metricas.mjs, A7: en tramos K el builder lee el `execute-plan` histórico del repo copiado y no el de la variante (K-02 en una sesión, K-03); `contrato_ok` pasa con que una sesión cite la copia.
Devuelto: omision — tramo 4 — evals/builder/lib/calibrar.mjs, A4: calibra fuera del sandbox de Codex; en K-05 y K-03 hubo EPERM dentro de él con código antiguo del kit.

Nota del planner: pausa del tramo 13 (sin tope de tiempo): tope fijado en los tramos 13–17; sigue con la comprobación de segmento de `tramo-13.md`.

Revisión del tramo 13 (planner, 2026-11-27): pasa A14 (93/93 del banco; K-03 y K-05 excluidos).

Revisión del grupo 14–17 y del tramo 13 (planner, 2026-11-27): APPROVED. Gate 2 pendiente.
| A# | Resultado | Evidencia |
|----|-----------|-----------|
| A11 | pasa | README al día; `kit-verificado estado --nivel aceptacion` exit 0, Fingerprint: fb6ea8e88855 (D-34, D-37) |
| A14 | pasa | 93/93 en su tramo; K-03 y K-05 excluidos (D-36) |
| A15 | pasa | misma huella; contrato reemplazado solo en copias K antes del commit sintético (D-35, D-39) |
| A16 | pasa | misma huella; `oraculo_pasa` tras medir, sin cambiar `resultado` (D-37, D-40) |
| A17 | pasa | misma huella; en los 10 candidatos reales, 1 prueba oculta por tramo y dentro de *Scope* (D-34, D-41) |
Límites anotados: el plan reconstruido lleva `repos: [.]`, así que en los 4 tramos con repo hijo la puerta no ve los cambios del hijo; en P1-01 la ruta oculta lleva prefijo y `Files:` no; `calibrar` no corre en el sandbox de Codex. Sin probar con Codex real.
Planner: el builder devolvió DONE pero dejó `status: in progress`; se corrigió a `done`.

Humo 2 (persona, 2026-11-27): K-02 `PAUSED` por el revisor tras 1 relanzamiento por puerta (A1 sin corrida en *Evidence*), `contrato_ok` true, `oraculo_pasa` false (2 casos de la referencia), líneas 49/57: medición válida. P1-03 `entorno`: su prueba necesita Docker y el sandbox de Codex niega el socket. No hay `calibracion.json` en `cal2`.
Calibración vigente (`/tmp/evals-builder/cal`): 9 válidos; K-01 `referencia-roja` (una prueba exige una frase del contrato antiguo, efecto de D-35). Base con 8 tramos (D-42).
Corrida base (`base2`, 2026-11-27): 0 DONE de 6, 2 `entorno`; no sirve para decidir. Detalle y defectos en `linea-base.md`. Espera decisión.

Cierre (planner, 2026-11-27): revisión del tramo 18 APPROVED (A18; aviso en README y `TODO.md`, D-43). Carpeta movida a `changes/done/`.
