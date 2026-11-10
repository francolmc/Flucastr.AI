---
estado: aprobado
rama: feature/kit-run
base: main
repos: [.]
ejecutor: constructor
tramo: 2
---
# `kit run`: un script orquesta al constructor y despierta al principal solo para revisar

Aprobado por Franco el 2026-11-09. Se levanta la condición de esperar 5 cambios medidos: la medición queda para el piloto del tramo 2 (A4).

## Objetivo
Un solo comando, igual en Claude Code, Codex y Pi, lanza al constructor sin interfaz, corre la verificación según el tipo del plan, relanza hasta 2 veces si falla y, solo al final, ejecuta al principal en un proceso nuevo, de solo lectura y con tope, con `plan.md` + diff + evidencia. Franco lee el veredicto. El modelo caro deja de esperar y de orquestar.

## Supuestos
- Se decide hacerlo si, tras `principal-sin-ejecutar`, el principal sigue gastando más que el constructor en sesiones de 5 cambios medidos (umbral sugerido: créditos del principal ÷ constructor > 3). Si ya baja de ahí, este plan se archiva sin ejecutar.
- Evidencia que lo sostiene: en las sesiones de Codex del 8–9 nov, coordinar y esperar al constructor fue 35–39 % de los créditos de Sol y los sondeos otro 11 %. Dos investigaciones externas (Anthropic, Cognition) recomiendan revisar en un contexto nuevo y mover la orquestación a un script. Los datos de Cognition son internos, sin metodología publicada.
- Los tres CLIs tienen modo sin interfaz (verificado en esta máquina): `claude -p` (con `--max-budget-usd`), `codex exec` (con `--output-schema`, `--json`, `--sandbox`; sin tope de turnos, lo controla el script) y `pi -p`. Si `--max-turns` no existe en Claude Code, el tope es el presupuesto.
- La conversación interactiva con el principal queda para planificar y para las pausas; la revisión pasa a ser un veredicto leído. Si Franco quiere seguir revisando conversando, se mantiene el flujo actual.

## Alcance
`scripts/kit-run.mjs` (nuevo), `instalar.sh` (un lanzador `kit-run`), `scripts/resolver.mjs` si hace falta un subcomando, `pruebas/kit-run/` (nuevo, con CLIs simulados), `verify` (un paso), `README.md`, `AGENTS.md`, `agentes/principal.md` (cómo pedir `kit run` en vez de lanzar al subagente).
Fuera: `modelos.json` (se reutilizan nivel y esfuerzo de cada agente), hooks y permisos, `cambios/hechos/`, `old/`.

## Decisiones ya tomadas
- Dos roles; sin agentes nuevos; un solo escritor (el constructor).
- El script, no un modelo, decide el orden: constructor → verificación → (≤2 relanzamientos) → revisión → fin.
- Revisión en proceso nuevo, solo lectura, con tope de presupuesto o turnos, salida estructurada `APROBADO | DEVUELTO | PAUSA` con lista de defectos (archivo, línea, criterio). `DEVUELTO` vuelve al constructor dentro del mismo cupo de 2.
- Toda pausa termina el script con estado `parcial` y un resumen; no pide nada por teclado.
- Evidencia y estados siguen en `plan.md`; sin archivos nuevos de evidencia.
- Se empieza por Codex (donde está el gasto medido) y se replica a Claude Code y Pi solo si el piloto cumple.
- Ejecutor: constructor, porque cada tramo declara archivos, comandos y comprobaciones; no toca producción ni credenciales.

## Escenarios
- CUANDO un plan aprobado se lanza con `kit run` ENTONCES el constructor corre sin interfaz y el plan queda `listo` con la evidencia escrita (A1).
- CUANDO la verificación falla ENTONCES el script relanza con la salida del error, máximo 2 veces, y luego deja `parcial` (A2).
- CUANDO la verificación pasa ENTONCES el principal corre en un proceso nuevo, de solo lectura, y devuelve un veredicto estructurado (A3).
- CUANDO el principal devuelve defectos ENTONCES se relanza al constructor dentro del cupo de 2 (A2, A3).
- CUANDO se mide la sesión ENTONCES el principal no tiene ediciones ni sondeos y su costo es menor que el del constructor × 3 (A4).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Ciclo completo con CLIs simulados | `node pruebas/kit-run/probar.mjs` | Constructor falso crea un archivo, verificación falsa pasa, revisor falso aprueba; plan `listo` |
| A2 | Tope de relanzamientos | Mismo arnés con verificación que siempre falla | Exactamente 3 corridas del constructor (1 + 2), estado `parcial` |
| A3 | Revisor de solo lectura con veredicto | Arnés con revisor que intenta escribir | La escritura se rechaza; el veredicto se valida contra el esquema |
| A4 | Piloto real en Codex | Un cambio chico real y `node scripts/uso.mjs --sesiones` | 0 ediciones del principal; créditos del principal < 3 × los del constructor |
| A5 | Sensibilidad | Arnés con revisor que devuelve JSON inválido | El script termina `parcial` sin aprobar |

