# task-14 — Regresión final de F32: validadores, topes, base ampliada y bordes
repo: Flucastr.AI   depende_de: task-02, task-03, task-04, task-05, task-07, task-09, task-11, task-13   estado: hecha

## Descripción
Cierra F32: comprueba que los validadores responden igual que antes sobre las 49 tareas congeladas, amplía la base con las 10 tareas de F31 (59 en total), agrega los bordes de `Bloqueo:` y `cancelada`, y confirma que ningún tope subió y que la verificación rápida mantiene sus 7 fallos conocidos.

## Contexto
- Tocar: `pruebas/comprobaciones/regresion-validadores.test.mjs`, `pruebas/fixtures/regresion-f24-f29.json`
- Requiere: ninguno
- `regresion-validadores.test.mjs` (confirmado): `CARPETA_FEATURE = /^F(2[4-9]|3[03])-/` (línea 17); la base se regenera con `FLUCASTR_GENERAR_BASE=1`; `diferencias(base, actual)` compara solo las claves de la base; helper `tareaTerminada(notas, estado)` y bordes (a) a (d) desde la línea ≈ 77.
- `pruebas/fixtures/regresion-f24-f29.json` (confirmado): hoy tiene 49 claves; F31 aporta 10 tareas `hecha` que cumplen la regla (`validar-tarea.mjs --fuente` da `OK: 10 tarea(s) válida(s)`), así que la base ampliada tiene 59.
- No se agregan las tareas de F32: su estado cambia mientras se construyen y fijaría respuestas transitorias.
- Base de `pruebas/rapida.sh` (confirmado por Franco y medido): `ℹ tests 598`, `ℹ pass 591`, `ℹ fail 7`; los 7 fallos conocidos no se arreglan aquí. F32 suma pruebas, así que `tests` y `pass` suben igual y `fail` sigue en 7; la rápida sale 1 y no se exige su línea de segundos.
- De las otras tareas lee solo las *Notas* de task-13.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «5. Pieza 3 — Telemetría que da pistas»

## Decisiones ya tomadas
- Primero se corre la regresión sin tocar nada: debe dar `ℹ fail 0` (las 49 respuestas no cambian por F32). Si falla, la tarea queda bloqueada con `BLOQUEO: rol=arquitecto` (hay regresión real) y no se regenera la base.
- Solo entonces `CARPETA_FEATURE` pasa a `/^F(2[4-9]|3[013])-/` y se regenera la base con `FLUCASTR_GENERAR_BASE=1`. El diff del JSON debe ser solo de líneas agregadas (`git diff --numstat` con 0 borradas); si alguna de las 49 claves cambió, bloqueada.
- Bordes nuevos en el mismo archivo: (e) una tarea `bloqueada` con `Bloqueo: tipo=entorno; falta=docker` seguida de `Registro: … causa=ninguna` da un motivo que menciona «Bloqueo»; (f) una tarea `cancelada` con `Cancelada: motivo=obsoleta` y sin *Evidencia* da `validarTarea` y `validarEvidencia` sin motivos; (g) la misma tarea sin la línea `Cancelada:` da un motivo en ambos.
- Se actualizan el comentario inicial y el título del primer `test` para decir «F24–F31 y F33». No se cambia ningún validador.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: la ampliación de la base, los bordes (e), (f), (g) y la regresión final.
Fuera de alcance: arreglar los 7 fallos conocidos, cualquier validador o script, `definitions/`.

## Pasos
1. Corre la regresión sin cambios y confirma `ℹ fail 0`.
2. Cambia `CARPETA_FEATURE`, regenera la base y revisa `git diff --numstat` del JSON.
3. Agrega los bordes (e), (f) y (g) y actualiza el comentario y el título.
4. Corre la regresión y los topes; cuenta las claves de la base.
5. Corre la rápida filtrando los contadores y compáralos con la base; mide los agentes y las skills.

## Criterios de aceptación
1. La regresión pasa sin diferencias sobre las 49 tareas originales y los bordes pasan; se comprueba con `node --test`.
2. La base ampliada tiene 59 claves y el diff solo agrega líneas; se comprueba con el segundo y tercer comando.
3. Ningún tope subió; se comprueba con el cuarto comando y `topes-bytes.test.mjs`.
4. La rápida mantiene `ℹ fail 7`; se comprueba con el quinto comando.

