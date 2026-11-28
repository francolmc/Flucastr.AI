---
status: done
format: 2
branch: feature/sin-callejon
base: main
repos: [.]
executor: builder
segment: 1
type: code
---
# Sin callejón
## Goal
Ofrecer una salida concreta cuando el builder o la revisión no terminan, respetando la escalera y sus autorizaciones.
## Exploration
Un solo repositorio, base y rama indicados por la persona. La referencia ya clasifica `RETURNED` como `tarea`, pero el planner corta tras dos devoluciones; el paso 4 solo procede tras fallar el 3 por tarea.
## Decisions already taken
- D-01, D-02, D-03
- Executor: builder, porque el cambio no es pequeño; requisitos, contexto y comprobaciones son accesibles y no requiere credenciales ni despliegue.
## Scope
`core/agents/planner.md`, `core/references/planner/paused-and-interrupted.md` y `tests/escalera/reglas.test.mjs` únicamente para frases trasladadas; no cambiar implementación de la escalera, motivos de PAUSED ni restricciones de seguridad.
## Verification
`./verify` una sola vez al final; salida 0. Revisar el diff completo y los criterios una sola vez.
## Steps
### Segment 1 — Story: recuperación con opciones
Files: core/agents/planner.md, core/references/planner/paused-and-interrupted.md
WHEN se agotan intentos o se necesita autorización THEN el planner ofrece una salida concreta y conserva las condiciones de la escalera.
Acceptance:
- A1: tras dos RETURNED se continúa por la escalera de tarea; se mantienen dos relanzamientos y sí explícito para pasos 3 y 4; revisión manual del diff.
- A2: al agotar la escalera o necesitar un sí, pregunta cerrada con opciones aplicables: paso 3, paso 4 con estimación, o partial; no ofrecer pasos no elegibles como ejecutables; revisión manual de la referencia.
- A3: clase plan: el planner corrige Scope, tramo o A# en changes/, muestra máximo cinco líneas y relanza solo con sí; entorno y decision: diagnóstico de una línea y pregunta cerrada con acción concreta; revisión manual de la referencia.
- A4: solo se ajustan pruebas de frases movidas; seguridad y motivos de PAUSED intactos; revisión manual del diff y `./verify`, salida 0.
TODO:
- [x] Ajustar `core/agents/planner.md` (A1); Check: revisión manual; comprobar que remite a la escalera y conserva el límite.
- [x] Actualizar `core/references/planner/paused-and-interrupted.md` (A1, A2, A3); Check: revisión manual; comprobar sí explícito y acción concreta.
- [x] Ajustar exclusivamente frases movidas en `tests/escalera/reglas.test.mjs` u otras pruebas afectadas (A4); Check: revisión manual; comprobar el diff de pruebas.
Segment verification: `./verify` — nivel 3, salida 0; cubre A1, A2, A3, A4, una sola ejecución final.
## Evidence
Revisión manual del diff (A1–A4):
$ git diff -- core/agents/planner.md core/references/planner/paused-and-interrupted.md tests/escalera/reglas.test.mjs
La escalera conserva sus límites y autorizaciones; A3 corrige primero el plan, muestra hasta cinco líneas y pide sí para relanzar. Las pruebas solo cambian literales trasladados.
exit 0

Verificación final tras corregir A3 (A1–A4):
$ ./verify
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: bf78e472d908
VERIFY OK
exit 0

- Revisión manual A1: `planner.md` remite a la escalera; conserva dos relanzamientos y exige sí para los pasos elegibles 3 y 4.
- Revisión manual A1–A3: la referencia condiciona las opciones; `plan`, `entorno` y `decision` dan acción concreta y relanzan solo con confirmación y plan aprobado.
- Revisión manual A4 parcial: se actualizó el literal de consentimiento para el paso 3; queda una aserción de Pi con la frase anterior, identificada por `./verify`.
- Revisión manual A4: solo se cambiaron los tres literales trasladados de `tests/escalera/reglas.test.mjs`; la prueba afectada pasó.
- $ node --test tests/escalera/reglas.test.mjs
  ✔ tests/escalera/reglas.test.mjs
  ℹ pass 1
  ℹ fail 0
  exit 0
