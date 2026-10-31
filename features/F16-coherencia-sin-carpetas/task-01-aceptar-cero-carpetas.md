# task-01 — coherencia-features acepta features/ sin carpetas activas
repo: Flucastr.AI   depende_de: —   estado: lista para revisión

## Descripción
La última prueba de `coherencia-features.test.mjs` exige `carpetas.length >= 1`. Cuando todo está archivado en `features/completed/` (estado normal, `definitions/WORKFLOW.md` §5 y §10) esa prueba falla aunque no haya incoherencia. Esta tarea quita ese assert, deja que el caso de 0 carpetas valide el backlog y pase, y agrega pruebas que cubren 0 carpetas y el caso con carpetas sobre fixtures temporales.

## Contexto
- A tocar (único archivo): `pruebas/comprobaciones/coherencia-features.test.mjs`. No se toca `coherencia-features.mjs`: `validarCoherencia({ backlog, features: [] })` ya devuelve `[]` (confirmado en la planificación con el `BACKLOG.md` real).
- Hoy la última prueba («definitions/BACKLOG.md y features/F*/task-*.md reales son coherentes», ~l.130) lee `features/` con `fs.readdirSync`, filtra `/^F\d{2}-/`, hace `assert.ok(carpetas.length >= 1, …)` y valida. `features/` real hoy tiene `completed/` y `F15-actualizar-readme` (más la nueva `F16-…`).
- El archivo ya importa `fs`, `assert`, `fileURLToPath`, y define `RAIZ`, `BACKLOG_VALIDO`, `tarea()` y `muestraValida()`.
- Se ejecuta con `node --test pruebas/comprobaciones/coherencia-features.test.mjs` (confirmado: 11 pruebas pasan antes del cambio).
- Fixtures temporales: `pruebas/.temporales/` ya se usa para temporales de las pruebas (`pruebas/rapida.sh`) y está ignorado por git (`pruebas/.gitignore` contiene `.temporales/`, confirmado con `git check-ignore`).

## Decisiones ya tomadas
- No se renombra, mueve ni borra nada de `features/` real; los fixtures viven solo bajo `pruebas/.temporales/`.
- Se extrae un helper local `leerFeatures(dirFeatures)` (mismo código que hoy: carpetas `/^F\d{2}-/`, tareas `task-*.md`) y lo usan la prueba real y las nuevas.
- Prueba real: se quita el assert de `>= 1`; el resto queda igual (lee `RAIZ + 'features'` y `definitions/BACKLOG.md`).
- Nuevas pruebas con directorio creado por `fs.mkdirSync(`${RAIZ}pruebas/.temporales`, { recursive: true })` y `fs.mkdtempSync(`${RAIZ}pruebas/.temporales/coherencia-`)`, limpiado con `fs.rmSync(dir, { recursive: true, force: true })` en `finally`.
- Nueva prueba A «0 carpetas activas»: el fixture contiene solo `completed/F01-base/` (con una `task-01-x.md`, que el helper ignora por estar en `completed/`) y se valida con `BACKLOG_VALIDO`; esperado `[]`.
- Nueva prueba B «con carpetas sigue validando»: el fixture contiene `F02-planificar-y-coordinar/` con `task-01` y `task-02` tomados de `tarea()`; con `BACKLOG_VALIDO` esperado `[]`; con el mismo fixture y backlog donde `| F02 |` pasa a `| F09 |` debe dar un error que incluya `no tiene fila «F02»`.
- Mensaje/nombres de prueba en español.

## Alcance / Fuera de alcance
Alcance: quitar el assert, extraer `leerFeatures`, agregar las pruebas A y B.
Fuera de alcance: `coherencia-features.mjs`, `definitions/` (incluido `BACKLOG.md`), `STATUS.md`, `.gitignore`, otros tests, mover o crear carpetas en `features/` real.

