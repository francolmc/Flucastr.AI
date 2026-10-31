# task-15 — Corrida con modelo en Pi: el `coordinador` retoma desde `STATUS.md` tras una compactación
repo: Flucastr.AI   depende_de: task-13   estado: borrador

## Descripción
Comprobar con modelo, en Pi, que cuando una sesión del `coordinador` cruza una compactación real, retoma desde `definitions/STATUS.md` y no desde su memoria. Se fuerza la compactación con un umbral artificialmente bajo puesto solo en el `.pi/settings.json` de un fixture en directorio temporal (no se toca `~/.pi/agent/settings.json`). Dos invocaciones como máximo (turno 1 y turno de retoma). El resultado queda en `pruebas/resultados/2026-10-31-compactacion-pi.md`.

## Contexto
- Leído `pruebas/lanzar-coordinador-pi.sh "<prompt>"`: exige `FLUCASTR_RECORD_FILE`; ejecuta `${FLUCASTR_PI_BIN:-pi-coordinador} --mode json --no-session -p "$1"` con vigía de tiempo `FLUCASTR_PI_TOPE` (300 s por defecto). Como pasa `--no-session`, no permite retomar; por eso se usa un envoltorio en la carpeta temporal (`FLUCASTR_PI_BIN`) que quita `--no-session`, añade `-a --session-dir <dir>` y, con `CONTINUAR=1`, `-c`. No se edita el lanzador.
- Leído `pruebas/fixtures/coordinador.sh DIRECTORIO`: repo git demo con `definitions/BACKLOG.md` en `borrador`, `definitions/STATUS.md` mínimo, `features/F01-demo` (hecha) y `features/F02-otra` (en curso), `scripts/` reales y un `.env` canario falso (`valor-reconocible-9f3a`).
- El cuerpo del agente lo lee `pi-coordinador` en vivo desde `agentes/coordinador.md` (`scripts/resolver.mjs cuerpo`, vía `RAIZ` del repo), así que la regla de la task-12 ya rige sin reinstalar.
- Informe `pruebas/resultados/2026-10-31-verificacion-compactacion.md`, punto 2 y comandos exactos: un `.pi/settings.json` de proyecto con `{"compaction":{"modelOverrides":{"openai/gpt-6-luna":{"reserveTokens":270500,"keepRecentTokens":100}}}}` (umbral = 272000 − 270500) y `pi -p -a --session-dir … -c --mode json` produjeron `compaction_start reason=threshold` / `compaction_end` (`aborted=false`) y una entrada `compaction` en la sesión. `-a`/`--approve` confía en los archivos locales del proyecto solo para esa corrida; `pi -p` sin `</dev/null` se queda esperando stdin; Pi no relee `settings.json` en caliente (cada invocación arranca de nuevo).
- `pruebas/comprobaciones/registro.mjs`: `analyzeRecordFile(archivo, 'pi').finalText` da el texto final; los eventos de herramienta de Pi son líneas JSON con `type: "tool_execution_start"`, `toolName` y `args`.
- Corrida con modelo solo porque Franco la pidió para F19 (`definitions/BACKLOG.md`, «Alcance de F19», punto 6). Formato de informe a imitar: `pruebas/resultados/2026-10-30-coordinador-pi.md`.
- La combinación de opciones `-a --session-dir … -c` con `pi-coordinador` (que añade `--model` y `--append-system-prompt`) no se ejecutó antes: es inferida a partir de los comandos del informe de verificación.

