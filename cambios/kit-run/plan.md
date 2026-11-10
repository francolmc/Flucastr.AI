---
estado: borrador
rama: feature/kit-run
base: main
repos: [.]
ejecutor: constructor
tramo: 1
---
# `kit run`: un script orquesta al constructor y despierta al principal solo para revisar

Borrador. No aprobar hasta cerrar `cambios/principal-sin-ejecutar/` y tener 5 cambios medidos con su tramo 3 (ver Supuestos).

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
- [ ] Definir la interfaz: `node scripts/kit-run.mjs <plan> --herramienta codex|claude|pi` con los ejecutables reemplazables por variable de entorno (A1)
- [ ] Implementar el ciclo constructor → verificación → relanzamientos (máx. 2) → revisión, con estados escritos en el plan (A1, A2)
- [ ] Validar el veredicto del revisor contra un esquema; inválido = `parcial` (A3, A5)
- [ ] Arnés con constructor, verificador y revisor simulados, incluida la verificación que siempre falla (A1, A2, A3, A5)
- [ ] `./verify` (A1–A3, A5)

Verificación del tramo: `node pruebas/kit-run/probar.mjs && ./verify`.

### Tramo 2 — Piloto real en Codex
Resultado: un cambio chico real corre con `codex exec` y se mide.
Archivos: `scripts/kit-run.mjs`, `instalar.sh`, `docs/evaluaciones/costos.md`.
- [ ] Mapear a `codex exec` (`--sandbox workspace-write` para el constructor, `--sandbox read-only` y `--output-schema` para el revisor, tope de tiempo externo) (A4)
- [ ] Lanzador `kit-run` generado por `instalar.sh` (A4)
- [ ] Piloto con un plan de documentos real y medición con `uso.mjs` (A4)

Verificación del tramo: `./verify`; A4 se anota en `docs/evaluaciones/costos.md`.

### Tramo 3 — Claude Code y Pi
Resultado: mismo ciclo en las otras dos herramientas, solo si el tramo 2 cumplió.
Archivos: `scripts/kit-run.mjs`, `pruebas/kit-run/`, `README.md`, `AGENTS.md`, `agentes/principal.md`.
- [ ] Mapear a `claude -p` (con `--max-budget-usd`) y a `pi -p` con su `--thinking` (A1)
- [ ] Documentar en `agentes/principal.md` cómo se pide `kit run` y qué hace el principal cuando termina (A1)
- [ ] `./verify` (A1–A5)

Verificación del tramo: `./verify`.

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