- $ ./verify
  La aserción `explicit yes, every time` de `tests/escalera/reglas.test.mjs` falló tras el cambio de frase.
  Fingerprint: 48d003984c96
  exit 1
- $ ./verify
  La aserción `present it to the person as a decision` de `tests/escalera/reglas.test.mjs` falló tras el cambio de frase.
  Fingerprint: d9ba21f03aa9
  exit 1
- $ ./verify
  verify: 36 pasos; detalle en pruebas/.temporales/verify.log
  resultado registrado: Fingerprint: 9f6aa962ab47
  VERIFY OK
  Fingerprint: 9f6aa962ab47
  exit 0
- $ node --test tests/escalera/reglas.test.mjs
  15 pruebas pasan; exit 0.
- $ ./verify
  verify: 36 pasos; VERIFY OK
  Fingerprint: 53cce3f3e4be
  exit 0
## Notes
- Tramo 1: corregida la secuencia A3 en la referencia; revisado el diff de planner, referencia y pruebas. `./verify` pasó; pendientes: 0. D-01, D-02, D-03.
- El último `kit run` pidió un `Consejo (tramo 1)`; se añadió la instrucción A3 a estas notas antes de relanzar. La persona autorizó una única ejecución nueva de `./verify`.
- Punto de control del tramo 1: archivos de Scope ya ajustados; diff de planner, referencia y literales de prueba revisado. `./verify` pasó (36 pasos; Fingerprint `9f6aa962ab47`; exit 0). Pendientes: 0.
- kit run: PAUSED (scope): escalera agotada: la puerta mecánica no pasó tras 3 corridas del builder: fuera de alcance: tests/escalera/reglas.test.mjs; A1: A1 sin corrida en Evidence; A2: A2 sin corrida en Evidence; A3: A3 sin corrida en Evidence; A4: A4 sin corrida en Evidence. Para otro relanzamiento la persona aprueba --paso 3; revisor=gpt-6.1-terra:low.

- Diagnóstico: la puerta no reconoció el archivo de prueba en Scope ni las revisiones manuales como corridas A#; A3 aún necesita corrección en la referencia.

- Paso 3 autorizado: corregir A3 en la referencia: primero editar el plan, mostrar el cambio en hasta cinco líneas y pedir sí para relanzar. Registrar evidencia A1–A4 en formato reconocido por la puerta.
- kit run: PAUSED (design): escalera agotada: revisión devuelta tras 4 corridas: [{"archivo":"core/references/planner/paused-and-interrupted.md","linea":32,"criterio":"A1","descripcion":"El paso 3 exige «two task relaunches», pero el paso 0 establece que los relanzamientos por infra también cuentan para el límite. Si uno de los dos relanzamientos fue por infra y hubo al menos un fallo de tarea, la nueva condición impide ofrecer el paso 3 aunque la escalera lo permite."}]; revisor=gpt-6.1-terra:low.
- kit run: paso 4: el paso 3 (nivel medium, modelo gpt-6.1-terra) no terminó: escalera agotada: revisión devuelta tras 4 corridas: [{"archivo":"core/references/planner/paused-and-interrupted.md","linea":32,"criterio":"A1","descripcion":"El paso 3 exige «two task relaunches», pe. Créditos del paso 3: «sin tokens medidos» (estimación). Relevo al planner (modelo gpt-6.1-terra): «sin tokens medidos» (estimación). Pregunta de relevo: ¿lo quieres? La persona responde; kit run no lo ejecuta ni corre nada más.

- Paso 4: corregida A1 para contar relanzamientos infra; verify pasó y no quedan pasos pendientes. D-02.

- APPROVED: A1 cumple D-02; A2 y A3 cumplen D-02 con opciones elegibles y confirmación; A4 cumple D-03, verify 53cce3f3e4be. Diff dentro de Scope.
