---
status: done
branch: feature/ritmo
base: main
repos: [.]
executor: builder
segment: 1
type: code
---
# Ritmo: el kit trabaja rápido por defecto

## Goal
Planes cortos, pocos tramos, una revisión y un `./verify` final.

## Exploration
- Sin margen: `planner.md` 8192/8192 B; `builder.md` + `execute-plan` 13495/13500 B.
- `review-plan.mjs` ya falla sobre 8192 B; no limita tramos.
- `tools/verify/operating-contract.sh` exige «3 runs»; `segment-contract.sh` exige «Per-segment review».
- `kit run` solo mapea Codex (`tools/run/commands.mjs`); corre su propio verify y revisor.

## Evaluation
Menos espera a cambio de aceptar defectos menores anotados.

## Assumptions
- «Dos veces» = el mismo comando falla, o la misma corrección se aplica, dos veces; releer o comparar antes/después no cuenta.

## Decisions already taken
- D-01, D-02, D-03, D-06

## Decisions

## Validation
Pedido de la persona en modo rápido; falta su aprobación.

## Scope
Los de *Files*, `tests/review-plan/review-plan.test.mjs` y, en `tools/verify/` o `tests/`, solo la comprobación de una frase movida.
Fuera (pendiente): `kit-run.mjs`, referencias, README, `docs/`.

## Verification
`./verify` — una vez, al final.

## Stop conditions
- Un tope de bytes no cabe sin quitar una restricción de seguridad.
- Un comando o corrección falla dos veces.

## Steps

### Segment 1 — Story: ritmo rápido por defecto
As persona usuaria I want límites cortos por defecto so that los cambios terminen antes.
Dependencies: none.
Contracts to keep: toda restricción de seguridad, motivos de `PAUSED`, 2 relanzamientos, `Revisión: por tramo`, topes de bytes.
Paths likely to change: *Scope*.
Concrete example of the expected result: un plan con 4 tramos hace salir a `review-plan` con 1; con `Excepción de tamaño: <razón>` sale con 0.
Scope: ver *Scope*.
Files: `core/skills/plan-change/SKILL.md`, `core/agents/planner.md`, `core/skills/execute-plan/SKILL.md`, `scripts/review-plan.mjs`
WHEN se planifica, ejecuta o revisa un cambio THEN rigen los límites cortos (A1) (A2) (A3) (A4)
Acceptance:
- A1: `plan-change`: ≤ 8 KB y ≤ 3 tramos, o dos cambios preguntando el orden; investigar ≤ 10 min y anotar faltantes; probar solo lo tocado y dependientes directos. Check: diff; expect esas reglas.
- A2: `planner.md`: una revisión al final (con `kit run`, la de su revisor); devolver solo por A# roto, *Blockers*, seguridad o *Scope*; lo menor se anota y se cierra; `kit run` según D-02. Check: diff; expect esas reglas.
- A3: `execute-plan`: por tramo, comprobación rápida (o checks de pasos); `./verify` solo al final (D-03); segundo fallo de un comando o corrección: `PAUSED` con handoff, sin tercer intento. Check: diff; expect sin regla de 3 corridas.
- A4: `review-plan` sale con 1 sobre 8192 B o 3 tramos; `Excepción de tamaño: <razón>` no vacía anula ambos. Check: pruebas; expect pasan.
TODO:
- [x] Probar en `tests/review-plan/review-plan.test.mjs` 3/4 tramos y excepción con y sin razón (A4). Check: `node --test tests/review-plan/*.test.mjs`; expect falla.
- [x] Implementar en `scripts/review-plan.mjs` y su ayuda (A4). Check: `node --test tests/review-plan/*.test.mjs`; expect exit 0.
- [x] Editar `core/skills/plan-change/SKILL.md` (A1). Check: `node --test tests/context-size/*.test.mjs`; expect exit 0.
- [x] Editar `core/agents/planner.md` y, si renombras el título, `tools/verify/segment-contract.sh` (A2). Check: `node --test tests/context-size/*.test.mjs tests/escalera/*.test.mjs`; expect exit 0.
- [x] Editar `core/skills/execute-plan/SKILL.md` y cambiar «3 runs» en `tools/verify/operating-contract.sh` por la frase nueva (A3). Check: `node tests/builder-contract.mjs`; expect exit 0.
Segment verification: `node --test tests/review-plan/*.test.mjs tests/context-size/*.test.mjs tests/escalera/*.test.mjs` — level 1; exit 0; covers A1, A2, A3, A4.
Handoff: instrucciones en inglés (ej. «no third attempt»). Los dotfiles sin seguimiento que sean dispositivos (`ls -l`: `c`) son del sandbox, no cambios. D-03 rige ya.

