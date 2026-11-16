# Tramo 126 — Anonimizar agentes/principal.md

## Pasos

### Tramo 126 — Historia: Anonimizar agentes/principal.md
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 125 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: agentes/principal.md, core/agents/principal.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: agentes/principal.md, core/agents/principal.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A126).
Aceptación A126: Comparar ambas copias con tools/verify/core-compatibility.mjs y ejecutar las pruebas de contrato pertinentes; registrar cada diferencia textual autorizada.
TODO:
- [ ] En `agentes/principal.md`, Sustituir nombres personales y de proyectos por roles y ejemplos ficticios, frase por frase según el inventario; aplicar cambios idénticos a ambas copias, sin modificar obligaciones ni permisos. (A126). Comprobación: Comparar ambas copias con tools/verify/core-compatibility.mjs y ejecutar las pruebas de contrato pertinentes; registrar cada diferencia textual autorizada.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A126). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
