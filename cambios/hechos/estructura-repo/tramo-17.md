# Tramo 17 — Extraer negativos y refresco Codex (borrador)

## Pasos

### Tramo 17 — Historia: aislar negativos y refresco Codex
Como mantenedor quiero localizar esta fase en un módulo para leer y mantener la verificación.
Dependencias: tramo 16 revisado; referencia y entorno aislado del tramo 1; Bash y herramientas de `./verify` disponibles.
Contratos a conservar: mismo shell, orden, variables, funciones, traps, directorio de trabajo, mensajes, código de salida y pruebas negativas. No cambiar las rutas de los fixtures ni las aserciones. El escenario 9 permanece aislado hasta su tramo de sustitución aprobado.
Rutas susceptibles de cambio: `verify` y `tools/verify/codex-negative.sh`; las pruebas existentes no se mueven.
Ejemplo concreto del resultado esperado: Los negativos de esfuerzo y el refresco de proyectos sintéticos siguen funcionando.
Alcance: extraer exclusivamente el segmento contiguo indicado, sin cambiar su contenido ni pruebas.
Archivos: `verify`, `tools/verify/codex-negative.sh`.
CUANDO se ejecute `./verify` ENTONCES esta fase conserva su resultado y posición en el flujo completo (A17).
Aceptación A17: el bloque se carga exactamente una vez en el punto original y `./verify` y la simulación coinciden con la línea base aislada.
TODO:
- [x] Copiar a `tools/verify/codex-negative.sh` desde el comentario `# 3g. pruebas negativas de Codex` hasta inmediatamente antes de `8i. el constructor` (A17). Comprobación: comparar con el bloque original de Git, líneas 911–968; esperar contenido idéntico.
- [x] Sustituir ese bloque en `verify` por `source tools/verify/codex-negative.sh` (A17). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún cambio de lógica.
- [x] Comprobar `bash -n verify` y `bash -n tools/verify/codex-negative.sh` (A17). Comprobación: esperar código 0.
- [x] Ejecutar `./verify` en el entorno aislado (A17). Comprobación: esperar código 0 y resultados equivalentes a la referencia.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo entorno (A17). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, por petición del usuario después de cada movimiento; además comparar la simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante diferencia no explicada, no avanzar.

## Evidencia
- El bloque eliminado de `verify` comparado con el módulo añadido mediante `git diff --unified=0 -- verify`: 57 líneas en ambos, idénticos byte por byte (código 0). `verify` contiene una sola carga del módulo en la posición original, entre el refresco de Codex y la comprobación 8i.
- `bash -n verify`, `bash -n tools/verify/codex-negative.sh`, `git diff --check` y aserciones estructurales (carga única y orden respecto de los módulos Codex y 8i): código 0.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: ejecutó `./verify` aislado, terminó `VERIFY OK` y comparó su salida con `linea-base/verify.txt`; código 0, duración total de la receta 40.8 s.
- La misma receta ejecutó dos simulaciones de `bash ./instalar.sh --simular`; ambas salidas y efectos se compararon con sus baselines y coincidieron; código 0. Resultado final: `Simulaciones repetibles y verify coinciden con linea-base/.` No se accedió a proyectos ni áreas excluidas.
