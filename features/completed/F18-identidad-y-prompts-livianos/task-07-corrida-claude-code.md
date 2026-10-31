# task-07 — Corrida real mínima en Claude Code de la línea de identidad
repo: Flucastr.AI   depende_de: task-01, task-06   estado: hecha

## Descripción
Comprobar con modelo, en Claude Code, que el `coordinador` instalado conoce su identidad: al preguntarle, responde la línea «Herramienta: Claude Code | Modelo: <id> | Agente: coordinador» que `resolver.mjs agente-claude` fijó al instalar. Una sola corrida, con tope de costo explícito, en el fixture del coordinador. El resultado queda en `pruebas/resultados/2026-10-31-identidad-claude.md`.

## Contexto
- Leído `pruebas/lanzar-coordinador-claude.sh "<prompt>"`: exige `FLUCASTR_RECORD_FILE`, ejecuta `claude -p --agent coordinador --permission-mode dontAsk --output-format stream-json --verbose` con permisos explícitos limitados a `Read(./**)`, escritura en `./definitions/**`, `Skill` y tres patrones de Bash de `scripts/`; no acepta argumentos extra (`[[ $# == 1 ]]`), así que **no admite `--max-budget-usd`**. Corre con el modelo del agente instalado (`claude-sonnet-5-5`, nivel medio de `modelos.json`).
- Leído `pruebas/fixtures/coordinador.sh DIRECTORIO`: crea un repo demo (BACKLOG en borrador, `features/` demo, scripts reales y un `.env` canario falso con el valor `valor-reconocible-9f3a`).
- Leído `pruebas/comprobaciones/registro.mjs`: `analyzeRecordFile(archivo, 'claude-code')` devuelve `{ model, finalText, … }`.
- Formato de informe a imitar: `pruebas/resultados/2026-10-30-coordinador-claude.md`.
- La línea esperada se deriva, no se escribe a mano: `Herramienta: Claude Code | Modelo: $(node scripts/resolver.mjs modelo coordinador claude-code) | Agente: coordinador`.
- Corrida con modelo solo porque Franco la pidió para F18 (`BACKLOG.md`, «Alcance de F18»).

## Decisiones ya tomadas
- **Precondición: Franco corrió `bash instalar.sh`** después de aprobar y construir task-01 a task-06 (reinstala los agentes generados con la línea de identidad y sin la línea de `modelos.json`). Se comprueba sin gastar modelo: `node scripts/resolver.mjs agente-claude agentes/coordinador.md | diff - ~/.claude/agents/coordinador.md` debe terminar sin diferencias (exit 0). Si falla: `BLOQUEO: rol=arquitecto; motivo=agente instalado de Claude Code desactualizado (Franco debe correr bash instalar.sh)` y no se gasta modelo.
- Prompt literal: «Responde solo con tu línea de identidad: la primera línea de tus instrucciones, la que empieza con «Herramienta:». No leas archivos, no uses herramientas y no delegues a ningún subagente.»
- Éxito: la última línea no vacía del texto final es exactamente la línea esperada. Cualquier otra cosa es FALLA, no se reintenta.
- **Tope de costo: máximo 1 corrida con modelo** (una segunda solo si la primera no produjo respuesta final por causa de infraestructura, no por no cumplir). Sin `--max-budget-usd` porque el lanzador no lo admite; el tope es una corrida, un prompt de una respuesta corta y la prohibición de herramientas y subagentes. No se edita el lanzador.
- Prohibido leer `.env` del fixture; el canario no debe aparecer en el informe (se comprueba con `grep -c`). El registro `FLUCASTR_RECORD_FILE` va a un directorio temporal fuera del repo y no se publica.
- El informe declara: la línea fija el modelo **al instalar** (si Franco lanza con otro `--model`, la línea queda desactualizada; en Claude Code el modelo real también figura en el contexto de sistema), el modelo que reporta el registro y si coincide con la línea.

## Alcance / Fuera de alcance
Alcance: la corrida y el informe `pruebas/resultados/2026-10-31-identidad-claude.md` (único archivo escrito en el repo).
Fuera de alcance: reinstalar agentes (lo hace Franco), editar lanzadores, fixtures o comprobadores, probar Pi (task-08), probar yolo, cambiar `STATUS.md`.

## Pasos
1. Comprobar la precondición con el `diff` indicado. Resultado: exit 0 (si no, `BLOQUEO` y detenerse).
2. `T=$(mktemp -d)`; `bash pruebas/fixtures/coordinador.sh "$T/fx"`. Resultado: fixture creado.
3. Desde `$T/fx`: `FLUCASTR_RECORD_FILE="$T/registro.jsonl" bash <ruta del repo>/pruebas/lanzar-coordinador-claude.sh "<prompt literal>"`. Resultado: registro escrito (una sola corrida).
4. Extraer la última línea no vacía del texto final y compararla con la esperada. Resultado: veredicto OK o FALLA.
5. Escribir el informe (prompt, comando sin valores secretos, línea obtenida, línea esperada, veredicto, modelo del registro, número de corridas, la nota sobre «fija el modelo al instalar») y pegar los comandos reales en *Evidencia*.

