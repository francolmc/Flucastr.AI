## Pasos

### Tramo 3 — Historia: comprobar continuidad y parada
Como Franco quiero evidencia de dos tramos y de una falla provocada para confiar en el flujo sin intervención.
Dependencias: Tramo 2 — procedimiento continuo operativo; Externa — lanzador local `codex-constructor` disponible y autorizado para dos sesiones reales independientes.
Contratos a conservar: `kit run` antiguo y sus pruebas; ninguna prueba simulada sustituye ejecución real.
Rutas susceptibles de cambio: `scripts/kit-run.mjs`, `pruebas/kit-run/probar.mjs`, `pruebas/continuidad/`; no mover ni archivar; actualizar las expectativas de `kit run` solo cuando corresponda al modo continuo.
Ejemplo concreto del resultado esperado: plan temporal de dos tramos termina con ambos marcados sin intervención; otro provoca dos fallos de causa idéntica y queda parcial con nota y segundo tramo sin ejecutar.
Alcance: integración de `kit run`, pruebas offline y protocolo de observación real aislado.
Archivos: `scripts/kit-run.mjs`.
CUANDO se ejecuta un plan continuo ENTONCES `kit run` respeta sus límites y el recorrido real demuestra avance y pausa (A3).
Aceptación:
- A3: pruebas offline cubren éxito, pausa, reintentos, compatibilidad y mutación sensible; dos sesiones reales independientes registran los resultados y salidas; comprobar con `node pruebas/kit-run/probar.mjs`, el protocolo de `pruebas/continuidad/` y `./verify`; esperar exit 0 y evidencia real.
TODO:
- [ ] Adaptar `scripts/kit-run.mjs` al modo continuo y mantener el modo antiguo (A3). Comprobación: `node pruebas/kit-run/probar.mjs`; esperar exit 0.
- [ ] Ampliar `pruebas/kit-run/probar.mjs` con dos tramos, parada por segunda falla, ausencia de revisión prematura y compatibilidad antigua (A3). Comprobación: `node pruebas/kit-run/probar.mjs`; esperar exit 0 y mutación de sensibilidad rechazada.
- [ ] Crear `pruebas/continuidad/protocolo.mjs` como protocolo reproducible en repos temporales para dos sesiones reales independientes y comprobar sus registros (A3). Comprobación: ejecutar el protocolo con `codex-constructor`; esperar ambos resultados descritos en A3 sin intervención y sin acceso a secretos.
- [ ] Ejecutar `./verify` completo (A3). Comprobación: `./verify`; esperar exit 0.
Verificación del tramo: `./verify` — nivel 3; exit 0; cubre las pruebas offline de A3; la observación real se verifica además con el protocolo declarado.
Handoff: conservar salidas reales, duración medida, estado del plan, señales del segundo tramo y nota de pausa; si el lanzador o acceso faltan, PAUSA sin afirmar que se observó al constructor.
