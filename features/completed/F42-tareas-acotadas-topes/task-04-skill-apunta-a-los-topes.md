# task-04 — La skill descomponer-feature apunta a los topes de WORKFLOW.md
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
Reemplaza en `skills/descomponer-feature/SKILL.md` la cifra vieja «~8 pasos» por un puntero a `WORKFLOW.md` §6 (conserva «~3 archivos tocados», que exige la prueba de contrato), sin crecer en bytes (la skill está en 6363 de 6400). Así el planificador conoce los topes y el validador los mide.

## Contexto
- Tocar: `skills/descomponer-feature/SKILL.md`
- Leer: `skills/descomponer-feature/SKILL.md@28-38`, `definitions/WORKFLOW.md@134-13`
- Línea 63: «- Hasta ~8 pasos, ~3 archivos tocados y 5 criterios de aceptación.» Línea 31 (plantilla): «## Contexto         Rutas exactas a leer y a tocar; …». El tope de bytes lo comprueba `pruebas/comprobaciones/topes-bytes.test.mjs`.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Edición A (obligatoria): la línea 63 pasa a «- Topes: `WORKFLOW.md` §6 (~3 archivos tocados); los mide el validador.» Debe conservar la frase «~3 archivos tocados» (la exige `contrato-roles.test.mjs`; no se toca la prueba)
- Edición B (condicionada): en la plantilla, «Rutas exactas a leer y a tocar» pasa a «Líneas `- Leer:` y `- Tocar:`». Se conserva solo si `wc -c` queda en 6400 o menos; si no, se revierte B y se queda con A.
- Las demás líneas (incluida «Hasta 6 KB (aviso) / 8 KB (error)») no cambian. `agentes/planificador.md` no se toca.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: las ediciones A y B.
Fuera de alcance: crear una skill nueva, tocar `agentes/`, reinstalar el kit.

## Pasos
1. Corre `git branch --show-current`.
2. Aplica la edición A y mide con `wc -c skills/descomponer-feature/SKILL.md`.
3. Aplica la edición B, mide de nuevo y revierte B si pasa de 6400.
4. Corre la verificación.

## Criterios de aceptación
1. La skill no contiene «~8 pasos» y sí «Topes: `WORKFLOW.md` §6» (grep).
2. `wc -c` de la skill es 6400 o menos y `topes-bytes.test.mjs` pasa.
3. La skill sigue cumpliendo sus pruebas de contrato (comando 4).

## Verificación
```
git branch --show-current
grep -c "Topes: \`WORKFLOW.md\` §6" skills/descomponer-feature/SKILL.md
wc -c skills/descomponer-feature/SKILL.md
node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs
```
Esperado: rama `feature/F42-tareas-acotadas-topes`; `1`; un número menor o igual a 6400; `fail 0`.

## Evidencia
```
$ git branch --show-current
feature/F42-tareas-acotadas-topes
exit 0

$ node ~/.flucastr-ai/entorno.mjs features/F42-tareas-acotadas-topes/task-04-skill-apunta-a-los-topes.md
ok
exit 0

$ grep -c "Topes: \`WORKFLOW.md\` §6" skills/descomponer-feature/SKILL.md
1
exit 0

$ grep -c "~8 pasos" skills/descomponer-feature/SKILL.md
0
exit 1

$ grep -c "~3 archivos tocados" skills/descomponer-feature/SKILL.md
1
exit 0

$ wc -c skills/descomponer-feature/SKILL.md
6368 skills/descomponer-feature/SKILL.md
exit 0

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

## Notas
Reintento tras el BLOQUEO de la pasada anterior (ya resuelto: el planificador conservó «~3 archivos tocados» en la Edición A). Se aplicaron la Edición A y la Edición B tal como están en la tarea corregida; no se tocó la prueba de contrato ni `agentes/planificador.md`.
Medición: tras la Edición A, 6368 bytes; tras la Edición B, 6368 bytes (la sustitución «Rutas exactas a leer y a tocar» por «Líneas `- Leer:` y `- Tocar:`» tiene el mismo tamaño en bytes). Como queda en 6400 o menos, la Edición B se conserva.
Huecos menores: 0.
Sin commit, push, PR ni merge. Rama no cambiada.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=falla; huecos=0; resultado=bloqueada; causa=otra
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
