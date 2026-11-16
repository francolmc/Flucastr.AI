# Tramo 92 — Consolidar skills/preparar-proyecto/SKILL.md en core/skills/prepare-project/SKILL.md (borrador)

## Pasos

### Tramo 92 — Historia: Consolidar skills/preparar-proyecto/SKILL.md en core/skills/prepare-project/SKILL.md
Como mantenedor quiero una fuente identificable en `core/` para conservar el acceso de instalaciones existentes.
Dependencias: tramo 91 revisado, aislamiento del tramo 1 y matriz del tramo 56. Contratos: mantener `skills/preparar-proyecto/SKILL.md` como archivo regular versionado con bytes y permisos iguales a `core/skills/prepare-project/SKILL.md`; conservar nombres públicos de skills, referencias relativas y comportamiento; no usar enlaces simbólicos. No acceder a proyectos ni HOME reales. Ejemplo: una instalación anterior que referencia `skills/preparar-proyecto/SKILL.md` sigue leyendo exactamente el mismo contenido.
Alcance: `core/skills/prepare-project/SKILL.md` y el inventario de equivalencias `tools/core-compatibility.json`; pruebas pertinentes. `skills/preparar-proyecto/SKILL.md` permanece intacto en este tramo.
Archivos: `core/skills/prepare-project/SKILL.md`, `tools/core-compatibility.json`.
CUANDO se cargue `skills/preparar-proyecto/SKILL.md` desde una instalación previa o un paquete remoto ENTONCES obtiene el mismo contenido y recursos que antes (A92).
Aceptación A92: el archivo nuevo es idéntico byte a byte y con permisos equivalentes al anterior; el inventario incluye el par y la comprobación del tramo 82 lo valida; no cambian la salida ni la cobertura.
TODO:
- [ ] Copiar `skills/preparar-proyecto/SKILL.md` a `core/skills/prepare-project/SKILL.md` como archivo regular y añadir el par exacto al inventario, sin alterar contenidos ni referencias (A92). Comprobación: `cmp` retorna 0 y los modos coinciden.
- [ ] Ejecutar la comprobación de equivalencias y la prueba offline de instalación remota con archivo válido, y comprobar que una instalación previa aislada sigue resolviendo `skills/preparar-proyecto/SKILL.md` (A92). Comprobación: todas retornan 0; el paquete contiene ambas rutas como archivos regulares.
- [ ] Comparar los escenarios pertinentes de `cambios/estructura-repo/tramo-56.md`, incluyendo salida, errores, código, enlaces y contenido generado (A92). Comprobación: coincide con la referencia salvo las diferencias autorizadas.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A92). Comprobación: ambos retornan 0 y coinciden con la referencia salvo las diferencias autorizadas.
Verificación del tramo: `./verify` — nivel 3; además prueba offline, matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
