# Tramo 45 — Separar formato de agentes Claude y Pi (borrador)

## Pasos

### Tramo 45 — Historia: Separar formato de agentes Claude y Pi
Como mantenedor quiero separar formato de agentes claude y pi para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 44 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `adapters/shared/markdown-agent.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `adapters/shared/markdown-agent.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES separar formato de agentes claude y pi conserva los resultados y efectos originales (A45).
Aceptación A45: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [ ] En `scripts/resolver.mjs` y `adapters/shared/markdown-agent.mjs`, Extraer del bloque `agente-claude`/`agente-pi` la generación y validación a una función con dependencias explícitas de cabecera, modelo, esfuerzo, identidad y adaptación Pi; el despachador conserva validación de argumentos y escribe exactamente el texto devuelto. (A45). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [ ] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar agentes reales y sintéticos, errores por name/model/effort/thinking, modelos ausentes y cabeceras Pi con Bash. (A45). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A45). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A45). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
