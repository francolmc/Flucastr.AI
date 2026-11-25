---
status: in progress
branch: feature/proceso-rapido
base: main
repos: [.]
executor: builder
segment: 2
continuity: continuous
type: code
---
# Nadie repite una verificación cuyo resultado ya se conoce

## Goal
`./verify` deja `resultado.json` con la fingerprint del árbol, y una utilidad (`node scripts/kit-verificado.mjs`) dice «ya verificado» solo si el árbol no cambió y la última corrida terminó bien. Con ella, el builder no relanza una verificación que ya falló sobre el mismo árbol y el planner no repite una corrida cuya fingerprint coincide con la anotada en *Evidence*, de modo que la corrida completa sin caché ocurre una vez por plan. Un fallo nunca queda cacheado como éxito.

## Exploration
- Reescritura del borrador anterior (`changes/proceso-rapido/plan.md`, revisado el 2026-11-25): usaba rutas de la v1 (`skills/ejecutar-plan`, `agentes/principal.md`), una rama ya mergeada (`feature/medir-verificacion`) y daba por decidida la inversión de convención. Las rutas vigentes son `core/skills/execute-plan/SKILL.md`, `core/agents/planner.md` y `tools/verify/*.sh`; la rama es `feature/proceso-rapido`; la inversión pasa a ser pregunta (abajo).
- Contrato (`core/contracts/verification.md`): fingerprint por carpeta de `repos:` = sha256 (12 hex) de `git status --porcelain` + `git diff HEAD` excluyendo `changes/**`; sin `HEAD` solo `status`. `resultado.json` = `{fingerprint, level (rapida|servicio|aceptacion), fase, ok, fallo (ninguno|entorno|dependencia|prueba|tiempo)}`; `huella` solo se lee.
- Ya existe el código base y no se duplica: `core/skills/diagnose/fingerprint.mjs` (`fingerprintCurrent`) y `core/skills/diagnose/result.mjs` (`leerResultado`: «no existe» / «invalido» / «valido» y vigente / obsoleta / no disponible). El kit no tiene hoy quien **escriba** `resultado.json` (`docs/mejoras.md`: «Evidencia: falta»).
- **Hallazgo medido (2026-11-25):** `fingerprintCurrent` no detecta cambios dentro de archivos o carpetas sin seguimiento. En un repo recién creado con `sub/x` sin seguir, la fingerprint fue `e590023790b9` antes y después de cambiar el contenido de `sub/x` y de añadir `sub/y`: `git status --porcelain` colapsa `?? sub/` y `git diff HEAD` no ve lo no seguido. El builder no commitea, así que sus archivos nuevos siempre están sin seguimiento: con la fórmula actual un «ya verificado» sería falso exactamente en el caso que importa. El tramo 1 lo corrige (Decisión 2) y actualiza contrato y referencia de pruebas.
- `./verify` del kit: bash con `set -euo pipefail`, helpers `fallo()` / `paso()`, módulos `tools/verify/*.sh`, bloques de contrato de texto con comprobación positiva y copia negativa con `sed` (ej. 8l en `tools/verify/agent-contracts.sh`). Dura ~32 s y no tiene modo rápido ni caché.
- `pruebas/*` está ignorado por git (`.gitignore:2`): escribir el resultado en `pruebas/.temporales/resultado.json` no altera la fingerprint ni exige tocar `.gitignore`. Raíz del repo sin ignorar: escribirlo ahí cambiaría el árbol.
- El `git fetch` falló en esta sesión (el sandbox bloquea github.com:443). Estado local: `main` limpio, 0 commits detrás de `origin/main` según la copia local. La persona usuaria o el builder deben confirmar la base al lanzar (`execute-plan`, «Before starting»).
- Tramos: 3 archivos de producto por tramo. Tramo 1 = `core/skills/diagnose/fingerprint.mjs`, `scripts/kit-verificado.mjs` (nuevo), `verify`. Tramo 2 = `core/skills/execute-plan/SKILL.md`, `core/agents/planner.md`, `tools/verify/agent-contracts.sh`. Pruebas y documentos (contrato, `docs/mejoras.md`, `AGENTS.md`) no cuentan.

