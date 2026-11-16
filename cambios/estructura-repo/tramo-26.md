# Tramo 26 — Sustituir escenario 9 por fixture anónimo (borrador)

## Pasos

### Tramo 26 — Historia: comprobar migración sin proyectos personales
Como mantenedor quiero comprobar la migración con datos sintéticos para evitar leer o copiar proyectos reales.
Dependencias: tramo 25 revisado; Git, Bash y entorno aislado del tramo 1.
Contratos a conservar: ausencia de texto de workspace, aviso de AGENTS v1, archivos versionados movidos por Git, `.gitignore` en status y fuente intacta. La diferencia aceptada es ejecutar siempre el escenario con fixture y emitir un mensaje anónimo en lugar del mensaje anterior.
Rutas susceptibles de cambio: `tools/verify/migration.sh`, generado en tramo 11. No mover otros archivos ni modificar las pruebas restantes.
Ejemplo concreto del resultado esperado: fixture v1 con `AGENTS.md` que menciona `definitions/PROJECT.md`; la migración detecta v1 y deja versionadas las rutas `old/v1/definitions/` y `old/v1/features/`.
Alcance: únicamente `tools/verify/migration.sh`.
Archivos: `tools/verify/migration.sh`.
CUANDO se ejecute la fase de migración ENTONCES el escenario 9 usa un repositorio sintético anónimo y comprueba los mismos resultados (A26).
Aceptación A26: no hay referencia al proyecto personal, el fixture se genera en `$T7`, se verifica intacta su fuente y se conservan todas las aserciones del escenario; su mensaje distinto queda registrado como única excepción a la comparación.
TODO:
- [ ] Crear en `tools/verify/migration.sh` el fixture bajo `$T7` con `crear_v1`, un `AGENTS.md` v1 y el archivo agregado al índice Git (A26). Comprobación: verificar que definitions y features están en el índice y el AGENTS contiene la referencia v1; esperar éxito.
- [ ] Reemplazar la ruta absoluta y condicional del escenario 9 por una copia del fixture en `tools/verify/migration.sh` (A26). Comprobación: buscar la ruta personal y su nombre en el bloque; esperar cero coincidencias y ejecución incondicional.
- [ ] Conservar las cinco aserciones funcionales y la huella Git de la fuente en `tools/verify/migration.sh` (A26). Comprobación: comparar aserciones con el bloque original; esperar cobertura equivalente.
- [ ] Ejecutar `./verify` en entorno aislado (A26). Comprobación: esperar código 0, escenario 9 ejecutado y única diferencia de mensaje autorizada.
- [ ] Ejecutar `bash ./instalar.sh --simular` aislado (A26). Comprobación: esperar código 0 y coincidencia con la línea base.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además comparar simulación. Duración: medida en tramo 1.
Handoff: registrar el nuevo mensaje y el diff; detenerse para revisión antes de continuar.

## Evidencia
Pendiente.
