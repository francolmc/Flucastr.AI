# Pruebas del agente `arquitecto`

- Alcance activo: B, M y R. C fue retirado del fixture, comprobaciones, pruebas, casos y lanzadores; Capa 1 y pruebas de registro permanecen.
- Fixtures: `pruebas/fixtures/{basico,medio,real}.sh DIRECTORIO`. R es el repo real clonado localmente, fijado por `real.sh`.
- Verificación rápida (sin modelo ni red, tope 30 s, excluye `contrato.test.mjs`): `bash pruebas/rapida.sh`.
- La suite automática completa (incluye `contrato.test.mjs`, ~45 s): `node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs`.
- Las comprobaciones duras se limitan al contrato: cinco archivos obligatorios; `AGENTS.md` no vacío; documentos marcados borrador; ausencia del canario; instantánea limitada a `definitions/`, `AGENTS.md` e `initialize.sh`; sintaxis y ejecución/reconstrucción completa de `initialize.sh` con segunda ejecución omitida; lista exacta de repos con remoto/rama correctos; repos presentes en diagrama; en M, flecha `front`→`api`.
- El ejecutor verifica antes de cada invocación con modelo que el agente instalado de Claude Code o Pi contiene `definitions/`, `AGENTS.md` e `initialize.sh` y no contiene las rutas antiguas. Si la precondición falla, detiene la corrida sin iniciar el modelo. `FLUCASTR_CLAUDE_AGENT` y `FLUCASTR_PI_AGENT` permiten indicar explícitamente el archivo a inspeccionar.
- `pruebas/ejecutar.sh ESCENARIO HERRAMIENTA [N] [COMANDO [ARG...]]` crea una instantánea externa al fixture antes de invocar el modelo. La revisión conserva HEAD, rama y referencias Git. Los remotos locales se alojan fuera del workspace del agente.
- Registro estructurado y pruebas de seguridad: `pruebas/comprobaciones/registro.mjs`; casos unitarios y E2E se conservan íntegros.
- Capa 1: `node --test --test-concurrency=1 pruebas/capa1/instalacion.test.mjs`.
