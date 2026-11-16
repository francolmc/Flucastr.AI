# Tramo 134 — Anonimizar justificación de Codex

## Pasos

### Tramo 134 — Historia: Anonimizar justificación de Codex
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 133 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: adapters/codex/deny.mjs. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: adapters/codex/deny.mjs.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A134).
Aceptación A134: Ejecutar pruebas de permisos y generación, comparar configuración generada y limitar la diferencia al texto autorizado.
TODO:
- [ ] En `adapters/codex/deny.mjs`, Sustituir el nombre personal en la justificación generada por un rol equivalente; preservar reglas deny y permisos. (A134). Comprobación: Ejecutar pruebas de permisos y generación, comparar configuración generada y limitar la diferencia al texto autorizado.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A134). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
