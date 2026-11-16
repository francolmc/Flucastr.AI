# Tramo 94 — Consolidar nucleo/contrato/verificacion.md en core/contracts/verificacion.md (borrador)

## Pasos

### Tramo 94 — Historia: Consolidar nucleo/contrato/verificacion.md en core/contracts/verificacion.md
Como mantenedor quiero una fuente identificable en `core/` para conservar el acceso de instalaciones existentes.
Dependencias: tramo 93 revisado, aislamiento del tramo 1 y matriz del tramo 56. Contratos: mantener `nucleo/contrato/verificacion.md` como archivo regular versionado con bytes y permisos iguales a `core/contracts/verificacion.md`; conservar nombres públicos de skills, referencias relativas y comportamiento; no usar enlaces simbólicos. No acceder a proyectos ni HOME reales. Ejemplo: una instalación anterior que referencia `nucleo/contrato/verificacion.md` sigue leyendo exactamente el mismo contenido.
Alcance: `core/contracts/verificacion.md` y el inventario de equivalencias `tools/core-compatibility.json`; pruebas pertinentes. `nucleo/contrato/verificacion.md` permanece intacto en este tramo.
Archivos: `core/contracts/verificacion.md`, `tools/core-compatibility.json`.
CUANDO se cargue `nucleo/contrato/verificacion.md` desde una instalación previa o un paquete remoto ENTONCES obtiene el mismo contenido y recursos que antes (A94).
Aceptación A94: el archivo nuevo es idéntico byte a byte y con permisos equivalentes al anterior; el inventario incluye el par y la comprobación del tramo 82 lo valida; no cambian la salida ni la cobertura.
TODO:
- [ ] Copiar `nucleo/contrato/verificacion.md` a `core/contracts/verificacion.md` como archivo regular y añadir el par exacto al inventario, sin alterar contenidos ni referencias (A94). Comprobación: `cmp` retorna 0 y los modos coinciden.
- [ ] Ejecutar la comprobación de equivalencias y la prueba offline de instalación remota con archivo válido, y comprobar que una instalación previa aislada sigue resolviendo `nucleo/contrato/verificacion.md` (A94). Comprobación: todas retornan 0; el paquete contiene ambas rutas como archivos regulares.
- [ ] Comparar los escenarios pertinentes de `cambios/estructura-repo/tramo-56.md`, incluyendo salida, errores, código, enlaces y contenido generado (A94). Comprobación: coincide con la referencia salvo las diferencias autorizadas.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A94). Comprobación: ambos retornan 0 y coinciden con la referencia salvo las diferencias autorizadas.
Verificación del tramo: `./verify` — nivel 3; además prueba offline, matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
