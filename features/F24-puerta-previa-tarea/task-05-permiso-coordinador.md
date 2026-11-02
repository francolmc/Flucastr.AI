# task-05 — Permiso del coordinador para el validador
repo: Flucastr.AI   depende_de: task-04   estado: aprobada

## Descripción
El `coordinador` solo puede correr una lista cerrada de tres comandos. Decisión de Franco (2026-11-01): se añade un cuarto, el lanzador fijo del validador de tareas (`~/.flucastr-ai/validar-tarea.mjs`, task-04), con un permiso literal sin `$(…)`. Esta tarea lo declara en `tools:` y en el cuerpo del agente, y actualiza la regla 15 de `contrato-roles.mjs`, que hoy rechaza cualquier cuarto comando. La comprobación real con el arnés es task-07.

## Contexto
- Leer: `definitions/ARCHITECTURE.md`, subsección «Raíz del kit y puerta previa de tarea (F24…)», viñetas «Invocación» y «Contrato». De task-04 (`depende_de`), solo sus *Notas*.
- Tocar: `agentes/coordinador.md`, `pruebas/comprobaciones/contrato-roles.mjs`, `pruebas/comprobaciones/contrato-roles.test.mjs`
- `agentes/coordinador.md`: línea 4 `tools:` (termina en `Bash(node scripts/archivar.mjs --aplicar F*)`); línea 20 «Solo corres los comandos de la sección…»; sección «Comandos que puede correr» (línea 104): «Tienes una lista cerrada de tres comandos» y la lista 1-3; la regla «En modo yolo no los corres, salvo pedido explícito de Franco» (línea 117).
- `contrato-roles.mjs` regla 15 (líneas 240-262): constante `PATRONES_BASH_COORDINADOR` (3 patrones), `toolsCoordinador.match(/Bash(\([^)]*\))?/g)` y los mensajes «los tres patrones». El regex actual sirve tal cual: el patrón nuevo no tiene paréntesis anidados.
- `contrato-roles.test.mjs`: `muestra()` define el `coordinador` de ejemplo (línea 54 `tools`, cuerpo hasta la línea 74); las `variantesF11` (línea 259) son los controles negativos de la regla 15.
- `resolver.mjs` (`bashPlano`, línea 88) y `resolver-agentes.test.mjs` (solo comprueba con `includes`) no cambian.

## Decisiones ya tomadas
- Patrón nuevo, literal, al final de `tools:`: `Bash(node ~/.flucastr-ai/validar-tarea.mjs *)`.
- Regla 15: no se cambia el regex; `PATRONES_BASH_COORDINADOR` pasa a 4 patrones (el nuevo, literal) y los mensajes dicen «los cuatro patrones».
- Cuerpo del `coordinador`: «cuatro comandos»; el cuarto, `node ~/.flucastr-ai/validar-tarea.mjs <ruta-tarea>...` (solo lectura). Es la única excepción a «solo a pedido explícito de Franco»: lo corre el `coordinador` por sí mismo como puerta previa, también en yolo. Se conservan «lista cerrada», «pedido explícito» y «no autoriza».
- La regla 15 exige además que el cuerpo contenga `validar-tarea.mjs`.
- El arnés `pruebas/lanzar-coordinador-claude.sh` NO entra aquí (haría 4 archivos): lo cambia y lo prueba task-07.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: `tools:`, sección «Comandos que puede correr» y líneas 20 y 117 del `coordinador`; regla 15 y sus pruebas.
Fuera de alcance: cuándo y cómo corre el comando el `coordinador` (task-06), el arnés y la prueba real del permiso (task-07), `constructor.md`, `definitions/WORKFLOW.md` §3.1 (queda desfasado; lo actualiza el `arquitecto`; se anota en *Notas*), instaladores.

## Pasos
1. `agentes/coordinador.md`: añadir el patrón a `tools:` y editar líneas 20, 104-110 y 117 según las decisiones.
2. `contrato-roles.mjs`: cuatro patrones, mensajes y la exigencia de `validar-tarea.mjs` en el cuerpo.
3. `contrato-roles.test.mjs`: en `muestra()`, añadir el patrón a `tools` y una línea de cuerpo que nombre `validar-tarea.mjs`.
4. Mismo test: añadir a `variantesF11`: al `coordinador` le falta el patrón nuevo (elemento `validar-tarea.mjs`); el cuerpo pierde `validar-tarea.mjs`; un `Bash(node otro.mjs)` extra se rechaza (control negativo); una variante con la forma antigua `Bash(node "$(cat ~/.flucastr-ai/raiz)/scripts/validar-tarea.mjs" *)` se rechaza.
5. Ejecutar la verificación.

## Criterios de aceptación
1. La regla 15 acepta el `coordinador` con cuatro patrones y rechaza cada variante: `node --test pruebas/comprobaciones/contrato-roles.test.mjs` sin fallos.
2. El `coordinador` real declara el patrón: primer `grep` de *Verificación*.
3. El cuerpo habla de cuatro comandos: segundo `grep`.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs
grep -c 'Bash(node ~/.flucastr-ai/validar-tarea.mjs \*)' agentes/coordinador.md
grep -c 'cuatro comandos' agentes/coordinador.md
```
Esperado: `ℹ fail 0`; luego `1`; luego un número ≥ 1.

## Evidencia

## Notas
Corrección 2026-11-01: el permiso pasa a ser el literal del lanzador fijo (sin `$(…)`), el regex de la regla 15 no cambia y el arnés queda para task-07. `WORKFLOW.md` §3.1 y `pruebas/permisos-ejecucion.md` siguen diciendo «tres comandos» (este último lo actualiza task-07).
