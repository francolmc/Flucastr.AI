# Pruebas del kit

Este índice mantiene visible qué comprueba cada suite, cómo ejecutarla y dónde viven sus datos. Las suites internas y sus fixtures siguen bajo `pruebas/`: sus rutas forman parte de los comandos existentes y varias pruebas localizan recursos relativos a su directorio. Los tres flujos de aceptación tienen entradas nuevas en `tests/acceptance/`; las rutas antiguas de `pruebas/aceptacion/` se conservan como compatibilidad y delegan en esas entradas.

## Flujos de aceptación

Ejecutar todos los flujos, una sola vez cada uno:

```sh
node --test pruebas/aceptacion/*.test.mjs
```

| Flujo y entrada nueva | Suite ejercitada | Comando directo | Datos y motivo de la ruta |
| --- | --- | --- | --- |
| [contrato-constructor](acceptance/contrato-constructor.test.mjs) | `pruebas/contrato-constructor.mjs` | `node pruebas/contrato-constructor.mjs` | Lee los contratos vigentes del constructor y del planificador; crea casos temporales. Se conserva la ruta porque el flujo histórico y el wrapper la usan. |
| [kit-run](acceptance/kit-run.test.mjs) | `pruebas/kit-run/probar.mjs` | `node pruebas/kit-run/probar.mjs` | Cada caso prepara un repo Git temporal y ejecutables simulados; no usa CLIs reales. Se conserva junto a su suite y los comandos existentes. |
| [uso](acceptance/uso.test.mjs) | `pruebas/uso/probar.mjs` | `node pruebas/uso/probar.mjs` | Usa fixtures sintéticos locales de Claude Code, Codex y Pi, incluidos casos de cuota y sesiones; no se trasladan ni copian los datos de fixture. La suite acepta rutas alternativas para sus pruebas de sensibilidad. |

Para filtrar un flujo: `node --test --test-name-pattern=uso pruebas/aceptacion/` (sustituir `uso` por `kit-run` o `contrato-constructor`).

## Otras suites vigentes

| Suite | Comando | Fixtures o preparación | Por qué permanece en `pruebas/` |
| --- | --- | --- | --- |
| `pruebas/diagnostico-sugiere/huella.test.mjs` | `node --test pruebas/diagnostico-sugiere/huella.test.mjs` | Construye repositorios Git temporales y compara la huella del diagnóstico con la referencia local. | Está acoplada a la referencia y a los recursos del diagnóstico en su carpeta actual. |
| `pruebas/permisos-contrato/estructura.test.mjs`, `generacion.test.mjs`, `hook.test.mjs` | `node --test pruebas/permisos-contrato/*.test.mjs` | Genera proyectos temporales, reglas y hooks; usa ejecutables simulados donde corresponde. | Las pruebas siguen el contrato de permisos y resuelven el kit desde la ubicación de `pruebas/`. |
| `pruebas/permisos-v2.test.mjs` | `node --test pruebas/permisos-v2.test.mjs` | Crea un proyecto ficticio temporal con archivos señuelo y comprueba instalar/desinstalar. | Es la suite existente del flujo de permisos v2; conserva su ruta de ejecución conocida. |
| `pruebas/revisar-plan/revisar-plan.test.mjs` | `node --test pruebas/revisar-plan/revisar-plan.test.mjs` | Usa planes de prueba generados y fixtures estáticos de `pruebas/revisar-plan/fixtures/`. | El script y la suite comparten fixtures por ruta relativa. |
| `pruebas/contrato-constructor.mjs` | `node pruebas/contrato-constructor.mjs` | Lee skills y contratos vigentes; crea casos temporales. | Es la suite real llamada por el flujo de aceptación y por la entrada compatible anterior. |
| `pruebas/kit-run/probar.mjs` | `node pruebas/kit-run/probar.mjs` | Repositorios temporales, datos de plan sintéticos y ejecutables falsos. | Es la suite real llamada por el flujo de aceptación; mantiene junto el arnés y sus referencias. |
| `pruebas/uso/probar.mjs` | `node pruebas/uso/probar.mjs` | Fixtures sintéticos de las fuentes de uso en `pruebas/uso/fixtures/`; se consumen desde esa carpeta y no se copian. | Es la suite real llamada por el flujo de aceptación; sus fixtures y modos de sensibilidad comparten esta ruta. |

Los archivos bajo `pruebas/aceptacion/` son entradas de compatibilidad, no suites adicionales: cada uno importa la entrada correspondiente de `tests/acceptance/`. Por eso el comando de aceptación descubre exactamente tres pruebas y no ejecuta los flujos dos veces.
