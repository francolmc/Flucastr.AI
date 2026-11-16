---
estado: listo
rama: feature/continuidad
base: main
repos: [.]
ejecutor: constructor
tramo: 1
tipo: codigo
---
# Continuidad del constructor

## Objetivo
Permitir que un constructor complete los tramos aprobados de una historia o plan sin intervención de Franco, con límites observables, registro retomable y revisión en contexto nuevo.

## Exploración
- Las casillas en vivo existen en `agentes/constructor.md` y `skills/ejecutar-plan/SKILL.md`; `cambios/hechos/casillas-en-vivo/plan.md` conserva observaciones reales. Las pruebas automatizadas validan registros, no una nueva ejecución del modelo.
- `skills/planificar-cambio/SKILL.md` limita cada historia a tres archivos de producto y la vincula hoy a un tramo. Los planes antiguos admiten tramos; se necesita permitir agrupar varios tramos pequeños bajo una historia sin romperlos.
- El constructor solo puede ejecutar el tramo activo; el principal revisa cada tramo. `scripts/kit-run.mjs` orquesta por separado y relanza tras fallos; su prueba A2 exige tres corridas de verificación.
- `./verify` ejecuta `pruebas/contrato-constructor.mjs`, que exige literalmente frases sobre casillas, formato y compatibilidad; los cambios de redacción afectados requieren actualizar sus aserciones conservando el comportamiento. También ejecuta `pruebas/kit-run/probar.mjs`, cuyo A2 exige tres corridas ante fallo; debe adaptarse para el nuevo modo sin debilitar cobertura ni compatibilidad antigua.
- Franco eligió el 16-11-2026 revisión al final de la historia, con revisión por tramo solo si el plan la exige; punto de control con archivos, diff resumido y verificación, sugiriendo commit solo al finalizar la historia; y medición inicial del mismo comando, con pausa antes de ejecutarlo si no existe medida.

## Evaluación
Revisión final recomendada: preserva la continuidad y reduce revisiones, pero detecta más tarde defectos acumulados. Una revisión por tramo detecta antes defectos y reduce acumulación, a costa de más revisiones y detener el avance hasta el veredicto. El plan podrá exigirla para riesgo alto; no es automática. El punto de control deja trazabilidad y alerta del tamaño, pero no sustituye un commit recuperable.

## Supuestos
- El modo continuo es explícito en cada plan, para conservar planes y automatizaciones anteriores; si Franco quiere migración universal, cambian el alcance y las pruebas.
- Una historia continua puede agrupar tramos declarados en orden; cada tramo conserva su alcance, aceptación y comprobación. Si se exige otra representación, cambia la plantilla.
- La duración medida es una línea previa por comando exacto y entorno equivalente, registrada en el plan; si no existe o no es válida, se pausa antes de esa comprobación.

## Decisiones ya tomadas
- Las dudas menores se resuelven dentro del alcance y se registran en `Decisiones`; las decisiones de producto o de alcance requieren pausa.
- La segunda falla de la misma causa detiene la ejecución; fallos distintos no se cuentan como iguales sin diagnóstico explícito.
- No hay commits entre tramos; Franco decide el commit tras la historia revisada.
- Ejecutor: constructor, porque requisitos, contexto, comprobaciones y bloqueos están especificados, sin acceso a credenciales ni producción.

## Validación
Franco confirmó las tres recomendaciones el 16-11-2026. Plan aprobado por Franco el 16-11-2026.

## Alcance
Producto: `agentes/constructor.md`, `agentes/principal.md`, `skills/ejecutar-plan/SKILL.md`, `skills/planificar-cambio/SKILL.md`, `scripts/kit-run.mjs`. Pruebas: `pruebas/contrato-constructor.mjs`, `pruebas/kit-run/probar.mjs` y nuevos archivos bajo `pruebas/continuidad/`; documentación: `README.md`. Las rutas de producto y pruebas existentes no se mueven ni archivan; actualizar las pruebas citadas si cambia el contrato. Fuera: instalación, credenciales, producción, commits y cambios de comportamiento de planes sin modo continuo salvo correcciones expresamente necesarias de compatibilidad.

