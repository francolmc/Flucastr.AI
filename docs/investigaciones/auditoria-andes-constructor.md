# Auditoría de un traspaso real: Andes (constructor → principal)

Origen: auditoría de solo lectura hecha por el principal del proyecto Andes (cambio `cambios/paridad-tablero-detalle/plan.md`) a pedido de Franco, 2026-11-08. Resumen fiel de lo que pegó Franco; las referencias `P`/`C` son líneas de las sesiones Pi de Andes (`~/.pi/agent/sessions/--home-franco-Codes-andes--/2026-11-07T18-27-00-998Z_01a1b743-…jsonl` para el principal; `<run-id>/run-0/session.jsonl` para cada ejecución del constructor, C1–C5). No se revisaron aquí.

## Conclusión de la auditoría

El constructor dejó una **base productiva sustancial que se conservó**, pero **no la aceptación completa**. El principal terminó corrigiendo producto, ampliando cobertura y sustituyendo la composición del arnés de pruebas. Ni «lo hice todo yo» ni «solo faltaban las capturas». No hay experimento controlado que atribuya la causa a la capacidad del modelo.

## Cronología

| Momento | Qué pasó |
| --- | --- |
| Primera delegación | Solo `Plan:` y `Rama:`. |
| Primera PAUSA (0/16, «acceso») | **Real, pero causada por la preparación**: el prompt del constructor permitía solo consultar/crear rama y no los comandos para acreditar base limpia y al día; además había un cambio pendiente en `AGENTS.md`. No era fallo del código. |
| Construcción inicial | PAUSA de diseño tras intentos de renderizado; 21 archivos / 126 tests verdes, que no acreditan UI ni aceptación. |
| Corte por plazo | La ejecución terminó por timeout de 3.600.000 ms, no por decisión de producto. Quedaban escenarios pendientes. |
| Reanudación | Tailwind sin configuración efectiva; el principal envió diagnósticos concretos y el constructor hizo correcciones reales. |
| Última PAUSA | El constructor **leyó** la instrucción de recuperación ya resuelta («Acceso histórico resuelto») y aun así volvió a ofrecer «aceptar una reconstrucción posterior» como decisión pendiente. Dejó `estado: en curso` pese a devolver PAUSA. |
| Toma por el principal | Franco: «dale, terminalo». Solo entonces `ejecutor: principal`. |

## Atribución por unidad (resumen)

- **Conservado tal cual:** integración del lector en `+page.server.ts`, pruebas de `training-board-prisma`, extracción de `OperationsView`.
- **Reparado por el principal:** `training-board.ts` (distinción cotización/capacitación dependía del estado en vez de la procedencia), `training-board-prisma.ts` (fechas sin serializar, campo no seleccionado), `OperationsBoard`, integración en `+page.svelte` (foco, fallo de refresco), `DocumentManager` (foco, reinicio de upload).
- **Completado por el principal:** `TrainingDetailModal`, formularios de programación (envío correcto, escritura rechazada, refresco fallido), cobertura UI, verificador aislado, referencias históricas y evidencia.
- **Sustituido:** `tests/operations-ui/App.svelte`. El montaje propio del arnés tenía selección, callbacks y estado propios, y no ejercitaba la página real.
- No se asigna porcentaje de reutilización: contar archivos, líneas o casillas no mide trabajo funcional aprovechado.

## Causas

1. **Preparación (principal):** permisos del constructor incompatibles con lo que el plan exigía acreditar; cambio pendiente sin resolver antes de delegar.
2. **Decisión resuelta que se repite:** la última PAUSA no se explica por falta de acceso ni de lectura; la traza no permite saber por qué no aplicó la decisión escrita.
3. **Arnés ≠ producto:** cuatro pruebas UI verdes sobre un montaje sintético no acreditaban formularios, documentos, errores ni refresco de la página real. Es el mismo patrón de «cada pieza está pero no se ejercita el recorrido».
4. **Orquestación y entorno:** el corte de una hora lo impuso el runtime; las reinstalaciones en snapshots nuevos consumían tiempo (`VERIFY_RAPIDO=1` no activaba una caché implementada).
5. **El principal también introdujo defectos** en su tramo (13, luego 22 y luego 8 fallos UI al ampliar el arnés; un uso incompatible de `onCloseAutoFocus`).

## Qué demuestran las pruebas y qué no

| Evidencia | Sí demuestra | No demuestra |
| --- | --- | --- |
| Tests/check/build verdes del constructor | Código compilable y contratos unitarios cubiertos | Que el contrato visual y de interacción estuviera terminado |
| Cuatro UI verdes de la última reanudación | Escenarios limitados de componentes reales en composición sintética | Página real completa, documentos con datos, errores y refresco |
| Aceptación final (143 tests, check 0, build, 36 casos Chromium) | Que el estado posterior a las correcciones del principal pasó | Integración autenticada con servidor, persistencia real, paridad funcional integral |
| Control `expect(1).toBe(2)` | Que un fallo llega al runner y al exit code | Que las pruebas detecten un defecto de producto real |

## Lecciones para el kit

- Un PAUSA/COMPLETADO del constructor no sustituye que la **aceptación se ejecute sobre el recorrido real**, no sobre un montaje propio.
- Las restricciones de permisos del constructor deben ser coherentes con lo que el plan le exige comprobar; la preparación es responsabilidad del principal.
- Una decisión resuelta y leída se vuelve a pedir: hace falta un control fuera del prompt, no más texto.
- Límite de una hora sin estado recuperable: unidades más pequeñas con aceptación cercana reducen lo que se pierde en un corte.
- Caso real utilizable como fixture del tipo «recuperación parcial» y «arnés que no ejerce la página productiva».
