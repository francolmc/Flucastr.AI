# Tramo 20 — Extraer contrato de la skill de migración (borrador)

## Pasos

### Tramo 20 — Historia: aislar contrato de la skill de migración
Como mantenedor quiero localizar esta fase en un módulo para leer y mantener la verificación.
Dependencias: tramo 19 revisado; referencia y entorno aislado del tramo 1; Bash y herramientas de `./verify` disponibles.
Contratos a conservar: mismo shell, orden, variables, funciones, traps, directorio de trabajo, mensajes, código de salida y pruebas negativas. No cambiar las rutas de los fixtures ni las aserciones. El escenario 9 permanece aislado hasta su tramo de sustitución aprobado.
Rutas susceptibles de cambio: `verify` y `tools/verify/migration-contract.sh`; las pruebas existentes no se mueven.
Ejemplo concreto del resultado esperado: La copia sin la lista de reglas descartadas sigue fallando.
Alcance: extraer exclusivamente el segmento contiguo indicado, sin cambiar su contenido ni pruebas.
Archivos: `verify`, `tools/verify/migration-contract.sh`.
CUANDO se ejecute `./verify` ENTONCES esta fase conserva su resultado y posición en el flujo completo (A20).
Aceptación A20: el bloque se carga exactamente una vez en el punto original y `./verify` y la simulación coinciden con la línea base aislada.
TODO:
+ [x] Copiar a `tools/verify/migration-contract.sh` desde el comentario `# 9a. migración:` hasta inmediatamente antes de `10. arnés OpenSpec` (A20). Comprobación: comparar con el bloque original de Git, líneas 1070–1084; esperar contenido idéntico.
+ [x] Sustituir ese bloque en `verify` por `source tools/verify/migration-contract.sh` (A20). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún cambio de lógica.
+ [x] Comprobar `bash -n verify` y `bash -n tools/verify/migration-contract.sh` (A20). Comprobación: esperar código 0.
+ [x] Ejecutar `./verify` en el entorno aislado (A20). Comprobación: esperar código 0 y resultados equivalentes a la referencia.
+ [x] Ejecutar `bash ./instalar.sh --simular` en el mismo entorno (A20). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, por petición del usuario después de cada movimiento; además comparar la simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante diferencia no explicada, no avanzar.

## Evidencia
- `$ diff -u <(git show HEAD:verify | sed -n '1070,1084p') tools/verify/migration-contract.sh`
  *(sin salida; bloque idéntico, 15 líneas y 1139 bytes incluyendo separador)*
  `exit 0`
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`
  `Simulaciones repetibles y verify coinciden con linea-base/.`
  `exit 0`
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`
  `La receta corrió dos simulaciones de instalación aisladas y las comparó junto con verify; simulaciones y efectos coinciden byte por byte con las referencias, aplicando normalizaciones declaradas.`
  `Simulaciones repetibles y verify coinciden con linea-base/.`
  `exit 0`
- `$ bash -n verify && bash -n tools/verify/migration-contract.sh`
  `bash -n verify: OK`
  `bash -n tools/verify/migration-contract.sh: OK`
  `exit 0`
- `$ python3 - <<'PY'` (aserciones de carga única y posición; inspección del diff acotada a 9a)
  `source única en la posición original de 9a; bloque reemplazado sin contenido ejecutable residual`
  `exit 0`
