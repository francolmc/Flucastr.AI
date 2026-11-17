# Tramo 79 — Separar inspección de proyecto migrado (borrador)

## Pasos

### Tramo 79 — Historia: Separar inspección de proyecto migrado
Como mantenedor quiero aislar inspección de proyecto migrado para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 78 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `tools/install/migration/inspect-project.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `tools/install/migration/inspect-project.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES inspección de proyecto migrado conserva comportamiento y efectos (A79).
Aceptación A79: funciones `mig_workspace, mig_gitignore y mig_aviso_agents` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `mig_workspace, mig_gitignore y mig_aviso_agents` a `tools/install/migration/inspect-project.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A79). Comprobación: revisar el diff; Preservar detección de repos hijos, avisos y modificaciones al fixture.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A79). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n tools/install/migration/inspect-project.sh` (A79). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A79). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A79). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: las tres funciones coinciden byte por byte con el bloque de `instalar-current78.sh` (1.620 bytes/41 líneas); `source` ocupa el sitio original de las definiciones y precede a las llamadas; el módulo queda bajo 300 líneas. `A79_EXTRACTION_CHECK=PASS`; `bash -n` de ambos archivos pasó. Matriz, control aislado y diff se registran en los pasos siguientes.

- Paso 2: matriz estricta A78/A79/repetición capturada en Bubblewrap sobre la misma raíz sintética. `cmp` íntegro pasó para tres capturas de 32 casos; SHA-256 idéntico `2e4996779b924492d4dfa25a389f4788baafa7c63c262a185f63cd4e7439f744`; no hubo diferencias, normalizaciones ni exclusiones. Runner y capturas en `/tmp/tramo60-matriz-1/work/run-tramo79.sh` y `matrix-{previous,current,repeat}.txt`; `A79_MATRIX_STRICT_EQUIVALENCE=PASS`, `exit 0`.

- Paso 3: `$ bash -n instalar.sh && bash -n tools/install/migration/inspect-project.sh`; sin salida, `exit 0`.

- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con `exit 0`; verify aislado coincide con línea base salvo el mensaje exacto autorizado del escenario 9.

- Paso 5: el mismo control aislado terminó con `exit 0`; las dos simulaciones coincidieron con la línea base y entre sí, aplicando solo la excepción exacta del escenario 9.
