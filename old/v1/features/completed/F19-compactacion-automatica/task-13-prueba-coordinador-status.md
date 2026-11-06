# task-13 — Prueba sin modelo: el `coordinador` escribe `STATUS.md` antes de delegar
repo: Flucastr.AI   depende_de: task-12   estado: hecha

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
Rama comprobada (`git branch --show-current`): `feature/F19-compactacion-automatica`. No hubo switch.

Comprobación de frases en el archivo real (`agentes/coordinador.md`):
```
$ grep -n "Antes de delegar, escribe en \`definitions/STATUS.md\`\|empieza vacía o resumida\|Delega\." agentes/coordinador.md
25: ... Si tu conversación empieza vacía o resumida (sesión nueva o compactación), ...
50:2. **Antes de delegar, escribe en `definitions/STATUS.md`** el paso actual ...
51:3. Delega. Dile al subagente qué skill usar, ...

$ grep -c "CONTEXTO:" agentes/coordinador.md
0
```

Verificación 1:
```
$ node --check pruebas/comprobaciones/coordinador-status.test.mjs
check ok

$ node --test pruebas/comprobaciones/coordinador-status.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 5
ℹ pass 5
ℹ fail 0
```
Pruebas aprobadas: `el archivo real cumple la regla`; `falla si falta el paso que escribe STATUS.md antes de delegar`; `falla si falta la frase de retoma desde STATUS.md`; `falla si vuelve la línea CONTEXTO:`; `falla si el paso de escribir STATUS.md queda después de delegar`. Cada control negativo afirma `errores.length === 1`, así que cada uno da un solo error.

Verificación 2 (HOME real: `HOME=/Users/franco`):
```
$ R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -2 "$R"
rapida exit=0
ℹ duration_ms 14850.003167
rapida: 27 archivos en 15 s (tope 30 s)

$ grep -nE "^ℹ (fail|tests|pass)" "$R"
282:ℹ tests 277
284:ℹ pass 277
285:ℹ fail 0
```
Tiempo de pared: 15 s (no supera 25 s). La falla intermitente de `registro.e2e.test.mjs` no apareció en esta corrida, así que no hubo repetición.

Verificación 3 (`git status --short pruebas/comprobaciones/`):
```
?? pruebas/comprobaciones/coordinador-status.test.mjs
?? pruebas/comprobaciones/resolver-compactacion-claude.test.mjs
?? pruebas/comprobaciones/resolver-compactacion-pi.test.mjs
```
De esta tarea es solo `coordinador-status.test.mjs`. Los otros dos `resolver-compactacion-*` ya estaban sin trackear antes de empezar.

Criterios de aceptación:
1. `node --test` sobre el archivo nuevo: `fail 0`, 5 pruebas aprobadas. Cumple.
2. Los cuatro controles negativos fallan con un solo error, afirmado en cada prueba. Cumple.
3. `bash pruebas/rapida.sh` con exit 0. Cumple.
4. Como nuevo de esta tarea, solo `coordinador-status.test.mjs`. Cumple.

## Notas
- Frases confirmadas en el archivo real antes de escribir (paso 1): línea 25 contiene «empieza vacía o resumida»; línea 50 contiene «Antes de delegar, escribe en `definitions/STATUS.md`» (paso 2 de «Cómo avanzas»); línea 51 es el único «Delega.» del archivo (paso 3). No hay «CONTEXTO:».
- Hueco menor 1: el control de la frase de retoma no quita la línea 25 (tiene más texto útil), sino que reemplaza la frase por otro texto con `replace`. Solo se quita esa frase, así que el único error es el 2.
- Hueco menor 2: el chequeo de orden solo corre si están presentes el paso de escribir y el de «Delega.». Así, quitar el paso de escribir da solo el error 1 y no también el 4. El orden se compara con las líneas numeradas de la sección «Cómo avanzas». El control de orden intercambia el contenido de las líneas 50 y 51.
- Sin cambios en `agentes/coordinador.md`, `higiene-contexto.test.mjs`, `rapida.sh` ni otros comprobadores. No se escribió en `definitions/STATUS.md`. No se tocó `~/.pi` ni `~/.claude`, ni se ejecutó `instalar.sh`, ni se abrió `auth.json` ni `.env`. No hay commit ni push.
- Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
