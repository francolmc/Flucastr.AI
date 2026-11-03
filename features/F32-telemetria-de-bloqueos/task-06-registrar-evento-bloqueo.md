# task-06 — `registrar.mjs`: evento `bloqueo` desde la línea `Bloqueo:`
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
`registrar.mjs` solo lee `Registro:` de *Notas*. Esta tarea agrega el evento `bloqueo` (tipo y qué falta, de vocabulario cerrado) para que el informe pueda contar los bloqueos por causa. Sigue la regla de privacidad: ningún texto libre llega al log.

## Contexto
- Tocar: `scripts/registrar.mjs`, `pruebas/capa1/registrar.test.mjs`
- Requiere: ninguno
- `scripts/registrar.mjs` (confirmado): `ESQUEMA` (línea ≈ 84) con `ejecucion` como modelo de evento de fuente `notas`; `claveDe` (≈ 270); `registrosDeNotas` (≈ 200) y el bucle de `extraer` que usa `ejecucionesVistas` (≈ 330–355): el primer commit donde aparece una línea con ese `n` gana.
- `scripts/formato-bloqueo.mjs` (de task-01): `TIPOS_BLOQUEO`, `parsearBloqueo`, `lineasDeNotas`. De task-01 lee solo las *Notas*.
- `pruebas/capa1/registrar.test.mjs` (confirmado): helpers `nuevoRepo`, `escribir`, `commit`, `correr`, `leerEventos`, `tareaConRegistros(notas)`, `RUTA_TAREA`; la prueba (3) comprueba que los canarios no llegan al log. Corre en ≈ 4 s.
- Base medida: `node --test pruebas/capa1/registrar.test.mjs` da `ℹ fail 0`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «5. Pieza 3 — Telemetría que da pistas»

## Decisiones ya tomadas
- Entrada nueva `ESQUEMA.bloqueo`: `fuente: 'notas'`, `requeridos: ['feature','tarea','sha']`, campos `n` (entero, rango [1,99]: posición de la línea `Bloqueo:` entre las de *Notas*, desde 1), `tipo` (`valores: TIPOS_BLOQUEO`) y `falta` (`patron: RE_FALTA`, con `RE_FALTA = /^(-|[a-z0-9:@.]{1,40}(,[a-z0-9:@.]{1,40}){0,7})$/`).
- `extraer` emite un `bloqueo` por línea que pase `parsearBloqueo`, con `falta` igual a `falta.join(',')` o `-`; las inválidas se omiten sin contarlas en `invalidas` (esa cuenta es solo de `Registro:`). Misma regla que `ejecucion`: el primer commit donde aparece ese `n` gana (`bloqueosVistos`). `claveDe('bloqueo')` devuelve `String(n)`.
- No se cambia `registrosDeNotas`, `RE_REGISTRO` ni el texto de salida de la CLI.
- `definitions/REGISTRO.md` no se toca (pendiente de la puerta 1).

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: el evento `bloqueo` y sus pruebas.
Fuera de alcance: `cancelada` y `cancelacion` (task-07), `informe.mjs`, `definitions/REGISTRO.md`.

## Pasos
1. En `scripts/registrar.mjs` importa de `./formato-bloqueo.mjs`, agrega `RE_FALTA` y `ESQUEMA.bloqueo`, y la rama de `claveDe`.
2. En `extraer`, dentro del bucle por versión de la tarea, emite los `bloqueo` con `construir('bloqueo', …)` y `bloqueosVistos`.
3. En `pruebas/capa1/registrar.test.mjs` agrega la prueba (12): una tarea con `Bloqueo: tipo=entorno; falta=docker,puerto:55432` y otra línea `Bloqueo: tipo=alcance; falta=-` da dos `bloqueo` con `n` 1 y 2 y `validarEvento` sin errores; una tercera `Bloqueo: tipo=entorno; falta=docker; nota=sk-CANARIO-B` y una con tipo `nuevo` no generan evento y el canario no aparece en `eventos.jsonl`; repetir la corrida no duplica y `--reconstruir` reproduce el contenido.
4. Corre la verificación.

## Criterios de aceptación
1. `validarEvento` acepta un `bloqueo` válido y rechaza un `tipo` fuera de lista; se comprueba con la prueba (12).
2. Las líneas inválidas o con claves extra no generan evento y el canario no sale; se comprueba con la prueba (12).
3. Las pruebas existentes de `registrar` no cambian; se comprueba con el comando.

## Verificación
```
node --test pruebas/capa1/registrar.test.mjs 2>&1 | grep -E "^ℹ fail"
```
Esperado: `ℹ fail 0`.

## Evidencia
```
$ node --test pruebas/capa1/registrar.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0
```

Prueba (12) nueva en `pruebas/capa1/registrar.test.mjs` (salida de `node --test pruebas/capa1/registrar.test.mjs`, cola):
```
✔ (11) coherencia: Registro con verificacion distinta de pasa y resultado=lista no genera evento; --reconstruir igual (331.007417ms)
✔ (10) argumentos inválidos: opción repetida, opción desconocida y argumento suelto terminan en 1 sin crear registro/ (195.481416ms)
✔ (9) canarios en el resto de Notas y una clave extra (titulo=) no llegan a eventos.jsonl (178.387917ms)
✔ (12) Bloqueo: en Notas da un bloqueo por n válido; tipo fuera de lista o texto extra no generan evento; repetir y --reconstruir no duplican (357.059833ms)
ℹ tests 12
ℹ pass 12
ℹ fail 0
```

```
$ bash pruebas/rapida.sh
ℹ tests 623
ℹ pass 616
ℹ fail 7
✖ definitions/BACKLOG.md real cumple el formato (4.583666ms)
✖ los archivos reales cumplen la regla (2.644875ms)
✖ falla si un agente conserva la línea de modelos.json (1.27725ms)
✖ falla si falta la lectura acotada en constructor (1.038458ms)
✖ falla si falta la lectura acotada en ejecutar-tarea (0.9065ms)
✖ falla si WORKFLOW.md pasa de 30720 caracteres (0.968708ms)
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json (0.951166ms)
[…recortado: 8 líneas…] (repetición de los 7 ✖ en «✖ failing tests:»; ningún ✖ nuevo)
exit 1
```

## Notas
- Huecos menores resueltos: (1) `n` es la posición de la línea de bloqueo entre todas las de *Notas* (inválidas incluidas, desde 1), así una línea inválida no desplaza el n de las siguientes. (2) `falta` vacía (tipo distinto de entorno) se guarda como `-`, forma aceptada por RE_FALTA.
- Verificación: se corrió dos veces con el mismo resultado (`ℹ fail 0`); la segunda para capturar la salida y el exit. La rápida da la base `ℹ tests 623`, `ℹ pass 616`, `ℹ fail 7`, con solo los 7 títulos conocidos. Pruebas (1)-(11) sin cambios; `RE_REGISTRO` intacto.
- Modo yolo: sin rama, sin `git switch`, sin commit. `definitions/REGISTRO.md` e `informe.mjs` no se tocaron.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
