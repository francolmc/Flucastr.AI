# task-01 — Tope de 6 pasos en el validador de formato
repo: Flucastr.AI   depende_de: —   estado: lista para revisión

## Descripción
La regla 6 de `scripts/formato-tarea.mjs` acepta hoy de 1 a 8 pasos. Pasa a 1–6 para toda tarea vigente (no `hecha` ni `cancelada`); las `hecha` y `cancelada` conservan 1–8 y no se revalidan. Primera pieza de F42: es la única que no necesita leer archivos.

## Contexto
- Tocar: `scripts/formato-tarea.mjs`, `pruebas/comprobaciones/formato-tarea.test.mjs`
- Leer: `scripts/formato-tarea.mjs@165-12`, `pruebas/comprobaciones/formato-tarea.test.mjs@56-30`
- Regla vigente: comentario «Regla 6: entre 1 y 8 pasos numerados» y mensaje «`«Pasos» debe tener entre 1 y 8 líneas numeradas; tiene ${pasos}.`». La variable `estado` ya la devuelve `revisarCabeceraYSecciones`. La variante de prueba «regla 6: nueve pasos» (línea 58) debe seguir fallando.
- Inventario de tareas con 7–8 pasos (confirmado el 2026-11-05 por el planificador): las 22 tareas de F38, F39 y F41 están `hecha` y ninguna pasa de 6 pasos; no hay nada que rehacer. Las `hecha` quedan exentas por decisión de Franco (`definitions/F42-TOPES.md`, «Decisiones de Franco» 3).
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Constantes exportadas `MAX_PASOS = 6` y `MAX_PASOS_EXENTAS = 8`; estados exentos: `hecha` y `cancelada`.
- Mensaje nuevo: `«Pasos» debe tener entre 1 y ${max} líneas numeradas; tiene ${pasos}.` con `max` según el estado.
- Error directo, sin aviso previo (Franco, 2026-11-05). No se toca la regla 7 (criterios ≤5) ni la 11 (`Tocar` ≤3), que ya existen.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: la regla 6 y sus pruebas.
Fuera de alcance: contexto a leer (task-02), el CLI (task-03), `skills/`, `definitions/`.

## Pasos
1. Corre `git branch --show-current`.
2. En `scripts/formato-tarea.mjs`, exporta `MAX_PASOS` y `MAX_PASOS_EXENTAS` y cambia la regla 6 para usar el tope según el estado.
3. En `pruebas/comprobaciones/formato-tarea.test.mjs`, añade tres pruebas: 6 pasos en `aprobada` pasa; 7 pasos en `aprobada` falla con «entre 1 y 6»; 7 pasos en `hecha` pasa (control negativo de la exención).
4. Corre las dos verificaciones de abajo.

## Criterios de aceptación
1. `validarTarea` rechaza 7 pasos en `aprobada` y `borrador` (prueba nueva).
2. `validarTarea` acepta 7 pasos en `hecha` y 9 sigue rechazado en cualquier estado (pruebas).
3. Todas las tareas de `features/` que hoy son válidas siguen siéndolo (comando 3).

## Verificación
```
git branch --show-current
node --test pruebas/comprobaciones/formato-tarea.test.mjs
node scripts/validar-tarea.mjs features/F*/task-*.md
```
Esperado: rama `feature/F42-tareas-acotadas-topes`; `fail 0`; `tarea(s) válida(s)` con salida 0.

## Evidencia

```
$ git branch --show-current
feature/F42-tareas-acotadas-topes
exit 0

$ node --test pruebas/comprobaciones/formato-tarea.test.mjs
ℹ tests 37
ℹ suites 0
ℹ pass 37
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 189.952417
exit 0

$ node scripts/validar-tarea.mjs features/F*/task-*.md
OK: 31 tarea(s) válida(s)
exit 0
```

## Notas
- Reintento tras el bloqueo de la primera pasada: la línea «Esperado» de *Verificación* ya es un fragmento literal (`tarea(s) válida(s)`). Se corrió la *Verificación* tal cual está escrita; la nota de bloqueo anterior queda retirada.
- Rama: `feature/F42-tareas-acotadas-topes` es la actual; no se creó ni cambió de rama.
- Código y pruebas revisados y no rehechos: `MAX_PASOS = 6` y `MAX_PASOS_EXENTAS = 8` exportados (`scripts/formato-tarea.mjs`, líneas 23-24); la regla 6 elige el tope según el estado (`ESTADOS_EXENTOS_DE_TOPE_PASOS`, líneas 173-174); las pruebas nuevas (6 pasos en `aprobada` pasa; 7 en `aprobada` y `borrador` fallan con «entre 1 y 6»; 7 en `hecha` pasa y 9 sigue rechazado) y la de 9 pasos de la regla 6 pasan.
- Criterio 3 (tareas vigentes siguen válidas): `validar-tarea.mjs` da `OK: 31 tarea(s) válida(s)`, exit 0.
- Huecos menores de esta ejecución: 0. El control de 9 pasos en `hecha` (criterio 2) ya está en las pruebas.
- Pasadas completas de *Verificación* en esta ejecución: 2 (la segunda solo para capturar el exit code de cada comando; ambas pasan).
- No se hizo commit, push, PR ni merge.

Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=1; resultado=bloqueada; causa=otra
Registro: n=2; herramienta=claude-code; modo=normal; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
