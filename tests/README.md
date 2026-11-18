# Pruebas del kit

Este índice mantiene visible qué comprueba cada suite, cómo ejecutarla y dónde viven sus datos. Todas las suites y sus fixtures viven bajo `tests/`; algunas pruebas localizan recursos relativos a su directorio, por eso las rutas de cada carpeta importan. Los tres flujos de aceptación viven en `tests/acceptance/`; cada uno envuelve la suite de `tests/` que le corresponde.

## Flujos de aceptación

Ejecutar todos los flujos, una sola vez cada uno:

```sh
node --test tests/acceptance/*.test.mjs
```

| Flujo y entrada nueva | Suite ejercitada | Comando directo | Datos y motivo de la ruta |
| --- |
| [builder-contract](acceptance/builder-contract.test.mjs) | `tests/builder-contract.mjs` | `node tests/builder-contract.mjs` | Lee los contratos vigentes del builder y del planificador; crea casos temporales. |
| [kit-run](acceptance/kit-run.test.mjs) | `tests/kit-run/run.mjs` | `node tests/kit-run/run.mjs` | Cada caso prepara un repo Git temporal y ejecutables simulados; no usa CLIs reales. |
| [uso](acceptance/usage.test.mjs) | `tests/usage/run.mjs` | `node tests/usage/run.mjs` | Usa fixtures sintéticos locales de Claude Code, Codex y Pi, incluidos casos de cuota y sesiones; los datos de fixture no se copian. La suite acepta rutas alternativas para sus pruebas de sensibilidad. |

Para filtrar un flujo: `node --test --test-name-pattern=uso tests/acceptance/` (sustituir `uso` por `kit-run` o `builder-contract`).

## Otras suites vigentes

| Suite | Comando | Fixtures o preparación | Notas de ubicación |
| --- |
| `tests/diagnosis-suggests/fingerprint.test.mjs` | `node --test tests/diagnosis-suggests/fingerprint.test.mjs` | Construye repositorios Git temporales y compara la fingerprint del diagnóstico con la referencia local (`fingerprint-reference.mjs`). | Está acoplada a la referencia y a los recursos del diagnóstico en su carpeta. |
| `tests/permissions-contract/structure.test.mjs`, `generation.test.mjs`, `hook.test.mjs` | `node --test tests/permissions-contract/*.test.mjs` | Genera proyectos temporales, reglas y hooks; usa ejecutables simulados donde corresponde. | Resuelven el kit desde la ubicación de `tests/`. |
| `tests/permissions-v2.test.mjs` | `node --test tests/permissions-v2.test.mjs` | Crea un proyecto ficticio temporal con archivos señuelo y comprueba instalar/desinstalar. | Suite del flujo de permisos v2. |
| `tests/review-plan/review-plan.test.mjs` | `node --test tests/review-plan/review-plan.test.mjs` | Usa planes de prueba generados y fixtures estáticos de `tests/review-plan/fixtures/`. | El script y la suite comparten fixtures por ruta relativa. |
| `tests/builder-contract.mjs` | `node tests/builder-contract.mjs` | Lee skills y contratos vigentes; crea casos temporales. | Suite real llamada por el flujo de aceptación. |
| `tests/kit-run/run.mjs` | `node tests/kit-run/run.mjs` | Repositorios temporales, datos de plan sintéticos y ejecutables falsos. | Suite real llamada por el flujo de aceptación; mantiene junto el arnés y sus referencias. |
| `tests/usage/run.mjs` | `node tests/usage/run.mjs` | Fixtures sintéticos de las fuentes de uso en `tests/usage/fixtures/`; se consumen desde esa carpeta y no se copian. | Suite real llamada por el flujo de aceptación; sus fixtures y modos de sensibilidad comparten esta ruta. |

Los archivos de `tests/acceptance/` son envoltorios de los tres flujos, no suites adicionales: cada uno ejecuta la suite de `tests/` que le corresponde. Por eso el comando de aceptación descubre exactamente tres pruebas y no ejecuta los flujos dos veces.
