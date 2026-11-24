---
status: approved
repos: [.]
segment: 1
continuity: continuous
type: code
---
# Plan sintético: typecheck rojo con tramo verde

## Steps

### Segment 1 — Story: tramo verde

Acceptance:
- A1: el tramo verde sale 0; check with `node -e "process.exit(0)"`; expect exit 0.

### Segment 2 — Story: typecheck rojo

Acceptance:
- A2: typecheck del tramo 2 pasa; check with `node -e "process.exit(1)"`; expect exit 0.
