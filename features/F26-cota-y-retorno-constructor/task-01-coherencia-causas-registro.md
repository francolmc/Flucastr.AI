# task-01 — Coherencia de las causas nuevas en la línea Registro
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
F26 añade dos causas a la línea `Registro:` de una tarea `bloqueada`: `verificacion_x2` (cota de 2 pasadas completas de *Verificación*) y `parcial` (el `constructor` se detuvo con parte del trabajo hecho). `validarEvidencia` ya acepta `resultado=bloqueada` con cualquier `causa`; falta que las dos nuevas sean coherentes, para que el `coordinador` pueda confiar en el script (F25) también con ellas.

## Contexto
- Tocar: `scripts/formato-evidencia.mjs`, `pruebas/comprobaciones/formato-evidencia.test.mjs`
- `scripts/formato-evidencia.mjs`: bloque de la línea de registro, líneas 135-168. Ahí `const [, n, , , intentos, verif, , resultado, causa] = campos;` (línea 145) y la rama `else if (estado === 'bloqueada' && !['bloqueada', 'escalada'].includes(resultado))` (línea 163). `errores` es un arreglo de textos en español.
- `pruebas/comprobaciones/formato-evidencia.test.mjs`: helper `tarea({ estado, evidencia, notas, esperado })` (línea 25) y la constante `NOTAS_BASE` (línea 22); los casos de Registro empiezan en la línea 167.
- Se prueba con `node --test pruebas/comprobaciones/formato-evidencia.test.mjs`.

## Decisiones ya tomadas
- Dos reglas nuevas, solo cuando hay línea `Registro:` bien formada: (a) `causa=verificacion_x2` exige `resultado=bloqueada` e `intentos=2`; (b) `causa=parcial` exige `resultado=bloqueada`.
- Mensajes literales: `«Registro» incoherente: causa=verificacion_x2 exige resultado=bloqueada e intentos=2; hay resultado=<r> e intentos=<n>.` y `«Registro» incoherente: causa=parcial exige resultado=bloqueada; hay resultado=<r>.`
- No se valida `intentos` ≤ 2 en general (tareas ya `hecha` pueden tener más) ni la lista de causas.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: las dos reglas y sus pruebas.
Fuera de alcance: `skills/`, `agentes/`, `definitions/`, el resto de `scripts/`, cualquier validación de `intentos` en tareas `hecha`.

## Pasos
1. En `scripts/formato-evidencia.mjs`, tras el bloque `if (ESTADOS_TERMINADOS...) {...} else if (estado === 'bloqueada' ...) {...}`, añadir las reglas (a) y (b) con los mensajes literales.
2. En `pruebas/comprobaciones/formato-evidencia.test.mjs`, añadir cuatro casos con `tarea({ estado: 'bloqueada', notas })` filtrando los motivos que contienen `Registro`: positivo `resultado=bloqueada; causa=verificacion_x2` con `intentos=2`; positivo `causa=parcial` con `resultado=bloqueada`; negativo `verificacion_x2` con `intentos=1` (error que cita `intentos=2`); negativo `parcial` con `resultado=escalada` (error que cita `causa=parcial`).
3. Correr la verificación.

## Criterios de aceptación
1. Un Registro `bloqueada`/`verificacion_x2`/`intentos=2` no produce motivos de Registro. Se comprueba en la prueba positiva.
2. El mismo con `intentos=1` produce el motivo. Control negativo en la prueba.
3. `causa=parcial` con `resultado=escalada` produce el motivo. Control negativo.
4. Las pruebas previas siguen pasando y la rápida no suma fallos.

## Verificación
```
node --test pruebas/comprobaciones/formato-evidencia.test.mjs
bash pruebas/rapida.sh
```
Esperado: el primero termina con `ℹ fail 0`; el segundo deja exactamente `ℹ fail 7` (fallos ajenos conocidos: el BACKLOG real y 6 de higiene de contexto por `WORKFLOW.md` > 30720).

## Evidencia

```
$ node --test pruebas/comprobaciones/formato-evidencia.test.mjs
ℹ tests 18
ℹ suites 0
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 78.806125
exit 0
```

```
$ bash pruebas/rapida.sh
ℹ tests 421
ℹ suites 0
ℹ pass 414
ℹ fail 7
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 15070.250875

✖ failing tests:

✖ definitions/BACKLOG.md real cumple el formato (2.061083ms)
✖ los archivos reales cumplen la regla (5.611084ms)
✖ falla si un agente conserva la línea de modelos.json (0.970166ms)
✖ falla si falta la lectura acotada en constructor (0.472292ms)
✖ falla si falta la lectura acotada en ejecutar-tarea (1.463167ms)
✖ falla si WORKFLOW.md pasa de 30720 caracteres (0.882417ms)
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json (1.013166ms)
exit 1
```

Ambas verificaciones: `ℹ fail 0` en el primer comando y `ℹ fail 7` en el segundo (fallos ajenos conocidos).

## Notas
Añadidas las reglas (a) y (b) tras el bloque de Registro en `scripts/formato-evidencia.mjs`, con los mensajes literales; cuatro casos nuevos en `pruebas/comprobaciones/formato-evidencia.test.mjs`.
Autocomprobación `--evidencia`: `OK: 1 tarea(s) con evidencia completa`, exit 0.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
