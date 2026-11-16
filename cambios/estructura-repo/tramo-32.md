# Tramo 32 — Extraer escritura atómica (borrador)

## Pasos

### Tramo 32 — Historia: Extraer escritura atómica
Como mantenedor quiero extraer escritura atómica para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 31 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `tools/resolver/atomic-write.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `tools/resolver/atomic-write.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES extraer escritura atómica conserva los resultados y efectos originales (A32).
Aceptación A32: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [ ] En `scripts/resolver.mjs` y `tools/resolver/atomic-write.mjs`, Mover `escribirAtomico` sin cambiar el sufijo temporal, serialización, salto final ni orden de escritura y rename; importar en `scripts/resolver.mjs`. (A32). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [ ] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Fijar y quitar compactación, hook y permisos en fixtures; comparar contenido binario y ausencia de temporales tras éxito. (A32). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A32). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A32). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
