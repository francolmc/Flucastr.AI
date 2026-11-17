# Tramo 7 — Extraer resolución de agentes (borrador)

## Pasos

### Tramo 7 — Historia: aislar resolución de agentes
Como mantenedor quiero localizar esta fase en un módulo para leer y mantener la verificación.
Dependencias: tramo 6 revisado; referencia y entorno aislado del tramo 1; Bash y herramientas de `./verify` disponibles.
Contratos a conservar: mismo shell, orden, variables, funciones, traps, directorio de trabajo, mensajes, código de salida y pruebas negativas. No cambiar las rutas de los fixtures ni las aserciones. El escenario 9 permanece aislado hasta su tramo de sustitución aprobado.
Rutas susceptibles de cambio: `verify` y `tools/verify/agent-resolution.sh`; las pruebas existentes no se mueven.
Ejemplo concreto del resultado esperado: Se rechazan una skill obligatoria ausente y esfuerzos inválidos.
Alcance: extraer exclusivamente el segmento contiguo indicado, sin cambiar su contenido ni pruebas.
Archivos: `verify`, `tools/verify/agent-resolution.sh`.
CUANDO se ejecute `./verify` ENTONCES esta fase conserva su resultado y posición en el flujo completo (A7).
Aceptación A7: el bloque se carga exactamente una vez en el punto original y `./verify` y la simulación coinciden con la línea base aislada.
TODO:
- [x] Copiar a `tools/verify/agent-resolution.sh` desde el comentario `# 3. resolver para cada agente` hasta inmediatamente antes de `4. skills:` (A7). Comprobación: comparar con el bloque original de Git, líneas 137–214; esperar contenido idéntico.
- [x] Sustituir ese bloque en `verify` por `source tools/verify/agent-resolution.sh` (A7). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún cambio de lógica.
- [x] Comprobar `bash -n verify` y `bash -n tools/verify/agent-resolution.sh` (A7). Comprobación: esperar código 0.
- [x] Ejecutar `./verify` en el entorno aislado (A7). Comprobación: esperar código 0 y resultados equivalentes a la referencia.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo entorno (A7). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, por petición del usuario después de cada movimiento; además comparar la simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante diferencia no explicada, no avanzar.

## Evidencia
- Paso 1 (A7): antes de sustituir `verify`, se copió su segmento actual desde `# 3. resolver para cada agente y cada herramienta` hasta antes de `# 4. skills:`. Comparación byte por byte con la porción fuente: idéntico, 78 líneas y 5109 bytes; newline final presente; código 0.
- Paso 2 (A7): `verify` carga `tools/verify/agent-resolution.sh` una vez entre el paso 3 y el paso 4; la comprobación estructural pasó. El segmento quedó reemplazado por la línea `source` y el separador original; contenido y posición se preservan, sin cambio de lógica.
- Paso 3 (A7): `bash -n verify && bash -n tools/verify/agent-resolution.sh` terminó con código 0.
- Paso 4 (A7): `bash cambios/estructura-repo/reproducir-linea-base.sh` ejecutó `./verify` completo en Bubblewrap; terminó con código 0 y comparó salida/orden con `linea-base/verify.txt` aplicando únicamente las normalizaciones declaradas.
- Paso 5 (A7): la misma receta ejecutó dos simulaciones `bash ./instalar.sh --simular` aisladas; salidas y efectos coinciden con `linea-base/`; código 0. Duración observada: aproximadamente 39.6 s (30.2 s hasta primera espera + 9.4 s final).
