# task-17 — `pruebas/README.md`: documentar las pruebas de compactación
repo: Flucastr.AI   depende_de: task-15, task-16   estado: borrador

## Descripción
Agregar a `pruebas/README.md` una viñeta que describe las pruebas sin modelo de la compactación (resolver, Capa 1 y regla del `coordinador`) y las dos corridas con modelo que cruzan una compactación (informes de las tareas 15 y 16), para que quien corra las pruebas sepa qué fija cada una y dónde corre.

## Contexto
- Leído `pruebas/README.md`: líneas 5–6 (rápida y suite completa), 9 (modelo de cada agente) y 10–14 (corridas del `coordinador` con sub-lista) son el estilo a imitar; la última viñeta es «Registro de eventos: …».
- Archivos a citar (creados por las tareas anteriores): `pruebas/comprobaciones/resolver-compactacion-pi.test.mjs` (task-03), `pruebas/comprobaciones/resolver-compactacion-claude.test.mjs` (task-05), `pruebas/capa1/compactacion.test.mjs` (task-10; dentro de `rapida.sh` salvo que la task-11 haya aplicado su regla de salida: leer `pruebas/rapida.sh` y decir lo que haga), `pruebas/comprobaciones/coordinador-status.test.mjs` (task-13).
- Informes con modelo: `pruebas/resultados/2026-10-31-compactacion-pi.md` (task-15) y `pruebas/resultados/2026-10-31-compactacion-claude.md` (task-16); léelos para copiar el veredicto real.
- No existe comprobador que lea `pruebas/README.md`; se verifica con la rápida.

## Decisiones ya tomadas
- Una viñeta nueva (con sub-lista) justo después de la viñeta «Registro de eventos», con: las cuatro pruebas sin modelo, su comando `node --test <ruta>` y qué fija cada una en una frase; las dos corridas con modelo (una por herramienta, sobre el fixture del coordinador, con umbral artificialmente bajo en un directorio temporal, sin tocar la configuración real), el veredicto copiado de cada informe (OK, FALLA o no concluyente, tal cual), el modelo y la fecha; la advertencia «la corrida con modelo solo se hace a pedido de Franco» y que Claude Code lleva el colchón de 33.000 (el umbral más bajo posible es ≈67 k).
- Si alguna tarea 15 o 16 quedó `bloqueada` o sin informe, la viñeta lo dice («sin ejecutar») en lugar de inventar un veredicto.
- El veredicto se copia, no se reinterpreta.

## Alcance / Fuera de alcance
Alcance: la viñeta en `pruebas/README.md`.
Fuera de alcance: cualquier otra viñeta, `README.md` raíz, scripts, comprobadores, informes.

## Pasos
1. Leer los cuatro archivos de prueba, `pruebas/rapida.sh` y los dos informes. Resultado: veredictos y estado de `rapida.sh` anotados en *Notas*.
2. Insertar la viñeta tras «Registro de eventos». Resultado: `grep -n "compactacion" pruebas/README.md` con al menos 5 líneas.
3. Correr la verificación y pegarla en *Evidencia*.

## Criterios de aceptación
1. La viñeta cita las cuatro pruebas y los dos informes con rutas que existen (`ls` de cada una).
2. Los veredictos citados coinciden con los informes (`grep -n "Veredicto" pruebas/resultados/2026-10-31-compactacion-*.md`).
3. Lo dicho sobre `rapida.sh` coincide con su contenido (`grep -n compactacion pruebas/rapida.sh`).
4. `bash pruebas/rapida.sh` termina con exit 0.
5. `git diff --stat pruebas/README.md` muestra solo ese archivo de esta tarea.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -n "compactacion" pruebas/README.md
ls pruebas/comprobaciones/resolver-compactacion-pi.test.mjs pruebas/comprobaciones/resolver-compactacion-claude.test.mjs pruebas/capa1/compactacion.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs pruebas/resultados/2026-10-31-compactacion-pi.md pruebas/resultados/2026-10-31-compactacion-claude.md
grep -n "Veredicto" pruebas/resultados/2026-10-31-compactacion-*.md
grep -n "compactacion" pruebas/rapida.sh
R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -2 "$R"
git diff --stat pruebas/README.md
```
Esperado: al menos cinco líneas del primer `grep`; seis rutas listadas; los veredictos de los dos informes; la línea de `rapida.sh` que incluye la prueba (o su comentario); `rapida exit=0`; el diff toca solo `pruebas/README.md`. No ejecutado por el planificador: depende de las tareas 03 a 16.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
