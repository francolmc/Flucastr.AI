# Tramo 140 — Diseñar evaluación del inglés

## Pasos

### Tramo 140 — Historia: Diseñar evaluación del inglés
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 139 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: evals/prompt-language.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: evals/prompt-language.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A140).
Aceptación A140: Revisar que el protocolo pueda reproducirse y que no afirme ahorros o mejoras no medidos; presupuesto y traducción requieren decisión posterior.
TODO:
- [ ] En `evals/prompt-language.md`, Definir pares español/inglés con significado equivalente, casos ciegos de agentes y skills, métricas de cumplimiento, regresión, tokens y costo, muestras, umbrales y registro de condiciones. Sin ejecutar modelos ni cambiar prompts. (A140). Comprobación: Revisar que el protocolo pueda reproducirse y que no afirme ahorros o mejoras no medidos; presupuesto y traducción requieren decisión posterior.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A140). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
