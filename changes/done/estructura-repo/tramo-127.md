> Los nombres personales y de proyectos de este documento histórico fueron anonimizados.

# Tramo 127 — Anonimizar skills/definir-proyecto/SKILL.md

## Pasos

### Tramo 127 — Historia: Anonimizar skills/definir-proyecto/SKILL.md
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 126 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: skills/definir-proyecto/SKILL.md, core/skills/define-project/SKILL.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: skills/definir-proyecto/SKILL.md, core/skills/define-project/SKILL.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A127).
Aceptación A127: Comparar ambas copias con tools/verify/core-compatibility.mjs y ejecutar las pruebas de contrato pertinentes; registrar cada diferencia textual autorizada.
TODO:
- [x] En `skills/definir-proyecto/SKILL.md`, Sustituir nombres personales y de proyectos por roles y ejemplos ficticios, frase por frase según el inventario; aplicar cambios idénticos a ambas copias, sin modificar obligaciones ni permisos. (A127). Comprobación: Comparar ambas copias con tools/verify/core-compatibility.mjs y ejecutar las pruebas de contrato pertinentes; registrar cada diferencia textual autorizada.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A127). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: las 2 menciones de `Persona` por copia, señaladas en `anonimizacion.md`, se sustituyeron por «la persona usuaria» en la descripción y la primera instrucción. `cmp -s` y `node tools/verify/core-compatibility.mjs` pasaron; `node --test tools/verify/core-compatibility.test.mjs`: 6/6 pasaron. La búsqueda final de `Persona` no halló coincidencias (código 1 esperado, envuelto para afirmar ausencia). Se conservaron el flujo de preguntas, permisos y detención.
- Paso 2: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con código 0 en 42,4 s. El `./verify` aislado coincide con la línea base salvo el mensaje exacto aprobado del escenario 9; las simulaciones repetibles de `bash ./instalar.sh --simular` coinciden con la referencia, con solo esa excepción. No se accedió a proyectos reales, secretos ni áreas excluidas.
