# Tramo 2

## Pasos

### Tramo 2 — Historia: el constructor no cierra con informes de avance
Como persona usuaria quiero que el constructor siga hasta terminar o pausar con motivo para no tener que decirle «continúa».
Dependencias: No aplica.
Contratos a conservar: formato de las líneas `COMPLETADO` y `PAUSA`; copia `agentes/constructor.md` idéntica a `core/agents/constructor.md`.
Rutas susceptibles de cambio: `pruebas/contrato-constructor.mjs` puede comprobar la nueva frase.
Ejemplo concreto del resultado esperado: el contrato dice que la única forma de terminar el turno es `COMPLETADO` o `PAUSA`; un informe de avance sin una de esas líneas es una violación.
Alcance: tres archivos de producto.
Archivos: core/agents/constructor.md, agentes/constructor.md, core/skills/execute-plan/SKILL.md
CUANDO el constructor termina el turno ENTONCES su primera línea es `COMPLETADO` o `PAUSA`, nunca un resumen de avance (A2).
Aceptación:
- A2: ambos `constructor.md` contienen la regla «no cerrar el turno con informes de avance» y son idénticos; `execute-plan` la repite en «Counting, context, and pausing»; comprobar con `diff core/agents/constructor.md agentes/constructor.md` y `node pruebas/contrato-constructor.mjs`; esperar sin diferencias y exit 0.
TODO:
- [x] En `core/agents/constructor.md`, sección Return, añadir: terminar el turno solo con `COMPLETADO` o `PAUSA`; si queda trabajo dentro del Alcance, seguir en lugar de informar; un tramo se cierra solo cuando su verificación pasa (A2). Comprobación: `grep -n "informe" core/agents/constructor.md`; esperar 1 coincidencia nueva.
- [x] Copiar el mismo cambio a `agentes/constructor.md` (A2). Comprobación: `diff core/agents/constructor.md agentes/constructor.md`; esperar sin salida.
- [x] En `core/skills/execute-plan/SKILL.md`, sección «Counting, context, and pausing», añadir la misma regla y que un fallo de prueba histórica o ajena se diagnostica y se resuelve dentro del Alcance antes de informar (A2). Comprobación: `grep -n "progress" core/skills/execute-plan/SKILL.md`; esperar coincidencia nueva.
- [x] Si existe copia de `execute-plan` en `skills/`, sincronizarla según `tools/core-compatibility.json` (A2). Comprobación: `node pruebas/contrato-constructor.mjs`; esperar exit 0.
Verificación del tramo: `node pruebas/contrato-constructor.mjs` — nivel 1; exit 0; cubre A2.
Handoff: no cambiar el formato de las líneas de retorno.

## Evidencia

$ grep -n "informe" core/agents/constructor.md
exit 1 (sin coincidencias; el archivo está en inglés, así que la regla se redactó como «progress report»)

$ grep -n "progress report" core/agents/constructor.md
42:End your turn only with `COMPLETADO` or `PAUSA`. Do not end it with a progress report. If work remains within *Alcance*, keep going instead of reporting it. A tramo closes only when its verification passes.
exit 0

$ diff core/agents/constructor.md agentes/constructor.md
(sin salida)
exit 0

$ grep -n "progress" core/skills/execute-plan/SKILL.md | cut -c1-160
32:In continuous mode, follow the plan's *Condiciones de parada*. If no prior duration is recorded for the exact check in an equivalent environment, pause befor
71:- Finish only when acceptance requirements are met, final verification passes, and no steps remain pending. Checkboxes report progress; they are not independ
75:- If the harness warns that execution may be cut off, persist progress and the next action in *Notas*; do not report COMPLETADO. An interruption leaves `en c
76:- Do not end the turn with a progress report. Your response must start with `COMPLETADO` or `PAUSA`. If work remains within *Alcance*, keep going instead of reporting it
exit 0
(antes del cambio había 3 coincidencias: líneas 32, 71 y 75; la nueva es la 76)

$ diff core/skills/execute-plan/SKILL.md skills/ejecutar-plan/SKILL.md
(sin salida)
exit 0

$ node pruebas/contrato-constructor.mjs
ok A6: ambos agentes adaptan sus respuestas al idioma de la persona y las mutaciones negativas fallan
ok A4: contrato nuevo y compatibilidad con el contrato anterior
ok A2: 17 condiciones del modo continuo y compatibilidad verificadas
ok A5: plantilla y revisión exigen dependencias externas, contratos, rutas y ejemplo; 12 mutaciones negativas detectadas
registro real A2 sin comprobación: casilla pendiente y nota de una línea validadas; no vuelve a ejecutar el modelo
registro real A2 sin comprobación: mutación de casilla rechazada
registro real A2 interrumpido: casilla pendiente y nota de una línea validadas; no vuelve a ejecutar el modelo
registro real A2 interrumpido: mutación de casilla rechazada
ok A1
ok A2
ok A3
ok A5
ok A4
contrato exit 0

## Notas
- Paso 1: la comprobación de la plantilla, `grep -n "informe"`, no puede coincidir con un archivo en inglés (AGENTS.md: instrucciones operativas en inglés). Se usa `grep -n "progress report"` como equivalente: 1 coincidencia nueva. Aceptación A2 sigue cubierta por esa frase.
- Punto de control del tramo 2: archivos tocados `core/agents/constructor.md` y `agentes/constructor.md` (regla «end your turn only with COMPLETADO or PAUSA» en Return; las dos copias idénticas), `core/skills/execute-plan/SKILL.md` y `skills/ejecutar-plan/SKILL.md` (bullets de progress report y de fallo de prueba histórica o ajena en «Counting, context, and pausing»; copia idéntica). Diff: solo texto nuevo; formato de COMPLETADO y PAUSA sin cambios. Comprobación: `node pruebas/contrato-constructor.mjs` exit 0.
