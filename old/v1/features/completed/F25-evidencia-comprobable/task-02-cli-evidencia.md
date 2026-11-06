# task-02 — Opción --evidencia en validar-tarea.mjs
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
El `coordinador` solo puede correr `node ~/.flucastr-ai/validar-tarea.mjs *` en proyectos instalados. En vez de sumar un permiso o un lanzador, `scripts/validar-tarea.mjs` gana la opción `--evidencia`, que usa `validarEvidencia` de task-01. Mismo comando, mismo lanzador, mismos códigos de salida 0/1/2.

## Contexto
- Tocar: `scripts/validar-tarea.mjs`, `pruebas/comprobaciones/validar-tarea.test.mjs`
- Leer `scripts/validar-tarea.mjs` completo (60 líneas): lee `process.argv.slice(2)` como rutas, llama `validarTarea` y fija `process.exitCode`. No exporta nada: el lanzador `~/.flucastr-ai/validar-tarea.mjs` (escrito por `instalar.sh`, línea 465, `await import(...)`) lo ejecuta al cargarlo y conserva `process.argv`, así que la opción llega sin tocar el lanzador.
- Permiso del `coordinador` (`agentes/coordinador.md`, línea `tools:`): `Bash(node ~/.flucastr-ai/validar-tarea.mjs *)`. El `*` cubre cualquier argumento tras el espacio, incluido `--evidencia <ruta>`. Confirmado por lectura; la prueba con permiso real no se repite aquí (inferido).
- Leer de task-01 solo sus *Notas*. Pruebas actuales: `pruebas/comprobaciones/validar-tarea.test.mjs` (constante `valida`, helper `correr(...args)`, directorio temporal `dir`).

## Decisiones ya tomadas
- Invocación: `node scripts/validar-tarea.mjs --evidencia <ruta-tarea>...`; la opción debe ser el primer argumento.
- Cualquier otro argumento que empiece por `--` sale con 2 y escribe en stderr `Opción desconocida: <arg>`. Sin rutas tras `--evidencia`: salida 2 con el uso.
- Salida: una línea `<ruta>: <motivo>` por rechazo; si todas pasan, `OK: <n> tarea(s) con evidencia completa`. El modo sin opción no cambia ni un carácter de su salida.
- Códigos: 0 todas válidas, 1 alguna inválida, 2 uso o ruta ilegible (igual que hoy).
- No se toca `instalar.sh` ni el lanzador.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: la opción y sus pruebas, con control negativo.
Fuera de alcance: `instalar.sh`, el lanzador, `agentes/`, `skills/`, documentación en `definitions/`, y cambios al núcleo de task-01.

## Pasos
1. En `scripts/validar-tarea.mjs`, detectar `--evidencia` como primer argumento, rechazar otras opciones `--*` y elegir `validarEvidencia` en vez de `validarTarea`; importarla de `./formato-evidencia.mjs`. Actualizar el comentario de cabecera y el mensaje de uso (`Uso: node validar-tarea.mjs [--evidencia] <ruta-tarea>...`).
2. En `validar-tarea.test.mjs`, ajustar el test existente del uso: su regex hoy es `Uso: node validar-tarea\.mjs <ruta-tarea>\.\.\.`; debe aceptar el nuevo mensaje.
3. Agregar pruebas: tarea con evidencia completa (derivada de `valida` con `estado: lista para revisión`, bloque `$ node --test archivo.test.mjs` con salida `ℹ fail 0`, y `Registro:` válida en *Notas*) sale 0 con `OK: 1 tarea(s) con evidencia completa`.
4. Control negativo: la misma tarea sin la salida del comando sale 1 y la línea empieza con su ruta; con una completa y una incompleta sale 1 con una sola línea de rechazo.
5. Agregar pruebas de `--otra` (salida 2) y de `--evidencia` sin rutas (salida 2).

## Criterios de aceptación
1. Completa sale 0; incompleta sale 1 (control negativo).
2. Opción desconocida y falta de rutas salen 2.
3. Las pruebas previas de `validar-tarea.test.mjs` siguen verdes.
4. El modo sin opción da la misma salida que antes.

