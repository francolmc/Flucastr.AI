# task-06 — Prueba sin modelo de los prompts livianos (`higiene-contexto.test.mjs`)
repo: Flucastr.AI   depende_de: task-03, task-04, task-05   estado: hecha

## Descripción
Un archivo de prueba nuevo, sin modelo ni red, que fija sobre los archivos reales lo que dejan task-03 a task-05, con controles negativos: los cuatro agentes ya no contienen la línea sobre `modelos.json`; `constructor` y `ejecutar-tarea` contienen la línea de lectura acotada; `WORKFLOW.md` no pasa de 30.720 caracteres y no contiene la frase quitada. Entra sola en la rápida por el glob existente.

## Contexto
- Patrón a imitar: `pruebas/comprobaciones/contrato-roles.test.mjs` (`node:test`, `assert/strict`, `RAIZ = fileURLToPath(new URL('../../', import.meta.url))`, lectura de `agentes/` y `skills/` reales).
- `pruebas/rapida.sh` incluye `pruebas/comprobaciones/*.test.mjs` por glob: no se edita. Riesgo abierto en `STATUS.md`: la rápida ronda el tope de 30 s; este archivo solo lee 7 archivos.
- Frases fijadas por las tareas previas: task-03 (ausencia de «El nivel de modelo que usas no se declara aquí»), task-04 (ausencia de «Cada rol configura su nivel de modelo» y tope), task-05 («Lectura acotada» y «`edit` en vez de reescribirlos enteros con `write`»).
- La línea de identidad ya la cubre `pruebas/comprobaciones/resolver-agentes.test.mjs` (task-02); aquí no se repite.
- Se ejecuta con `node --test pruebas/comprobaciones/higiene-contexto.test.mjs` (archivo nuevo, no ejecutado por el planificador).

## Decisiones ya tomadas
- Único archivo: `pruebas/comprobaciones/higiene-contexto.test.mjs`. La función `validarHigiene({ agentes, skills, workflow })` (`agentes`: objeto nombre→texto de los cuatro; `skills`: texto de `ejecutar-tarea`; `workflow`: texto; devuelve arreglo de mensajes de error en español; vacío = válido; no lanza) se define dentro del mismo archivo; no se crea módulo aparte.
- Seis pruebas, con estos nombres: (a) «los archivos reales cumplen la regla»; (b) «falla si un agente conserva la línea de modelos.json»; (c) «falla si falta la lectura acotada en constructor»; (d) «falla si falta la lectura acotada en ejecutar-tarea»; (e) «falla si WORKFLOW.md pasa de 30720 caracteres»; (f) «falla si WORKFLOW.md conserva la frase sobre modelos.json». Las (b) a (f) son controles negativos: parten del texto real y le agregan o quitan la frase.
- Tope: `const TOPE_WORKFLOW = 30720` medido con `[...texto].length` (caracteres, igual que `wc -m` en UTF-8).
- Sin red, sin modelo, sin procesos, sin escribir archivos.

## Alcance / Fuera de alcance
Alcance: el archivo de prueba nuevo.
Fuera de alcance: editar `contrato-roles.mjs`, `contrato-constructor.mjs` u otros comprobadores, `pruebas/rapida.sh`, `pruebas/README.md`, las corridas con modelo (task-07 y task-08).

## Pasos
1. Crear el archivo con `validarHigiene` y las seis pruebas. Resultado: carga sin errores.
2. Correrlo sobre el repo. Resultado: `pass 6` y `fail 0`.
3. Confirmar que cada control negativo puede fallar: por construcción parten del texto real alterado y pasan solo si `validarHigiene` devuelve error. Resultado: las pruebas (b) a (f) pasan solo con error.
4. Correr `bash pruebas/rapida.sh` y pegar la última línea. Resultado: exit 0.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/higiene-contexto.test.mjs` termina con 6 pruebas y `fail 0`.
2. `git status --short` muestra como nuevo, de esta tarea, solo `pruebas/comprobaciones/higiene-contexto.test.mjs`.
3. `grep -nE "fetch|spawn|exec" pruebas/comprobaciones/higiene-contexto.test.mjs` sin coincidencias.
4. `bash pruebas/rapida.sh` termina con exit 0 y la línea `rapida: N archivos en S s (tope 30 s)`.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --test pruebas/comprobaciones/higiene-contexto.test.mjs
grep -nE "fetch|spawn|exec" pruebas/comprobaciones/higiene-contexto.test.mjs
bash pruebas/rapida.sh | tail -1
git status --short pruebas/
```
Esperado: `pass 6`, `fail 0`; `grep` sin salida; `rapida: … (tope 30 s)` con exit 0; el archivo nuevo en `git status`. Si `rapida.sh` supera 30 s por carga ajena (riesgo abierto en `STATUS.md`), repetir una vez, anotarlo en *Notas* y no tocar `rapida.sh`.

