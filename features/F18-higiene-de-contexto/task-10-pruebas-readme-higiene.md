# task-10 — Documentar en `pruebas/README.md` las pruebas de higiene de contexto
repo: Flucastr.AI   depende_de: task-06, task-08, task-09   estado: borrador

## Descripción
Agregar a `pruebas/README.md` una viñeta que describe la prueba sin modelo `higiene-contexto.test.mjs` (task-06) y las dos corridas con modelo (informes de task-08 y task-09), para que quien corra las pruebas sepa qué fija la regla `CONTEXTO:`.

## Contexto
- Leído: `pruebas/README.md`: líneas 5–6 (rápida y suite), 9 (modelo de cada agente) y 10–14 (corridas del `coordinador` con sub-lista de archivos) son el estilo a imitar.
- Informes a citar: `pruebas/resultados/2026-10-31-higiene-contexto-claude.md` y `pruebas/resultados/2026-10-31-higiene-contexto-pi.md` (creados por task-08 y task-09; léelos para citar el veredicto real).
- No existe comprobador que lea `pruebas/README.md`; se verifica con la rápida.

## Decisiones ya tomadas
- Una viñeta nueva, inmediatamente después de la viñeta «Corridas del `coordinador`» y su sub-lista, con este contenido: prueba sin modelo `node --test pruebas/comprobaciones/higiene-contexto.test.mjs` (fija `CONTEXTO: sesion-nueva` / `CONTEXTO: compactar` en `agentes/coordinador.md`, la ausencia de la línea de `modelos.json` en los agentes, la línea de lectura acotada en `constructor` y `ejecutar-tarea`, y el tope de 30.720 caracteres de `WORKFLOW.md`); corridas con modelo (una por herramienta, con el prompt y el veredicto de cada informe, con la fecha y el modelo).
- El veredicto se copia de los informes tal cual (OK o FALLA); no se reinterpreta.

## Alcance / Fuera de alcance
Alcance: la viñeta en `pruebas/README.md`.
Fuera de alcance: cualquier otra viñeta, `README.md` raíz, scripts, comprobadores.

## Pasos
1. Leer los dos informes y el test. Resultado: veredictos anotados en *Notas*.
2. Insertar la viñeta. Resultado: `grep -n "higiene-contexto" pruebas/README.md` con al menos 2 líneas.
3. Correr la verificación y pegarla en *Evidencia*.

## Criterios de aceptación
1. La viñeta cita el test y los dos informes con sus rutas existentes (`ls` de cada una).
2. Los veredictos citados coinciden con los informes (`grep -n "Veredicto" pruebas/resultados/2026-10-31-higiene-contexto-*.md`).
3. `bash pruebas/rapida.sh` termina con exit 0.
4. `git diff --stat` de esta tarea muestra solo `pruebas/README.md`.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -n "higiene-contexto" pruebas/README.md
ls pruebas/comprobaciones/higiene-contexto.test.mjs pruebas/resultados/2026-10-31-higiene-contexto-claude.md pruebas/resultados/2026-10-31-higiene-contexto-pi.md
bash pruebas/rapida.sh | tail -1
```
Esperado: al menos dos líneas del `grep`; tres rutas listadas; `rapida: … (tope 30 s)` con exit 0.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
