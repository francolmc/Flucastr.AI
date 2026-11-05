# task-01 — Medición: script `contexto-fuentes.mjs` y tabla `medicion.md`
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
F43 audita qué contexto carga cada rol. Esta tarea crea la herramienta de medición (solo lectura, sin modelo ni red) que agrega, por fuente y por rol, los KB leídos en los logs de sesión, la corre sobre un log real de Claude Code y guarda la tabla en `medicion.md`. No cambia ninguna regla, prompt, skill ni agente.

## Contexto
- Leer: `definitions/F43-AUDITORIA.md@5-19`, `scripts/consumo.mjs@340-33`, `scripts/consumo.mjs@670-26`, `pruebas/comprobaciones/consumo-fixtures.mjs@56-67`
- Tocar: `scripts/contexto-fuentes.mjs`, `pruebas/comprobaciones/contexto-fuentes.test.mjs`, `features/F43-auditoria-contexto/medicion.md`
- `scripts/consumo.mjs` (40067 bytes) exporta `descubrirSesiones(raiz)`; cada sesión trae `lecturas.porArchivo` (rol coordinador) y `subagentes.porRol[rol].porArchivo`, ambos como `{ ruta: { lecturas, kb } }` con `kb` en KB redondeado a 1 decimal (*confirmado* leyendo el código).
- Convención del repo: módulos ESM `.mjs` sin dependencias, comentario de uso en la cabecera, pruebas con `node:test`. Ejemplo de fixtures: `pruebas/comprobaciones/consumo-fixtures.mjs`.
- Los logs reales de Claude Code están en `~/.claude/projects/-Users-franco-Codes-flucastr-Flucastr-AI` (*confirmado*: existe).
- Fuente: definitions/F43-AUDITORIA.md «1. Qué se mide y cómo»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- CLI: `node scripts/contexto-fuentes.mjs --raiz <carpeta de logs> [--repo <carpeta>] [--json]`; `--repo` vale el directorio actual por defecto y es donde se miden `agentes/*.md` y `skills/*/SKILL.md`.
- Exporta `agregarFuentes(sesiones, { repo })` (devuelve filas `{ fuente, categoria, kbUnico, veces, kbTotales, rol }`) y `formatearTabla(filas)`. Reutiliza `descubrirSesiones` de `scripts/consumo.mjs`; no se modifica `consumo.mjs`.
- Unidad en KB (no bytes): `consumo.mjs` ya entrega KB; `kbUnico` = `kbTotales / veces` con 1 decimal; el desvío frente a «bytes» del diseño queda anotado en *Notas* de `medicion.md`.
- Categorías por ruta leída: `skill` (`skills/*/SKILL.md`), `definicion` (`definitions/`), `status` (`STATUS.md`), `tarea` (`features/`), `otro`. Además, una fila `prompt` por rol con el tamaño de `agentes/<rol>.md` en KB (fs) y `veces` igual a las corridas del rol; el coordinador usa `agentes/coordinador.md`.
- Un dato que el log no trae se escribe `n/d`; no se estima. Las llamadas `Skill` de Claude Code no aparecen como lecturas: se documenta en *Notas* como límite (`n/d`).
- Tabla de texto: cabecera exacta `| fuente | KB único | veces leída | KB totales | rol |`, ordenada por KB totales descendente; después `Top 10` con las 10 primeras. La salida de texto pesa ≤4096 bytes.
- Topes: script ≤12288 bytes, prueba ≤8192 bytes.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: el script, su prueba con logs sintéticos y la tabla real.
Fuera de alcance: modificar `scripts/consumo.mjs`, el análisis de la tabla (task-02), la columna «¿su prompt dice que la necesita?», caché, agentes, skills, topes de bytes, el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Crea `scripts/contexto-fuentes.mjs` con `agregarFuentes`, `formatearTabla` y la CLI (incluye `--json`). Resultado: `node scripts/contexto-fuentes.mjs --raiz <carpeta vacía>` termina en 0 con solo la cabecera.
3. Crea `pruebas/comprobaciones/contexto-fuentes.test.mjs` con logs sintéticos de `consumo-fixtures.mjs`: una ruta leída dos veces suma `veces` 2; las categorías se asignan; un dato ausente da `n/d`.
4. Corre la CLI sobre la carpeta de logs real de Claude Code y guarda la salida de texto en `features/F43-auditoria-contexto/medicion.md` bajo `## Tabla`, más `## Notas` con el límite de las llamadas `Skill` y el desvío a KB.
5. Corre la verificación y copia la salida real en *Evidencia*.

