---
status: approved
repos: [.]
segment: 1
continuity: continuous
type: code
---
# Plan sintético con acciones bloqueadas

## Steps

### Segment 1 — Story: acciones que no deben ejecutarse

Acceptance:
- A1: commit protegido; check with `git commit -m x`; expect exit 0.
- A2: operador de shell fuera de comillas; check with `node -e "require('fs').writeFileSync('testigo-operador.txt', 'x')" | cat`; expect exit 0.
