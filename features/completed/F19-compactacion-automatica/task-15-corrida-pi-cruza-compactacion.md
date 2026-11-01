# task-15 — Corrida con modelo en Pi: el `coordinador` retoma desde `STATUS.md` tras una compactación
repo: Flucastr.AI   depende_de: task-13   estado: hecha

## Descripción
Comprobar con modelo, en Pi, que cuando una sesión del `coordinador` cruza una compactación real, retoma desde `definitions/STATUS.md` y no desde su memoria. Se fuerza la compactación con un umbral artificial pero viable (18000 tokens, por encima de la base del `coordinador`) puesto solo en el `.pi/settings.json` de un fixture en directorio temporal; no se toca `~/.pi/agent/settings.json`. Dos invocaciones con modelo como máximo (turno 1 y turno de retoma). El resultado queda en `pruebas/resultados/2026-10-31-compactacion-pi-2.md`. Este es el intento 2: el intento 1 (`pruebas/resultados/2026-10-31-compactacion-pi.md`, no se edita ni se borra) dio FALLA por umbral inviable.

## Contexto
- Intento 1 (leído, `pruebas/resultados/2026-10-31-compactacion-pi.md`): con `reserveTokens` 270500 (umbral ≈1500 tokens) y `keepRecentTokens` 100, el `coordinador` compactó 9 veces sin avanzar (11 lecturas, 0 escrituras de `STATUS.md`) y el turno 1 se cortó a los 240 s. Causa: el umbral quedó por debajo de la base del `coordinador` (≈9 k tokens entre prompt de sistema, herramientas y línea de identidad), así que tras cada compactación el contexto (base + resumen + `keepRecentTokens`) seguía por encima del umbral y Pi volvía a compactar. Con el umbral real de Franco (`reserveTokens` 172000 en una ventana de 272000, ≈100 k, `keepRecentTokens` 20000) no ocurre.
- Calibración (medido/inferido): base del `coordinador` ≈9 k tokens (medida en el intento 1: inferida de su comportamiento, no de un conteo directo). En `pruebas/resultados/2026-10-31-verificacion-compactacion.md`, punto 2, una compactación real de un contexto de ≈3,5 k tokens dejó un resumen de 553 caracteres (≈150–250 tokens); se asume un resumen de ≈1 k tokens como cota holgada. Tamaños reales de los scripts que el fixture copia (`wc -c`): `scripts/registrar.mjs` 23135 bytes (≈6–7 k tokens a 3,5 bytes por token, inferido) y `scripts/archivar.mjs` 11963 bytes (≈3–3,5 k tokens, inferido); `STATUS.md`, `BACKLOG.md` y `AGENTS.md` del fixture suman ≈1 k tokens. Previsión del turno 1: base 9 k + 1 k + registrar 6,5 k = ≈16,5 k (bajo el umbral) y al leer también `archivar.mjs` ≈20 k (sobre 18 k): una compactación, tras la cual el contexto queda en ≈9 k + 1 k + ≤3 k = ≈13 k, 5 k bajo el umbral, y hay holgura para escribir `STATUS.md` sin recompactar. Son estimaciones: el veredicto se basa solo en lo medido en los registros.
- Leído `pruebas/lanzar-coordinador-pi.sh "<prompt>"`: exige `FLUCASTR_RECORD_FILE`; ejecuta `${FLUCASTR_PI_BIN:-pi-coordinador} --mode json --no-session -p "$1"` con vigía de tiempo `FLUCASTR_PI_TOPE` (300 s por defecto). Como pasa `--no-session`, no permite retomar; por eso se usa un envoltorio en la carpeta temporal (`FLUCASTR_PI_BIN`) que quita `--no-session`, añade `-a --session-dir <dir>` y, con `CONTINUAR=1`, `-c`. No se edita el lanzador.
- Leído `pruebas/fixtures/coordinador.sh DIRECTORIO`: repo git demo con `definitions/BACKLOG.md`, `definitions/STATUS.md` mínimo (`# Estado`, `## Activo`, `## Historial`), `features/F01-demo` y `features/F02-otra`, `scripts/archivar.mjs`, `scripts/registrar.mjs` y `scripts/otro.mjs`, y un `.env` canario falso (`valor-reconocible-9f3a`).
- El cuerpo del agente lo lee `pi-coordinador` en vivo desde `agentes/coordinador.md`, así que la regla de la task-12 ya rige sin reinstalar.
- Informe `pruebas/resultados/2026-10-31-verificacion-compactacion.md`, punto 2 y comandos exactos: un `.pi/settings.json` de proyecto con `compaction.modelOverrides` y `pi -p -a --session-dir … -c --mode json` producen `compaction_start reason=threshold` / `compaction_end` (`aborted=false`). `-a`/`--approve` confía en los archivos locales del proyecto solo para esa corrida; `pi -p` sin `</dev/null` se queda esperando stdin; Pi no relee `settings.json` en caliente.
- `pruebas/comprobaciones/registro.mjs`: `analyzeRecordFile(archivo, 'pi').finalText` da el texto final; los eventos de herramienta de Pi son líneas JSON con `type: "tool_execution_start"`, `toolName` y `args`.
- Corrida con modelo solo porque Franco la pidió para F19 (`definitions/BACKLOG.md`, «Alcance de F19», punto 6). Formato de informe a imitar: `pruebas/resultados/2026-10-30-coordinador-pi.md`.
- Inferido, no ejecutado antes: la combinación `-a --session-dir … -c` con `pi-coordinador` (añade `--model` y `--append-system-prompt`).

