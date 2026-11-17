# Tramo 55 — Separar construcción del comando (borrador)

## Pasos

### Tramo 55 — Historia: Separar construcción del comando
Como mantenedor quiero separar construcción del comando para mantener el recorrido real de `kit run` sin alterar su comportamiento.
Dependencias: tramo 54 revisado; Node y aislamiento del tramo 1. Contratos: conservar el entrypoint `scripts/kit-run.mjs`, su raíz calculada allí, interfaz, secuencia, argumentos, salidas, códigos y efectos; no usar modelos, proyectos reales ni secretos. Ejemplo: un ejecutable sustituto recibe el mismo prompt y produce el mismo estado del plan que antes.
Alcance: `scripts/kit-run.mjs` y `tools/run/commands.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/kit-run.mjs` y `tools/run/commands.mjs`.
CUANDO se ejecute `kit run` en los escenarios caracterizados ENTONCES separar construcción del comando conserva los resultados originales (A55).
Aceptación A55: la responsabilidad indicada queda aislada o caracterizada; la matriz del tramo 48 coincide en código, stdout, stderr, procesos y archivos; no se debilitan pruebas existentes.
TODO:
- [x] En `scripts/kit-run.mjs`, Extraer `comando` inyectando funciones de perfiles cuando sean necesarias; preservar reemplazos KIT_RUN, argumentos, sandbox, schema, esfuerzo y rechazo actual de herramientas sin mapear. (A55). Comprobación: revisar diff y registrar contratos y rutas.
- [x] En `cambios/estructura-repo/tramo-48.md`, Comparar argv y entorno de constructor y revisor para Codex y sustitutos Claude/Pi, incluido error sin sustituto. (A55). Comprobación: registrar resultados y esperar equivalencia con referencia del tramo 48.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A55). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A55). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- `$ node --check scripts/kit-run.mjs && node --check tools/run/commands.mjs && git diff --check -- scripts/kit-run.mjs tools/run/commands.mjs`: sintaxis y whitespace correctos, `exit 0`. La matriz `node cambios/estructura-repo/capturar-kit-run.mjs` permanece idéntica a la referencia previa en los ocho escenarios (`cmp`, SHA-256 `ad037ecc589be5e2e5c62ff358015a28ec70a79e509c1151169ccbaa8ac104e4`). `crearComando` en `tools/run/commands.mjs` recibe los dos resolutores; el entrypoint conserva la raíz e invoca la factoría. Diff confirma que los arrays y la selección condicional trasladados conservan orden, `KIT_RUN_*`, sandbox, schema, perfiles/esfuerzo y error para herramienta sin mapear.
- Fixture sintético inline: Codex constructor/revisor produjo `exec`, `workspace-write`/`read-only`, modelo/esfuerzo, `-C` y `--output-schema` esperados; sustitutos Claude/Pi para ambos roles conservaron ejecutable y argv de `KIT_RUN_*`; sin sustituto Claude/Pi se conservaron los mensajes de error por rol. Sin ejecutar herramientas reales.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: código 0 en 52.7 s. `./verify` aislado coincide salvo el mensaje exacto autorizado del escenario 9; `bash ./instalar.sh --simular` aislado coincide en dos ejecuciones byte por byte con la línea base. La primera ejecución detectó que una aserción de `pruebas/permisos-v2.test.mjs` esperaba el literal dentro del entrypoint; se actualizó para comprobarlo en el nuevo módulo sin relajar la exigencia, y la repetición completa pasó.
