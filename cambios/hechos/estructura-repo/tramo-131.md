> Los nombres personales y de proyectos de este documento histórico fueron anonimizados.

# Tramo 131 — Anonimizar skills/migrar-proyecto/SKILL.md

## Pasos

### Tramo 131 — Historia: Anonimizar skills/migrar-proyecto/SKILL.md
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 130 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: skills/migrar-proyecto/SKILL.md, core/skills/migrate-project/SKILL.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: skills/migrar-proyecto/SKILL.md, core/skills/migrate-project/SKILL.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A131).
Aceptación A131: Comparar ambas copias con tools/verify/core-compatibility.mjs y ejecutar las pruebas de contrato pertinentes; registrar cada diferencia textual autorizada.
TODO:
- [x] En `skills/migrar-proyecto/SKILL.md`, Sustituir nombres personales y de proyectos por roles y ejemplos ficticios, frase por frase según el inventario; aplicar cambios idénticos a ambas copias, sin modificar obligaciones ni permisos. (A131). Comprobación: Comparar ambas copias con tools/verify/core-compatibility.mjs y ejecutar las pruebas de contrato pertinentes; registrar cada diferencia textual autorizada.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A131). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- `$ cmp skills/migrar-proyecto/SKILL.md core/skills/migrate-project/SKILL.md && node tools/verify/core-compatibility.mjs`: idénticas; el comprobador terminó sin salida, `exit 0`.
- `$ node --test tools/verify/core-compatibility.test.mjs pruebas/aceptacion/contrato-constructor.test.mjs`: 7 pruebas pasaron (6 de compatibilidad y el flujo contractual del constructor), `fail 0`, `exit 0`.
- Diff: 11 menciones por copia se sustituyeron por «la persona usuaria», incluida la sección 7 y la excepción de migración; permisos, preguntas, confirmaciones y aprobación de planes siguen explícitos. `rg -n Franco` no devuelve coincidencias en el par; `git diff --check` pasó, `exit 0`.
- `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `verify coincide salvo el mensaje exacto autorizado del escenario 9.` y `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`, ejecutado en 34 s, `exit 0`.
