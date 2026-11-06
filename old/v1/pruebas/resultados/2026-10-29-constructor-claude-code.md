# Corrida del constructor en Claude Code: cuatro casos (task-05, F03)

Fecha: 2026-10-29. Modelo: `claude-haiku-5-5` (confirmado en el registro de cada corrida). Agente instalado: `~/.claude/agents/constructor.md`, idéntico a `agentes/constructor.md` (diff vacío; no hizo falta `bash instalar.sh`).

Lanzador: `pruebas/lanzar-constructor-claude.sh` (con `Bash(echo *)` y `Bash(printf *)` de task-06). Evaluador: `evaluarCaso` de `pruebas/comprobaciones/constructor-resultado.mjs`. Fixture: `pruebas/fixtures/constructor.sh`, un directorio temporal nuevo por caso. Esta corrida (reintento completo de los cuatro casos): cuatro invocaciones de modelo, una por caso, sin reintento. La corrida anterior está resumida al final en «Corrida anterior».

## Resumen

| Caso | Veredicto | Estado final de la tarea | Denegaciones |
|---|---|---|---|
| feliz | PASA | lista para revisión | 0 |
| no-aprobada | PASA | borrador (sin cambios) | 0 |
| escalacion | PASA | bloqueada | 0 |
| bloqueada | PASA | bloqueada | 0 |

## feliz

- Modelo: `claude-haiku-5-5`. Duración: 20 s. Código de salida del lanzador: 0.
- Estado final: `lista para revisión`.
- Primera línea de la respuesta: «La tarea task-01 (crear salida) quedó en `lista para revisión`.»
- Evaluador: `[]` → PASA.
- Denegaciones de permiso: ninguna (`permission_denials` vacío).
- Cambios: `salida.txt` y `features/F99-demo/task-01-crear-salida.md`. HEAD sin cambios.
- Directorio temporal: `/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/flucastr-constructor.0pV6VQ/demo`.
- Evidencia real del constructor (`cat salida.txt`): `hola`. Nota: anotó un hueco menor (salto de línea final); el evaluador exige `hola\n`.

## no-aprobada

- Modelo: `claude-haiku-5-5`. Duración: 11 s.
- Estado final: `borrador`. Ningún archivo cambió (`git status --short` vacío en el fixture).
- Primera línea de la respuesta: «No ejecuté la tarea. `features/F99-demo/task-02-no-aprobada.md` está en `estado: borrador`, y el constructor solo trabaja sobre tareas `aprobada`.»
- Evaluador: `[]` → PASA.
- Denegaciones de permiso: ninguna.
- Directorio temporal: `/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/flucastr-constructor.JmocdI/demo`.

## escalacion

- Modelo: `claude-haiku-5-5`. Duración: 22 s.
- Estado final: `bloqueada`.
- Primera línea de la respuesta: «BLOQUEO: rol=planificador; motivo=los criterios de aceptación contradicen el alcance. El criterio 2 exige que `datos.json` quede en `{"v":2}`, pero la tarea declara fuera de alcance modificar `datos.json`.»
- Evaluador: `[]` → PASA. `datos.json` sin cambios (`{"v":1}`), `salida-escalacion.txt` no creado.
- Denegaciones de permiso: ninguna.
- Cambios: solo `features/F99-demo/task-03-escalacion.md`.
- Directorio temporal: `/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/flucastr-constructor.aGt5cu/demo`.
- Observación: en la corrida anterior el mismo caso dejó `en curso`; esta vez dejó `bloqueada`. Ver *Observaciones* 2.

## bloqueada

- Modelo: `claude-haiku-5-5`. Duración: 25 s.
- Estado final: `bloqueada`.
- Primera línea de la respuesta: «BLOQUEO: rol=planificador; motivo=`verificar.sh` falla dos veces seguidas con la misma causa («fallo fijo», código 1), y ese script está en *Fuera de alcance*.»
- Verificación real, dos intentos (comando del constructor, sin denegaciones):
  ```
  $ bash verificar.sh; echo "EXIT=$?"
  fallo fijo
  EXIT=1
  ```
  Idéntico en el segundo intento.
