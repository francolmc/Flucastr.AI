# Tramo 123 — Catalogar las evaluaciones existentes

## Pasos

### Tramo 123 — Historia: Catalogar las evaluaciones existentes
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 122 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: evals/README.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: evals/README.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A123).
Aceptación A123: Ejecutar solo node pruebas/revisor-luna/medir.mjs --autoprueba en aislamiento y comprobar que no se modifica resultados.jsonl.
TODO:
- [ ] En `evals/README.md`, Documentar pruebas/revisor-luna/medir.mjs, sus casos y resultados históricos conservados, comando --autoprueba y ubicación; señalar que comparar-openspec no existe en este checkout. (A123). Comprobación: Ejecutar solo node pruebas/revisor-luna/medir.mjs --autoprueba en aislamiento y comprobar que no se modifica resultados.jsonl.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A123). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
