---
name: diagnosticar
description: "Diagnose a project against the verification contract (missing capabilities, current cost, and one improvement), on request and read-only. Use when the user asks for ‘diagnostica’."
---

# Diagnose a Project

When: only when the user asks (“diagnostica”). Do not run while planning or building. Read-only: do not write files, run `verify`, or block anything. Blocking conditions are documented in `agentes/principal.md`, “Qué bloquea y qué no”.

## How

1. From the project root, run the script next to this skill in JSON mode for evaluation:
   `node <this-skill-folder>/diagnosticar.mjs . --json`
   The script does not execute declared commands: it only checks whether they appear in `AGENTS.md`, whether `resultado.json` is valid and current, how many flow files exist, and Node recipe rules. If a command should be run, decide that based on context; do not run `verify` for this diagnosis.
2. Respond **in the conversation**, in three parts:
   - **(a) What is missing:** capabilities marked `falta`, invalid or stale `resultado.json`, and warnings.
   - **(b) Current cost:** observable data only: measured run duration, `git log` (fixes that returned), plans in `cambios/` with `PAUSA` or `DEVUELTO`, and code files without tests. If there is no data, write “sin evidencia”. Do not estimate figures.
   - **(c) One recommended improvement:** what it is, why, and estimated size. If nothing is missing, say “sin faltas” and do not propose an improvement.
3. Do not write any project files.
