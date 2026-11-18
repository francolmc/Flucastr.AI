> Los nombres personales y de proyectos de este documento histórico fueron anonimizados.

# Tramo 129 — Anonimizar skills/disenar-experiencia/SKILL.md

## Pasos

### Tramo 129 — Historia: Anonimizar skills/disenar-experiencia/SKILL.md
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 128 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: skills/disenar-experiencia/SKILL.md, core/skills/design-experience/SKILL.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: skills/disenar-experiencia/SKILL.md, core/skills/design-experience/SKILL.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A129).
Aceptación A129: Comparar ambas copias con tools/verify/core-compatibility.mjs y ejecutar las pruebas de contrato pertinentes; registrar cada diferencia textual autorizada.
TODO:
- [x] En `skills/disenar-experiencia/SKILL.md`, Sustituir nombres personales y de proyectos por roles y ejemplos ficticios, frase por frase según el inventario; aplicar cambios idénticos a ambas copias, sin modificar obligaciones ni permisos. (A129). Comprobación: Comparar ambas copias con tools/verify/core-compatibility.mjs y ejecutar las pruebas de contrato pertinentes; registrar cada diferencia textual autorizada.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A129). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: se sustituyeron las 3 menciones personales por copia según `anonimizacion.md`: la persona que trabaja en la terminal y la persona que aprueba el boceto. Se conserva que el boceto se presenta en la puerta 1 y debe ser aprobado por la persona usuaria. `$ cmp -s skills/disenar-experiencia/SKILL.md core/skills/design-experience/SKILL.md`: `exit 0`; `$ node tools/verify/core-compatibility.mjs`: `exit 0`; `$ node --test tools/verify/core-compatibility.test.mjs`: 6/6 pasaron, `exit 0`; búsqueda `rg` de `Persona` en ambos archivos: sin coincidencias, `exit 0`.
- Paso 2: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con `exit 0` en 41,9 s. Salida: `verify coincide salvo el mensaje exacto autorizado del escenario 9.` y `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`
