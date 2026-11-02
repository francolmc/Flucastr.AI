# task-07 — Reglas del coordinador y del constructor
repo: Flucastr.AI   depende_de: task-06   estado: hecha

## Descripción
Con el validador y su permiso ya instalados, el `coordinador` debe usarlo antes de aprobar una tarea (también en yolo, donde sustituye la lectura manual de la regla 2), y el `constructor` ante una decisión abierta debe devolver opciones cerradas en vez de probar (S3). Esta tarea escribe esas reglas en `agentes/coordinador.md` y `agentes/constructor.md` y las fija con una prueba de texto.

## Contexto
- Leer: `definitions/WORKFLOW.md` §6, «Reglas del `constructor`» (regla «2 bis», texto definitivo); `definitions/ARCHITECTURE.md`, subsección «Raíz del kit y puerta previa de tarea (F24…)». De task-06 (`depende_de`), solo sus *Notas*.
- Tocar: `agentes/coordinador.md`, `agentes/constructor.md`, `pruebas/comprobaciones/puerta-previa.test.mjs`
- `coordinador.md`: fila «Tareas de la feature siguiente en `borrador`» de la tabla (línea 45); sección «Modo yolo», «Mientras está activo», regla 2 «Revisión de “completa”» (línea 95) y regla 5 «Escalaciones que detienen el modo» (línea 98); la fila del `REFINAR:` (línea 43) es el modelo para una respuesta que no es puerta ni bloqueo.
- `constructor.md`: sección «Cómo trabajas», punto 1 (una sola línea larga, termina en «según `ejecutar-tarea`.»).
- Modelo de prueba de texto: `pruebas/comprobaciones/coordinador-status.test.mjs` (lee el agente real, función `validar…` que devuelve errores, controles negativos quitando una frase).

## Decisiones ya tomadas
- Comando: el cuarto de «Comandos que puede correr» (task-05), `node ~/.flucastr-ai/validar-tarea.mjs <ruta-tarea>...` (lanzador fijo de task-04, sin `$(…)`), con las rutas de todas las tareas `borrador` de la feature.
- Fila de `borrador` (puerta 3): antes de escribir las rutas en `STATUS.md`, corre el comando. Salida 0: sigue como hoy. Salida 1: no pidas aprobación; devuelve al `planificador` (`descomponer-feature`) las líneas de rechazo. Salida 2: escalación.
- Yolo, regla 2: el comando sustituye la lectura de la tarea. Salida 0 y `depende_de:` con IDs de tareas existentes (comprobados con `Glob` de la carpeta): escribes `aprobada`. Salida 1 o 2: escalación (regla 5), con las líneas del comando como motivo. Ya no lees la tarea entera.
- Texto de `DECISION:` copiado literal de `WORKFLOW.md` §6, regla «2 bis», sin variantes propias: ante una decisión abierta (sección «Decisiones abiertas» con algo sin resolver) el `constructor` no empieza a probar y responde con primera línea `DECISION: tarea=task-NN; abiertas=<n>`; debajo `Pregunta:`, `Motivo:`, `Opciones:` (2 o 3, `A) B) C)`, cerradas) y `Recomendada: <letra>`. Para continuar, el encargo trae la línea `Decisión de Franco:`. F26 adoptará este mismo formato como su estado `interaction_required`.
- Detalle de aplicación: «sin resolver» = una línea sin `Resuelta:` que el encargo no cierre con `Decisión de Franco:`; entonces no cambia archivos ni prueba nada. Con esa línea, la anota en *Notas* y sigue. Una tarea sin la sección (anterior a 2026-11-01) se trata como «Ninguna».
- `coordinador` ante `DECISION:`: la trata como `REFINAR:` (ni puerta ni bloqueo): registra la pregunta y las opciones en «Espera a Franco», se las plantea a Franco y se detiene; con la respuesta vuelve a delegar al `constructor` con `Decisión de Franco:`. No reabre al `arquitecto`. En yolo es escalación (se añade a la regla 5).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: los cuatro textos de arriba y la prueba de texto con control negativo.
Fuera de alcance: retorno de cuatro estados del `constructor` (F26), `ejecutar-tarea` y otras skills, cambios al script, `definitions/`, contrato-roles.

