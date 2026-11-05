# task-03 — Cablear los topes en `validar-tarea.mjs`, con control negativo
repo: Flucastr.AI   depende_de: task-01, task-02   estado: hecha

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
```
$ git branch --show-current
feature/F42-tareas-acotadas-topes
exit 0
$ node --test pruebas/comprobaciones/validar-tarea.test.mjs pruebas/comprobaciones/puerta-previa.test.mjs
ℹ tests 53
ℹ pass 53
ℹ fail 0
exit 0
$ node scripts/validar-tarea.mjs features/F*/task-*.md
OK: 31 tarea(s) válida(s)
exit 0
```

Criterios de aceptación:
1. Cumplido: las pruebas de 5 archivos, 13 KB y 7 pasos salen 1, nombran el tope y terminan en `Firma:` (53 de 53 pasan).
2. Cumplido: 10 KB sale 0 con `AVISO:`; dentro de topes sale 0 sin `AVISO:`; 7 pasos en `hecha` salen 0 (las 53 pruebas pasan).
3. Cumplido: el glob de *Verificación* sale 0 con `OK: 31 tarea(s) válida(s)` tras la corrección del planificador en `task-10`.

## Notas
- Cableado: `scripts/validar-tarea.mjs` importa `medirTopes` de `scripts/formato-topes.mjs`; sus errores entran a `motivos` (rechazo y firma) y sus avisos se imprimen antes de los rechazos como `AVISO: <ruta>: <mensaje>`. El modo `--evidencia` no mide topes; `--hook` es una rama aparte que no los mide. `scripts/firma.mjs` no se tocó.
- Pruebas: seis pruebas nuevas al final de `pruebas/comprobaciones/validar-tarea.test.mjs`, con archivos de «Leer» creados en el directorio temporal de la prueba (pequeno 14 B, aviso 10240 B, grande 13312 B).
- Reintento: el bloqueo anterior (`verificacion_x2`, por el glob de *Verificación* que incluía `task-10`) quedó resuelto por el planificador, que corrigió `task-10`. No se tocó `task-10` ni ningún archivo fuera de *Tocar*. La nota de bloqueo se quitó de esta sección.
- Pasada completa de *Verificación* en este reintento: 1. Los tres comandos se corrieron tal cual, con código de salida real (ver *Evidencia*).
- Huecos menores: 0.
- Sin commit, push, PR ni merge. Rama no cambiada (`feature/F42-tareas-acotadas-topes`, actual).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=falla; huecos=0; resultado=bloqueada; causa=verificacion_x2
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
