# task-16 — Corrida con modelo en Claude Code: el `coordinador` retoma desde `STATUS.md` tras una compactación
repo: Flucastr.AI   depende_de: task-13   estado: borrador

## Descripción
Comprobar con modelo, en Claude Code, que una sesión del `coordinador` que cruza una compactación automática real retoma desde `definitions/STATUS.md`. El umbral más bajo que acepta Claude Code (`autoCompactWindow` 100000, que compacta a ≈67 k) se pone solo en el `.claude/settings.local.json` de un fixture en directorio temporal; los turnos de relleno llevan el contexto sobre ese umbral. Resultado en `pruebas/resultados/2026-10-31-compactacion-claude.md`. Es la corrida más cara de la feature: Franco aprueba el gasto al aprobar esta tarea.

## Contexto
- Leído `pruebas/lanzar-coordinador-claude.sh "<prompt>"`: exige `FLUCASTR_RECORD_FILE`; ejecuta `${FLUCASTR_CLAUDE_BIN:-claude} -p --agent coordinador --permission-mode dontAsk --permission-prompts none [--no-session-persistence salvo FLUCASTR_PERSISTIR_SESION=1] --output-format stream-json --verbose --allowedTools … -- "$1"`; acepta un solo argumento y no admite `--max-budget-usd` ni `--continue`. Por eso se usa un envoltorio (`FLUCASTR_CLAUDE_BIN`) que antepone esas opciones, y `FLUCASTR_PERSISTIR_SESION=1` para conservar la sesión. No se edita el lanzador.
- Leído `pruebas/fixtures/coordinador.sh DIRECTORIO` (fixture con `.env` canario `valor-reconocible-9f3a`; el lanzador ya deniega `Read(.env)`).
- Informe `pruebas/resultados/2026-10-31-verificacion-compactacion.md`, puntos 5 y 6: `autoCompactWindow` solo vale entre 100000 y 1000000; con 100000 la sesión compactó sola (`system/compact_boundary`, `trigger: "auto"`, `pre_tokens: 74082`) porque el umbral real es ventana − 33000 ≈ 67 k; 12.000 palabras de relleno ≈ 19,6 k tokens; el ajuste de proyecto en `.claude/settings.local.json` se aplica con `claude -p`; con `--continue` se retoma la sesión del directorio; costo de esa corrida con `haiku`: ≈ US$0,065 en 4 invocaciones.
- El agente instalado de Claude Code debe llevar la regla de la task-12: lo hace Franco con `bash instalar.sh` antes de esta tarea. Se comprueba sin modelo con `node scripts/resolver.mjs agente-claude agentes/coordinador.md | diff - ~/.claude/agents/coordinador.md`.
- `pruebas/comprobaciones/registro.mjs`: `analyzeRecordFile(archivo, 'claude-code').finalText` da el texto final; el registro es `stream-json` (una línea JSON por evento; los mensajes del asistente traen `message.content[]` con ítems `tool_use` con `name` e `input`).
- Modelo del `coordinador` en Claude Code: nivel medio de `modelos.json` (hoy `claude-sonnet-5-5`). Corrida con modelo solo porque Franco la pidió para F19 (`BACKLOG.md`, «Alcance de F19», punto 6).
- La combinación `--continue` con `--agent coordinador` y `-p` no se ejecutó antes (el informe de verificación usó `-p -c` sin agente): es inferida.

