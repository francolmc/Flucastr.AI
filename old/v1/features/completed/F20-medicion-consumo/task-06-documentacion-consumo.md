# task-06 — Documentar `scripts/consumo.mjs` en README y pruebas
repo: Flucastr.AI   depende_de: task-05   estado: hecha

## Descripción
Deja escrito cómo se usa la medición de consumo: una entrada en el árbol del README, una sección corta con el comando y lo que mide, y las pruebas nuevas en `pruebas/README.md`. Sin cambio de comportamiento.

## Contexto
- Leer `README.md` línea 88-93 (árbol de `scripts/`), la sección `## Registro de eventos` (líneas ~254-262, modelo de redacción: primera persona, comando, qué escribe y qué no) y `pruebas/README.md` (viñetas de F19 como modelo).
- `pruebas/comprobaciones/readme-estructura.mjs` solo valida `agentes/` y `skills/` del árbol; la entrada de `scripts/` no lo afecta, pero `node --test pruebas/comprobaciones/readme-estructura.test.mjs` debe seguir pasando.
- Leer también la salida real de `node scripts/consumo.mjs --raiz <fixture>` que dejó task-05 (en su Evidencia) para citar las opciones exactas.
- Tocar: `README.md`, `pruebas/README.md`.

## Decisiones ya tomadas
- Árbol: agregar bajo `scripts/`, antes de `registrar.mjs` (que pasa a ser `├──` y `consumo.mjs` queda entre `archivar.mjs` y `registrar.mjs`; el último hijo conserva `└──`): `consumo.mjs    # mide consumo de tokens, turnos y KB leídos por rol desde los logs de Pi y Claude Code (solo lectura; lo corre Franco)`.
- Nueva sección `## Medición de consumo` en `README.md`, justo antes de `## Registro de eventos`, con: comando (`node scripts/consumo.mjs --raiz <carpeta de logs> [--hasta <ISO>] [--tareas <n>] [--json]`), dónde están los logs de Pi (`~/.pi/agent/sessions/--<proyecto>--/`) y de Claude Code (`~/.claude/projects/<proyecto>/`), qué mide (costo, turnos por tipo y por tramo de contexto, llamadas a subagentes, `subagents_enable`, KB leídos por rol), que en Claude Code el costo es `n/d`, que solo mide lecturas con `read`, que no imprime texto de mensajes y que no escribe nada. Máximo 12 líneas.
- `pruebas/README.md`: una viñeta «Consumo (F20)» con `node --test pruebas/comprobaciones/consumo.test.mjs` y la cifra de pruebas que dé la corrida real (se cuenta con la salida de `node --test`).
- No se modifica `definitions/` ni `AGENTS.md`.

## Alcance / Fuera de alcance
Alcance: dos archivos de documentación.
Fuera de alcance: `definitions/WORKFLOW.md` (incluida la lista de §3.1: el `coordinador` no corre este script); `AGENTS.md`; cambios en `scripts/` o en las pruebas.

## Pasos
1. `README.md`: agregar la entrada de `consumo.mjs` al árbol.
2. `README.md`: agregar la sección `## Medición de consumo`.
3. `pruebas/README.md`: agregar la viñeta con la cifra real de pruebas.
4. Correr las verificaciones.

## Criterios de aceptación
1. El árbol lista `consumo.mjs` con su descripción y `registrar.mjs` sigue como último hijo (`grep` lo muestra).
2. La sección existe antes de `## Registro de eventos` y menciona las cinco opciones/limitaciones de Decisiones.
3. `pruebas/README.md` cita el comando y una cifra de pruebas que coincide con la corrida.
4. `readme-estructura.test.mjs` y `bash pruebas/rapida.sh` pasan.

## Verificación
- `grep -n 'consumo.mjs' README.md pruebas/README.md` → al menos 3 líneas (árbol, sección, pruebas).
- `grep -n '^## Medición de consumo\|^## Registro de eventos' README.md` → la primera con número menor.
- `node --test pruebas/comprobaciones/readme-estructura.test.mjs` → `fail 0`.
- `bash pruebas/rapida.sh` → código 0 y `rapida: … (tope 30 s)` con S ≤ 30.

## Evidencia
```
$ grep -n 'consumo.mjs' README.md pruebas/README.md
README.md:92:│   ├── consumo.mjs     # mide consumo de tokens, turnos y KB leídos por rol desde los logs de Pi y Claude Code (solo lectura; lo corre Franco)
README.md:259:`node scripts/consumo.mjs --raiz <carpeta de logs> [--hasta <ISO>] [--tareas <n>] [--json]`
pruebas/README.md:30:- Consumo (F20): `node --test pruebas/comprobaciones/consumo.test.mjs` (43 pruebas, sin modelo ni red; fuera de `rapida.sh`). ...

$ grep -n '^## Medición de consumo\|^## Registro de eventos' README.md
255:## Medición de consumo
263:## Registro de eventos

$ node --test pruebas/comprobaciones/readme-estructura.test.mjs
ℹ pass 7
ℹ fail 0

$ bash pruebas/rapida.sh; echo codigo=$?
rapida: 28 archivos en 17 s (tope 30 s)
codigo=0

$ node --test pruebas/comprobaciones/consumo.test.mjs   (cifra para la viñeta)
ℹ tests 43
ℹ pass 43
ℹ fail 0

$ node scripts/consumo.mjs --raiz <carpeta vacía del scratchpad>; echo codigo=$?
No hay sesiones (*.jsonl) bajo la raíz.

Solo se cuentan lecturas con la herramienta read; lo leído por bash no se mide.
codigo=0

$ node scripts/consumo.mjs; echo codigo=$?
error: falta --raiz <dir>
codigo=1
```
(La línea de `pruebas/README.md` se recorta aquí; el texto completo está en el archivo.)

## Notas
- Huecos menores resueltos:
  1. La Evidencia de task-05 no trae la salida de `--raiz <fixture>` (solo el error sin `--raiz`). Se corrió `--raiz` sobre una carpeta vacía del scratchpad y se citó esa salida real.
  2. Árbol: la decisión dice que `registrar.mjs` pasa a `├──`, pero el criterio 1 pide que siga como último hijo. Se dejó `consumo.mjs` con `├──` antes de `registrar.mjs` y `registrar.mjs` con `└──`.
  3. Sección: se anotó que `--hasta` no se aplica a los subagentes de Claude Code (limitación ya anotada en task-05).
- Pruebas: `consumo.test.mjs` no está dentro de `rapida.sh`; la viñeta lo dice.
- Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
