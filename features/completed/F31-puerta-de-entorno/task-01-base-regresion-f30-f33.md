# task-01 — Ampliar la base de regresión de validadores a F30 y F33
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
La prueba de regresión solo cubre las 38 tareas de F24–F29. F31 cambia `scripts/formato-tarea.mjs` y los lanzadores, así que antes de tocar nada se congela también la respuesta de los tres validadores sobre las 11 tareas de F30 y F33. Esta tarea no cambia ningún validador: solo amplía la base con claves nuevas.

## Contexto
- Tocar: `pruebas/comprobaciones/regresion-validadores.test.mjs`, `pruebas/fixtures/regresion-f24-f29.json`
- Requiere: ninguno
- `regresion-validadores.test.mjs` (confirmado): la constante `CARPETA_FEATURE = /^F2[4-9]-/` (línea 20) filtra las carpetas de `features/` y `features/completed/`; el test «regresion: los validadores responden igual…» escribe la base si `FLUCASTR_GENERAR_BASE=1`; las claves son `<carpeta>/<archivo>`, así que archivar una feature no las cambia.
- La base hoy tiene 38 claves (confirmado con `node -e`); F30 tiene 5 tareas y F33 tiene 6.
- Los tests corren con `node --test` (Node v25.8.1); no hay dependencias externas.
- Fuente: ninguna

## Decisiones ya tomadas
- La regex pasa a `/^F(2[4-9]|3[03])-/`. El nombre del archivo de la base y el título del test no cambian.
- La base se genera una sola vez, con los validadores sin tocar. Antes de generar, el test actual debe pasar con `ℹ fail 0`; si falla, la tarea queda bloqueada (`BLOQUEO: rol=arquitecto`).
- Las 38 claves anteriores no deben cambiar: el diff del JSON solo agrega líneas.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: la regex y la base JSON.
Fuera de alcance: cualquier validador de `scripts/`, los casos de borde del mismo archivo de prueba, tareas de F31 (la regex no las incluye a propósito) y `definitions/`.

## Pasos
1. Corre `node --test pruebas/comprobaciones/regresion-validadores.test.mjs`; debe dar `ℹ fail 0`.
2. En `regresion-validadores.test.mjs` cambia `CARPETA_FEATURE` por `/^F(2[4-9]|3[03])-/` y actualiza el comentario de la línea 13 para decir «F24–F29, F30 y F33».
3. Corre `FLUCASTR_GENERAR_BASE=1 node --test pruebas/comprobaciones/regresion-validadores.test.mjs` para reescribir la base.
4. Comprueba que el JSON solo ganó claves (el conteo de líneas borradas del diff es 0) y que ahora tiene 49 claves.

## Criterios de aceptación
1. La base tiene 49 claves; se comprueba con `node -e`.
2. El diff de la base no borra líneas; se comprueba con `git diff --numstat` (la segunda columna es `0`, o no hay salida si ya está confirmada).
3. La prueba de regresión pasa sin la variable de generación; se comprueba con `node --test`.

## Verificación
```
node --test pruebas/comprobaciones/regresion-validadores.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('pruebas/fixtures/regresion-f24-f29.json'))).length)"
git diff --numstat pruebas/fixtures/regresion-f24-f29.json
```
Esperado: `ℹ fail 0` y `ℹ pass` igual a `ℹ tests`; `49`; una línea que termina en `0	pruebas/fixtures/regresion-f24-f29.json` (0 líneas borradas; o ninguna salida).

## Evidencia

```
$ node --test pruebas/comprobaciones/regresion-validadores.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 4
ℹ pass 4
ℹ fail 0
exit 0
```

```
$ node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('pruebas/fixtures/regresion-f24-f29.json'))).length)"
49
exit 0
```

```
$ git diff --numstat pruebas/fixtures/regresion-f24-f29.json
55	0	pruebas/fixtures/regresion-f24-f29.json
exit 0
```

## Notas
- Prueba previa a los cambios (paso 1): `ℹ tests 4`, `ℹ pass 4`, `ℹ fail 0`.
- Hueco menor (corrida 1): el paso 2 cita «la línea 13», que es `RAIZ`; el comentario de F24–F29 está en la línea 10 y se actualizó ahí. Decisión: no tocar la línea 13.
- Base generada una vez con `FLUCASTR_GENERAR_BASE=1` (paso 3), validadores sin tocar. Las 38 claves previas no cambiaron (0 líneas borradas) y las 11 nuevas suman 55 líneas.
- Corrida 1: el validador de evidencia salió 1 por el marcador `<n>` de *Esperado*; el planificador lo corrigió a `0	pruebas/fixtures/regresion-f24-f29.json`.
- Corrida 2 (modo yolo, sin regenerar la base): los tres comandos de *Verificación* pasan; *Evidencia* reemplazada por la salida real.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=bloqueada; causa=otra
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