## Decisiones ya tomadas
- Precondición sin modelo: el `diff` anterior termina sin diferencias (exit 0). Si falla: `BLOQUEO: rol=arquitecto; motivo=agente instalado de Claude Code desactualizado (Franco debe correr bash instalar.sh)` y no se gasta modelo.
- Fixture con `$T/fx/.claude/settings.local.json` = `{"autoCompactWindow":100000}`. Relleno: `$T/relleno.txt` con la frase «La lluvia cae despacio sobre los techos de la ciudad. » repetida 2.222 veces (≈ 20.000 palabras, ≈ 33 k tokens, *inferido* del informe: 12.000 palabras ≈ 19,6 k).
- Envoltorio `$T/claude-compacta.sh`: `claude --max-budget-usd 1.00` (más `--continue` si `CONTINUAR=1`) seguido de los argumentos del lanzador. Tope duro por invocación: US$1,00.
- Turno 1 (prompt literal, seguido de dos saltos de línea y el contenido de `relleno.txt`): «Estás en el flujo de este proyecto. Lee definitions/STATUS.md, definitions/BACKLOG.md y features/. No delegues a ningún subagente. Escribe en definitions/STATUS.md, sección «Paso actual», la línea literal `Retomar: ancla-4471` y en «Espera a Franco» qué debe revisar Franco según el estado. Responde solo: listo. El texto siguiente es relleno sin importancia; ignóralo.»
- Turnos de relleno 2 a 4 (con `CONTINUAR=1`), solo mientras no haya aparecido `compact_boundary` en ningún registro: «Otro bloque de relleno sin importancia; responde solo: listo.» + dos saltos de línea + `relleno.txt`. Se detiene en cuanto un registro tenga `compact_boundary`.
- Turno de retoma (`CONTINUAR=1`), siempre el último: «Tu conversación se compactó: no te fíes de lo que recuerdes. Lee definitions/STATUS.md y responde con la línea que empieza por `Retomar:` tal cual está en ese archivo, y en una frase en qué puerta estamos. No delegues a ningún subagente.»
- Veredicto: **OK** si se cumplen las cuatro: (1) algún registro tiene un evento `compact_boundary` con `"trigger":"auto"`; (2) `definitions/STATUS.md` del fixture contiene `ancla-4471` tras el turno 1; (3) el registro del turno de retoma tiene un `tool_use` cuyo `input` menciona `STATUS.md` (lectura en el turno de retoma); (4) el texto final del turno de retoma contiene `ancla-4471`. **NO CONCLUYENTE** si tras 4 turnos de relleno no hubo `compact_boundary`, o si una invocación terminó por tope de presupuesto. **FALLA** si hubo compactación y falta (2), (3) o (4).
- Tope: máximo 6 invocaciones con modelo (turno 1, hasta 3 de relleno, retoma, y una de reserva solo por infraestructura). Costo estimado (*inferido*, sin medir con este modelo): US$1 a US$3 en total; tope duro US$6.
- Prohibido leer `.env` del fixture; el canario no debe aparecer en el informe. Los registros, la sesión y el relleno quedan en el directorio temporal, fuera del repo; la sesión persistida vive en `~/.claude/projects/` bajo el nombre de la carpeta temporal (no se borra: es de Claude Code).
- El informe declara: umbral real ≈ 67 k (`autoCompactWindow` 100000 − 33000), que no se tocó ningún `settings*.json` real, la limitación (no prueba que 133000 sea el valor adecuado) y el costo reportado por los registros (`total_cost_usd`, sumado).

## Alcance / Fuera de alcance
Alcance: la corrida y el informe `pruebas/resultados/2026-10-31-compactacion-claude.md` (único archivo escrito en el repo).
Fuera de alcance: editar lanzadores, fixtures o comprobadores, reinstalar, tocar `~/.claude/settings.json` o cualquier `settings*.json` real, probar Pi (task-15), cambiar el umbral para forzar un OK.

## Pasos
1. Precondición del agente instalado (`diff`). Resultado: exit 0 o `BLOQUEO`.
2. Preparar `T`, fixture, `settings.local.json`, `relleno.txt` y el envoltorio (ver *Verificación*). Resultado: `wc -w "$T/relleno.txt"` ≈ 20000.
3. Turno 1 con `reg1.jsonl`; comprobar `ancla-4471` en `STATUS.md`. Resultado: registro y archivo.
4. Turnos de relleno (`reg2.jsonl`…) hasta ver `compact_boundary` o llegar a 4. Resultado: número de turnos y registro con `compact_boundary`.
5. Turno de retoma (`regR.jsonl`). Resultado: registro escrito.
6. Calcular las cuatro condiciones y el costo sumado. Resultado: veredicto.
7. Escribir el informe y pegar los comandos reales en *Evidencia*.

