---
estado: listo
rama: feature/casillas-en-vivo
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Casillas en vivo

## Objetivo
Mostrar el avance del constructor al completar cada paso comprobado y conservar una nota breve para retomarlo. La evidencia sigue vigente al editar planes.

## Supuestos
- Los cambios de estado del frontmatter siguen siendo obligatorios; la restricción de edición del plan permite también esas transiciones existentes.
- La exclusión de `cambios/` se aplica desde la raíz de cada repo; si se requiere otra ubicación en workspaces, cambia el contrato.

## Alcance
`agentes/constructor.md`, `skills/ejecutar-plan/SKILL.md`, `skills/planificar-cambio/SKILL.md`, `scripts/revisar-plan.mjs`, `nucleo/contrato/verificacion.md`, `skills/diagnosticar/diagnosticar.mjs`, `pruebas/contrato-constructor.mjs`, `pruebas/revisar-plan/`, `pruebas/diagnostico-sugiere/` y `verify` si hace falta conectar pruebas. Se pueden añadir pruebas y fixtures dentro de esas carpetas. No modificar tests de aceptación existentes, otros planes, producto ajeno ni la configuración local preexistente.

## Decisiones ya tomadas
- Ejecutor: constructor, porque los requisitos, contexto y comprobaciones están definidos y no requieren credenciales ni producción.
- Mantener las transiciones de estado existentes y la frase `vuelve a correr el mismo comando` exigida por `verify`.
- El constructor cambia solo casillas, Evidencia y Notas, además del estado obligatorio; la evidencia de cada paso va en Evidencia, no como sublínea de Pasos. No modifica Alcance ni Aceptación.
- Sin comprobación explícita o con paso incompleto, conserva la casilla pendiente y deja una línea en Notas que identifique el paso y el punto de reanudación; no inventa una comprobación ni declara COMPLETADO.
- La huella de evidencia excluye `cambios/` de ambos comandos Git mediante pathspec de exclusión anclado a la raíz; mantiene el comportamiento previo del resto, incluido el caso sin HEAD. Las huellas históricas pueden quedar obsoletas una vez por el cambio de contrato. La huella de integridad del revisor de `kit run` tiene otro propósito y no se altera.
- `revisar-plan` ya avisa heurísticamente cuando falta comprobación; conservar su CLI y probar también que una verificación de tramo no sustituye la del paso.

## Escenarios
- CUANDO se completa y comprueba cada paso de un tramo de cuatro pasos ENTONCES su casilla cambia antes de comenzar el siguiente (A1).
- CUANDO falta la comprobación o se interrumpe un paso ENTONCES queda pendiente y una nota permite retomarlo (A2).
- CUANDO se revisa un paso sin comprobación ENTONCES el revisor lo advierte en su línea (A3).
- CUANDO cambia el plan ENTONCES la huella de evidencia permanece vigente; un cambio rastreado de producto sí la invalida (A4).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Avance individual sin editar alcance ni aceptación | `node pruebas/contrato-constructor.mjs` y revisión del escenario real descrito en Notas | Registro observado de estados 1000, 1100, 1110, 1111 tras comprobaciones exitosas y antes del paso siguiente; secciones protegidas idénticas. |
| A2 | Paso sin comprobación o interrumpido queda pendiente y anotado | `node pruebas/contrato-constructor.mjs` | Ambos casos conservan casilla y nota de una línea; mutación que marque anticipadamente falla. |
| A3 | Aviso por comprobación ausente | `node --test pruebas/revisar-plan/*.test.mjs` | Aviso con línea correcta; comprobación del tramo no lo oculta y un paso con comprobación pasa. |
| A4 | Vigencia de evidencia independiente del plan | `node --test pruebas/diagnostico-sugiere/*.test.mjs` | En repo temporal real, modificaciones y altas en `cambios/` conservan vigencia; cambio rastreado fuera la vuelve obsoleta; contrato y diagnóstico coinciden. |

## Verificación
`./verify` — verificación completa del kit (≈10 min; depende del entorno).

