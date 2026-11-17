# Tramo 62 — Separar agentes de pi (borrador)

## Pasos

### Tramo 62 — Historia: Separar agentes de pi
Como mantenedor quiero aislar agentes de pi para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 61 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/pi/install-agent.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/pi/install-agent.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES agentes de pi conserva comportamiento y efectos (A62).
Aceptación A62: funciones `generar_agente_pi` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `generar_agente_pi` a `adapters/pi/install-agent.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A62). Comprobación: revisar el diff; Preservar frontmatter, skills declaradas y contenido generado.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A62). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n adapters/pi/install-agent.sh` (A62). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A62). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A62). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: comparación byte por byte contra `/tmp/tramo60-matriz-1/work/instalar-current61.sh`: la función `generar_agente_pi` trasladada coincide literalmente; el `source` es único y anterior a la primera llamada, y se conserva `node "$RESOLVER" agente-pi "$archivo" > "$destino"`. Comprobación Python: `función Pi idéntica al snapshot previo; source único antes de primera llamada; resolver agente-pi y archivo generado preservados`, `exit 0`.
- Paso 2: `$ bwrap --unshare-all ... /usr/bin/bash /work/run-tramo62.sh` comparó 32 escenarios completos (argumentos, códigos, stdout, stderr y manifiestos con tipos, permisos, enlaces, tamaños y hashes), en la misma raíz sintética aislada. `cmp` estricto pasó para anterior/actual y actual/repetición; SHA-256 idéntico `58fb44588dd004968d94846385fda256c1fb6a5ae8198805a256ea0ad4730705`; `A62_MATRIX_STRICT_EQUIVALENCE=PASS cases=32`, `exit 0`. Sin normalizar campos ni efectos.
- Paso 3: `$ bash -n instalar.sh && bash -n adapters/pi/install-agent.sh`: sin salida, `exit 0`.
- Pasos 4–5: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con `exit 0`. `./verify` aislado coincide con la línea base salvo el mensaje exacto autorizado del escenario 9; las dos simulaciones repetibles coinciden entre sí y con la línea base. Salidas: `verify coincide salvo el mensaje exacto autorizado del escenario 9.` y `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`
