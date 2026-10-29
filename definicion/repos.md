# Repos — Flucastr.AI

> Estado: **borrador** (2026-10-28). Pendiente de aprobación de Franco.

| Repo | Rol | URL remota | Rama principal | Stack | Origen del dato |
|---|---|---|---|---|---|
| `Flucastr.AI` | Kit personal de agentes, skills e instaladores para Claude Code y Pi. Es el único repo del proyecto. | **Ninguna** (sin remoto configurado) | `main` | Markdown (agentes y skills), JSON (`modelos.json`), Bash (`instalar.sh`, `desinstalar.sh`), Node ESM (`scripts/resolver.mjs`) | `git remote -v` (vacío), `git branch`, lectura de archivos |

Ruta local: `/Users/franco/Codes/flucastr/Flucastr.AI` (confirmado, directorio de trabajo).

## Conexiones entre repos

No aplica: hay un solo repo. Conexiones **hacia fuera** del repo (todas confirmadas en `instalar.sh`):

| Desde | Hacia | Medio |
|---|---|---|
| `skills/<nombre>/` | `~/.claude/skills/<nombre>` y `~/.pi/agent/skills/<nombre>` | enlace simbólico |
| `agentes/<nombre>.md` + `modelos.json` | `~/.claude/agents/<nombre>.md` | archivo generado por `resolver.mjs` (con `model` resuelto) |
| `agentes/<nombre>.md` + `modelos.json` | `~/.pi/agent/agents/<nombre>.md` | archivo generado por `resolver.mjs` |
| `agentes/<nombre>.md` + `modelos.json` | `~/.local/bin/pi-<nombre>` | lanzador generado; lee `modelos.json` en vivo |
| `instalar.sh --proyecto <ruta>` | `<ruta>/.claude/settings.local.json` | escribe `{"agent": ...}` |
| `instalar.sh` | `~/.flucastr-ai/manifiesto.txt` | registro de lo instalado, para `desinstalar.sh` |

## Datos que faltan

- **URL remota y alojamiento** (GitHub u otro): no hay remoto. Por eso no corresponde `clonar.sh` por ahora.
- **Estado de los cambios**: `README.md` y `modelos.json` tienen cambios sin commit; `agentes/`, `skills/`, `scripts/`, `instalar.sh`, `desinstalar.sh` y `.gitignore` no están versionados (`git status`).
- **Si `instalar.sh` ya se ejecutó** en esta máquina: no lo verifiqué (no leo `~/.flucastr-ai/manifiesto.txt` ni lo ejecuto).
