# Tramo 47 — Separar ajustes del agente y comparación de modelos (borrador)

## Pasos

### Tramo 47 — Historia: Separar ajustes del agente y comparación de modelos
Como mantenedor quiero separar ajustes del agente y comparación de modelos para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 46 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `tools/resolver/config-commands.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `tools/resolver/config-commands.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES separar ajustes del agente y comparación de modelos conserva los resultados y efectos originales (A47).
Aceptación A47: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [ ] En `scripts/resolver.mjs` y `tools/resolver/config-commands.mjs`, Extraer los bloques `fijar-agente`, `quitar-agente` y `comparar-modelos` a funciones explícitas; conservar sus escrituras directas, orden y predicado local que admite null. Mantener en `scripts/resolver.mjs` el despacho y el mismo texto de uso. (A47). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [ ] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar creación, sobrescritura, omisión y borrado selectivo; comparar diferencias y orden con modelos nuevos y campos ausentes. (A47). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A47). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A47). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
