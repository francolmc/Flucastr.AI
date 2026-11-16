# Tramo 133 — Anonimizar skill de planificación y contrato de verify

## Pasos

### Tramo 133 — Historia: Anonimizar skill de planificación y contrato de verify
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 132 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: skills/planificar-cambio/SKILL.md, core/skills/plan-change/SKILL.md, tools/verify/agent-contracts.sh. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: skills/planificar-cambio/SKILL.md, core/skills/plan-change/SKILL.md, tools/verify/agent-contracts.sh.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A133).
Aceptación A133: Comprobar igualdad de copias, éxito del caso positivo y fallo de la copia con la frase negativa; registrar la diferencia textual autorizada.
TODO:
- [ ] En `skills/planificar-cambio/SKILL.md`, Sustituir el nombre personal en ambas copias; actualizar a la vez el literal positivo congelado y el mensaje de verify, conservando la comprobación negativa Falla la 2 o la 4. (A133). Comprobación: Comprobar igualdad de copias, éxito del caso positivo y fallo de la copia con la frase negativa; registrar la diferencia textual autorizada.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A133). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
