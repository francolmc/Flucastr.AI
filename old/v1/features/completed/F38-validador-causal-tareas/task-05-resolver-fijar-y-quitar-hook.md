# task-05 — Resolver: fijar y quitar el hook en settings.local.json
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
Se agregan al resolver las órdenes `fijar-hook` y `quitar-hook`, que escriben y deshacen el hook `PostToolUse` del validador en el `settings.local.json` de un proyecto, con el patrón de `fijar-compactacion claude` (F19): no pisa lo ajeno, tiene `--simular` y la desinstalación es exacta. Esta tarea solo toca el resolver y su prueba; `instalar.sh` y `desinstalar.sh` son de task-06.

## Contexto
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- Tocar: `scripts/resolver.mjs`, `pruebas/capa1/hook-claude.test.mjs`, `pruebas/rapida.sh`
- Requiere: runtime:node@25
- `scripts/resolver.mjs`: `ajustesDeObjeto(ruta)` (lee el JSON o falla si no es objeto), `escribirAtomico(ruta, objeto)`, `fijarCompactacionClaude(ruta, simular)` (líneas 381-399) y `quitarCompactacionClaude(ruta, valor)` (401-419) son el modelo; el despacho de órdenes está al final (líneas ~480-506) con un mensaje de uso en la última rama.
- `pruebas/rapida.sh` línea 7: lista explícita de archivos de `pruebas/capa1/` (`instalacion`, `copia`, `skills-proyecto`, `compactacion`); el archivo nuevo se agrega ahí.
- `pruebas/capa1/compactacion.test.mjs` es el modelo de la prueba (HOME falso en `pruebas/.temporales/`, nunca toca `~/.claude`).
- No ejecutado, inferido: forma del ajuste de Claude Code `{"hooks":{"PostToolUse":[{"matcher":"…","hooks":[{"type":"command","command":"…"}]}]}}`; task-08 lo confirma con Claude Code real.

## Decisiones ya tomadas
- Órdenes: `fijar-hook claude <settings.json> [--simular]` y `quitar-hook claude <settings.json>`. Imprimen una palabra: `fijado`, `ya-estaba`, `omitido` (quitar sin nada que quitar) o `quitado` / `archivo-quitado`.
- Entrada que se agrega a `hooks.PostToolUse`: `{"matcher":"Write|Edit|MultiEdit","hooks":[{"type":"command","command":"node ~/.flucastr-ai/validar-tarea.mjs --hook"}]}`.
- `fijar-hook`: si ya hay una entrada cuyo `hooks` contiene exactamente ese `command`, `ya-estaba`. Si hay otras entradas de `PostToolUse` o de otros eventos del usuario, las conserva y agrega la nuestra al final. Si `hooks` o `PostToolUse` existen con tipo inesperado (no objeto / no arreglo), falla con mensaje y no toca el archivo. Conserva las demás claves (`agent`, `autoCompactWindow`).
- `quitar-hook`: quita solo las entradas cuyo único hook es nuestro `command` exacto; si `PostToolUse` queda vacío, borra la clave; si `hooks` queda vacío, borra la clave; si el objeto queda vacío, borra el archivo (`archivo-quitado`); si no, `quitado`. Una entrada ajena con nuestro comando más otros hooks no se toca.
- Nunca se escribe `~/.claude/settings.json`: el resolver rechaza (sale con error) una ruta cuyo basename no sea `settings.local.json`.
- Escritura atómica con `escribirAtomico`, igual que `quitar-agente`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: las dos órdenes del resolver, su línea de uso, la prueba y el alta en `rapida.sh`.
Fuera de alcance: `instalar.sh`, `desinstalar.sh`, el manifiesto y Pi.