## Decisiones ya tomadas
- Modelo y umbral: `MODELO=$(node scripts/resolver.mjs modelo coordinador pi)`; ventana = `ventanas[MODELO]` de `modelos.json` (task-01); `reserveTokens = ventana − 1500` (umbral 1500 tokens, ya probado en el informe) y `keepRecentTokens` 100. Si el perfil de Pi no declara `ventanas[MODELO]`: `BLOQUEO: rol=arquitecto; motivo=modelos.json sin ventana para <modelo>` y no se gasta modelo.
- Precondición sin modelo: `command -v pi-coordinador` existe y `node scripts/resolver.mjs cuerpo agentes/coordinador.md | grep -c 'Antes de delegar, escribe en'` es ≥ 1. Si falla, `BLOQUEO: rol=arquitecto; motivo=<cuál>` y no se gasta modelo.
- Turno 1 (prompt literal): «Estás en el flujo de este proyecto. Lee definitions/STATUS.md, definitions/BACKLOG.md y features/. No delegues a ningún subagente. Escribe en definitions/STATUS.md, sección «Paso actual», la línea literal `Retomar: ancla-4471` y en «Espera a Franco» qué debe revisar Franco según el estado. Responde solo: listo.»
- Turno de retoma (`CONTINUAR=1`, misma sesión; prompt literal): «Tu conversación se compactó: no te fíes de lo que recuerdes. Lee definitions/STATUS.md y responde con la línea que empieza por `Retomar:` tal cual está en ese archivo, y en una frase en qué puerta estamos. No delegues a ningún subagente.»
- Veredicto, todo medible: **OK** si se cumplen las cuatro: (1) al menos un `compaction_end` en `reg1.jsonl` o `reg2.jsonl`; (2) `definitions/STATUS.md` del fixture contiene `ancla-4471` tras el turno 1; (3) en `reg2.jsonl` hay un `tool_execution_start` cuyos `args` mencionan `STATUS.md` (lectura en el turno de retoma); (4) el texto final del turno de retoma contiene `ancla-4471`. **NO CONCLUYENTE** si no hubo ningún `compaction_end` (la prueba no cruzó una compactación; no se reintenta ni se baja más el umbral: se informa). **FALLA** si hubo compactación y falta (2), (3) o (4).
- Tope: máximo 2 invocaciones con modelo (una tercera solo si una no produjo respuesta final por causa de infraestructura, no por no cumplir). `FLUCASTR_PI_TOPE=240`. Costo esperado: bajo (contextos de unos pocos miles de tokens; en el informe de verificación ≈ US$0,0003 por turno con `gpt-6-luna`); con Pi no hay forma de poner un tope en dinero.
- El canario `valor-reconocible-9f3a` no debe aparecer en el informe; no se lee `.env`. Los registros (`reg1.jsonl`, `reg2.jsonl`) y la sesión quedan en el directorio temporal, fuera del repo, y no se publican.
- El informe declara: el umbral artificial (1500 tokens), que `~/.pi/agent/settings.json` no se tocó (la prueba solo escribe el `.pi/settings.json` del fixture) y la limitación: un umbral tan bajo compacta casi en cada turno, por lo que la prueba demuestra el retomar desde `STATUS.md`, no que 100 k sea el umbral adecuado.

## Alcance / Fuera de alcance
Alcance: la corrida y el informe `pruebas/resultados/2026-10-31-compactacion-pi.md` (único archivo escrito en el repo).
Fuera de alcance: editar lanzadores, fixtures o comprobadores, reinstalar, tocar `~/.pi/agent/settings.json`, probar Claude Code (task-16), probar yolo, cambiar `STATUS.md` del repo, retocar el umbral para forzar un OK.

## Pasos
1. Precondiciones sin modelo (`pi-coordinador`, regla en el cuerpo, ventana declarada). Resultado: salidas en *Evidencia* o `BLOQUEO`.
2. Preparar: `T=$(mktemp -d)`, `bash pruebas/fixtures/coordinador.sh "$T/fx"`, escribir `$T/fx/.pi/settings.json` y el envoltorio `$T/pi-compacta.sh` (ver *Verificación*). Resultado: `cat "$T/fx/.pi/settings.json"` muestra `reserveTokens` 270500 (si la ventana es 272000) y `keepRecentTokens` 100.
3. Turno 1 con el lanzador y `FLUCASTR_RECORD_FILE="$T/reg1.jsonl"`. Resultado: registro escrito; `grep -c ancla-4471 "$T/fx/definitions/STATUS.md"` ≥ 1.
4. Turno de retoma con `CONTINUAR=1` y `reg2.jsonl`. Resultado: registro escrito.
5. Calcular las cuatro condiciones con los comandos de *Verificación*. Resultado: veredicto OK, NO CONCLUYENTE o FALLA.
6. Escribir el informe (prompts, comandos sin secretos, umbral, número de `compaction_end` por registro, las cuatro condiciones, veredicto, modelo reportado, número de invocaciones, limitación) y pegar los comandos reales en *Evidencia*.

