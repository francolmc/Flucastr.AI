# Tramo 84 — Consolidar agentes/principal.md en core/agents/principal.md (borrador)

## Pasos

### Tramo 84 — Historia: Consolidar agentes/principal.md en core/agents/principal.md
Como mantenedor quiero una fuente identificable en `core/` para conservar el acceso de instalaciones existentes.
Dependencias: tramo 83 revisado, aislamiento del tramo 1 y matriz del tramo 56. Contratos: mantener `agentes/principal.md` como archivo regular versionado con bytes y permisos iguales a `core/agents/principal.md`; conservar nombres públicos de skills, referencias relativas y comportamiento; no usar enlaces simbólicos. No acceder a proyectos ni HOME reales. Ejemplo: una instalación anterior que referencia `agentes/principal.md` sigue leyendo exactamente el mismo contenido.
Alcance: `core/agents/principal.md` y el inventario de equivalencias `tools/core-compatibility.json`; pruebas pertinentes. `agentes/principal.md` permanece intacto en este tramo.
Archivos: `core/agents/principal.md`, `tools/core-compatibility.json`.
CUANDO se cargue `agentes/principal.md` desde una instalación previa o un paquete remoto ENTONCES obtiene el mismo contenido y recursos que antes (A84).
Aceptación A84: el archivo nuevo es idéntico byte a byte y con permisos equivalentes al anterior; el inventario incluye el par y la comprobación del tramo 82 lo valida; no cambian la salida ni la cobertura.
TODO:
- [ ] Copiar `agentes/principal.md` a `core/agents/principal.md` como archivo regular y añadir el par exacto al inventario, sin alterar contenidos ni referencias (A84). Comprobación: `cmp` retorna 0 y los modos coinciden.
- [ ] Ejecutar la comprobación de equivalencias y la prueba offline de instalación remota con archivo válido, y comprobar que una instalación previa aislada sigue resolviendo `agentes/principal.md` (A84). Comprobación: todas retornan 0; el paquete contiene ambas rutas como archivos regulares.
- [ ] Comparar los escenarios pertinentes de `cambios/estructura-repo/tramo-56.md`, incluyendo salida, errores, código, enlaces y contenido generado (A84). Comprobación: coincide con la referencia salvo las diferencias autorizadas.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A84). Comprobación: ambos retornan 0 y coinciden con la referencia salvo las diferencias autorizadas.
Verificación del tramo: `./verify` — nivel 3; además prueba offline, matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
