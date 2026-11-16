# Tramo 87 — Consolidar skills/diagnosticar/diagnosticar.mjs en core/skills/diagnose/diagnosticar.mjs (borrador)

## Pasos

### Tramo 87 — Historia: Consolidar skills/diagnosticar/diagnosticar.mjs en core/skills/diagnose/diagnosticar.mjs
Como mantenedor quiero una fuente identificable en `core/` para conservar el acceso de instalaciones existentes.
Dependencias: tramo 86 revisado, aislamiento del tramo 1 y matriz del tramo 56. Contratos: mantener `skills/diagnosticar/diagnosticar.mjs` como archivo regular versionado con bytes y permisos iguales a `core/skills/diagnose/diagnosticar.mjs`; conservar nombres públicos de skills, referencias relativas y comportamiento; no usar enlaces simbólicos. No acceder a proyectos ni HOME reales. Ejemplo: una instalación anterior que referencia `skills/diagnosticar/diagnosticar.mjs` sigue leyendo exactamente el mismo contenido.
Alcance: `core/skills/diagnose/diagnosticar.mjs` y el inventario de equivalencias `tools/core-compatibility.json`; pruebas pertinentes. `skills/diagnosticar/diagnosticar.mjs` permanece intacto en este tramo.
Archivos: `core/skills/diagnose/diagnosticar.mjs`, `tools/core-compatibility.json`.
CUANDO se cargue `skills/diagnosticar/diagnosticar.mjs` desde una instalación previa o un paquete remoto ENTONCES obtiene el mismo contenido y recursos que antes (A87).
Aceptación A87: el archivo nuevo es idéntico byte a byte y con permisos equivalentes al anterior; el inventario incluye el par y la comprobación del tramo 82 lo valida; no cambian la salida ni la cobertura.
TODO:
- [ ] Copiar `skills/diagnosticar/diagnosticar.mjs` a `core/skills/diagnose/diagnosticar.mjs` como archivo regular y añadir el par exacto al inventario, sin alterar contenidos ni referencias (A87). Comprobación: `cmp` retorna 0 y los modos coinciden.
- [ ] Ejecutar la comprobación de equivalencias y la prueba offline de instalación remota con archivo válido, y comprobar que una instalación previa aislada sigue resolviendo `skills/diagnosticar/diagnosticar.mjs` (A87). Comprobación: todas retornan 0; el paquete contiene ambas rutas como archivos regulares.
- [ ] Comparar los escenarios pertinentes de `cambios/estructura-repo/tramo-56.md`, incluyendo salida, errores, código, enlaces y contenido generado (A87). Comprobación: coincide con la referencia salvo las diferencias autorizadas.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A87). Comprobación: ambos retornan 0 y coinciden con la referencia salvo las diferencias autorizadas.
Verificación del tramo: `./verify` — nivel 3; además prueba offline, matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
