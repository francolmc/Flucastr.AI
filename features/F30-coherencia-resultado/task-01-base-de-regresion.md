# task-01 — Base de regresión de los validadores sobre las tareas F24–F29
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Antes de tocar `formato-evidencia.mjs` se congela lo que hoy responden los tres validadores (`validarTarea`, `validarEvidencia`, `validarFuente`) sobre las 38 tareas de F24–F29. Una prueba compara esa respuesta con el congelado en cada corrida. Así las tareas siguientes de F30 demuestran que los formatos de F24–F29 siguen validando igual, incluidos los errores que algunas ya dan hoy.

## Contexto
- Tocar: `pruebas/comprobaciones/regresion-validadores.test.mjs`, `pruebas/fixtures/regresion-f24-f29.json`
- Firmas (confirmado por lectura): `validarTarea(texto)` en `scripts/formato-tarea.mjs`; `validarEvidencia(texto)` en `scripts/formato-evidencia.mjs`; `validarFuente(texto, leer)` en `scripts/formato-fuente.mjs` (`leer(ruta)` devuelve el texto o `null`). Las tres devuelven un arreglo de motivos; vacío = válida.
- Hoy (confirmado, ejecutado): `node scripts/validar-tarea.mjs features/F2[4-9]*/task-*.md` sale 0; `--evidencia` da motivos en F24 task-06 y task-07 y en F25 task-02; `--fuente` da motivos en F27 task-02, 03 y 04. Esos motivos van a la base tal cual: no se corrigen.
- Estilo de pruebas: `node:test` y `node:assert/strict`, raíz con `fileURLToPath(new URL('../../', import.meta.url))` (ver `pruebas/comprobaciones/contrato-constructor.test.mjs`, líneas 1–9). Las pruebas de `pruebas/comprobaciones/` las recoge `pruebas/rapida.sh` por glob.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «Riesgos»

## Decisiones ya tomadas
- Las tareas se buscan en `features/` y `features/completed/`, carpetas `^F2[4-9]-`, archivos `^task-\d{2}-.+\.md$`. La clave es `<carpeta>/<archivo>` sin el prefijo de la base, para que archivar no cambie la clave.
- Cada entrada del JSON es `{ "formato": [...], "evidencia": [...], "fuente": [...] }` con los motivos de cada validador. Claves ordenadas, sangría de 2 espacios, salto de línea final.
- Con la variable `FLUCASTR_GENERAR_BASE=1` la prueba escribe el JSON y no compara. Sin ella compara solo las claves del JSON cuyo archivo existe hoy (puede faltar si se archivó).
- `leer` de `validarFuente` lee `path.join(RAIZ, ruta)` y devuelve `null` si no existe.
- Control negativo en la misma prueba: una función `diferencias(base, actual)` (exportada dentro del archivo, no del repo) devuelve las claves distintas; un caso la prueba con una base alterada y exige una diferencia.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: la prueba y su JSON de base, generado con el código actual sin modificar.
Fuera de alcance: cambiar cualquier validador, corregir los motivos que hoy dan F24, F25 y F27, tocar `pruebas/rapida.sh`.

## Pasos
1. Crea `pruebas/comprobaciones/regresion-validadores.test.mjs` con la búsqueda de tareas, el cálculo de las tres respuestas y la comparación descritas arriba.
2. Añade el caso de control negativo (base alterada produce al menos una diferencia).
3. Genera la base: `FLUCASTR_GENERAR_BASE=1 node --test pruebas/comprobaciones/regresion-validadores.test.mjs` crea `pruebas/fixtures/regresion-f24-f29.json`.
4. Comprueba que el JSON tiene 38 claves y que incluye los motivos conocidos (por ejemplo, la clave de F25 task-02 con «n=2»).
5. Corre la prueba sin la variable: pasa.

## Criterios de aceptación
1. El JSON tiene 38 claves y no se editó a mano; se comprueba con el comando de conteo.
2. La prueba sin variable sale 0 con `ℹ fail 0`.
3. El control negativo detecta una base alterada; se comprueba porque su prueba pasa y afirma la diferencia.
4. `git diff --stat` no muestra cambios en `scripts/`.

## Verificación
```
node --test pruebas/comprobaciones/regresion-validadores.test.mjs
node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('pruebas/fixtures/regresion-f24-f29.json','utf8'))).length)"
git diff --stat -- scripts
```
Esperado: `ℹ fail 0`; la segunda línea imprime `38`; la tercera no imprime nada.

## Evidencia

```
Generación de la base (pasos 1–3; salida real de la última ejecución de la prueba, la base la escribe la prueba):

$ FLUCASTR_GENERAR_BASE=1 node --test pruebas/comprobaciones/regresion-validadores.test.mjs
✔ regresion: los validadores responden igual que la base de F24–F29
✔ control negativo: una base alterada produce al menos una diferencia
ℹ tests 2
ℹ pass 2
ℹ fail 0
exit 0

Verificación, pasada 1 (pasa):

$ node --test pruebas/comprobaciones/regresion-validadores.test.mjs
✔ regresion: los validadores responden igual que la base de F24–F29 (11.888542ms)
✔ control negativo: una base alterada produce al menos una diferencia (5.131916ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0

$ node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('pruebas/fixtures/regresion-f24-f29.json','utf8'))).length)"
38
exit 0

$ git diff --stat -- scripts
(sin salida)
exit 0

Verificación, pasada 2 (pasa; códigos de salida reales con `set -o pipefail`):

$ node --test pruebas/comprobaciones/regresion-validadores.test.mjs
✔ regresion: los validadores responden igual que la base de F24–F29 (10.340917ms)
✔ control negativo: una base alterada produce al menos una diferencia (4.927667ms)
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 60.380083
exit 0

$ node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('pruebas/fixtures/regresion-f24-f29.json','utf8'))).length)"
38
exit 0

$ git diff --stat -- scripts
(sin salida)
exit 0

Comprobación de la clave de F25 task-02 en la base (motivo conocido «n=2»):

$ node -e "const o=JSON.parse(require('fs').readFileSync('pruebas/fixtures/regresion-f24-f29.json','utf8')); const k=Object.keys(o).find(x=>x.includes('F25')&&x.includes('task-02')); console.log(k, JSON.stringify(o[k]))"
F25-evidencia-comprobable/task-02-cli-evidencia.md {"evidencia":["«Registro» dice n=2, pero «Notas» tiene 1 línea(s) «Registro:»."],"formato":[],"fuente":["Falta la viñeta «- Fuente:» en «## Contexto»."]}
exit 0

Criterios: (1) 38 claves, JSON generado por la prueba y no editado a mano: OK. (2) Prueba sin variable: `ℹ fail 0`: OK. (3) Control negativo pasa y afirma la diferencia: OK. (4) `git diff --stat -- scripts` sin salida: OK.
```

## Notas
- Huecos menores resueltos: (1) la clave es `<carpeta>/<archivo>` (p. ej. `F25-evidencia-comprobable/task-02-cli-evidencia.md`), según «Decisiones ya tomadas»; (2) el control negativo altera una copia de la respuesta actual en memoria, no el JSON del disco, para no depender del archivo; (3) `leer` devuelve `null` también si la ruta existe pero no es archivo.
- Verificación ejecutada en zsh: `PIPESTATUS` no existe; la pasada 2 se corrió con `set -o pipefail` para registrar códigos reales.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
