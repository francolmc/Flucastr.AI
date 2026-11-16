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
- [ ] En `scripts/resolver.mjs` y `tools/resolver/agent-header.mjs`, Mover `valorCabecera` y `partir`, incluyendo lectura y validación de delimitadores, e importarlas en `scripts/resolver.mjs`; no cambiar cómo se interpretan comillas ni CRLF. (A35). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [ ] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar agentes con cabeceras válidas, comillas, CRLF, delimitador ausente y archivo ausente; conservar texto y errores. (A35). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A35). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A35). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
