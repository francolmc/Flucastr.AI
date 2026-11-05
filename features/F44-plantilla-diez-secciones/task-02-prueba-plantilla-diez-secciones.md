# task-02 — Prueba que la plantilla de la skill lista las 10 secciones del validador
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Añade una prueba que compara los títulos `##` de la plantilla de `skills/descomponer-feature/SKILL.md` con `SECCIONES` de `scripts/formato-tarea.mjs`, para que la plantilla no vuelva a divergir del validador (el defecto que F44 corrige). La prueba falla si falta una sección, sobra una o están en otro orden.

## Contexto
- Leer: `scripts/formato-tarea.mjs@7-18`, `skills/descomponer-feature/SKILL.md@24-39`
- Tocar: `pruebas/comprobaciones/plantilla-diez-secciones.test.mjs`
- `scripts/formato-tarea.mjs` exporta `SECCIONES` (líneas 7-18, array de 10 títulos). La plantilla de la skill es el primer bloque de código tras el título «## Plantilla»; sus líneas de sección empiezan con «## » y el título termina donde hay dos o más espacios seguidos (p. ej. «## Descripción      Qué y por qué…»), salvo «## Alcance / Fuera de alcance   …».
- Convención de pruebas: `node:test` + `node:assert/strict`; la raíz del repo se obtiene con `fileURLToPath(new URL('../../', import.meta.url))` (como en `topes-bytes.test.mjs`, líneas 1-7). `pruebas/rapida.sh` recoge solo `pruebas/comprobaciones/*.test.mjs`, así que el archivo nuevo entra solo.
- Ninguno de estos módulos lo importan los fixtures de `pruebas/fixtures/`; no hay lista de módulos copiados que ajustar.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Un solo archivo nuevo con dos pruebas: (a) los títulos extraídos de la plantilla son iguales, en orden, a `SECCIONES`; (b) control negativo: la misma extracción sobre el texto de la skill sin la línea «## Decisiones abiertas» no es igual a `SECCIONES` (la prueba nace de ese defecto).
- La extracción usa expresiones regulares sobre el texto; no se parsea Markdown con librerías.
- Se importa `SECCIONES` desde `../../scripts/formato-tarea.mjs`; no se copia la lista.
- No se modifica ningún archivo existente.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: el archivo de prueba nuevo.
Fuera de alcance: cambiar la skill (task-01), el validador, los topes o `pruebas/rapida.sh`.

## Pasos
1. Corre `git branch --show-current`.
2. Crea `pruebas/comprobaciones/plantilla-diez-secciones.test.mjs`: lee `skills/descomponer-feature/SKILL.md`, toma el bloque de código tras «## Plantilla» y extrae los títulos de las líneas que empiezan con «## ».
3. Escribe la prueba (a): `assert.deepEqual` entre los títulos extraídos y `SECCIONES`.
4. Escribe la prueba (b): quita del texto la línea que empieza con «## Decisiones abiertas», extrae de nuevo y comprueba con `assert.notDeepEqual` que difiere de `SECCIONES`.
5. Corre el archivo con `node --test` y confirma que pasa.

## Criterios de aceptación
1. Rama `fix/F44-plantilla-diez-secciones` (primer comando).
2. La prueba (a) pasa con la skill actual (comando `node --test`).
3. La prueba (b) pasa, es decir, detecta la omisión (mismo comando).
4. Existe el archivo y solo ese archivo es nuevo (comando `ls`).

## Verificación
```
git branch --show-current
node --test pruebas/comprobaciones/plantilla-diez-secciones.test.mjs
ls pruebas/comprobaciones/plantilla-diez-secciones.test.mjs
```
Esperado: rama `fix/F44-plantilla-diez-secciones`; `node --test` termina con `# pass 2` y `# fail 0`; `ls` imprime la ruta del archivo.

## Evidencia

```
$ git branch --show-current
fix/F44-plantilla-diez-secciones
exit 0
```

```
$ node --test pruebas/comprobaciones/plantilla-diez-secciones.test.mjs
✔ la plantilla de la skill lista las 10 secciones de SECCIONES, en orden (1.679125ms)
✔ control negativo: sin la línea «## Decisiones abiertas» la extracción difiere (0.178166ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
exit 0
```

Corrida complementaria con el reporter TAP (mismo archivo, mismo comando con `--test-reporter=tap`), para el resumen literal `# pass 2` / `# fail 0`:

```
$ node --test --test-reporter=tap pruebas/comprobaciones/plantilla-diez-secciones.test.mjs
ok 1 - la plantilla de la skill lista las 10 secciones de SECCIONES, en orden
ok 2 - control negativo: sin la línea «\#\# Decisiones abiertas» la extracción difiere
1..2
# tests 2
# suites 0
# pass 2
# fail 0
# cancelled 0
# skipped 0
# todo 0
exit 0
```

```
$ ls pruebas/comprobaciones/plantilla-diez-secciones.test.mjs
pruebas/comprobaciones/plantilla-diez-secciones.test.mjs
exit 0
```

## Notas
- Rama: `fix/F44-plantilla-diez-secciones` ya era la actual (`git branch --show-current`); no se creó ni cambió de rama.
- Entorno: `node ~/.flucastr-ai/entorno.mjs` devolvió `ok`.
- Hueco menor: la *Verificación* espera `# pass 2` / `# fail 0`, y el reporter por defecto de Node 25 imprime `ℹ pass 2` / `ℹ fail 0`. Se cumple el criterio (2 pasan, 0 fallan, `exit 0`). Igual que en task-01, se añadió una corrida complementaria con `--test-reporter=tap`; no se cambió ningún archivo por ello.
- Prueba (b): la línea «## Decisiones abiertas» se quita del texto y la extracción difiere de `SECCIONES`, así que la prueba detecta la omisión.
- Archivo nuevo: `pruebas/comprobaciones/plantilla-diez-secciones.test.mjs`; solo ese archivo es nuevo. No se tocó la skill, el validador, los topes ni `pruebas/rapida.sh`.
- Sin commit, push, PR, merge ni despliegue; no se escribió en STATUS.md.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
