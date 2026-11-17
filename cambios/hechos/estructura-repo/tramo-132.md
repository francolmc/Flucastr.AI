# Tramo 132 — Anonimizar skills/preparar-proyecto/SKILL.md

## Pasos

### Tramo 132 — Historia: Anonimizar skills/preparar-proyecto/SKILL.md
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 131 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: skills/preparar-proyecto/SKILL.md, core/skills/prepare-project/SKILL.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: skills/preparar-proyecto/SKILL.md, core/skills/prepare-project/SKILL.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A132).
Aceptación A132: Comparar ambas copias con tools/verify/core-compatibility.mjs y ejecutar las pruebas de contrato pertinentes; registrar cada diferencia textual autorizada.
TODO:
- [x] En `skills/preparar-proyecto/SKILL.md`, Sustituir nombres personales y de proyectos por roles y ejemplos ficticios, frase por frase según el inventario; aplicar cambios idénticos a ambas copias, sin modificar obligaciones ni permisos. (A132). Comprobación: Comparar ambas copias con tools/verify/core-compatibility.mjs y ejecutar las pruebas de contrato pertinentes; registrar cada diferencia textual autorizada.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A132). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: `$ cmp skills/preparar-proyecto/SKILL.md core/skills/prepare-project/SKILL.md && node tools/verify/core-compatibility.mjs && node --test tools/verify/core-compatibility.test.mjs pruebas/aceptacion/contrato-constructor.test.mjs` terminó `exit 0`; las copias son idénticas, el comprobador pasó silenciosamente y 7/7 pruebas pasaron (0 fallidas). La búsqueda `rg -n 'Franco'` en ambas rutas no encontró menciones; se reemplazaron las tres referencias de cada copia por «la persona usuaria», preservando el actor que ejecuta la comprobación posterior al despliegue y la puerta de confirmación antes de crear el repositorio. `git diff --check` pasó (`exit 0`).
- Paso 2: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó `exit 0` en 42,6 s. Salida: `verify coincide salvo el mensaje exacto autorizado del escenario 9.` y `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.` El aislamiento corrió verify real y dos simulaciones de instalación contra la línea base.
