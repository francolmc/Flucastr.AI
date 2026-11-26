---
segment: 9
---
## Steps

### Segment 9 — Story: Comprobar ventanas
As persona usuaria I want ver la ventana efectiva por proyecto, herramienta y agente so that detecte un margen corto antes de que ocurra el bucle.
Dependencies: Segments 1–8 — valores y lugares donde se escriben.
Contracts to keep: solo lectura; imprime únicamente claves de compactación, nunca otros valores de ajustes.
Paths likely to change: `tools/resolver/windows.mjs` (nuevo), `scripts/resolver.mjs`, `README.md`.
Concrete example of the expected result: `node scripts/resolver.mjs ventanas /ruta/proyecto` lista `claude-code planner claude-planner 300000 267000 OK`.
Scope: los archivos de Files, `README.md` y `tests/compaction/windows.test.mjs`.
Files: tools/resolver/windows.mjs, scripts/resolver.mjs, README.md
WHEN se ejecuta `ventanas` THEN lista las ventanas efectivas y avisa los riesgos (A9).
Acceptance:
- A9: `ventanas [proyecto…]` suma los proyectos del manifiesto a los argumentos y muestra: proyecto, herramienta, agente, vía, ventana, disparo, origen, piso, estado. Claude Code: precedencia `CLAUDE_CODE_AUTO_COMPACT_WINDOW` (entorno o bloque `env`) > `--autocompact` del lanzador > `modelSettings` > `autoCompactWindow` local > proyecto > usuario; planner y builder por lanzador y por sesión; builder subagente = menor entre frontmatter e heredada; revisor hereda; disparo = ventana − 33000. Codex: `-c` del lanzador o `config.toml` de `CODEX_HOME`; revisor de `kit run` según `compactarEn`. Pi: override o compactación global, con la ventana del perfil. Avisa: variable de entorno, `modelSettings`, `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`, planner o revisor sin fijar, y disparo − piso < `work_margin`. Piso: medido propio, si no el del mismo agente en otra herramienta marcado «prestado» (revisor usa planner); builder «piso sin medir» sin aviso. Sale 0, 1 con avisos, 2 por uso.
TODO:
- [x] Crear `tools/resolver/windows.mjs` con la lectura y la tabla (A9). Check: `node --check tools/resolver/windows.mjs`; salida 0.
- [x] Registrar `ventanas` en `scripts/resolver.mjs` y su cabecera (A9). Check: `node --check scripts/resolver.mjs`; salida 0.
- [x] Documentar tabla, regla, comando y reinstalación en `./README.md`, corrigiendo menciones antiguas a 133000 (A9). Check: `git diff --check`; salida 0.
- [x] Crear `tests/compaction/windows.test.mjs`: Claude planner OK, Codex y Pi planner con aviso, cada aviso, y un valor secreto de prueba que no aparece en la salida (A9). Check: `node --test tests/compaction/windows.test.mjs`; salida 0.

Correcciones (revisión RETURNED 2026-11-25; mandan sobre la redacción de A9):
- [x] D1, `tools/resolver/windows.mjs`: filas Claude Code por proyecto: planner y builder con vía `claude-<agente>` (si el lanzador tiene `--autocompact`) y vía `sesión` (solo entorno y ajustes, sin lanzador; sin valor: `sin fijar`), builder `subagente` (menor entre frontmatter y la ventana efectiva del planner) y revisor (hereda la efectiva del planner). El builder no avisa por piso sin medir. Check: `node --check tools/resolver/windows.mjs`; salida 0.
- [x] D2, `tools/resolver/windows.mjs`: recorrer local > proyecto > usuario; en cada archivo `modelSettings[<modelo>].autoCompactWindow` y, si falta, `autoCompactWindow`; gana el primer archivo con valor. `<modelo>` = `deps.modeloDe(...)` del agente en `claude-code`; vía `modelSettings.<modelo>`. Avisar solo si alguna entrada de `modelSettings` tiene `autoCompactWindow`, nombrando modelo y archivo. Entorno y lanzador siguen por encima. Check: `node --check tools/resolver/windows.mjs`; salida 0.
- [x] D3, `./README.md`: en «Ventanas de compactación», añadir la tabla de `plan.md` «Ventanas», la regla `ventana >= piso medido + 33000 + margen de al menos 100000`, qué celdas quedan bajo el margen y la precedencia corregida. Check: `git diff --check -- README.md`; salida 0.
- [x] `tests/compaction/windows.test.mjs`: cambiar el fixture de `modelSettings` al formato por modelo; casos: sin `autoCompactWindow` no avisa; valor por modelo gana en su archivo; local `autoCompactWindow` gana a `modelSettings` del usuario; fila `claude-builder` 200000; filas `sesión`. Check: `node --test tests/compaction/windows.test.mjs`; salida 0.