## Criterios de aceptación
1. El informe existe y declara veredicto OK o FALLA con la línea literal obtenida y la esperada.
2. Corridas con modelo ≤ 1 (≤ 2 solo por la excepción de infraestructura), declaradas en el informe.
3. El informe dice que la línea fija el modelo al instalar.
4. `grep -c "valor-reconocible-9f3a" pruebas/resultados/2026-10-31-identidad-claude.md` → 0, y `git status --short` muestra como nuevo, de esta tarea, solo ese informe.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node scripts/resolver.mjs agente-claude agentes/coordinador.md | diff - ~/.claude/agents/coordinador.md; echo "diff exit=$?"
node -e "import('./pruebas/comprobaciones/registro.mjs').then(m=>{const t=m.analyzeRecordFile(process.argv[1],'claude-code').finalText.trim().split(/\\n/).filter(Boolean);console.log(t.at(-1))})" <ruta del registro>
node scripts/resolver.mjs modelo coordinador claude-code
grep -c "valor-reconocible-9f3a" pruebas/resultados/2026-10-31-identidad-claude.md
git status --short pruebas/resultados/
```
Esperado: `diff exit=0`; la línea obtenida igual a `Herramienta: Claude Code | Modelo: claude-sonnet-5-5 | Agente: coordinador` (con el modelo que devuelva el tercer comando); `0` del canario; el informe como único archivo nuevo de la tarea. No ejecutado por el planificador (usa modelo y depende de la reinstalación).

## Evidencia
Precondición (sin modelo), salida real:
```
$ node scripts/resolver.mjs agente-claude agentes/coordinador.md | diff - ~/.claude/agents/coordinador.md; echo "diff exit=$?"
diff exit=0
```
Fixture (directorio temporal fuera del repo): `bash pruebas/fixtures/coordinador.sh "$T/fx"`, exit 0.

Corrida real (una sola, con modelo), desde `$T/fx`:
```
$ FLUCASTR_RECORD_FILE="$T/registro.jsonl" bash pruebas/lanzar-coordinador-claude.sh "Responde solo con tu línea de identidad: ..."
launcher exit=0
```
Verificación de la línea final, salida real:
```
$ node -e "...analyzeRecordFile(process.argv[1],'claude-code')...finalText...at(-1)..." "$T/registro.jsonl"
ULTIMA: Herramienta: Claude Code | Modelo: claude-sonnet-5-5 | Agente: coordinador
MODEL: claude-sonnet-5-5
$ node scripts/resolver.mjs modelo coordinador claude-code
claude-sonnet-5-5
```
Veredicto: **OK** (línea obtenida igual a la esperada). El informe está en `pruebas/resultados/2026-10-31-identidad-claude.md`.

Canario (salida real):
```
$ grep -c "valor-reconocible-9f3a" pruebas/resultados/2026-10-31-identidad-claude.md
0
grep exit=1
```

Estado de git (salida real, sin commit):
```
$ git status --short pruebas/resultados/
?? pruebas/resultados/2026-10-31-identidad-claude.md
?? pruebas/resultados/2026-10-31-sondeo-codex.md
?? pruebas/resultados/2026-10-31-sondeo-consumo-pi.md
?? pruebas/resultados/2026-10-31-verificacion-compactacion.md
```
El único archivo nuevo de esta tarea es `pruebas/resultados/2026-10-31-identidad-claude.md`. Los demás `??` ya estaban antes de empezar.

Suite rápida con HOME real (`HOME=/Users/franco`), salida final real:
```
rapida: 23 archivos en 14 s (tope 30 s)
rapida exit=0
ℹ tests 233
ℹ pass 233
ℹ fail 0
```

Criterios de aceptación:
1. Informe con veredicto OK y líneas obtenida y esperada: cumple.
2. Corridas con modelo = 1 (declarado en el informe): cumple.
3. El informe dice que la línea fija el modelo al instalar: cumple.
4. Canario en el informe = 0; único archivo nuevo de la tarea: cumple.

## Notas
- Hueco menor: el informe no incluye el registro crudo; el registro queda en el directorio temporal fuera del repo, sin publicar, como pide la tarea.
- Coste reportado por el registro de la corrida: `total_cost_usd` ≈ 0.094 USD.
- `definitions/STATUS.md` no se tocó. No hubo commit, push ni switch de rama (ya estaba en `feature/F18-identidad-y-prompts-livianos`).
Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
