# task-07 — Script de corrida del hook en Claude Code (con modelo simulado)
repo: Flucastr.AI   depende_de: task-06   estado: hecha

## Descripción
Se construye `pruebas/correr-hook.sh`, que arma un proyecto temporal con el hook instalado, lanza Claude Code (`claude -p`) en cuatro escenarios y escribe un informe con veredicto. Solo MIDE: la corrida con modelo real es task-08. Aquí se prueba con un `claude` simulado (`FLUCASTR_CLAUDE_BIN`), como hizo F41 con `pruebas/correr-rol.sh`.

## Contexto
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- Tocar: `pruebas/correr-hook.sh`, `pruebas/comprobaciones/hook-resultado.mjs`, `pruebas/correr-hook.test.mjs`
- Requiere: runtime:node@25
- Modelo del script: `pruebas/correr-rol.sh` (precondición, `FLUCASTR_RESULTADOS`, informe `<fecha>-rol-<herramienta>-<k>.md`, «Veredicto: OK|FALLA») y su comprobador `pruebas/comprobaciones/rol-resultado.mjs`; modelo del lanzador: `pruebas/lanzar-coordinador-claude.sh` (`claude -p --permission-mode dontAsk --output-format stream-json --verbose --allowedTools …`, `FLUCASTR_CLAUDE_BIN`).
- Cada comando de *Verificación* debe correr en ≤180 s con modelo real, por eso cada escenario es una invocación aparte y `informe` los reúne.
- Hook ya disponible: `node scripts/resolver.mjs fijar-hook claude <settings.local.json>` (task-05) y `node ~/.flucastr-ai/validar-tarea.mjs --hook` (task-04).

