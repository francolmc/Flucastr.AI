# Mejoras de verificación (Flucastr.AI)

Comparado con `nucleo/contrato/verificacion.md` el 2026-11-14. Stack: bash + Node ESM, sin `package.json`. Nada de esto bloquea.

| Capacidad | Estado | Costo hoy | Evidencia |
|---|---|---|---|
| Rápida | falta (la cubre `./verify`) | 32 s por corrida completa, también para un cambio de texto | `time ./verify` = 32 s, rc=0 |
| Servicio | no aplica | sin servicios | sin dependencias externas |
| Aceptación | parcial: `node --test pruebas/aceptacion/*.test.mjs` cubre 3 flujos; los 19 pasos de `./verify` siguen cortando al primer fallo | resumen de todos los fallos solo en esos 3 flujos | cambios/hechos/aceptacion |
| Evidencia | falta | nadie puede saber si lo ya verificado cambió | sin `resultado.json` ni huella |

## Siguiente mejora
**Evidencia**: `resultado.json` con huella, para no repetir corridas ya verificadas. Tamaño: pequeño.

## Anotadas
