# Tramo 15 — Extraer lanzadores y reinstalación (borrador)

## Pasos

### Tramo 15 — Historia: aislar lanzadores y reinstalación
Como mantenedor quiero localizar esta fase en un módulo para leer y mantener la verificación.
Dependencias: tramo 14 revisado; referencia y entorno aislado del tramo 1; Bash y herramientas de `./verify` disponibles.
Contratos a conservar: mismo shell, orden, variables, funciones, traps, directorio de trabajo, mensajes, código de salida y pruebas negativas. No cambiar las rutas de los fixtures ni las aserciones. El escenario 9 permanece aislado hasta su tramo de sustitución aprobado.
Rutas susceptibles de cambio: `verify` y `tools/verify/launchers.sh`; las pruebas existentes no se mueven.
Ejemplo concreto del resultado esperado: Los lanzadores mantienen modelo y esfuerzo.
Alcance: extraer exclusivamente el segmento contiguo indicado, sin cambiar su contenido ni pruebas.
Archivos: `verify`, `tools/verify/launchers.sh`.
CUANDO se ejecute `./verify` ENTONCES esta fase conserva su resultado y posición en el flujo completo (A15).
Aceptación A15: el bloque se carga exactamente una vez en el punto original y `./verify` y la simulación coinciden con la línea base aislada.
TODO:
- [x] Copiar a `tools/verify/launchers.sh` desde el comentario `# 3e. lanzadores y reinstalación` hasta inmediatamente antes de `3f. Codex:` (A15). Comprobación: comparar con el bloque original de Git, líneas 735–763; esperar contenido idéntico.
- [x] Sustituir ese bloque en `verify` por `source tools/verify/launchers.sh` (A15). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún cambio de lógica.
- [x] Comprobar `bash -n verify` y `bash -n tools/verify/launchers.sh` (A15). Comprobación: esperar código 0.
- [x] Ejecutar `./verify` en el entorno aislado (A15). Comprobación: esperar código 0 y resultados equivalentes a la referencia.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo entorno (A15). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, por petición del usuario después de cada movimiento; además comparar la simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante diferencia no explicada, no avanzar.

## Evidencia
- `$ python3` (extracción de la sección 3e de `verify` y comparación byte por byte): `copiado=tools/verify/launchers.sh bytes=2449 lineas=29 coincide=True termina_salto=True`; `exit 0`.
- Línea base antes de modificar producto: `$ bash cambios/estructura-repo/reproducir-linea-base.sh` terminó `Simulaciones repetibles y verify coinciden con linea-base/.`; `exit 0`, 41.2 s.
- `$ python3` (sustitución del segmento y comprobación estructural): `carga_unica=1 posicion_antes_de_3f=True separadores_previos=2 separadores_actuales=2`; `exit 0`.
- `$ bash -n verify && bash -n tools/verify/launchers.sh && git diff --check` y aserciones estructurales: ambas sintaxis válidas, carga única en posición original y bloque contiguo; `exit 0`.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: `Simulaciones repetibles y verify coinciden con linea-base/.`; `exit 0`, 39.5 s. La receta ejecutó `./verify` y dos veces `bash ./instalar.sh --simular`, comparando salidas y efectos con la referencia aislada.