Correcciones (segunda revisión RETURNED 2026-11-25):
- [x] E1, `tools/resolver/windows.mjs`: las filas `claude-planner` y `claude-builder` muestran la ventana efectiva con lanzador (`nivelesDe("<agente>", true)[0]`: entorno > bloque `env` > lanzador), conservando la vía `claude-<agente>` y solo si el lanzador tiene `--autocompact`; quitar `deLanzador`. Check: `node --check tools/resolver/windows.mjs`; salida 0.
- [x] Menores, `tools/resolver/windows.mjs`: la vía de la línea ~78 es `modelSettings.<modelo>` (con el modelo real); el comentario ~63–65 dice: entorno, bloque `env`, lanzador y luego por archivo (local > proyecto > usuario), en cada uno `modelSettings.<modelo>` antes que `autoCompactWindow`. Check: `node --check tools/resolver/windows.mjs`; salida 0.
- [x] `tests/compaction/windows.test.mjs`: con lanzador 300000 y entorno 133000, las filas `claude-planner` y `claude-builder` muestran 133000, 100000, origen entorno (planner `AVISO`); igual con bloque `env`; la vía por modelo nombra el modelo. Las aserciones nuevas fallan sin E1. Check: `node --test tests/compaction/windows.test.mjs`; salida 0.
- [x] E2, `./README.md` línea 36: quitar la referencia a `changes/ventana-por-agente/plan.md`, sin otro cambio. Check: `grep -c 'changes/ventana-por-agente' README.md`; imprime 0.

Segment verification: `node --test tests/compaction/windows.test.mjs` — level 1; exit 0; covers A9.
Handoff: Ejemplo: Codex planner 200000 − 102971 = 97029 → `AVISO`. No leas `auth.json`. No se leen ajustes de proyecto de Codex ni de Pi: dilo en el README.

## Evidence

- Paso 1 (`tools/resolver/windows.mjs`): `$ node --check tools/resolver/windows.mjs` → salida 0.
- Paso 2 (`scripts/resolver.mjs`): `$ node --check scripts/resolver.mjs` → salida 0. Uso con opción: `$ node scripts/resolver.mjs ventanas --x` → sale 2 con `uso: resolver.mjs ventanas [proyecto…]; sin opciones`.
- Paso 3 (README): `$ git diff --check -- README.md scripts/resolver.mjs` → salida 0. Sección «Ventanas de compactación» añadida; no había menciones a 133000 en `README.md` ni en `docs/guide.md` (`grep`, sin coincidencias).
- Paso 4 (`tests/compaction/windows.test.mjs`): `$ node --test tests/compaction/windows.test.mjs` → exit 0, 13 pruebas pasan, 0 fallan, 1 s con HOME temporal. Cubre Claude planner OK (disparo 267000), Codex planner AVISO (200000 − 102971 = 97029), Pi planner AVISO (180000 − 102971 = 77029), cada aviso (env, modelSettings, CLAUDE_AUTOCOMPACT_PCT_OVERRIDE, planner/revisor sin fijar, margen), el secreto de prueba fuera de stdout y stderr, salida 0 sin avisos y uso 2.
- Comprobación de mutación (no es paso del plan): al quitar el aviso de variable de entorno en `windows.mjs`, fallan 3 pruebas (exit 1); archivo restaurado y comparado byte a byte.
- Correcciones D1 y D2 (2026-11-25): `$ node --check tools/resolver/windows.mjs` → exit 0. `$ node --test tests/compaction/windows.test.mjs > "$TMPDIR/windows-test.log"` → exit 0, `ℹ tests 19`, `ℹ pass 19`, `ℹ fail 0`. Pruebas nuevas por nombre: «sin autoCompactWindow no avisa…», «autoCompactWindow por modelo fija la sesión planner en su archivo», «autoCompactWindow local gana a modelSettings del usuario», «fila claude-builder con su lanzador 200000 da disparo 167000», «con lanzador y ajustes, el planner muestra fila lanzador y fila sesión», «sesión sin fijar no avisa si el lanzador del planner fija la ventana», y «modelSettings.<modelo>.autoCompactWindow … avisa nombrando modelo y archivo».
- D3 (2026-11-25): `$ git diff --check -- README.md` → exit 0. Tabla de ventanas, regla `ventana >= piso + 33000 + 100000` y celdas bajo margen añadidas a «Ventanas de compactación»; precedencia por archivo corregida.
- Segunda revisión (2026-11-25, relanzamiento 2 de 2):
  - E1: `$ node --check tools/resolver/windows.mjs` → exit 0. Las filas `claude-planner` y `claude-builder` usan `nivelesDe(<agente>, true)[0]` (entorno, bloque env, lanzador). Pruebas nuevas en «ventanas: entorno y bloque env ganan al lanzador (E1)»: entorno 133000 da `133000 100000 variable de entorno 102971 AVISO`; bloque env da origen del archivo; builder con entorno da 133000.
  - Mutación de E1 (las filas `claude-*` vuelven a leer solo el lanzador, en copia de trabajo): `node --test tests/compaction/windows.test.mjs` → exit 1, 3 fallan. Archivo restaurado y comparado con `cmp`.
  - Menores: `modelSettings.${modelo}` como vía del nivel; comentario de precedencia reescrito. La vía del nivel no se imprime (la columna «vía» muestra `sesión`); la prueba «modelSettings con la clave del planner…» comprueba la clave del modelo.
  - E2: `$ grep -c 'changes/ventana-por-agente' README.md` → `0` (sin otro cambio en la línea 36).
  - Pruebas: `$ node --test tests/compaction/windows.test.mjs` → exit 0, `ℹ tests 23`, `ℹ pass 23`, `ℹ fail 0`.

## Notes
