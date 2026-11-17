# Tramo 18 — Extraer contratos de agentes (borrador)

## Pasos

### Tramo 18 — Historia: aislar contratos de agentes
Como mantenedor quiero localizar esta fase en un módulo para leer y mantener la verificación.
Dependencias: tramo 17 revisado; referencia y entorno aislado del tramo 1; Bash y herramientas de `./verify` disponibles.
Contratos a conservar: mismo shell, orden, variables, funciones, traps, directorio de trabajo, mensajes, código de salida y pruebas negativas. No cambiar las rutas de los fixtures ni las aserciones. El escenario 9 permanece aislado hasta su tramo de sustitución aprobado.
Rutas susceptibles de cambio: `verify` y `tools/verify/agent-contracts.sh`; las pruebas existentes no se mueven.
Ejemplo concreto del resultado esperado: Las pruebas positivas y negativas de constructor y principal se conservan.
Alcance: extraer exclusivamente el segmento contiguo indicado, sin cambiar su contenido ni pruebas.
Archivos: `verify`, `tools/verify/agent-contracts.sh`.
CUANDO se ejecute `./verify` ENTONCES esta fase conserva su resultado y posición en el flujo completo (A18).
Aceptación A18: el bloque se carga exactamente una vez en el punto original y `./verify` y la simulación coinciden con la línea base aislada.
TODO:
- [x] Copiar a `tools/verify/agent-contracts.sh` desde el comentario `# 8i. el constructor` hasta inmediatamente antes de `8m. niveles de verificación` (A18). Comprobación: comparar con el bloque original de Git, líneas 969–1014; esperar contenido idéntico.
- [x] Sustituir ese bloque en `verify` por `source tools/verify/agent-contracts.sh` (A18). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún cambio de lógica.
- [x] Comprobar `bash -n verify` y `bash -n tools/verify/agent-contracts.sh` (A18). Comprobación: esperar código 0.
- [x] Ejecutar `./verify` en el entorno aislado (A18). Comprobación: esperar código 0 y resultados equivalentes a la referencia.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo entorno (A18). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, por petición del usuario después de cada movimiento; además comparar la simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante diferencia no explicada, no avanzar.

## Evidencia
- Paso 1: extracción contrastada con los borrados del diff de `verify`: 45 líneas/3425 bytes de contenido idéntico, más el separador vacío original. `tools/verify/agent-contracts.sh` coincide exactamente con ese bloque; comprobación estructural terminó con código 0.
- Paso 2: `verify` contiene una sola carga de `tools/verify/agent-contracts.sh`, después de `codex-negative.sh` y antes de `# 8m. niveles de verificación`; diff confirma la sustitución del segmento sin alteración del bloque; código 0.
- Paso 3: `bash -n verify`, `bash -n tools/verify/agent-contracts.sh` y `git diff --check` terminaron con código 0.
- Paso 4: la receta aislada ejecutó `./verify` con código 0 y comparó su resultado con `linea-base/verify.txt`; ejecución global de la receta finalizó con código 0 en 38.9 s.
- Paso 5: la receta ejecutó dos `bash ./instalar.sh --simular` en el mismo aislamiento; ambas salidas y efectos coincidieron con `linea-base/instalar-simular-1.txt` y `linea-base/instalar-simular-2.txt`; código global 0.
