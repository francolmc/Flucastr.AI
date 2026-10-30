# task-02 — Comprobación determinista: los agentes instalados usan el modelo de `modelos.json`
repo: Flucastr.AI   depende_de: task-01   estado: aprobada

## Descripción
Hoy la Capa 1 solo comprueba que el modelo resuelto «pertenece» a `modelos.json`, no que cada agente instalado (Claude Code y Pi) lleve el modelo que `modelos.json` le asigna ni que el lanzador de Pi lo resuelva al arrancar. Esta tarea añade una comprobación sin modelo ni red que compara, agente por agente, lo instalado contra lo que resuelve `scripts/resolver.mjs`, y que detecta una instalación desactualizada tras editar `modelos.json`.

## Contexto
- Repo único. Node ESM, `node:test`, sin dependencias. Leídos: `scripts/resolver.mjs` (`node scripts/resolver.mjs modelo <agente> <claude-code|pi>` imprime el modelo; los archivos generados añaden la línea `model: <modelo>` en el encabezado), `instalar.sh` (Claude: `$HOME/.claude/agents/<n>.md`, solo si existe `$HOME/.claude`; Pi: `$PI_CODING_AGENT_DIR/agents/<n>.md` y lanzador `$HOME/.local/bin/pi-<n>`, solo si existe `$PI_CODING_AGENT_DIR`; el lanzador contiene `resolver.mjs" modelo <n> pi` y se resuelve en cada arranque), `modelos.json` (agentes: arquitecto, planificador, coordinador en medio; constructor en bajo), `pruebas/capa1/instalacion.test.mjs` (patrón de entorno aislado con `HOME` y `PI_CODING_AGENT_DIR` temporales).
- Archivos a crear: `pruebas/comprobaciones/modelos-agentes.mjs` y `pruebas/comprobaciones/modelos-agentes.test.mjs`. `pruebas/rapida.sh` recoge todo `pruebas/comprobaciones/*.test.mjs` sin cambios.
- Comando: `node --test pruebas/comprobaciones/modelos-agentes.test.mjs`.

## Decisiones ya tomadas
- `modelos-agentes.mjs` exporta `comprobarModelos({ raiz, claudeDir, piDir, binDir })` que devuelve un arreglo de mensajes de error en español (vacío = todo bien). `raiz` es la carpeta con `agentes/`, `modelos.json` y `scripts/resolver.mjs`.
- Para cada `raiz/agentes/*.md` y cada herramienta cuyo directorio exista: el archivo instalado debe existir, tener exactamente una línea `model: X` en el encabezado y `X` debe ser igual a la salida de `node <raiz>/scripts/resolver.mjs modelo <agente> <herramienta>`. Para Pi, además `binDir/pi-<agente>` debe existir y contener `resolver.mjs" modelo <agente> pi` (garantiza que `pi --model` se resuelve de `modelos.json` en cada arranque).
- Mensaje de error: `<herramienta>/<agente>: instalado «X», modelos.json pide «Y»; reinstala con bash instalar.sh`.
- Ejecutado como script (`node pruebas/comprobaciones/modelos-agentes.mjs`) usa por defecto `raiz` = este repo, `claudeDir` = `$CLAUDE_CONFIG_DIR` o `~/.claude`, `piDir` = `$PI_CODING_AGENT_DIR` o `~/.pi/agent`, `binDir` = `~/.local/bin`; imprime los errores y sale con 1, o imprime `modelos de agentes instalados vigentes` y sale con 0. Solo lee archivos de agentes; no toca credenciales.
- La prueba usa carpetas temporales (`fs.mkdtempSync` en `os.tmpdir()`), copia `instalar.sh`, `desinstalar.sh`, `scripts`, `agentes`, `skills` y `modelos.json` a un repo temporal, crea `home/.claude` y `home/pi`, e instala con `bash instalar.sh` usando `HOME` y `PI_CODING_AGENT_DIR` de ese entorno. Nunca toca `~/.claude`, `~/.pi` ni `~/.flucastr-ai`.

## Alcance / Fuera de alcance
Alcance: la función, el modo script y las pruebas descritas.
Fuera de alcance: cambiar `instalar.sh` o `resolver.mjs`; registros de corridas con modelo (task-03 a task-05); editar `modelos.json`; el nivel real de cada agente.

## Pasos
1. Crear `modelos-agentes.mjs` con `comprobarModelos` y el modo script. Resultado: `node -e "import('./pruebas/comprobaciones/modelos-agentes.mjs')"` termina sin error.
2. Crear el test con tres casos: (a) tras `instalar.sh` en el entorno temporal, `comprobarModelos` devuelve `[]`; (b) tras copiar a la instalación temporal un `modelos.json` cambiado (constructor en `alto`) sin reinstalar, devuelve al menos un error que menciona `constructor`; (c) tras borrar `pi-constructor` de `binDir`, devuelve un error que menciona `pi-constructor`.
3. Correr la *Verificación*.

## Criterios de aceptación
1. Instalación recién hecha en entorno aislado: `[]`. Prueba (a).
2. `modelos.json` cambiado sin reinstalar: error que nombra al agente. Prueba (b). Nota: el cambio se aplica al `modelos.json` del repo temporal que usa el resolver, no a los archivos instalados.
3. Lanzador de Pi ausente: error que nombra al lanzador. Prueba (c).
4. El modo script sobre la instalación real sale con 0 o con 1 y mensajes legibles (no se exige 0: depende de que Franco haya reinstalado). Se comprueba ejecutándolo.
5. `bash pruebas/rapida.sh` sigue verde dentro del tope de 30 s.

