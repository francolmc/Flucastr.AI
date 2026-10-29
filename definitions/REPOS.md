# Repos — Flucastr.AI

> Estado: **aprobado por Franco** (2026-10-29).

| Repo | Rol | URL remota | Rama principal | Stack | Origen del dato |
|---|---|---|---|---|---|
| `Flucastr.AI` | Kit personal de agentes, skills, instaladores y pruebas para Claude Code y Pi. Único repo. | `https://github.com/francolmc/Flucastr.AI.git` | `main` | Markdown (agentes, skills, docs), JSON (`modelos.json`), Bash (`instalar.sh`, `desinstalar.sh`, `pruebas/*.sh`), Node ESM (`scripts/resolver.mjs`, `pruebas/**/*.mjs`, `node --test`) | `git remote -v`, `git branch --show-current`, lectura de `README.md` y `pruebas/README.md` |

Ruta local: `/Users/franco/Codes/flucastr/Flucastr.AI` (confirmado).

## Conexiones entre repos

No aplica: un solo repo. Conexiones hacia fuera (de `README.md`; **no re-verificadas contra `instalar.sh` en esta revisión**):

| Desde | Hacia | Medio |
|---|---|---|
| `skills/<nombre>/` | `~/.claude/skills/` y `~/.pi/agent/skills/` | enlace simbólico |
| `agentes/<nombre>.md` + `modelos.json` | `~/.claude/agents/`, `~/.pi/agent/agents/` | archivo generado por `scripts/resolver.mjs` |
| `modelos.json` | `~/.local/bin/pi-<nombre>` | lanzador que lee el JSON en vivo |
| `instalar.sh --proyecto <ruta>` | `<ruta>/.claude/settings.local.json` | escribe `{"agent": ...}` |

## Datos que faltan

- **Visibilidad del remoto** (público o privado): no consta. La URL sí, de `git remote -v`; no verifiqué que el remoto responda ni qué contiene.
- **Cambios sin commit**: 27 archivos modificados y 1 sin seguimiento (`git status`), sobre todo `pruebas/`, `skills/` y `agentes/arquitecto.md`.
- **Fecha de `pruebas/resultados/2026-11-02-…`**: es posterior a la fecha actual (2026-10-29). Sin explicar.

## Estado

Aprobado por Franco el 2026-10-29.
