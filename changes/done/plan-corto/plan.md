---
status: done
branch: feature/plan-corto
base: main
repos: [.]
executor: builder
segment: 2
continuity: continuous
type: code
---
# Plan corto: kit más rápido

## Goal
Planificar y construir con menos pasos obligatorios, sin quitar restricciones de seguridad; los planes antiguos siguen válidos.

## Exploration
Modo rápido. `planner.md` ya permitía 2 archivos (tope 30 líneas); la persona eligió D-01. Por la definición actual casi todo plan es de alto riesgo: ver D-03.

## Decisions already taken
- D-01, D-02, D-03, D-05, D-06
- Executor: builder, porque requisitos, rutas y comprobaciones están definidos y no hay credenciales ni despliegue.

## Scope
`core/skills/plan-change/`, `core/skills/execute-plan/SKILL.md`, `core/skills/prepare-project/SKILL.md`, `core/agents/planner.md`, `core/agents/builder.md`, `core/references/planner/`, `core/contracts/verification.md`, `scripts/review-plan.mjs`, `tools/verify/*.sh` (solo frases movidas), `tests/builder-contract.mjs`, `tests/review-plan/`, `tests/context-size/sizes.test.mjs`, `docs/como-funciona.md`, `docs/guide.md`, `docs/implementacion.md`.

## Verification
`./verify` — una vez, al final.

## Steps
### Segment 1 — Story: kit más rápido
As a persona usuaria I want planes cortos so that apruebo antes.
Dependencies: none.
Files: `core/skills/plan-change/SKILL.md`, `core/skills/plan-change/references/template.md`, `scripts/review-plan.mjs`
WHEN reviso un plan `format: 2` THEN solo se exige lo corto (A1) (A2).
Acceptance:
- A1: obligatorias solo Goal, Scope, Verification, Steps; por tramo Files, A# con comando y resultado esperado, TODO y Segment verification; el resto opcional; `template.md` ≤ 3072 bytes; sensibilidad solo en A# de alto riesgo (D-03); check `node --test tests/context-size/sizes.test.mjs`; expect exit 0.
- A2: con `format: 2` un plan corto no da avisos; un A# sin comando entre acentos graves o sin resultado esperado falla, salvo «revisión manual», sin validar el binario (D-06); sin la marca nada cambia; check `node --test tests/review-plan/review-plan.test.mjs`; expect exit 0.
TODO:
- [x] Reescribir `core/skills/plan-change/references/template.md` con `format: 2` y lo corto; límite en `tests/context-size/sizes.test.mjs` (A1). Check: `node --test tests/context-size/sizes.test.mjs`.
- [x] Mover continuidad a `core/skills/plan-change/references/segments.md`, sin la parada previa a medir (A1). Check: `git diff --check`.
- [x] Marcar opcionales en `core/skills/plan-change/SKILL.md`, `core/skills/plan-change/references/rules.md` y segments, conservando frases probadas (A1). Check: `node tests/builder-contract.mjs`.
- [x] Aplicar D-02 en `scripts/review-plan.mjs` y su ayuda; casos positivos y negativos en `tests/review-plan/review-plan.test.mjs` (A2). Check: `node --test tests/review-plan/review-plan.test.mjs`.
Segment verification: `node --test tests/review-plan/review-plan.test.mjs tests/context-size/sizes.test.mjs && node tests/builder-contract.mjs` — level 1; exit 0; covers A1, A2.
Handoff: `format: 2` va en el frontmatter; un `tramo-N.md` lo hereda del `plan.md` vecino. Ejemplo: «A1: guarda; check `npm test`; expect exit 0» pasa; «A1: guarda» falla.