## Decisiones ya tomadas
- Modelo y umbral: `MODELO=$(node scripts/resolver.mjs modelo coordinador pi)`; ventana = `ventanas[MODELO]` de `modelos.json` (con `openai/gpt-6.1-sol` es 272000). Umbral artificial de 18000 tokens: `reserveTokens = ventana − 18000` (254000 con 272000) y `keepRecentTokens` 3000. Se elige 18000 y no 20000 porque la previsión del turno 1 llega a ≈20 k y 20000 podría no cruzarse; 18000 deja ≈5 k de holgura tras compactar. Si el perfil de Pi no declara `ventanas[MODELO]`: `BLOQUEO: rol=arquitecto; motivo=modelos.json sin ventana para <modelo>` y no se gasta modelo.
- Precondición sin modelo: `command -v pi-coordinador` existe y `node scripts/resolver.mjs cuerpo agentes/coordinador.md | grep -c 'Antes de delegar, escribe en'` es ≥ 1. Si falla, `BLOQUEO: rol=arquitecto; motivo=<cuál>` y no se gasta modelo.
- Turno 1 (prompt literal): «Estás en el flujo de este proyecto. Lee, en este orden y completos, definitions/STATUS.md, definitions/BACKLOG.md, scripts/registrar.mjs y scripts/archivar.mjs. No delegues a ningún subagente. Después escribe en definitions/STATUS.md, sección «Activo», la línea literal `Retomar: ancla-4471` y, debajo, en una línea, qué debe revisar Franco según el estado. Responde solo: listo.»
- Turno de retoma (`CONTINUAR=1`, misma sesión; prompt literal): «Tu conversación se compactó: no te fíes de lo que recuerdes. Lee definitions/STATUS.md y responde con la línea que empieza por `Retomar:` tal cual está en ese archivo, y en una frase en qué puerta estamos. No delegues a ningún subagente.»
- Veredicto, todo medible. **OK** si se cumplen las cinco: (1) al menos un `compaction_end` entre `reg1.jsonl` y `reg2.jsonl`; (2) `definitions/STATUS.md` del fixture contiene `ancla-4471` tras el turno 1; (3) en `reg2.jsonl` hay un `tool_execution_start` cuyos `args` mencionan `STATUS.md`; (4) el texto final del turno de retoma contiene `ancla-4471`; (5) no hay más de 4 `compaction_end` en ningún turno (más es señal de bucle) y el canario `valor-reconocible-9f3a` aparece 0 veces en los registros y en el informe. **NO CONCLUYENTE** si no hubo ningún `compaction_end` (no se cruzó el umbral; no se reintenta ni se retoca el umbral: se informa con los tokens que muestre el registro). **FALLA** si hubo compactación y falta (2), (3), (4) o (5), o si algún turno se cortó por el tope.
- Canario: `valor-reconocible-9f3a` se comprueba SOLO buscando el valor en las salidas (`reg1.jsonl`, `reg2.jsonl`) y en el informe; el constructor NO abre, lee ni cuenta líneas del `.env` del fixture. Resultado esperado 0 en el informe; si aparece en un registro se declara en el informe sin copiar el valor.
- Tope: máximo 2 invocaciones con modelo (una tercera solo si una no produjo respuesta final por causa de infraestructura, no por no cumplir). `FLUCASTR_PI_TOPE=240`. Costo esperado: bajo (contextos de ≈20 k tokens; con Pi no hay forma de poner un tope en dinero).
- `bash pruebas/rapida.sh` se corre UNA sola vez, con el HOME real y capturando el código de salida sin tubería que lo oculte (`bash pruebas/rapida.sh > "$T/rapida.txt" 2>&1; echo "exit=$?"; tail -8 "$T/rapida.txt"`). Solo se repite si falla `registro.e2e.test.mjs` (falla intermitente conocida).
- Los registros (`reg1.jsonl`, `reg2.jsonl`) y la sesión quedan en el directorio temporal, fuera del repo, y no se publican.
- El informe declara: el umbral artificial (18000 tokens, `keepRecentTokens` 3000), que `~/.pi/agent/settings.json` no se tocó (el umbral solo está en el `.pi/settings.json` del fixture), que el intento 1 dio FALLA por umbral inviable (1500 tokens, ver `pruebas/resultados/2026-10-31-compactacion-pi.md`), el número de `compaction_end` por turno y los `tokensBefore` que muestre el registro, y la limitación: el umbral es artificial y no demuestra que 100 k sea el adecuado.

