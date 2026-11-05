# task-09 — Corrección: la skill aclara que «Leer» y «Tocar» son una línea cada una
repo: Flucastr.AI   depende_de: task-08   estado: hecha

## Descripción
En la corrida `claude-code-3` de task-10 el planificador dejó dos líneas `- Leer:` en «## Contexto» de cada tarea y el validador exige una (ningún tope excedido). La plantilla de la skill dice «Líneas `- Leer:` y `- Tocar:`» sin precisar que cada una es una sola línea con rutas entre comillas invertidas separadas por «, ». Esta tarea lo aclara con edición mínima y sin gastar créditos.

## Contexto
- Tocar: `skills/descomponer-feature/SKILL.md`
- Leer: `skills/descomponer-feature/SKILL.md@25-40`
- La skill pesa 6368 de 6400 bytes (tope de `pruebas/comprobaciones/topes-bytes.test.mjs`); la edición debe quedar neta en ≤32 bytes.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- En la línea de la sección `## Contexto` de la plantilla (línea 33), cambia `Líneas `- Leer:` y `- Tocar:`;` por `Una línea `- Leer:` y otra `- Tocar:`, con rutas entre comillas invertidas separadas por «, »;` (+66 bytes).
- Para compensar, en el título de la línea 60 cambia `## Acotada (cifras de partida, a calibrar con la primera feature real)` por `## Acotada` (-60 bytes; ninguna prueba ni script lee ese texto, *confirmado* con grep). Neto +6 bytes, 6374 en total.
- Solo se tocan esas dos líneas: no se pierden las frases que exigen `pruebas/comprobaciones/frases-por-archivo.mjs` y `pruebas/comprobaciones/contrato-roles.test.mjs`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: las dos ediciones de arriba en la skill.
Fuera de alcance: agentes, topes, validador, otras skills, `definitions/`, corridas con modelo real, el commit.

## Pasos
1. Corre `git branch --show-current`.
2. En `skills/descomponer-feature/SKILL.md`, aplica el cambio de la línea de `## Contexto` de la plantilla. Resultado: la frase nueva aparece una vez.
3. En el mismo archivo, acorta el título `## Acotada`. Resultado: `grep -c "cifras de partida"` da 0.
4. Corre la verificación y copia la salida real en *Evidencia*.

## Criterios de aceptación
1. Rama `feature/F42-tareas-acotadas-topes` (comando 1).
2. La skill pesa ≤6400 bytes (comando 2).
3. La skill contiene la frase `Una línea `- Leer:` y otra `- Tocar:`` (comando 3).
4. Las pruebas de bytes y de contrato de roles terminan con `fail 0` (comando 4).

## Verificación
```
git branch --show-current
wc -c skills/descomponer-feature/SKILL.md
grep -c 'Una línea `- Leer:` y otra `- Tocar:`, con rutas entre comillas invertidas separadas por «, »' skills/descomponer-feature/SKILL.md
node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs
```
Esperado: rama `feature/F42-tareas-acotadas-topes`; un número ≤6400 antes del nombre; `1`; `fail 0`.

## Evidencia

```
$ git branch --show-current
feature/F42-tareas-acotadas-topes
exit 0

$ wc -c skills/descomponer-feature/SKILL.md
    6374 skills/descomponer-feature/SKILL.md
exit 0

$ grep -c 'Una línea `- Leer:` y otra `- Tocar:`, con rutas entre comillas invertidas separadas por «, »' skills/descomponer-feature/SKILL.md
1
exit 0

$ node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs
ℹ tests 154
ℹ suites 0
ℹ pass 154
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 79.083709
exit 0
```

Comprobación adicional: `grep -c "cifras de partida" skills/descomponer-feature/SKILL.md` da 0 (paso 3 de *Pasos*).

## Notas
Hueco menor: *Decisiones ya tomadas* cita la línea 33 de la plantilla; en el archivo actual la línea de `## Contexto` es la 31. Se aplicó el cambio sobre el texto exacto (`Líneas `- Leer:` y `- Tocar:`;`), que aparece una vez.
Decisión: sin otros cambios. El título de la línea 60 pasó de `## Acotada (cifras de partida, a calibrar con la primera feature real)` a `## Acotada`, como indica la tarea. Bytes: 6368 -> 6374 (+6), dentro del tope de 6400.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
