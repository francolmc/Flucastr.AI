# Tramo 80 — Separar coordinación de migración (borrador)

## Pasos

### Tramo 80 — Historia: Separar coordinación de migración
Como mantenedor quiero aislar coordinación de migración para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 79 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `tools/install/migration/run.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `tools/install/migration/run.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES coordinación de migración conserva comportamiento y efectos (A80).
Aceptación A80: funciones `migrar` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `migrar` a `tools/install/migration/run.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A80). Comprobación: revisar el diff; Mantener inicialización y trap, errores, orden de operaciones y contenido de old/v1 generado en el fixture.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A80). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n tools/install/migration/run.sh` (A80). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A80). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A80). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: `migrar` coincide byte por byte con el bloque de `instalar-current79.sh` (4.165 bytes/103 líneas); `source` ocupa el lugar de las definiciones y precede al dispatch de `--migrar`; el módulo tiene 103 líneas. Se preservaron inicialización, trap y cuerpo de coordinación. `A80_EXTRACTION_CHECK=PASS`; `bash -n` de ambos archivos pasó. Matriz, controles y diff se anotan después.

- Paso 2: matriz estricta A79/A80/repetición capturada en Bubblewrap sobre la misma raíz sintética. `cmp` íntegro pasó para tres capturas de 32 casos; SHA-256 idéntico `2e4996779b924492d4dfa25a389f4788baafa7c63c262a185f63cd4e7439f744`; no hubo diferencias, normalizaciones ni exclusiones. Runner y capturas en `/tmp/tramo60-matriz-1/work/run-tramo80.sh` y `matrix-{previous,current,repeat}.txt`; `A80_MATRIX_STRICT_EQUIVALENCE=PASS`, `exit 0`.

- Paso 3: `$ bash -n instalar.sh && bash -n tools/install/migration/run.sh`; sin salida, `exit 0`.

- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con `exit 0`; verify aislado coincide con línea base salvo el mensaje exacto autorizado del escenario 9.

- Paso 5: el mismo control aislado terminó con `exit 0`; las dos simulaciones coincidieron con la línea base y entre sí, aplicando solo la excepción exacta del escenario 9.
