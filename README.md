# Flucastr.AI

Kit de agentes y skills para Claude Code, Pi y Codex. Esta es la versión 2.

## Empezar

- [Guía de uso](docs/guide.md), con instalación, verificación y flujos de trabajo.
- [Definición del agente planner](core/agents/planner.md) y [del builder](core/agents/builder.md).
- [Catálogo de skills](core/skills/).
- [Contrato de verificación](core/contracts/verification.md).

## Mapa de estructura

- `core/`: contratos compartidos y lógica central.
- `adapters/`: integración con Claude Code, Pi y Codex.
- `tools/`: herramientas de instalación, ejecución y verificación.
- `core/agents/` y `core/skills/`: instrucciones instalables.
- `tests/`: pruebas del kit.
- `evals/`: evaluaciones y protocolos.
- `docs/`: decisiones y documentación vigente.
- `changes/`: planes de trabajo y evidencia.
- `archive/`: archivo histórico del repositorio.

## Entradas principales

- Instalar: `bash install.sh`.
- Simular la instalación: `bash install.sh --dry-run`.
- Verificar: `./verify`.
- Comprobar los criterios A# de un plan sin modelo: `node scripts/kit-check.mjs <plan> [--segment N] [--timeout <seg>] [--revisado A#,...]`. Imprime una tabla `A# | estado | comando ejecutado | motivo/cola` y sale con 0 (todo pasa), 1 (algún falla), 3 (bloqueado o no automatizable sin revisar) o 2 (uso o plan mal formado). Formatos soportados y excluidos en `tests/README.md`.
- Contrastar el Scope de un plan con los cambios de Git: `node scripts/kit-scope.mjs <plan> [--base <rama>] [--json]`. Compara los archivos cambiados con `Scope:` y marca lo prohibido. Sale con 0 (sin errores; los avisos de omisión no cuentan), 1 (cambio fuera de Scope, prohibido o cambio del propio plan en Scope o A#), 3 (no verificable: Scope no interpretable, Git no puede leer la base, o el plan no tiene versión previa en la base, como un plan ya mergeado) o 2 (uso o plan mal formado). `--json` imprime el informe en JSON.
- Revisar el cierre mecánico de un plan: `node scripts/kit-close.mjs <plan> [--resultado DONE|PAUSED] [--json]`. Sin modelo y solo de lectura: revisa casillas pendientes, evidencia por paso, cobertura de A#, estado del frontmatter y la nota de reanudación. Sale con 0 (sin errores), 1 (hay errores), 3 (no verificable: sin `--resultado` del builder o formato sin parsear) o 2 (uso o plan inexistente). Sin `--resultado` no puede comprobar la coherencia con el resultado del builder; en ese caso marca «no verificable».
- Ejecutar el builder Pi en una ventana propia: `pi-builder`.

## Ventanas de compactación

Valores previstos por agente y herramienta, con la ventana de Pi fijada en 272000. Son referencia; el comando `ventanas` muestra los valores reales de cada equipo:

| Agente | Claude Code (ventana / disparo) | Codex (disparo) | Pi con ventana 272000 (disparo) |
|---|---|---|---|
| planner | 300000 / 267000 | 200000 | 180000 |
| builder | 200000 / 167000 | 150000 | 180000 |
| revisor | 300000 / 267000 (hereda el proyecto) | 200000 | 180000 |

- Regla: `ventana >= piso medido + 33000 + margen de al menos 100000` en Claude Code, porque su disparo es ventana − 33000. En Codex y Pi se compara el disparo: disparo − piso ≥ 100000. Con el piso del planner (102971), Claude necesita una ventana de al menos 235971.
- Celdas bajo el margen con ese piso: Codex planner (97029) y revisor (97029), y Pi planner (77029) y revisor (77029). Salen como AVISO. Claude planner (164029) cumple. El builder tiene «piso sin medir» y no avisa.

- Ver la ventana efectiva por proyecto, herramienta y agente: `node scripts/resolver.mjs ventanas [proyecto…]`. Suma los proyectos de `~/.flucastr-ai/manifiesto.txt`. Es solo lectura y muestra las columnas proyecto, herramienta, agente, vía, ventana, disparo, origen, piso y estado. Sale con 0 (sin avisos), 1 (hay avisos) o 2 (uso, por ejemplo una opción desconocida).
- Disparo: en Claude Code, ventana − 33000; en Codex, la ventana; en Pi, ventana − reserva. Si disparo − piso es menor que `work_margin` (100000), la fila sale como AVISO.
- Claude Code, precedencia: `CLAUDE_CODE_AUTO_COMPACT_WINDOW` (entorno o bloque `env`) > `--autocompact` del lanzador `claude-<agente>` > ajustes por archivo, en orden local > proyecto > usuario. Dentro de cada archivo, `modelSettings.<modelo>.autoCompactWindow` gana a `autoCompactWindow`, y un archivo sin valor cede al siguiente. El modelo es el de `models.json` para ese agente.
- Filas de Claude Code: `claude-<agente>` solo aparece si el lanzador tiene `--autocompact`; `sesión` muestra la ventana que aplican el entorno y los ajustes (sin valor: `sin fijar`). El builder es subagente y toma la menor entre su frontmatter y la ventana efectiva del planner. El revisor hereda la ventana efectiva del planner.
- Avisos: variable de entorno de compactación, `modelSettings`, `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`, planner o revisor sin fijar, y margen corto.
- Piso: el medido de la propia herramienta; si no existe, el del mismo agente en otra herramienta, marcado «prestado» (el revisor usa el del planner). El builder muestra «piso sin medir» y no avisa.
- Codex y Pi: solo se leen los ajustes globales (`CODEX_HOME/config.toml` y `PI_CODING_AGENT_DIR/settings.json`). No se leen los ajustes de proyecto de Codex ni de Pi.
- El comando imprime solo las claves de compactación, nunca otros valores de los ajustes. Los lanzadores y los ajustes los escribe `install.sh`; tras reinstalar, `ventanas` muestra lo instalado.

Para más detalle, consulta la [guía de uso](docs/guide.md#qué-es).

## Hook tras compactar y piso del planner

- Instalación: `bash install.sh --project <proyecto>` instala en el proyecto un hook `SessionStart` con matcher `compact`. En Claude Code va en `.claude/settings.local.json`; en Codex, en `.codex/hooks.json`. Los proyectos ya instalados repiten ese comando.
- Qué hace: tras compactar, `scripts/after-compact.mjs` imprime hasta 20 líneas con dónde están las notas, el plan, el tramo y la última cabecera de próxima acción (`## Next action` o `## Próxima acción`) del cambio activo. Solo lee, nunca imprime contenido de archivos y siempre sale con 0.
- Codex: la primera vez pide aprobar el hook de `.codex/hooks.json`. Hasta entonces no corre.
- Pi: no recibe hook. Su planner sigue la misma regla de `notes.md` desde `core/agents/planner.md`.
- Desinstalación: quita solo la entrada del kit; con `--keep-settings` conserva el archivo de ajustes.
- Sin probar en sesión real: el hook de Claude Code y el de Codex. Las pruebas ejecutan el script y el instalador con `HOME` temporal.
- Paso 23 de `./verify`: `node --test tests/context-size/*.test.mjs tests/after-compact/*.test.mjs`. Comprueba que `SKILL.md` pese 6144 bytes o menos, `core/agents/planner.md` 8192 o menos y `AGENTS.md` 6144 o menos, que las referencias nombradas existan, y que el hook se instale, se quite y apunte bien.