## Verificación
`./verify` — con el arnés `pruebas/kit-run/` incluido.

## Pasos
### Tramo 1 — Piloto en Codex con CLIs simulados
Resultado: `scripts/kit-run.mjs` corre el ciclo con ejecutables simulados y pasa A1, A2, A3 y A5.
Archivos: `scripts/kit-run.mjs`, `pruebas/kit-run/`.
- [x] Definir la interfaz: `node scripts/kit-run.mjs <plan> --herramienta codex|claude|pi` con los ejecutables reemplazables por variable de entorno (A1)
  - evidencia: `scripts/kit-run.mjs` (leerArgs, comando, KIT_RUN_CONSTRUCTOR/REVISOR/VERIFY); `node scripts/kit-run.mjs` exit 2 con uso; `node scripts/kit-run.mjs cambios/kit-run/plan.md --herramienta claude` exit 2 sin ejecutables sobrescritos
- [x] Implementar el ciclo constructor → verificación → relanzamientos (máx. 2) → revisión, con estados escritos en el plan (A1, A2)
  - evidencia: `scripts/kit-run.mjs` (main: bucle con MAX_RELANZAMIENTOS = 2, fijarEstado, anotarNotas); A1 y A2 en `pruebas/kit-run/probar.mjs`, exit 0
- [x] Validar el veredicto del revisor contra un esquema; inválido = `parcial` (A3, A5)
  - evidencia: `scripts/kit-run.mjs` (ESQUEMA_VEREDICTO, validarVeredicto); A3a–A3d y A5a–A5c en `pruebas/kit-run/probar.mjs`, exit 0
- [x] Arnés con constructor, verificador y revisor simulados, incluida la verificación que siempre falla (A1, A2, A3, A5)
  - evidencia: `pruebas/kit-run/probar.mjs` (10 casos, exit 0; ver Evidencia)
- [x] `./verify` (A1–A3, A5)
  - evidencia: `./verify`, exit 0 (paso 13 corre `pruebas/kit-run/probar.mjs`)

Verificación del tramo: `node pruebas/kit-run/probar.mjs && ./verify`.

### Tramo 2 — Piloto real en Codex
Resultado: un cambio chico real corre con `codex exec` y se mide.
Archivos: `scripts/kit-run.mjs`, `instalar.sh`, `docs/evaluaciones/costos.md`.
- [x] Mapear a `codex exec` (`--sandbox workspace-write` para el constructor, `--sandbox read-only` y `--output-schema` para el revisor, tope de tiempo externo) (A4)
  - evidencia: `scripts/kit-run.mjs` (comando: `exec --sandbox … -m <modelo> -c model_reasoning_effort=… -C <raiz> [--output-schema <f>] -`; TOPE_MS y `correr(…, tope)` con `spawnSync timeout`; preflight en main); casos C1 y C2 en `pruebas/kit-run/probar.mjs`, con `codex` falso en el PATH, exit 0. Sin `codex` real.
- [x] Lanzador `kit-run` generado por `instalar.sh` (A4)
  - evidencia: `instalar.sh` (`generar_lanzador_kit_run`, llamada en el bloque de Codex); con `HOME` y `CODEX_HOME` temporales, `bash instalar.sh --solo codex` generó `kit-run` con la marca `flucastr-ai:generado` y `exec node "$RAIZ/scripts/kit-run.mjs" "$@"`; `kit-run` sin argumentos sale con exit 2 y uso; `desinstalar.sh` lo borra. `~/.local/bin` no se tocó.