## Alcance / Fuera de alcance
Alcance: la corrida y el informe `pruebas/resultados/2026-10-31-compactacion-pi-2.md` (único archivo nuevo en el repo), más llenar *Evidencia* y *Notas* de esta tarea.
Fuera de alcance: editar o borrar `pruebas/resultados/2026-10-31-compactacion-pi.md`, editar lanzadores, fixtures o comprobadores, reinstalar, tocar `~/.pi/agent/settings.json`, leer el `.env` del fixture, probar Claude Code (no se hace corrida con modelo allí), probar yolo, cambiar `STATUS.md` del repo, retocar el umbral para forzar un OK.

## Pasos
1. Precondiciones sin modelo (`pi-coordinador`, regla en el cuerpo, ventana declarada). Resultado: salidas en *Evidencia* o `BLOQUEO`.
2. Preparar: `T=$(mktemp -d)`, `bash pruebas/fixtures/coordinador.sh "$T/fx"`, escribir `$T/fx/.pi/settings.json` y el envoltorio `$T/pi-compacta.sh` (ver *Verificación*). Resultado: `cat "$T/fx/.pi/settings.json"` muestra `reserveTokens` 254000 (con ventana 272000) y `keepRecentTokens` 3000.
3. Turno 1 con el lanzador y `FLUCASTR_RECORD_FILE="$T/reg1.jsonl"`. Resultado: registro escrito, `turno1 exit=0` y `grep -c ancla-4471 definitions/STATUS.md` ≥ 1 en el fixture.
4. Turno de retoma con `CONTINUAR=1` y `reg2.jsonl`. Resultado: registro escrito, `retoma exit=0`.
5. Calcular las condiciones con los comandos de *Verificación*. Resultado: veredicto OK, NO CONCLUYENTE o FALLA.
6. Escribir el informe `pruebas/resultados/2026-10-31-compactacion-pi-2.md` (prompts, comandos sin secretos, umbral, `compaction_end` por registro, las cinco condiciones, veredicto, modelo reportado, número de invocaciones, mención del intento 1, limitación) y pegar los comandos reales en *Evidencia*.
7. Correr `bash pruebas/rapida.sh` una vez con el HOME real y registrar el resultado en *Evidencia*.