### Pregunta abierta para la persona usuaria: ¿invertir la convención (`./verify` rápido, `./verify --aceptacion` explícito) en este cambio?
- **Recomendación: NO, como cambio aparte.**
- Razones: (1) la utilidad sirve con cualquiera de las dos convenciones: compara fingerprint y nivel, no el nombre del comando; (2) en este repo la inversión no hace nada, porque `./verify` del kit no tiene modo rápido ni caché; (3) invertir cambia el significado de `./verify` en todos los proyectos instalados (`prepare-project` §2, `plan-change` regla 13, el hook de permisos que `allow`ea el comando declarado, los bloques 8k/8l) y requiere un plan corto por proyecto; mezclarlo duplica el riesgo y alarga la revisión; (4) conviene medir primero cuántas corridas evita la utilidad: si la corrida completa ya ocurre una vez por plan, la inversión pierde urgencia.
- Si decides **sí**: se agrega un tramo 3 con `core/skills/prepare-project/SKILL.md` (§2), `core/skills/plan-change/SKILL.md` (regla 13) y un bloque de contrato de texto, y el nivel 3 de la regla 13 pasa a `--aceptacion` solo en el último tramo. No hay nada más que cambiar en este plan.
- Si decides **no**: el plan queda como está y la inversión se abre como `changes/convencion-verify-rapido`, derivado del borrador antiguo.

## Evaluation
- A) Reutilizar `fingerprint.mjs` / `result.mjs` y agregar un solo CLI (`scripts/kit-verificado.mjs`) con subcomandos `iniciar`, `cerrar`, `estado`. Recomendada: sin código duplicado y un solo punto de verdad.
- B) Escribir `resultado.json` desde bash con `sha256sum`. Descartada: duplica la fórmula en otro lenguaje, que es justo lo que `tests/diagnosis-suggests` evita con una referencia.
- C) Cachear por mtime. Descartada: no cumple el contrato y falla con checkouts.
- Fingerprint con lo no seguido: A) agregar `-uall` y un hash de los contenidos de archivos sin seguimiento no ignorados (recomendada; cambia la fórmula, los `resultado.json` antiguos quedan «obsoletos» y se repiten una vez); B) dejarla igual y documentar el límite (descartada: «ya verificado» falso para el builder).
- Riesgo: toca `verify` (alto). Mitigación: `resultado.json` se borra al inicio y se escribe al final con rename atómico, y solo si la fingerprint de cierre coincide con la de inicio.

## Assumptions
- `Evidencia:` del kit es `pruebas/.temporales/resultado.json` (ignorado). Si el builder encuentra que `verify` borra esa carpeta o que no está ignorada (`git check-ignore -v`), pausa con `motivo=design`.
- `./verify` del kit corre siempre la suite completa, así que escribe `level: aceptacion` (es el nivel más alto: satisface cualquier nivel pedido).
- Una carpeta por llamada. Con más de una carpeta en `repos:` la utilidad responde «verificar» (`multi_repo`); es conservador y no es falso verde. Si quieres cubrir workspaces, es una mejora aparte.
- Un `resultado.json` válido pero con `ok: false`, `fallo` distinto de `ninguno`, nivel menor al pedido o fingerprint distinta nunca cuenta como «ya verificado».
- Archivos sin seguimiento ignorados por `.gitignore` no entran en la fingerprint (coherente con `git status`).
- Si corrige la persona usuaria el nombre de la ruta de evidencia, cambia solo la línea `Evidencia:` en `AGENTS.md` y el valor por defecto del CLI.

## Decisions already taken
- Executor: builder, porque requisitos, rutas, comandos y comprobaciones están escritos, no hay credenciales ni despliegue, y todo corre offline.
- Decisión 1: «ya verificado» = `resultado.json` legible y válido (`leerResultado`), `ok === true`, `fallo === "ninguno"`, `level` ≥ nivel pedido (rapida < servicio < aceptacion), `fingerprint` igual a la actual de la carpeta, y fingerprint actual disponible. Cualquier otra cosa → «verificar» (exit 1). Sin `HEAD`, la fingerprint usa `status` más los contenidos sin seguimiento (siguen cambiando).
- Decisión 2: la fingerprint pasa a usar `git status --porcelain -uall` y a incluir el sha256 de cada archivo sin seguimiento no ignorado (excluyendo `changes/**`), ordenados por ruta. El contrato, `tests/diagnosis-suggests/fingerprint-reference.mjs` y `fingerprint.mjs` cambian juntos.
- Decisión 3 (códigos de salida del CLI `estado`): 0 = ya verificado; 1 = verificar (con motivo `sin_resultado | invalido | ok_false | huella_distinta | nivel_insuficiente | sin_huella | multi_repo`); 3 = el mismo árbol ya falló (`resultado.json` válido con `ok: false` y fingerprint igual): corregir antes de relanzar; 2 = uso. Para el builder, 3 es el freno; para el planner, 0 es el atajo.
- Decisión 4: `verify` escribe `resultado.json` solo en la corrida completa (no en `VERIFY_TARGET`), borra el anterior al inicio, y lo escribe en el `trap EXIT` con la fingerprint de inicio solo si la de cierre coincide; si cambió durante la corrida, no escribe (se repetirá, nunca se da por bueno).
- Decisión 5: el planner anota en *Evidence* la línea `Fingerprint: <12 hex>` junto a cada corrida de la *Verification*; el CLI imprime esa línea (`estado` y `cerrar`).
- Decisión 6: la inversión de convención NO entra en este cambio salvo que la persona usuaria responda que sí (pregunta abierta en *Exploration*).

