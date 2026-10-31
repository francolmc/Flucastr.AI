# Identidad del `coordinador` en Claude Code (F18, task-07), 2026-10-31

Corrida real con modelo: una sola (tope de costo de la tarea). Sin reintentos.

## Precondición

Franco corrió `bash instalar.sh`. Comprobación sin modelo:

```
$ node scripts/resolver.mjs agente-claude agentes/coordinador.md | diff - ~/.claude/agents/coordinador.md; echo "diff exit=$?"
diff exit=0
```

## Corrida

- Fixture: `pruebas/fixtures/coordinador.sh "$T/fx"` (directorio temporal fuera del repo).
- Lanzador: `FLUCASTR_RECORD_FILE="$T/registro.jsonl" bash pruebas/lanzar-coordinador-claude.sh "<prompt>"`, desde `$T/fx`. Sin `--max-budget-usd` (el lanzador no lo admite); el tope es una corrida, prompt de respuesta corta y prohibición de herramientas y subagentes.
- Prompt: «Responde solo con tu línea de identidad: la primera línea de tus instrucciones, la que empieza con «Herramienta:». No leas archivos, no uses herramientas y no delegues a ningún subagente.»
- Corridas con modelo: **1**.
- Registro: fuera del repo, no publicado. Coste reportado por el registro: `total_cost_usd` ≈ 0.094 USD.

## Resultado

- Línea obtenida: `Herramienta: Claude Code | Modelo: claude-sonnet-5-5 | Agente: coordinador`
- Línea esperada (derivada con `node scripts/resolver.mjs modelo coordinador claude-code` = `claude-sonnet-5-5`): `Herramienta: Claude Code | Modelo: claude-sonnet-5-5 | Agente: coordinador`
- Modelo que reporta el registro: `claude-sonnet-5-5`, igual que la línea.
- **Veredicto: OK.**

## Nota sobre la línea de identidad

La línea fija el modelo **al instalar** (la toma de `modelos.json` en `instalar.sh`). Si Franco lanza con otro `--model`, la línea queda desactualizada. En Claude Code el modelo real también figura en el contexto de sistema; por eso el registro del modelo se compara aparte de la línea.
