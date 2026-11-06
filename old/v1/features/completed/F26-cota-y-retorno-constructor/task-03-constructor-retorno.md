# task-03 — Constructor: retorno de 4 estados
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
`agentes/constructor.md` debe nombrar los cuatro estados de retorno y su primera línea, para que el `coordinador` los distinga sin leer la tarea. Evita que una decisión de diseño llegue como bloqueo y se reabra al `arquitecto` (S3 de Cleaner).

## Contexto
- Tocar: `agentes/constructor.md`, `pruebas/comprobaciones/contrato-constructor.mjs`, `pruebas/comprobaciones/contrato-constructor.test.mjs`
- `agentes/constructor.md` (2919 bytes): «Cómo trabajas» (línea 25, ya describe `DECISION:`) y cierre (línea 38).
- Formatos y reglas definidos en `skills/ejecutar-tarea/SKILL.md`, sección «Retorno» (task-02). Leer solo las *Notas* de task-02.
- `contrato-constructor.mjs`: arreglo `REGLAS` (la última es la 16, de task-02); estructura `{ n, sobre, frases }`.

## Decisiones ya tomadas
- Añadir en `constructor.md` una sección corta «Retorno» (máx. 700 bytes) con una línea por estado: `completed` (`lista para revisión`), `partial` (`PARCIAL: tarea=task-NN; hecho=<n>; falta=<n>`), `blocked` (`BLOQUEO:`), `interaction_required` (`DECISION:`), y la frase `el formato está en `ejecutar-tarea``.
- No se repiten los formatos completos ni se cambian los límites (`Modo yolo`, git).
- Regla 17 (`sobre: 'constructor'`): frases `completed | partial | blocked | interaction_required` y `PARCIAL: tarea=task-NN`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: sección «Retorno» y la regla 17 con su variante.
Fuera de alcance: la skill, `coordinador.md`, `scripts/`, `definitions/`.

## Pasos
1. En `agentes/constructor.md`, añadir la sección «Retorno» antes de «Qué lees».
2. En `contrato-constructor.mjs`, añadir la regla 17.
3. En el test, añadir su variante en `variantes` (borra las frases y exige error).
4. Correr la verificación.

## Criterios de aceptación
1. `constructor.md` nombra los cuatro estados. Se comprueba con la regla 17.
2. Sin las frases la regla 17 falla (control negativo).
3. El archivo crece menos de 700 bytes. Se comprueba con `wc -c`.
4. La rápida no suma fallos.

## Verificación
```
node --test pruebas/comprobaciones/contrato-constructor.test.mjs
grep -c 'completed | partial | blocked | interaction_required' agentes/constructor.md
wc -c agentes/constructor.md
bash pruebas/rapida.sh
```
Esperado: el primero termina con `ℹ fail 0`; el segundo imprime `1`; el tercero un tamaño menor que 3620 seguido de `agentes/constructor.md`; la rápida deja exactamente `ℹ fail 7` (ajenos: BACKLOG real y 6 de higiene de contexto).

## Evidencia

```
$ node --test pruebas/comprobaciones/contrato-constructor.test.mjs
ℹ tests 20
ℹ suites 0
ℹ pass 20
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 52.456459
exit 0
```

```
$ grep -c 'completed | partial | blocked | interaction_required' agentes/constructor.md
1
exit 0
```

```
$ wc -c agentes/constructor.md
    3377 agentes/constructor.md
exit 0
```

```
$ bash pruebas/rapida.sh
ℹ tests 423
ℹ pass 416
ℹ fail 7
✖ definitions/BACKLOG.md real cumple el formato (2.114917ms)
✖ los archivos reales cumplen la regla (2.88175ms)
✖ falla si un agente conserva la línea de modelos.json (1.487541ms)
✖ falla si falta la lectura acotada en constructor (0.991375ms)
✖ falla si falta la lectura acotada en ejecutar-tarea (1.861291ms)
✖ falla si WORKFLOW.md pasa de 30720 caracteres (0.919625ms)
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json (0.860333ms)
exit 1
```

## Notas

- Huecos: ninguno. La sección «Retorno» de `constructor.md` nombra los cuatro estados; la regla 17 y su variante están en el contrato. Los 7 fallos de `rapida.sh` son los ajenos conocidos (BACKLOG y 6 de higiene de contexto); no se tocaron.
- Rama: modo yolo; no se creó rama ni hubo `git switch`. Sin commit.
- Tamaño: 3377 bytes (antes 2919), crecimiento 458 bytes, por debajo del límite de 700.
- Autocomprobación: `node scripts/validar-tarea.mjs --evidencia` sale 0 con `OK: 1 tarea(s) con evidencia completa`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