### Segment 2 — Story: kit más rápido
As a persona usuaria I want menos pausas so that el cambio termina antes.
Dependencies: Segment 1 — formato corto.
Files: `core/skills/execute-plan/SKILL.md`, `core/agents/planner.md`, `core/skills/prepare-project/SKILL.md`, `tools/verify/small-change-contract.sh`
WHEN no hay duración previa THEN el builder usa el tope y sigue (A3) (A4) (A5).
Acceptance:
- A3: sin duración previa, tope 3 min (Comprobación rápida y nivel 1) o 10 min (Verification y niveles 2–3) y se anota la real; con duración previa sigue el doble; desaparece la parada antes de medir; check `node tests/builder-contract.mjs`; expect exit 0.
- A4: cambio pequeño según D-01 y D-05 (120 líneas de producto; las pruebas no cuentan, con tope propio de 150); condición 4 sin cambios y Gate 2 se mantiene; check `node tests/builder-contract.mjs`; expect exit 0.
- A5: `prepare-project` agrega siempre al `AGENTS.md` del proyecto la línea `Comprobación rápida: <comando>` (typecheck + lint + pruebas relacionadas, < 60 s) y el builder la corre al cerrar cada tramo; conserva «Sin esa línea»; check `node tests/builder-contract.mjs`; expect exit 0.
TODO:
- [x] Cambiar topes y cierre de tramo en `core/skills/execute-plan/SKILL.md`; frases y mutaciones en `tests/builder-contract.mjs` (A3) (A5). Check: `node tests/builder-contract.mjs`.
- [x] Aplicar D-01 en `core/agents/planner.md`; exigir en `tests/builder-contract.mjs` la condición 4 literal (A4). Check: `node tests/builder-contract.mjs`.
- [x] Cambiar `30 diff lines` por `120 diff lines` en `tools/verify/small-change-contract.sh` (A4). Check: `git diff --check`.
- [x] Actualizar `core/skills/prepare-project/SKILL.md` y `core/contracts/verification.md`; probar frases en `tests/builder-contract.mjs` (A5). Check: `node tests/builder-contract.mjs`.
- [x] Alinear `docs/como-funciona.md`, `docs/guide.md` y `docs/implementacion.md` (A3) (A4) (A5). Check: `git diff --check`.
- [x] Ejecutar la verificación final desde `tools/verify/` (A3) (A4) (A5). Check: `./verify`; exit 0.
Segment verification: `node tests/builder-contract.mjs && node --test tests/context-size/sizes.test.mjs` — level 1; exit 0; covers A3, A4, A5.
Handoff: márgenes mínimos: `planner.md` ≤ 8192 (hoy 8184); `builder.md` + execute-plan ≤ 13500 (hoy 13474). Compacta redacción sin quitar reglas ni frases probadas. Los dotfiles sin seguimiento de la raíz son máscaras del sandbox: ignóralos.

## Evidence

Tramo 1 (`segment: 1`):

$ node --test tests/context-size/sizes.test.mjs
ℹ tests 8
ℹ pass 8
ℹ fail 0
exit 0

$ git diff --check
(sin salida)
exit 0

$ node tests/builder-contract.mjs
ok A3
ok A5
ok A4
exit 0

$ node --test tests/review-plan/review-plan.test.mjs
ℹ tests 27
ℹ pass 27
ℹ fail 0
exit 0

Verificación del tramo 1 (`Segment verification:`):

$ node --test tests/review-plan/review-plan.test.mjs tests/context-size/sizes.test.mjs && node tests/builder-contract.mjs
exit 0

Tramo 2 (`segment: 2`):

$ node tests/builder-contract.mjs
ok A3
ok A4
ok A5
exit 0

$ node --test tests/context-size/sizes.test.mjs
ℹ tests 8
ℹ pass 8
ℹ fail 0
exit 0

$ git diff --check
(sin salida)
exit 0

Verificación final (`Verification`, tramo 2, intento 1 de 2):

$ ./verify
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
VERIFY FALLO: paso 3h (exit 1): 8m, «Sin esa línea» ausente en prepare-project (frase reescrita en minúscula)
exit 1