## Decisions
(menores, durante la ejecución)
- Archivos no regulares: la huella omite FIFO, sockets y dispositivos (no son archivo ni enlace). Los dispositivos de la raíz del sandbox (`.bashrc`, `.zshrc`, etc., character devices) quedan fuera por esta regla. No hay prueba específica de FIFO ni socket en `tests/ya-verificado`; queda como cobertura pendiente.
- Exit 3 de `estado` con `motivo=fallo_previo` (mismo árbol, `ok: false`).
- Combinaciones inválidas de `resultado.json` (p. ej. `ok: true` con `fallo` distinto de `ninguno`) se tratan como `invalido`.
- Registro de `verify` (paso 50): el trap EXIT no sobrevivía, porque los scripts `source`d fijan su propio trap EXIT. Se implementó como proceso padre que corre el cuerpo en un hijo (`VERIFY_HIJO=1`) y registra la fase con `VERIFY_FASE_ARCHIVO`. Mismo objetivo (escribir `resultado.json` al final, fase del último paso, sin cambiar el exit code), distinto mecanismo al que describe el paso 50.
- Adaptación de `tests/diagnosis-suggests/fingerprint.test.mjs` (paso 45, ampliación de Scope aprobada): (a) la aserción de contrato ahora exige `status --porcelain -uall`; (b) el caso «sin HEAD» cambió de «se conserva el fingerprint basado solo en status» a «hashea los archivos sin seguimiento fuera de changes/». Con la fórmula nueva, editar `src/app.js` (sin seguimiento y sin HEAD) sí invalida la huella, así que la expectativa `vigente` era incorrecta. Se re-guarda la huella tras ese cambio antes de probar el archivo nuevo `otro.js`, para que la última aserción siga comprobando algo. Ningún caso se borró ni se debilitó: se pasó de 3 a 3 pruebas.
- Etiqueta del bloque de contrato del tramo 2: se llama 8u, no 8t, porque `tools/verify/small-change-contract.sh` (ya en HEAD) usa «8t». El paso 27 admite «o el rótulo que use el archivo». La primera corrida con 8t pasó; tras el renombrado se corrió `./verify` otra vez.
- Orden del tramo 2: se editó `docs/mejoras.md` (paso 28) antes de la corrida completa, para que la única corrida final cubra el árbol final; el paso 27 se cumple con esa corrida.
- Avance de `segment`: el tramo 2 es la «Segment 2» de la misma historia (`tramo-2.md`), así que el frontmatter pasa de `segment: 1` a `segment: 2`.

## Validation
Confirmado por la persona usuaria (2026-11-25): NO invertir la convención en este cambio (se abrirá `changes/convencion-verify-rapido` aparte) y plan aprobado (Gate 1).

## Scope
Archivos de producto, tramo 1: `core/skills/diagnose/fingerprint.mjs`, `scripts/kit-verificado.mjs` (nuevo), `verify`.
Archivos de producto, tramo 2: `core/skills/execute-plan/SKILL.md`, `core/agents/planner.md`, `tools/verify/agent-contracts.sh`.
Pruebas y documentos: `tests/ya-verificado/ya-verificado.test.mjs` (nuevo), `tests/diagnosis-suggests/fingerprint-reference.mjs` (la fórmula del contrato cambia), `tests/diagnosis-suggests/fingerprint.test.mjs` (solo sus expectativas de la fórmula: línea 53 y el caso «sin HEAD»; omisión del plan detectada por el builder el 2026-11-25), `core/contracts/verification.md`, `tests/README.md`, `docs/mejoras.md`.
Fuera de alcance: `core/skills/diagnose/result.mjs` (solo se importa), `tools/run/tree-fingerprint.mjs` y `scripts/kit-run.mjs` (usan otra huella completa de árbol y no cambian), `core/skills/plan-change/SKILL.md`, `core/skills/prepare-project/SKILL.md`, `install.sh`, `models.json`, `.gitignore`, `AGENTS.md` (lo actualiza el planner al cerrar).

