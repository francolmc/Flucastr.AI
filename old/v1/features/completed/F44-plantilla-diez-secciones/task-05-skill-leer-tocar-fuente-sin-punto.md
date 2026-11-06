# task-05 — La skill pide Leer, Tocar y Fuente sin punto final ni comillas en la ruta de Fuente
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
La corrida de Pi (pi-4, modelo `openai/gpt-6-luna`) escribió `- Leer: `src/a.js`, `definitions/PROJECT.md`.`, `- Tocar: `src/cli.js`.` y `- Fuente: `definitions/PROJECT.md` «Decisiones de alcance».`: el validador rechazó las tres por el punto final y por las comillas invertidas de la ruta de Fuente. Claude Code salió OK. Este cambio hace explícito en `skills/descomponer-feature/SKILL.md` que esas líneas no llevan punto final y que la ruta de Fuente va sin comillas invertidas, recortando otras frases para no pasar de 6400 bytes.

## Contexto
- Leer: `skills/descomponer-feature/SKILL.md@28-51`
- Tocar: `skills/descomponer-feature/SKILL.md`
- La skill pesa 6395 de 6400 bytes (`pruebas/comprobaciones/topes-bytes.test.mjs`). Medido en ensayo (copia temporal, ya revertida): con las cuatro sustituciones de *Pasos* queda en 6372 bytes y `node --test pruebas/comprobaciones/*.test.mjs` da `fail 0`. Las frases «cita en *Contexto* las líneas o firmas exactas que el ejecutor necesita», «~3 archivos tocados» y «con su ruta y título» las exigen las pruebas: no se tocan.
- Motivo exacto de cada rechazo (medido con `node scripts/validar-tarea.mjs --fuente` sobre las tareas de Pi): `RE_LEER = /^- Leer: (.+)$/` y cada ítem `/^`(.+?)(?:@(\d+)-(\d+))?`$/` (`scripts/formato-topes.mjs` líneas 14-15) no admiten el `.` final; `/^`[^`\s]+`(, `[^`\s]+`)*$/` (`scripts/formato-tarea.mjs` línea 213) tampoco; `RE_FUENTE = /^- Fuente: (ninguna|(\S+) «([^»]+)»)$/` (`scripts/formato-fuente.mjs` línea 8) exige la ruta sin comillas, un solo `«encabezado»` y nada después.
- Ningún fixture de `pruebas/fixtures/` importa este archivo; no hay lista de módulos que ajustar.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Se elige endurecer el texto de la skill (a) antes que tolerar el punto final en el validador (c): (c) cambiaría una regla de formato y no arregla la Fuente de Pi, que además usó comillas y dos fuentes en una línea.
- Las cuatro sustituciones son exactamente estas (texto actual → texto nuevo), cada una una sola vez:
  1. `con rutas entre comillas invertidas separadas por «, »;` → `con rutas entre comillas invertidas separadas por «, », sin punto final;`
  2. `(una por documento citado)` → `(una por documento, sin comillas invertidas)`
  3. `pártela en dos tareas con `depende_de:`` → `pártela con `depende_de:``
  4. `(por ejemplo `definitions/WORKFLOW.md` §6)` (con el espacio que lo precede) → quitado, de modo que la línea queda `- Cita cada sección de `definitions/` con su ruta y título, no el documento entero.`
- No se cambian topes, roles ni otras frases.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: las cuatro sustituciones en `skills/descomponer-feature/SKILL.md`.
Fuera de alcance: el validador y sus mensajes (task-06), pruebas nuevas (task-07), topes, roles, el commit.

## Pasos
1. Corre `git branch --show-current`.
2. En `skills/descomponer-feature/SKILL.md` aplica la sustitución 1 (línea de *Contexto* de la plantilla).
3. Aplica la sustitución 2 (viñeta `- Fuente:` de «Tarea que se basta sola»).
4. Aplica las sustituciones 3 y 4 (secciones «Acotada» y «Tarea que se basta sola»).
5. Corre `wc -c` sobre la skill y confirma que da 6372.
6. Corre `node --test pruebas/comprobaciones/*.test.mjs` y confirma `fail 0`.

## Criterios de aceptación
1. Rama `fix/F44-plantilla-diez-secciones` (comando 1).
2. La skill pesa 6372 bytes, no más de 6400 (comando 2).
3. `grep -c` encuentra «sin punto final» y «sin comillas invertidas» cada uno una vez (comando 3).
4. Todas las pruebas de `pruebas/comprobaciones/` terminan con `fail 0` (comando 4).

## Verificación
```
git branch --show-current
wc -c skills/descomponer-feature/SKILL.md
grep -c "sin punto final\|sin comillas invertidas" skills/descomponer-feature/SKILL.md
node --test pruebas/comprobaciones/*.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)"
```
Esperado: rama `fix/F44-plantilla-diez-secciones`; `6372 skills/descomponer-feature/SKILL.md`; el `grep -c` imprime `2`; el último comando imprime `ℹ fail 0` (y `ℹ pass` con un número mayor que 780).

## Evidencia

```
$ git branch --show-current
fix/F44-plantilla-diez-secciones
exit 0

$ wc -c skills/descomponer-feature/SKILL.md
    6372 skills/descomponer-feature/SKILL.md
exit 0

$ grep -c "sin punto final\|sin comillas invertidas" skills/descomponer-feature/SKILL.md
2
exit 0

$ node --test pruebas/comprobaciones/*.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)"
ℹ pass 787
ℹ fail 0
exit 0
```

## Notas
- Sin huecos menores. Las cuatro sustituciones se aplicaron tal como están en *Decisiones ya tomadas*, una vez cada una. La línea de *Contexto* queda «separadas por «, », sin punto final;» y la viñeta de Fuente «(una por documento, sin comillas invertidas)».
- El `exit 0` del último comando es el de `grep`, que cierra la tubería; el de `node --test` se verificó aparte con el mismo `node --test` redirigido a un archivo temporal y `echo $?`, que dio `exit 0` con `ℹ fail 0`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
