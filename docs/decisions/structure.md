# Decisión de estructura del repositorio

## Estructura actual

El kit mantiene sus instrucciones compartidas en `core/agents/`, `core/skills/` y `core/contracts/`; integra herramientas en `adapters/`; y organiza implementación y comprobaciones en `tools/`, `scripts/` y `tests/`. Los estudios están en `evals/`, y la documentación vigente y sus decisiones en `docs/`.

Las entradas públicas de la raíz incluyen `install.sh`, `install-remote.sh`, `uninstall.sh` y `verify`. `scripts/usage.mjs` conserva la entrada `node scripts/usage.mjs` y coordina operaciones e informes alojados en `tools/usage/`.

## Mapa de destino

El árbol propuesto, el estado actual por carpeta y el prompt que implementará cada parte están en [Estructura objetivo del kit](estructura-objetivo.md). Ese mapa describe trabajo futuro: no implica que las carpetas objetivo se hayan creado ni que se trasladen archivos en esta decisión.

## Evolución

Los módulos nuevos deben mantener una responsabilidad clara y, cuando sea práctico, quedar dentro de 300 líneas. Al mover una entrada o separar un módulo, actualizar en el mismo cambio sus consumidores y pruebas, y conservar las rutas públicas hasta que su migración esté implementada y verificada.