## Verification
`./verify` — corrida completa del kit, offline; debe terminar en exit 0 con `ok` en el paso de la nueva prueba y en el bloque de contrato del tramo 2. Una sola vez, al final del tramo 2.

## Stop conditions
Continúa si la comprobación pasa, el siguiente paso sigue en *Scope* y no falta una decisión. Se detiene con nota (hecho, pendiente, motivo) si la misma causa falla dos veces, hay que salir del *Scope*, falta una decisión de la persona usuaria o una comprobación tarda más del doble de lo medido. Además, pausa con `motivo=design` si la fingerprint de cierre de `./verify` difiere de la de inicio en una corrida limpia (la propia `verify` ensucia el árbol) o si la carpeta de evidencia no está ignorada.
Revisión: fin de historia. El planner revisa en contexto nuevo al final del tramo 2.

## Steps
- Tramo 1: [tramo-1.md](tramo-1.md) — fingerprint con lo no seguido, CLI `kit-verificado` y escritura de `resultado.json` desde `./verify`.
- Tramo 2: [tramo-2.md](tramo-2.md) — `execute-plan` y `planner.md` usan la utilidad; bloque de contrato con copia negativa.

## Evidence
Base de rama: `git branch --show-current` = `main`; `feature/proceso-rapido` no existía; `git switch -c feature/proceso-rapido` correcto. Sin cambios fuera de `changes/` salvo los dispositivos sin seguimiento que indicó el planner.

