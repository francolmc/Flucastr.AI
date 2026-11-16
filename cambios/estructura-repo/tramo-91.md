# Tramo 91 — Consolidar skills/planificar-cambio/SKILL.md en core/skills/plan-change/SKILL.md (borrador)

## Pasos

### Tramo 91 — Historia: Consolidar skills/planificar-cambio/SKILL.md en core/skills/plan-change/SKILL.md
Como mantenedor quiero una fuente identificable en `core/` para conservar el acceso de instalaciones existentes.
Dependencias: tramo 90 revisado, aislamiento del tramo 1 y matriz del tramo 56. Contratos: mantener `skills/planificar-cambio/SKILL.md` como archivo regular versionado con bytes y permisos iguales a `core/skills/plan-change/SKILL.md`; conservar nombres públicos de skills, referencias relativas y comportamiento; no usar enlaces simbólicos. No acceder a proyectos ni HOME reales. Ejemplo: una instalación anterior que referencia `skills/planificar-cambio/SKILL.md` sigue leyendo exactamente el mismo contenido.
Alcance: `core/skills/plan-change/SKILL.md` y el inventario de equivalencias `tools/core-compatibility.json`; pruebas pertinentes. `skills/planificar-cambio/SKILL.md` permanece intacto en este tramo.
Archivos: `core/skills/plan-change/SKILL.md`, `tools/core-compatibility.json`.
CUANDO se cargue `skills/planificar-cambio/SKILL.md` desde una instalación previa o un paquete remoto ENTONCES obtiene el mismo contenido y recursos que antes (A91).
Aceptación A91: el archivo nuevo es idéntico byte a byte y con permisos equivalentes al anterior; el inventario incluye el par y la comprobación del tramo 82 lo valida; no cambian la salida ni la cobertura.
TODO:
- [ ] Copiar `skills/planificar-cambio/SKILL.md` a `core/skills/plan-change/SKILL.md` como archivo regular y añadir el par exacto al inventario, sin alterar contenidos ni referencias (A91). Comprobación: `cmp` retorna 0 y los modos coinciden.
- [ ] Ejecutar la comprobación de equivalencias y la prueba offline de instalación remota con archivo válido, y comprobar que una instalación previa aislada sigue resolviendo `skills/planificar-cambio/SKILL.md` (A91). Comprobación: todas retornan 0; el paquete contiene ambas rutas como archivos regulares.
- [ ] Comparar los escenarios pertinentes de `cambios/estructura-repo/tramo-56.md`, incluyendo salida, errores, código, enlaces y contenido generado (A91). Comprobación: coincide con la referencia salvo las diferencias autorizadas.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A91). Comprobación: ambos retornan 0 y coinciden con la referencia salvo las diferencias autorizadas.
Verificación del tramo: `./verify` — nivel 3; además prueba offline, matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
