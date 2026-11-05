# task-01 — La plantilla de descomponer-feature lista la sección Decisiones abiertas
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
La plantilla de `skills/descomponer-feature/SKILL.md` lista 9 secciones y omite `## Decisiones abiertas`, que `scripts/validar-tarea.mjs` exige y `definitions/WORKFLOW.md` §6 lista (10 secciones). Por eso, en la corrida claude-code-3 de F42, el planificador escribió tareas que el validador rechazó. Esta tarea añade la sección a la plantilla y recorta una frase redundante para que la skill no supere sus 6400 bytes (hoy 6374).

## Contexto
- Leer: `skills/descomponer-feature/SKILL.md`
- Tocar: `skills/descomponer-feature/SKILL.md`
- Plantilla: líneas 26-39 de la skill. La línea 32 es «## Decisiones ya tomadas   Lo que el ejecutor NO debe volver a decidir (librería, nombres, formato…).» y la 33 es «## Alcance / Fuera de alcance   Fuera de alcance no puede quedar vacío.». La viñeta a recortar está en la línea 53 (sección «Completa»): «- Las rutas del contexto las leíste en el repo. Los comandos los ejecutaste si no tienen efectos sobre archivos versionados (pruebas, lint, `--help`); los demás están marcados «no ejecutado, inferido» en el *Contexto*.»
- El validador exige las 10 secciones en el orden de `SECCIONES` en `scripts/formato-tarea.mjs` (líneas 7-18); la regla 10 pide que «Decisiones abiertas» sea «Ninguna» o cada línea «- … Resuelta: texto».
- Tope de bytes: `pruebas/comprobaciones/topes-bytes.test.mjs` fija 6400 para esta skill; las frases obligatorias están en `pruebas/comprobaciones/frases-por-archivo.mjs` y no se tocan.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- La línea nueva va entre «Decisiones ya tomadas» y «Alcance / Fuera de alcance», con el mismo formato de columnas de las demás, y dice exactamente: `## Decisiones abiertas   OBLIGATORIA: «Ninguna» o cada decisión con «Resuelta: texto».`
- La viñeta de la línea 53 se reemplaza por exactamente: `- Rutas leídas en el repo; comandos sin efectos sobre archivos versionados ejecutados, los demás marcados «no ejecutado, inferido» en el *Contexto*.`
- Si tras ese recorte la skill sigue sobre 6400 bytes, se acorta además la línea 12 (paso 0) sin quitar condiciones del criterio de refinado; no se cambia ninguna otra sección ni ninguna frase de `frases-por-archivo.mjs`.
- No se cambian topes, roles ni el validador.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: la plantilla de la skill lista las 10 secciones y la skill cabe en 6400 bytes.
Fuera de alcance: la prueba de las 10 secciones (task-02), la corrida con modelo real, `definitions/WORKFLOW.md`, `scripts/` y cualquier otro archivo.

## Pasos
1. Corre `git branch --show-current` y `wc -c skills/descomponer-feature/SKILL.md` (anota los bytes de partida).
2. En `skills/descomponer-feature/SKILL.md`, inserta la línea de «Decisiones abiertas» tras la línea 32 de la plantilla.
3. Reemplaza la viñeta de la línea 53 por el texto fijado en *Decisiones ya tomadas*.
4. Corre `wc -c skills/descomponer-feature/SKILL.md`; si pasa de 6400, aplica el recorte de la línea 12 y vuelve a medir.
5. Corre las pruebas de la verificación.

## Criterios de aceptación
1. Rama `fix/F44-plantilla-diez-secciones` (primer comando de la verificación).
2. La plantilla contiene la línea de «Decisiones abiertas» (comando `grep`).
3. La skill pesa ≤ 6400 bytes (comando `wc -c`).
4. Las pruebas de topes y de contrato pasan con 0 fallos (comando `node --test`).

## Verificación
```
git branch --show-current
grep -c "^## Decisiones abiertas   OBLIGATORIA" skills/descomponer-feature/SKILL.md
wc -c skills/descomponer-feature/SKILL.md
node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs
```
Esperado: rama `fix/F44-plantilla-diez-secciones`; el grep imprime `1`; `wc -c` imprime un número ≤ 6400; el resumen de `node --test` trae `# fail 0`.

## Evidencia

```
$ git branch --show-current
fix/F44-plantilla-diez-secciones
exit 0
```

```
$ grep -c "^## Decisiones abiertas   OBLIGATORIA" skills/descomponer-feature/SKILL.md
1
exit 0
```

```
$ wc -c skills/descomponer-feature/SKILL.md
6395 skills/descomponer-feature/SKILL.md
exit 0
```

```
$ node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs
ℹ tests 154
ℹ suites 0
ℹ pass 154
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0
```

```
$ node --test --test-reporter=tap pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs
# tests 154
# suites 0
# pass 154
# fail 0
# cancelled 0
# skipped 0
# todo 0
exit 0
```

## Notas
- Rama de partida: `main`. La rama `fix/F44-plantilla-diez-secciones` no existía; se creó con `git switch -c` desde `main`.
- Paso 4 no aplicó: tras el recorte de la viñeta la skill mide 6395 bytes (≤ 6400), así que no se acortó la línea 12.
- Hueco menor: la *Verificación* espera `# fail 0`; el runner por defecto de Node 25 (v25.8.1) imprime `ℹ fail 0`. Se cumple el criterio (fallos = 0, `exit 0`). Para que la *Evidencia* contenga el fragmento literal, se añadió una cuarta corrida real con `--test-reporter=tap` (mismos archivos, mismo resultado: 154 pasan, 0 fallan). No se cambió ningún archivo por ello.
- Tarea sin commit, push ni cambios en STATUS.md.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