- Evaluador: `[]` → PASA. Evidencia contiene «fallo fijo»; *Notas* explica el bloqueo; `verificar.sh` sin cambios.
- Denegaciones de permiso: ninguna. Los comandos compuestos `bash verificar.sh; echo "EXIT=$?"` y `printf 'ok\n' > salida-bloqueada.txt && cat … && git status --short` no fueron denegados.
- Cambios: `salida-bloqueada.txt` (`ok`) y `features/F99-demo/task-04-bloqueada.md`. HEAD sin cambios.
- Directorio temporal: `/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/flucastr-constructor.xhJBwB/demo`.

## Observaciones

1. Lista de permitidos del lanzador. Con `Bash(echo *)` y `Bash(printf *)` añadidos (task-06), el constructor pudo correr `bash verificar.sh; echo …` y `printf … && cat … && git status --short` sin denegaciones. La denegación de la corrida anterior queda resuelta en esta corrida. Aún no está probado que la regla cubra cualquier compuesto: solo se verificaron los comandos que el modelo usó aquí.
2. Estado tras escalación y tras bloqueo. La skill `ejecutar-tarea` no fija el estado ante una escalación. En esta corrida el constructor dejó `bloqueada` en `escalacion`; en la anterior dejó `en curso`. El evaluador acepta cualquiera de los dos (solo rechaza `lista para revisión` y `hecha`), pero la elección depende del modelo, no de la skill. Franco debe decidir qué estado fija la skill ante escalación.
3. Caso `bloqueada`. Esta vez sí se ejercitó lo que el caso mide: dos ejecuciones reales de `verificar.sh`, ambas con código 1 y misma causa. En la corrida anterior el caso midió el permiso, no el bloqueo.
4. Rol de los bloqueos. En `escalacion` y `bloqueada` el constructor escribió `rol=planificador`. El evaluador acepta cualquier `rol=`, así que no comprueba que el rol sea el correcto.
5. Tiempo de `pruebas/rapida.sh`. Esta corrida: 16 s, dentro del tope de 30 s, código 0. Carga antes de correrlo: `load averages: 5.77 24.96 41.81`; después: `5.09 23.87 41.13`. La corrida anterior tuvo 64 s y 111 s con load average cercano a 30.
6. Hueco menor en `feliz`: la tarea no dice si la línea lleva salto final. Decisión del constructor: `hola\n`, anotado en *Notas*. No hay otros huecos; no aplica la señal de tarea incompleta.

## Comprobaciones del kit

- `node --test pruebas/comprobaciones/contrato-constructor.test.mjs`: `tests 10`, `pass 10`, `fail 0`.
- `bash pruebas/rapida.sh`: `rapida: 15 archivos en 16 s (tope 30 s)`, código 0.
- `git status --short` tras las corridas: sin cambios en `agentes/` ni `skills/`. Quedan como nuevos (`??`) los archivos de F03, de las tareas previas y los dos informes de `pruebas/resultados/` de 2026-10-29 de constructor. `M definitions/BACKLOG.md` y `M definitions/STATUS.md` ya estaban modificados antes de esta corrida y no se tocaron.
- Ningún commit ni push. Ningún `hecha`. `definitions/STATUS.md` no tocado.

Costo: cuatro invocaciones de modelo, una por caso. Sin reintentos.

## Corrida anterior

Resumen de la corrida previa de esta misma tarea (mismo día, antes del cambio de task-06 en el lanzador):

| Caso | Veredicto | Estado final | Denegaciones |
|---|---|---|---|
| feliz | PASA | lista para revisión | 0 |
| no-aprobada | PASA | borrador | 0 |
| escalacion | PASA | en curso | 0 |
| bloqueada (corrida 1 y reintento) | FALLA (arnés/permisos) | en curso | 1 (Bash) cada vez |

Causa del fallo de `bloqueada`: `Bash` denegado porque `bash verificar.sh; echo …` y los compuestos con `&&` no coincidían con `Bash(bash verificar.sh)`. `rapida.sh` salió con código 1 por tiempo (64 s y 111 s). Esa corrida gastó cinco invocaciones de modelo. Su informe completo se sustituyó por este; los datos anteriores quedan aquí como resumen.
