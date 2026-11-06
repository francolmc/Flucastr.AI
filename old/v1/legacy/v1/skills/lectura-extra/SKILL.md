---
name: lectura-extra
description: "Excepción de lectura para arquitecto, planificador y constructor: cuándo leer un archivo de `Evita leer:` o de «No lees…», con tope y declaración. No aplica al coordinador."
---

# Lectura extra

1. Un archivo de `Evita leer:` del encargo, o de «No lees…» de tu agente, se lee solo si la tarea no se puede cerrar sin él. Antes, ubica la sección con `grep -n '^## '` y lee solo esa con `offset` y `limit`.
2. Tope: 15 KB por lectura, 3 lecturas y 30 KB por llamada.
3. Declara cada lectura en tu retorno, tras la primera línea de estado: `Lectura extra: <ruta>; motivo=<qué te falta>`.
4. Si hace falta más que el tope, o el archivo es duro (`.env`, llaves, credenciales, `registro/`, `features/completed/`), no lo leas y responde con la primera línea `BLOQUEO: rol=franco; motivo=lectura: <ruta>`. No se enruta a otro rol.
5. Esta excepción no aplica al `coordinador`.