Corrección: se restauró «Sin esa línea» en `core/skills/prepare-project/SKILL.md` y las aserciones de A5 en `tests/builder-contract.mjs`.

Verificación final (`Verification`, tramo 2, intento 2 de 2):

$ ./verify
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: e9c61b69c1bc
VERIFY OK
exit 0
Fingerprint: e9c61b69c1bc

Ejecución de devoluciones (tramo 2, `segment: 2`):

$ ./verify (intento 1 de esta ejecución)
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
VERIFY FALLO: paso 3h (exit 1): 8n, falta «resume waiting in the same turn» en planner.md
exit 1
Fingerprint: 96552a8dd513

Corrección: `core/agents/planner.md` recupera la frase en la línea de espera («resume waiting in the same turn»); para bajar de 8192 bytes se recortaron «diagnostics» y «then tell the user» y se compactaron «until a stop condition» y «the user chooses». Tamaño final: 8187 bytes.

$ node --test tests/context-size/sizes.test.mjs tests/review-plan/review-plan.test.mjs
ℹ tests 38
ℹ pass 38
ℹ fail 0
exit 0

$ node tests/builder-contract.mjs
exit 0

$ bash tools/verify/verification-contracts.sh
exit 0

$ ./verify (intento 2 de esta ejecución)
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 316618342624
VERIFY OK
exit 0
Fingerprint: 316618342624

Relanzamiento (correcciones de la revisión final; solo las cuatro devueltas):

$ node --test tests/review-plan/review-plan.test.mjs tests/context-size/sizes.test.mjs
ℹ tests 38
ℹ pass 38
ℹ fail 0
exit 0

$ node tests/builder-contract.mjs
exit 0

$ git diff --check
(sin salida)
exit 0

$ ./verify
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: ae4908596678
VERIFY OK
exit 0
Fingerprint: ae4908596678

$ node scripts/kit-verificado.mjs estado --nivel aceptacion
Fingerprint: ae4908596678
ya verificado: nivel=aceptacion fase=26
exit 0

## Notes
- Checkpoint (2026-11-27, ejecución de devoluciones): `core/skills/plan-change/SKILL.md`, `references/template.md`, `rules.md`, `segments.md` en inglés; `template.md` con `base:`, Evidence y Notes; `core/skills/execute-plan/SKILL.md` con salto final; `scripts/review-plan.mjs` y tests con `COMMAND_CORTO_RE` (30 casos D-02 en el tramo 1); `core/agents/planner.md` restaura «find root causes» y «Filter long output; one file per command», y la espera con «resume waiting in the same turn» (8187 bytes). `./verify`: intento 1 falló en 8n (frase quitada al recortar); intento 2 OK, Fingerprint 316618342624.
- PAUSED motivo=access: falta borrar `core/skills/plan-change/references/template-anterior.md`. Un hook de la sesión bloqueó el borrado (acción protegida, la hace la persona usuaria). Ya no tiene referencias en `SKILL.md` ni en `template.md`. Siguiente paso: la persona usuaria borra el archivo; luego el planner reaprueba y relanza sin texto de parada.
- Tramo 2 (2026-11-27): `core/skills/execute-plan/SKILL.md` (topes de 3 min y 10 min sin medida, tope doble con medida, sin parada antes de medir; Comprobación rápida al cerrar tramo), `core/agents/planner.md` (D-01: 120 líneas de diff, pruebas con tope 150, comportamiento nuevo con prueba), `core/skills/prepare-project/SKILL.md` y `core/contracts/verification.md` (la línea `Comprobación rápida` siempre se agrega; menos de 60 s), `tests/builder-contract.mjs` (aserciones y mutaciones de A3, A4 y A5), `tools/verify/small-change-contract.sh` (120 diff lines), `docs/guide.md`, `docs/implementacion.md`, `docs/como-funciona.md`. Tamaños: planner.md 8182 (≤8192), builder.md + execute-plan 13418 (≤13500). Check de tramo: pasa. `./verify`: intento 1 falló en 8m («Sin esa línea»); intento 2 OK, Fingerprint e9c61b69c1bc.
- Historia única: tramos 1 y 2 completos; plan `status: done`. Pendientes: 0.


