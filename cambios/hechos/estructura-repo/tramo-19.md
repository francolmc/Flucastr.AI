# Tramo 19 — Extraer niveles y experiencia (borrador)

## Pasos

### Tramo 19 — Historia: aislar niveles y experiencia
Como mantenedor quiero localizar esta fase en un módulo para leer y mantener la verificación.
Dependencias: tramo 18 revisado; referencia y entorno aislado del tramo 1; Bash y herramientas de `./verify` disponibles.
Contratos a conservar: mismo shell, orden, variables, funciones, traps, directorio de trabajo, mensajes, código de salida y pruebas negativas. No cambiar las rutas de los fixtures ni las aserciones. El escenario 9 permanece aislado hasta su tramo de sustitución aprobado.
Rutas susceptibles de cambio: `verify` y `tools/verify/verification-contracts.sh`; las pruebas existentes no se mueven.
Ejemplo concreto del resultado esperado: Las pruebas negativas de niveles, espera y experiencia siguen fallando.
Alcance: extraer exclusivamente el segmento contiguo indicado, sin cambiar su contenido ni pruebas.
Archivos: `verify`, `tools/verify/verification-contracts.sh`.
CUANDO se ejecute `./verify` ENTONCES esta fase conserva su resultado y posición en el flujo completo (A19).
Aceptación A19: el bloque se carga exactamente una vez en el punto original y `./verify` y la simulación coinciden con la línea base aislada.
- [x] Copiar a `tools/verify/verification-contracts.sh` desde el comentario `# 8m. niveles de verificación` hasta inmediatamente antes de `9a. migración:` (A19). Comprobación: comparar con el bloque original de Git, líneas 1015–1069; esperar contenido idéntico.
- [x] Sustituir ese bloque en `verify` por `source tools/verify/verification-contracts.sh` (A19). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún cambio de lógica.
- [x] Comprobar `bash -n verify` y `bash -n tools/verify/verification-contracts.sh` (A19). Comprobación: esperar código 0.
- [x] Ejecutar `./verify` en el entorno aislado (A19). Comprobación: esperar código 0 y resultados equivalentes a la referencia.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo entorno (A19). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, por petición del usuario después de cada movimiento; además comparar la simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante diferencia no explicada, no avanzar.

## Evidencia
- Paso 1: extracción contrastada con los borrados del diff de `verify`: 54 líneas/4229 bytes de contenido idéntico, más el separador vacío original; comprobación estructural terminó con código 0.
- Paso 2: `verify` contiene una sola carga de `tools/verify/verification-contracts.sh`, después del bloque previo de contratos de agentes y antes de `9a. migración:`; diff confirma la sustitución sin cambios de lógica; código 0.
- Paso 3: `bash -n verify`, `bash -n tools/verify/verification-contracts.sh` y `git diff --check` terminaron con código 0.
- Paso 4: la receta aislada ejecutó `./verify` con código 0 y comparó su resultado con `linea-base/verify.txt`; ejecución global de la receta finalizó con código 0 en 40.7 s.
- Paso 5: la receta ejecutó dos `bash ./instalar.sh --simular` en el mismo aislamiento; ambas salidas y efectos coincidieron con `linea-base/instalar-simular-1.txt` y `linea-base/instalar-simular-2.txt`; código global 0.
