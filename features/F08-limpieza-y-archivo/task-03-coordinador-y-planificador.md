# task-03 — Coordinador y planificador: avisos de archivo y `completed/` fuera de lectura
repo: Flucastr.AI   depende_de: task-02   estado: aprobada

## Descripción
Los agentes aplican §10.4 y §10.5 de `definitions/WORKFLOW.md`: el `coordinador` y el `planificador` no entran en `features/completed/` al listar `features/`, y el `coordinador` avisa en «Espera a Franco» cuando una feature es archivable o cuando el contexto creció, sin ejecutar nunca `--aplicar`. Un validador determinista (regla 13 en `contrato-roles.mjs`) fija las frases clave.

## Contexto
- Leídos: `agentes/coordinador.md` (tabla de decisión; fila «Todas las tareas de la feature `hecha`»; secciones «Qué lees para decidir», «Modo yolo»; `tools: Agent(arquitecto, planificador, constructor), Read, Grep, Glob, Write, Edit, Skill`: **no tiene Bash**); `agentes/planificador.md` (línea de límites: «Solo escribes `definitions/BACKLOG.md` y `features/**`»); `pruebas/comprobaciones/contrato-roles.mjs` (reglas 9 a 12, estilo de la regla 11); `pruebas/comprobaciones/contrato-roles.test.mjs` (fixture con agentes mínimos; lista `variantesF05` de controles negativos).
- A tocar (4 archivos): `agentes/coordinador.md`, `agentes/planificador.md`, `pruebas/comprobaciones/contrato-roles.mjs`, `pruebas/comprobaciones/contrato-roles.test.mjs`. Comando: `node --test pruebas/comprobaciones/contrato-roles.test.mjs`.
- `instalar.sh` genera los agentes instalados desde `agentes/*.md`; no se toca.

## Decisiones ya tomadas
- **Desviación de §10.5, decidida por el planificador y a confirmar por Franco:** `definitions/WORKFLOW.md` §10.5 dice que el `coordinador` «corre el chequeo», pero su `tools:` no incluye Bash y añadírselo ampliaría su permiso (puede ejecutar cualquier comando; hoy escribe solo `STATUS.md` y estados). Esta tarea **no** añade Bash. El `coordinador` escribe en «Espera a Franco» el comando que Franco corre (`node scripts/archivar.mjs`, o `node scripts/archivar.mjs --aplicar Fxx`) y puede razonar con la salida si Franco la pega en la conversación. Si Franco prefiere dar Bash al coordinador, es un cambio de `definitions/` (puerta 1) y de `tools:` aparte.
- Texto exacto que se añade al `coordinador`:
  1. En «Qué lees para decidir», al final: «Al listar `features/` no entres en `features/completed/`: es archivo y no se lee salvo pedido explícito de Franco.»
  2. En la fila de la tabla «Todas las tareas de la feature `hecha`», tras la confirmación de `hecha` de la feature por Franco, una línea más en «Espera a Franco»: «Feature Fxx archivable: `node scripts/archivar.mjs --aplicar Fxx` (lo corre Franco, después del PR y en su propio commit `chore/`).» No es escalación. Nunca ejecutas `--aplicar`; en yolo no escribes ese aviso.
  3. Nueva sección «Archivo y contexto» (antes de «Bloqueos») con: antes de delegar `descomponer-feature` (puerta 3) añade a «Espera a Franco» la línea «Chequeo de contexto: `node scripts/archivar.mjs`» como recomendación, sin bloquear; el chequeo y `--aplicar` los corre Franco; en yolo no hay aviso ni archivo.
- Texto exacto que se añade al `planificador`: en «Límites», un punto: «No entras en `features/completed/` (archivo): al listar `features/` lo omites. Compactar las filas `hecha` del backlog (una línea de «Por qué», hasta ~300 caracteres) lo haces solo si Franco lo pide, y queda para su aprobación (puerta 2).»
- Regla 13 en `contrato-roles.mjs`: `coordinador` debe contener las frases `node scripts/archivar.mjs --aplicar Fxx` y `features/completed/`; `planificador` debe contener `features/completed/`. Mensajes de error en español con el patrón de la regla 11: «El agente «X» debe contener la frase «…».»
- Prueba: el fixture válido de `contrato-roles.test.mjs` incluye las frases en `coordinador` y `planificador`; tres controles negativos (el `coordinador` pierde `node scripts/archivar.mjs --aplicar Fxx`; el `coordinador` pierde `features/completed/`; el `planificador` pierde `features/completed/`) cuyo error menciona la frase quitada, con el estilo de `variantesF05`.

## Alcance / Fuera de alcance
Alcance: los cuatro archivos listados.
Fuera de alcance: dar Bash al `coordinador`; tocar `agentes/constructor.md`, las skills o `instalar.sh`; cambiar `definitions/`; que ningún agente ejecute `archivar.mjs`; README (task-04).

## Pasos
1. En `agentes/coordinador.md`, añadir las tres piezas de texto de *Decisiones* en los lugares indicados. Resultado: `grep -c "archivar.mjs" agentes/coordinador.md` devuelve al menos 3.
2. En `agentes/planificador.md`, añadir el punto de «Límites». Resultado: `grep -c "features/completed/" agentes/planificador.md` devuelve 1.
3. En `contrato-roles.mjs`, añadir la regla 13 tras la regla 12 (o donde termine la lista de reglas actual), con comentario `// Regla 13: …`. Resultado: `node --check pruebas/comprobaciones/contrato-roles.mjs` sin salida.
4. En `contrato-roles.test.mjs`, poner las frases en el fixture válido y añadir los tres controles negativos. Resultado: pasan.
5. Correr la *Verificación*.

## Criterios de aceptación
1. `agentes/coordinador.md` contiene las frases `node scripts/archivar.mjs --aplicar Fxx` y `features/completed/` y no contiene ninguna instrucción de ejecutar `--aplicar`. Se comprueba con `grep` y con la regla 13.
2. `agentes/planificador.md` contiene `features/completed/`. Se comprueba con la regla 13.
3. Quitar cualquiera de las tres frases hace fallar la regla 13 con un error que la menciona. Controles negativos.
4. El frontmatter `tools:` del `coordinador` no cambia (sin Bash). Se comprueba con `git diff agentes/coordinador.md | grep '^[+-]tools:'` sin salida.
5. `bash pruebas/rapida.sh` pasa dentro del tope de 30 s.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs
git diff agentes/coordinador.md | grep '^[+-]tools:'; echo "salida=$?"
bash pruebas/rapida.sh
```
Esperado: la primera con `fail 0`; la segunda sin líneas y `salida=1` (grep no encuentra cambios en `tools:`); la tercera termina con `rapida: N archivos en S s (tope 30 s)` y código 0.

## Evidencia

## Notas
