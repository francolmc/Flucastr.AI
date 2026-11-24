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

Para más detalle, consulta la [guía de uso](docs/guide.md#qué-es).