## Verificación
```
node --test pruebas/comprobaciones/validar-tarea.test.mjs
node scripts/validar-tarea.mjs features/F25-evidencia-comprobable/task-02-cli-evidencia.md
node scripts/validar-tarea.mjs --evidencia features/F25-evidencia-comprobable/task-02-cli-evidencia.md
```
Esperado: el primero `ℹ fail 0`; el segundo `OK: 1 tarea(s) válida(s)`; el tercero (la tarea sin evidencia aún, estado no terminado) sale 1 con una línea que empieza por `features/F25-evidencia-comprobable/task-02-cli-evidencia.md: `.

## Evidencia

Comando 1, `node --test pruebas/comprobaciones/validar-tarea.test.mjs` (salida real, pasada final):

```
$ node --test pruebas/comprobaciones/validar-tarea.test.mjs
✔ una tarea válida sola sale con 0 y OK: 1 (40.894625ms)
✔ una tarea inválida sola sale con 1, con su ruta y el motivo sobre «Tocar» (31.689833ms)
✔ válida más inválida sale con 1 y una sola línea de rechazo (31.197667ms)
✔ decisiones abiertas sin resolver se rechazan (31.05575ms)
✔ sin argumentos sale con 2 y muestra el uso en stderr (33.176833ms)
✔ ruta inexistente sale con 2 y lo indica en stderr (31.254334ms)
✔ una ruta ilegible sale con 2 aunque otra sea inválida (31.836458ms)
✔ --evidencia con una tarea de evidencia completa sale con 0 y OK de evidencia (33.952084ms)
✔ --evidencia con una tarea sin la salida del comando sale con 1 y su ruta al inicio de la línea (34.526625ms)
✔ --evidencia con una completa y una incompleta sale con 1 y solo rechaza la incompleta (34.262833ms)
✔ una opción desconocida sale con 2 y la nombra en stderr (29.757584ms)
✔ --evidencia fuera de la primera posición es una opción desconocida y sale con 2 (30.845375ms)
✔ --evidencia sin rutas sale con 2 y muestra el uso en stderr (32.561917ms)
ℹ tests 13
ℹ suites 0
ℹ pass 13
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 490.990667
exit 0
```

Comando 2, `node scripts/validar-tarea.mjs features/F25-evidencia-comprobable/task-02-cli-evidencia.md`:

```
$ node scripts/validar-tarea.mjs features/F25-evidencia-comprobable/task-02-cli-evidencia.md
OK: 1 tarea(s) válida(s)
exit 0
```

Comando 3, `node scripts/validar-tarea.mjs --evidencia features/F25-evidencia-comprobable/task-02-cli-evidencia.md` (salida real, con la tarea todavía en «en curso», antes de pasarla a «lista para revisión»):

```
$ node scripts/validar-tarea.mjs --evidencia features/F25-evidencia-comprobable/task-02-cli-evidencia.md
features/F25-evidencia-comprobable/task-02-cli-evidencia.md: La tarea no está terminada: estado «en curso».
exit 1
```

## Notas
- Huecos menores: (1) la aserción de «una sola línea» para la mezcla completa e incompleta se leyó como «ninguna línea de la completa y todas las de la incompleta», porque la tarea incompleta de la prueba da dos motivos y el CLI emite una línea por motivo (como ya define *Decisiones*). (2) Cualquier argumento que empiece por `--` sale con 2 como opción desconocida también sin `--evidencia`; antes ese caso salía con 2 por «No se puede leer». El código de salida no cambia.
- El mensaje de uso pasó a `Uso: node validar-tarea.mjs [--evidencia] <ruta-tarea>...` (paso 1). La regex del test de uso acepta ambas formas.
- Primera pasada de la *Verificación*: el comando 1 falló por mi aserción de la mezcla (dos líneas en vez de una); la corregí y repetí los tres comandos. Por eso `intentos=2`.
- Autocomprobación rechazada, sin resolver aquí: el validador toma el código esperado solo de un literal `exit N` en la línea «Esperado» de la *Verificación*. La tarea dice «sale 1» en el tercer comando, así que el validador exige `exit 0` y lo rechaza. Los tres comandos sí salen como su «Esperado» describe (tercero: exit 1). Corregirlo implica cambiar la *Verificación* (`exit 1`) o el núcleo de task-01; ambos fuera del alcance de esta tarea. Decisión para Franco.
- Repetición: la *Evidencia* se reemplazó por salidas reales de esta pasada (comando 3 con la tarea en «en curso»); el defecto de task-01 ya está corregido, así que la autocomprobación `--evidencia` ahora sale 0 con `OK: 1 tarea(s) con evidencia completa` (no añadida a *Evidencia*, pues no está en *Verificación*).
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

