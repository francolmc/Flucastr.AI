# task-05 — CLI `node scripts/consumo.mjs --raiz <dir>` e informe sin texto de mensajes
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
Cierra `scripts/consumo.mjs`: descubre las sesiones bajo una carpeta, elige el parser por formato, imprime el informe (por sesión y por rol, normalizable por tarea construida) y garantiza que la salida no contiene texto de mensajes ni de encargos. Es solo lectura. Lo ejecuta Franco (no está en la lista de comandos del `coordinador`, `definitions/WORKFLOW.md` §3.1).

## Contexto
- Leer `scripts/consumo.mjs` (task-01 a 04) y, para opciones y errores, `scripts/archivar.mjs` líneas 270-330 (`leerArgumentos`, `RUTA_ESTE`, mensajes `error: …` a stderr, código 1).
- Carpetas reales (confirmadas): Pi `~/.pi/agent/sessions/--<ruta-del-proyecto>--/` con `<ts>_<id>.jsonl` y, al lado, `subagent-artifacts/`; Claude Code `~/.claude/projects/<proyecto>/` con `<id>.jsonl` y `<id>/subagents/`. Un registro Pi comienza con `{type:"session"}`; uno de Claude Code no.
- Cifra de aceptación que comprueba Franco (leída en la sesión de Cleaner): cortando en `--hasta 2026-11-01T00:48:34.046Z` salen 216 turnos, 26 llamadas a subagente y costo 2.088 (la sesión siguió creciendo: completa tiene 247, 30 y 2.39).
- Tocar: `scripts/consumo.mjs`, `pruebas/comprobaciones/consumo.test.mjs`.

## Decisiones ya tomadas
- Uso: `node scripts/consumo.mjs --raiz <dir> [--hasta <ISO>] [--tareas <n>] [--json]`. `--raiz` es obligatorio (sin valor por defecto, para no recorrer logs ajenos por accidente) y no puede repetirse; cualquier otro argumento o `--tareas` no entero ≥1 es `error: …` en stderr con código 1. Éxito: código 0.
- Descubrimiento: recorre `--raiz` recursivamente, toma los `*.jsonl` que no estén dentro de `subagent-artifacts/` ni de `subagents/`, y decide el formato por la primera línea JSON válida (`type:"session"` → Pi; si no → Claude Code). Para Pi, subagentes = `subagent-artifacts/` del mismo directorio, filtrados por el `id` de la sesión; para Claude Code, `<nombre-sin-extensión>/subagents/`. Orden de salida: por nombre de archivo.
- Informe de texto, por sesión: encabezado `herramienta | rol | archivo (nombre base)`; líneas de turnos, costo (`n/d` si es `null`; 3 decimales en US$), tokens, tramos, tipos de turno, llamadas a subagentes, `subagents_enable`, turnos por llamada; tabla por rol de subagentes; KB leídos por categoría y los 5 archivos más leídos del `coordinador`; si no hay lecturas de `definitions/`, la línea exacta `KB de definitions/ leídos por el coordinador: 0`. Con `--tareas n`: líneas `costo por tarea` y `turnos por tarea` (dividido por n, 2 decimales; `n/d` si no hay costo). Al final, la nota «Solo se cuentan lecturas con la herramienta read; lo leído por bash no se mide.»
- `--json` imprime el mismo contenido como un objeto JSON (`{ sesiones: [...] }`) con los campos de los parsers.
- No contenido: la salida solo incluye números, nombres de rol/agente/modelo/herramienta y rutas de archivos leídos. Nunca `text`, `thinking`, `task`, `command`, `content` ni `summary`.
- Sin escritura: el script no crea ni modifica archivos.

## Alcance / Fuera de alcance
Alcance: CLI, descubrimiento, informe y prueba de no-contenido.
Fuera de alcance: comparar dos corridas o calcular la meta de §2.6 (lo hace Franco leyendo dos informes); permiso del `coordinador` para correrlo; documentación (task-06); estimar costo en Claude Code.

