# task-02 — README: logo, estado y la idea del proyecto
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
La cabecera del `README.md` tiene un estado desactualizado («MVP en construcción (2026-10-29)… F01 a F03…») y no explica qué es el kit en pocas líneas. Esta tarea pone el logo, un estado vigente, una sección «La idea» que cuenta qué es y qué no es el kit, y agrega `assets/` al árbol de `## Estructura`.

## Contexto
- A tocar (único archivo): `README.md` (leído completo; 158 líneas). Líneas 1–5: título, frase, estado. `## Para qué existe` (línea 7) y `## Reglas` quedan como están. `## Estructura` (línea 30) tiene el árbol en el primer bloque de código; la raíz lista `agentes/`, `skills/`, `scripts/`, `pruebas/`, etc.
- Comprobación que exige el README: `pruebas/comprobaciones/readme-estructura.mjs` (leído) toma el **primer bloque de código tras la línea exacta `## Estructura`** y exige que `agentes/` y `skills/` listen, con el prefijo `│   ├── ` / `│   └── `, exactamente los archivos de `agentes/` y las carpetas de `skills/`. Una línea nueva `├── assets/` en la raíz del árbol no afecta esa regla. El test real que lee el README es `pruebas/comprobaciones/readme-estructura.test.mjs` (línea 63).
- Fuentes de la idea (leídas): `definitions/PROJECT.md` línea 9 (kit personal para Claude Code y Pi) y `definitions/WORKFLOW.md` §1–§2 (coordinador único, cuatro puertas, roles).
- `features/completed/` existe; el estado de F01–F14 es `hecha` en `definitions/BACKLOG.md`.

## Decisiones ya tomadas
- Líneas 1–5 pasan a ser exactamente (la línea de estado cita solo hechos verificados):
```
<p align="center"><img src="assets/logo.svg" alt="Logo de Flucastr.AI" width="64" height="64"></p>

# Flucastr.AI

Mi forma de construir productos con agentes de IA, sin enredarme en la herramienta.

> Estado: en uso (2026-10-30). El kit completo (arquitecto, coordinador, planificador y constructor, con instalador local y remoto) está hecho; el avance real está en `definitions/BACKLOG.md`.
```
- Nueva sección `## La idea`, justo antes de `## Para qué existe`, con este texto exacto:
```
## La idea

Flucastr.AI es un kit personal de agentes, skills e instaladores para trabajar con IA en Claude Code y Pi. Yo abro un solo agente, el `coordinador`, y él reparte el trabajo entre un `arquitecto`, un `planificador` y un `constructor`. Todo pasa por archivos que puedo leer y por cuatro puertas donde yo apruebo antes de seguir. Los agentes no hacen commit, push, PR ni despliegue: eso es mío.

No es un servicio ni una aplicación: es texto (agentes y skills), unos scripts y las pruebas que comprueban que el kit hace lo que dice.
```
- En el árbol de `## Estructura`, agregar la línea `├── assets/         # logo del README` justo después de la línea `├── README.md` (misma alineación de comentarios que las líneas vecinas).
- Después del bloque de código del árbol (antes de `## Instalación`) agregar una línea en blanco y este párrafo: `Una comprobación (\`pruebas/comprobaciones/readme-estructura.mjs\`) falla si el árbol de agentes y skills de este bloque no coincide con \`agentes/\` y \`skills/\`.` (con comillas invertidas simples, sin barras invertidas).
- No se toca nada más del README (la limpieza de la frase de F04 en `## Flujo` es de `task-03`).

## Alcance / Fuera de alcance
Alcance: líneas 1–5 de `README.md`, la sección nueva `## La idea`, una línea en el árbol de `## Estructura` y un párrafo tras ese árbol.
Fuera de alcance: `## Flujo`, `## Instalación`, diagramas, reglas, bitácora, `definitions/` y cualquier archivo que no sea `README.md`; reescribir `## Para qué existe` o `## Reglas`.

