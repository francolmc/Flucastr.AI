# Tramo 24 — Extraer observador de Docker (borrador)

## Pasos

### Tramo 24 — Historia: aislar observador de Docker
Como mantenedor quiero localizar esta fase en un módulo para leer y mantener la verificación.
Dependencias: tramo 23 revisado; referencia y entorno aislado del tramo 1; Bash y herramientas de `./verify` disponibles.
Contratos a conservar: mismo shell, orden, variables, funciones, traps, directorio de trabajo, mensajes, código de salida y pruebas negativas. No cambiar las rutas de los fixtures ni las aserciones. El escenario 9 permanece aislado hasta su tramo de sustitución aprobado.
Rutas susceptibles de cambio: `verify` y `tools/verify/docker-observer.sh`; las pruebas existentes no se mueven.
Ejemplo concreto del resultado esperado: El fixture y el docker falso conservan la prueba negativa OOM.
Alcance: extraer exclusivamente el segmento contiguo indicado, sin cambiar su contenido ni pruebas.
Archivos: `verify`, `tools/verify/docker-observer.sh`.
CUANDO se ejecute `./verify` ENTONCES esta fase conserva su resultado y posición en el flujo completo (A24).
Aceptación A24: el bloque se carga exactamente una vez en el punto original y `./verify` y la simulación coinciden con la línea base aislada.
TODO:
- [x] Copiar a `tools/verify/docker-observer.sh` desde el comentario `# 8r. observador de Docker` hasta inmediatamente antes de `8t. cambio pequeño` (A24). Comprobación: comparar con el bloque original de Git, líneas 1168–1204; esperar contenido idéntico.
- [x] Sustituir ese bloque en `verify` por `source tools/verify/docker-observer.sh` (A24). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún cambio de lógica.
- [x] Comprobar `bash -n verify` y `bash -n tools/verify/docker-observer.sh` (A24). Comprobación: esperar código 0.
- [x] Ejecutar `./verify` en el entorno aislado (A24). Comprobación: esperar código 0 y resultados equivalentes a la referencia.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo entorno (A24). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, por petición del usuario después de cada movimiento; además comparar la simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante diferencia no explicada, no avanzar.

## Evidencia
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh` antes del movimiento: terminó `Simulaciones repetibles y verify coinciden con linea-base/.`, `exit 0`, 39.2 s.
- `$ diff -u <(git show HEAD:verify | sed -n '1168,1204p') tools/verify/docker-observer.sh && wc -l -c tools/verify/docker-observer.sh`
  `sin diferencias; 37 líneas, 2688 bytes`
  `exit 0`
- `$ python3` (aserciones de fuente única, posición anterior a fase 8t y ausencia del bloque en verify)
  `extracción exacta; fuente única antes de fase 8t; bloque retirado de verify`
  `exit 0`
- `$ bash -n verify && bash -n tools/verify/docker-observer.sh && git diff --check`
  `bash -n ambos archivos y git diff --check: OK`
  `exit 0`
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh` (pasos 4–5): ejecutó `./verify` aislado y dos simulaciones; salidas y efectos coinciden con las referencias.
  `Simulaciones repetibles y verify coinciden con linea-base/.`
  `exit 0`, 39.5 s
