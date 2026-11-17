# Tramo 125 — Anonimizar agentes/constructor.md

## Pasos

### Tramo 125 — Historia: Anonimizar agentes/constructor.md
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 124 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: agentes/constructor.md, core/agents/constructor.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: agentes/constructor.md, core/agents/constructor.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A125).
Aceptación A125: Comparar ambas copias con tools/verify/core-compatibility.mjs y ejecutar las pruebas de contrato pertinentes; registrar cada diferencia textual autorizada.
TODO:
- [x] En `agentes/constructor.md`, Sustituir nombres personales y de proyectos por roles y ejemplos ficticios, frase por frase según el inventario; aplicar cambios idénticos a ambas copias, sin modificar obligaciones ni permisos. (A125). Comprobación: Comparar ambas copias con tools/verify/core-compatibility.mjs y ejecutar las pruebas de contrato pertinentes; registrar cada diferencia textual autorizada.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A125). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: el inventario encontró dos referencias a `Franco` en cada copia: la regla de avance entre tramos y la condición de pausa. Ambas se sustituyeron idénticamente por `la persona usuaria`; no se cambiaron obligaciones ni permisos. `$ cmp -s agentes/constructor.md core/agents/constructor.md && node tools/verify/core-compatibility.mjs && node pruebas/contrato-constructor.mjs`: compatibilidad sin salida; suite `ok A1` a `ok A5`, incluidas comprobaciones negativas; `exit 0`.
- Paso 2: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: salida `verify coincide salvo el mensaje exacto autorizado del escenario 9.` y `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`; `exit 0` en 43,2 s, dentro del límite. La comparación aislada de códigos, salidas y efectos de `./verify` y dos simulaciones coincide con la referencia aplicando solo esa excepción.
- Punto de control: archivos de producto `agentes/constructor.md` y `core/agents/constructor.md`; cambio textual idéntico de la persona cuyo visto bueno se requiere. Compatibilidad, contrato del constructor y reproducción aislada de línea base pasaron. Sin acceso a proyectos reales ni áreas excluidas.