## Criterios de aceptación
1. El informe existe y declara el veredicto con el valor de cada una de las cuatro condiciones.
2. Invocaciones con modelo ≤ 2 (≤ 3 solo por la excepción de infraestructura), declaradas en el informe.
3. El informe dice que `~/.pi/agent/settings.json` no se tocó y que el umbral fue artificial.
4. `grep -c "valor-reconocible-9f3a" pruebas/resultados/2026-10-31-compactacion-pi.md` da 0.
5. `git status --short` muestra como nuevo, de esta tarea, solo ese informe.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
REPO=$PWD
command -v pi-coordinador
node scripts/resolver.mjs cuerpo agentes/coordinador.md | grep -c 'Antes de delegar, escribe en'
T=$(mktemp -d); bash pruebas/fixtures/coordinador.sh "$T/fx"
MODELO=$(node scripts/resolver.mjs modelo coordinador pi)
node -e "const c=require('./modelos.json'),m=process.argv[1],p=Object.values(c.perfiles).find(p=>p.herramienta==='pi'&&p.ventanas&&p.ventanas[m]);if(!p){console.error('sin ventana');process.exit(1)}require('fs').mkdirSync(process.argv[2]+'/.pi',{recursive:true});require('fs').writeFileSync(process.argv[2]+'/.pi/settings.json',JSON.stringify({compaction:{modelOverrides:{[m]:{reserveTokens:p.ventanas[m]-1500,keepRecentTokens:100}}}},null,2))" "$MODELO" "$T/fx"
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
FLUCASTR_RECORD_FILE="$T/reg1.jsonl" bash "$REPO/pruebas/lanzar-coordinador-pi.sh" 'Estás en el flujo de este proyecto. Lee definitions/STATUS.md, definitions/BACKLOG.md y features/. No delegues a ningún subagente. Escribe en definitions/STATUS.md, sección «Paso actual», la línea literal `Retomar: ancla-4471` y en «Espera a Franco» qué debe revisar Franco según el estado. Responde solo: listo.'; echo "turno1 exit=$?"
grep -c 'ancla-4471' definitions/STATUS.md
CONTINUAR=1 FLUCASTR_RECORD_FILE="$T/reg2.jsonl" bash "$REPO/pruebas/lanzar-coordinador-pi.sh" 'Tu conversación se compactó: no te fíes de lo que recuerdes. Lee definitions/STATUS.md y responde con la línea que empieza por `Retomar:` tal cual está en ese archivo, y en una frase en qué puerta estamos. No delegues a ningún subagente.'; echo "retoma exit=$?"
cd "$REPO"
grep -c 'compaction_end' "$T/reg1.jsonl" "$T/reg2.jsonl"
node -e "const fs=require('fs');const ev=fs.readFileSync(process.argv[1],'utf8').split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean);console.log('lee STATUS.md en retoma:',ev.some(e=>e.type==='tool_execution_start'&&/STATUS\.md/.test(JSON.stringify(e.args))))" "$T/reg2.jsonl"
node -e "import('./pruebas/comprobaciones/registro.mjs').then(m=>{const r=m.analyzeRecordFile(process.argv[1],'pi');console.log('modelo:',r.model);console.log('texto final:',r.finalText.trim());console.log('contiene ancla:',r.finalText.includes('ancla-4471'))})" "$T/reg2.jsonl"
grep -c "valor-reconocible-9f3a" pruebas/resultados/2026-10-31-compactacion-pi.md
git status --short pruebas/resultados/
```
Esperado: `pi-coordinador` con ruta; `grep -c` ≥ 1; `reserveTokens` 270500 (ventana 272000) y `keepRecentTokens` 100; `turno1 exit=0` y `ancla-4471` ≥ 1 en `STATUS.md`; `retoma exit=0`; al menos un `compaction_end` en un registro; `lee STATUS.md en retoma: true`; `contiene ancla: true`; canario 0; el informe como único archivo nuevo de la tarea. No ejecutado por el planificador (usa modelo y escribe un informe). Si el shell se reinicia entre pasos, repetir los `export`.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
