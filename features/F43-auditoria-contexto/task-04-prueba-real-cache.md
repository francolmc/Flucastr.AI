# task-04 — Prueba real del caché en Claude Code y Pi
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
Corre dos lanzamientos seguidos con el mismo prompt en Claude Code y otros dos en Pi, y compara `input`, `cacheRead` y `cacheWrite` del log para medir cuánto del contexto se reutiliza. Esta tarea gasta créditos del proveedor: solo se ejecuta con visto bueno expreso de Franco; sin él, el constructor se detiene antes del paso 2 sin lanzar nada. El resultado queda en `prueba.md`.

## Contexto
- Leer: `features/F43-auditoria-contexto/mecanismos.md`, `definitions/F43-AUDITORIA.md@25-8`
- Tocar: `features/F43-auditoria-contexto/prueba.md`
- Binarios presentes (*confirmado* con `which`): `claude` en `/opt/homebrew/bin/claude` y `pi` en `/Users/franco/.local/bin/pi`. Forma de lanzar Pi: `pi --mode json --no-session -p "<texto>"`, como en `pruebas/lanzar-pi.sh` (no ejecutado, inferido para este prompt). Forma de Claude Code: `claude -p "<texto>" --output-format json` (no ejecutado, inferido).
- Los logs de sesión se miden con `node scripts/consumo.mjs --raiz <carpeta>` y la salida de lanzamiento se guarda fuera del repo en el directorio temporal de la sesión.
- De `depende_de:` leer solo las *Notas* de task-03 y su sección `## Para la prueba`.
- Fuente: definitions/F43-AUDITORIA.md «3. Verificación de caché o resumen compartido»
- Requiere: red, runtime:node@25

## Decisiones ya tomadas
- Autorización: el encargo debe traer la frase literal «Franco autoriza la prueba real de F43». Sin ella, no se lanza nada y se informa el motivo en *Notas*.
- Prompt de la prueba (idéntico en las cuatro corridas): «Lee definitions/F43-AUDITORIA.md y responde solo con su primera línea.». Sin herramientas extra ni subagentes; 2 corridas por herramienta, una tras otra.
- Se miden `input`, `cacheRead` y `cacheWrite` de cada corrida y el ahorro = `cacheRead` de la segunda / (`input` + `cacheRead` + `cacheWrite`) de la segunda, en porcentaje con 1 decimal. Dato ausente: `n/d`, sin estimar.
- Máximo 4 lanzamientos con modelo en total; si uno falla no se reintenta más de una vez.
- Se prueba solo el mecanismo de caché del proveedor sobre el mismo prefijo; no se implementa ningún resumen ni caché propio (si task-03 marcó «ninguno verificable», se prueba igualmente solo el caché del proveedor).
- `prueba.md` tiene `## Corridas` (tabla por herramienta y corrida) y `## Resultado` (ahorro por herramienta y una línea sobre si el campo de caché venía en el log).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: las 4 corridas y `prueba.md`.
Fuera de alcance: más corridas, cambiar `scripts/`, agentes, skills, topes, la recomendación (task-05), el commit.

## Pasos
1. Corre `git branch --show-current` y comprueba la frase de autorización del encargo; si falta, detente sin lanzar nada.
2. Lanza dos veces seguidas el prompt de la prueba con `claude -p ... --output-format json` y guarda cada salida fuera del repo. Resultado: dos archivos con campos de uso.
3. Lanza dos veces seguidas el mismo prompt con `pi --mode json --no-session -p ...` y guarda cada salida fuera del repo. Resultado: dos archivos con campos de uso.
4. Extrae `input`, `cacheRead` y `cacheWrite` de cada corrida y calcula el ahorro de la segunda.
5. Escribe `## Corridas` y `## Resultado` en `prueba.md`.
6. Corre la verificación y copia la salida en *Evidencia*.

## Criterios de aceptación
1. Rama `chore/F43-auditoria-contexto` (comando 1).
2. `prueba.md` tiene `## Corridas` y `## Resultado` (comando 2).
3. `## Corridas` registra 4 filas de corrida, o `n/d` explícito si una herramienta no devolvió uso (comando 3).
4. Ningún archivo versionado fuera de `features/F43-auditoria-contexto/` cambió por esta tarea (comando 4).

## Verificación
```
git branch --show-current
grep -c '^## Corridas\|^## Resultado' features/F43-auditoria-contexto/prueba.md
grep -c '^| \(claude\|pi\) | [12] |' features/F43-auditoria-contexto/prueba.md
git status --short
```
Esperado: rama `chore/F43-auditoria-contexto`; `2`; `4`; en `git status` solo rutas de F43 ya creadas por las tareas previas.

## Evidencia

Lanzamientos: claude x2 (corrida anterior, conservada) y pi x2 con `--model openai/gpt-6-luna` (esta relanzada). Salidas en `f43/pi-1.jsonl` y `f43/pi-2.jsonl` (directorio temporal).

```
$ git branch --show-current
chore/F43-auditoria-contexto
exit 0
$ grep -c '^## Corridas\|^## Resultado' features/F43-auditoria-contexto/prueba.md
2
exit 0
$ grep -c '^| \(claude\|pi\) | [12] |' features/F43-auditoria-contexto/prueba.md
4
exit 0
$ git status --short
 M definitions/BACKLOG.md
 M definitions/STATUS.md
?? definitions/F43-AUDITORIA.md
?? features/F43-auditoria-contexto/
?? pruebas/comprobaciones/contexto-fuentes.test.mjs
?? scripts/contexto-fuentes.mjs
exit 0
```

Pi con el modelo pedido (comando real, sumado por `responseId`):

```
$ PI_CACHE_RETENTION=long pi --model openai/gpt-6-luna --mode json --no-session -p "Lee definitions/F43-AUDITORIA.md y responde solo con su primera línea."
pi-1: input 6080, cacheRead 0, cacheWrite 0
pi-2: input 3264, cacheRead 2816, cacheWrite 0
exit 0
```

Criterios 1 a 4 cumplen (ver filas de `prueba.md`). Ahorro: Claude Code 100.0 % (cacheRead 55666 sobre 55670); Pi 46.3 % (2816 sobre 6080).

## Notas

- Autorización: el encargo trae la frase «Franco autoriza la prueba real de F43». Rama comprobada con `git branch --show-current`, sin crear ni cambiar.
- Relanzada (Franco aprobó el 2026-11-05 el modelo `openai/gpt-6-luna`): solo se relanzó Pi, con `pi --model openai/gpt-6-luna` (flag de `pi --help`). No se editaron `modelos.json` ni configuración. Pi lanzó 2 veces, sin reintentos. Los datos de Claude Code de la corrida anterior se conservan tal cual.
- Hueco menor 1: se mantiene `PI_CACHE_RETENTION=long` (de mecanismos.md) como variable de entorno, no prompt ni tope.
- Hueco menor 2: se suma por `responseId` (cada corrida de Pi tiene 2 respuestas del modelo, una con lectura de archivo). Para que sea comparable con Claude Code, el total de la corrida es la suma de sus respuestas.
- Hueco menor 3: la corrida de Pi usó una herramienta de lectura (`toolUse`) aunque el prompt dice solo responder; no se cambió el prompt. Anotado como diferencia de método en *Resultado* de `prueba.md`.
- Hueco menor 4: aviso de `~/.pi/agent/settings.json` inválido en ambas corridas; no se abrió ese archivo.
- Sin commit, push, PR, merge ni despliegue. STATUS.md no tocado.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=3; resultado=bloqueada; causa=otra
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=4; resultado=lista; causa=ninguna
