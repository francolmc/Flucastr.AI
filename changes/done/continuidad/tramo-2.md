## Pasos

### Tramo 2 — Historia: el constructor continúa con límites
Como persona usuaria quiero que el constructor avance solo y deje una pausa retomable para recibir el trabajo completo con evidencia.
Dependencias: Tramo 1 — formato y condiciones del plan continuo.
Contratos a conservar: alcance, aceptación, casillas en vivo, ausencia de commits y comportamiento de planes anteriores.
Rutas susceptibles de cambio: `agentes/constructor.md`, `skills/ejecutar-plan/SKILL.md`; no mover ni archivar; ajustar `pruebas/contrato-constructor.mjs` solo para reflejar el contrato conservado.
Ejemplo concreto del resultado esperado: tras verificación verde del tramo 1, anota checkpoint y ejecuta el 2; ante dos fallos de la misma causa deja pendiente el paso y explica qué hizo, falta y por qué paró.
Alcance: instrucciones del constructor y procedimiento.
Archivos: `agentes/constructor.md`, `skills/ejecutar-plan/SKILL.md`.
CUANDO se ejecuta un plan continuo ENTONCES el constructor avanza o pausa según sus condiciones y registra evidencia (A2).
Aceptación:
- A2: las reglas cubren avance, pausa, decisiones, checkpoint, timeout efectivo a 2× de duración medida, y planes antiguos; comprobar con `node pruebas/contrato-constructor.mjs`; esperar exit 0 y revisión del procedimiento.
TODO:
- [x] Actualizar `agentes/constructor.md` con permisos precisos de tramo y registro de decisiones (A2). Comprobación: `node pruebas/contrato-constructor.mjs`; esperar exit 0.
- [x] Actualizar `skills/ejecutar-plan/SKILL.md` con transición, controles, medición y parada retomable (A2). Comprobación: `node pruebas/contrato-constructor.mjs`; esperar exit 0.
- [x] Ampliar `pruebas/contrato-constructor.mjs` para comprobar el nuevo contrato y conservar las comprobaciones preexistentes (A2). Comprobación: `node pruebas/contrato-constructor.mjs`; esperar exit 0.
Verificación del tramo: `node pruebas/contrato-constructor.mjs` — nivel 1; exit 0; cubre A2.
Handoff: el checkpoint registra archivos, resumen de diff y verificación; la duración se toma de medida previa del mismo comando; al exceder el límite se interrumpe el proceso y se deja constancia.
