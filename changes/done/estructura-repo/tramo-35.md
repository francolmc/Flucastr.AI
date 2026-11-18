# Tramo 35 — Extraer lectura de cabeceras (borrador)

## Pasos

### Tramo 35 — Historia: Extraer lectura de cabeceras
Como mantenedor quiero extraer lectura de cabeceras para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 34 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `tools/resolver/agent-header.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `tools/resolver/agent-header.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES extraer lectura de cabeceras conserva los resultados y efectos originales (A35).
Aceptación A35: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [x] En `scripts/resolver.mjs` y `tools/resolver/agent-header.mjs`, extraer `valorCabecera` y conservar `partir` con lectura y validación en el entrypoint para preservar la traza exacta; no cambiar cómo se interpretan comillas ni CRLF. (A35). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [x] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar agentes con cabeceras válidas, comillas, CRLF, delimitador ausente y archivo ausente; conservar texto y errores. (A35). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A35). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A35). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- Paso 1: `valorCabecera` y `partir` se movieron a `tools/resolver/agent-header.mjs`; el entrypoint conserva la importación y las llamadas. Aserciones estáticas confirmaron exports, regex de comillas/CRLF/delimitadores y copia del módulo en el fixture aislado. `node --check` en ambos módulos, `bash -n cambios/estructura-repo/ejecutar-matriz-resolver.sh` y `git diff --check` pasaron; sin lógica añadida.
- Paso 2, intento: `bash cambios/estructura-repo/ejecutar-matriz-resolver.sh` paró con código 1 en el caso 37 (`agente-claude-ausente`). Código, stdout y efectos coinciden; stderr difiere solo en las ubicaciones del stack: antes `scripts/resolver.mjs:153` y `:850`, después `tools/resolver/agent-header.mjs:13` y `scripts/resolver.mjs:851`. La referencia no se modificó. No se ejecutaron `verify` ni simulación, pues A35 requiere pasar primero la matriz.
- Diagnóstico de retoma: repetición de `$ bash cambios/estructura-repo/ejecutar-matriz-resolver.sh` produjo `/reference/matriz-resolver.jsonl /work/matriz-1.jsonl differ: byte 27966, line 37`, `exit 1`. La captura de referencia muestra `at partir (file:///work/scripts/resolver.mjs:153:17)` y `at file:///work/scripts/resolver.mjs:850:32`; la ejecución extraída muestra `at partir (file:///work/tools/resolver/agent-header.mjs:13:17)` y `at file:///work/scripts/resolver.mjs:851:32`. Son URLs y líneas físicas del código; la excepción nativa de `readFileSync` las crea al lanzarse. Sin transformación del error/stack, mover la definición necesariamente cambia esos datos. Transformarlos sería lógica nueva y ocultaría la ubicación real del error; mantener el texto literal requiere conservar `partir` en el entrypoint, incumpliendo el movimiento solicitado. No hay solución compatible con todas las condiciones actuales.
- PAUSA: criterio A35 exige stderr idéntico y la extracción de `partir` altera inevitablemente el stack nativo ante archivo ausente. No se normalizó la matriz ni se ejecutaron `verify` o simulación después de la discrepancia. Alternativas para revisión: (1) mantener `partir` en `scripts/resolver.mjs` y extraer únicamente `valorCabecera`, preservando el comportamiento exacto; (2) autorizar una excepción explícita para las ubicaciones del stack manteniendo la comparación estricta de todo lo demás. La matriz y su referencia permanecen intactas.

- Solución aprobada y ejecutada por principal: `valorCabecera` se extrajo sin alterar su lógica; `partir` conserva su ubicación y la llamada sus líneas originales para preservar stderr. `node --check` en ambos módulos y `git diff --check` pasaron.
- Matriz estricta: 101 casos idénticos en dos ejecuciones, referencia intacta (SHA-256 `1d734c71e7a8335298d83d2a39a79b6d63c74c3864153c7a876f657b339cb37a`).
- `bash cambios/estructura-repo/reproducir-linea-base.sh`: verify y simulaciones coinciden; única excepción autorizada, mensaje del escenario 9. `python3 -B cambios/estructura-repo/comprobar-a3.py`: instalación remota sintética y copia del kit pasaron.
- Revisión principal: A35 cumplida según alcance ajustado y aprobado; entrypoint y matriz conservados, sin cambios a pruebas existentes.
