# Diagnóstico F40: rama de la tarea 1

Leído: `skills/ejecutar-tarea/SKILL.md` (líneas 10-18), `agentes/constructor.md` (sección «Cómo trabajas», punto 1), `agentes/coordinador.md` (líneas 40-68), `pruebas/comprobaciones/contrato-constructor.mjs` (reglas 5, 10, 11, 13, 14).

## Confirmado
- `skills/ejecutar-tarea/SKILL.md:13`: el paso «Entorno» (`entorno.mjs`) va antes que el de rama. Si imprime `falta=`, la tarea queda `bloqueada` y no hay más pasos.
- `skills/ejecutar-tarea/SKILL.md:14`: el paso «Rama de la feature» dice «Solo si el encargo trae la línea `Rama:`. Si no la trae, no ejecutes ningún comando git de rama».
- `skills/ejecutar-tarea/SKILL.md:15`: en modo yolo el paso de rama se salta entero.
- `skills/ejecutar-tarea/SKILL.md:17`: sin confirmación, corre `git switch -c <rama>`; si la rama ya existe, la primera línea es `CONFIRMAR:`; otra falla da `BLOQUEO:`.
- `skills/ejecutar-tarea/SKILL.md:18`: «Cambia `estado` a `en curso`» va después del paso de rama.
- `agentes/constructor.md:27`: antes de cargar la skill, el constructor comprueba la rama del `Rama:` del encargo y, si existe y no es la actual sin confirmación, responde `CONFIRMAR:`.
- `agentes/coordinador.md:44`: una tarea `aprobada` se delega «con `Rama:`».
- `agentes/coordinador.md:60`: la plantilla dice «`Rama:` o `Modo yolo:` si aplica».
- `agentes/coordinador.md:68`: «`Rama:` va en cada encargo al `constructor` (salvo yolo)».
- `pruebas/comprobaciones/contrato-constructor.mjs`, reglas 5 y 11: exigen `git switch -c` antes de «Cambia `estado` a `en curso`» (orden de texto). No hay regla que ordene entorno y rama; `grep entorno` en ese archivo no da coincidencias.
- Las frases de rama aparecen también en `contrato-constructor.test.mjs` (líneas 34-35) y en `frases-por-archivo.mjs` (línea 167, `ADVERTENCIA: rama main`, de la skill modo-yolo).
- Grep del paso 1: entorno (13) < rama (14) < en curso (18).

## Inferido
- Con el orden actual, si el entorno falla, la tarea queda `bloqueada` antes de crear la rama. Es coherente con el dato de F37 que da la *Contexto* de la tarea (n=1 bloqueada por entorno, sin rama; n=2 creó la rama con `git switch -c`). No abrí F37: las reglas de lectura excluyen tareas `hecha` ajenas.
- Con el orden actual, un encargo sin `Rama:` no crea la rama en la tarea 1. El coordinador escribe `Rama:` «si aplica» (`coordinador.md:60`), así que una omisión en el encargo es la causa más probable de «la rama no existe». No está reproducido con un modelo real.
- Mover la rama antes del entorno no evita el caso de un encargo sin `Rama:`.
- Por confirmar con el caso de Franco: fecha, feature, si el encargo traía `Rama:` y si el entorno falló antes del paso de rama.

## Recomendación
B) mantener el orden: el texto actual cumple lo pedido (entorno, rama, `en curso`), y el hueco está en que el encargo puede llegar sin `Rama:`, lo que cambiar de orden no arregla; esa decisión es otra tarea, con el caso de Franco.