## Decisiones ya tomadas
- Uso: `bash pruebas/correr-hook.sh claude-code <danada|valida|subagente|sin-hook|informe>`; otra combinación sale con 2. Directorio de trabajo: `pruebas/.temporales/hook-claude-code/<escenario>/` (se recrea en cada escenario); salida cruda en `<escenario>.jsonl` al lado.
- Precondición: `node ~/.flucastr-ai/validar-tarea.mjs --hook < /dev/null` sale 0 y `~/.flucastr-ai/raiz` apunta a este repo; si no, sale 2 con mensaje. Se omite con `FLUCASTR_SIN_PRECONDICION=1` (para la prueba).
- Proyecto del escenario: `git init -q`; `.claude/settings.local.json` creado con `fijar-hook` (salvo `sin-hook`); `.claude/agents/escritor.md` con `name: escritor`, `description` y un cuerpo que dice que solo escribe el archivo que se le pida. El contenido a escribir está en el script (heredoc): `danada` y `subagente` escriben `features/F99-demo/task-01-x.md` con un bloque «```sh» abierto en *Evidencia* (mismo formato que el fixture de task-01); `valida` escribe una tarea válida y completa; `sin-hook` repite la dañada sin hook.
- Lanzador: `--allowedTools 'Write(./features/**)' 'Edit(./features/**)' 'Read(./**)' 'Agent' 'Task'`, `--no-session-persistence`, `--output-format stream-json --verbose`, sin `CLAUDE_CODE_SUBAGENT_MODEL` (si está definida, sale 2). En `subagente` el prompt exige usar el subagente `escritor`.
- Veredicto (en `hook-resultado.mjs`, función `informeHook({ dir })` que devuelve `{ ok, informe }`): `danada` OK si el `.jsonl` contiene «bloque de código abierto en línea»; `valida` OK si NO lo contiene y el archivo existe; `sin-hook` OK si NO lo contiene; `subagente` OK si lo contiene y el `.jsonl` registra una llamada a la herramienta de subagente (`"name":"Agent"` o `"name":"Task"`). Escenario sin `.jsonl` = FALLA. El informe va a `pruebas/resultados/<fecha>-hook-claude-code-<k>.md` (con `FLUCASTR_RESULTADOS`) con el modelo (campo `model` del primer evento `system`/`init`) y la cola del texto final por escenario.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: el script, el comprobador y la prueba con `claude` simulado (un script de shell que escribe líneas JSON fijas según el prompt).
Fuera de alcance: la corrida real, Pi, cambios a `settings` globales, y cualquier cambio al hook.

## Pasos
1. Crea `pruebas/comprobaciones/hook-resultado.mjs` con `informeHook`.
2. Crea `pruebas/correr-hook.sh` según las decisiones (`set -euo pipefail`, un escenario por invocación, `informe` reúne los cuatro).
3. Crea `pruebas/correr-hook.test.mjs`: con un `claude` simulado en `pruebas/.temporales/`, corre los cuatro escenarios con `FLUCASTR_SIN_PRECONDICION=1` y `FLUCASTR_RESULTADOS` temporal; espera «Veredicto: OK». Controles negativos: un simulado que no menciona el bloqueo hace FALLA en `danada`; uno que sí lo menciona en `valida` hace FALLA; sin `.jsonl` es FALLA; escenario desconocido sale 2.
4. Comprueba que el script no escribe fuera de `pruebas/.temporales/` y `pruebas/resultados/`.

## Criterios de aceptación
1. Con el simulado correcto, `informe` imprime «Veredicto: OK» y crea el informe. Se comprueba en `correr-hook.test.mjs`.
2. Los tres controles negativos dan FALLA.
3. Un escenario o herramienta desconocidos salen con 2.
4. `bash pruebas/rapida.sh` termina en 0.

## Verificación
```
git branch --show-current
node --test pruebas/correr-hook.test.mjs
bash pruebas/correr-hook.sh pi danada; echo "exit $?"
bash -n pruebas/correr-hook.sh; echo "sintaxis $?"
bash pruebas/rapida.sh
```
Esperado: primera salida `fix/F38-validador-causal-tareas`; la prueba con `fail 0`; el comando 3 imprime `exit 2`; `sintaxis 0`; `rapida.sh` con `exit 0`.

## Evidencia

```text
$ git branch --show-current
fix/F38-validador-causal-tareas
exit 0
```

```text
$ node --test pruebas/correr-hook.test.mjs
ℹ tests 6
ℹ suites 0
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1756.052166
exit 0
```

```text
$ bash pruebas/correr-hook.sh pi danada; echo "exit $?"
uso: correr-hook.sh claude-code <danada|valida|subagente|sin-hook|informe>
exit 2
exit 0
```

```text
$ bash -n pruebas/correr-hook.sh; echo "sintaxis $?"
sintaxis 0
exit 0
```

```text
$ bash pruebas/rapida.sh
✔ lanzar-constructor-claude.sh: .env sigue denegado y no hay Bash genérico ni Git mutante (29.635708ms)
ℹ tests 813
ℹ suites 0
ℹ pass 813
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 39721.658292
rapida: 56 archivos en 40 s (tope 90 s)
exit 0
```

Criterios: 1 (informe OK con simulado correcto) y 2 (controles negativos danada, valida y sin .jsonl en FALLA) cubiertos por `correr-hook.test.mjs` (pruebas 1 a 4); 3 (escenario y herramienta desconocidos con 2) por las pruebas 5 y 6 y por el comando `pi danada`; 4 (`rapida.sh` en 0) por la última corrida.

## Notas
- Huecos menores resueltos:
  1. Precondición (`~/.flucastr-ai/validar-tarea.mjs --hook` y `~/.flucastr-ai/raiz`) se aplica también a `informe`, por coherencia con `correr-rol.sh`. Se omite con `FLUCASTR_SIN_PRECONDICION=1`.
  2. El contenido de las tareas (danada/valida) se escribe con heredoc a `pruebas/.temporales/hook-claude-code/contenido-*.md` y el prompt lo lee con `cat`. Un heredoc dentro de `$(...)` con backticks no parsea en bash.
  3. `sin .jsonl` se prueba borrando `danada.jsonl` tras una corrida completa y ejecutando `informe`.
  4. El repo de `pruebas/resultados/` no se toca en las pruebas: `FLUCASTR_RESULTADOS` apunta a un temporal que el test borra. Los temporales del script (`hook-claude-code/`) también los borra el test.
- Comprobación de escritura: el script escribe solo en `pruebas/.temporales/hook-claude-code/` (escenarios, `.jsonl` y `contenido-*.md`) y en `$FLUCASTR_RESULTADOS` o `pruebas/resultados/` (solo al pedir `informe`). `git status` tras la corrida no muestra archivos nuevos fuera de esas rutas.
- Un temporal propio de esta ejecución (`rapida-task07.log`) se borró; los demás de `pruebas/.temporales/` son de corridas anteriores y no se tocaron.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=4; resultado=lista; causa=ninguna
