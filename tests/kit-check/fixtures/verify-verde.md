---
status: approved
repos: [.]
segment: 1
continuity: continuous
type: code
---
# Plan sintético: verify verde con un criterio incumplido

## Steps

### Segment 1 — Story: verify verde y un A# incumplido

Acceptance:
- A1: el paso de verify sale 0; check with `node -e "process.exit(0)"`; expect exit 0.
- A2: el criterio de historia incumple; check with `node -e "process.exit(1)"`; expect exit 0.