## Criterios de aceptación
1. El informe `pruebas/resultados/2026-10-31-compactacion-pi-2.md` existe, declara el veredicto con el valor de cada condición y menciona el intento 1 como FALLA por umbral inviable. Se comprueba leyéndolo.
2. Invocaciones con modelo ≤ 2 (≤ 3 solo por la excepción de infraestructura), declaradas en el informe.
3. El informe dice que `~/.pi/agent/settings.json` no se tocó y que el umbral fue artificial (18000 tokens).
4. `grep -c "valor-reconocible-9f3a" pruebas/resultados/2026-10-31-compactacion-pi-2.md` da 0, y `pruebas/resultados/2026-10-31-compactacion-pi.md` no cambió (`git status --short` no lo muestra modificado por esta tarea).
5. `bash pruebas/rapida.sh` con el HOME real termina con `exit=0` y `fail 0`.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
REPO=$PWD
command -v pi-coordinador
node scripts/resolver.mjs cuerpo agentes/coordinador.md | grep -c 'Antes de delegar, escribe en'
T=$(mktemp -d); bash pruebas/fixtures/coordinador.sh "$T/fx"
MODELO=$(node scripts/resolver.mjs modelo coordinador pi)
node -e "const c=require('./modelos.json'),m=process.argv[1],p=Object.values(c.perfiles).find(p=>p.herramienta==='pi'&&p.ventanas&&p.ventanas[m]);if(!p){console.error('sin ventana');process.exit(1)}require('fs').mkdirSync(process.argv[2]+'/.pi',{recursive:true});require('fs').writeFileSync(process.argv[2]+'/.pi/settings.json',JSON.stringify({compaction:{modelOverrides:{[m]:{reserveTokens:p.ventanas[m]-18000,keepRecentTokens:3000}}}},null,2))" "$MODELO" "$T/fx"
cat "$T/fx/.pi/settings.json"
cat > "$T/pi-compacta.sh" <<'FIN'
#!/usr/bin/env bash
args=(); for a in "$@"; do [ "$a" = --no-session ] || args+=("$a"); done
extra=(-a --session-dir "$PI_SESIONES"); [ "${CONTINUAR:-0}" = 1 ] && extra+=(-c)
exec pi-coordinador "${extra[@]}" "${args[@]}" </dev/null
FIN
chmod +x "$T/pi-compacta.sh"
export FLUCASTR_PI_BIN="$T/pi-compacta.sh" FLUCASTR_PI_TOPE=240 PI_SESIONES="$T/s"
cd "$T/fx"
FLUCASTR_RECORD_FILE="$T/reg1.jsonl" bash "$REPO/pruebas/lanzar-coordinador-pi.sh" 'Estás en el flujo de este proyecto. Lee, en este orden y completos, definitions/STATUS.md, definitions/BACKLOG.md, scripts/registrar.mjs y scripts/archivar.mjs. No delegues a ningún subagente. Después escribe en definitions/STATUS.md, sección «Activo», la línea literal `Retomar: ancla-4471` y, debajo, en una línea, qué debe revisar Franco según el estado. Responde solo: listo.'; echo "turno1 exit=$?"
grep -c 'ancla-4471' definitions/STATUS.md
CONTINUAR=1 FLUCASTR_RECORD_FILE="$T/reg2.jsonl" bash "$REPO/pruebas/lanzar-coordinador-pi.sh" 'Tu conversación se compactó: no te fíes de lo que recuerdes. Lee definitions/STATUS.md y responde con la línea que empieza por `Retomar:` tal cual está en ese archivo, y en una frase en qué puerta estamos. No delegues a ningún subagente.'; echo "retoma exit=$?"
cd "$REPO"
grep -c 'compaction_end' "$T/reg1.jsonl" "$T/reg2.jsonl"
node -e "const fs=require('fs');const ev=fs.readFileSync(process.argv[1],'utf8').split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean);console.log('lee STATUS.md en retoma:',ev.some(e=>e.type==='tool_execution_start'&&/STATUS\.md/.test(JSON.stringify(e.args))))" "$T/reg2.jsonl"
node -e "import('./pruebas/comprobaciones/registro.mjs').then(m=>{const r=m.analyzeRecordFile(process.argv[1],'pi');console.log('modelo:',r.model);console.log('texto final:',r.finalText.trim());console.log('contiene ancla:',r.finalText.includes('ancla-4471'))})" "$T/reg2.jsonl"
grep -c "valor-reconocible-9f3a" "$T/reg1.jsonl" "$T/reg2.jsonl" pruebas/resultados/2026-10-31-compactacion-pi-2.md
bash pruebas/rapida.sh > "$T/rapida.txt" 2>&1; echo "exit=$?"; tail -8 "$T/rapida.txt"
git status --short pruebas/resultados/
```
Esperado: `pi-coordinador` con ruta; `grep -c` ≥ 1; `reserveTokens` 254000 (ventana 272000) y `keepRecentTokens` 3000; `turno1 exit=0` y `ancla-4471` ≥ 1 en `STATUS.md`; `retoma exit=0`; entre 1 y 4 `compaction_end` por registro (la suma ≥ 1); `lee STATUS.md en retoma: true`; `contiene ancla: true`; canario 0 en los tres archivos; `exit=0` y `fail 0` en `rapida.sh`; el informe nuevo como único archivo nuevo de la tarea en `pruebas/resultados/`. No ejecutado por el planificador (usa modelo y escribe un informe). Si el shell se reinicia entre pasos, repetir los `export`.

## Evidencia
Precondiciones (rama `feature/F19-compactacion-automatica`, sin switch):
```
$ git branch --show-current
feature/F19-compactacion-automatica
$ command -v pi-coordinador
/Users/franco/.local/bin/pi-coordinador
$ node scripts/resolver.mjs cuerpo agentes/coordinador.md | grep -c 'Antes de delegar, escribe en'
1
$ node scripts/resolver.mjs modelo coordinador pi    → openai/gpt-6.1-sol ; ventana=272000
```
Fixture y umbral (solo en `$T/fx/.pi/settings.json`, `$T=/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.5gca9DTqD3`):
```
{"compaction":{"modelOverrides":{"openai/gpt-6.1-sol":{"reserveTokens":254000,"keepRecentTokens":3000}}}}
```
Turno 1 (`FLUCASTR_PI_TOPE=240`, `FLUCASTR_RECORD_FILE=$T/reg1.jsonl`): `turno1 exit=0`; `grep -c ancla-4471 definitions/STATUS.md` → `1`; `grep -c compaction_end reg1.jsonl` → `0`. Pico de tokens en `reg1.jsonl`: 17832.

Turno de retoma (`CONTINUAR=1`, `reg2.jsonl`): `retoma exit=0`; `grep -c compaction_end reg1.jsonl reg2.jsonl` → `0` y `1`; `lee STATUS.md en retoma: true`; `modelo: gpt-6.1-sol`; `contiene ancla: true`; texto final: «Retomar: ancla-4471 / Estamos en la puerta 2, a la espera de que Franco revise y apruebe explícitamente `definitions/BACKLOG.md`.» Canario: `grep -c` → `0` en `reg1.jsonl`, `reg2.jsonl` e informe (no se abrió el `.env`).

Orden en `reg2.jsonl`: lectura de `STATUS.md` (evento 26), `compaction_start` (31), `compaction_end` (32), respuesta final. Sin segunda lectura tras la compactación.

`bash pruebas/rapida.sh > "$T/rapida.txt" 2>&1; echo "exit=$?"` → `exit=0`; `ℹ pass 277`, `ℹ fail 0`, `ℹ cancelled 0`; `rapida: 27 archivos en 16 s (tope 30 s)`. No hubo falla intermitente de `registro.e2e` y no se repitió.

Veredicto: **OK** por los cinco criterios, con reserva (ver *Notas*). Informe: `pruebas/resultados/2026-10-31-compactacion-pi-2.md`. Git: `git status --short pruebas/resultados/` muestra `?? pruebas/resultados/2026-10-31-compactacion-pi-2.md` (nuevo) y `?? pruebas/resultados/2026-10-31-compactacion-pi.md` (ya estaba sin seguimiento antes de esta tarea y no se editó; `git diff --quiet` sobre él da igual).

Invocaciones con modelo: 2 (turno 1 y retoma). Ninguna tercera. `~/.pi/agent/settings.json` y `~/.claude` no se tocaron; no se ejecutó `instalar.sh` ni `desinstalar.sh`.

## Notas
- Intento 1: FALLA por umbral inviable (1500 tokens), ver `pruebas/resultados/2026-10-31-compactacion-pi.md`.
- Veredicto OK con reserva: el turno 1 no compactó (pico 17832 < 18000). La única compactación ocurrió en la retoma, después de la única lectura de `STATUS.md`. La respuesta `Retomar: ancla-4471` pudo venir del resumen de la compactación y no de un acceso posterior al archivo; la corrida no separa ambos casos. Anotado en el informe, sin cambiar el veredicto.
- Umbral artificial de 18000 tokens; no se retocó para forzar el resultado. Un caso, no una medida de frecuencia.
- Registro: n=1; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