- Tramo 1 (2026-11-27): archivos `core/skills/plan-change/references/template.md` (corto, `format: 2`; formato anterior en `template-anterior.md`), `references/segments.md` (continuidad sin parada previa a medir; sensibilidad solo en A# de alto riesgo, D-03), `SKILL.md`, `references/rules.md`, `scripts/review-plan.mjs` (`format: 2`, `formatoCorto`, `COMMAND_RE`, ayuda), `tests/review-plan/review-plan.test.mjs` (4 casos D-02), `tests/context-size/sizes.test.mjs` (límite 3072). Diff: solo texto de skills y script; `git diff --check` limpio. Check: pasa.
- Historia única: los tramos 1 y 2 comparten «kit más rápido» y `continuity: continuous`; se continúa con `segment: 2` en la misma ejecución.
- Pendientes tras el tramo 1: 6 (`awk` del contador canónico).

Devuelto: omision — tramo 1 — core/skills/plan-change/references/template-anterior.md:80,84, A1/A3: copia idéntica de la plantilla vieja; conserva la parada antes de medir y la sensibilidad para toda prueba nueva. Elimínala y quita sus referencias; los planes antiguos no la necesitan.
Devuelto: defecto — tramo 1 — core/skills/plan-change/SKILL.md:14-72, A1: el formato corto debe ser el predeterminado: el bloque de plantilla sigue siendo el largo y sin `format: 2`, y la regla de tramos aún exige `Handoff:`. Secciones y campos opcionales «solo para alto riesgo (D-03) o cuando aporten», dentro del bloque para conservar las frases probadas. Agrega a template.md `base:` opcional y los encabezados Evidence y Notes.
Devuelto: defecto — tramo 1 — core/skills/plan-change/references/rules.md:18, A1: «estas reglas siguen como guía» degrada todas las reglas (repos, credenciales, preguntas, executor). Siguen obligatorias; solo cambian las secciones y campos exigidos.
Devuelto: defecto — tramo 1 — SKILL.md, template.md, rules.md, segments.md: texto operativo nuevo en español; el invariante de AGENTS.md pide inglés (literales como `revisión manual` se conservan).
Devuelto: defecto — tramo 1 — scripts/review-plan.mjs:39, A2: avisa «sin comando ejecutable» ante `npx vitest run`, `./gradlew test`, `uv run pytest`, `dotnet test`, `test -f x`, `rg -q x f`, `grep -q x f`; también si el comando está en la línea de continuación del mismo A#. Deben pasar; un nombre de archivo o prosa sin comando debe seguir fallando. Cubre ambos casos en las pruebas.
Devuelto: omision — tramo 2 — core/agents/planner.md:36,67, A4: al compactar se quitaron las reglas «find root causes» y «Filter long output; one file per command». Restáuralas compactando solo redacción (≤ 8192 bytes). En execute-plan/SKILL.md repón el salto de línea final.

Planner: pausa de acceso (entorno): un hook bloqueó borrar template-anterior.md; lo borra la persona usuaria. Sin referencias restantes. Después: revisión y ./verify, sin relanzar.

Revisión final (2026-11-27): APPROVED. A1 (D-03), A2 (D-02), A3, A4 (D-01, D-05) y A5 cumplen. `./verify` OK sobre el árbol actual, Fingerprint 25e660452e26; en `tests/` solo hay líneas agregadas; diff dentro de Scope. La persona usuaria borró `template-anterior.md`.
Menor 1: `docs/guide.md` aún dice «sin funcionalidad nueva» y `docs/implementacion.md` no menciona el comportamiento nuevo con prueba (paso «Alinear docs» marcado, incompleto).
Menor 2: `core/agents/planner.md` perdió al compactar «never message it» (espera del builder) y cambió «user-requested» por «on request» (subagente de lectura).
Menor 3: `core/skills/plan-change/SKILL.md` cita «(D-03)», que no existe en otros proyectos.
Menor 4: con `format: 2`, `scripts/review-plan.mjs` no reconoce comandos como `mvn`, `php`, `flutter` ni un script propio `./x.sh`.

Último relanzamiento, pedido por la persona usuaria: solo las cuatro correcciones siguientes, nada más; `./verify` una vez, al final.
Devuelto: omision — tramo 2 — core/agents/planner.md:49,68, A4: restaura literal `never poll or message it` (línea Waiting, conservando `resume waiting in the same turn`) y `(user-requested)` en el subagente de solo lectura. Para caber en 8192 bytes quita solo palabras redundantes, ninguna regla, y anota en Notes cada frase cambiada.
Devuelto: defecto — tramo 1 — scripts/review-plan.mjs, A2 (D-06): con `format: 2` no valides el binario; basta un comando entre acentos graves y un resultado esperado en el mismo A#. Casos que pasan: `mvn`, `php`, `flutter`, `./x.sh`; casos que fallan: sin acentos graves y sin resultado esperado. Reemplaza los negativos de este cambio que dependían del binario; ajusta la ayuda.
Devuelto: defecto — tramo 1 — core/skills/plan-change/SKILL.md:39, A1: quita la cita `(D-03)`; la regla queda sin ID.
Devuelto: omision — tramo 2 — docs/guide.md (línea «Cambio pequeño») y docs/implementacion.md (sección «Cambio pequeño»), A4: 2 archivos de producto, 120 líneas de producto (pruebas aparte, tope 150) y comportamiento nuevo solo con una prueba que pase en la Comprobación rápida; quita lo que lo contradiga y conserva las exclusiones de riesgo.

- Relanzamiento (2026-11-27), cuatro correcciones devueltas; cada frase cambiada en `core/agents/planner.md` (8191 bytes, ≤8192):
  - «never polled» → «never poll or message it» (línea Waiting, con «resume waiting in the same turn» conservada).
  - «(on request)» → «(user-requested)» (subagente de solo lectura).
  - «Low risk: do not rerun» → «Low risk: no rerun».
  - «then report it» → «then report».
  - «One final review, in a fresh context» → «One final review, in fresh context».
  - «then set `segment:` to the next and `approved`» → «then set `segment:` to the next, `approved`».
- `scripts/review-plan.mjs` (D-06, con `format: 2`): se quitó `COMMAND_CORTO_RE`; basta un comando entre acentos graves y un resultado esperado («expect», «espera» o «esperado») en el mismo A#, o «revisión manual». No valida el binario. Ayuda actualizada. Pruebas: `mvn test`, `php artisan test`, `flutter test` y `./x.sh` pasan; sin acentos graves o sin resultado esperado fallan.
- `core/skills/plan-change/SKILL.md`: quitada la cita «(D-03)».
- `docs/guide.md` y `docs/implementacion.md` («Cambio pequeño»): la funcionalidad nueva se permite solo con una prueba que pase en la Comprobación rápida; se mantienen las exclusiones de riesgo y los topes de 2 archivos, 120 líneas de producto y 150 de pruebas.
- Resultado: `./verify` una vez, exit 0, Fingerprint ae4908596678. Pendientes: 0. Plan `status: done`; `segment:` queda en 2 (último tramo). Cierre y commit: lo hace la persona usuaria con el planner.

Revisión de cierre (2026-11-27): APPROVED. Las cuatro correcciones (D-06) están; A1–A5 siguen cumpliendo; `./verify` OK, Fingerprint ae4908596678; en `tests/` solo líneas agregadas; diff dentro de Scope. Cierre pedido por la persona usuaria; después de `verify` solo cambian `AGENTS.md` y `changes/`.
