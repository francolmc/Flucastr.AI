# Cuándo dividir un tramo

Dividir un tramo tiene un costo fijo: un arranque nuevo del builder, una verificación extra y una revisión del planner. Divide solo cuando el costo compra algo que se puede comprobar.

## Cuándo ayuda dividir

- Dos A# tocan archivos de producto disjuntos: cada uno gana su comprobación y su revisión.
- Un A# nuevo tiene una comprobación propia de nivel 1 que puede fallar sin arrastrar a los demás.
- Una parte puede quedar verificada y entregada antes que la otra sin esperar.

## Cuándo solo suma costo

- Un tramo con un A# y un archivo: dividirlo de nuevo no añade nada comprobable.
- Dos A# que tocan los mismos archivos: separarlos repite el arranque y no separa el fallo.
- Un tramo que solo añade documentación enlazada al código del mismo tramo.

## Avisos de `review-plan` y sus falsos positivos conocidos

- A# que no comparten archivo por diseño (documentación frente a código): el aviso de mezcla es falso.
- Archivos raíz sin «/» (por ejemplo `.gitconfig`): el script no los ve como archivos de producto.
- La palabra «level» o «nivel» dentro de la prosa de la línea de verificación: puede confundir la lectura del nivel.
- Revisar un tramo suelto lo trata como último del plan, así que avisa de nivel 2 o 3 que aún no aplica.

Un aviso residual que no aplique se explica en una línea, como indica la regla 15 de `plan-change`.

## Ejemplo

Un tramo con un A# y un archivo no gana nada al dividirse otra vez. Dos A# sobre archivos disjuntos ganan una comprobación cada uno.
