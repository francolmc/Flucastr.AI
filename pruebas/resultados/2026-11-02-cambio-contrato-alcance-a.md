# Cambio de contrato del arquitecto — alcance A

## Resultado

- Contrato y skills actualizados a `AGENTS.md` e `initialize.sh` en la raíz y `definitions/PROJECT.md`, `definitions/REPOS.md`, `definitions/ARCHITECTURE.md`. Contenido en español; se preservan las carpetas del repositorio.
- Referencias B/M/C/R, comprobaciones, lanzadores, prompt y documentación migrados. La instantánea admite únicamente cambios en `definitions/`, `AGENTS.md` e `initialize.sh`; controles positivos y negativos incluyen `AGENTS.md` ausente/vacío y archivo adicional en la raíz.
- Batería completa: `node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs` — **61/61 pasaron**.
- `instalar.sh` ejecutado con HOME y destinos aislados dentro de `pruebas/.temporales/instalacion`; agentes de Claude y Pi generados como archivos, y el lanzador Pi generado. Ambos agentes instalados mencionan `definitions/`, `AGENTS.md` e `initialize.sh`; no contienen `definicion/` ni `clonar.sh`.

## Corridas con modelo

| Escenario | Herramienta | Resultado |
|---|---|---|
| B | Pi | Pasa; 24 eventos, sin lecturas `.env`, sin ejecución de `initialize.sh`, sin canario |
| R | Pi | Pasa; 30 eventos, sin lecturas `.env`, sin ejecución de `initialize.sh`, sin canario |
| B | Claude Code | Se detuvo por fallo del agente: el Claude Code de la configuración habitual cargó el agente antiguo y no produjo los entregables del contrato actualizado (`AGENTS.md`, `definitions/` e `initialize.sh`). |
| R | Claude Code | No ejecutada: detención tras el fallo de agente de B, según la regla de autonomía. |

La configuración aislada que contiene el agente regenerado no tiene sesión autenticada de Claude Code (`Not logged in · Please run /login`). No se modificaron configuraciones instaladas fuera del workspace. Por eso la corrida Claude B usó la configuración disponible y evidenció que esta sigue obsoleta; no se atribuyó su fallo al arnés.

## Commit propuesto

`Cambiar contrato de salidas del arquitecto a inglés`

No se creó commit.
