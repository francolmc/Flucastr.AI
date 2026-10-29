# task-03 — El coordinador orquesta el modo yolo sin puertas y se detiene ante escalaciones
repo: Flucastr.AI   depende_de: task-02   estado: aprobada

## Descripción
Con la activación ya escrita (task-02), el `coordinador` debe saber qué hace mientras el modo está activo (`definitions/WORKFLOW.md` §9.3): pide la descomposición al `planificador`, aprueba tareas que pasan la revisión de «completa», delega al `constructor` sin `Rama:`, marca `hecha` solo con evidencia real, trata `REFINAR:` y `CONFIRMAR:` como escalación, respeta los límites que no se omiten y deja el registro final en `STATUS.md`.

## Contexto
- Repo: este, único repo. Leídos: `agentes/coordinador.md` (tras task-02 tiene `## Modo yolo`; sin ella, esta tarea no puede correrse) y `definitions/WORKFLOW.md` §9.3 («Qué se omite», «Feature ambigua en yolo», «Quién hace qué en yolo», «Límites que siguen vigentes», «Registro en `STATUS.md`»). El coordinador no tiene shell: no re-ejecuta comandos; juzga la *Evidencia* que escribió el constructor en la tarea.
- `pruebas/comprobaciones/formato-tarea.mjs` define la plantilla de tarea (constante `SECCIONES`) y los marcadores de pendiente prohibidos (`RE_PENDIENTE`); el coordinador puede leerlo para su revisión de «completa».
- Validadores vigentes: los mismos de task-02 (`contrato-roles.mjs`, `formato-flujo.mjs`).
- Archivo a tocar: solo `agentes/coordinador.md`. Comando de prueba: `node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/formato-flujo.test.mjs`.

## Decisiones ya tomadas
- Dentro de `## Modo yolo` (a continuación de las cinco reglas de task-02) se añade la subsección `### Mientras está activo`, con estas reglas:
  1. **Se omiten las puertas 2, 3 y 4.** Sin `definitions/BACKLOG.md`, delegas `crear-backlog` al `planificador` y continúas sin esperar aprobación. Una feature del alcance sin tareas: delegas `descomponer-feature`. Todo encargo a `planificador` o `constructor` incluye la línea `Modo yolo: activo`. Al `constructor` no le pasas la línea `Rama:`. Trabajas en orden del backlog (o la feature nombrada) y de `depende_de:`, una tarea a la vez.
  2. **Revisión de «completa» (sustituye la puerta 3).** Antes de pasar una tarea de `borrador` a `aprobada`, léela y comprueba: están todas las secciones de `SECCIONES` de `pruebas/comprobaciones/formato-tarea.mjs`; «Fuera de alcance» no está vacío; no hay marcadores de pendiente (`RE_PENDIENTE` del mismo archivo); `depende_de:` es `—` o IDs de tareas existentes. Si todo pasa, escribes `aprobada`; si no, es escalación (regla 5).
  3. **`REFINAR:`** del `planificador` (primera línea `REFINAR: feature=Fxx; preguntas=<n>`): es escalación por falta de especificación. No preguntas a Franco en medio del modo: escribes al inicio de `STATUS.md` (sección «Escalación») las preguntas, cambias la línea a `Modo yolo: detenido (feature Fxx requiere refinado)` y te detienes, conservando lo ya hecho. Franco responde (refinado normal) y puede pedir yolo de nuevo.
  4. **`CONFIRMAR:`** del `constructor` no debería ocurrir en yolo: no se la preguntas a Franco; es escalación (regla 5).
  5. **Escalaciones que detienen el modo:** cambio de alcance o algo no previsto; falta de credenciales o acceso; un `BLOQUEO:` que toca `definitions/` (nunca se cambian en yolo; vuelve a la puerta 1); una tarea revisada que no es «completa»; `CONFIRMAR:`. Escribes el motivo al inicio de `STATUS.md`, la línea pasa a `Modo yolo: detenido (<motivo>)` y avisas a Franco.
  6. **`hecha` por evidencia (sustituye la puerta 4).** Cuando una tarea queda `lista para revisión`, lee su *Evidencia*: si contiene la salida real de cada comando de *Verificación* y esa salida coincide con lo *Esperado*, escribes `hecha` y en «Paso actual» una línea `task-NN: hecha | <ruta de la tarea>`. Si no, `bloqueada` y la línea `task-NN: bloqueada | <ruta>`, y el modo se detiene. Si el constructor respondió `BLOQUEO:` o la verificación falló dos veces por la misma causa, la tarea queda `bloqueada` y el modo se detiene.
  7. **Feature terminada:** con todas sus tareas `hecha`, escribes `hecha` en el `estado` de su fila de `BACKLOG.md` (el pedido explícito de Franco cubre esa aprobación) y continúas con la siguiente del alcance; delegas `descomponer-feature` para mover la marca `→`. No escribes el aviso de «cierra la rama»: en yolo no hay rama de feature.
  8. **Cierre:** al terminar el alcance, la línea pasa a `Modo yolo: terminado`; si te detienes, a `Modo yolo: detenido (<motivo>)`. En ambos casos «Espera a Franco» lista qué revisar y commitear (las rutas de las tareas) y dice que no hay commits: los cambios están sin commitear en la rama de la línea `Modo yolo`.
  9. **No se omiten nunca:** no lees `.env`, llaves ni credenciales; no hay push, PR, merge ni despliegue; no cambias `definitions/` (salvo `STATUS.md` y los campos `estado` permitidos); ni tú ni los demás roles hacen commit, ni local.
