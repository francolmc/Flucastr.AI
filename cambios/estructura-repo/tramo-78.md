# Tramo 78 — Separar políticas de migración (borrador)

## Pasos

### Tramo 78 — Historia: Separar políticas de migración
Como mantenedor quiero aislar políticas de migración para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 77 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/claude-code/migrate-policy.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/claude-code/migrate-policy.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES políticas de migración conserva comportamiento y efectos (A78).
Aceptación A78: funciones `mig_deny y mig_sandbox` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `mig_deny y mig_sandbox` a `adapters/claude-code/migrate-policy.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A78). Comprobación: revisar el diff; Preservar registros, reglas y comportamiento actual sin corregirlo.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A78). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n adapters/claude-code/migrate-policy.sh` (A78). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A78). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A78). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: ambas funciones coinciden byte por byte con el bloque de `instalar-current77.sh` (2.069 bytes/51 líneas); `source` ocupa el sitio original de las definiciones y precede a las llamadas `mig_deny` y `mig_sandbox`. El módulo queda bajo 300 líneas. Comprobación estructural: `A78_EXTRACTION_EXACT=PASS`; sintaxis y diff se registran en pasos posteriores.
- Paso 2: matriz estricta A77/A78/repetición de 32 casos capturada en Bubblewrap sobre la misma raíz sintética. `cmp` íntegro pasó entre las tres capturas; SHA-256 idéntico `2e4996779b924492d4dfa25a389f4788baafa7c63c262a185f63cd4e7439f744` (`A78_MATRIX_STRICT_EQUIVALENCE=PASS cases=32`, `exit 0`). Argumentos, códigos, stdout, stderr y árboles con tipo, permisos, enlaces, tamaño y hash se conservaron sin normalizar ni excluir. Capturas y runner: `/tmp/tramo60-matriz-1/work/matrix-{previous,current,repeat}.txt`, `/tmp/tramo60-matriz-1/work/run-tramo78.sh`.
- Paso 3: `$ bash -n instalar.sh && bash -n adapters/claude-code/migrate-policy.sh` terminó sin salida, `exit 0`.
- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con `exit 0`; verify aislado informó `verify coincide salvo el mensaje exacto autorizado del escenario 9.`
- Paso 5: la misma receta ejecutó dos simulaciones aisladas; ambas coincidieron con la referencia y entre sí. Salida final: `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.` Código 0.