## Pasos
- [x] Ajustar `agentes/constructor.md` y `skills/ejecutar-plan/SKILL.md` para el ciclo, límites y notas indicados (A1, A2). Comprobación: `node pruebas/contrato-constructor.mjs`; se cumplen A1 y A2.
- [x] Alinear `skills/planificar-cambio/SKILL.md` con comprobación explícita por paso y evidencia en su sección (A1, A2). Comprobación: `node pruebas/contrato-constructor.mjs`; el contrato actualizado pasa.
- [x] Cubrir `scripts/revisar-plan.mjs` con casos positivos y negativos en `pruebas/revisar-plan/`, corrigiendo solo si falla (A3). Comprobación: `node --test pruebas/revisar-plan/*.test.mjs`; exit 0.
- [x] Corregir el contrato de huella en `nucleo/contrato/verificacion.md` y su consumidor `skills/diagnosticar/diagnosticar.mjs` (A4). Comprobación: `node --test pruebas/diagnostico-sugiere/*.test.mjs`; se cumplen los casos de A4.
- [x] Conectar las pruebas nuevas a `verify` si aún no están incluidas (A1, A3, A4). Comprobación: `./verify` (≈10 min); exit 0 y suites pertinentes ejecutadas.

## Evidencia
$ node pruebas/contrato-constructor.mjs
ok A1
ok A2
ok A3
ok A5
ok A4
exit 0

$ ./verify
ok A1 / ok A2 / ok A3 / ok A5 / ok A4 (contrato-constructor)
10b: tests 10, pass 10, fail 0 (revisar-plan)
10c: tests 2, pass 2, fail 0 (huella del diagnóstico)
VERIFY OK
exit 0

Nota de revisión: estas salidas reflejan aserciones estáticas del contrato y el resto de las suites; los rótulos `ok A1/A2` no son observaciones del comportamiento de un constructor ejecutado.

Paso 2 — `$ node pruebas/contrato-constructor.mjs`
ok A1
ok A2
ok A3
ok A5
ok A4
exit 0