- En `## Límites`, el segundo bullet («Cambias un `estado` … únicamente cuando Franco lo aprueba de forma explícita…») se amplía con esta frase final: «Excepción: en el modo yolo (sección «Modo yolo»), que Franco pidió de forma explícita, apruebas tareas y las marcas `hecha` según esa sección.» No se cambia ningún otro bullet.
- Se mantiene `Modo yolo: activo` como texto del encargo exactamente igual al que lee el constructor (task-01) y el planificador (task-04).

## Alcance / Fuera de alcance
Alcance: la subsección `### Mientras está activo` con las nueve reglas y la frase de excepción en `## Límites`.
Fuera de alcance: la activación y el registro inicial (task-02), el validador (task-06), el `planificador`, el `constructor`, `STATUS.md`, `definitions/`, `README.md`.

## Pasos
1. Añadir la subsección `### Mientras está activo` dentro de `## Modo yolo`. Resultado: ``grep -c '^### Mientras está activo' agentes/coordinador.md`` devuelve 1.
2. Ampliar el bullet de `## Límites` con la frase de excepción. Resultado: ``grep -c -F 'Excepción: en el modo yolo' agentes/coordinador.md`` devuelve 1.
3. Comprobar que `Modo yolo: terminado`, ``Modo yolo: detenido (feature Fxx requiere refinado)`` y `Modo yolo: activo` aparecen literales (`grep -c -F`).
4. Correr la *Verificación*.

## Criterios de aceptación
1. El archivo contiene literalmente `Modo yolo: terminado`, `Modo yolo: detenido (feature Fxx requiere refinado)` y `REFINAR: feature=Fxx; preguntas=<n>`. Se comprueba con `grep -c -F`.
2. Dice que en yolo no se pasa la línea `Rama:` al constructor, que `CONFIRMAR:` es escalación y que `hecha` exige evidencia real. Se comprueba con `grep -c -F` de `no le pasas la línea`, `es escalación` y `Evidencia`.
3. Contiene la excepción en `## Límites` (`Excepción: en el modo yolo`) y los límites que no se omiten (`no hay push, PR, merge ni despliegue`). Se comprueba con `grep -c -F`.
4. El contrato de roles y el formato de `STATUS.md` previos siguen cumpliéndose. Se comprueba con las pruebas de la *Verificación* (`fail 0`).
5. Solo cambió `agentes/coordinador.md` por esta tarea. Se comprueba con `git status --short agentes`.

## Verificación
```
grep -c '^### Mientras está activo' agentes/coordinador.md
for f in 'Modo yolo: terminado' 'Modo yolo: detenido (feature Fxx requiere refinado)' 'REFINAR: feature=Fxx; preguntas=<n>' 'Excepción: en el modo yolo' 'no le pasas la línea' 'no hay push, PR, merge ni despliegue'; do grep -c -F -- "$f" agentes/coordinador.md; done
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/formato-flujo.test.mjs
git status --short agentes
```
Esperado: el primer `grep` muestra 1; los demás, un número mayor que 0; las pruebas con `fail 0`; `git status` incluye `agentes/coordinador.md` y ningún otro agente cambia por esta tarea.

## Evidencia

## Notas
