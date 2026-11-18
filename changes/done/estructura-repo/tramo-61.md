# Tramo 61 — Separar agentes de claude (borrador)

## Pasos

### Tramo 61 — Historia: Separar agentes de claude
Como mantenedor quiero aislar agentes de claude para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 60 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/claude-code/install-agent.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/claude-code/install-agent.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES agentes de claude conserva comportamiento y efectos (A61).
Aceptación A61: funciones `generar_agente_claude` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `generar_agente_claude` a `adapters/claude-code/install-agent.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A61). Comprobación: revisar el diff; Preservar literalmente el archivo generado y la llamada al resolver.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A61). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n adapters/claude-code/install-agent.sh` (A61). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A61). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A61). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: comparación estructural con `/tmp/tramo60-matriz-1/work/instalar-current.sh`; la función `generar_agente_claude` trasladada coincide literalmente con la función previa, el `source` aparece una vez antes de la primera llamada y se conservaron las invocaciones al resolver para modelo y archivo generado. Comprobación Python terminó con el mensaje `función idéntica al snapshot previo; source único y anterior a primera llamada; resolver y archivo generado preservados`, `exit 0`.
- Paso 2: `$ bwrap --unshare-all ... /usr/bin/bash /work/run-tramo61.sh` en el fixture sintético del tramo 60: matriz de 32 escenarios anterior, actual y repetición actual con stdout, stderr, argumentos, códigos y manifiestos completos. `cmp` estricto pasó para anterior/actual y actual/repetición; SHA-256 de las tres `58fb44588dd004968d94846385fda256c1fb6a5ae8198805a256ea0ad4730705`, `A61_MATRIX_STRICT_EQUIVALENCE=PASS cases=32`, `exit 0`. El primer intento mostró solo rutas `/tmp` aleatorias; sin normalizar capturas, se estabilizó el `mktemp` sintético del fixture y se repitió la matriz completa.
- Paso 3: `$ bash -n instalar.sh && bash -n adapters/claude-code/install-agent.sh`: sin salida, `exit 0`.
- Pasos 4–5: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con `exit 0`. `./verify` aislado coincide con la línea base salvo el mensaje exacto autorizado del escenario 9; las dos simulaciones repetibles coinciden entre sí y con la línea base. Salidas: `verify coincide salvo el mensaje exacto autorizado del escenario 9.` y `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`
