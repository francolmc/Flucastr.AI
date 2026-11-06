# task-04 — Modo estructural y entrada de hook en el validador
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
El hook de Claude Code (task-05 y task-06 lo instalan) necesita un punto de entrada que lea el JSON del evento `PostToolUse`, decida si el archivo escrito es una tarea activa y, solo en ese caso, valide la estructura sin falsas alarmas a mitad de edición. Se agrega `validarEstructura` y la opción `--hook` a `validar-tarea.mjs`.

## Contexto
- Fuente: definitions/AUDITORIA.md «2.7 Documento de tarea dañado: quién repara»
- Tocar: `scripts/formato-tarea.mjs`, `scripts/validar-tarea.mjs`, `pruebas/comprobaciones/hook-tarea.test.mjs`
- Requiere: runtime:node@25
- `scripts/validar-tarea.mjs` ya parsea `argumentos[0]` para `--evidencia`, `--fuente` y `--presupuesto`; cualquier otra `--...` sale con 2. Se ejecuta al importarse (lo carga `~/.flucastr-ai/validar-tarea.mjs`); usa `process.exitCode`.
- Claude Code entrega al hook, por stdin, un JSON con `tool_name`, `cwd` y `tool_input.file_path`; con salida 2 y mensaje por stderr, el mensaje llega al modelo (*inferido* de la documentación de hooks; task-08 lo confirma con una corrida real).
- Archivo de tarea activa: ruta que coincide con `/features/[^/]+/task-[^/]*\.md$` y no contiene `/features/completed/`.

## Decisiones ya tomadas
- `validarEstructura(texto)` en `scripts/formato-tarea.mjs` devuelve los motivos de: bloque sin cerrar (si lo hay, solo ese), regla 1 (primera línea), regla 2 (segunda línea) y regla 3 (las diez secciones en orden). NO aplica cuerpos vacíos, pasos, criterios, «Tocar», tamaño ni pendientes (son falsas alarmas a mitad de edición).
- `--hook` (primer argumento, sin más): lee todo stdin como JSON. Si no es JSON, no tiene `tool_input.file_path` o la ruta no es de tarea activa, sale 0 sin imprimir. Si es tarea activa: resuelve la ruta contra `cwd` si es relativa, lee el archivo (si no existe, sale 0) y aplica `validarEstructura`. Sin motivos, sale 0 en silencio. Con motivos, escribe por stderr una línea `<ruta>: <motivo>` por motivo y la línea `Firma:` de task-03, y sale con 2.
- `--hook` nunca escribe archivos ni usa red ni git.
- `--hook` en otra posición, o con argumentos extra, sale con 2 y uso por stderr (igual que las otras opciones).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: `validarEstructura`, la opción `--hook` y pruebas del CLI con stdin simulado.
Fuera de alcance: instalar el hook en `settings.local.json`, la prueba real en Claude Code, Pi y la lógica de repetición.

## Pasos
1. En `scripts/formato-tarea.mjs`, exporta `validarEstructura` reutilizando las reglas 1 a 3 y el bloque sin cerrar (extrae helpers solo si evitas duplicar código).
2. En `scripts/validar-tarea.mjs`, agrega la rama `--hook` antes de la comprobación de opciones desconocidas.
3. Crea `pruebas/comprobaciones/hook-tarea.test.mjs` con `spawnSync('node', ['scripts/validar-tarea.mjs','--hook'], { input: JSON.stringify(...) })` sobre archivos de un directorio temporal en `pruebas/.temporales/`.
4. Casos: tarea dañada (bloque abierto) sale 2 con `bloque de código abierto en línea` y `Firma:` en stderr; tarea válida sale 0 sin salida; tarea con *Descripción* vacía (alarma de mitad de edición) sale 0; ruta en `features/completed/` sale 0; archivo que no es `task-*.md` sale 0; stdin no JSON sale 0; ruta relativa con `cwd` se resuelve.

## Criterios de aceptación
1. Una tarea con un bloque abierto sale con 2, con la línea y la sección en stderr y `Firma:`. Se comprueba en `hook-tarea.test.mjs`.
2. Una tarea válida y una con sección vacía salen con 0 y sin salida (control negativo).
3. Rutas de `features/completed/`, archivos ajenos y stdin inválido salen con 0.
4. Las pruebas existentes de `validar-tarea.test.mjs` pasan; `bash pruebas/rapida.sh` termina en 0.

## Verificación
```
git branch --show-current
node --test pruebas/comprobaciones/hook-tarea.test.mjs pruebas/comprobaciones/validar-tarea.test.mjs
echo '{"tool_input":{"file_path":"/nada/features/F99-x/task-01-a.md"}}' | node scripts/validar-tarea.mjs --hook; echo "exit $?"
bash pruebas/rapida.sh
```
Esperado: primera salida `fix/F38-validador-causal-tareas`; las pruebas con `fail 0`; el comando 3 (archivo inexistente) imprime `exit 0`; `rapida.sh` con `exit 0`.

## Evidencia
```
$ git branch --show-current
fix/F38-validador-causal-tareas
exit 0
$ node --test pruebas/comprobaciones/hook-tarea.test.mjs pruebas/comprobaciones/validar-tarea.test.mjs
ℹ tests 48
ℹ suites 0
ℹ pass 48
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1428.2455
exit 0
$ echo '{"tool_input":{"file_path":"/nada/features/F99-x/task-01-a.md"}}' | node scripts/validar-tarea.mjs --hook; echo "exit $?"
exit 0
$ bash pruebas/rapida.sh
ℹ tests 790
ℹ suites 0
ℹ pass 790
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 23849.146375
rapida: 54 archivos en 24 s (tope 90 s)
exit 0
```

## Notas
- Hueco menor: `validarTarea` y `validarEstructura` comparten las reglas 1 a 3 mediante el helper `revisarCabeceraYSecciones` (en vez de duplicarlas). Mismo comportamiento de `validarTarea`; las pruebas existentes pasan.
- Sin módulo nuevo importado por `validar-tarea.mjs`: `firma.mjs` ya estaba en las listas de `pruebas/fixtures/excedido.sh` y `rol.sh`; no hubo que tocar fixtures.
- Las pruebas de `hook-tarea.test.mjs` (12 casos) quedan dentro de los 48 de la línea de evidencia; `rapida.sh` las incluye.
- La primera corrida de tests salió sin código de salida válido por un `PIPESTATUS` mal usado; se repitió con `exit $?` (misma salida, 48 pass). No es una segunda pasada completa de la *Verificación*.
- Registro de la rapida: `pruebas/.temporales/rapida-f38-t04.log` (ignorado por git).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