## Pasos
1. En `coherencia-features.test.mjs`, agregar la función `leerFeatures(dirFeatures)` que devuelve el arreglo `{ carpeta, tareas }` con la lógica actual. Resultado: función definida y usada por la prueba real.
2. Reescribir la prueba real para usar `leerFeatures(`${RAIZ}features`)` y eliminar la línea `assert.ok(carpetas.length >= 1, …)`. Resultado: ya no hay referencia a `>= 1`.
3. Agregar la prueba A (0 carpetas, fixture con solo `completed/`). Resultado: pasa con `[]`.
4. Agregar la prueba B (carpetas presentes: valida OK y detecta ID ausente del backlog). Resultado: pasa.
5. Correr la verificación y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. El archivo ya no contiene `>= 1` ni «al menos una carpeta» (`grep -n ">= 1\|al menos una" pruebas/comprobaciones/coherencia-features.test.mjs` sin salida).
2. La prueba A pasa con 0 carpetas activas (`node --test` muestra su ✔).
3. La prueba B pasa: con carpetas valida `[]` y rechaza una carpeta sin fila en el backlog.
4. Las 11 pruebas previas siguen pasando y la prueba real pasa con `features/` real.
5. Tras correr, `pruebas/.temporales/` no conserva carpetas `coherencia-*` y `git status --short features/` no muestra cambios en carpetas existentes de `features/` salvo esta tarea.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --test pruebas/comprobaciones/coherencia-features.test.mjs
```
Esperado: `fail 0`, 13 pruebas (11 previas + 2 nuevas).
```
grep -n ">= 1\|al menos una" pruebas/comprobaciones/coherencia-features.test.mjs
ls pruebas/.temporales | grep coherencia-
```
Esperado: ambos sin salida.

## Evidencia

Rama creada: `git branch --show-current` → `chore/F16-coherencia-sin-carpetas` (creada con `git switch -c` desde `main`; sin commit).

Antes del cambio (`node --test pruebas/comprobaciones/coherencia-features.test.mjs`): `tests 11`, `pass 11`, `fail 0`.

Verificación (comando y salida real):

```
$ node --test pruebas/comprobaciones/coherencia-features.test.mjs
✔ muestra válida: no hay errores (4.899083ms)
✔ regla 1: ID de carpeta ausente del backlog se rechaza (0.2455ms)
✔ regla 2: número de tarea repetido se rechaza (0.182583ms)
✔ regla 2: hueco en la numeración se rechaza (0.087084ms)
✔ regla 2: primera línea con número distinto al del archivo se rechaza (0.088583ms)
✔ regla 3: dependencia hacia una tarea de número mayor se rechaza (0.0885ms)
✔ regla 4: feature hecha con una tarea sin hacer se rechaza (0.585959ms)
✔ regla 5: tarea bloqueada en una feature hecha se rechaza (0.117834ms)
✔ filas hecha sin carpeta (archivadas) siguen validando (0.1085ms)
✔ una carpeta cuyo ID no está en el backlog se rechaza aunque haya filas hecha archivadas (0.121583ms)
✔ sin carpetas activas (todo en completed/) valida el backlog y pasa (4.562416ms)
✔ con carpetas activas valida, y rechaza una carpeta sin fila en el backlog (0.867958ms)
✔ definitions/BACKLOG.md y features/F*/task-*.md reales son coherentes (1.697625ms)
ℹ tests 13
ℹ suites 0
ℹ pass 13
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 107.645709
exit=0

$ grep -n ">= 1\|al menos una" pruebas/comprobaciones/coherencia-features.test.mjs
(sin salida; grep_exit=1)

$ ls pruebas/.temporales | grep coherencia-
(sin salida; ls_grep_exit=1)

$ git status --short features/
?? features/F16-coherencia-sin-carpetas/
(solo la carpeta de esta feature, que ya estaba sin trackear al empezar; no hay cambios en carpetas existentes de features/)
```

Criterios de aceptación:
1. Sin `>= 1` ni «al menos una» en el archivo: cumple (grep sin salida).
2. Prueba A «sin carpetas activas» pasa con `[]`: cumple (✔).
3. Prueba B «con carpetas activas» valida `[]` y rechaza `F02` ausente del backlog: cumple (✔).
4. Las 11 pruebas previas pasan y la prueba real pasa con `features/` real: cumple (11 previas ✔ y la real ✔ en la salida).
5. Sin carpetas `coherencia-*` en `pruebas/.temporales/` tras correr (los fixtures se borran en `finally`); sin cambios en carpetas existentes de `features/`: cumple.

## Notas

- Huecos menores: ninguno que requiriera decisión. Se usó la constante local `DIR_TEMPORALES` (`${RAIZ}pruebas/.temporales`) para no repetir la ruta en las dos pruebas nuevas.
- Archivos tocados: `pruebas/comprobaciones/coherencia-features.test.mjs` (único archivo de código) y esta tarea (solo *Evidencia*, *Notas* y `estado`). No se tocó `definitions/` (incluidos `BACKLOG.md` y `STATUS.md`) ni el resto del árbol con cambios previos.
- Sin commit, push, PR, merge ni despliegue.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
