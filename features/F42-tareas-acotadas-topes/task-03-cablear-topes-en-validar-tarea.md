# task-03 — Cablear los topes en `validar-tarea.mjs`, con control negativo
repo: Flucastr.AI   depende_de: task-01, task-02   estado: aprobada

## Descripción
`scripts/validar-tarea.mjs` pasa a llamar `medirTopes` en la puerta previa: los errores entran a los rechazos (y a la firma de F38, sin cambiarla) y los avisos salen como líneas `AVISO:` sin cambiar el código de salida. Las pruebas del CLI cubren los casos de aceptación de F42.

## Contexto
- Tocar: `scripts/validar-tarea.mjs`, `pruebas/comprobaciones/validar-tarea.test.mjs`
- Leer: `scripts/validar-tarea.mjs@136-42`, `pruebas/comprobaciones/validar-tarea.test.mjs@14-83`, `scripts/formato-topes.mjs`
- Punto de cableado: el bucle `for (const ruta of rutas)`: tras `const motivos = conEvidencia ? validarEvidencia(texto) : validarTarea(texto);` y la línea de `conFuente`. `leerTexto(ruta)` ya existe (lee desde el directorio actual). Las pruebas usan `correr(...args)` con `cwd: dir` y la tarea `valida` (plantilla en las líneas 14–55).
- El modo `--hook` es una rama aparte y no mide topes (solo estructura); `--evidencia` tampoco.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Se mide en el modo por defecto y con `--fuente`; no con `--evidencia` ni `--hook`.
- Cada aviso: línea `AVISO: <ruta>: <mensaje>` por stdout, antes de los rechazos y de la línea `OK:`. Los avisos no cuentan como inválida ni cambian el código.
- La firma sigue siendo la del primer motivo del primer archivo inválido; no se edita `scripts/firma.mjs`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: el cableado y seis pruebas del CLI con archivos creados en el directorio temporal de la prueba: 5 archivos a leer se rechaza; 13 KB de contexto se rechaza; 7 pasos en `aprobada` se rechaza; 10 KB da `AVISO:` y sale 0; una tarea dentro de los topes sale 0 sin `AVISO:`; 7 pasos en `hecha` sale 0 (control negativo de la exención).
Fuera de alcance: `skills/`, `definitions/`, el modo `--hook`.

## Pasos
1. Corre `git branch --show-current`.
2. En `scripts/validar-tarea.mjs`, importa `medirTopes`, añade sus errores a `motivos` y sus avisos a una lista que se imprime como `AVISO:`.
3. En `pruebas/comprobaciones/validar-tarea.test.mjs`, añade las seis pruebas (la `hecha` parte de `evidenciaOk` con `estado: hecha`).
4. Corre la verificación.

## Criterios de aceptación
1. Los tres casos de rechazo (5 archivos, 13 KB, 7 pasos) salen 1, nombran el tope y terminan en una línea `Firma:` (pruebas).
2. El caso de 10 KB sale 0 con `AVISO:` y el de dentro de topes sale 0 sin `AVISO:` (pruebas).
3. `node scripts/validar-tarea.mjs features/F*/task-*.md` sigue saliendo 0 (comando 3).

## Verificación
```
git branch --show-current
node --test pruebas/comprobaciones/validar-tarea.test.mjs pruebas/comprobaciones/puerta-previa.test.mjs
node scripts/validar-tarea.mjs features/F*/task-*.md
```
Esperado: rama `feature/F42-tareas-acotadas-topes`; `fail 0`; `tarea(s) válida(s)` con salida 0.

## Evidencia

## Notas
