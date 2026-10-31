# task-13 — Prueba sin modelo: el `coordinador` escribe `STATUS.md` antes de delegar
repo: Flucastr.AI   depende_de: task-12   estado: aprobada

## Descripción
Fijar con una comprobación determinista que `agentes/coordinador.md` conserva la regla de la task-12 (escribir `STATUS.md` antes de delegar y retomar desde él), con control negativo. Reutiliza el patrón de `higiene-contexto.test.mjs`, que ya está en `rapida.sh`, pero en un archivo propio para respetar una tarea, un archivo.

## Contexto
- Leído `pruebas/comprobaciones/higiene-contexto.test.mjs`: define `validarHigiene({ agentes, skills, workflow })`, lee los archivos reales con `leer(ruta)` desde `RAIZ`, y usa `sinLineas(texto, patron)` para simular que falta una regla y esperar exactamente un error. Es el estilo a imitar (`node:test`, `assert/strict`, mensajes en español).
- Frases que fija la task-12 en `agentes/coordinador.md` (texto literal, la primera con las comillas invertidas incluidas): «Antes de delegar, escribe en `definitions/STATUS.md`» y «empieza vacía o resumida».
- Se prueba con `node --test pruebas/comprobaciones/coordinador-status.test.mjs` y está dentro de `rapida.sh` por el comodín `pruebas/comprobaciones/*.test.mjs`.

## Decisiones ya tomadas
- Archivo nuevo `pruebas/comprobaciones/coordinador-status.test.mjs` (no se edita `higiene-contexto.test.mjs`).
- Función `validarCoordinador(texto)` devuelve la lista de errores (vacía = válido): error 1 si falta «Antes de delegar, escribe en `definitions/STATUS.md`»; error 2 si falta `empieza vacía o resumida`; error 3 si el texto contiene `CONTEXTO:` (la línea eliminada por diseño no vuelve); error 4 si el paso de «Cómo avanzas» con esa frase no aparece antes del paso que contiene `Delega.` (la escritura del estado va antes de delegar): se localizan por el orden de las líneas numeradas dentro de la sección `## Cómo avanzas`.
- Pruebas: el archivo real da `[]`; quitar la línea del paso (`sinLineas`) da exactamente el error 1 (y ninguno más); quitar la frase de retoma da el error 2; añadir `CONTEXTO: sesion-nueva` da el error 3; intercambiar el orden de los pasos (paso de delegar antes del de escribir) da el error 4. Cada caso afirma `errores.length === 1`.
- Los mensajes de error empiezan con `agentes/coordinador.md`.

## Alcance / Fuera de alcance
Alcance: el archivo nuevo `pruebas/comprobaciones/coordinador-status.test.mjs`.
Fuera de alcance: `agentes/coordinador.md` (task-12), `higiene-contexto.test.mjs`, otros comprobadores, `rapida.sh`.

## Pasos
1. Leer `higiene-contexto.test.mjs` y la sección «Cómo avanzas» ya modificada. Resultado: frases exactas confirmadas en *Notas*.
2. Crear el archivo con `validarCoordinador` y los ayudantes. Resultado: `node --check` sin errores.
3. Escribir los cinco casos. Resultado: `node --test` los reporta aprobados.
4. Correr la verificación y pegarla en *Evidencia*.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/coordinador-status.test.mjs` termina con `fail 0` y 5 pruebas aprobadas.
2. Los cuatro controles negativos fallan con un solo error cada uno (comprobado por las propias pruebas).
3. `bash pruebas/rapida.sh` termina con exit 0.
4. `git status --short` muestra como nuevo, de esta tarea, solo ese archivo.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --test pruebas/comprobaciones/coordinador-status.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -2 "$R"
git status --short pruebas/comprobaciones/
```
Esperado: `tests 5`, `pass 5`, `fail 0`; `rapida exit=0`; archivo nuevo como `??`. No ejecutado por el planificador: depende de la task-12.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
