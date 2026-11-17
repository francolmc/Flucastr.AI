# Tramo 21 — Extraer autopruebas offline (borrador)

## Pasos

### Tramo 21 — Historia: aislar autopruebas offline
Como mantenedor quiero localizar esta fase en un módulo para leer y mantener la verificación.
Dependencias: tramo 20 revisado; referencia y entorno aislado del tramo 1; Bash y herramientas de `./verify` disponibles.
Contratos a conservar: mismo shell, orden, variables, funciones, traps, directorio de trabajo, mensajes, código de salida y pruebas negativas. No cambiar las rutas de los fixtures ni las aserciones. El escenario 9 permanece aislado hasta su tramo de sustitución aprobado.
Rutas susceptibles de cambio: `verify` y `tools/verify/offline-selftests.sh`; las pruebas existentes no se mueven.
Ejemplo concreto del resultado esperado: OpenSpec solo ejecuta autopruebas offline, sin --run.
Alcance: extraer exclusivamente el segmento contiguo indicado, sin cambiar su contenido ni pruebas.
Archivos: `verify`, `tools/verify/offline-selftests.sh`.
CUANDO se ejecute `./verify` ENTONCES esta fase conserva su resultado y posición en el flujo completo (A21).
Aceptación A21: el bloque se carga exactamente una vez en el punto original y `./verify` y la simulación coinciden con la línea base aislada.
TODO:
- [x] Copiar a `tools/verify/offline-selftests.sh` desde el comentario `# 10. arnés OpenSpec` hasta inmediatamente antes de `11. ejecución por tramos` (A21). Comprobación: comparar con el bloque original de Git, líneas 1085–1103; esperar contenido idéntico.
- [x] Sustituir ese bloque en `verify` por `source tools/verify/offline-selftests.sh` (A21). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún cambio de lógica.
- [x] Comprobar `bash -n verify` y `bash -n tools/verify/offline-selftests.sh` (A21). Comprobación: esperar código 0.
- [x] Ejecutar `./verify` en el entorno aislado (A21). Comprobación: esperar código 0 y resultados equivalentes a la referencia.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo entorno (A21). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, por petición del usuario después de cada movimiento; además comparar la simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante diferencia no explicada, no avanzar.

## Evidencia
- `$ diff -u <(git show HEAD:verify | sed -n '1085,1103p') tools/verify/offline-selftests.sh && wc -l -c tools/verify/offline-selftests.sh`
  `sin diferencias; 19 líneas, 1135 bytes`
  `exit 0`
- `$ python3` (aserciones de fuente única, posición anterior a fase 11 y ausencia del bloque en verify)
  `fuente única antes de 11; segmento 10/10b/10c retirado completo del archivo principal`
  `exit 0`
- `$ bash -n verify && bash -n tools/verify/offline-selftests.sh && git diff --check`
  `bash -n ambos archivos y git diff --check: OK`
  `exit 0`
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh` (paso 4)
  `./verify` aislado coincide con `linea-base/verify.txt`; la receta terminó `Simulaciones repetibles y verify coinciden con linea-base/.`
  `exit 0`
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh` (paso 5)
  La receta ejecutó dos `bash ./instalar.sh --simular` aislados; salidas y efectos coinciden con ambas referencias.
  `Simulaciones repetibles y verify coinciden con linea-base/.`; `exit 0`