## Condiciones de parada
Para este plan rigen las reglas actuales hasta que el cambio esté aprobado y construido. En el modo nuevo: avanzar solo con verificación verde, dentro del alcance y sin decisión pendiente de Franco; parar con nota de lo hecho, lo que falta y la causa ante segunda falla por la misma causa, necesidad de salir del alcance, decisión de Franco, falta de duración medida o ejecución que supere el doble de esa duración. Conservar las demás prohibiciones y bloqueos del kit.

## Verificación
`./verify` — exit 0; incluye contratos y pruebas offline. Además, el recorrido real de A6 exige dos ejecuciones independientes del constructor, sin secretos ni producción; si no se puede ejecutarlas se registra PAUSA y no se presenta una simulación como evidencia real.

## Pasos

- [Tramo 1](tramo-1.md): el plan expresa continuidad y límites
- [Tramo 2](tramo-2.md): el constructor continúa con límites
- [Tramo 3](tramo-3.md): comprobar continuidad y parada

## Evidencia

$ node pruebas/contrato-constructor.mjs
ok A4: contrato nuevo y compatibilidad con el contrato anterior
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
exit 0

Revisión DEVUELTO corregida: la revisión por tramo queda opcional incluso para riesgo alto y bloquea solo cuando el plan la declara.
$ rg -n 'Revisión: por tramo|por tramo|riesgo alto|Riesgo alto' skills/planificar-cambio/SKILL.md agentes/principal.md README.md
exit 0; revisadas todas las coincidencias: plantilla/regla 11 y reglas del principal son condicionales; README dice «puede exigir».
$ git diff --check
exit 0

$ node pruebas/contrato-constructor.mjs
ok A4: contrato nuevo y compatibilidad con el contrato anterior
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
exit 0

$ rg -n 'continuidad|punto de control' README.md
18:Un cambio largo se parte en tramos pequeños (`### Tramo N`). Por defecto, el constructor ejecuta un tramo y espera la revisión del principal; un plan puede declarar `continuidad: continua` para que complete la historia aprobada de punta a punta. El plan fija condiciones de parada y mide antes la duración de cada comprobación limitante. Si la medida falta, el constructor se detiene antes de esa comprobación. Al completar la historia, el principal revisa en contexto nuevo; si es de riesgo alto, el plan puede exigir revisión por tramo, que detecta defectos antes a costa de más pausas. Cada tramo deja un punto de control con archivos tocados, resumen del diff y comprobación; sugiere un commit al final de la historia, que Franco hace manualmente.
exit 0

