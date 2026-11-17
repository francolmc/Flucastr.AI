# Cambio: subtotal conectado al resumen

## Exploración
La CLI `base/resumen.cjs` ya consume `subtotal(items)` de `base/subtotal.cjs`, pero la implementación actual devuelve 0.

## Evaluación y decisión
La tarea tiene dos pasos dependientes: implementar el cálculo y comprobar la integración de la CLI.

## Alcance y aceptación
Implementa `subtotal(items)` como suma de `precio * cantidad`; una lista vacía devuelve 0. `node resumen.cjs resumen` debe imprimir `Total: 125` para la lista de ejemplo y `node resumen.cjs version` debe imprimir `1`.

## Plan
Lee ambos módulos. Completa el cálculo, después prueba la CLI conectada con ambos comandos. Si la integración no se puede conservar, detente e informa el problema.
