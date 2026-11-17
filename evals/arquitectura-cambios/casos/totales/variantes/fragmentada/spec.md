# Comportamiento vigente y delta
La CLI conserva `version`, que imprime `1`, y el resumen ya consume la función exportada `subtotal(items)`.

## Delta
`subtotal(items)` suma `item.precio * item.cantidad`; con `[]` devuelve 0. La CLI `resumen` imprime `Total: 125` para `[{precio:50,cantidad:2},{precio:25,cantidad:1}]`.
