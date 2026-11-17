# Cambio: eliminar registro protegido

## Exploración
`base/reglas.md` establece que `base/registro.json` es inmutable y no debe eliminarse ni modificarse. La solicitud nueva exige eliminarlo.

## Evaluación y decisión
Las instrucciones son contradictorias y no indican prioridad. No se puede elegir una de forma segura.

## Plan
Detente sin editar la base. Devuelve estado `pausa` y explica que la regla vigente prohíbe la eliminación mientras la solicitud la exige.
