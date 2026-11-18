# Tramo 77 — Separar agente y hook de migración (borrador)

## Pasos

### Tramo 77 — Historia: Separar agente y hook de migración
Como mantenedor quiero aislar agente y hook de migración para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 76 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/claude-code/migrate-agent-hook.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/claude-code/migrate-agent-hook.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES agente y hook de migración conserva comportamiento y efectos (A77).
Aceptación A77: funciones `mig_agente y mig_hook` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `mig_agente y mig_hook` a `adapters/claude-code/migrate-agent-hook.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A77). Comprobación: revisar el diff; Preservar cambios a ajustes de Claude en proyecto sintético.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A77). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n adapters/claude-code/migrate-agent-hook.sh` (A77). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A77). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A77). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: ambas funciones se trasladaron byte por byte desde el instalador A76 (1.805 bytes, 46 líneas) a `adapters/claude-code/migrate-agent-hook.sh`; el `source` ocupa la posición original de sus definiciones y precede a ambas llamadas. La comparación estructural estricta pasó; `bash -n` en ambos archivos y `git diff --check` sin salida, `exit 0`.
- Paso 2: `$ bwrap --unshare-all --die-with-parent --ro-bind /usr /usr --ro-bind /bin /bin --ro-bind /lib /lib --ro-bind /lib64 /lib64 --proc /proc --dev /dev --tmpfs /tmp --dir /home --dir /home/test --dir /runtime --bind /tmp/tramo60-matriz-1/work /work --chdir /work --clearenv --setenv HOME /home/test --setenv PATH /work/fakebin:/usr/bin:/bin --setenv LANG C.UTF-8 --setenv TZ UTC /bin/bash ./run-tramo77.sh`: instalador A76, A77 y repetición; 32 casos completos cada captura, con argumentos, códigos, stdout, stderr y árboles (tipo, modo, enlaces, hash y tamaño). SHA-256 idéntico `2e4996779b924492d4dfa25a389f4788baafa7c63c262a185f63cd4e7439f744`; `A77_MATRIX_STRICT_EQUIVALENCE=PASS cases=32`, `exit 0`. `cmp` estricto; sin normalizaciones ni exclusiones.
- Paso 3: `$ bash -n instalar.sh && bash -n adapters/claude-code/migrate-agent-hook.sh && git diff --check -- instalar.sh adapters/claude-code/migrate-agent-hook.sh cambios/estructura-repo/tramo-56.md cambios/estructura-repo/tramo-77.md cambios/estructura-repo/plan.md`: sin salida; `exit 0`.
- Paso 4: `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: `verify coincide salvo el mensaje exacto autorizado del escenario 9.`; `exit 0` (control aislado completo, aprox. 44 s).
- Paso 5: `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: ejecutó dos `bash ./instalar.sh --simular`; `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`; `exit 0`.
