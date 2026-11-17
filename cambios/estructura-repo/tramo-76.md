# Tramo 76 — Separar registro de migración (borrador)

## Pasos

### Tramo 76 — Historia: Separar registro de migración
Como mantenedor quiero aislar registro de migración para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 75 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `tools/install/migration/manifest.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `tools/install/migration/manifest.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES registro de migración conserva comportamiento y efectos (A76).
Aceptación A76: funciones `mig_anotar y mig_quitar` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `mig_anotar y mig_quitar` a `tools/install/migration/manifest.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A76). Comprobación: revisar el diff; Conservar exactamente formato y argumentos consumidos, incluso comportamientos existentes.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A76). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n tools/install/migration/manifest.sh` (A76). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A76). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A76). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: `mig_anotar` y `mig_quitar` se conservaron byte por byte desde el snapshot A75: 335 y 228 bytes, respectivamente; `source` se ubicó antes de las primeras llamadas. El módulo tiene 16 líneas (límite 300). Comprobación exacta de funciones: `EXACT` en ambas.
- Paso 2: `$ bwrap --unshare-all --die-with-parent --ro-bind /usr /usr --ro-bind /bin /bin --ro-bind /lib /lib --ro-bind /lib64 /lib64 --proc /proc --dev /dev --tmpfs /tmp --dir /home --dir /home/test --dir /runtime --bind /tmp/tramo60-matriz-1/work /work --chdir /work --clearenv --setenv HOME /home/test --setenv PATH /work/fakebin:/usr/bin:/bin --setenv LANG C.UTF-8 --setenv TZ UTC /bin/bash ./run-tramo76.sh`: tres capturas completas de 32 casos; anterior/actual/repetición SHA-256 `2e4996779b924492d4dfa25a389f4788baafa7c63c262a185f63cd4e7439f744`; `A76_MATRIX_STRICT_EQUIVALENCE=PASS cases=32`; `exit 0`. `cmp` estricto; sin normalizar ni excluir campos o efectos.
- Paso 3: `$ bash -n instalar.sh && bash -n tools/install/migration/manifest.sh && git diff --check -- instalar.sh tools/install/migration/manifest.sh`: sin salida; `exit 0`.
- Paso 4: `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: `verify coincide salvo el mensaje exacto autorizado del escenario 9.`; `exit 0`.
- Paso 5: `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`; `exit 0`.