$ rg -n 'continuidad|contexto nuevo' agentes/principal.md
51:   - En un plan por tramos, pon `tramo: <n>` y `estado: aprobado`. Sin `continuidad: continua`, el constructor hace solo ese tramo. Con continuidad, ejecuta la historia aprobada tramo a tramo sin esperarte, mientras cada comprobación pasa, sigue dentro del alcance y no requiere una decisión de Franco; aplica las *Condiciones de parada* del plan y deja punto de control por tramo.
57:   - `COMPLETADO`: revisa en contexto nuevo el `git diff` de los archivos del *Alcance*, la cola de la *Evidencia* y las *Notas*, y marca cada fila de Aceptación como cumplida o con defecto. En continuidad, la revisión se hace al final de la historia; si el plan declara `Revisión: por tramo` (riesgo alto), revisa el punto de control antes de permitir el tramo siguiente. La revisión final mantiene el avance continuo, pero puede descubrir defectos acumulados; la revisión por tramo los detecta antes y añade pausas y revisiones. **Riesgo alto:** corre la *Verificación* del plan una vez, en una sola espera, y lee su cola. **Riesgo bajo** (cambio pequeño o `tipo: docs`): no repites `verify`; basta el `git diff` y la comprobación declarada. No escribas scripts ni levantes servidores o contenedores. Si falla por el entorno (Docker, red, permisos), haz como máximo un diagnóstico de dos comandos y avisa a Franco. Un defecto, aunque sea de una línea, se devuelve: no corriges; anótalo en *Notas* (archivo, línea, criterio que incumple), pon el plan en `estado: aprobado` y relanza al constructor, hasta 2 relanzamientos; después deja el cambio `parcial` y di a Franco el detalle. Si todo se cumple, **puerta 2**: Franco revisa la evidencia y decide el commit.
61:   - Plan por tramos sin continuidad: en cada `COMPLETADO: ...; tramo=<n>`, revisa el `git diff` de ese tramo, corre su `Verificación del tramo:` (el nivel que ese tramo declara; no subas de nivel por tu cuenta) y, si pasa, avanza `tramo:` al siguiente y vuelve a poner `estado: aprobado`. En continuidad, no revises ni relances entre tramos salvo que el plan marque `Revisión: por tramo`; al final de la historia revisa desde contexto nuevo. Todo tramo continuo deja punto de control con archivos tocados, diff resumido y comprobación. Al cerrar la historia deja en *Notas* un resumen de 5 líneas y pide a Franco `/compact` o una sesión nueva con `Plan: <ruta>`. La puerta 2 llega tras la última historia, con `verify` completo.
79:Cuando el plan exija revisión por tramo, responde con la evidencia a la vista: ¿existe lo pedido?; ¿está conectado al recorrido real (el entrypoint productivo) o es solo una función suelta?; ¿funciona con datos reales, no con un fixture a medida?; ¿sigue andando lo vecino que el tramo no debía tocar? Si una pregunta no se puede responder con el diff y la evidencia, es un defecto del plan: anótalo en *Notas* como mejora para el próximo plan. Si una respuesta es no, el tramo no avanza: se devuelve al constructor o se pausa. En revisión final, evalúa esas mismas preguntas al acabar la historia, desde contexto nuevo.
exit 0

$ node pruebas/contrato-constructor.mjs
ok A4: contrato nuevo y compatibilidad con el contrato anterior
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
exit 0

## Notas
Revisión tramo 1: APROBADO; A1 cumplido tras corregir la revisión opcional.
La plantilla, el principal y el README describen el modo continuo y sus límites.
La conexión con la ejecución real corresponde al tramo 2; aún no está implementada.
Compatibilidad existente: `node pruebas/contrato-constructor.mjs` pasó en revisión.
Sigue el tramo 2; abrir contexto nuevo con este plan antes de delegarlo.
Revisión tramo 1 — DEVUELTO: `skills/planificar-cambio/SKILL.md`, regla 11 y plantilla: exige `Revisión: por tramo` para riesgo alto; incumple la decisión validada de que sea opcional aunque el riesgo sea alto. La comprobación `node pruebas/contrato-constructor.mjs` pasó. Corregir la contradicción y volver a comprobar.
Resuelto: 2026-11-16, la plantilla y la regla 11 aclaran que la revisión por tramo es opcional también para riesgo alto; `agentes/principal.md` especifica que solo se revisa entre tramos cuando el plan la exige. Revisadas todas las apariciones relacionadas en los tres archivos; la comprobación del tramo volvió a pasar.
Tramo 1 listo: continuidad opcional, condiciones de parada, medición inicial, decisiones y puntos de control.
Archivos: `skills/planificar-cambio/SKILL.md`, `agentes/principal.md` y `README.md`.
Diff resumido: plantilla permite varios tramos pequeños por historia y checkpoints; principal revisa al final en contexto nuevo o por tramo si se exige.
Verificación del tramo: `node pruebas/contrato-constructor.mjs` pasó (exit 0); pendientes raíz del índice: 0.
Sigue Tramo 2; al cerrar la historia, el principal revisa la evidencia desde contexto nuevo.
