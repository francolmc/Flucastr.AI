# task-02 — El validador explica qué hacer cuando un archivo de Leer no existe
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Cuando un archivo de `Leer` no existe, el validador dice solo «El archivo de Leer no se puede leer: ruta.» y el planificador no sabe cómo corregirlo. Esta tarea amplía ese mensaje con la pista «si la tarea lo crea, ponlo en Tocar, no en Leer». Solo cambia texto: las reglas de aceptación y los topes no cambian.

## Contexto
- Leer: `scripts/formato-topes.mjs@60-66`
- Tocar: `scripts/formato-topes.mjs`
- Línea 63 actual: ``errores.push(`El archivo de Leer no se puede leer: ${ruta}.`);``. El texto del informe `pruebas/resultados/2026-11-05-planificador-claude-code-6.md` (línea 11) conserva el prefijo antiguo; es un informe pasado y no se edita.
- Ninguna prueba compara el texto completo del mensaje (medido con `grep -rn "no se puede leer" pruebas/ scripts/`: solo aparece en `scripts/` y en el informe citado). Se conserva el prefijo `El archivo de Leer no se puede leer:`.
- Los fixtures de `pruebas/fixtures/` copian `scripts/` completo; no se crea ni renombra ningún módulo.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Texto nuevo exacto de la línea 63: ``errores.push(`El archivo de Leer no se puede leer: ${ruta}. Si la tarea lo crea, ponlo en Tocar, no en Leer.`);``
- No cambian expresiones regulares, topes ni el resto de mensajes.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: el texto de un mensaje en `scripts/formato-topes.mjs`.
Fuera de alcance: la skill (task-01), pruebas nuevas (task-03), reglas y topes del validador, el commit.

## Pasos
1. Corre `git branch --show-current` y confirma la rama de *Verificación*.
2. En `scripts/formato-topes.mjs`, línea 63, reemplaza el mensaje por el texto de *Decisiones ya tomadas*.
3. Corre `node --test pruebas/comprobaciones/formato-topes.test.mjs pruebas/comprobaciones/planificador-resultado.test.mjs pruebas/comprobaciones/regresion-validadores.test.mjs` y confirma `fail 0`.

## Criterios de aceptación
1. Rama `fix/F45-leer-solo-archivos-existentes` (comando 1).
2. El archivo contiene «ponlo en Tocar, no en Leer» (comando 2 imprime `1`).
3. Las tres pruebas existentes terminan con `fail 0` (comando 3).
4. Todas las tareas del repo siguen válidas (comando 4 termina en 0).

## Verificación
```
git branch --show-current
grep -c "ponlo en Tocar, no en Leer" scripts/formato-topes.mjs
node --test pruebas/comprobaciones/formato-topes.test.mjs pruebas/comprobaciones/planificador-resultado.test.mjs pruebas/comprobaciones/regresion-validadores.test.mjs 2>&1 | grep -a "fail "
node scripts/validar-tarea.mjs features/F*/task-*.md; echo "salida $?"
```
Esperado: rama `fix/F45-leer-solo-archivos-existentes`; `1`; `ℹ fail 0`; la última línea `salida 0`.

## Evidencia

```
$ git branch --show-current
fix/F45-leer-solo-archivos-existentes
exit 0

$ grep -c "ponlo en Tocar, no en Leer" scripts/formato-topes.mjs
1
exit 0

$ node --test pruebas/comprobaciones/formato-topes.test.mjs pruebas/comprobaciones/planificador-resultado.test.mjs pruebas/comprobaciones/regresion-validadores.test.mjs 2>&1 | grep -a "fail "
ℹ fail 0
exit 0

$ node scripts/validar-tarea.mjs features/F*/task-*.md; echo "salida $?"
OK: 4 tarea(s) válida(s)
salida 0
exit 0
```

## Notas
- Texto de la línea 63 reemplazado por el de *Decisiones ya tomadas*; ninguna otra línea tocada.
- Un intento de la *Verificación* falló por un error de redirección en mi propio comando (ruta de salida mal escrita); no fue un fallo de la verificación. Se repitió sin cambiar código. Cuenta como intentos=1 de verificación válida.
- Huecos menores: 0.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
