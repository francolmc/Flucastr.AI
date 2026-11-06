# task-11 — `rapida.sh` incluye la prueba Capa 1 de compactación
repo: Flucastr.AI   depende_de: task-10   estado: hecha

## Descripción
Añadir `pruebas/capa1/compactacion.test.mjs` a la lista de archivos de `pruebas/rapida.sh` para que la verificación rápida cubra la instalación y desinstalación de la compactación, y comprobar que el tope de 30 s se mantiene.

## Contexto
- Leído `pruebas/rapida.sh` (22 líneas): el `for f in pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs pruebas/capa1/instalacion.test.mjs pruebas/capa1/copia.test.mjs pruebas/capa1/skills-proyecto.test.mjs; do` arma el arreglo `archivos`; `node --test "${archivos[@]}"` los corre en paralelo; el tope es `FLUCASTR_TOPE_RAPIDA` (30 por defecto) y falla con exit 1 si se supera. Un comentario explica que `remoto.test.mjs` queda fuera por tiempo.
- Medición de referencia (tarea de F18): `bash pruebas/rapida.sh` ≈ 12–14 s con 233 pruebas y 23 archivos. Las pruebas nuevas de la feature (tareas 03, 05 y 10) suman 3 archivos.
- `pruebas/comprobaciones/resolver-compactacion-*.test.mjs` ya entran por el comodín; solo falta la de Capa 1.

## Decisiones ya tomadas
- Se añade `pruebas/capa1/compactacion.test.mjs` al final de la lista del `for`, en la misma línea, sin cambiar el comentario sobre `remoto.test.mjs`.
- Regla de salida si el tope se rompe: se mide `bash pruebas/rapida.sh` tres veces. Si alguna pasa de 25 s, **no** se deja en `rapida.sh`: se revierte el cambio, se deja un comentario `# Fuera de la rápida (supera el margen del tope de 30 s): node --test pruebas/capa1/compactacion.test.mjs` junto al de `remoto.test.mjs`, y se informa en *Notas* con las tres mediciones (la prueba se corre aparte; el README de pruebas, task-16, lo dice).
- `TOPE` no cambia.

## Alcance / Fuera de alcance
Alcance: `pruebas/rapida.sh`.
Fuera de alcance: el valor del tope, otras pruebas, `pruebas/README.md` (task-16), `README.md`.

## Pasos
1. Medir la rápida actual con el primer comando de *Verificación*. Resultado: duración base anotada.
2. Añadir el archivo a la lista. Resultado: `grep -n "compactacion.test.mjs" pruebas/rapida.sh` muestra una línea.
3. Medir tres veces la rápida. Resultado: tres duraciones, todas ≤ 25 s (si no, aplicar la regla de salida).
4. Pegar las mediciones en *Evidencia*.

## Criterios de aceptación
1. `grep -n "pruebas/capa1/compactacion.test.mjs" pruebas/rapida.sh` muestra el archivo en la lista (o el comentario de «fuera de la rápida» si se aplicó la regla de salida).
2. Tres corridas de `bash pruebas/rapida.sh` terminan con exit 0 y la línea `rapida: N archivos en X s (tope 30 s)` con X ≤ 25.
3. El número de archivos de la línea final aumenta en 1 respecto de la medición base (si se incluyó).
4. `git diff --stat pruebas/rapida.sh` muestra solo ese archivo.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -1 "$R"
grep -n "compactacion.test.mjs" pruebas/rapida.sh
for i in 1 2 3; do R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -1 "$R"; done
git diff --stat pruebas/rapida.sh
```
Esperado: la primera línea es la medición base; el `grep` muestra una línea; tres líneas `rapida: … en X s (tope 30 s)` con X ≤ 25 y `exit=0`; el diff toca solo `pruebas/rapida.sh`. Ejecutado por el planificador (solo lectura): `pruebas/rapida.sh` existe y su lista de capa1 es la citada; las mediciones se hacen al construir.

## Evidencia
Rama: `feature/F19-compactacion-automatica` (ya era la actual; sin `git switch`, sin rama nueva). Sin commit ni push. `definitions/STATUS.md` no se tocó. No se ejecutó `instalar.sh` ni `desinstalar.sh`; `~/.pi` y `~/.claude` reales no se tocaron.

Medición base (antes del cambio, `bash pruebas/rapida.sh` con HOME real):
```
$ bash pruebas/rapida.sh > $R 2>&1; echo "rapida base exit=$?"; tail -1 $R
rapida base exit=0
rapida: 25 archivos en 14 s (tope 30 s)
ℹ tests 263
ℹ pass 263
ℹ fail 0
```

Cambio en `pruebas/rapida.sh` (única línea modificada):
```
$ git diff pruebas/rapida.sh
-...pruebas/capa1/skills-proyecto.test.mjs; do
+...pruebas/capa1/skills-proyecto.test.mjs pruebas/capa1/compactacion.test.mjs; do
```

Verificación (bloque de la tarea, última pasada):
```
$ grep -n "compactacion.test.mjs" pruebas/rapida.sh
8:for f in pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs pruebas/capa1/instalacion.test.mjs pruebas/capa1/copia.test.mjs pruebas/capa1/skills-proyecto.test.mjs pruebas/capa1/compactacion.test.mjs; do

$ bash pruebas/rapida.sh (corrida 1)
rapida exit=0
rapida: 26 archivos en 15 s (tope 30 s)
ℹ tests 272
ℹ pass 272
ℹ fail 0

$ bash pruebas/rapida.sh (corrida 2)
rapida exit=0
rapida: 26 archivos en 15 s (tope 30 s)
ℹ tests 272
ℹ pass 272
ℹ fail 0

$ bash pruebas/rapida.sh (corrida 3)
rapida exit=0
rapida: 26 archivos en 17 s (tope 30 s)
ℹ tests 272
ℹ pass 272
ℹ fail 0

$ git diff --stat pruebas/rapida.sh
 pruebas/rapida.sh | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

Criterios de aceptación:
1. Cumple: `compactacion.test.mjs` aparece en la lista (línea 8). No se aplicó la regla de salida.
2. Cumple: tres corridas con exit 0 y X = 15, 15 y 17 s (≤ 25 s).
3. Cumple: 25 → 26 archivos (+1).
4. Cumple: `git diff --stat pruebas/rapida.sh` toca solo ese archivo.

## Notas
- Modo: normal (el encargo no trae `Modo yolo: activo`). Rama ya actual: no se ejecutó ningún `git switch` ni `git switch -c`.
- Medidas de tiempo con la regla de la tarea: 15 s, 15 s y 17 s, todas ≤ 25 s. Ninguna superó el umbral, así que el comentario de «fuera de la rápida» no se aplicó.
- Falla intermitente de `registro.e2e.test.mjs` («2 !== 1»): no apareció en las cuatro corridas (base y tres con la prueba nueva), así que no hubo repetición.
- Sin huecos menores.
- Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
