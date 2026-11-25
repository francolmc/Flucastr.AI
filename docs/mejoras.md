# Mejoras de verificación (Flucastr.AI)

Comparado con `core/contracts/verification.md` el 2026-11-14. Stack: bash + Node ESM, sin `package.json`. Nada de esto bloquea.

| Capacidad | Estado | Costo hoy | Evidencia |
|---|---|---|---|
| Rápida | falta (la cubre `./verify`) | 32 s por corrida completa, también para un cambio de texto | `time ./verify` = 32 s, rc=0 |
| Servicio | no aplica | sin servicios | sin dependencias externas |
| Aceptación | parcial: `node --test tests/acceptance/*.test.mjs` cubre 3 flujos; los 19 pasos de `./verify` siguen cortando al primer fallo | resumen de todos los fallos solo en esos 3 flujos | changes/done/aceptacion |
| Evidencia | ok: `resultado.json` escrito por `./verify` y leído por `kit-verificado`; falta medir corridas evitadas | nadie puede saber si lo ya verificado cambió | sin `resultado.json` ni fingerprint; `changes/proceso-rapido` pide evitar repetir corridas |

## Anotadas
