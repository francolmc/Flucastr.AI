# Calcular e integrar subtotal
## Exploración y decisión
La CLI `base/resumen.cjs` ya usa `subtotal(items)` de `base/subtotal.cjs`, pero hoy devuelve 0. Resuelve el cambio en dos pasos dependientes: cálculo y comprobación de integración.
## Comportamiento y aceptación
La función suma `precio * cantidad` y devuelve 0 para una lista vacía. El comando `resumen` imprime `Total: 125` para `[{precio:50,cantidad:2},{precio:25,cantidad:1}]`; `version` conserva `1`.
## Plan y detención
Lee los dos módulos; implementa primero la función y después comprueba la CLI conectada. Si base o aceptación difieren, detente y explica por qué.
