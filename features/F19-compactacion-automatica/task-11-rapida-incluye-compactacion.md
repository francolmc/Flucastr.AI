# task-11 — `rapida.sh` incluye la prueba Capa 1 de compactación
repo: Flucastr.AI   depende_de: task-10   estado: aprobada

## Descripción
Añadir `pruebas/capa1/compactacion.test.mjs` a la lista de archivos de `pruebas/rapida.sh` para que la verificación rápida cubra la instalación y desinstalación de la compactación, y comprobar que el tope de 30 s se mantiene.

## Contexto
- Leído `pruebas/rapida.sh` (22 líneas): el `for f in pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs pruebas/capa1/instalacion.test.mjs pruebas/capa1/copia.test.mjs pruebas/capa1/skills-proyecto.test.mjs; do` arma el arreglo `archivos`; `node --test "${archivos[@]}"` los corre en paralelo; el tope es `FLUCASTR_TOPE_RAPIDA` (30 por defecto) y falla con exit 1 si se supera. Un comentario explica que `remoto.test.mjs` queda fuera por tiempo.
- Medición de referencia (tarea de F18): `bash pruebas/rapida.sh` ≈ 12–14 s con 233 pruebas y 23 archivos. Las pruebas nuevas de la feature (tareas 03, 05 y 10) suman 3 archivos.
- `pruebas/comprobaciones/resolver-compactacion-*.test.mjs` ya entran por el comodín; solo falta la de Capa 1.

## Decisiones ya tomadas
- Se añade `pruebas/capa1/compactacion.test.mjs` al final de la lista del `for`, en la misma línea, sin cambiar el comentario sobre `remoto.test.mjs`.
- Regla de salida si el tope se rompe: se mide `bash pruebas/rapida.sh` tres veces. Si alguna pasa de 25 s, **no** se deja en `rapida.sh`: se revierte el cambio, se deja un comentario `# Fuera de la rápida (supera el margen del tope de 30 s): node --test pruebas/capa1/compactacion.test.mjs` junto al de `remoto.test.mjs`, y se informa en *Notas* con las tres mediciones (la prueba se corre aparte; el README de pruebas, task-17, lo dice).
- `TOPE` no cambia.

## Alcance / Fuera de alcance
Alcance: `pruebas/rapida.sh`.
Fuera de alcance: el valor del tope, otras pruebas, `pruebas/README.md` (task-17), `README.md`.

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
(lo llena el constructor)

## Notas
(lo llena el constructor)
