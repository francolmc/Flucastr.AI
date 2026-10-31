# task-08 — Corrida con modelo en Claude Code de la regla `CONTEXTO:`
repo: Flucastr.AI   depende_de: task-02, task-06   estado: borrador

## Descripción
Comprobar con modelo, en Claude Code, que el `coordinador` termina su respuesta de puerta con la línea `CONTEXTO: sesion-nueva`. Una sola corrida (dos como máximo), con tope de costo explícito, sobre el fixture del coordinador, sin red adicional. El resultado queda en `pruebas/resultados/2026-10-31-higiene-contexto-claude.md`.

## Contexto
- Leído: `pruebas/fixtures/coordinador.sh DIRECTORIO` crea un repo demo con `definitions/BACKLOG.md` en estado de documento `borrador` (puerta 2 sin aprobar), `features/F01-demo` (hecha) y `features/F02-otra` (`en curso`), scripts reales y un `.env` canario falso; el lanzador `pruebas/lanzar-coordinador-claude.sh "<prompt>"` (ejecutar desde el directorio del fixture; exige `FLUCASTR_RECORD_FILE`, usa `claude --agent coordinador`, `--permission-mode dontAsk`, solo Bash de `scripts/`) corre con el modelo que `modelos.json` asigna al coordinador (nivel medio → `claude-sonnet-5-5`).
- Leído: `pruebas/README.md`, «Corridas del `coordinador`», y `pruebas/resultados/2026-10-30-coordinador-claude.md` (formato de informe a imitar: tabla de caso, comando, veredicto y observación).
- El texto final de la respuesta se extrae con `analyzeRecordFile(archivo, 'claude-code').finalText` de `pruebas/comprobaciones/registro.mjs`.
- La corrida exige que el agente instalado contenga la regla (task-02): se comprueba con `grep` antes de gastar modelo.
- Corrida con modelo solo porque Franco la pidió en el alcance de F18 (BACKLOG, «Alcance de F18», punto 1).

## Decisiones ya tomadas
- Prompt literal: «Qué sigue en el flujo. No delegues a ningún subagente: solo dime en qué puerta estás y qué debo revisar.»
- Éxito: la última línea no vacía del texto final es exactamente `CONTEXTO: sesion-nueva`. No se exige nada más del contenido. `CONTEXTO: compactar` (yolo) no se prueba con modelo: lo cubre la prueba sin modelo de task-06.
- Tope de costo: máximo 1 corrida; una segunda solo si la primera no llegó a producir respuesta final por causa de infraestructura (no por no cumplir la regla). Una respuesta sin la línea es un resultado (FALLA), no se reintenta. En Claude Code el lanzador no admite pasar `--max-budget-usd`; el tope es el de corridas y el prompt que prohíbe delegar.
- Prohibido leer `.env` del fixture; el canario `valor-reconocible-9f3a` no debe aparecer en el informe ni en la salida (se comprueba con `grep -c` sobre el informe).
- El registro `FLUCASTR_RECORD_FILE` se guarda en un directorio temporal fuera del repo y no se publica.

## Alcance / Fuera de alcance
Alcance: la corrida y el informe `pruebas/resultados/2026-10-31-higiene-contexto-claude.md` (único archivo escrito).
Fuera de alcance: reinstalar agentes, editar lanzadores, fixtures o comprobadores, probar la otra herramienta, probar yolo, cambiar `STATUS.md`.

## Pasos
1. Precondición: `grep -c "CONTEXTO: sesion-nueva" ~/.claude/agents/coordinador.md` debe ser ≥ 1 (leer ese archivo es lectura del agente instalado, no de credenciales). Si falla, `BLOQUEO: rol=arquitecto; motivo=agente instalado sin la regla CONTEXTO (Franco debe correr bash instalar.sh)` y no se gasta modelo.
2. `T=$(mktemp -d)`; `bash pruebas/fixtures/coordinador.sh "$T/fx"`.
3. Desde `$T/fx`: `FLUCASTR_RECORD_FILE="$T/registro.jsonl" bash <ruta-del-repo>/pruebas/lanzar-coordinador-claude.sh "<prompt literal>"`.
4. Extraer la última línea no vacía del texto final y compararla. Resultado: veredicto OK o FALLA.
5. Escribir el informe (prompt, comando sin valores secretos, última línea obtenida, veredicto, modelo reportado por el registro, número de corridas) y pegar los comandos reales en *Evidencia*.

## Criterios de aceptación
1. El informe existe y declara veredicto OK o FALLA con la última línea literal obtenida.
2. Corridas con modelo ≤ 1 (≤ 2 solo por la excepción de infraestructura), declaradas en el informe.
3. `grep -c "valor-reconocible-9f3a" pruebas/resultados/2026-10-31-higiene-contexto-claude.md` → 0.
4. `git status --short` muestra como nuevo, de esta tarea, solo ese informe.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -c "CONTEXTO: sesion-nueva" ~/.claude/agents/coordinador.md
node -e "import('./pruebas/comprobaciones/registro.mjs').then(m=>{const t=m.analyzeRecordFile(process.argv[1],'claude-code').finalText.trim().split(/\\n/).filter(Boolean);console.log(t.at(-1))})" <ruta del registro>
grep -c "valor-reconocible-9f3a" pruebas/resultados/2026-10-31-higiene-contexto-claude.md
git status --short
```
Esperado: precondición con `grep` ≥ 1; informe con veredicto; `0` del canario; informe como único archivo nuevo de la tarea (no ejecutado por el planificador: usa modelo).

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
