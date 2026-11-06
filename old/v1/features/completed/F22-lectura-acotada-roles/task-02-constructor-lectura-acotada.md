# task-02 — `constructor` y `ejecutar-tarea`: qué lee y evidencia corta
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
`definitions/CONTEXTO.md` §2.2 fija que el `constructor` lee solo su tarea, las rutas de su *Contexto* y, de `depende_de:`, únicamente las *Notas* de esa tarea; no lee `definitions/` salvo la sección que la tarea cite, ni tareas `hecha` ajenas. Hoy `agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md` solo tienen la regla de lectura por tramos. Esta tarea agrega la regla de qué se lee y el tope de *Evidencia* de §2.3 (≤1,5 KB, cola relevante).

## Contexto
- Diseño aprobado: `definitions/CONTEXTO.md` §2.2 (fila `constructor`) y §2.3 (fila «*Evidencia* de la tarea»). Leer solo esas dos secciones.
- `agentes/constructor.md` (2230 bytes): el párrafo ``**Lectura acotada:** lee archivos grandes…`` está justo antes de ``Cierra con un resumen de cinco líneas…``. Ese párrafo se conserva intacto (lo exige `pruebas/comprobaciones/higiene-contexto.test.mjs`: `Lectura acotada:` y ``` `edit` en vez de reescribirlos enteros con `write` ```).
- `skills/ejecutar-tarea/SKILL.md` (5354 bytes): línea 24 `3. Corre la *Verificación* tal cual está escrita. Pega en *Evidencia* la salida **real** (comando y salida), nunca una versión resumida o inventada.`; línea 18 `4. Lee las rutas de *Contexto*. Trabaja solo en el repo del campo `repo:`.`; línea 26 es el punto 5 «Lectura acotada» (se conserva intacto).
- Nada en `pruebas/` ni `scripts/` fija la frase de la línea 24 ni la de la línea 18 (comprobado con `grep -rn`).
- Deben seguir pasando: `pruebas/comprobaciones/contrato-roles.test.mjs`, `higiene-contexto.test.mjs`, `contrato-constructor.test.mjs`.
- Tocar: `agentes/constructor.md`, `skills/ejecutar-tarea/SKILL.md`.

## Decisiones ya tomadas
- Cada reemplazo es un solo `Edit` con el texto exacto de abajo; cada frase obligatoria va en su propia línea (la verificación cuenta con `grep -cF`).
- `agentes/constructor.md`: se inserta, entre el párrafo ``**Lectura acotada:**…`` y ``Cierra con un resumen…``, una sección `## Qué lees` con estas viñetas literales:
  - ``- Lees tu tarea y las rutas de su *Contexto*.``
  - ``- De `depende_de:` lees solo las *Notas* de esa tarea.``
  - ``- No lees `definitions/` salvo la sección que cite la tarea, y entonces solo esa.``
  - ``- No lees tareas `hecha` ajenas a `depende_de:`.``
- `ejecutar-tarea`, línea 18 pasa a: ``4. Lee las rutas de *Contexto*; de `depende_de:` lee solo las *Notas* de esa tarea, y de `definitions/` solo la sección que la tarea cite. Trabaja solo en el repo del campo `repo:`.``
- `ejecutar-tarea`, línea 24 pasa a: ``3. Corre la *Verificación* tal cual está escrita. Pega en *Evidencia* la cola relevante de la salida **real** (comando y salida), hasta 1,5 KB; nunca una versión inventada.``
- Topes finales: `agentes/constructor.md` ≤ 2900 bytes; `skills/ejecutar-tarea/SKILL.md` ≤ 5700 bytes.

## Alcance / Fuera de alcance
Alcance: los dos archivos, solo los pasajes indicados.
Fuera de alcance: `planificador`, `arquitecto`, `coordinador` y sus skills; pruebas de contrato (task-04); `scripts/`; `definitions/`; correr modelo.

## Pasos
1. `agentes/constructor.md`: `Edit` que inserta la sección «## Qué lees» después del párrafo de «Lectura acotada».
2. `skills/ejecutar-tarea/SKILL.md`: `Edit` de la línea 18 (punto 4 de «Antes de empezar») con el texto de *Decisiones*.
3. `skills/ejecutar-tarea/SKILL.md`: `Edit` de la línea 24 (punto 3 de «Ejecución») con el texto de *Decisiones*.
4. Correr la *Verificación* y pegar la cola relevante en *Evidencia*.

## Criterios de aceptación
1. Las cuatro viñetas aparecen cada una en exactamente una línea de `agentes/constructor.md` (`grep -cF` imprime 1).
2. La skill contiene `hasta 1,5 KB` y `de `depende_de:` lee solo las *Notas* de esa tarea` una vez cada uno, y ya no contiene `una versión resumida`.
3. `agentes/constructor.md` ≤ 2900 bytes y la skill ≤ 5700 bytes.
4. Las suites de contrato y de higiene siguen en `fail 0`.
5. `bash pruebas/rapida.sh` termina con código 0 y S ≤ 30.

## Verificación
- `cd /Users/franco/Codes/flucastr/Flucastr.AI && for f in 'Lees tu tarea y las rutas de su *Contexto*' 'De `depende_de:` lees solo las *Notas* de esa tarea' 'No lees `definitions/` salvo la sección que cite la tarea' 'No lees tareas `hecha` ajenas a `depende_de:`'; do grep -cF -- "$f" agentes/constructor.md; done` → `1` cuatro veces.
- `for f in 'hasta 1,5 KB' 'de `depende_de:` lee solo las *Notas* de esa tarea'; do grep -cF -- "$f" skills/ejecutar-tarea/SKILL.md; done` → `1` dos veces; `grep -c 'una versión resumida' skills/ejecutar-tarea/SKILL.md` → `0`.
- `wc -c agentes/constructor.md skills/ejecutar-tarea/SKILL.md` → ≤ 2900 y ≤ 5700.
- `node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs pruebas/comprobaciones/contrato-constructor.test.mjs` → `fail 0`.
- `bash pruebas/rapida.sh` → código 0 y `rapida: … (tope 30 s)` con S ≤ 30 (si pasa de 30 s sin prueba fallida, repetirla una vez y anotarlo en *Notas*).

## Evidencia

```
$ grep -cF -- <4 viñetas de Qué lees> agentes/constructor.md
1
1
1
1
$ grep -cF -- 'hasta 1,5 KB' / 'de `depende_de:` lee solo las *Notas* de esa tarea' skills/ejecutar-tarea/SKILL.md
1
1
$ grep -c 'una versión resumida' skills/ejecutar-tarea/SKILL.md
0
$ wc -c agentes/constructor.md skills/ejecutar-tarea/SKILL.md
    2478 agentes/constructor.md
    5486 skills/ejecutar-tarea/SKILL.md
    7964 total
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs pruebas/comprobaciones/contrato-constructor.test.mjs
ℹ tests 64
ℹ pass 64
ℹ fail 0
$ bash pruebas/rapida.sh; echo "exit=$?"   (cola)
✔ lanzar-constructor-claude.sh: el control negativo rechaza una lista autorizada con git commit (14.049792ms)
ℹ tests 335
ℹ pass 335
ℹ fail 0
rapida: 29 archivos en 17 s (tope 30 s)
exit=0
```

## Notas
- Sin huecos menores. La rama `feature/F22-lectura-acotada-roles` ya era la actual: no se corrió ningún `git switch`.
- Tamaños: `agentes/constructor.md` 2478 B (tope 2900), `skills/ejecutar-tarea/SKILL.md` 5486 B (tope 5700).
- Verificación pasó en la primera pasada completa.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
