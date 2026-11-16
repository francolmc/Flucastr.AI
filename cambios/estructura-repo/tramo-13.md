# Tramo 13 — Extraer contratos operativos y ejecutor (borrador)

## Pasos

### Tramo 13 — Historia: aislar contratos operativos y ejecutor
Como mantenedor quiero localizar esta fase en un módulo para leer y mantener la verificación.
Dependencias: tramo 12 revisado; referencia y entorno aislado del tramo 1; Bash y herramientas de `./verify` disponibles.
Contratos a conservar: mismo shell, orden, variables, funciones, traps, directorio de trabajo, mensajes, código de salida y pruebas negativas. No cambiar las rutas de los fixtures ni las aserciones. El escenario 9 permanece aislado hasta su tramo de sustitución aprobado.
Rutas susceptibles de cambio: `verify` y `tools/verify/operating-contract.sh`; las pruebas existentes no se mueven.
Ejemplo concreto del resultado esperado: Las pruebas negativas siguen rechazando contratos incompletos.
Alcance: extraer exclusivamente el segmento contiguo indicado, sin cambiar su contenido ni pruebas.
Archivos: `verify`, `tools/verify/operating-contract.sh`.
CUANDO se ejecute `./verify` ENTONCES esta fase conserva su resultado y posición en el flujo completo (A13).
Aceptación A13: el bloque se carga exactamente una vez en el punto original y `./verify` y la simulación coinciden con la línea base aislada.
TODO:
- [ ] Copiar a `tools/verify/operating-contract.sh` desde el comentario `# 8c. contrato operativo` hasta inmediatamente antes de `8e. plazos:` (A13). Comprobación: comparar con el bloque original de Git, líneas 613–670; esperar contenido idéntico.
- [ ] Sustituir ese bloque en `verify` por `source tools/verify/operating-contract.sh` (A13). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún cambio de lógica.
- [ ] Comprobar `bash -n verify` y `bash -n tools/verify/operating-contract.sh` (A13). Comprobación: esperar código 0.
- [ ] Ejecutar `./verify` en el entorno aislado (A13). Comprobación: esperar código 0 y resultados equivalentes a la referencia.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo entorno (A13). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, por petición del usuario después de cada movimiento; además comparar la simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante diferencia no explicada, no avanzar.

## Evidencia
Pendiente.
