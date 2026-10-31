# task-06 — Prueba sin modelo de la regla de higiene de contexto
repo: Flucastr.AI   depende_de: task-02, task-03, task-04, task-05   estado: borrador

## Descripción
Un archivo de prueba nuevo, sin modelo ni red, que fija la regla de F18 sobre los archivos reales y con un control negativo: el `coordinador` contiene `CONTEXTO: sesion-nueva` y `CONTEXTO: compactar`; los cuatro agentes ya no contienen la línea de `modelos.json`; `constructor` y `ejecutar-tarea` contienen la línea de lectura acotada; `WORKFLOW.md` no pasa de 30.720 caracteres y no contiene la frase quitada. Entra sola en la rápida por el glob existente.

## Contexto
- Patrón a imitar: `pruebas/comprobaciones/contrato-roles.test.mjs` (usa `node:test`, `assert/strict`, `RAIZ = fileURLToPath(new URL('../../', import.meta.url))` y lee los archivos reales de `agentes/` y `skills/`).
- `pruebas/rapida.sh` incluye `pruebas/comprobaciones/*.test.mjs` por glob: no hay que editarlo. Riesgo conocido (STATUS.md): la rápida ronda el tope de 30 s; este archivo es pequeño (solo lee 7 archivos).
- Frases de las tareas previas: task-02 (secciones y frases `CONTEXTO:`), task-03 (ausencia de «no se declara aquí»), task-04 (ausencia de «Cada rol configura» y tope), task-05 (frase «Lectura acotada» y «`edit` en vez de reescribirlos enteros con `write`»).
- Se ejecuta con `node --test pruebas/comprobaciones/higiene-contexto.test.mjs` (archivo nuevo, no ejecutado por el planificador).

## Decisiones ya tomadas
- Único archivo: `pruebas/comprobaciones/higiene-contexto.test.mjs`. La función `validarHigiene({ agentes, skills, workflow })` (devuelve arreglo de mensajes de error en español; vacío = válido; no lanza) se define dentro del mismo archivo; no se crea módulo aparte.
- Pruebas (nombres en español): (a) «los archivos reales cumplen la regla» sobre el repo; (b) «falla si el coordinador no tiene CONTEXTO: sesion-nueva»; (c) «falla si el coordinador no tiene CONTEXTO: compactar»; (d) «falla si un agente conserva la línea de modelos.json»; (e) «falla si falta la lectura acotada en constructor o en ejecutar-tarea»; (f) «falla si WORKFLOW.md pasa de 30720 caracteres» (texto sintético). Las (b) a (f) son controles negativos: parten del texto real y le quitan o agregan la frase.
- Tope: `const TOPE_WORKFLOW = 30720` medido con `[...texto].length` (caracteres, no bytes).
- No usa red, modelo, ni escribe archivos.

## Alcance / Fuera de alcance
Alcance: el archivo de prueba nuevo.
Fuera de alcance: editar `contrato-roles.mjs`, `contrato-constructor.mjs` u otros comprobadores, `pruebas/rapida.sh`, la corrida con modelo (tasks 08 y 09), `pruebas/README.md` (task-10).

## Pasos
1. Crear el archivo con `validarHigiene` y las seis pruebas. Resultado: el archivo carga sin errores.
2. Correrlo sobre el repo. Resultado: `pass 6 / fail 0`.
3. Confirmar que cada control negativo puede fallar (comprobado por construcción: parte de texto real alterado). Resultado: las pruebas (b) a (f) pasan solo si `validarHigiene` devuelve error.
4. Correr `bash pruebas/rapida.sh` y pegar la última línea. Resultado: exit 0.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/higiene-contexto.test.mjs` termina con 6 pruebas y `fail 0`.
2. `git status --short` muestra como nuevo solo `pruebas/comprobaciones/higiene-contexto.test.mjs` (de esta tarea).
3. `grep -nE "fetch|spawn|exec" pruebas/comprobaciones/higiene-contexto.test.mjs` sin coincidencias (sin red ni procesos).
4. `bash pruebas/rapida.sh` termina con exit 0 y la línea `rapida: N archivos en S s (tope 30 s)`.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --test pruebas/comprobaciones/higiene-contexto.test.mjs
grep -nE "fetch|spawn|exec" pruebas/comprobaciones/higiene-contexto.test.mjs
bash pruebas/rapida.sh | tail -1
git status --short
```
Esperado: `pass 6 / fail 0`; `grep` sin salida; `rapida: … (tope 30 s)` con exit 0; el archivo nuevo en `git status`. Si `rapida.sh` supera 30 s por carga ajena a esta tarea (riesgo ya abierto en STATUS.md), anotarlo en *Notas*, repetir una vez y no tocar `rapida.sh`.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
