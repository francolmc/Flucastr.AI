# task-10 — Regresión final de F31: validadores, topes, contratos y borde `Bloqueo:`
repo: Flucastr.AI   depende_de: task-01, task-03, task-05, task-06, task-07, task-08, task-09   estado: hecha

## Descripción
Cierra F31: comprueba que los validadores responden igual que antes sobre las 49 tareas congeladas (F24–F29, F30 y F33), que ningún tope subió, que la línea `Bloqueo:` anterior a `Registro:` no rompe el regex de 8 claves y que la rápida mantiene la base de 7 fallos conocidos.

## Contexto
- Tocar: `pruebas/comprobaciones/regresion-validadores.test.mjs`
- Requiere: ninguno
- `regresion-validadores.test.mjs` (confirmado): helper `tareaTerminada(notas)` (líneas ≈ 77–112) y casos de borde (a) y (b) con `validarEvidencia`; la línea `Registro:` debe ser la última de *Notas*.
- `scripts/formato-evidencia.mjs` (confirmado): `RE_REGISTRO` de 8 claves (línea 14) y `coherenciaRegistro` (línea 18); `causa` admite `otra` en `registrar.mjs` (línea 70).
- Base de `pruebas/rapida.sh` (confirmado por Franco): `ℹ tests 551`, `ℹ pass 544`, `ℹ fail 7` (7 fallos conocidos, no se arreglan aquí); F31 suma pruebas, así que `tests` y `pass` suben igual y `fail` sigue en 7.
- De las otras tareas lee solo las *Notas* de task-09.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «5. Pieza 3 — Telemetría que da pistas»

## Decisiones ya tomadas
- Se agrega el borde (c) tras el (b): una tarea con `estado: bloqueada` cuyo *Notas* termina en `Bloqueo: tipo=entorno; falta=docker` y luego `Registro: n=1; herramienta=claude-code; modo=yolo; intentos=0; verificacion=falla; huecos=0; resultado=bloqueada; causa=otra`; `validarEvidencia(...)` no produce motivos que mencionen «Registro». Si `tareaTerminada` fija `estado: lista para revisión`, el helper recibe un segundo parámetro opcional `estado` (por defecto el actual).
- Un borde (d): una línea `- Requiere: docker, puerto:55432` en *Contexto* no cambia `validarEvidencia` ni `validarFuente` de una tarea válida.
- No se cambia ningún validador ni la base JSON. Si un validador cambió la respuesta de una tarea de la base, la tarea queda bloqueada con `BLOQUEO: rol=arquitecto` (hay regresión real).

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: los casos de borde (c) y (d) y la regresión final.
Fuera de alcance: arreglar los 7 fallos conocidos, cualquier validador, la base JSON, `registrar.mjs` (la línea `Bloqueo:` se valida en F32), `definitions/`.

## Pasos
1. En `regresion-validadores.test.mjs` agrega los bordes (c) y (d).
2. Corre la regresión y los topes.
3. Corre `bash pruebas/rapida.sh` filtrando los contadores y compáralos con la base.
4. Mide los cuatro agentes con `wc -c`.

## Criterios de aceptación
1. La regresión pasa sin diferencias sobre 49 tareas y los bordes (c) y (d) pasan; se comprueba con `node --test`.
2. Los topes no subieron: coordinador ≤ 7168, planificador ≤ 3584, constructor ≤ 3072, arquitecto ≤ 3584, `ejecutar-tarea` ≤ 7623; se comprueba con `wc -c` y `topes-bytes.test.mjs`.
3. La rápida mantiene `ℹ fail 7`; se comprueba con el filtro.

## Verificación
```
node --test pruebas/comprobaciones/regresion-validadores.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
wc -c agentes/coordinador.md agentes/planificador.md agentes/constructor.md agentes/arquitecto.md skills/ejecutar-tarea/SKILL.md
bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Esperado: `ℹ fail 0`; `7105` o menos para el coordinador, `3576`, `3008`, `3583` y ≤ `7623`; `ℹ fail 7` (la rápida sale 1; no se exige la línea de segundos). La rápida tarda menos de 180 s.

## Evidencia
```
$ node --test pruebas/comprobaciones/regresion-validadores.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 29
ℹ pass 29
ℹ fail 0
exit 0
```

Regresión sobre las 49 tareas (test «regresion: los validadores responden igual que la base de F24–F29») y bordes (a), (b), (c) y (d): todos `ok` dentro de los 29 pasados.

```
$ wc -c agentes/coordinador.md agentes/planificador.md agentes/constructor.md agentes/arquitecto.md skills/ejecutar-tarea/SKILL.md
    7105 agentes/coordinador.md
    3576 agentes/planificador.md
    3008 agentes/constructor.md
    3583 agentes/arquitecto.md
    7613 skills/ejecutar-tarea/SKILL.md
   24885 total
exit 0
```

Topes medidos (tamaño / tope): coordinador 7105 / 7168; planificador 3576 / 3584; constructor 3008 / 3072; arquitecto 3583 / 3584; ejecutar-tarea 7613 / 7623. Ninguno supera su tope.

```
$ bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 598
ℹ pass 591
ℹ fail 7
exit 0
```

Base de task-09: `ℹ tests 596`, `ℹ pass 589`, `ℹ fail 7`. Hoy: 598 / 591 / 7, es decir, +2 pruebas (bordes (c) y (d)) y `ℹ fail 7` sin cambio. La salida completa, sin el filtro, se guardó en un archivo del scratchpad con `exit 1` (así sale la rápida con 7 fallos; el `exit 0` de arriba es el de `grep` en el pipeline).

Los 7 fallos son los conocidos, por nombre: «definitions/BACKLOG.md real cumple el formato»; «los archivos reales cumplen la regla»; «falla si un agente conserva la línea de modelos.json»; «falla si falta la lectura acotada en constructor»; «falla si falta la lectura acotada en ejecutar-tarea»; «falla si WORKFLOW.md pasa de 30720 caracteres»; «falla si WORKFLOW.md conserva la frase sobre modelos.json».

## Notas
- Entorno: `node ~/.flucastr-ai/entorno.mjs` sobre la tarea → `ok`, exit 0.
- Hueco menor 1: `tareaTerminada(notas, estado)` recibe el segundo parámetro opcional `estado` (por defecto `lista para revisión`), como pide *Decisiones ya tomadas*; el borde (c) lo usa con `bloqueada`.
- Hueco menor 2: el borde (d) inserta `- Requiere: docker, puerto:55432` tras la línea `- Tocar:` del texto de una tarea válida y compara `validarEvidencia` y `validarFuente` con y sin esa línea (`assert.deepEqual`); pasa.
- Hueco menor 3: la rápida se corrió una vez sin filtro (para el exit real, 1) y el filtro se aplicó después a esa salida; la Verificación se ejecutó tal cual y se pega con su filtro.
- Verificación: 1 pasada completa (intentos=1); los tres comandos pasaron (`ℹ fail 0`, topes dentro, `ℹ fail 7` como se esperaba).
- Modo yolo: sin rama, sin `git switch`, sin commit. No se ejecutó `instalar.sh` ni `desinstalar.sh`. No se leyó `.env`. No se leyó `registro/` ni `features/completed/`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
