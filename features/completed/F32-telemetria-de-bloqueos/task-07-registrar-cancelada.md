# task-07 — `registrar.mjs`: estado `cancelada` y evento `cancelacion`
repo: Flucastr.AI   depende_de: task-03, task-06   estado: hecha

## Descripción
`registrar.mjs` descarta (cuenta como `descartados`) las tareas con `estado: cancelada` porque no está en `ESTADOS_TAREA`. Esta tarea lo agrega y emite el evento `cancelacion` con el motivo de la línea `Cancelada:`, para medir cuántas tareas se descartan y si lo hacen con motivo.

## Contexto
- Tocar: `scripts/registrar.mjs`, `pruebas/capa1/registrar.test.mjs`
- Requiere: ninguno
- `scripts/registrar.mjs` (confirmado): `ESTADOS_TAREA` (línea 37), `POR_DE_ESTADO` (≈ 39), `ESQUEMA`, `claveDe` y el bucle de `extraer`; `RE_ESTADO` es genérico (`estado: (.+?)`) y `estado` fuera de `ESTADOS_TAREA` suma a `descartados`. De task-06 lee solo las *Notas*.
- `scripts/formato-bloqueo.mjs` (de task-01): `MOTIVOS_CANCELADA`, `parsearCancelada`, `lineasDeNotas`.
- Nadie importa `ESTADOS_TAREA` de `registrar.mjs`; `pruebas/comprobaciones/contrato-roles.mjs` (línea 11) tiene una lista local propia que no se toca (confirmado con `grep`).
- Base medida: `node --test pruebas/capa1/registrar.test.mjs` da `ℹ fail 0`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «5. Pieza 3 — Telemetría que da pistas»

## Decisiones ya tomadas
- `ESTADOS_TAREA` agrega `cancelada` al final; `POR_DE_ESTADO.cancelada = 'franco'` (inferido: solo Franco la pide, igual que `aprobada` y `hecha`).
- `ESQUEMA.cancelacion`: `fuente: 'notas'`, `requeridos: ['feature','tarea','sha']`, campo `motivo` con `valores: MOTIVOS_CANCELADA`. `claveDe('cancelacion')` devuelve `propios.motivo`.
- `extraer` emite una `cancelacion` por tarea (la primera versión donde aparece una línea `Cancelada:` válida gana), aunque el estado de esa versión no sea todavía `cancelada`. Una tarea `cancelada` sin línea válida no emite `cancelacion` (así el informe detecta «cancelada sin motivo»).
- `puertaDe` no cambia: pasar a `cancelada` no es una puerta.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: el estado, el evento y sus pruebas.
Fuera de alcance: el recorrido con `git log --follow` de `extraer` puede mezclar tareas muy parecidas (detección de renombre) y queda como pendiente fuera de F32; `informe.mjs`, `archivar.mjs` y `coherencia-features` (pendientes de la puerta 1), `definitions/REGISTRO.md`.

## Pasos
1. En `scripts/registrar.mjs` agrega `cancelada` a `ESTADOS_TAREA` y `POR_DE_ESTADO`, e importa `MOTIVOS_CANCELADA`, `parsearCancelada` y `lineasDeNotas`.
2. Agrega `ESQUEMA.cancelacion` y la rama de `claveDe`.
3. En `extraer` emite la `cancelacion` con una bandera `cancelacionVista` por tarea.
4. En `pruebas/capa1/registrar.test.mjs` reemplaza el cuerpo de la prueba (13) (misma posición, al final) por un escenario sin renombres detectables: los tres archivos de tarea tienen títulos y cuerpos claramente distintos entre sí (menos de 50 % de contenido en común) y se crean cada uno en su propio commit. task-01: `aprobada` en c1 y `cancelada` con `Cancelada: motivo=obsoleta` en c2; task-02: `cancelada` sin línea en c3; task-03: `cancelada` con `Cancelada: motivo=nuevo` en c4. Comprueba: tres `tarea_estado` con `a: 'cancelada'` y `por: 'franco'` (task-01 con `de: 'aprobada'`); una sola `cancelacion`, la de task-01 con `motivo: 'obsoleta'`; `validarEvento` sin errores; una segunda corrida y `--reconstruir` dejan `registro/eventos.jsonl` idéntico byte a byte.
5. Corre la verificación.

## Criterios de aceptación
1. Un estado `cancelada` ya no se cuenta como descartado; se comprueba con la prueba (13).
2. `cancelacion` lleva solo el motivo de la lista (sin línea o con motivo fuera de lista no se emite) y repetir o `--reconstruir` no duplica; se comprueba con la prueba (13).
3. Las pruebas existentes no cambian; se comprueba con el comando.

## Verificación
```
node --test pruebas/capa1/registrar.test.mjs pruebas/comprobaciones/informe.test.mjs 2>&1 | grep -E "^ℹ fail"
```
Esperado: `ℹ fail 0`.

## Evidencia
```
$ node --test pruebas/capa1/registrar.test.mjs pruebas/comprobaciones/informe.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0

$ node --test pruebas/capa1/registrar.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)|\(13\)"
✔ (13) Cancelada: en Notas da cancelacion con motivo de la lista; cancelada sin línea o con motivo fuera de lista no genera cancelacion; repetir y --reconstruir no duplican (557.173875ms)
ℹ tests 13
ℹ pass 13
ℹ fail 0
exit 0

$ bash pruebas/rapida.sh   (salida filtrada: líneas ℹ y títulos ✖ sin duplicar; la salida completa tiene 623 pruebas)
ℹ tests 623
ℹ pass 616
ℹ fail 7
✖ definitions/BACKLOG.md real cumple el formato
✖ los archivos reales cumplen la regla
✖ falla si un agente conserva la línea de modelos.json
✖ falla si falta la lectura acotada en constructor
✖ falla si falta la lectura acotada en ejecutar-tarea
✖ falla si WORKFLOW.md pasa de 30720 caracteres
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json
exit 1
```

## Notas
- Corrida 1 (historia): pasos 1 a 4 hechos; la verificación falló solo en la prueba (13) por `git log --follow` (detección de renombre entre tareas parecidas: task-02 recibió `cancelacion motivo=obsoleta` de task-01). Defecto preexistente en `extraer`, fuera de *Alcance*, no corregido.
Bloqueo: tipo=verificacion_x2; falta=-
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=falla; huecos=0; resultado=bloqueada; causa=verificacion_x2
- Corrida 2: pasos 1 a 4 sin cambios en `scripts/registrar.mjs` ni en las pruebas (1)-(12). Prueba (13) reescrita según el Paso 4 con el escenario validado por el planificador (`/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/fcf8d866-8f65-4f96-abd5-83def002b359/scratchpad/nueva13.mjs`, leído como guía; no es de `Evita leer:`, se declara). Tres tareas de contenido distinto, cada una en su commit: task-01 c1 `aprobada` y c2 `cancelada` con `motivo=obsoleta`; task-02 c3 `cancelada` sin línea; task-03 c4 `cancelada` con `motivo=nuevo`. Comprueba también que repetir y `--reconstruir` dejan el archivo idéntico.
- Hueco menor: el título de (13) se amplió con «repetir y --reconstruir no duplican» para cubrir el criterio 2.
- Verificación: 2 pasadas, ambas `ℹ fail 0`. Rápida (`pruebas/rapida.sh`): `ℹ tests 623`, `ℹ pass 616`, `ℹ fail 7`, con los 7 títulos conocidos y ninguno nuevo.
- Modo yolo: sin rama, sin `git switch`, sin commit. No se tocó `definitions/STATUS.md`.
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
