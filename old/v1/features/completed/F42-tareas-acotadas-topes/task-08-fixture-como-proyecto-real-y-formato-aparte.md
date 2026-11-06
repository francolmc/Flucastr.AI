# task-08 — Corrección: fixture como proyecto real (aprobado, con plantilla) y formato ajeno a los topes aparte
repo: Flucastr.AI   depende_de: task-07   estado: hecha

## Descripción
Las corridas `-2.md` de task-10 dieron `Veredicto: FALLA` por dos causas ajenas a los topes, halladas sin gastar créditos (informes `-2.md` y `pruebas/.temporales/planificador-claude-code-28296/fixture/features/F01-demo/`). (1) Pi: el planificador no descompuso porque el `BACKLOG.md` del fixture dice «Estado del documento: borrador»; en la puerta 3 de un proyecto real está aprobado. (2) Claude Code: escribió 2 tareas con topes en regla (3 pasos, 1 archivo a leer) pero con 9 secciones (sin «## Decisiones abiertas») y «Tocar»/«Leer» con texto extra: el fixture no trae `definitions/WORKFLOW.md` §6 (plantilla de 10 secciones) ni dice que existe `validar-tarea`, y la plantilla de la skill lista solo 9 secciones (*inferido*; la skill no se toca aquí). Esta tarea hace el fixture fiel a un proyecto real y hace que el informe separe el formato de los topes, que es lo que F42 mide.

## Contexto
- Tocar: `pruebas/fixtures/planificador.sh`, `pruebas/comprobaciones/planificador-resultado.mjs`, `pruebas/comprobaciones/planificador-resultado.test.mjs`
- Leer: `pruebas/fixtures/planificador.sh`, `pruebas/comprobaciones/planificador-resultado.mjs`, `pruebas/comprobaciones/planificador-resultado.test.mjs@18-58`
- Patrón: la prueba (f) de `planificador-resultado.test.mjs` (lee archivos del fixture real) y el helper `tarea(...)` de ese archivo.
- De `depende_de:` lee solo las *Notas* de task-07.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Fixture (`planificador.sh`): (a) la última línea de `BACKLOG.md` pasa a `Estado del documento: aprobado`; (b) `PROJECT.md` lleva bajo el título la línea `> Estado: **aprobado** (2026-11-05).`; (c) `AGENTS.md` del fixture pasa a: `Proyecto de prueba del planificador; no tiene código real. Estado: aprobado (2026-11-05).` y tres viñetas: definición y backlog en `definitions/PROJECT.md` y `definitions/BACKLOG.md`; plantilla y topes de tarea en `definitions/WORKFLOW.md` §6; «Antes de entregar cada tarea, corre `node scripts/validar-tarea.mjs <ruta>` y corrige lo que rechace.»; (d) se crea `definitions/WORKFLOW.md` con `# Flujo de trabajo (extracto)`, una línea en blanco y la sección de `$REPO/definitions/WORKFLOW.md` que va de `## 6. ` hasta antes de `## 7. ` (con `awk '/^## 6\. /{p=1} p&&/^## 7\. /{exit} p'`). El texto de la feature, el prompt y la rama no cambian. El commit del fixture sigue incluyendo todo.
- Comprobador (`planificador-resultado.mjs`): las líneas del validador se reparten en dos grupos. *Topes* (cambian el veredicto, entran en «Motivos»): las que empiezan con `«Pasos» debe tener`, `«Criterios de aceptación» debe tener`, `«Tocar» debe tener entre`, `«Leer» tiene`, `El contexto a leer mide`, `El rango de «Leer»`, `El archivo de Leer`, `Hay más de una línea «- Leer:»` y `La línea «Leer» tiene formato inválido`. *Formato ajeno a los topes* (el resto): se escriben en una sección nueva `Formato ajeno a los topes (aparte; no cambia el veredicto):` después de «Motivos», con `- ninguno` si no hay. Motivo de la decisión (evidencia): en la corrida de Claude Code el único rechazo era de plantilla (secciones, comillas de «Tocar») con topes cumplidos; contarlo como FALLA haría medir la skill de formato y no los topes. La sección queda visible en el informe para que Franco la vea.
- Comprobador, medición propia de «Tocar»: si la línea `- Tocar:` tiene más de 3 rutas entre comillas invertidas, motivo `«Tocar» lista N archivos; el tope es 3.`; la cifra `archivos a tocar N` se añade al final de cada línea de «Por tarea» (`; archivos a tocar N`). Esto cubre el caso en que el validador no llega a medir «Tocar» por su formato. Sin línea `- Tocar:`, N es 0 y no hay motivo.
- Se mantiene todo lo demás: estado `borrador`, `Leer` obligatorio, avisos `AVISO:` como motivo y cambios fuera de `features/`.
- No se tocan agentes, skills, topes, `correr-planificador.sh`, el lanzador ni `validar-tarea.mjs`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: los cambios de fixture y comprobador de arriba y estas pruebas en `planificador-resultado.test.mjs` (el helper `tarea` gana los parámetros `tocar` y `sinAbiertas`; cada prueba usa el fixture real): (g) el fixture trae BACKLOG y PROJECT.md aprobados, sin «borrador» en ninguno de los dos, `definitions/WORKFLOW.md` con `## Decisiones abiertas`, y `AGENTS.md` con `validar-tarea.mjs`; (h) tarea con topes en regla pero sin «## Decisiones abiertas» y con «Tocar» sin comillas da `Veredicto: OK` y su informe contiene `Formato ajeno a los topes` y `Falta la sección`; (i) control negativo: «Tocar» con 4 rutas, una vez entre comillas y otra sin ellas, da FALLA las dos veces; (j) control negativo: 7 pasos y sin «Decisiones abiertas» da FALLA con el motivo de pasos en «Motivos» y la falta de la sección solo bajo `Formato ajeno a los topes`. Las pruebas existentes (a)–(f) siguen en verde; (a) comprueba además `- ninguno` bajo la sección nueva.
Fuera de alcance: corridas reales (task-10), cambiar la skill para que liste «Decisiones abiertas» (queda como hallazgo para Franco), editar el lanzador, `correr-planificador.sh`, el commit.

## Pasos
1. Corre `git branch --show-current`.
2. En `planificador.sh`, aplica las decisiones del fixture (a)–(d). Resultado: `bash -n` sin salida.
3. En `planificador-resultado.mjs`, reparte las líneas del validador en topes y formato, añade la medición propia de «Tocar» y la cifra `archivos a tocar`, y comenta arriba la decisión y su evidencia.
4. En `planificador-resultado.test.mjs`, amplía el helper `tarea`, añade la aserción en (a) y las pruebas (g), (h), (i), (j).
5. Corre la verificación y copia la salida real en *Evidencia*.

## Criterios de aceptación
1. El fixture trae BACKLOG y PROJECT.md aprobados, `definitions/WORKFLOW.md` con la plantilla de 10 secciones y `AGENTS.md` que nombra `validar-tarea.mjs` (prueba g).
2. Una tarea con topes en regla pero con rechazo solo de formato da `Veredicto: OK` y el informe lo lista bajo `Formato ajeno a los topes` (prueba h).
3. Control negativo: 4 rutas en «Tocar» (con y sin comillas) y 7 pasos dan FALLA (pruebas i y j), y el formato no aparece en «Motivos» (prueba j).
4. Con todo en regla el informe trae `- ninguno` bajo `Formato ajeno a los topes` (prueba a).
5. `node --test pruebas/comprobaciones/planificador-resultado.test.mjs pruebas/correr-planificador.test.mjs` termina con `fail 0`.

## Verificación
```
git branch --show-current
bash -n pruebas/fixtures/planificador.sh
node --test pruebas/comprobaciones/planificador-resultado.test.mjs pruebas/correr-planificador.test.mjs
```
Esperado: rama `feature/F42-tareas-acotadas-topes`; sin salida; `fail 0`.

## Evidencia
```
$ git branch --show-current
feature/F42-tareas-acotadas-topes
exit 0

$ bash -n pruebas/fixtures/planificador.sh
exit 0

$ node --test pruebas/comprobaciones/planificador-resultado.test.mjs pruebas/correr-planificador.test.mjs
ℹ tests 15
ℹ pass 15
ℹ fail 0
ℹ duration_ms 7922.458292
exit 0
```

## Notas
- Huecos menores resueltos:
  1. «Tocar»: el criterio 3 y la prueba (i) exigen FALLA también sin comillas, así que se cuentan las rutas separadas por «, » con o sin comillas (desvío leve de *Decisiones ya tomadas*).
  2. Con comillas el validador ya marca el tope; la medición propia no lo repite.
  3. Los motivos de tope llevan delante el nombre de la tarea.
- `planificador.sh` revisado antes de editar: 52 líneas, `bash -n` sin salida, corrida de prueba correcta. Permisos `-rw-r--r--` (los demás fixtures son ejecutables); se invoca con `bash`, no se cambió. Dato para Franco.
- Primera pasada de la verificación: falló en dos aserciones mías, corregidas; la segunda pasa.
- Sin tocar: `validar-tarea.mjs`, lanzador, skills, topes, `STATUS.md`. Sin corridas con modelo real. Sin commit.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
