# task-03 — `validarTarea` acepta el estado `cancelada` con su motivo
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
`RE_SEGUNDA` de `formato-tarea.mjs` rechaza `estado: cancelada`, por lo que el validador de la puerta previa rechaza las tareas descartadas. Esta tarea agrega `cancelada` como estado válido y exige en *Notas* una línea `Cancelada: motivo=<motivo>` (decisión D2=A de Franco), sin exigir *Evidencia*.

## Contexto
- Tocar: `scripts/formato-tarea.mjs`, `pruebas/comprobaciones/formato-tarea.test.mjs`
- Requiere: ninguno
- `scripts/formato-tarea.mjs` (confirmado): `RE_SEGUNDA` en la línea 25 (lista de estados); `ESTADOS_QUE_EXIGEN_EVIDENCIA` en la línea 22; `validarTarea` calcula `estado = segunda?.[3]` y termina con la regla 12 (`Requiere:`).
- `scripts/formato-bloqueo.mjs` (de task-01): `parsearCancelada`, `lineasDeNotas`. De task-01 lee solo las *Notas*.
- `scripts/validar-tarea.mjs` (confirmado): solo llama a `validarTarea`; no tiene lista propia de estados.
- Base medida: `node --test pruebas/comprobaciones/formato-tarea.test.mjs pruebas/comprobaciones/validar-tarea.test.mjs` da `ℹ fail 0`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «5. Pieza 3 — Telemetría que da pistas»

## Decisiones ya tomadas
- `RE_SEGUNDA` agrega `cancelada` al final de la lista de estados.
- Regla 13 nueva: con `estado === 'cancelada'`, *Notas* debe tener exactamente una línea `Cancelada:` (con `lineasDeNotas`) y pasar `parsearCancelada`; si falta, «Una tarea «cancelada» exige una línea «Cancelada: motivo=…» en «Notas».»; si es inválida, el `error` de `parsearCancelada`.
- `cancelada` no está en `ESTADOS_QUE_EXIGEN_EVIDENCIA`. La regla no se aplica a otros estados.
- `formato-tarea.mjs` importa de `./formato-bloqueo.mjs` solo funciones, usadas dentro de `validarTarea` (hay ciclo de módulos con `formato-requiere.mjs`, que ya funciona así).

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: la lista de estados y la regla 13 de `validarTarea`.
Fuera de alcance: `formato-evidencia.mjs` (task-02), `registrar.mjs`, `WORKFLOW.md` §6, `archivar.mjs` y `coherencia-features` (pendientes de la puerta 1), la lista de estados de la plantilla.

## Pasos
1. En `scripts/formato-tarea.mjs` importa `lineasDeNotas` y `parsearCancelada` de `./formato-bloqueo.mjs` y agrega `cancelada` a `RE_SEGUNDA`.
2. Agrega la regla 13 antes del `return errores`.
3. En `formato-tarea.test.mjs` agrega casos: tarea `cancelada` válida con `Cancelada: motivo=replanificada` y sin *Evidencia* (sin errores); `cancelada` sin línea (un error); con motivo `nueva` (un error); una tarea `hecha` no cambia.
4. Corre la verificación.

## Criterios de aceptación
1. Una tarea `cancelada` con su línea válida no da errores de `validarTarea`; se comprueba con la prueba.
2. Sin la línea, o con motivo fuera de la lista, da un error; se comprueba con la prueba.
3. La regresión sobre las 49 tareas no cambia y este archivo sigue validando por el lanzador; se comprueba con los comandos 2 y 3.

## Verificación
```
node --test pruebas/comprobaciones/formato-tarea.test.mjs pruebas/comprobaciones/validar-tarea.test.mjs 2>&1 | grep -E "^ℹ fail"
node --test pruebas/comprobaciones/regresion-validadores.test.mjs 2>&1 | grep -E "^ℹ fail"
node ~/.flucastr-ai/validar-tarea.mjs features/F32-telemetria-de-bloqueos/task-03-estado-cancelada-validador.md
```
Esperado: `ℹ fail 0` en los dos primeros comandos y `OK: 1 tarea(s) válida(s)` en el tercero.

## Evidencia
```
$ node --test pruebas/comprobaciones/formato-tarea.test.mjs pruebas/comprobaciones/validar-tarea.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0
$ node --test pruebas/comprobaciones/regresion-validadores.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0
$ node ~/.flucastr-ai/validar-tarea.mjs features/F32-telemetria-de-bloqueos/task-03-estado-cancelada-validador.md
OK: 1 tarea(s) válida(s)
exit 0
```
Criterios 1 y 2: «acepta una tarea «cancelada» con su línea…», «rechaza una tarea «cancelada» sin línea…» y «rechaza… con motivo fuera de la lista» pasan dentro del `ℹ fail 0` del primer comando.
Criterio 3: la regresión de las tareas reales (`las tareas reales de features/ cumplen el formato`) pasa dentro del primer comando; `regresion-validadores` da `ℹ fail 0` en el segundo.
Rápida (`bash pruebas/rapida.sh`, anotación): `ℹ tests 621`, `ℹ pass 614`, `ℹ fail 7`; exit 1. Base 617/610/7: los 4 casos nuevos suman. Los 7 fallos son los mismos por nombre: «definitions/BACKLOG.md real cumple el formato», «los archivos reales cumplen la regla», «falla si un agente conserva la línea de modelos.json», «falla si falta la lectura acotada en constructor», «… en ejecutar-tarea», «falla si WORKFLOW.md pasa de 30720 caracteres», «falla si WORKFLOW.md conserva la frase sobre modelos.json».

## Notas
Huecos menores resueltos: (1) La spec no fija mensaje para más de una línea «Cancelada:»; se rechaza con «Una tarea «cancelada» debe tener exactamente una línea «Cancelada:» en «Notas»; tiene N.». Decisión abierta: ninguna.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
