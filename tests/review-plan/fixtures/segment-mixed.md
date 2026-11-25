# Feature con dos unidades

## Scope
Solo los archivos declarados por historia.

## Steps
### Segment 1 — Story: guardar y exportar el cambio
As a user I want to save and export the change so that I keep my work.
Dependencies: none.
Scope: `src/save.js`, `src/export.js`.
Files: `src/save.js`, `src/export.js`
WHEN I save the change THEN it is kept (A1), and WHEN I export it THEN it is readable (A2).
Acceptance:
- A1: the change is saved; check that it can be read back.
- A2: the export is readable; check that it opens.
TODO:
- [ ] Update `src/save.js` (A1). Check: `node --check src/save.js`; exit 0.
- [ ] Update `src/export.js` (A2). Check: `node --check src/export.js`; exit 0.
Segment verification: `node --test tests/feature.test.mjs` — level 1; exit 0; covers A1 and A2.
Handoff: use the agreed base and return the evidence for A1 and A2.
