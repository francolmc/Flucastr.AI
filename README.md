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
- Ejecutar el builder Pi en una ventana propia: `pi-builder`.

Para más detalle, consulta la [guía de uso](docs/guide.md#qué-es).