## Pasos
1. En `scripts/resolver.mjs`, escribe `fijarHookClaude(ruta, simular)` y `quitarHookClaude(ruta)` y despáchalas; actualiza el mensaje de uso.
2. Crea `pruebas/capa1/hook-claude.test.mjs` que ejecuta el resolver como proceso sobre archivos en `pruebas/.temporales/`.
3. Casos: archivo inexistente → `fijado` y contenido exacto; segunda vez → `ya-estaba`; con `agent` y un hook ajeno de `PostToolUse` → se conservan y el nuestro queda al final; `--simular` no escribe; JSON inválido → error y archivo intacto; `hooks` con tipo inesperado → error e intacto; ruta que no es `settings.local.json` → error.
4. `quitar-hook`: deja el archivo idéntico al de antes (comparar bytes tras fijar y quitar sobre un archivo con `agent` y un hook ajeno); si solo estaba el hook, `archivo-quitado`; sin nuestro hook, `omitido` y archivo intacto.
5. Agrega `pruebas/capa1/hook-claude.test.mjs` a la lista de `pruebas/rapida.sh`.

## Criterios de aceptación
1. `fijar-hook` es idempotente y conserva claves y hooks ajenos. Se comprueba en `hook-claude.test.mjs`.
2. `fijar-hook` seguido de `quitar-hook` deja el archivo byte a byte como estaba. Misma prueba.
3. `--simular`, el JSON inválido y la ruta que no es `settings.local.json` no cambian ningún archivo.
4. `bash pruebas/rapida.sh` termina en 0 e incluye el archivo nuevo.

## Verificación
```
git branch --show-current
node --test pruebas/capa1/hook-claude.test.mjs
grep -c hook-claude pruebas/rapida.sh
bash pruebas/rapida.sh
```
Esperado: primera salida `fix/F38-validador-causal-tareas`; la prueba con `fail 0`; el `grep -c` imprime `1`; `rapida.sh` con `exit 0`.

## Evidencia

```
$ git branch --show-current
fix/F38-validador-causal-tareas
exit 0

$ node --test pruebas/capa1/hook-claude.test.mjs
✔ fijar-hook en archivo inexistente: fijado y contenido exacto
✔ fijar-hook por segunda vez: ya-estaba y el archivo no cambia
✔ fijar-hook conserva agent y un hook ajeno de PostToolUse; el nuestro queda al final
✔ fijar-hook --simular no escribe, ni en archivo nuevo ni en uno existente
✔ fijar-hook con JSON inválido: error y archivo intacto
✔ fijar-hook con hooks o PostToolUse de tipo inesperado: error y archivo intacto
✔ fijar-hook y quitar-hook solo aceptan settings.local.json
✔ fijar-hook seguido de quitar-hook deja el archivo byte a byte igual
✔ quitar-hook cuando solo estaba el hook: archivo-quitado
✔ quitar-hook sin nuestro hook: omitido y archivo intacto
ℹ tests 10
ℹ pass 10
ℹ fail 0
exit 0

$ grep -c hook-claude pruebas/rapida.sh
1
exit 0

$ bash pruebas/rapida.sh
ℹ tests 800
ℹ pass 800
ℹ fail 0
rapida: 55 archivos en 35 s (tope 90 s)
exit 0
```

## Notas
Huecos menores resueltos:
- `fijar-hook` considera «ya estaba» cualquier entrada de `PostToolUse` que tenga un hook con ese `command` exacto, aunque tenga otros hooks junto al nuestro (interpretación de «contiene exactamente ese command»).
- `quitar-hook` borra solo las entradas cuyo único hook es nuestro `command` exacto (según la tarea); las que tienen otro hook junto al nuestro no se tocan.
- `quitar-hook` con `hooks` o `PostToolUse` de tipo inesperado, o sin nuestro hook, responde `omitido` y no toca el archivo (no falla): no hay nada que quitar, y así no bloquea una desinstalación. `fijar-hook` sí falla con ese tipo inesperado, como pide la tarea.
- `quitar-hook` sobre un archivo inexistente responde `omitido` (la tarea no lo cubría).
- La comprobación de nombre `settings.local.json` se aplica también a `quitar-hook`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=5; resultado=lista; causa=ninguna