## Pasos
1. `coordinador.md`: editar la fila de `borrador`, la regla 2 de yolo y la regla 5, y añadir una fila de tabla para `DECISION:` junto a la de `REFINAR:`.
2. `constructor.md`: añadir al punto 1 de «Cómo trabajas» el caso de la decisión abierta con el formato fijo.
3. Crear `puerta-previa.test.mjs`: lee los dos agentes reales y comprueba las frases `validar-tarea.mjs` y `salida 1` en el `coordinador`, `DECISION: tarea=task-NN; abiertas=<n>` en ambos y `Recomendada:` en el `constructor`.
4. Misma prueba: control negativo que quita cada frase de una copia en memoria y exige un error nombrándola; y que la regla 2 de yolo ya no contiene «RE_PENDIENTE».
5. Ejecutar la verificación.

## Criterios de aceptación
1. Las frases están en los agentes reales y cada control negativo falla: `node --test pruebas/comprobaciones/puerta-previa.test.mjs` sin fallos.
2. Ningún contrato previo se rompe: `node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs` sin fallos nuevos.

## Verificación
```
node --test pruebas/comprobaciones/puerta-previa.test.mjs
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs
bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ (pass|fail)"
```
Esperado: `ℹ fail 0`; `ℹ fail 0`; y `fail` de la rápida ≤ 7 (baseline 8 antes de F24) sin pruebas nuevas en la lista de fallos.

## Evidencia

Pasada única de la *Verificación* (modo yolo, rama actual, sin commit).

1. `node --test pruebas/comprobaciones/puerta-previa.test.mjs`
```
ℹ tests 7
ℹ pass 7
ℹ fail 0
```
(texto real OK; quitar cada una de las 5 frases de su agente falla nombrándola; `RE_PENDIENTE` en la regla 2 de yolo falla.)

2. `node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs`
```
ℹ tests 61
ℹ pass 61
ℹ fail 0
```

3. `bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ (pass|fail)"`
```
ℹ pass 390
ℹ fail 7
```
Los 7 fallos son los de la línea base, ninguno de `puerta-previa`: `definitions/BACKLOG.md real cumple el formato` y 6 de `higiene-contexto`/contrato (`definitions/WORKFLOW.md` mide 31298 caracteres, tope 30720; el archivo no cambió respecto de `HEAD`).

Criterio 2: `contrato-roles` y `coordinador-status` sin fallos; `contrato-constructor` y `coordinador-turnos` pasan (tope de `coordinador.md`: 17871 bytes de 17920). Los 6 de `higiene-contexto` ya fallaban antes de esta tarea.

## Notas
Corrección 2026-11-01: `DECISION:` pasa al texto definitivo de `WORKFLOW.md` §6 regla «2 bis» (se quitó «sin otra»); el comando es el del lanzador fijo; depende de task-06 (permiso probado antes de usarlo).
Hueco menor 1: la plantilla de encargo del `coordinador` (`Devuelve:`) también lista `DECISION:`, para reconocer la respuesta del constructor; no estaba en la tarea.
Hueco menor 2: para caber en el tope de 17920 bytes de `agentes/coordinador.md` (quedaban 6) se comprimió redacción de filas y reglas existentes (puerta 3 de feature, rule 3, 4 y 8, «Archivo y contexto», «Respaldo sin subagentes», «Comandos»). No se borró ninguna regla; el archivo queda en 17871 bytes.
Fuera de alcance, para Franco: `definitions/WORKFLOW.md` supera su tope de 30720 caracteres (31298) desde antes de esta tarea; por eso fallan 6 pruebas de `higiene-contexto`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
