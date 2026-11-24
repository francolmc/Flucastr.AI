---
status: approved
repos: [.]
segment: 1
continuity: continuous
type: code
---
# Plan sintético rojo

## Steps

### Segment 1 — Story: un criterio incumplido

Acceptance:
- A1: el proceso sale 0; check with `node -e "process.exit(0)"`; expect exit 0.
- A2: el proceso debe salir 0 pero sale 2; check with `node -e "process.exit(2)"`; expect exit 0.
