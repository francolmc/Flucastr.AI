# Tramo 46 — Separar formato de agentes Codex (borrador)

## Pasos

### Tramo 46 — Historia: Separar formato de agentes Codex
Como mantenedor quiero separar formato de agentes codex para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 45 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `adapters/codex/agent.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `adapters/codex/agent.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES separar formato de agentes codex conserva los resultados y efectos originales (A46).
Aceptación A46: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [ ] En `scripts/resolver.mjs` y `adapters/codex/agent.mjs`, Extraer `instruccionesCodex` y el bloque de generación `agente-codex` a funciones con dependencias explícitas; preservar también el subcomando `instrucciones-codex`, los escapes JSON/TOML, saltos y errores. (A46). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [ ] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar TOML y cadena de instrucciones byte a byte, descripción ausente, nombres incorrectos, caracteres escapados y esfuerzo max. (A46). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A46). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A46). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
