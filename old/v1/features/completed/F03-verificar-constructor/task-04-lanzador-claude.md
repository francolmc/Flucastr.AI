# task-04 — Lanzador del constructor en Claude Code con permisos normales
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
La prueba del constructor en Claude Code (`definitions/WORKFLOW.md` §7, paso 4) no fue concluyente porque un comando Bash compuesto fue denegado por los permisos de la propia prueba. Esta tarea crea un lanzador para el constructor con permisos explícitos y suficientes para sus tareas (leer, escribir y editar dentro de la carpeta del fixture, órdenes simples de Bash) y sin acceso a `.env`, más una prueba con un binario simulado. No ejecuta el modelo real (eso es task-05).

## Contexto
- Repo: este, único repo. Modelo de referencia: `pruebas/lanzar-claude.sh` (arquitecto): `claude -p --agent arquitecto --permission-mode dontAsk --permission-prompts none --no-session-persistence --output-format stream-json --verbose --allowedTools … --disallowedTools … -- "$prompt" > "$FLUCASTR_RECORD_FILE"`, con `FLUCASTR_CLAUDE_BIN` para sustituir `claude` y `: "${FLUCASTR_RECORD_FILE:?…}"` obligatorio. Esos flags aparecen en `claude --help` (leído: `--agent`, `--allowedTools`, `--disallowedTools`, `--permission-mode`, `--permission-prompts`, `--output-format`).
- Prueba de referencia: `pruebas/lanzadores.test.mjs` (usa un binario simulado `fake-model.sh` que imprime sus argumentos, y comprueba sintaxis con `bash -n`, argumentos y archivo de registro).
- Agente instalado: `~/.claude/agents/constructor.md` (leído: front matter con `model: claude-haiku-5-5`, generado por `instalar.sh`).
- Fixture de task-02: sus cuatro tareas están en `features/F99-demo/` y sus verificaciones son órdenes simples (`cat salida.txt`, `cat no-debe-existir.txt`, `cat datos.json`, `bash verificar.sh`).
- Archivos a crear: `pruebas/lanzar-constructor-claude.sh` (ejecutable) y `pruebas/lanzar-constructor.test.mjs` (el glob de `rapida.sh` incluye `pruebas/*.test.mjs`). Aún no existen: «no ejecutado, inferido».

## Decisiones ya tomadas
- Uso: `pruebas/lanzar-constructor-claude.sh RUTA_TAREA`, ejecutado con el directorio actual en el fixture; `RUTA_TAREA` es relativa, p. ej. `features/F99-demo/task-01-crear-salida.md`. Sin argumento: mensaje `uso: lanzar-constructor-claude.sh RUTA_TAREA` y código 2.
- Prompt (un único argumento): `Ejecuta la tarea RUTA_TAREA. En esta sesión no se pueden responder preguntas.` con la ruta sustituida.
- Argumentos de `claude`: los mismos flags de `lanzar-claude.sh` con `--agent constructor`; `--allowedTools`: `Read(./**)`, `Write(./**)`, `Edit(./**)`, `Skill`, `Bash(cat *)`, `Bash(ls *)`, `Bash(bash verificar.sh)`, `Bash(git status --short)`; `--disallowedTools`: `Read(./.env)`, `Read(.env)`, `Bash(cat ./.env)`, `Bash(cat .env)`.
- No se permiten Git mutantes ni Bash genérico.
- Registro en `$FLUCASTR_RECORD_FILE` (obligatorio). Binario sustituible con `FLUCASTR_CLAUDE_BIN`.
- La prueba comprueba: sintaxis `bash -n`; sin argumento sale 2 con `uso:`; con binario simulado, el registro contiene `--agent`, `constructor`, `--permission-mode`, `dontAsk`, `Write(./**)`, `Bash(bash verificar.sh)`, `Read(./.env)` y el prompt completo como línea única; no contiene `Bash(git commit`, `Bash(git push` ni `Bash(*)`.

## Alcance / Fuera de alcance
Alcance: el lanzador y su prueba.
Fuera de alcance: modificar `pruebas/lanzar-claude.sh`, `pruebas/lanzar-pi.sh`, `pruebas/lanzadores.test.mjs`, `pruebas/ejecutar.sh`, `instalar.sh` o `agentes/`; un lanzador para Pi; ejecutar el `claude` real; hacer commit.

## Pasos
1. Crear `pruebas/lanzar-constructor-claude.sh` (ejecutable, `set -euo pipefail`) con el uso, el prompt y los argumentos de *Decisiones ya tomadas*.
2. Crear `pruebas/lanzar-constructor.test.mjs` con la prueba de sintaxis y la de uso sin argumento.
3. En el mismo archivo, añadir la prueba con binario simulado y las comprobaciones de contenido del registro, ejecutándola con `cwd` en un directorio temporal.
4. Correr solo el archivo de prueba y luego `bash pruebas/rapida.sh`.

