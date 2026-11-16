---
estado: listo
rama: feature/informe-avance
base: main
repos: [.]
ejecutor: constructor
tipo: docs
---
# Informe de avance del constructor

## Objetivo
El principal informa de forma breve y fiel el avance del tramo activo cuando Franco consulta y cuando el constructor termina o se detiene.

## Supuestos
- Las casillas se ejecutan en el orden del plan; si se completan fuera de orden, usar la evidencia con orden temporal y comunicar «desconocido» si no permite identificar el último paso.
- El plazo es el declarado para el tramo; si no existe o no se conoce su inicio, indicarlo y no afirmar que venció. Si Franco establece otra regla, ajustar la comparación.

## Alcance
Modificar `agentes/principal.md` para incorporar el informe y resolver sus instrucciones contradictorias. Fuera de alcance: scripts nuevos, generación de capturas, cambios del constructor, `verify` y pruebas de aceptación existentes.

## Decisiones ya tomadas
- El contrato de casillas en vivo ya existe en `agentes/constructor.md` y `skills/ejecutar-plan/SKILL.md`; `node pruebas/contrato-constructor.mjs` pasa y valida también registros reales previos, sin ejecutar de nuevo un modelo.
- Ejecutor: constructor, porque los requisitos, archivos, comprobaciones y errores están definidos y no se necesitan credenciales ni producción; Franco pidió un plan.
- Un informe tiene hasta cuatro líneas, incluso con capturas o advertencia; agrupar campos en una línea cuando sea necesario. No sustituye la revisión ni su veredicto.
- Comparar consultas consecutivas del mismo tramo y misma ejecución, conservando sus valores en el contexto de la conversación; si faltan datos previos, no inferir estancamiento.

## Escenarios
- CUANDO Franco pregunta cómo va, o el constructor termina o se detiene ENTONCES el principal informa el tramo activo en hasta cuatro líneas (A1).
- CUANDO existen capturas de verificación de un tramo de interfaz ENTONCES incluye su ruta sin generarlas ni solicitarlas (A2).
- CUANDO dos consultas consecutivas posteriores al plazo coinciden en casillas y estado git ENTONCES comunica la coincidencia y propone leer el final de la sesión antes de interrumpir o relanzar (A3).
- CUANDO faltan archivos o datos para el informe ENTONCES declara lo desconocido sin inventar progreso (A4).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Informe correcto del tramo activo al consultar, terminar o detenerse | Revisión manual de `agentes/principal.md` y ensayo con un plan en curso de dos tramos: comparar el informe con sus casillas y `git status --short` de cada repo | Hasta cuatro líneas; hechos/total del tramo activo, último paso completado, archivos y estados git y motivo de detención o «ninguno/desconocido»; no cuenta otros tramos |
| A2 | Capturas existentes de interfaz comunicadas | Revisar la instrucción para interfaz con y sin archivos en `verificacion/artifacts/` | Incluye rutas existentes cuando corresponda; no genera ni pide capturas y no afirma que existan si faltan |
| A3 | Detección de progreso sin cambios tras el plazo | Recorrer manualmente la regla con dos consultas iguales tras el plazo, una antes del plazo y otra con casilla o status diferente | Solo en el primer caso informa coincidencia y propone leer el final antes de interrumpir o relanzar; sin sondeos automáticos |
| A4 | Lecturas fallidas o información insuficiente visibles | Revisar casos de plan ilegible, ninguna casilla completada, status fallido y plazo desconocido | Cada dato se informa como desconocido o sin pasos completados según corresponda; no se presenta un fallo como cero ni como repositorio limpio |

## Verificación
`git diff --check` — sin errores. Revisar las filas A1–A4 en el diff y registrar el ensayo A1 con plan de dos tramos en curso, comparando literalmente casillas y estados observados; si no hay ejecución real disponible, declarar esa parte pendiente, sin presentar una simulación como prueba real.

