# Repos — Flucastr.AI

> Estado: **aprobado por Franco** (2026-10-29). **Cambio por aprobar (F09, 2026-10-30):** visibilidad pública del remoto y nuevas conexiones (sección «Cambio por aprobar»).

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

## Cambio por aprobar (F09, 2026-10-30)

- **Visibilidad del remoto: se decide PÚBLICO** (Franco, 2026-10-30), para que el PC de trabajo descargue sin credenciales. **Lo hace Franco**; ningún agente cambia la visibilidad ni hace push. **Pendiente previo:** Franco revisa el repo y su historial completo (credenciales, datos personales; ver `PROJECT.md`, «Repo público») y solo después lo publica. Hasta que lo publique, el dato sigue siendo «privado o no verificado».
- Nueva fila de conexiones hacia fuera: el PC de trabajo lee `main` por HTTPS (`raw.githubusercontent.com`, `api.github.com`, `codeload.github.com`), sin `git` ni credenciales. `initialize.sh` ya no necesita credenciales para clonar este repo cuando sea público.

| Desde | Hacia | Medio |
|---|---|---|
| GitHub `main` (público) | `~/.flucastr-ai/kit/` | `instalar-remoto.sh`: descarga `tar.gz` de un sha, verifica y copia |
| `~/.flucastr-ai/kit/skills/<n>/` | `~/.claude/skills/`, `~/.pi/agent/skills/` | copia (marca `.flucastr-ai`), sin enlaces, solo en modo descarga |
| `~/.flucastr-ai/modelos.json` | `scripts/resolver.mjs`, lanzador `pi-<agente>` | variable `FLUCASTR_MODELOS` |

## Datos que faltan

- **Visibilidad del remoto:** decidida pública (arriba), **aún no ejecutada ni verificada**. La URL consta en `git remote -v`; no verifiqué que el remoto responda ni qué contiene.
- **Cambios sin commit**: 27 archivos modificados y 1 sin seguimiento (`git status`), sobre todo `pruebas/`, `skills/` y `agentes/arquitecto.md`.
- **Fecha de `pruebas/resultados/2026-11-02-…`**: es posterior a la fecha actual (2026-10-29). Sin explicar.

## Estado

Aprobado por Franco el 2026-10-29.
