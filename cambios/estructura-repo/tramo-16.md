# Tramo 16 — Extraer generación y lanzador Codex (borrador)

## Pasos

### Tramo 16 — Historia: aislar generación y lanzador Codex
Como mantenedor quiero localizar esta fase en un módulo para leer y mantener la verificación.
Dependencias: tramo 15 revisado; referencia y entorno aislado del tramo 1; Bash y herramientas de `./verify` disponibles.
Contratos a conservar: mismo shell, orden, variables, funciones, traps, directorio de trabajo, mensajes, código de salida y pruebas negativas. No cambiar las rutas de los fixtures ni las aserciones. El escenario 9 permanece aislado hasta su tramo de sustitución aprobado.
Rutas susceptibles de cambio: `verify` y `tools/verify/codex-launcher.sh`; las pruebas existentes no se mueven.
Ejemplo concreto del resultado esperado: La generación y reinstalación Codex conservan sus salidas.
Alcance: extraer exclusivamente el segmento contiguo indicado, sin cambiar su contenido ni pruebas.
Archivos: `verify`, `tools/verify/codex-launcher.sh`.
CUANDO se ejecute `./verify` ENTONCES esta fase conserva su resultado y posición en el flujo completo (A16).
Aceptación A16: el bloque se carga exactamente una vez en el punto original y `./verify` y la simulación coinciden con la línea base aislada.
TODO:
- [ ] Copiar a `tools/verify/codex-launcher.sh` desde el comentario `# 3f. Codex:` hasta inmediatamente antes de `3g. pruebas negativas de Codex` (A16). Comprobación: comparar con el bloque original de Git, líneas 764–910; esperar contenido idéntico.
- [ ] Sustituir ese bloque en `verify` por `source tools/verify/codex-launcher.sh` (A16). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún cambio de lógica.
- [ ] Comprobar `bash -n verify` y `bash -n tools/verify/codex-launcher.sh` (A16). Comprobación: esperar código 0.
- [ ] Ejecutar `./verify` en el entorno aislado (A16). Comprobación: esperar código 0 y resultados equivalentes a la referencia.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo entorno (A16). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, por petición del usuario después de cada movimiento; además comparar la simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante diferencia no explicada, no avanzar.

## Evidencia
Pendiente.
