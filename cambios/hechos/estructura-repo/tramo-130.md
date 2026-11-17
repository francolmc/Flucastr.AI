# Tramo 130 — Anonimizar skills/ejecutar-plan/SKILL.md

## Pasos

### Tramo 130 — Historia: Anonimizar skills/ejecutar-plan/SKILL.md
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 129 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: skills/ejecutar-plan/SKILL.md, core/skills/execute-plan/SKILL.md y el literal y etiqueta correspondientes de `pruebas/contrato-constructor.mjs`. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: skills/ejecutar-plan/SKILL.md, core/skills/execute-plan/SKILL.md, pruebas/contrato-constructor.mjs.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A130).
Aceptación A130: Comparar ambas copias con tools/verify/core-compatibility.mjs y ejecutar las pruebas de contrato pertinentes; registrar cada diferencia textual autorizada.
TODO:
- [x] En `skills/ejecutar-plan/SKILL.md`, Sustituir nombres personales y de proyectos por roles y ejemplos ficticios, frase por frase según el inventario; aplicar cambios idénticos a ambas copias, sin modificar obligaciones ni permisos. (A130). Comprobación: Comparar ambas copias con tools/verify/core-compatibility.mjs y ejecutar las pruebas de contrato pertinentes; registrar cada diferencia textual autorizada.
- [x] Actualizar exclusivamente la etiqueta y el literal de A2 en `pruebas/contrato-constructor.mjs` para exigir la nueva frase con el mismo criterio de pausa; ejecutar la suite de aceptación y conservar todas las demás aserciones. (A130).
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A130). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: la única mención personal por copia, «una decisión de Franco», se sustituyó por «una decisión de la persona usuaria», preservando el criterio de detenerse si se requiere esa decisión. `$ cmp -s skills/ejecutar-plan/SKILL.md core/skills/execute-plan/SKILL.md`: `exit 0`; `$ node tools/verify/core-compatibility.mjs`: `exit 0`; `$ node --test tools/verify/core-compatibility.test.mjs`: 6/6 pasaron, `exit 0`; búsqueda `rg` de `Franco` en ambos archivos: sin coincidencias, `exit 0`.
- Diagnóstico del primer intento: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `exit 1` (~30.9 s); `./verify` falló en `8j` con A2 porque la prueba exigía «decisión de Franco pausa». El principal amplió el alcance para actualizar exclusivamente etiqueta y literal conservando la aserción.
- Paso 2: solo se actualizaron etiqueta y literal de A2 en `pruebas/contrato-constructor.mjs`; la aserción aún requiere que la skill cubra salida de alcance o una decisión de la persona usuaria. `$ node --test pruebas/aceptacion/*.test.mjs`: 3/3 pasaron (contrato-constructor, kit-run, uso), `exit 0`.
- Paso 3: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `exit 0` en ~44.7 s. Salida: verify coincide salvo el mensaje exacto autorizado del escenario 9; simulaciones repetibles y verify coincide con línea base aplicando solo esa excepción.
