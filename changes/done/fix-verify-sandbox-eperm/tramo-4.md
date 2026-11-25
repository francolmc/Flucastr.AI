---
segment: 4
---
# Segment 4

Plan: [plan.md](plan.md)

## Steps

### Segment 4 — Story: skill `diagnose` instalable
As usuaria de otros proyectos I want que la huella de `diagnose` no use stdin pipe so that corra en Codex sin importar `tools/`.
Dependencies: Not applicable (no importa el helper: la skill se copia a otros proyectos).
Contracts to keep: `core/skills/diagnose/fingerprint.mjs` sigue autocontenido (sin `import` fuera de la skill).
Paths likely to change: `core/skills/diagnose/fingerprint.mjs`.
Concrete example of the expected result: `execFileSync('git', [...], { ...opts, stdio: ['ignore','pipe','pipe'] })`.
Scope: `core/skills/diagnose/fingerprint.mjs`
Files: core/skills/diagnose/fingerprint.mjs
WHEN diagnose calcula la huella THEN los 3 `execFileSync` de git llevan stdin `ignore` (A6)
Acceptance:
- A6: huella idéntica a antes; check with `node --test tests/diagnosis-suggests/*.test.mjs`; expect exit 0.
TODO:
- [x] En `core/skills/diagnose/fingerprint.mjs` añadir `stdio: ['ignore','pipe','pipe']` a las opciones compartidas `opts` de la línea ~29 y a las llamadas de ~31 y ~34 (A6). Check: `node --test tests/diagnosis-suggests/*.test.mjs`; expect exit 0.
Segment verification: `node --test tests/diagnosis-suggests/*.test.mjs` — level 1; exit 0; covers A6.
Handoff: un `stdio` de `execFileSync` con stderr `pipe` no imprime en pantalla; si antes el stderr se heredaba, mantener el comportamiento visible.

## Evidence
$ node --test tests/diagnosis-suggests/*.test.mjs
```
✔ the contract and diagnostic exclude tracked edits and new files under changes/ (264.282116ms)
✔ a repository without HEAD keeps the status-only fingerprint behavior (295.752996ms)
✔ a resultado.json written with the legacy key is still read (118.569423ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
ℹ duration_ms 754.526003
```
exit 0

$ node --check core/skills/diagnose/fingerprint.mjs
exit 0

Diff (1 línea): `core/skills/diagnose/fingerprint.mjs` línea 26: `stdio: ['ignore', 'pipe', 'ignore']` → `stdio: ['ignore', 'pipe', 'pipe']`. El stdin ya era `ignore`; el stderr pasa de `ignore` a `pipe` (no imprime en pantalla, igual que antes). No hay `import` nuevo; la skill sigue autocontenida. Duración previa medida ≈0.6 s; tope 2x no se alcanzó.
