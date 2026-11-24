---
status: approved
repos: [.]
segment: 1
continuity: continuous
type: code
---
# Plan sintético verde

## Steps

### Segment 1 — Story: código de salida y salida visible

Acceptance:
- A1: el proceso sale 0; check with `node -e "process.exit(0)"`; expect exit 0.
- A2: la salida incluye listo; check with `node -e "console.log('listo')"`; expect contiene «listo».
