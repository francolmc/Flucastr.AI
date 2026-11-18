## Pasos

### Tramo 1 — Historia: el plan expresa continuidad y límites
Como persona usuaria quiero declarar tramos continuos y sus límites para controlar cuándo el constructor sigue o se detiene.
Dependencias: ninguna.
Contratos a conservar: planes existentes y límite de tres archivos de producto por tramo; casillas en vivo.
Rutas susceptibles de cambio: `skills/planificar-cambio/SKILL.md`, `agentes/principal.md`, `README.md`; no mover ni archivar, actualizar `pruebas/contrato-constructor.mjs` si cambia una frase exigida.
Ejemplo concreto del resultado esperado: un plan aprobado declara modo continuo, dos tramos y duración medida por comando; una revisión intermedia explícita detiene el avance hasta revisarse.
Alcance: plantilla, reglas del principal y documentación del flujo.
Archivos: `skills/planificar-cambio/SKILL.md`, `agentes/principal.md`, `README.md`.
CUANDO se prepara un plan continuo ENTONCES define tramos, límites y revisión sin ambigüedad (A1).
Aceptación:
- A1: plantilla y reglas describen condiciones, agrupación de tramos, medición previa, registro de decisiones y checkpoint; comprobar con `node pruebas/contrato-constructor.mjs`; esperar exit 0 y revisión de las reglas.
TODO:
- [x] Actualizar `skills/planificar-cambio/SKILL.md` con formato explícito de continuidad y condiciones (A1). Comprobación: `node pruebas/contrato-constructor.mjs`; esperar exit 0.
- [x] Actualizar `agentes/principal.md` para revisión en contexto nuevo y revisión intermedia explícita (A1). Comprobación: `rg -n 'continuidad|contexto nuevo' agentes/principal.md`; esperar ambas reglas.
- [x] Actualizar `./README.md` con continuidad y checkpoint sin commit (A1). Comprobación: `rg -n 'continuidad|punto de control' README.md`; esperar descripción del flujo.
Verificación del tramo: `node pruebas/contrato-constructor.mjs` — nivel 1; exit 0; cubre A1.
Handoff: conservar la ejecución antigua si no se opta por continuidad; no modificar aceptación preexistente para hacerla pasar.