## Verificación
```
node --test pruebas/comprobaciones/modelos-agentes.test.mjs
node pruebas/comprobaciones/modelos-agentes.mjs; echo "salida=$?"
bash pruebas/rapida.sh
```
Esperado: la primera con `fail 0`; la segunda imprime `modelos de agentes instalados vigentes` (salida=0) o líneas de error que terminan en `reinstala con bash instalar.sh` (salida=1); la tercera termina con `rapida: N archivos en S s (tope 30 s)` y código 0. Ejecutadas en la planificación: ninguna de las tres (los archivos aún no existen); `node scripts/resolver.mjs modelo constructor claude-code` y la lectura de `~/.claude/agents/constructor.md` (`model: claude-haiku-5-5`) sí se leyeron.

## Evidencia

Rama: `feature/F07-modelo-por-agente` creada con `git switch -c` (no existía). Archivos nuevos: `pruebas/comprobaciones/modelos-agentes.mjs` y `pruebas/comprobaciones/modelos-agentes.test.mjs`.

1. `node --test pruebas/comprobaciones/modelos-agentes.test.mjs; echo "salida=$?"`
```
✔ (a) tras instalar.sh en entorno aislado no hay errores (1257.4815ms)
✔ (b) modelos.json cambiado sin reinstalar: error que nombra al constructor (1286.942208ms)
✔ (c) lanzador pi-constructor ausente: error que nombra al lanzador (1268.938667ms)
ℹ tests 3
ℹ suites 0
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3893.399584
salida=0
```

2. `node pruebas/comprobaciones/modelos-agentes.mjs; echo "salida=$?"` (instalación real de esta máquina)
```
modelos de agentes instalados vigentes
salida=0
```

3. `bash pruebas/rapida.sh; echo "salida=$?"`, dos corridas. Las dos dieron el mismo resultado: `tests 146`, `pass 145`, `fail 1`, `salida=1`. El único fallo es ajeno a esta tarea:
```
✖ definitions/BACKLOG.md real cumple el formato (0.744709ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
  + [
  +   'La tabla debe tener entre 1 y 6 features; tiene 10.',
  +   'Falta la línea «Estado del documento: borrador» o «Estado del documento: aprobado».'
  + ]
  - []
  (test en pruebas/comprobaciones/formato-flujo.test.mjs:121)
```
La línea final `rapida: N archivos en S s (tope 30 s)` no se imprime porque `node --test` sale con error y el script se detiene antes. Los 3 tests de `modelos-agentes.test.mjs` aparecen en la corrida y pasan. El fallo viene de `definitions/BACKLOG.md`, que ya tenía una edición sin confirmar (`git diff --stat`: 8 inserciones, 2 borrados). El archivo tiene 10 features en la tabla y la línea `Estado del documento: aprobado (Franco, 2026-10-29; ...)` no coincide con el formato esperado. Ese archivo no lo toqué.

Criterios de aceptación:
1. Instalación recién hecha: `[]`, prueba (a). Cumple.
2. `modelos.json` cambiado sin reinstalar: error que nombra a `constructor`, prueba (b). Cumple.
3. Lanzador ausente: error que nombra a `pi-constructor`, prueba (c). Cumple.
4. Modo script: sale con 0 y muestra `modelos de agentes instalados vigentes`. Cumple.
5. `bash pruebas/rapida.sh` verde dentro del tope de 30 s: NO cumple. Falla por el BACKLOG ajeno descrito arriba.

## Notas

- Huecos menores resueltos (decisión conservadora):
  - Nombres de herramienta en los mensajes: `claude-code` y `pi`, los mismos que usa `resolver.mjs`.
  - El modo script imprime los errores con `console.log` (stdout), para que `echo "salida=$?"` y la salida se vean juntos.
  - La prueba usa `fs.mkdtempSync` en `os.tmpdir()` (como indica la tarea), no `pruebas/.temporales`, y borra su carpeta al terminar con `after()`.
  - El encabezado se lee entre las dos líneas `---`; cuenta solo las líneas que empiezan con `model:`.
- Bloqueo: la tarea queda `bloqueada` porque la misma verificación (`bash pruebas/rapida.sh`) falló dos veces por la misma causa, según la skill. La causa está fuera del alcance de la tarea: la edición sin confirmar de `definitions/BACKLOG.md` que hace fallar `definitions/BACKLOG.md real cumple el formato`. No la corregí porque no es mía ni está en *Alcance*.
- Para desbloquear: decidir sobre la edición de `definitions/BACKLOG.md` (confirmarla, con el formato que espera la prueba, o ajustar la prueba). Después volver a correr `bash pruebas/rapida.sh`.
- Sin commit, push, PR, merge ni despliegue. No se tocó `definitions/STATUS.md`.

BLOQUEO: rol=planificador; motivo=la verificación bash pruebas/rapida.sh falla dos veces por la misma causa ajena a la tarea: la edición sin confirmar de definitions/BACKLOG.md (10 features en la tabla y la línea de estado fuera de formato) hace fallar formato-flujo.test.mjs «definitions/BACKLOG.md real cumple el formato».
