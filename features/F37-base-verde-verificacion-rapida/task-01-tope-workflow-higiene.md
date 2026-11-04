# task-01 — Subir el tope de WORKFLOW.md en la prueba de higiene
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
`pruebas/comprobaciones/higiene-contexto.test.mjs` limita `definitions/WORKFLOW.md` a 30 720 caracteres y hoy el archivo mide 31 793, así que fallan sus 6 pruebas: la de «los archivos reales» por el tamaño, y las otras 5 porque esperan exactamente 1 error y reciben 2 (el del tamaño más el simulado). El control negativo «falla si WORKFLOW.md pasa de 30720 caracteres» además no puede armarse (`'x'.repeat` con cuenta negativa lanza `RangeError: Invalid count value`). Decisión de Franco: subir el tope a 32 000 sin tocar `WORKFLOW.md`, y dejar el control negativo vivo.

## Contexto
- Tocar: `pruebas/comprobaciones/higiene-contexto.test.mjs`
- Leer y tocar solo `pruebas/comprobaciones/higiene-contexto.test.mjs`. Líneas relevantes: 17-18 (`// Tope de caracteres…` y `const TOPE_WORKFLOW = 30720;`), 102-109 (control negativo), 29 (`const caracteres = (texto) => [...texto].length;`).
- Línea 105-106 actual: `r.workflow += 'x'.repeat(TOPE_WORKFLOW - caracteres(r.workflow) + 1);`
- Línea 102 actual: `test('falla si WORKFLOW.md pasa de 30720 caracteres', () => {` y 108: `assert.match(errores[0], /30720/);`
- `definitions/CONTEXTO.md:113` y `scripts/archivar.mjs:25` también mencionan 30 720 pero son otro tope (aviso informativo) y no se tocan.
- Estado inicial confirmado: `node --test pruebas/comprobaciones/higiene-contexto.test.mjs` da 6 fallos y 0 aprobadas.
- Se ejecuta con `node` (sin dependencias).
- Fuente: ninguna
- Requiere: ninguno

## Decisiones ya tomadas
- Nuevo tope: `32000` (caracteres, medido igual que hoy con `caracteres()`).
- El control negativo usa el tope como referencia, no el tamaño real: añade `Math.max(0, TOPE_WORKFLOW - caracteres(r.workflow)) + 1` letras `x`. Así siempre queda en tope + 1 o más y falla con exactamente 1 error, crezca o encoja `WORKFLOW.md`.
- Los textos de prueba y la regex usan el valor nuevo: título `falla si WORKFLOW.md pasa de 32000 caracteres`, regex `/32000/`.
- No se toca `definitions/WORKFLOW.md` ni ningún otro archivo.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: constante, título, relleno y regex del control negativo en la prueba de higiene.
Fuera de alcance: recortar `WORKFLOW.md` o `ARCHITECTURE.md`, cambiar los demás topes (`archivar.mjs`, `CONTEXTO.md`), tocar `formato-tarea.test.mjs` (task-02) y la duración de la suite.

