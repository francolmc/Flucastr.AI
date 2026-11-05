# task-10 — pruebas de ciclo del hook: control de JSON inválido y suite verde
repo: Flucastr.AI   depende_de: task-06   estado: hecha

## Descripción
Cierra las pruebas de ciclo del hook en `pruebas/capa1/hook-claude.test.mjs`: instalar, reinstalar, `--simular`, hook ajeno, desinstalar y desinstalación completa (ya escritos) y el caso de control de JSON inválido, que pasa a esperar que `instalar.sh --proyecto` salga con 1 y no toque el archivo. Al terminar, `bash pruebas/rapida.sh` termina en 0.

## Contexto
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- Tocar: `pruebas/capa1/hook-claude.test.mjs`
- Requiere: runtime:node@25
- De task-06 lee solo sus *Notas*.
- `pruebas/capa1/hook-claude.test.mjs`: casos de ciclo en las líneas 246-337; el caso de control está en las líneas 313-324 (`test('ciclo: control, settings.local.json inválido: instalar termina con 0, con AVISO y sin tocar el archivo', ...)`) y hoy hace `exito(r)` y `assert.match(r.stdout, /AVISO/)`. Helpers: `exito(r)` (línea 244), `lineasHook(e)` (línea 243), `crearProyectoCiclo`, `entorno`.
- Comportamiento real (confirmado en el intento previo): con `settings.local.json` inválido, `fijar_agente_proyecto` hace salir a `instalar.sh` con 1 y el stderr contiene `no es JSON válido ... no lo toco`.
- Temporales: las pruebas escriben en `pruebas/.temporales/` (ignorada por git). No uses `/tmp`.

## Decisiones ya tomadas
- Decisión de Franco: el control pasa a «`instalar.sh --proyecto` sale con 1 y no toca el archivo». No se cambia `fijar_agente_proyecto`.
- Nuevo título del caso: `ciclo: control, settings.local.json inválido: instalar sale con 1 y no toca el archivo`.
- Aserciones del caso: `r.status === 1`; `r.stderr` coincide con `/no es JSON válido/`; el contenido del archivo sigue siendo `'{ no es json'`; `lineasHook(e).length === 0`. Se elimina la aserción sobre `AVISO`.
- Los otros casos de ciclo no cambian.

## Decisiones abiertas

Ninguna

## Alcance / Fuera de alcance
Alcance: el caso de control y la verificación de toda la suite.
Fuera de alcance: `instalar.sh`, `desinstalar.sh`, `compactacion.test.mjs` (task-06), `fijar_agente_proyecto`, `agentes/coordinador.md` y `README.md`.

## Pasos
1. En `pruebas/capa1/hook-claude.test.mjs`, reescribe el caso de control (líneas 313-324) según *Decisiones ya tomadas*. Resultado: el caso pasa.
2. Ejecuta el archivo completo y `bash pruebas/rapida.sh`; si algo distinto falla, detente con bloqueo en vez de ampliar el alcance.
3. Borra de `pruebas/.temporales/` los temporales que dejes tú al terminar.

## Criterios de aceptación
1. El caso de control pasa con las aserciones indicadas. Se comprueba con `node --test`.
2. Todos los casos de `hook-claude.test.mjs` pasan.
3. `bash pruebas/rapida.sh` termina en 0.

## Verificación
```
git branch --show-current
node --test pruebas/capa1/hook-claude.test.mjs
bash pruebas/rapida.sh
```
Esperado: primera salida `fix/F38-validador-causal-tareas`; `fail 0`; `rapida.sh` con `exit 0`.

## Evidencia

```
$ git branch --show-current
fix/F38-validador-causal-tareas
exit 0
```

```
$ node --test pruebas/capa1/hook-claude.test.mjs
✔ ciclo: control, settings.local.json inválido: instalar sale con 1 y no toca el archivo (237.623958ms)
✔ ciclo: desinstalación completa deja el HOME y el proyecto como al principio, sin tocar ~/.claude/settings.json (657.099459ms)
ℹ tests 17
ℹ pass 17
ℹ fail 0
ℹ duration_ms 5534.177041
exit 0
```

```
$ bash pruebas/rapida.sh
ℹ tests 807
ℹ pass 807
ℹ fail 0
rapida: 55 archivos en 34 s (tope 90 s)
exit 0
```

## Notas
- Caso de control reescrito según la decisión de Franco: `instalar --proyecto` sale con 1, stderr `/no es JSON válido/`, archivo intacto, sin línea hook. Se quitó la aserción sobre `AVISO`. `fijar_agente_proyecto` no se tocó.
- Entorno: `node ~/.flucastr-ai/entorno.mjs` devolvió `ok`. La rama ya era la actual; no se ejecutó ningún comando git de escritura.
- Temporales: quité de `pruebas/.temporales/` solo las carpetas creadas en esta ejecución (mtime reciente). Quedan ~2600 de ejecuciones anteriores, que no son mías.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