- [x] Piloto con un plan de documentos real y medición con `uso.mjs` (A4)
  - evidencia: ciclo completo con Codex real (APROBADO tras 2 corridas); **A4 no cumplido**: créditos principal 2,6292 vs constructor 0,3966 (≈6,6 > 3); ediciones del principal 0. Detalle en `docs/evaluaciones/costos.md` (plan `cambios/anotar-a4/plan.md`). El tramo 3 queda en espera.

Verificación del tramo: `./verify`; A4 se anota en `docs/evaluaciones/costos.md`.

### Tramo 3 — Claude Code y Pi
Resultado: mismo ciclo en las otras dos herramientas, solo si el tramo 2 cumplió.
Archivos: `scripts/kit-run.mjs`, `pruebas/kit-run/`, `README.md`, `AGENTS.md`, `agentes/principal.md`.
- [ ] Mapear a `claude -p` (con `--max-budget-usd`) y a `pi -p` con su `--thinking` (A1)
- [ ] Documentar en `agentes/principal.md` cómo se pide `kit run` y qué hace el principal cuando termina (A1)
- [ ] `./verify` (A1–A5)

Verificación del tramo: `./verify`.

## Evidencia
$ node pruebas/kit-run/probar.mjs && ./verify
ok A1 ciclo completo: listo, constructor una vez, revisor en solo lectura
ok A2 verify que siempre falla: 3 corridas del constructor y parcial
ok A3a revisor que intenta escribir con sandbox read-only: la escritura se rechaza y aprueba
ok A3b revisor que escribe aunque el sandbox sea read-only: el árbol cambió, parcial
ok A3c DEVUELTO una vez: vuelve al constructor con los defectos y aprueba
ok A3d DEVUELTO siempre: cupo de 2 agotado, parcial sin más corridas
ok A5a revisor que devuelve texto no JSON: parcial sin aprobar
ok A5b APROBADO con defectos: viola el esquema, parcial
ok A5c veredicto con clave extra: viola el esquema, parcial
ok uso: plan en curso se rechaza sin cambiarlo
kit-run: 10 casos pasaron
ok 13: pruebas de kit run pasaron con los CLIs simulados
VERIFY OK
exit 0

$ node pruebas/kit-run/probar.mjs && ./verify   (tramo 2, pasos 1 y 2)
ok C1 mapeo codex: constructor en workspace-write, revisor en read-only con esquema, modelo del agente
ok C2 tope de tiempo: el constructor que no termina se corta, parcial sin relanzar
kit-run: 12 casos pasaron
ok 13: pruebas de kit run pasaron con los CLIs simulados
VERIFY OK
exit 0

$ node pruebas/kit-run/probar.mjs && ./verify   (corrida tras añadir `!pruebas/kit-run/` a .gitignore)
kit-run: 10 casos pasaron
ok 13: pruebas de kit run pasaron con los CLIs simulados
VERIFY OK
exit 0
$ git check-ignore pruebas/kit-run/probar.mjs
exit 1 (ya no está ignorado)

## Notas
- Decisión menor: la verificación del plan se toma de su primer código en `## Verificación` (`./verify`); `KIT_RUN_VERIFY` lo reemplaza por un ejecutable en pruebas.
- Tramo 2 (constructor, pasos 1 y 2; sin gastar cuota): el mapeo a `codex exec` toma modelo y esfuerzo de `resolver.mjs` (constructor para el constructor, `principal` para el revisor), para que no corran con el modelo por defecto de Codex. Topes de tiempo: constructor 45 min, revisor 15 min, verify 30 min; `KIT_RUN_TOPE_MS` los fija para las pruebas. Un tope superado cuenta como `motivo=acceso` y no relanza. El preflight valida el mapeo antes de tocar el plan: si `modelos.json` no lo resuelve, sale con exit 2 y el plan queda como estaba.
- Banderas de `codex exec` (`-m`, `-c`, `-C`, `--output-schema`, prompt por stdin con `-`) confirmadas con `codex exec --help` local. No se ha ejecutado `codex` real; eso queda para el piloto (tercer paso del tramo 2).
- El lanzador `kit-run` solo se genera con Codex (`INSTALAR_CODEX=1`), igual que el tramo 2. Con `claude` o `pi` el script sigue saliendo con error hasta el tramo 3.
- Tramo 2, paso 3 (piloto real con `codex exec` y medición con `uso.mjs`): sin tocar, pendiente como indicó el encargo.
- Mapeo por defecto: solo `codex` (`codex exec --sandbox workspace-write` para el constructor y `--sandbox read-only --output-schema` para el revisor). Es la forma que pide el tramo 2; no se ha probado contra `codex` real. `claude` y `pi` salen con error hasta el tramo 3.
- La huella del árbol usa `git status`, `git diff HEAD` y el contenido de cada archivo listado; detecta cambios del revisor, pero no cambios en archivos ignorados por git.
- Fallo relacionado corregido durante la prueba: ninguno; el arnés pasó a la primera.
- Tramo 2 y 3 sin tocar.
- Aviso antes del commit: `.gitignore` tiene `pruebas/*` con excepciones solo para `pruebas/uso/` y `pruebas/contrato-constructor.mjs`, así que `pruebas/kit-run/probar.mjs` sale como ignorado (`git check-ignore`). Falta `!pruebas/kit-run/` en `.gitignore`. Está fuera de *Alcance*, así que no lo cambié; lo decide Franco o el principal antes del commit.

