# Tramo 23 — Extraer medidor y kit run (borrador)

## Pasos

### Tramo 23 — Historia: aislar medidor y kit run
Como mantenedor quiero localizar esta fase en un módulo para leer y mantener la verificación.
Dependencias: tramo 22 revisado; referencia y entorno aislado del tramo 1; Bash y herramientas de `./verify` disponibles.
Contratos a conservar: mismo shell, orden, variables, funciones, traps, directorio de trabajo, mensajes, código de salida y pruebas negativas. No cambiar las rutas de los fixtures ni las aserciones. El escenario 9 permanece aislado hasta su tramo de sustitución aprobado.
Rutas susceptibles de cambio: `verify` y `tools/verify/usage-and-run.sh`; las pruebas existentes no se mueven.
Ejemplo concreto del resultado esperado: El medidor y kit run siguen usando sus fixtures y CLIs simulados.
Alcance: extraer exclusivamente el segmento contiguo indicado, sin cambiar su contenido ni pruebas.
Archivos: `verify`, `tools/verify/usage-and-run.sh`.
CUANDO se ejecute `./verify` ENTONCES esta fase conserva su resultado y posición en el flujo completo (A23).
Aceptación A23: el bloque se carga exactamente una vez en el punto original y `./verify` y la simulación coinciden con la línea base aislada.
TODO:
- [x] Copiar a `tools/verify/usage-and-run.sh` desde el comentario `# 12. medidor de costos` hasta inmediatamente antes de `8r. observador de Docker` (A23). Comprobación: comparar con el bloque original de Git, líneas 1158–1167; esperar contenido idéntico.
- [x] Sustituir ese bloque en `verify` por `source tools/verify/usage-and-run.sh` (A23). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún cambio de lógica.
- [x] Comprobar `bash -n verify` y `bash -n tools/verify/usage-and-run.sh` (A23). Comprobación: esperar código 0.
- [x] Ejecutar `./verify` en el entorno aislado (A23). Comprobación: esperar código 0 y resultados equivalentes a la referencia.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo entorno (A23). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, por petición del usuario después de cada movimiento; además comparar la simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante diferencia no explicada, no avanzar.

## Evidencia
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh` antes del movimiento: terminó `Simulaciones repetibles y verify coinciden con linea-base/.`, `exit 0`, 38.9 s.
- `$ diff -u <(git show HEAD:verify | sed -n '1158,1167p') tools/verify/usage-and-run.sh && wc -l -c tools/verify/usage-and-run.sh`
  `sin diferencias; 10 líneas, 682 bytes`
  `exit 0`
- `$ python3` (aserciones de fuente única, posición anterior a fase 8r y ausencia de los bloques 12/13 en verify)
  `extracción exacta; fuente única antes de fase 8r; bloques 12/13 retirados de verify`
  `exit 0`
- `$ bash -n verify && bash -n tools/verify/usage-and-run.sh && git diff --check`
  `bash -n ambos archivos y git diff --check: OK`
  `exit 0`
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh` (pasos 4–5): ejecutó `./verify` aislado y dos simulaciones; salidas y efectos coinciden con las referencias.
  `Simulaciones repetibles y verify coinciden con linea-base/.`
  `exit 0`, 39.4 s
