# Decisión de estructura del repositorio

## Estructura implementada

La estructura nueva está implementada en `core/` (agentes, contratos, recetas y skills), `adapters/` (Claude Code, Codex, Pi y componentes compartidos), `tools/` (instalación, resolución de modelos, observación, ejecución, uso, verificación y desinstalación), `evals/` y `tests/`. La documentación vigente permanece en `docs/`; esta decisión vive en `docs/decisions/`. Las entradas públicas de la raíz, entre ellas `instalar.sh`, `instalar-remoto.sh`, `desinstalar.sh` y `verify`, siguen en sus rutas actuales.

## Copias de compatibilidad

Las rutas nuevas de `core/` y las rutas heredadas que consumen las instalaciones se mantienen como archivos regulares, sin enlaces simbólicos. El inventario completo de pares está en `tools/core-compatibility.json`: incluye los contratos y agentes en `core/` frente a `nucleo/` y `agentes/`, las skills de `core/skills/` frente a `skills/`, y la receta `core/recipes/node-pnpm.md` frente a `nucleo/recetas/node-pnpm.md`.

`node tools/verify/core-compatibility.mjs` valida que las rutas sean seguras y existan como archivos regulares, y compara contenido y permisos ejecutables. `./verify` incorpora ese control en la fase de coherencia estructural (`tools/verify/models.sh`). Así se conservan las rutas que esperan los instaladores y usuarios mientras el contenido equivalente también está disponible bajo `core/`.

## Rutas heredadas e históricos

`agentes/`, `skills/`, `nucleo/`, `scripts/`, `pruebas/` y `cambios/` son rutas implementadas que se conservan por compatibilidad con instrucciones, comandos, pruebas y planes existentes. `scripts/uso.mjs` mantiene la entrada `node scripts/uso.mjs` y coordina la interfaz CLI con las responsabilidades extraídas a `tools/usage/`.

`old/` y `cambios/hechos/` son rutas históricas existentes y permanecen en su sitio. No se trasladan ni editan como parte de esta decisión; `old/v1/` también forma parte del contrato de migración de proyectos. `changes/HISTORY.md` y `archive/README.md` ya existen como índices de orientación, y `changes/` y `archive/` contienen esos índices. Esto no traslada el registro de cambios cerrados desde `cambios/hechos/` ni el árbol histórico desde `old/`: una migración o archivo completo bajo esos destinos sigue siendo una propuesta descrita en `cambios/estructura-repo/estructura-destino.md`.

## Tamaño de módulos

La guía para módulos nuevos es mantener cada archivo enfocado y, cuando sea práctico, dentro de 300 líneas. `instalar-remoto.sh` tiene 322 líneas y es una excepción justificada: se distribuye y ejecuta como un único bootstrap antes de descargar y extraer el árbol `tools/`; extraer una dependencia a ese árbol impediría que la entrada remota funcionara en ese momento. Su justificación y comprobaciones están registradas en `cambios/estructura-repo/tramo-100.md`.

`scripts/uso.mjs` tiene 318 líneas y conserva la entrada CLI pública, el análisis de argumentos y la coordinación del comando; las operaciones y el formato de informes ya están separados bajo `tools/usage/`. Mantener ese envoltorio en su ruta evita cambiar el comando consumido por usuarios e instaladores. La extracción restante o un cambio de entrada requiere un tramo posterior que preserve y compruebe ese contrato.

## Alcance de la decisión

Esta estructura distingue entre rutas existentes y la función que cumplen: los índices en `changes/` y `archive/` son rutas disponibles, pero no indican que se haya migrado el contenido histórico. Cualquier traslado futuro debe actualizar en el mismo cambio los consumidores y las verificaciones de compatibilidad, y dejar intactos los históricos protegidos.