## Pasos
1. En `scripts/consumo.mjs`, agregar `leerArgumentos`, `descubrirSesiones(raiz)`, `formatearInforme(sesiones, { tareas })` y el bloque de ejecución directa.
2. En `consumo.test.mjs`, agregar pruebas con `spawnSync(process.execPath, [SCRIPT, '--raiz', raiz])` sobre una raíz temporal con una sesión Pi (+ `subagent-artifacts/`) y una de Claude Code: la salida contiene `turnos` y el costo esperados, `KB de definitions/ leídos por el coordinador: 0` cuando no hay lecturas, y 2 en su caso; `--tareas 2` divide; `--hasta` corta; `--json` es JSON válido; código 1 y `error:` sin `--raiz`, con `--raiz` repetido, con `--tareas 0` y con un argumento desconocido.
3. Prueba de no-contenido: la raíz de fixtures lleva `CENTINELA_TEXTO` en textos, `thinking`, `task`, `command` y `content`; ni el informe ni `--json` lo contienen (stdout y stderr). Control negativo: la misma comprobación aplicada al texto de un fixture sin filtrar (una línea cruda del `.jsonl`) sí detecta el centinela, para probar que el detector funciona.
4. Prueba de solo lectura: el contenido de la raíz (nombres y tamaños) es idéntico antes y después de correr.
5. Correr las pruebas y `bash pruebas/rapida.sh`.

## Criterios de aceptación
1. `node scripts/consumo.mjs --raiz <dir>` imprime las cifras esperadas de los fixtures de Pi y de Claude Code, con KB leídos por rol.
2. Errores de argumentos: stderr `error: …`, código 1.
3. La salida (texto y `--json`) no contiene el centinela y el control negativo lo detecta.
4. La raíz no cambia tras ejecutar.
5. `bash pruebas/rapida.sh` pasa bajo 30 s.

## Verificación
- `node --test pruebas/comprobaciones/consumo.test.mjs` → `fail 0`.
- `bash pruebas/rapida.sh` → última línea `rapida: N archivos en S s (tope 30 s)` con S ≤ 30 y código 0.
- `node scripts/consumo.mjs` → stderr `error: …`, código 1.
- Comprobación de Franco (no del constructor): `node scripts/consumo.mjs --raiz ~/.pi/agent/sessions/--Users-franco-Codes-flucastr-Flucastr.Cleaner-- --hasta 2026-11-01T00:48:34.046Z` → 216 turnos, 26 llamadas a subagente, costo ≈ US$2.09 (±5 % de 2.08).

## Evidencia
```
$ node --test pruebas/comprobaciones/consumo.test.mjs
ℹ tests 43
ℹ pass 43
ℹ fail 0

$ bash pruebas/rapida.sh   (última línea; código 0)
rapida: 28 archivos en 18 s (tope 30 s)

$ node scripts/consumo.mjs   (sin --raiz)
error: falta --raiz <dir>      código 1
```
Cifra de Franco (cortando en `--hasta 2026-11-01T00:48:34.046Z` sobre `~/.pi/...--Cleaner--`): no se ejecutó; la deja Franco.

## Notas
- Huecos menores resueltos:
  1. Sesión de Pi: rol fijo `coordinador` (como dice el comentario de `analizarSesionPi`; los logs de Pi no traen rol).
  2. `--hasta` no se aplica a los subagentes de Claude Code: `analizarSubagentesClaude` no admite `hasta` y no se cambió el parser (solo se anota aquí).
  3. Un `.jsonl` sin ninguna línea JSON válida se omite (no es sesión); un `.jsonl` con formato no reconocido se toma como Claude Code, según la tarea.
- Formato: la «tabla por rol» se imprime como líneas con `|`; la línea `KB de definitions/ leídos por el coordinador: N` sale sin sangría para que el caso 0 sea la línea exacta.
- Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