## Verificación
```
node --test pruebas/comprobaciones/regresion-validadores.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E "^ℹ fail"
node -e "console.log('claves de la base:', Object.keys(JSON.parse(require('fs').readFileSync('pruebas/fixtures/regresion-f24-f29.json','utf8'))).length)"
git diff --numstat pruebas/fixtures/regresion-f24-f29.json | awk '{print "borradas:", $2}'
test $(wc -c < agentes/coordinador.md) -le 7168 -a $(wc -c < agentes/planificador.md) -le 3584 -a $(wc -c < agentes/constructor.md) -le 3072 -a $(wc -c < agentes/arquitecto.md) -le 3584 -a $(wc -c < skills/ejecutar-tarea/SKILL.md) -le 7623 -a $(wc -c < skills/descomponer-feature/SKILL.md) -le 6400 && echo "topes respetados"
bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ fail"
```
Esperado: `ℹ fail 0`; `claves de la base: 59`; `borradas: 0`; `topes respetados`; `ℹ fail 7` (la rápida sale 1 y tarda menos de 180 s).

## Evidencia
Paso 1, antes de tocar nada (anotación): regresion-validadores con CARPETA_FEATURE original: tests 6, pass 6, fail 0.
Pasada única de la Verificación (intentos=1).

```
$ node --test pruebas/comprobaciones/regresion-validadores.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0
```

```
$ node -e "console.log('claves de la base:', Object.keys(JSON.parse(require('fs').readFileSync('pruebas/fixtures/regresion-f24-f29.json','utf8'))).length)"
claves de la base: 59
exit 0
```

```
$ git diff --numstat pruebas/fixtures/regresion-f24-f29.json | awk '{print "borradas:", $2}'
borradas: 0
exit 0
```
(anotación: numstat crudo «50 0 pruebas/fixtures/regresion-f24-f29.json»: 50 agregadas, 0 borradas; 49 claves originales más 10 de F31.)

```
$ test $(wc -c < agentes/coordinador.md) -le 7168 -a $(wc -c < agentes/planificador.md) -le 3584 -a $(wc -c < agentes/constructor.md) -le 3072 -a $(wc -c < agentes/arquitecto.md) -le 3584 -a $(wc -c < skills/ejecutar-tarea/SKILL.md) -le 7623 -a $(wc -c < skills/descomponer-feature/SKILL.md) -le 6400 && echo "topes respetados"
topes respetados
exit 0
```
(anotación de tamaños, bytes medidos: coordinador 7168 / tope 7168; planificador 3576 / tope 3584; constructor 3008 / tope 3072; arquitecto 3583 / tope 3584; ejecutar-tarea 7604 / tope 7623; descomponer-feature 6199 / tope 6400. Ningún tope subió.)

```
$ bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ fail"
ℹ fail 7
exit 0
```
(anotación: exit de la rápida sin filtro, en corrida aparte: 1. Contadores de la rápida: ℹ tests 658, ℹ pass 651, ℹ fail 7; base 655/648/7, la diferencia de 3 son los bordes e, f y g.)
(anotación: los 7 fallos son los conocidos, ninguno nuevo: BACKLOG real cumple el formato; falla si falta la lectura acotada en constructor; falla si falta la lectura acotada en ejecutar-tarea; falla si un agente conserva la línea de modelos.json; falla si WORKFLOW.md conserva la frase sobre modelos.json; falla si WORKFLOW.md pasa de 30720 caracteres; los archivos reales cumplen la regla.)

## Notas
- Hueco menor 1: el borde (e) usa `causa=ninguna` en una tarea bloqueada, como pide el encargo; el borde (c) previo ya usa `causa=otra`.
- Hueco menor 2: la cancelada de (f) y (g) se arma con la plantilla de tareaTerminada quitando su bloque de Evidencia, así queda sin Evidencia.
- Hueco menor 3: el comentario inicial y el título del primer test dicen «F24–F31 y F33», literal de la tarea. CARPETA_FEATURE se cambió a /^F(2[4-9]|3[013])-/ solo después de la pasada sin cambios.
- Modo yolo: sin rama, sin git switch, sin commit. definitions/STATUS.md no se tocó. Se leyeron las Notas de task-13 y los archivos de Contexto; no hizo falta lectura-extra.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