## Pasos
- [x] Actualizar el informe en `agentes/principal.md`, definiendo eventos, cuatro líneas y fuentes del tramo activo (A1, A4).
  - Comprobación: revisar el diff con dos tramos y un plan ilegible; resultado esperado: conteo aislado al tramo y fallos explícitos.
- [x] Añadir en `agentes/principal.md` la regla de capturas existentes de interfaz (A2).
  - Comprobación: revisar la instrucción para `verificacion/artifacts/`; resultado esperado: rutas existentes sin generación ni petición.
- [x] Incorporar en `agentes/principal.md` la comparación de consultas y armonizar espera, plazo y retorno (A3).
  - Comprobación: revisar los tres casos de A3 en el diff; resultado esperado: propuesta solo con ambas consultas posteriores al plazo e idénticas.
- [x] Registrar en `cambios/informe-avance/plan.md` la verificación y el ensayo real disponible (A1, A2, A3, A4).
  - Comprobación: `git diff --check`; resultado esperado: salida vacía y código 0; anotar si falta el ensayo real.

## Evidencia
- Ensayo A1: ejecuté el tramo 1 de `cambios/prueba-informe/plan.md`, un plan de prueba real de dos tramos. Al retorno, con el tramo 2 aún pendiente, el plan mostraba tramo 1 con 2/2 y el último paso «Revisar capturas»; el informe comunicado coincidió. `git status --short`: ` M agentes/principal.md`, `?? cambios/informe-avance/`, `?? cambios/prueba-informe/`; el informe reprodujo los tres. El ensayo observó el retorno, no una consulta con el constructor trabajando.
- Paso 1 — `git diff -- agentes/principal.md`: añadido un informe de hasta cuatro líneas con tramo activo aislado, último paso, `git status --short` por repo, detención y tratamiento explícito de lecturas faltantes; la regla usa solo las casillas del tramo activo, así que no suma otros tramos. Revisión manual del caso de plan ilegible: tramo y progreso «desconocidos», sin afirmar cero o repo limpio. Salida del diff: cambio visible en la instrucción; código 0.
- Paso 2 — `git diff -- agentes/principal.md | rg -n -C 2 'capturas|verificacion/artifacts|No generes|existen'`: aparecen rutas ya existentes, se prohíbe generarlas o pedirlas y se indica que no se afirme su existencia cuando falten; coincidencias encontradas; código 0.
- Paso 3 — `git diff -- agentes/principal.md | rg -n -C 1 'consultas consecutivas|plazo declarado|Si falta el plazo|cambia una casilla|prevalece sobre'`: comprobados los tres casos A3. La coincidencia solo se comunica para dos consultas posteriores al plazo con casillas y estado git idénticos; antes del plazo o ante cambios no aplica, y con datos/plazo desconocidos no se afirma estancamiento. La espera larga no impide contestar una consulta de avance; no hay sondeo automático; coincidencias encontradas; código 0.
- Paso 4 — `git diff --check`: salida vacía; código 0. Revisión manual A4: plan ilegible, cero casillas hechas, status fallido y plazo desconocido se expresan como desconocido o «ninguno» según el caso, sin equiparar error con cero/limpio. No hay ejecución real disponible de un plan con dos tramos en curso para el ensayo A1; queda pendiente esa comprobación integrada, sin usar una simulación como evidencia.

## Notas
- Ensayo A1: pendiente observar una consulta mientras el constructor trabaja; el retorno del primer tramo sí se comprobó.
- Revisión del principal: A1 comprobado al retorno del primer tramo de un plan de prueba real de dos tramos; A2, A3 y A4 cumplidos por revisión del diff. La consulta mientras el constructor trabaja no se observó en este ensayo.

- Ensayo del tramo 2: durante la ejecución se informó 0/2, ningún paso completado y el git status observado; al retorno, 2/2, último paso revisar espera, y el mismo git status. No hubo una consulta espontánea del usuario durante la ejecución. Verificación: git diff --check, código 0. A1–A4 cumplidos por evidencia y revisión del procedimiento.