- Revisión del principal, tramo 1: defecto. `.gitignore` tiene `pruebas/*` y deja ignorado `pruebas/kit-run/` (línea 2; el arnés A1-A5 no llegaría al commit). Corregir: añadir `!pruebas/kit-run/` junto a las otras excepciones y confirmar con `git check-ignore pruebas/kit-run/probar.mjs` (sin salida). `.gitignore` entra en el Alcance solo para esta línea. Resto del tramo 1: arnés 10/10 y `./verify` OK.
- Corrección del constructor (tramo 1): añadida `!pruebas/kit-run/` a `.gitignore` (tras `!pruebas/uso/`). Defecto reproducido antes: `git check-ignore` devolvía `.gitignore:2`; después no hay salida ni coincidencia. El aviso de la línea anterior queda resuelto. `./verify` pasa (exit 0). Aviso que no es fallo: el paso 10 de `./verify` omite las autopruebas del runner OpenSpec porque `pruebas/comparar-openspec/` no existe en este clon (está en `.gitignore`).
- Pendientes del plan (`- [ ]`): 6, todos de los tramos 2 y 3, fuera de este encargo; no se tocaron.

- Cierre tramo 1 (principal): APROBADO. `scripts/kit-run.mjs` (ciclo constructor → verify → ≤2 relanzamientos → revisor read-only con esquema), arnés `pruebas/kit-run/probar.mjs` 10/10, paso 13 de `verify`, `.gitignore` con `!pruebas/kit-run/`. A1, A2, A3, A5 cumplidas. Sigue el tramo 2 (piloto real con `codex exec`, gasta cuota): pendiente del sí de Franco.
- Tramo 2 aprobado por Franco (2026-11-09, «si, vamos»), incluido el gasto de cuota de Codex. Este encargo al constructor cubre solo los dos primeros pasos (mapeo a `codex exec` y lanzador `kit-run` en `instalar.sh`), sin gasto. El piloto real (tercer paso) lo prepara el principal con un plan de documentos aparte y se corre después.
- Piloto (principal, 2026-11-10): primera corrida real con `codex exec` terminó en PAUSA sin hacer nada (0/1, ~0,09 créditos). Causa: `scripts/kit-run.mjs` línea 254 pone `estado: en curso` antes de lanzar al constructor, y la skill `ejecutar-plan` exige `aprobado` y se detiene. Los CLIs simulados no lo detectaron. Corregir: el script no cambia el estado antes de lanzar (lo pone el constructor); añadir caso al arnés con un constructor simulado que se niega si el estado no es `aprobado`. Tras el arreglo, repetir el piloto con `cambios/piloto-kit-run/plan.md` (ya en `aprobado`).

### Hallazgo del piloto A4 (2026-11-10)
Dos corridas reales con `codex exec` terminaron en PAUSA(acceso) sin hacer nada: `scripts/kit-run.mjs` línea ~254 llama `fijarEstado(planPath, "en curso")` antes de lanzar al constructor, pero `ejecutar-plan` paso 1 se detiene si `estado` no es `aprobado` (el paso 3 es quien pone `en curso`). Los CLIs simulados no lo detectaron porque no leen el estado.
Corrección (para el constructor): quitar ese `fijarEstado(..., "en curso")` previo (dejar el plan en `aprobado` al lanzar; `ejecutar-plan` lo cambia) y que el relanzamiento vuelva a poner `aprobado` antes de cada corrida; añadir un caso al arnés con constructor falso que aborte si `estado` ≠ `aprobado`. Luego repetir el piloto.