## Criterios de aceptación
1. Rama `chore/F43-auditoria-contexto` (comando 1).
2. La prueba nueva termina con `fail 0` (comando 2).
3. El script pesa ≤12288 bytes y la prueba ≤8192 (comando 3).
4. `medicion.md` contiene la cabecera de la tabla una vez (comando 4).
5. `scripts/consumo.mjs` no cambió (comando 5).

## Verificación
```
git branch --show-current
node --test pruebas/comprobaciones/contexto-fuentes.test.mjs
wc -c scripts/contexto-fuentes.mjs pruebas/comprobaciones/contexto-fuentes.test.mjs
grep -c '| fuente | KB único | veces leída | KB totales | rol |' features/F43-auditoria-contexto/medicion.md
git diff --stat -- scripts/consumo.mjs
```
Esperado: rama `chore/F43-auditoria-contexto`; `fail 0`; dos tamaños, el primero ≤12288 y el segundo ≤8192; `1`; salida vacía.

## Evidencia

```text
$ git branch --show-current
chore/F43-auditoria-contexto
exit 0

$ node --test pruebas/comprobaciones/contexto-fuentes.test.mjs
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 166.139792
exit 0

$ wc -c scripts/contexto-fuentes.mjs pruebas/comprobaciones/contexto-fuentes.test.mjs
    6659 scripts/contexto-fuentes.mjs
    4912 pruebas/comprobaciones/contexto-fuentes.test.mjs
   11571 total
exit 0

$ grep -c '| fuente | KB único | veces leída | KB totales | rol |' features/F43-auditoria-contexto/medicion.md
1
exit 0

$ git diff --stat -- scripts/consumo.mjs
exit 0
```

Criterios: 1 rama `chore/F43-auditoria-contexto` (comando 1); 2 `fail 0` (comando 2); 3 script 6659 ≤ 12288 y prueba 4912 ≤ 8192 (comando 3); 4 cabecera una vez en `medicion.md` (comando 4); 5 `scripts/consumo.mjs` sin cambios (comando 5).

## Notas

- Rama de partida: `main`. La rama `chore/F43-auditoria-contexto` no existía; se creó con `git switch -c` desde `main`. No se hizo commit.
- Huecos menores: (a) formato del «Top 10» libre (lista numerada, sin repetir la cabecera); (b) la salida de texto se recorta a 4096 bytes: `medicion.md` muestra 34 de 658 filas y la tabla completa sale con `--json`; (c) la *Contexto* cita `scripts/consumo.mjs@340-33` y `@670-26` con rangos mal escritos: se leyeron `descubrirSesiones` y la forma de sesión por búsqueda; (d) la fila `agentes/<rol>.md` mide el tamaño actual del archivo y da `n/d` si falta; (e) los roles se toman tal cual del log (`desconocido` incluido).
- La CLI sobre la carpeta real (29 sesiones) terminó en 0; su salida está en `medicion.md` bajo `## Tabla`, con las *Notas* de límites (`Skill` no visible, unidad KB).
- La segunda ejecución de `node --test` (misma orden) se hizo solo para capturar el código de salida en un archivo; resultado idéntico, 7/7.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=5; resultado=lista; causa=ninguna
