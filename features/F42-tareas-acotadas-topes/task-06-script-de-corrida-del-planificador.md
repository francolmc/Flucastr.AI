# task-06 — Lanzador y script de corrida del planificador (Claude Code y Pi)
repo: Flucastr.AI   depende_de: task-05   estado: aprobada

## Descripción
Crea el lanzador del `planificador` para las dos herramientas y el script que arma el fixture, lanza al planificador una vez y escribe el informe en `pruebas/resultados/`. Solo mide; la corrida con modelo real es task-07. Patrón de `correr-repetido.sh`.

## Contexto
- Tocar: `pruebas/lanzar-planificador.sh`, `pruebas/correr-planificador.sh`, `pruebas/correr-planificador.test.mjs`
- Leer: `pruebas/correr-repetido.sh`, `pruebas/correr-repetido.test.mjs@1-45`, `pruebas/lanzar-coordinador-pi.sh`
- Patrón: `correr-repetido.sh` (precondición `modelos-agentes.mjs` omitible con `FLUCASTR_SIN_PRECONDICION=1`, informe con número libre `AAAA-MM-DD-<nombre>-<herramienta>-<k>.md`, `FLUCASTR_RESULTADOS`) y los modelos simulados de `correr-repetido.test.mjs`.
- De `depende_de:` lee solo las *Notas* de task-05.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- `lanzar-planificador.sh {claude-code|pi} "<prompt>"` corre desde el fixture. Claude Code: `claude -p --agent planificador --permission-mode dontAsk --permission-prompts none --no-session-persistence --output-format stream-json --verbose` con `--allowedTools` `Read(./**)`, `Write(./features/**)`, `Edit(./features/**)`, `Edit(./definitions/BACKLOG.md)`, `Skill`, `Bash(node scripts/validar-tarea.mjs *)`, `Bash(node ~/.flucastr-ai/validar-tarea.mjs *)`, `Bash(git branch --show-current)`, `Bash(ls *)`, `Bash(wc *)`; `--disallowedTools` `Read(./.env)`, `Bash(cat ./.env)`, `Bash(git commit *)`, `Bash(git push *)`. Pi: `pi-planificador --mode json --no-session -p` con tope `FLUCASTR_PI_TOPE` por defecto 600 s (descomponer lleva más que 300 s).
- `correr-planificador.sh {claude-code|pi}` usa el prompt de task-05, escribe `pruebas/resultados/AAAA-MM-DD-planificador-<herramienta>-<k>.md` e imprime `informe: <ruta>` y `Veredicto: OK|FALLA`; sale 0 si escribió el informe, 2 por uso o precondición.
- Variables `FLUCASTR_CLAUDE_BIN` y `FLUCASTR_PI_BIN` como en los lanzadores existentes.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: los dos scripts y 3 pruebas con modelo simulado: tareas dentro de los topes dan OK; una tarea con 5 archivos a leer da FALLA (control negativo); herramienta inválida sale 2.
Fuera de alcance: modelos reales (task-07), tocar los lanzadores existentes.

## Pasos
1. Corre `git branch --show-current`.
2. Escribe `lanzar-planificador.sh`.
3. Escribe `correr-planificador.sh`.
4. Escribe `correr-planificador.test.mjs` con los modelos simulados.
5. Corre la verificación.

## Criterios de aceptación
1. Con modelo simulado válido el informe dice `Veredicto: OK` (prueba).
2. Con modelo simulado que rompe un tope dice `Veredicto: FALLA` (prueba).
3. `bash -n` de los dos scripts no imprime nada.

## Verificación
```
git branch --show-current
bash -n pruebas/lanzar-planificador.sh pruebas/correr-planificador.sh
node --test pruebas/correr-planificador.test.mjs
```
Esperado: rama `feature/F42-tareas-acotadas-topes`; sin salida; `fail 0`.

## Evidencia

## Notas