$ node --test pruebas/revisar-plan/*.test.mjs
ℹ tests 10
ℹ pass 10
ℹ fail 0
exit 0

$ node --test pruebas/diagnostico-sugiere/*.test.mjs
✔ the contract and diagnostic exclude tracked edits and new files under cambios/
✔ a repository without HEAD keeps the status-only fingerprint behavior
ℹ tests 2
ℹ pass 2
ℹ fail 0
exit 0

$ node pruebas/contrato-constructor.mjs
ok A2 sin comprobación: casilla pendiente y nota de reanudación
ok A2 interrumpido: casilla pendiente y nota de reanudación
ok A2 mutante: marcar anticipadamente se rechaza
ok A1 / ok A2 / ok A3 / ok A5 / ok A4
exit 0

Nota de revisión: esta salida procede de cadenas preparadas y `validarA2` dentro de la propia prueba; no ejercita al constructor y no acredita A2.

$ ./verify
fixture A2 sin comprobación: formato esperado validado; no ejecuta al constructor
fixture A2 interrumpido: formato esperado validado; no ejecuta al constructor
fixture A2 mutante: formato con casilla anticipada rechazado; no ejecuta al constructor
10b: tests 10, pass 10, fail 0 (revisar-plan)
10c: tests 2, pass 2, fail 0 (huella del diagnóstico)
VERIFY OK
exit 0

$ node pruebas/contrato-constructor.mjs
registro real A2 sin comprobación: casilla pendiente y nota de una línea validadas; no vuelve a ejecutar el modelo
registro real A2 sin comprobación: mutación de casilla rechazada
registro real A2 interrumpido: casilla pendiente y nota de una línea validadas; no vuelve a ejecutar el modelo
registro real A2 interrumpido: mutación de casilla rechazada
ok A1
ok A2
ok A3
ok A5
ok A4
exit 0

$ ./verify
registro real A2 sin comprobación: casilla pendiente y nota de una línea validadas; no vuelve a ejecutar el modelo
registro real A2 sin comprobación: mutación de casilla rechazada
registro real A2 interrumpido: casilla pendiente y nota de una línea validadas; no vuelve a ejecutar el modelo
registro real A2 interrumpido: mutación de casilla rechazada
10b: tests 10, pass 10, fail 0 (revisar-plan)
10c: tests 2, pass 2, fail 0 (huella del diagnóstico)
VERIFY OK
exit 0

$ node pruebas/contrato-constructor.mjs
registro real A2 sin comprobación: casilla pendiente y nota de una línea validadas; no vuelve a ejecutar el modelo
registro real A2 sin comprobación: mutación de casilla rechazada
registro real A2 interrumpido: casilla pendiente y nota de una línea validadas; no vuelve a ejecutar el modelo
registro real A2 interrumpido: mutación de casilla rechazada
ok A1 / ok A2 / ok A3 / ok A5 / ok A4
exit 0

$ ./verify
registro real A2 sin comprobación: casilla pendiente y nota de una línea validadas; no vuelve a ejecutar el modelo
registro real A2 sin comprobación: mutación de casilla rechazada
registro real A2 interrumpido: casilla pendiente y nota de una línea validadas; no vuelve a ejecutar el modelo
registro real A2 interrumpido: mutación de casilla rechazada
10b: tests 10, pass 10, fail 0 (revisar-plan)
10c: tests 2, pass 2, fail 0 (huella del diagnóstico)
VERIFY OK
exit 0

## Notas
- Franco autorizó terminar con las observaciones reales ya registradas y una prueba automática que valide esos resultados y rechace la mutación; distinguir claramente esa prueba de una nueva ejecución del agente.
- Reanudación autorizada: `git status` muestra solo este plan modificado; `git diff --stat` registra dos líneas añadidas con las observaciones reales. Queda resolver A2 automatizado y verificar.
- Observación independiente de interrupción: `/tmp/casillas-interrupcion/cambios/observacion-interrupcion/plan.md` registra salida parcial y comprobación terminada con código 130; el paso quedó sin marcar y la nota indica cómo retomar. `node /tmp/casillas-interrupcion/pruebas/estado.mjs` confirmó los tres hechos. La observación cubre el comportamiento, pero la prueba automatizada A2 exigida en Aceptación sigue validando ejemplos preparados.
- Observación independiente posterior al commit: `/tmp/casillas-en-vivo-observacion/observaciones.log` registra comprobaciones con estados 0000, 1000, 1100, 1110 y final 1111; el paso 5 sin comprobación quedó pendiente con nota. La primera verificación final falló por el formato de la nota y pasó después de corregirlo. No se observó un paso interrumpido; A2 sigue parcialmente sin demostrar, y sus pruebas automatizadas siguen siendo ejemplos preparados.
- Escenario temporal listo en `/tmp/casillas-en-vivo-observacion`: `cambios/casillas-en-vivo-real/plan.md` y `pruebas/observar.mjs`. La sintaxis del observador pasa con `node --check`; no se invocó como sustituto del constructor ni se afirma A1/A2 observado. Para completar la observación, lanzar exactamente `codex-constructor exec --skip-git-repo-check -C /tmp/casillas-en-vivo-observacion 'Lee /home/franco/.agents/skills/ejecutar-plan/SKILL.md y ejecuta el plan aprobado cambios/casillas-en-vivo-real/plan.md paso por paso. Sigue la skill; después de cada comprobación registra evidencia y marca la casilla antes del siguiente paso. En el paso 5, que no tiene comprobación, deja la casilla pendiente y añade una nota de una línea. No edites Alcance ni Aceptación. Corre la Verificación final tal cual y no alteres otros archivos.'`. Revisar `/tmp/casillas-en-vivo-observacion/observaciones.log` y las cuatro señales; registrar sus salidas reales aquí solo si el constructor termina el recorrido. Esta instancia no puede lanzar otra instancia del constructor bajo sus instrucciones, por eso la observación real sigue pendiente.
- Revisión DEVUELTO (A2): los casos `sin comprobación`, `interrumpido` y `mutante` de `pruebas/contrato-constructor.mjs` son cadenas preparadas comprobadas por un validador ad hoc. No ejercitan al constructor ni prueban que edite el plan como requiere A2; sus salidas se conservan como resultado de esa prueba, no como evidencia del criterio.
- `kit run` usa ejecutables simulados en sus pruebas y la evaluación real del constructor está declarada como pendiente en `docs/evaluaciones/constructor.md`. Esta instancia no puede iniciar otra sesión del constructor por su instrucción de no llamar agentes; no se presenta la sesión actual como observación independiente. El escenario preparado arriba cubre A1 y el paso sin comprobación de A2; hace falta lanzarlo desde una sesión independiente y revisar sus resultados reales.
- Crear `pruebas/diagnostico-sugiere/huella.test.mjs` y conectarlo a `verify`: hoy esa carpeta solo contiene el proyecto juguete.
- Para A1 el principal deberá observar una ejecución real posterior con la skill modificada y un plan aprobado de cuatro pasos independientes, cada comprobación con señal y cada paso siguiente condicionado a observar la casilla anterior. Registrar las cuatro observaciones y comparar Alcance y Aceptación antes y después. No atribuir a una simulación prueba de comportamiento real; sin esa observación A1 queda pendiente en la revisión.
- La comprobación inicial mostró `main` limpia y actualizada; se creó `feature/casillas-en-vivo` como estaba autorizado.
- La suite aislada de revisar-plan falló dentro del sandbox al lanzar procesos hijos; fuera del sandbox pasó con 10/10.
- A1 todavía requiere que el principal observe en otra ejecución real con cuatro pasos los estados 1000 → 1100 → 1110 → 1111; esta ejecución no se usa como evidencia de esa observación.
- Reanudación A2: la prueba automatizada solo valida el formato de ejemplos escritos a mano, no el comportamiento del modelo. Ajusté sus mensajes para que lo declaren explícitamente; no cuento esos fixtures como aceptación. Una prueba real reproducible requiere un runner de integración optativo que abra un plan temporal aprobado, lance `codex-constructor` en una sesión independiente, observe el archivo tras cada comprobación y compruebe nota/casilla tras el caso sin comprobación o interrupción; debe quedar fuera de `./verify` para no introducir llamadas de modelo, gasto ni dependencia de credenciales en la verificación offline. Esta instancia no puede lanzar esa sesión por la instrucción de no llamar agentes; A2 queda pendiente hasta ejecutar y registrar ese recorrido real.
- Estado de cierre de esta reanudación: `./verify` pasó con exit 0, pero A2 sigue sin una prueba automatizada del comportamiento real; por eso el paso 1 queda sin marcar y el plan queda `parcial`. Para retomar: implementar fuera del flujo offline de `verify` un comando de integración real con fixture temporal y señalización por archivo, ejecutarlo desde una sesión independiente autorizada y validar cambios/notas producidos por el constructor; después integrar solo el contrato verificable de esa corrida al test, registrar resultados y volver a ejecutar `verify`.
- Pendientes raíz: `1` (paso 1; comprobado con el contador canónico `awk '/^- \[ \] / { n++ } END { print n+0 }' cambios/casillas-en-vivo/plan.md`). `git diff --check`: exit 0.
- A2 sustituido: `pruebas/revisar-plan/fixtures/` conserva el plan y las señales observadas de las sesiones reales `/tmp/casillas-en-vivo-observacion` y `/tmp/casillas-interrupcion`. La suite valida sus casillas pendientes, notas de una línea y señales de salida, y rechaza mutar cada casilla a marcada. Valida registros persistidos; no vuelve a ejecutar el modelo.
- Cierre: el contador canónico dio 0 pasos pendientes. A2 quedó cubierto por registros observados y comprobados; no se afirma una nueva ejecución del modelo. `./verify` terminó con exit 0; las notas anteriores que describían A2 pendiente son históricas y quedan superadas por esta prueba.
- Verificación final tras mover fixtures a la carpeta permitida por `.gitignore`: `node pruebas/contrato-constructor.mjs` y `./verify` pasaron; `git diff --check` pasó; contador de tareas pendientes: 0.