## Pasos
1. En `README.md`, reemplazar las líneas 1–5 por el bloque de *Decisiones ya tomadas*.
2. Insertar `## La idea` (texto exacto) antes de `## Para qué existe`, con una línea en blanco antes y después.
3. En el árbol de `## Estructura`, insertar `├── assets/         # logo del README` bajo `├── README.md`.
4. Agregar el párrafo de la comprobación justo después del cierre del bloque del árbol.
5. Ejecutar *Verificación* y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. `README.md` empieza con la línea `<p align="center"><img src="assets/logo.svg"` y `test -f assets/logo.svg` tiene éxito (comando: `head -1 README.md; test -f assets/logo.svg && echo ok`).
2. Existe `## La idea` antes de `## Para qué existe` (comando: `grep -n "^## " README.md | head -4` lista `La idea` y luego `Para qué existe`).
3. El árbol de `## Estructura` contiene `├── assets/` (comando: `grep -c "├── assets/" README.md` imprime `1`).
4. `node --test pruebas/comprobaciones/readme-estructura.test.mjs` termina con `ℹ fail 0`.
5. `grep -c "MVP en construcción" README.md` imprime `0`.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
head -1 README.md; test -f assets/logo.svg && echo ok
grep -n "^## " README.md | head -4
grep -c "├── assets/" README.md
grep -c "MVP en construcción" README.md
node --test pruebas/comprobaciones/readme-estructura.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)"
git diff --stat
```
Salida esperada: la línea del logo y `ok`; `La idea` seguida de `Para qué existe` entre los encabezados; `1`; `0`; `ℹ fail 0`; `git diff --stat` con `README.md` (más los cambios previos de `definitions/`). Planificación: `readme-estructura.test.mjs` ejecutado hoy sobre el README actual: pasa; los demás comandos son de lectura y los resultados del README nuevo: no ejecutado, inferido.

## Evidencia

Comandos ejecutados desde `/Users/franco/Codes/flucastr/Flucastr.AI` (salida real):

```
$ head -1 README.md; test -f assets/logo.svg && echo ok
<p align="center"><img src="assets/logo.svg" alt="Logo de Flucastr.AI" width="64" height="64"></p>
ok

$ grep -n "^## " README.md | head -4
9:## La idea
15:## Para qué existe
19:## Reglas
28:## Documentación

$ grep -c "├── assets/" README.md
1

$ grep -c "MVP en construcción" README.md
0

$ node --test pruebas/comprobaciones/readme-estructura.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)"
ℹ pass 7
ℹ fail 0

$ git diff --stat
 README.md              | 13 ++++++++++++-
 definitions/BACKLOG.md |  6 ++++--
 definitions/STATUS.md  | 10 +++++++++-
 3 files changed, 25 insertions(+), 4 deletions(-)
```

Criterios de aceptación:
1. Cumple: la primera línea de `README.md` es el `<img src="assets/logo.svg">` y `assets/logo.svg` existe (`ok`).
2. Cumple: `La idea` (línea 9) va antes de `Para qué existe` (línea 15).
3. Cumple: `grep -c` devuelve `1`.
4. Cumple: `ℹ fail 0` (7 pruebas pasan).
5. Cumple: `MVP en construcción` aparece 0 veces.

El `git diff --stat` incluye `definitions/BACKLOG.md` y `definitions/STATUS.md`, cambios previos sin commit que no se tocaron en esta tarea. Esta tarea solo editó `README.md` (y la tarea misma: *Evidencia*, *Notas* y `estado`).

## Notas
Sin huecos menores: el texto de las decisiones se aplicó tal cual. Se mantuvo el bloque de la línea `├── assets/` con la alineación del texto de la tarea. Rama: `chore/F15-actualizar-readme` ya era la actual; no se ejecutó ningún `git switch`. Sin commit ni push.

Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
