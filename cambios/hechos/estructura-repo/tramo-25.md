# Tramo 25 — Extraer contrato de cambio pequeño (borrador)

## Pasos

### Tramo 25 — Historia: aislar contrato de cambio pequeño
Como mantenedor quiero localizar esta fase en un módulo para leer y mantener la verificación.
Dependencias: tramo 24 revisado; referencia y entorno aislado del tramo 1; Bash y herramientas de `./verify` disponibles.
Contratos a conservar: mismo shell, orden, variables, funciones, traps, directorio de trabajo, mensajes, código de salida y pruebas negativas. No cambiar las rutas de los fixtures ni las aserciones. El escenario 9 permanece aislado hasta su tramo de sustitución aprobado.
Rutas susceptibles de cambio: `verify` y `tools/verify/small-change-contract.sh`; las pruebas existentes no se mueven.
Ejemplo concreto del resultado esperado: La copia sin definición sigue fallando y VERIFY OK permanece al final de verify.
Alcance: extraer exclusivamente el segmento contiguo indicado, sin cambiar su contenido ni pruebas.
Archivos: `verify`, `tools/verify/small-change-contract.sh`.
CUANDO se ejecute `./verify` ENTONCES esta fase conserva su resultado y posición en el flujo completo (A25).
Aceptación A25: el bloque se carga exactamente una vez en el punto original y `./verify` y la simulación coinciden con la línea base aislada.
TODO:
- [x] Copiar a `tools/verify/small-change-contract.sh` desde el comentario `# 8t. cambio pequeño` hasta inmediatamente antes de `echo "VERIFY OK"` (A25). Comprobación: comparar con el bloque original de Git, líneas 1205–1224; esperar contenido idéntico.
- [x] Sustituir ese bloque en `verify` por `source tools/verify/small-change-contract.sh` (A25). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún cambio de lógica.
- [x] Comprobar `bash -n verify` y `bash -n tools/verify/small-change-contract.sh` (A25). Comprobación: esperar código 0.
- [x] Ejecutar `./verify` en el entorno aislado (A25). Comprobación: esperar código 0 y resultados equivalentes a la referencia.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo entorno (A25). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, por petición del usuario después de cada movimiento; además comparar la simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante diferencia no explicada, no avanzar.

## Evidencia
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh` antes del movimiento: `Simulaciones repetibles y verify coinciden con linea-base/.`; `exit 0`, 40.2 s.
- `$ diff -u <(git show HEAD:verify | sed -n '1205,1224p') tools/verify/small-change-contract.sh && wc -l -c tools/verify/small-change-contract.sh`: sin diferencias; 20 líneas, 1620 bytes; `exit 0`.
- `$ test "$(grep -Fc 'source tools/verify/small-change-contract.sh' verify)" -eq 1 && ! grep -q '^# 8t\. cambio pequeño' verify && test "$(tail -n 1 verify)" = 'echo "VERIFY OK"'`: carga única en la posición original, bloque inline retirado y `VERIFY OK` permanece al final; `exit 0`.
- `$ bash -n verify && bash -n tools/verify/small-change-contract.sh && git diff --check`: `exit 0`.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh` (verificación A25): ejecutó `./verify` y dos `bash ./instalar.sh --simular` aislados; salidas y efectos coinciden con la línea base; `Simulaciones repetibles y verify coinciden con linea-base/.`; `exit 0`, 39.9 s.
