# Tramo 8 — Extraer metadatos de skills (borrador)

## Pasos

### Tramo 8 — Historia: aislar metadatos de skills
Como mantenedor quiero localizar esta fase en un módulo para leer y mantener la verificación.
Dependencias: tramo 7 revisado; referencia y entorno aislado del tramo 1; Bash y herramientas de `./verify` disponibles.
Contratos a conservar: mismo shell, orden, variables, funciones, traps, directorio de trabajo, mensajes, código de salida y pruebas negativas. No cambiar las rutas de los fixtures ni las aserciones. El escenario 9 permanece aislado hasta su tramo de sustitución aprobado.
Rutas susceptibles de cambio: `verify` y `tools/verify/skills.sh`; las pruebas existentes no se mueven.
Ejemplo concreto del resultado esperado: Se rechazan skills sin metadatos requeridos.
Alcance: extraer exclusivamente el segmento contiguo indicado, sin cambiar su contenido ni pruebas.
Archivos: `verify`, `tools/verify/skills.sh`.
CUANDO se ejecute `./verify` ENTONCES esta fase conserva su resultado y posición en el flujo completo (A8).
Aceptación A8: el bloque se carga exactamente una vez en el punto original y `./verify` y la simulación coinciden con la línea base aislada.
TODO:
- [ ] Copiar a `tools/verify/skills.sh` desde el comentario `# 4. skills:` hasta inmediatamente antes de `5. instalar.sh --simular` (A8). Comprobación: comparar con el bloque original de Git, líneas 215–240; esperar contenido idéntico.
- [ ] Sustituir ese bloque en `verify` por `source tools/verify/skills.sh` (A8). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún cambio de lógica.
- [ ] Comprobar `bash -n verify` y `bash -n tools/verify/skills.sh` (A8). Comprobación: esperar código 0.
- [ ] Ejecutar `./verify` en el entorno aislado (A8). Comprobación: esperar código 0 y resultados equivalentes a la referencia.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo entorno (A8). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, por petición del usuario después de cada movimiento; además comparar la simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante diferencia no explicada, no avanzar.

## Evidencia
Pendiente.