## Evidence
$ node --test tests/review-plan/*.test.mjs
✖ A4 four tranches warn and three do not; Excepción de tamaño with a reason cancels the warning
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 0 !== 1
✖ A4 an exception with a reason also cancels the 8192-byte warning; without one it still warns
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 1 !== 0
(falla como se esperaba; los dos casos nuevos fallan antes de implementar)
exit 1

$ node --test tests/review-plan/*.test.mjs
ℹ tests 37
ℹ pass 37
ℹ fail 0
exit 0

$ node --test tests/context-size/*.test.mjs
ℹ tests 9
ℹ pass 9
ℹ fail 0
exit 0

$ node --test tests/context-size/*.test.mjs tests/escalera/*.test.mjs
ℹ tests 101
ℹ pass 101
ℹ fail 0
exit 0

$ bash tools/verify/segment-contract.sh
ok 11 negativa: copia sin «Long output (builds» en core/skills/execute-plan/SKILL.md rechazada con su mensaje
exit 0

$ node tests/builder-contract.mjs
ok A2
ok A3
ok A5
ok A4
exit 0

$ node --test tests/review-plan/*.test.mjs tests/context-size/*.test.mjs tests/escalera/*.test.mjs
ℹ tests 138
ℹ pass 138
ℹ fail 0
exit 0

$ ./verify   (corrida 1 de 2; extracto de la cola real)
== 8. workspaces ... ok 8e ...
FALLO: 8f: falta algún texto de cierre o base limpia
resultado registrado: Fingerprint: 8fe8aa1a7c89
VERIFY FALLO: paso 8 (exit 1); detalle en pruebas/.temporales/verify.log
exit 1

$ node scripts/kit-verificado.mjs estado --nivel aceptacion
Fingerprint: 9c1dc0fec243
verificar: motivo=huella_distinta
exit 1

$ ./verify   (corrida 2 de 2, tras restaurar «closure ceremony»; extracto de la cola real)
ok 8p: receta de write_stdin ... ok 8u: ... ok 8m: ...
FALLO: 8n: falta «resume waiting in the same turn» en planner.md
resultado registrado: Fingerprint: 9c1dc0fec243
VERIFY FALLO: paso 3h (exit 1); detalle en pruebas/.temporales/verify.log
exit 1

$ node --test tests/review-plan/*.test.mjs tests/context-size/*.test.mjs tests/escalera/*.test.mjs   (relanzamiento 1 de 2, tras corregir A2 y A3)
ℹ tests 138
ℹ pass 138
ℹ fail 0
exit 0

$ node tests/builder-contract.mjs
ok A1
ok A2
ok A3
ok A5
ok A4
exit 0

$ bash tools/verify/segment-contract.sh   (tail)
ok 11 negativa: copia sin «Long output (builds» en core/skills/execute-plan/SKILL.md rechazada con su mensaje
exit 0

$ bash tools/verify/operating-contract.sh   (tail)
ok 8d: executor:, 20 words (sin 60 words), ventana propia y pi-builder presentes; copia sin executor: falla
exit 0

$ node scripts/kit-verificado.mjs estado --nivel aceptacion
Fingerprint: e062572fc0d5
verificar: motivo=huella_distinta
exit 1   (árbol cambiado desde el fallo anterior: corrida nueva permitida)

$ ./verify   (corrida final autorizada por D-06, 1 de 1; salida completa)
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: e062572fc0d5
VERIFY OK
exit 0

## Notes
PAUSED motivo=verify (D-03: segundo fallo de `./verify`).
- Hecho: los 5 TODO (A1–A4) con su check; `Segment verification:` pasa (138/138).
- Falta: `./verify` (Verification) pasa. Dos corridas: 8f (paso 8) y 8n (paso 3h). Ambas son frases de `core/agents/planner.md` que recorté; `verify` se detiene en el primer fallo, así que los pasos después de 3h no se han visto en la corrida 2.
- Causa 8f: quité «closure ceremony» del paso 5. Restaurada.
- Causa 8n: quité «resume waiting in the same turn» de la línea Waiting (`tools/verify/verification-contracts.sh:24-26`). NO restaurada: `planner.md` queda en 8191/8192 B; restaurarla pide ≥18 B menos en otra parte.
- Siguiente paso exacto: restaurar la frase de 8n en `core/agents/planner.md` sin pasar de 8192 B; luego, con el sí de la persona, una corrida más de `./verify` (tercer intento, fuera de D-03).
- Opciones: (recommended) restaurar la frase y compensar bytes en `planner.md`, relanzar una vez con el sí; revertir `planner.md` y aplicar A2 con sustituciones del mismo tamaño; subir el límite de 8192 B (decisión fuera de este plan).
- Pendiente fuera de *Scope*: `core/references/planner/review-extras.md` aún dice «Per-segment review»; `kit run` y `README.md` sin cambios.
- Revisar: el paso 3h y siguientes de `./verify` no se han ejecutado con los cambios; un defecto nuevo ahí cuenta como otro fallo.
- Observación: `tools/verify/operating-contract.sh` escribe «/eneg/...: No such file» en stderr aunque sale 0; ya estaba así (no tocado).
Devuelto: verify — tramo 1 — core/agents/planner.md:49, A2: falta «resume waiting in the same turn» (8n); restaurar la línea original y liberar bytes sin quitar reglas de seguridad.
Devuelto: omision — tramo 1 — core/skills/execute-plan/SKILL.md:78, A3: «dos veces → PAUSED» solo cubre *Verification* y modo continuo; debe valer para cualquier comando o corrección.

Relanzamiento 1 de 2 (D-06), corregidos los dos Devuelto:
- Corregido verify (A2): `core/agents/planner.md` vuelve a «answer in one line and resume waiting in the same turn». Bytes liberados sin quitar reglas: «One final review, in a fresh context.» y «Intermediate messages are one line.» (planner.md 8184/8192 B).
- Corregido omision (A3): en `core/skills/execute-plan/SKILL.md`, la regla de pausas (`verify`) ya no es solo de *Verification*: «any command or correction that fails twice, or the same correction applied twice, with no third attempt». builder.md + SKILL.md 13474/13500 B.
- Frases exigidas comprobadas en solo lectura antes de `./verify`: todas presentes; `tests/continuity/protocol.mjs` no se ejecutó.
- `./verify` 1 de 1 (D-06): VERIFY OK, Fingerprint e062572fc0d5. Sin más intentos.
- Pendiente fuera de *Scope* (sin cambio): `core/references/planner/review-extras.md` aún dice «Per-segment review»; `kit run`, README y `docs/` sin cambios. Observación: `operating-contract.sh` escribe «/eneg/...: No such file» en stderr con salida 0 (ya estaba así).

Revisión final (planner): APPROVED. A1, A2, A3 y A4 cumplidos (D-02, D-04, D-05, D-06); `kit-verificado` exit 0, Fingerprint e062572fc0d5, sin repetir `./verify`. Pruebas existentes sin debilitar (solo altas y dos frases movidas); *Blockers* y reglas de seguridad intactos.
Menores anotados, no devueltos: A2 no dice en `planner.md` que con `kit run` su revisor es la revisión única; se quitó «and work continues» de la línea de mensajes intermedios (liberar bytes).
