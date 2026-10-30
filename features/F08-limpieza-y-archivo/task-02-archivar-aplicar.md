# task-02 — `scripts/archivar.mjs --aplicar`: mover features terminadas
repo: Flucastr.AI   depende_de: task-01   estado: aprobada

## Descripción
Añade al script el modo `--aplicar [Fxx]`, que mueve la carpeta completa de cada feature candidata a `features/completed/`. Lo ejecuta Franco, nunca un agente (`definitions/WORKFLOW.md` §10.2). Solo renombra carpetas: no sobrescribe, no borra, no toca `BACKLOG.md`, `STATUS.md`, ramas ni git. Los cambios quedan sin commit para que Franco los revise y los commitee.

## Contexto
- Leídos: `definitions/WORKFLOW.md` §5 y §10.2; `scripts/archivar.mjs` y `pruebas/comprobaciones/archivar.test.mjs` (creados en task-01; si no existen, detenerse con `BLOQUEO: rol=constructor; motivo=task-01 sin hacer`).
- A tocar: `scripts/archivar.mjs` y `pruebas/comprobaciones/archivar.test.mjs`. Comando de prueba: `node --test pruebas/comprobaciones/archivar.test.mjs`.
- `features/completed/` no existe hoy; el script la crea al mover.
- Reutiliza `chequear(raiz)`: la lista `candidatas` y las `inconsistentes` ya aplican las cuatro condiciones de candidata; `--aplicar` no repite esa lógica.
- La verificación real **no** corre `--aplicar` sobre este repo (movería F01–F07 a mano de Franco): se prueba solo en raíces temporales.

## Decisiones ya tomadas
- **Supuesto de Franco (recomendación del arquitecto):** se archiva después del PR de la feature, en su propio commit `chore/`. El script no impone cuándo; el mensaje final lo recuerda.
- Sintaxis: `node scripts/archivar.mjs --aplicar` mueve todas las candidatas; `node scripts/archivar.mjs --aplicar F03` mueve solo F03; `--raiz <dir>` sigue disponible. `--aplicar` y los argumentos se leen de `process.argv.slice(2)`; el ID debe cumplir `/^F\d{2}$/`; cualquier otro argumento desconocido → `error: argumento desconocido '<x>'` por stderr y código 1 sin mover nada.
- API exportada nueva: `aplicar(raiz, ids)` (ids = arreglo de IDs, o `null` para todas) devuelve `{ movidas: [{ id, desde, hasta }], omitidas: [{ id, motivo }] }`. Mueve con `fs.mkdirSync(completed, { recursive: true })` y `fs.renameSync(carpeta, destino)`; nada más (no copia, no borra, no `rmSync`).
- Un ID pedido que no es candidata se omite con su motivo (el de `inconsistentes`, o «no tiene fila hecha» / «no existe la fila»); en el CLI, si se pidió un ID concreto y no se movió, código 1. Con `--aplicar` sin ID y sin candidatas: imprime «Nada que archivar.» y código 0.
- Salida del CLI: una línea `movida: features/F01-… -> features/completed/F01-…` por feature, las omitidas con su motivo, y al final: «Cambios sin commit. Revisa con `git status` y commitéalos en su propio commit chore/ (después del PR de la feature).».
- Antes de mover, `aplicar` vuelve a calcular `chequear(raiz)` (no confía en un resultado previo) y no mueve nada de una feature si dejó de ser candidata.

## Alcance / Fuera de alcance
Alcance: `--aplicar`, `aplicar()` y sus pruebas.
Fuera de alcance: modificar `BACKLOG.md`, `STATUS.md` o estados de tareas; mover tareas sueltas; `git add`/commit; deshacer movimientos; ejecutar `--aplicar` en el repo real; cambios en agentes, skills o README (task-03 y task-04).

## Pasos
1. En `scripts/archivar.mjs`, implementar `aplicar(raiz, ids)` según *Decisiones*. Resultado: `node --check scripts/archivar.mjs` sin salida.
2. Extender el CLI con `--aplicar [Fxx]`, la validación de argumentos y los códigos de salida. Resultado: `node scripts/archivar.mjs --aplicar --raiz <temporal>` mueve y termina en 0.
3. En `archivar.test.mjs`, reutilizar la raíz temporal de task-01 y añadir: (a) `--aplicar` sin ID mueve la candidata completa (con sus `task-*.md` y un `refinado.md` de prueba) a `features/completed/Fxx-…` y la carpeta original ya no existe; (b) `--aplicar F02` mueve solo F02 y deja F01; (c) una feature `hecha` con una tarea `en curso` no se mueve y el CLI informa el motivo; (d) con el destino ya existente no se mueve ni se sobrescribe (el contenido del destino no cambia); (e) `--aplicar F09` sin candidata → código 1 y nada movido; (f) argumento desconocido → código 1 y stderr con `argumento desconocido`; (g) tras mover, `BACKLOG.md` y `definitions/STATUS.md` de la raíz temporal tienen exactamente el mismo contenido que antes; (h) el modo chequeo sigue sin mover nada. Resultado: pasan.
4. Correr la *Verificación*.

## Criterios de aceptación
1. `--aplicar` mueve la carpeta completa (tareas y `refinado.md`) a `features/completed/Fxx-nombre/` solo si es candidata. Casos (a)/(c)/(d).
2. `--aplicar Fxx` mueve únicamente esa feature. Caso (b).
3. No sobrescribe, no borra y no modifica `BACKLOG.md` ni `STATUS.md`. Casos (d)/(g).
4. Los IDs no candidatos y los argumentos inválidos terminan en 1 sin mover nada. Casos (e)/(f).
5. `bash pruebas/rapida.sh` sigue pasando dentro del tope de 30 s.

## Verificación
```
node --check scripts/archivar.mjs
node --test pruebas/comprobaciones/archivar.test.mjs
node scripts/archivar.mjs; echo "salida=$?"
bash pruebas/rapida.sh
```
Esperado: la primera sin salida; la segunda con `fail 0`; la tercera (modo chequeo sobre el repo real, sin `--aplicar`) imprime el informe y `salida=0`; la cuarta termina con `rapida: N archivos en S s (tope 30 s)` y código 0. `ls features` sigue mostrando `F01-…` a `F08-…` y ningún `completed/` creado por la tarea.

## Evidencia

## Notas