## Criterios de aceptación
1. El informe existe y declara el veredicto con el valor de las cuatro condiciones.
2. Invocaciones con modelo ≤ 6, el costo total reportado por los registros y si alguna llegó al tope de presupuesto, todo declarado en el informe.
3. El informe dice que no se tocó ningún `settings*.json` real y que el umbral real es ≈ 67 k.
4. `grep -c "valor-reconocible-9f3a" pruebas/resultados/2026-10-31-compactacion-claude.md` da 0.
5. `git status --short` muestra como nuevo, de esta tarea, solo ese informe.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
REPO=$PWD
node scripts/resolver.mjs agente-claude agentes/coordinador.md | diff - ~/.claude/agents/coordinador.md; echo "diff exit=$?"
T=$(mktemp -d); bash pruebas/fixtures/coordinador.sh "$T/fx"
mkdir -p "$T/fx/.claude"; printf '{"autoCompactWindow":100000}\n' > "$T/fx/.claude/settings.local.json"
node -e "process.stdout.write('La lluvia cae despacio sobre los techos de la ciudad. '.repeat(2222))" > "$T/relleno.txt"; wc -w "$T/relleno.txt"
cat > "$T/claude-compacta.sh" <<'FIN'
#!/usr/bin/env bash
extra=(--max-budget-usd 1.00); [ "${CONTINUAR:-0}" = 1 ] && extra+=(--continue)
exec claude "${extra[@]}" "$@"
FIN
chmod +x "$T/claude-compacta.sh"
export FLUCASTR_CLAUDE_BIN="$T/claude-compacta.sh" FLUCASTR_PERSISTIR_SESION=1
cd "$T/fx"
P1='Estás en el flujo de este proyecto. Lee definitions/STATUS.md, definitions/BACKLOG.md y features/. No delegues a ningún subagente. Escribe en definitions/STATUS.md, sección «Paso actual», la línea literal `Retomar: ancla-4471` y en «Espera a Franco» qué debe revisar Franco según el estado. Responde solo: listo. El texto siguiente es relleno sin importancia; ignóralo.'
FLUCASTR_RECORD_FILE="$T/reg1.jsonl" bash "$REPO/pruebas/lanzar-coordinador-claude.sh" "$P1"$'\n\n'"$(cat "$T/relleno.txt")"; echo "turno1 exit=$?"
grep -c 'ancla-4471' definitions/STATUS.md
for i in 2 3 4; do
  if grep -l 'compact_boundary' "$T"/reg*.jsonl >/dev/null 2>&1; then break; fi
  CONTINUAR=1 FLUCASTR_RECORD_FILE="$T/reg$i.jsonl" bash "$REPO/pruebas/lanzar-coordinador-claude.sh" $'Otro bloque de relleno sin importancia; responde solo: listo.\n\n'"$(cat "$T/relleno.txt")"; echo "relleno $i exit=$?"
done
CONTINUAR=1 FLUCASTR_RECORD_FILE="$T/regR.jsonl" bash "$REPO/pruebas/lanzar-coordinador-claude.sh" 'Tu conversación se compactó: no te fíes de lo que recuerdes. Lee definitions/STATUS.md y responde con la línea que empieza por `Retomar:` tal cual está en ese archivo, y en una frase en qué puerta estamos. No delegues a ningún subagente.'; echo "retoma exit=$?"
cd "$REPO"
grep -c 'compact_boundary' "$T"/reg*.jsonl; grep -h -o '"trigger":"[a-z]*"' "$T"/reg*.jsonl | sort | uniq -c
node -e "const fs=require('fs');const ev=fs.readFileSync(process.argv[1],'utf8').split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean);const usos=ev.filter(e=>e.type==='assistant').flatMap(e=>e.message?.content??[]).filter(c=>c.type==='tool_use');console.log('lee STATUS.md en retoma:',usos.some(c=>/STATUS\.md/.test(JSON.stringify(c.input))))" "$T/regR.jsonl"
node -e "import('./pruebas/comprobaciones/registro.mjs').then(m=>{const r=m.analyzeRecordFile(process.argv[1],'claude-code');console.log('modelo:',r.model);console.log('texto final:',r.finalText.trim());console.log('contiene ancla:',r.finalText.includes('ancla-4471'))})" "$T/regR.jsonl"
grep -h -o '"total_cost_usd":[0-9.]*' "$T"/reg*.jsonl
grep -c "valor-reconocible-9f3a" pruebas/resultados/2026-10-31-compactacion-claude.md
git status --short pruebas/resultados/
```
Esperado: `diff exit=0`; `relleno.txt` ≈ 20000 palabras; `turno1 exit=0` y `ancla-4471` ≥ 1; entre 0 y 3 turnos de relleno según cuándo aparezca la compactación; al menos un `compact_boundary` con `"trigger":"auto"`; `lee STATUS.md en retoma: true`; `contiene ancla: true`; costos por invocación (cada uno ≤ 1.00); canario 0; el informe como único archivo nuevo de la tarea. No ejecutado por el planificador (usa modelo, cuesta dinero y escribe un informe). Si el shell se reinicia entre pasos, repetir los `export` y `P1`.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
