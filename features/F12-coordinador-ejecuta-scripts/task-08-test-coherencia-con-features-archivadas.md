# task-08 — Adaptar la prueba de coherencia a un repo con features archivadas
repo: Flucastr.AI   depende_de: —   estado: lista para revisión

## Descripción
Tras archivar F01–F10 en `features/completed/`, en `features/` solo queda la carpeta de F12 y la prueba «definitions/BACKLOG.md y features/F*/task-*.md reales son coherentes» falla porque exige al menos dos carpetas `F*`. Esta tarea quita ese mínimo y deja una prueba (positiva) de que un backlog con filas `hecha` sin carpeta sigue validando, más una negativa de que una carpeta sin fila sigue rechazándose.

## Contexto
- Repo: este, único. Node 25. Sin modelo.
- A leer (leídos por el planificador): `pruebas/comprobaciones/coherencia-features.mjs` (117 líneas; `validarCoherencia` recorre solo las carpetas recibidas, no las filas del backlog; una fila `hecha` sin carpeta NO produce error, por lo que no se espera cambio en el módulo) y `pruebas/comprobaciones/coherencia-features.test.mjs` (helpers `tarea()`, `muestraValida()`, `BACKLOG_VALIDO`; la prueba real está en la línea ~107 y su aserción de mínimo en la línea ~109).
- Estado actual (ejecutado): la suite completa da 244 pruebas, 243 pasan, 1 falla con «se esperaban al menos dos carpetas de feature y hay 1».
- Backlog real: filas F01–F10 `hecha`, F12 y F11 pendientes; solo existe `features/F12-coordinador-ejecuta-scripts/`.

## Decisiones ya tomadas
- La aserción pasa a `carpetas.length >= 1` con el mensaje «se esperaba al menos una carpeta de feature y hay N» (sigue detectando que se perdió `features/`).
- No se cambia `coherencia-features.mjs` salvo que la prueba positiva nueva falle; si falla, el menor cambio posible y se anota en *Notas*.
- Las pruebas nuevas usan datos en memoria (como `muestraValida()`), no el disco.

## Alcance / Fuera de alcance
Alcance: `coherencia-features.test.mjs` y, solo si hace falta, `coherencia-features.mjs`.
Fuera de alcance: otras reglas de coherencia (1–5), archivar o restaurar carpetas, `definitions/BACKLOG.md`, `STATUS.md`, el resto de la suite, commit.

## Pasos
1. Leer los dos archivos de `pruebas/comprobaciones/coherencia-features.*`.
2. Cambiar la aserción de la línea ~109 de `>= 2` a `>= 1` y ajustar el mensaje.
3. Añadir la prueba positiva «filas hecha sin carpeta (archivadas) siguen validando»: backlog con F01 `hecha` y F02 `pendiente`, y `features` con solo la carpeta de F02 con tareas válidas; `validarCoherencia` devuelve `[]`.
4. Añadir la prueba negativa «una carpeta cuyo ID no está en el backlog se rechaza aunque haya filas hecha archivadas»: mismo backlog y una carpeta `F03-...`; el error incluye `no tiene fila «F03»`.
5. Correr `node --test pruebas/comprobaciones/coherencia-features.test.mjs`.
6. Si la prueba positiva falla, ajustar `validarCoherencia` con el menor cambio y repetir el paso 5; si no, no tocar el módulo.
7. Correr la suite completa y pegar la salida en *Evidencia*.
8. Anotar en *Notas* si se tocó `coherencia-features.mjs` (esperado: no).

## Criterios de aceptación
1. La prueba real acepta 1 o más carpetas y pasa con el repo actual. Se comprueba con el primer comando de *Verificación*.
2. Existen la prueba positiva y la negativa y ambas pasan.
3. La suite completa queda sin fallos.
4. Se modifican como máximo 3 archivos (`.test.mjs`, `.mjs` opcional, esta tarea).

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --test pruebas/comprobaciones/coherencia-features.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs pruebas/capa1/*.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
git diff --stat
```
Salida esperada: primer comando `tests 11`, `pass 11`, `fail 0`; segundo `tests 246`, `pass 246`, `fail 0`; el `git diff --stat` no muestra `definitions/` ni otros archivos fuera de los permitidos por esta tarea (los cambios previos de F12 sin commit pueden aparecer).

## Evidencia

Comando 1 (`node --test pruebas/comprobaciones/coherencia-features.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"`):
```
ℹ tests 11
ℹ pass 11
ℹ fail 0
```

Comando 2 (`node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs pruebas/capa1/*.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"`):
```
ℹ tests 246
ℹ pass 246
ℹ fail 0
```

Comando 3 (`git diff --stat`):
```
 definitions/STATUS.md                              |  7 ++-
 .../task-06-prueba-modelo-pi.md                    |  2 +-
 .../task-07-documentar-permisos-y-cierre.md        | 66 +++++++++++++++++++++-
 pruebas/README.md                                  |  5 ++
 .../comprobaciones/coherencia-features.test.mjs    | 29 +++++++++-
 pruebas/permisos-ejecucion.md                      | 10 ++++
 6 files changed, 113 insertions(+), 6 deletions(-)
```
Los archivos distintos de `coherencia-features.test.mjs` ya estaban modificados antes de esta tarea (cambios de F12 sin commit al inicio de la sesión). Esta tarea solo tocó `coherencia-features.test.mjs` y su propia tarea. `coherencia-features.mjs` no aparece en el diff.

## Notas
- Aserción de mínimo cambiada a `carpetas.length >= 1`, con el mensaje «se esperaba al menos una carpeta de feature y hay N», según la decisión ya tomada.
- Añadidas dos pruebas: la positiva «filas hecha sin carpeta (archivadas) siguen validando» y la negativa «una carpeta cuyo ID no está en el backlog se rechaza aunque haya filas hecha archivadas». Ambas usan datos en memoria y pasan.
- La positiva pasó a la primera ejecución, así que no se tocó `coherencia-features.mjs` (confirmado: no aparece en el diff).
- Conteos: 11 pruebas en el test y 246 en la suite, tal como esperaba el planificador. No hubo huecos.
- Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
