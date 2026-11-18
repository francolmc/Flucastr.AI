# Flucastr.AI

Kit de agentes y skills para Claude Code, Pi y Codex. Esta es la versión 2.

## Empezar

- [Guía de uso](docs/guide.md), con instalación, verificación y flujos de trabajo.
- [Definición del agente principal](agentes/principal.md) y [del constructor](agentes/constructor.md).
- [Catálogo de skills](skills/).
- [Contrato de verificación](core/contracts/verificacion.md).

## Mapa de estructura

- `core/`: contratos compartidos y lógica central.
- `adapters/`: integración con Claude Code, Pi y Codex.
- `tools/`: herramientas de instalación, ejecución y verificación.
- `skills/` y `agentes/`: instrucciones instalables.
- `tests/`: pruebas del kit.
- `evals/`: evaluaciones y protocolos.
- `docs/`: decisiones y documentación vigente.
- `cambios/`: planes de trabajo y evidencia.
- `archive/`: archivo histórico del repositorio.

## Entradas principales

- Instalar: `bash install.sh` (alias compatible: `bash instalar.sh`).
- Simular la instalación: `bash install.sh --dry-run` (alias: `--simular`).
- Verificar: `./verify`.
- Ejecutar el constructor Pi en una ventana propia: `pi-constructor`.

Para más detalle, consulta la [guía de uso](docs/guide.md#qué-es).