## Criterios de aceptación
1. El lanzador pasa `bash -n` y sin argumento sale 2. Se comprueba con la primera orden de *Verificación*.
2. Con binario simulado, el registro tiene los argumentos esperados y el prompt como línea única. Se comprueba con la primera orden.
3. Ningún permiso permite Git mutante ni Bash genérico, y `.env` está denegado. Se comprueba con la primera orden.
4. La verificación rápida sigue en 0 y bajo 30 s. Se comprueba con la segunda orden.

## Verificación
```
node --test pruebas/lanzar-constructor.test.mjs
bash pruebas/rapida.sh
```
Esperado: la primera termina con `fail 0`; la segunda termina con `rapida: N archivos en S s (tope 30 s)` y código 0.

## Evidencia

Verificación 1 — `node --test pruebas/lanzar-constructor.test.mjs` (salida real, últimas líneas):
```
✔ lanzar-constructor-claude.sh: sintaxis Bash válida (3.914417ms)
✔ lanzar-constructor-claude.sh: sin argumento sale con código 2 y mensaje de uso (4.028833ms)
✔ lanzar-constructor-claude.sh: el modelo simulado recibe argumentos y el prompt como línea única (262.643792ms)
✔ lanzar-constructor-claude.sh: ningún permiso concede Git mutante ni Bash genérico (29.098792ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 395.578208
```

Verificación 2 — `bash pruebas/rapida.sh` (salida real, exit 0; últimas líneas):
```
✔ lanzar-constructor-claude.sh: sintaxis Bash válida (3.316666ms)
✔ lanzar-constructor-claude.sh: sin argumento sale con código 2 y mensaje de uso (2.432709ms)
✔ lanzar-constructor-claude.sh: el modelo simulado recibe argumentos y el prompt como línea única (163.982708ms)
✔ lanzar-constructor-claude.sh: ningún permiso concede Git mutante ni Bash genérico (12.291625ms)
ℹ tests 97
ℹ suites 0
ℹ pass 97
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 14534.638709
rapida: 14 archivos en 15 s (tope 30 s)
```
Código de salida de `rapida.sh`: 0.

Comprobación manual del caso sin argumento (salida real):
```
$ bash pruebas/lanzar-constructor-claude.sh; echo "exit=$?"
uso: lanzar-constructor-claude.sh RUTA_TAREA
exit=2
```

Archivos creados (sin commit): `pruebas/lanzar-constructor-claude.sh` (ejecutable), `pruebas/lanzar-constructor.test.mjs`. `git status --short` sobre ellos y sobre esta tarea: `??` para los tres.

Criterios de aceptación:
1. Cumplido: `bash -n` sin error y salida `uso: ...` con código 2 (prueba y comprobación manual).
2. Cumplido: el registro con binario simulado contiene `--agent`, `constructor`, `--permission-mode`, `dontAsk`, `Write(./**)`, `Bash(bash verificar.sh)`, `Read(./.env)`, y el prompt aparece exactamente una vez como línea completa (prueba 3).
3. Cumplido: no aparecen `Bash(git commit`, `Bash(git push` ni la línea `Bash(*)`; `Read(./.env)` y `Read(.env)` están en `--disallowedTools` (prueba 4 y el registro de la prueba 3).
4. Cumplido: `rapida.sh` termina en 0 con 15 s (tope 30 s).

El modelo real no se ejecutó (eso es task-05).

## Notas
- Huecos menores resueltos:
  - Orden de comprobaciones: el uso (`[[ $# == 1 ]]`) se valida antes que `FLUCASTR_RECORD_FILE`, así que sin argumento sale con 2 aunque falte la variable.
  - La ruta `RUTA_TAREA` se inserta tal cual en el prompt, sin validar su formato (la tarea no lo pedía).
  - Los permisos se copiaron literalmente de *Decisiones ya tomadas*; no se añadió ninguno.
  - Como `lanzar-claude.sh`, el lanzador no hace `cd`: se ejecuta desde el fixture.
- Las pruebas del registro usan `output.includes` para los argumentos; la comparación con líneas se reserva para el prompt, que debe ser una línea completa.
- Fuera de alcance respetado: no se tocaron `lanzar-claude.sh`, `lanzar-pi.sh`, `lanzadores.test.mjs`, `rapida.sh`, `ejecutar.sh`, `instalar.sh` ni `agentes/`. `STATUS.md` no se editó y no hubo commit ni push.
- Sin señal de tarea incompleta: los huecos fueron pocos y menores.
