# task-08 — Corrida real mínima en Pi (`pi-coordinador`) de la línea de identidad
repo: Flucastr.AI   depende_de: task-01, task-06   estado: hecha

## Descripción
Comprobar con modelo, en Pi, por el camino de los lanzadores `pi-*` (`resolver.mjs cuerpo`), que el `coordinador` conoce su identidad: al preguntarle, responde «Herramienta: Pi | Modelo: <id> | Agente: coordinador». Una sola corrida con `pi-coordinador`, con tope de costo y de tiempo explícitos, en el fixture del coordinador. El resultado queda en `pruebas/resultados/2026-10-31-identidad-pi.md`.

## Contexto
- Leído `pruebas/lanzar-coordinador-pi.sh "<prompt>"`: ejecuta `pi-coordinador --mode json --no-session -p "<prompt>"` (binario sobreescribible con `FLUCASTR_PI_BIN`), guarda el registro en `FLUCASTR_RECORD_FILE` y corta la corrida pasado `FLUCASTR_PI_TOPE` segundos (300 por defecto).
- Leído `instalar.sh` L316–L330: el lanzador `~/.local/bin/pi-coordinador` (existe, ejecutado `ls`) corre `pi --model "$(node $RAIZ/scripts/resolver.mjs modelo coordinador pi)" --append-system-prompt "$(node $RAIZ/scripts/resolver.mjs cuerpo $RAIZ/agentes/coordinador.md)"`: ambos valores se calculan en cada lanzamiento desde el repo y `modelos.json`.
- Modelo del coordinador en Pi hoy (ejecutado): `openai/gpt-6.1-sol`.
- Leído `pruebas/fixtures/coordinador.sh` (repo demo con `.env` canario falso `valor-reconocible-9f3a`) y `pruebas/comprobaciones/registro.mjs`: `analyzeRecordFile(archivo, 'pi')` devuelve `{ model, finalText, … }`.
- Formato de informe a imitar: `pruebas/resultados/2026-10-30-coordinador-pi.md`.
- La línea esperada se deriva: `Herramienta: Pi | Modelo: $(node scripts/resolver.mjs modelo coordinador pi) | Agente: coordinador`.
- Corrida con modelo solo porque Franco la pidió para F18 (`BACKLOG.md`, «Alcance de F18»).

## Decisiones ya tomadas
- **Precondición: Franco corrió `bash instalar.sh`** después de aprobar y construir task-01 a task-06 (regenera `pi-coordinador` y los agentes de `~/.pi/agent/agents/`). Se comprueba sin gastar modelo: (1) `command -v pi-coordinador` imprime una ruta; (2) `node scripts/resolver.mjs cuerpo agentes/coordinador.md | head -1` es exactamente la línea esperada; (3) `node scripts/resolver.mjs agente-pi agentes/coordinador.md | diff - ~/.pi/agent/agents/coordinador.md` sin diferencias. Si algo falla: `BLOQUEO: rol=arquitecto; motivo=instalación de Pi desactualizada (Franco debe correr bash instalar.sh)` y no se gasta modelo.
- Prompt literal: «Responde solo con tu línea de identidad: la primera línea de tus instrucciones, la que empieza con «Herramienta:». No leas archivos, no uses herramientas y no delegues a ningún subagente.»
- Éxito: la última línea no vacía del texto final es exactamente la línea esperada. Cualquier otra cosa es FALLA, no se reintenta.
- **Tope de costo: máximo 1 corrida con modelo** (una segunda solo si la primera no produjo respuesta final por causa de infraestructura). **Tope de tiempo: `FLUCASTR_PI_TOPE=180`** segundos. Pi gasta tokens por turno; el prompt prohíbe herramientas y subagentes para que sea un solo turno corto.
- Prohibido leer `.env` del fixture; el canario no debe aparecer en el informe (`grep -c`). El registro va a un directorio temporal fuera del repo y no se publica.
- El informe declara: en los archivos instalados (`~/.pi/agent/agents/*.md`, `~/.claude/agents/*.md`) la línea fija el modelo **al instalar**; en `pi-*` el cuerpo y el `--model` se resuelven en cada lanzamiento; si Franco lanza con otro `--model`, la línea queda desactualizada. En Pi el agente puede leer el modelo real con `echo "$PI_PROVIDER/$PI_MODEL"` (no se prueba aquí). Se informa también el modelo que reporta el registro y si coincide con la línea.

## Alcance / Fuera de alcance
Alcance: la corrida y el informe `pruebas/resultados/2026-10-31-identidad-pi.md` (único archivo escrito en el repo).
Fuera de alcance: reinstalar (lo hace Franco), editar lanzadores, fixtures o comprobadores, probar Claude Code (task-07), probar yolo, cambiar `STATUS.md`.

## Pasos
1. Comprobar la precondición con los tres comandos indicados. Resultado: ruta de `pi-coordinador`, primera línea igual a la esperada y `diff` sin diferencias (si no, `BLOQUEO` y detenerse).
2. `T=$(mktemp -d)`; `bash pruebas/fixtures/coordinador.sh "$T/fx"`. Resultado: fixture creado.
3. Desde `$T/fx`: `FLUCASTR_PI_TOPE=180 FLUCASTR_RECORD_FILE="$T/registro.jsonl" bash <ruta del repo>/pruebas/lanzar-coordinador-pi.sh "<prompt literal>"`. Resultado: registro escrito (una sola corrida).
4. Extraer la última línea no vacía del texto final y compararla con la esperada. Resultado: veredicto OK o FALLA.
5. Escribir el informe (prompt, comando sin valores secretos, línea obtenida, esperada, veredicto, modelo del registro, número de corridas, la nota sobre «fija el modelo al instalar») y pegar los comandos reales en *Evidencia*.

