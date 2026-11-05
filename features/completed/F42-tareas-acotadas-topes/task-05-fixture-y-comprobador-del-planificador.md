# task-05 — Fixture y comprobador de la corrida del planificador
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
Prepara, sin modelo ni red, lo necesario para medir si el modelo real del `planificador` respeta los topes: un fixture con un backlog de una feature que toca cinco módulos, y un comprobador que valida con el validador real las tareas que el planificador deje. Patrón de F36 y de F39.

## Contexto
- Tocar: `pruebas/fixtures/planificador.sh`, `pruebas/comprobaciones/planificador-resultado.mjs`, `pruebas/comprobaciones/planificador-resultado.test.mjs`
- Leer: `pruebas/fixtures/repetido.sh`, `pruebas/comprobaciones/repetido-resultado.mjs`, `pruebas/fixtures/_comun.sh@1-20`
- Patrón: `repetido.sh` (usa `inicializar_repo`, copia los scripts a `$out/scripts/`, `BACKLOG.md` con `→`) y `repetido-resultado.mjs` (`analizarCorrida({ dir, herramienta })` devuelve `{ ok, informe }`).
- De `depende_de:` lee solo las *Notas* de task-03.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- `planificador.sh DIRECTORIO` deja un repo en la rama `feature/F01-demo` con: todos los `scripts/formato-*.mjs`, `firma.mjs` y `validar-tarea.mjs` copiados a `scripts/`; `src/a.js` … `src/e.js` (45 líneas de código inventado cada uno) y `README.md`; `AGENTS.md` de una línea; `definitions/PROJECT.md` con `## Qué es` y `## Cómo se prueba` (`node --test` en `pruebas/`); `definitions/BACKLOG.md` con la fila F01 «Medir el tiempo de cada comando en los cinco módulos de `src/` y mostrarlo con `--tiempos`», `pendiente`, marca `→`, tipo `producto`, rama `feature/`. Sin carpeta `features/F01-demo`.
- Prompt de la corrida (lo usa task-06): `Skill: descomponer-feature. Disparó: franco. Descompón F01 en features/F01-demo/ con tareas en borrador. Rama: feature/F01-demo.`
- `analizarCorrida` lee `dir/fixture/features/F01-demo/task-*.md` y corre `node <raíz>/scripts/validar-tarea.mjs` con `cwd` en `dir/fixture`. OK si y solo si hay al menos una tarea, todas en `borrador`, el validador sale 0 sin líneas `AVISO:`, cada una declara `- Leer:` y `git status --short` del fixture solo muestra rutas bajo `features/` o `definitions/BACKLOG.md`. El informe lleva `Veredicto: OK|FALLA`, y por tarea: pasos, archivos a leer y bytes de contexto.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: fixture, comprobador y 5 pruebas: OK con 2 tareas válidas; control negativo con 5 archivos en `Leer` (FALLA); control negativo con 7 pasos (FALLA); tarea sin `Leer` (FALLA); archivo modificado fuera de `features/` (FALLA).
Fuera de alcance: lanzar modelos (task-06 y task-10), tocar `repetido.sh`.

## Pasos
1. Corre `git branch --show-current`.
2. Escribe `planificador.sh` y pruébalo a mano en un directorio bajo `pruebas/.temporales/`.
3. Escribe `planificador-resultado.mjs` y su prueba (las tareas de prueba se arman dentro del fixture temporal).
4. Corre la verificación.

## Criterios de aceptación
1. El fixture deja `definitions/BACKLOG.md` válido y `bash -n` sin salida.
2. El comprobador da OK con tareas dentro de los topes y FALLA en cada control negativo (pruebas).
3. El informe contiene `Veredicto:` y las cifras por tarea (prueba).

## Verificación
```
git branch --show-current
bash -n pruebas/fixtures/planificador.sh
node --test pruebas/comprobaciones/planificador-resultado.test.mjs
```
Esperado: rama `feature/F42-tareas-acotadas-topes`; `bash -n` sin salida; `fail 0`.

## Evidencia

```
$ git branch --show-current
feature/F42-tareas-acotadas-topes
exit 0

$ bash -n pruebas/fixtures/planificador.sh
exit 0

$ node --test pruebas/comprobaciones/planificador-resultado.test.mjs
✔ (a) dos tareas válidas dentro de los topes dan OK, con cifras por tarea (371.16325ms)
✔ (b) control negativo: cinco archivos en «Leer» dan FALLA (513.629875ms)
✔ (c) control negativo: siete pasos dan FALLA (599.704416ms)
✔ (d) control negativo: tarea sin «Leer» da FALLA (547.919625ms)
✔ (e) control negativo: un archivo modificado fuera de features/ da FALLA (415.411625ms)
✔ (f) el fixture deja BACKLOG válido, en la rama feature/F01-demo y con bash -n sin salida (341.043333ms)
ℹ tests 6
ℹ suites 0
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3074.868292
exit 0
```

## Notas
- Fixture: `pruebas/fixtures/planificador.sh` deja el repo en `feature/F01-demo` con los scripts copiados, `src/a.js` … `src/e.js` (45 líneas), `README.md`, `AGENTS.md`, `definitions/PROJECT.md` y `definitions/BACKLOG.md` con la fila F01 (`→`, `pendiente`). Probado a mano en `pruebas/.temporales/`: `git status` limpio tras el commit del fixture, `validar-tarea.mjs` sin tareas sale 2 por uso (esperado).
- Comprobador: `pruebas/comprobaciones/planificador-resultado.mjs` (`analizarCorrida({ dir, herramienta })`, lee `dir/fixture/features/F01-demo/task-*.md`, valida con `scripts/validar-tarea.mjs` del kit y da `Veredicto:` con cifras por tarea). Prueba en `planificador-resultado.test.mjs`: seis pruebas, con el fixture real en directorios temporales.
- Huecos menores: 1. La tabla de BACKLOG no tiene columna de rama; la indicación «rama `feature/`» va en la columna «Por qué en esta posición».
- Las tres pruebas de control negativo (b, c, d) comprueban FALLA; la (e) comprueba además que el motivo nombra `src/a.js`.
- Verificación: una pasada completa (las tres órdenes), con código real. Después se repitió solo la prueba `node --test` para confirmar el código de salida; sin cambios de código entre ambas.
- Sin commit, push, PR ni merge en el repo Flucastr.AI. Rama no cambiada (`feature/F42-tareas-acotadas-topes`, actual). `STATUS.md` no tocado.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
