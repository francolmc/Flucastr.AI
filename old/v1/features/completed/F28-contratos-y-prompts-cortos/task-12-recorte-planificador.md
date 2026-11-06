# task-12 — Recortar agentes/planificador.md a 3584 bytes
repo: Flucastr.AI   depende_de: task-11   estado: hecha

## Descripción
El `planificador` mide 4235 B. El detalle de cada paso ya vive en `crear-backlog` y `descomponer-feature`; el agente solo necesita principios, límites, bloqueos, refinado y la lista de skills. Esta tarea lo lleva a 3584 B recortando redacción, sin quitar ninguna frase exigida, y baja su tope en la prueba de bytes.

## Contexto
- Tocar: `agentes/planificador.md`, `pruebas/comprobaciones/topes-bytes.test.mjs`
- Fuente: definitions/CONTRATOS.md «4. Prompts: núcleo corto + módulos bajo demanda»
- `agentes/planificador.md` (4235 B), secciones: `## Principios` (5 puntos de 1-2 líneas), `## Límites`, `## Bloqueos`, `## Refinado`, `## Skills disponibles` (tabla de dos filas), `## Cómo trabajas`, `## Lectura acotada`, `## Antes de entregar`.
- Frases que deben seguir exactas (manifiesto de `frases-por-archivo.mjs`): la frase de la regla 6 («escribes en STATUS.md»), la lectura acotada de F22 («Solo lees de definitions/ la sección que toca la feature» y «No lees tareas de otras features ni tareas hecha»), `features/completed/`, `REFINAR: feature=Fxx; preguntas=<n>`, `Modo yolo: activo` y la línea `BLOQUEO: rol=<rol requerido>; motivo=<motivo>`; además `crear-backlog` y `descomponer-feature` entre comillas invertidas (el contrato exige la mención de cada skill).
- `topes-bytes.test.mjs` (task-02): la entrada de `agentes/planificador.md` tiene tope 4400.
- Lee solo las *Notas* de task-11.

## Decisiones ya tomadas
- Se recorta solo redacción: los cinco principios a una línea cada uno, la tabla de skills a dos viñetas cortas, `## Antes de entregar` a dos viñetas, y conectores de `## Refinado` y `## Cómo trabajas`.
- No se quita ninguna regla, ningún límite ni la frase de cierre «di qué sigue».
- El tope de `agentes/planificador.md` en `topes-bytes.test.mjs` pasa a 3584.
- Si no se llega a 3584 B sin quitar una regla, la tarea queda `bloqueada` con `PARCIAL:` y la cifra lograda.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: un agente y una constante de prueba.
Fuera de alcance: `crear-backlog`, `descomponer-feature`, los otros agentes y todo lo de `definitions/`.

## Pasos
1. Recorta `agentes/planificador.md` por secciones, midiendo con `wc -c` tras cada una.
2. Corre `contrato-roles.test.mjs` y arregla lo que falle sin copiar frases de otro lado.
3. Cambia el tope a 3584 en `topes-bytes.test.mjs`.
4. Corre la prueba de bytes y la rápida.

## Criterios de aceptación
1. `agentes/planificador.md` mide 3584 B o menos.
2. `contrato-roles.test.mjs` y `topes-bytes.test.mjs` dan `ℹ fail 0`.
3. El archivo sigue citando las dos skills y conserva `REFINAR:` y `Modo yolo: activo` (comprobado por el contrato).
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
test $(wc -c < agentes/planificador.md) -le 3584 && echo "ok-planificador"; echo "exit $?"
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
grep -c -e 'REFINAR: feature=Fxx; preguntas=<n>' -e 'Modo yolo: activo' agentes/planificador.md; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ok-planificador`, `ℹ fail 0`, un conteo con `exit 0` y `ℹ fail 7`.

## Evidencia

```
$ test $(wc -c < agentes/planificador.md) -le 3584 && echo "ok-planificador"; echo "exit $?"
ok-planificador
exit 0
```

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
```

```
$ grep -c -e 'REFINAR: feature=Fxx; preguntas=<n>' -e 'Modo yolo: activo' agentes/planificador.md; echo "exit $?"
2
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

## Notas
- Recorte solo de redacción en `agentes/planificador.md`: principios a una línea, skills en dos viñetas, `## Antes de entregar` en dos viñetas, y conectores de `## Refinado` y `## Cómo trabajas`. No se quitó ninguna regla, límite, frase del manifiesto (`FRASES_POR_ARCHIVO`), `REFINAR:`, `Modo yolo: activo`, `BLOQUEO:` ni la frase «di qué sigue».
- Tope de `agentes/planificador.md` en `pruebas/comprobaciones/topes-bytes.test.mjs`: 4400 pasa a 3584.
- Tamaño final: 3581 B (antes 4235 B).
- Huecos menores: 0.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
