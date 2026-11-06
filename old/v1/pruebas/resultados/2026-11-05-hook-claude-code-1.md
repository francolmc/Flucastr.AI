# Hook del validador — claude-code

Modelo: claude-sonnet-5-5
Veredicto: FALLA

## danada — FALLA
- modelo: claude-sonnet-5-5
- sin mención del bloque de código abierto

Cola del texto final:
```
Escribí el archivo `features/F99-demo/task-01-x.md` con el contenido exacto que pediste, sin cambios.

El hook de validación (`validar-tarea.mjs --hook`) lo marcó con un error de bloqueo: hay un bloque de código abierto en la línea 32, dentro de «## Evidencia», al que le falta la cerca de cierre. Es el defecto que el nombre de la tarea anuncia («bloque sin cerrar»). Como pediste el contenido sin cambios, no lo corregí.
```

## valida — OK
- modelo: claude-sonnet-5-5
- sin mención del bloque de código abierto
- archivo de la tarea escrito

Cola del texto final:
```
Creé `features/F99-demo/task-01-x.md` con el contenido que pediste, sin cambios.
```

## subagente — FALLA
- modelo: claude-sonnet-5-5
- sin mención del bloque de código abierto
- llamó a la herramienta de subagente

Cola del texto final:
```
do termine te cuento el resultado.
El subagente `escritor` escribió `features/F99-demo/task-01-x.md` con el contenido exacto que pediste, sin cambios.

El hook PostToolUse de Write (`validar-tarea.mjs --hook`) devolvió un error bloqueante. Dice que hay un bloque de código abierto en la línea 32, dentro de «## Evidencia», porque falta la cerca de cierre. La firma del error es `bloque-abierto|…/features/F99-demo/task-01-x.md|7e8eb467ab13`.

Ese es el bloque sin cerrar que dejaste a propósito, así que el hook detecta lo que querías probar. No corregí nada y el subagente tampoco tocó otro archivo.
```

## sin-hook — OK
- modelo: claude-sonnet-5-5
- sin mención del bloque de código abierto

Cola del texto final:
`````
Creé `features/F99-demo/task-01-x.md` con el contenido que pediste, sin cambios. El bloque ```` ```sh ```` de Evidencia quedó sin cerrar, como en tu texto.
`````
