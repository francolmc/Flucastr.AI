# Tramo 7

## Steps

### Segment 7 — Story: tras compactar aparecen punteros al cambio activo
As user I want pointers after compaction so that the agent resumes from notes without rereading.
Dependencies: ninguna.
Contracts to keep: solo lectura; nunca imprime contenido de archivos; nunca bloquea (siempre exit 0).
Paths likely to change: `scripts/after-compact.mjs`.
Concrete example of the expected result: con `{"source":"compact","cwd":"<p>"}` imprime `Notes: changes/demo/notes.md`, `Segment: 2`, `Next action: changes/demo/notes.md:7 ("## Next action")`.
Scope: script nuevo y su prueba.
Files: scripts/after-compact.mjs, tests/after-compact/after-compact.test.mjs
WHEN la sesión arranca tras compactar con un cambio abierto THEN imprime hasta 20 líneas de punteros (A7)
Acceptance:
- A7: casos de la especificación del Handoff cubiertos por la prueba; check with `node --test tests/after-compact/after-compact.test.mjs`; expect pass.
TODO:
- [x] Crear `tests/after-compact/after-compact.test.mjs` con los casos del Handoff (A7). Check: `node --test tests/after-compact/after-compact.test.mjs`; expect rojo porque falta el script.
- [x] Crear `scripts/after-compact.mjs` según el Handoff (A7). Check: `node --test tests/after-compact/after-compact.test.mjs`; expect pass.
- [x] Corrección: añadir a `tests/after-compact/after-compact.test.mjs` un caso con `## Próxima acción` antigua seguida de `## Next action` (y el orden inverso): el puntero nombra la última cabecera del archivo; luego cambiar `lineaProximaAccion` en `scripts/after-compact.mjs` para devolver la última (A7). Check: `node --test tests/after-compact/after-compact.test.mjs`; expect rojo antes del cambio y pass después.
Segment verification: `node --test tests/after-compact/after-compact.test.mjs` — level 1; exit 0; covers A7.
Handoff: entrada: JSON opcional por stdin; `cwd` = `input.cwd` o `process.cwd()`; si `source` existe y no es `compact`, sin salida. Candidatos: `changes/*/plan.md` salvo `changes/done/`; prefiere el plan con `branch:` igual a la rama actual (usar `tools/spawn/sync-seguro.mjs`), si no el de `notes.md` o plan más reciente; agrega `Other active changes: N`. Líneas en inglés, máximo 20: encabezado; `Notes: <ruta>|none`; `Plan: <ruta> (status: <x>)`; `Segment: <n>` y ruta de `tramo-<n>.md` si existe; `Next action: <ruta>:<línea> ("<encabezado>")` para `## Next action` o `## Próxima acción`, o `Next action: not recorded`. Validar carpeta `^[a-z0-9][a-z0-9._-]*$`, status del conjunto permitido y segment numérico; lo inválido se omite. Casos: sin `changes/`; JSON inválido; `source: startup`; dos cambios; carpeta o status maliciosos; un marcador secreto en notes y plan que nunca sale; siempre exit 0.