## Evidencia
Salida real, ejecutada en la rama `feature/F18-identidad-y-prompts-livianos` (`git branch --show-current`).

Paso 2 y criterio 1: `node --test pruebas/comprobaciones/higiene-contexto.test.mjs`
```
✔ los archivos reales cumplen la regla (2.242166ms)
✔ falla si un agente conserva la línea de modelos.json (1.37375ms)
✔ falla si falta la lectura acotada en constructor (0.803708ms)
✔ falla si falta la lectura acotada en ejecutar-tarea (0.467875ms)
✔ falla si WORKFLOW.md pasa de 30720 caracteres (0.40025ms)
✔ falla si WORKFLOW.md conserva la frase sobre modelos.json (0.280916ms)
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

Criterio 3: `grep -nE "fetch|spawn|exec" pruebas/comprobaciones/higiene-contexto.test.mjs` sin salida (código 1 de grep, sin coincidencias).

Criterio 2: `git status --short pruebas/`
```
 M pruebas/comprobaciones/resolver-agentes.test.mjs
?? pruebas/comprobaciones/higiene-contexto.test.mjs
?? pruebas/resultados/2026-10-31-sondeo-codex.md
?? pruebas/resultados/2026-10-31-sondeo-consumo-pi.md
?? pruebas/resultados/2026-10-31-verificacion-compactacion.md
```
De esta tarea es solo `pruebas/comprobaciones/higiene-contexto.test.mjs`. Los demás cambios ya estaban antes de empezar (`resolver-agentes.test.mjs` es de task-02 y los `resultados/` son previos) y no se tocaron.

Tamaño medido para el criterio de WORKFLOW: `wc -m definitions/WORKFLOW.md` → `30516 definitions/WORKFLOW.md` (tope 30720).

Criterio 4: `bash pruebas/rapida.sh` con HOME real (`/Users/franco`), exit 0, última línea:
```
rapida: 23 archivos en 11 s (tope 30 s)
```
Salida de la corrida: `ℹ tests 233`, `ℹ pass 233`, `ℹ fail 0`. El archivo nuevo entra por el glob (sus 6 pruebas aparecen en la salida). Tiempo: 11 s, bajo el umbral de 25 s; no hizo falta repetir la corrida. La corrida se guardó en `/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/rapida-1.txt`.

## Notas
- Huecos menores: ninguno que cambie el alcance. Decisiones de implementación:
  - `de(obj, clave)` lee solo claves propias (`Object.hasOwn`). Sin ella, `agentes.constructor` tomaría la propiedad heredada `Object` de un objeto plano y el control de constructor no funcionaría.
  - Los controles negativos (b) a (f) exigen exactamente un error (`assert.equal(errores.length, 1)`), así que comprueban que `validarHigiene` falla por la causa esperada y no por otra.
  - En (e), el texto añadido hace que WORKFLOW pase el tope por exactamente un carácter (`TOPE_WORKFLOW - caracteres + 1`), para que el único error sea el tamaño.
- Cifra usada: WORKFLOW mide 30516 caracteres (`wc -m`), igual que task-04 dejó anotado; el tope es 30720.
- `rapida.sh` se corrió una sola vez con HOME real; sus pruebas de instalación usan HOME temporal, como en task-03 y task-05, así que no se reinstaló nada en `~/.claude` ni `~/.pi`.
- No se tocó `rapida.sh`, `contrato-roles.mjs`, `contrato-constructor.mjs` ni otros comprobadores; `definitions/STATUS.md` no se escribió; no hubo commit, push, PR, merge ni switch de rama.
- Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