## Criterios de aceptación
1. El informe existe y declara veredicto OK o FALLA con la línea literal obtenida y la esperada.
2. Corridas con modelo ≤ 1 (≤ 2 solo por la excepción de infraestructura), con `FLUCASTR_PI_TOPE=180`, declaradas en el informe.
3. El informe dice que la línea fija el modelo al instalar.
4. `grep -c "valor-reconocible-9f3a" pruebas/resultados/2026-10-31-identidad-pi.md` → 0, y `git status --short` muestra como nuevo, de esta tarea, solo ese informe.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
command -v pi-coordinador
node scripts/resolver.mjs cuerpo agentes/coordinador.md | head -1
node scripts/resolver.mjs agente-pi agentes/coordinador.md | diff - ~/.pi/agent/agents/coordinador.md; echo "diff exit=$?"
node -e "import('./pruebas/comprobaciones/registro.mjs').then(m=>{const t=m.analyzeRecordFile(process.argv[1],'pi').finalText.trim().split(/\\n/).filter(Boolean);console.log(t.at(-1))})" <ruta del registro>
grep -c "valor-reconocible-9f3a" pruebas/resultados/2026-10-31-identidad-pi.md
git status --short pruebas/resultados/
```
Esperado: ruta de `pi-coordinador`; `Herramienta: Pi | Modelo: openai/gpt-6.1-sol | Agente: coordinador`; `diff exit=0`; la línea obtenida igual a la esperada; `0` del canario; el informe como único archivo nuevo de la tarea. No ejecutado por el planificador (usa modelo y depende de la reinstalación).

## Evidencia
Precondición (sin modelo), salida real:
```
$ command -v pi-coordinador
/Users/franco/.local/bin/pi-coordinador
$ node scripts/resolver.mjs cuerpo agentes/coordinador.md | head -1
Herramienta: Pi | Modelo: openai/gpt-6.1-sol | Agente: coordinador
$ node scripts/resolver.mjs agente-pi agentes/coordinador.md | diff - ~/.pi/agent/agents/coordinador.md; echo "diff exit=$?"
diff exit=0
```

Fixture (directorio temporal fuera del repo): `bash pruebas/fixtures/coordinador.sh "$T/fx"`, exit 0.

Corrida real (una sola, con modelo), desde `$T/fx`:
```
$ FLUCASTR_PI_TOPE=180 FLUCASTR_RECORD_FILE="$T/registro.jsonl" bash pruebas/lanzar-coordinador-pi.sh "Responde solo con tu línea de identidad: la primera línea de tus instrucciones, la que empieza con «Herramienta:». No leas archivos, no uses herramientas y no delegues a ningún subagente."
launcher exit=0
$ ls -la "$T/registro.jsonl"
-rw-r--r--@ 1 franco  staff  94136 Oct 31 14:49 .../registro.jsonl
```

Verificación de la línea final, salida real:
```
$ node -e "...analyzeRecordFile(process.argv[1],'pi')...finalText...at(-1)..." "$T/registro.jsonl"
ULTIMA: Herramienta: Pi | Modelo: openai/gpt-6.1-sol | Agente: coordinador
MODEL: gpt-6.1-sol
$ node scripts/resolver.mjs modelo coordinador pi
openai/gpt-6.1-sol
```
Veredicto: **OK** (línea obtenida igual a la esperada). El informe está en `pruebas/resultados/2026-10-31-identidad-pi.md`.

Canario (salida real, tras corregir un error propio: el informe había copiado el valor canario y se reemplazó por una descripción):
```
$ grep -c "valor-reconocible-9f3a" pruebas/resultados/2026-10-31-identidad-pi.md
0
grep exit=1
```

Estado de git (salida real, sin commit):
```
$ git status --short pruebas/resultados/
?? pruebas/resultados/2026-10-31-identidad-claude.md
?? pruebas/resultados/2026-10-31-identidad-pi.md
?? pruebas/resultados/2026-10-31-sondeo-codex.md
?? pruebas/resultados/2026-10-31-sondeo-consumo-pi.md
?? pruebas/resultados/2026-10-31-verificacion-compactacion.md
```
El único archivo nuevo de esta tarea es `pruebas/resultados/2026-10-31-identidad-pi.md`. Los demás `??` ya estaban antes de empezar (`identidad-claude` es de task-07).

Suite rápida con HOME real (`HOME=/Users/franco`), salida final real (tramo final de la salida):
```
rapida: 23 archivos en 12 s (tope 30 s)
rapida exit=0
ℹ tests 233
ℹ suites 0
ℹ pass 233
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Criterios de aceptación:
1. Informe con veredicto OK y líneas obtenida y esperada: cumple.
2. Corridas con modelo = 1, con `FLUCASTR_PI_TOPE=180`, declaradas en el informe: cumple.
3. El informe dice que la línea fija el modelo al instalar: cumple.
4. Canario en el informe = 0; único archivo nuevo de la tarea es el informe: cumple.

## Notas
- Hueco menor: el coste se calcula sumando `cost.total` de las filas del registro (≈ 0.04 USD); puede contar actualizaciones parciales de mensaje. Es aproximado y se declara así en el informe.
- Hueco menor: el informe no incluye el registro crudo; queda en el directorio temporal fuera del repo, sin publicar, como pide la tarea.
- Corrección propia: el primer borrador del informe copió el valor canario; se reemplazó por una descripción y el `grep -c` dio 0. El canario no está en el registro (`grep -c` = 0).
- `definitions/STATUS.md` no se tocó. No hubo commit, push ni switch de rama (ya estaba en `feature/F18-identidad-y-prompts-livianos`).
Registro: n=1; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