Medición base tramo 1 (2026-11-25):
$ time node --test tests/diagnosis-suggests/*.test.mjs tools/verify/fingerprint-module.test.mjs
tests 6, pass 6, fail 0 (≈0,79 s real)
exit 0

Medición base `./verify` antes de tocarlo:
$ time ./verify
VERIFY OK (≈1 min 38 s real; el plan estimaba ~32 s, se usa la medición de esta sesión)
exit 0
Árbol tras `./verify`: sin cambios nuevos fuera de `changes/` (`git status --short` igual).

Comprobación de ignorado:
$ git check-ignore -v pruebas/.temporales/resultado.json
.gitignore:2:pruebas/*	pruebas/.temporales/resultado.json
exit 0

Tramo 1, pruebas nuevas (`tests/ya-verificado/ya-verificado.test.mjs`):
$ node --test tests/ya-verificado/ya-verificado.test.mjs
tests 11, pass 11, fail 0
exit 0
Desviación en el paso 43 (ver tramo-1.md): al correr el test sin `kit-verificado.mjs`, el primer fallo fue «Cannot read properties of null (reading '1')», no el mensaje de módulo inexistente; el check se cumple como fallo previo a la implementación.

Sensibilidad 1 (paso 48): copia de `scripts/kit-verificado.mjs` sin la condición `ok === true`:
$ node --test tests/ya-verificado/ya-verificado.test.mjs --test-name-pattern='fallo nunca' (copia mutante)
2 fallas, exit 1. Original: 11/11, exit 0.
Sensibilidad 1 bis (copia con `if (false) return` en el caso de fallo): fallan «fallo nunca…» y «cerrar no escribe si…ok es false».

Sensibilidad 2 (paso 49): copia de `core/skills/diagnose/fingerprint.mjs` sin `-uall`:
$ node --test tests/ya-verificado/ya-verificado.test.mjs --test-name-pattern='sin seguimiento' (copia mutante)
1 falla (archivo nuevo no cambia la huella), exit 1. Original: pasa, exit 0.

Sintaxis (paso 50 y 51): `bash -n verify` exit 0.

Corrida completa `./verify` con el registro (paso 52, NO CUMPLIDO):
$ ./verify
falla en el paso 10c (`tests/diagnosis-suggests/fingerprint.test.mjs`, fuera de Scope), ≈100 s, no completa.
`pruebas/.temporales/resultado.json` = `{"fingerprint":"c8228e29094c","level":"aceptacion","fase":"10c","ok":false,"fallo":"prueba"}`.
$ node scripts/kit-verificado.mjs estado --nivel aceptacion
motivo=fallo_previo, exit 3. Esto verifica que un fallo queda registrado y no cuenta como éxito; no verifica A7 (la corrida no es `ok: true`).

Referencia de pruebas (paso 45, NO CUMPLIDO):
$ node --test tests/diagnosis-suggests/*.test.mjs tools/verify/fingerprint-module.test.mjs
falla `tests/diagnosis-suggests/fingerprint.test.mjs`: línea 53 y el caso «sin HEAD» esperan `vigente` con la fórmula anterior. Ese archivo está fuera de *Scope*.

Tramo 1 cerrado tras la reanudación (2026-11-25), con la fórmula nueva en el árbol:
$ node --test tests/diagnosis-suggests/fingerprint.test.mjs   (paso 45)
tests 3, pass 3, fail 0; exit 0.
$ node --test tests/diagnosis-suggests/*.test.mjs tools/verify/fingerprint-module.test.mjs   (paso 46)
tests 6, pass 6, fail 0; exit 0.
$ time ./verify   (pasos 23 y 53; el árbol no cambió después de esta corrida)
VERIFY OK; real 1m49s; exit 0. Incluye el paso 20 (ya-verificado 11/11).
$ cat pruebas/.temporales/resultado.json
{"fingerprint":"e861747ad594","level":"aceptacion","fase":"20","ok":true,"fallo":"ninguno"}
$ node scripts/kit-verificado.mjs estado --nivel aceptacion
Fingerprint: e861747ad594
ya verificado: nivel=aceptacion fase=20; exit 0.
Falso verde (paso 54): con `falso-verde-prueba/nuevo.txt` (carpeta nueva fuera de changes/ y pruebas/), `estado` sale 1 con `motivo=huella_distinta` (huella dd114b85bf3e); tras borrar la carpeta, `estado` sale 0 con e861747ad594.

Tramo 2 (2026-11-25):
$ node scripts/kit-verificado.mjs estado --nivel aceptacion   (antes de la corrida final; el árbol cambió desde el tramo 1)
Fingerprint: afc2ea643d83
verificar: motivo=huella_distinta
exit 1
Paso 24: `grep -n 'kit-verificado' core/skills/execute-plan/SKILL.md` → línea 69 (regla de `estado` en Final Verification, con «exit 3» y `Fingerprint:` en *Evidence*). `grep -c 'yield_time_ms: 1800000'` = 1; `grep -c 'yield_time_ms: 300000'` = 1; «3 final runs» intacto (línea 71).
Paso 25: `grep -n 'kit-verificado' core/agents/planner.md` → línea 59 (paso 5, High risk). `grep -c 'Low risk'` = 1; `grep -c 'yield_time_ms: 300000'` = 1; `grep -c 'Devuelto:'` = 1.
Paso 26: `bash -n tools/verify/agent-contracts.sh` exit 0.
Paso 28: `grep -n 'kit-verificado' docs/mejoras.md` → línea 10 (fila «Evidencia»); `grep -c 'Siguiente mejora' docs/mejoras.md` = 0.
Paso 27, primera corrida (bloque con rótulo 8t, antes de renombrarlo): `./verify` exit 0; `ok 8t` línea 137; `ok 8k` y `ok 8l` presentes; `VERIFY OK`; real 1m41s. Después aparece la colisión con `small-change-contract.sh` (su bloque también es 8t), por eso se renombró.
Corrida final (rótulo 8u):
$ time ./verify
real 1m40.767s
ok 8u: execute-plan con «kit-verificado.mjs estado» y «Fingerprint: <12 hex>», planner con «kit-verificado.mjs estado»; copias sin esas cadenas fallan
ok 8k: planner con «You may create or edit only files», «APPROVED», «do not fix it» y «one long wait»; copias sin la lista o con la frase vieja fallan
ok 8l: planner con «yield_time_ms: 300000» y «do not count»; copia sin la receta falla
VERIFY OK
exit 0
Ninguna línea `FALLO` del bloque 8u: las tres copias negativas fallan como se espera. Las líneas `estatico: FALLO` del paso 19 son las dos fixtures negativas que ese paso espera (`ok 19`).
$ cat pruebas/.temporales/resultado.json
{"fingerprint":"6a810c8f6f1e","level":"aceptacion","fase":"20","ok":true,"fallo":"ninguno"}
$ node scripts/kit-verificado.mjs estado --nivel aceptacion
Fingerprint: 6a810c8f6f1e
ya verificado: nivel=aceptacion fase=20
exit 0

## Notes
- Duración base de `./verify` medida: 98 s. Para el 2x de los checks completos se usa esta medición. Los dos checks «Medir la base» corrieron sin límite previo porque su objetivo es obtener la duración.
- Dispositivos sin seguimiento en la raíz (`.bashrc`, etc.) ignorados según la nota del planner.
- Checkpoint tramo 1 (2026-11-25), hecho 13/16 pasos. Archivos cambiados: `core/skills/diagnose/fingerprint.mjs` (`-uall`, sha256 de sin seguimiento, exporta `recorrer` y `fingerprintCurrent`), `scripts/kit-verificado.mjs` (nuevo: `estado`, `iniciar`, `cerrar`), `verify` (bloque de registro padre/hijo y paso 20), `tests/ya-verificado/ya-verificado.test.mjs` (nuevo, 11 pruebas), `tests/diagnosis-suggests/fingerprint-reference.mjs` y `core/contracts/verification.md` (misma fórmula), `tests/README.md` (entrada paso 20), `docs/mejoras.md` (Evidencia: parcial). Checks: 11/11 nuevas; sensibilidad 1 y 2 confirmadas; `bash -n verify` OK; `./verify` falla en 10c.
- PAUSED (motivo=scope): el paso 45 y la verificación de `./verify` dependen de `tests/diagnosis-suggests/fingerprint.test.mjs`, que contradice la Decisión 2 y está fuera de *Scope*. Pendientes: 45, 52 y 53 de `tramo-1.md`; tramo 2 no iniciado.
- PAUSED resuelto: el planner aprobó ampliar el Scope a `tests/diagnosis-suggests/fingerprint.test.mjs` (opción 1). Pasos 45, 46, 53 y 54 de `tramo-1.md` cumplidos con la evidencia de *Evidence* (Tramo 1 cerrado).
- Checkpoint tramo 1 (reanudación, 2026-11-25): 16/16 pasos. Archivos de producto cambiados desde la última nota: `tests/diagnosis-suggests/fingerprint.test.mjs` (dos aserciones adaptadas, Decisiones) y `tests/diagnosis-suggests/fingerprint-reference.mjs` verificado igual a `fingerprint.mjs`. Diff resumido del tramo 1 (`fingerprint.mjs`, `kit-verificado.mjs`, `verify`, pruebas y contrato) sin cambios adicionales. Check: `./verify` exit 0 con `resultado.json` `ok:true`; falso verde confirmado. Tramo 2 pendiente; sigue en `tramo-2.md`.
- Checkpoint tramo 2 (2026-11-25): 6/6 pasos de `tramo-2.md` (23 a 28) hechos. Archivos cambiados: `core/skills/execute-plan/SKILL.md` (regla de `estado` en Final Verification y `Fingerprint:` en *Evidence*), `core/agents/planner.md` (paso 5, High risk), `tools/verify/agent-contracts.sh` (bloque 8u con tres copias negativas), `docs/mejoras.md` (fila Evidencia; sin «Siguiente mejora»). Checks: `./verify` exit 0 con `ok 8u`, `ok 8k`, `ok 8l`; `resultado.json` `ok:true` con fingerprint `6a810c8f6f1e`; `estado` exit 0.
- Resumen de la historia (cinco líneas):
  1. Tramo 1: `./verify` escribe `resultado.json` con fingerprint; `scripts/kit-verificado.mjs` ofrece `estado`, `iniciar` y `cerrar`.
  2. Tramo 2: `execute-plan` (Final Verification) y `planner.md` (paso 5) usan `estado`; el bloque 8u del contrato tiene tres copias negativas.
  3. Verificación final: `./verify` exit 0; `resultado.json` `ok:true`; fingerprint `6a810c8f6f1e`.
  4. Decisiones: bloque renombrado a 8u (colisión con el 8t de small-change); `docs/mejoras.md` editado antes de la corrida final; `segment` avanza a 2.
  5. Pendiente: revisión del planner en contexto nuevo (`Revisión: fin de historia`); el commit y el PR los hace la persona usuaria. `changes/convencion-verify-rapido` queda fuera de este plan.
- Pendientes dentro de *Scope*: ninguno. El plan queda `in progress`; el cierre (`changes/done/`) lo hace el planner.
