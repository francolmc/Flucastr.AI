# Tramo 10 — Extraer permisos de proyectos sintéticos (borrador)

## Pasos

### Tramo 10 — Historia: aislar permisos de proyectos sintéticos
Como mantenedor quiero localizar esta fase en un módulo para leer y mantener la verificación.
Dependencias: tramo 9 revisado; referencia y entorno aislado del tramo 1; Bash y herramientas de `./verify` disponibles.
Contratos a conservar: mismo shell, orden, variables, funciones, traps, directorio de trabajo, mensajes, código de salida y pruebas negativas. No cambiar las rutas de los fixtures ni las aserciones. El escenario 9 permanece aislado hasta su tramo de sustitución aprobado.
Rutas susceptibles de cambio: `verify` y `tools/verify/project-permissions.sh`; las pruebas existentes no se mueven.
Ejemplo concreto del resultado esperado: Los escenarios deny, reinstalación y desinstalación conservan sus resultados.
Alcance: extraer exclusivamente el segmento contiguo indicado, sin cambiar su contenido ni pruebas.
Archivos: `verify`, `tools/verify/project-permissions.sh`.
CUANDO se ejecute `./verify` ENTONCES esta fase conserva su resultado y posición en el flujo completo (A10).
Aceptación A10: el bloque se carga exactamente una vez en el punto original y `./verify` y la simulación coinciden con la línea base aislada.
TODO:
- [x] Copiar a `tools/verify/project-permissions.sh` desde el comentario `# 6. reglas deny` hasta inmediatamente antes de `7. migración a v2` (A10). Comprobación: comparar con el bloque original de Git, líneas 254–368; esperar contenido idéntico.
- [x] Sustituir ese bloque en `verify` por `source tools/verify/project-permissions.sh` (A10). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún cambio de lógica.
- [x] Comprobar `bash -n verify` y `bash -n tools/verify/project-permissions.sh` (A10). Comprobación: esperar código 0.
- [x] Ejecutar `./verify` en el entorno aislado (A10). Comprobación: esperar código 0 y resultados equivalentes a la referencia.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo entorno (A10). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, por petición del usuario después de cada movimiento; además comparar la simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante diferencia no explicada, no avanzar.

## Evidencia
- Paso 1 (A10): segmento copiado desde el `verify` vigente entre `# 6. reglas deny` y `# 7. migración a v2`. Comparación byte por byte con el segmento fuente: idéntico, 115 líneas y 9417 bytes, newline final presente (código 0).
- Paso 2 (A10): `verify` carga `tools/verify/project-permissions.sh` una vez antes del marcador de fase 7. Comprobación estructural confirma la carga única después de la fase 5 y en la posición del bloque extraído; el diff sustituye el bloque por la carga, sin cambios de lógica (código 0).
- Paso 3 (A10): `bash -n verify`, `bash -n tools/verify/project-permissions.sh` y `git diff --check` finalizaron con código 0.
- Paso 4 (A10): `bash cambios/estructura-repo/reproducir-linea-base.sh` ejecutó `./verify` en el aislamiento; terminó con código 0 y resultado equivalente a `linea-base/verify.txt` bajo las normalizaciones declaradas.
- Paso 5 (A10): la misma receta ejecutó dos `bash ./instalar.sh --simular` aislados; ambas salidas y efectos coincidieron con la línea base, código 0. Receta completa: 39.4 s observados.