## Pasos
1. En `pruebas/comprobaciones/higiene-contexto.test.mjs` línea 18 cambia `30720` por `32000`.
2. En el control negativo (líneas 102-109) cambia el título a `falla si WORKFLOW.md pasa de 32000 caracteres` y la regex a `/32000/`.
3. Reemplaza la línea del relleno por `r.workflow += 'x'.repeat(Math.max(0, TOPE_WORKFLOW - caracteres(r.workflow)) + 1);` y ajusta el comentario previo a «relleno hasta tope + 1, sin depender del tamaño real».
4. Ejecuta la verificación.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/higiene-contexto.test.mjs` termina en 0 con 6 pruebas aprobadas y 0 fallos.
2. El control negativo sigue vivo: con `TOPE_WORKFLOW` temporalmente en `31000` (sin guardar) la prueba «los archivos reales cumplen la regla» falla; se comprueba con el comando de *Verificación* 2.
3. `git diff --stat -- pruebas/` lista solo `pruebas/comprobaciones/higiene-contexto.test.mjs` (`definitions/STATUS.md` y `definitions/BACKLOG.md` cambian por diseño durante la feature y no cuentan).

## Verificación
Comando 1:
```
node --test pruebas/comprobaciones/higiene-contexto.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'
```
Esperado: `ℹ pass 6` y `ℹ fail 0`.

Comando 2:
```
sed 's/= 32000;/= 31000;/' pruebas/comprobaciones/higiene-contexto.test.mjs > pruebas/comprobaciones/higiene-tmp.test.mjs && node --test pruebas/comprobaciones/higiene-tmp.test.mjs 2>&1 | grep -E '^ℹ fail'; rm -f pruebas/comprobaciones/higiene-tmp.test.mjs
```
Esperado: al menos un fallo (ℹ fail 1 o más) (el real supera 31000) y la copia queda borrada.

Comando 3:
```
git diff --stat -- pruebas/
```
Esperado: solo `pruebas/comprobaciones/higiene-contexto.test.mjs`.

## Evidencia

```
$ node --test pruebas/comprobaciones/higiene-contexto.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'
ℹ pass 6
ℹ fail 0
exit 0
```

```
$ sed 's/= 32000;/= 31000;/' pruebas/comprobaciones/higiene-contexto.test.mjs > pruebas/comprobaciones/higiene-tmp.test.mjs && node --test pruebas/comprobaciones/higiene-tmp.test.mjs 2>&1 | grep -E '^ℹ fail'; rm -f pruebas/comprobaciones/higiene-tmp.test.mjs
ℹ fail 6
exit 1
```

```
$ git diff --stat -- pruebas/
 pruebas/comprobaciones/higiene-contexto.test.mjs | 10 +++++-----
 1 file changed, 5 insertions(+), 5 deletions(-)
exit 0
```

## Notas
Bloqueo: tipo=entorno; falta=ninguno
Causa: el comando `node ~/.flucastr-ai/entorno.mjs` exige `ninguno` y la sonda compara la versión por prefijo. El `node` del sistema es v25.8.1 (`/opt/homebrew/bin/node` y `fnm`), y no hay Node 18 instalado (Homebrew solo tiene `node` y `node@26`). No se instaló nada ni se tocó la prueba. Para desbloquear: instalar Node 18 o corregir el requisito de la tarea si Franco prefiere Node 25.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=0; verificacion=falla; huecos=0; resultado=bloqueada; causa=otra
Ejecución n=2: entorno ok; rama `chore/F37-base-verde-verificacion-rapida` creada con `git switch -c` desde `main`. Cambios: tope 30720 a 32000, título y regex del control negativo, relleno `Math.max(0, TOPE - caracteres) + 1`. Criterios 1 y 2 cumplidos (6 pasan; con 31000 fallan 6, el control vivo).
Criterio 3 no cumplido: `git diff --stat -- . ':!features'` también lista `definitions/BACKLOG.md` y `definitions/STATUS.md`, que ya estaban modificados antes de empezar (aparecen en el git status inicial). No los toqué porque no los modifica esta tarea y no hago checkout ni reset. Franco decide cómo cerrar este punto.
Bloqueo: tipo=otra; falta=-
Registro: n=2; herramienta=claude-code; modo=normal; intentos=1; verificacion=falla; huecos=0; resultado=bloqueada; causa=parcial
Ejecución n=3 (reintento tras PARCIAL, decisión de Franco): el criterio 3 se verifica con `git diff --stat -- pruebas/`, que lista solo `pruebas/comprobaciones/higiene-contexto.test.mjs`; los diffs de `definitions/BACKLOG.md` y `definitions/STATUS.md` no cuentan porque los escribe el coordinador y existían antes de la tarea. Código no tocado. Criterios 1, 2 y 3 cumplidos.
Bloqueo: tipo=otra; falta=-
Registro: n=3; herramienta=claude-code; modo=normal; intentos=2; verificacion=pasa; huecos=0; resultado=bloqueada; causa=otra
Ejecución n=4: se usó la decisión de Franco sobre el criterio 3 (`git diff --stat -- pruebas/` lista solo `pruebas/comprobaciones/higiene-contexto.test.mjs`; BACKLOG y STATUS no cuentan). Verificación completa vuelta a correr con los comandos actuales; la salida coincide con la Evidencia. Bloqueos de Notas dejados solo con `tipo` y `falta`.
Registro: n=4; herramienta=claude-code; modo=normal; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
