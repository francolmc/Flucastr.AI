# Tramo 4 — Desinstalación con nombres ingleses

## Pasos

### Tramo 4 — Historia: desinstalar con opciones inglesas

Como persona que usa el kit quiero desinstalarlo con comandos ingleses y conservar mis automatizaciones existentes para que el kit sea reutilizable.

Dependencias: Tramo 3, para conservar el flujo de reinstalación que invoca el desinstalador.

Contratos a conservar: `desinstalar.sh` y sus opciones, configuración preservada por defecto, `--todo`, reglas de proyecto, códigos de salida y mensajes españoles. Las pruebas usan directorios temporales aislados, nunca instalaciones reales.

Rutas susceptibles de cambio: se agrega `uninstall.sh`; `desinstalar.sh` mantiene su ruta; las pruebas no se mueven.

Ejemplo concreto del resultado esperado: `bash uninstall.sh --dry-run --project '/tmp/mi proyecto'` equivale al comando español con `--simular --proyecto`.

Alcance: `desinstalar.sh`, `uninstall.sh` y pruebas de instalación y desinstalación en `tools/verify/`.

Archivos: desinstalar.sh, uninstall.sh

CUANDO se usan las opciones inglesas de desinstalación ENTONCES su resultado, efectos y errores equivalen a las españolas y los mensajes permanecen en español (A4).

Aceptación:
- A4: casos aislados comparan cada par `--dry-run`/`--simular`, `--project`/`--proyecto`, `--quiet`/`--silencioso`, `--all`/`--todo`, `--keep-settings`/`--conservar-ajustes`, combinaciones y valores ausentes. Esperar igualdad de código, salida y árbol resultante; `./verify` pasa.

TODO:
- [x] Añadir los alias ingleses en `./desinstalar.sh` (A4). Comprobación: comparar cada par sobre directorios temporales; esperar mismos efectos y errores.
- [x] Crear `./uninstall.sh` como envoltorio que transmite argumentos y código de salida (A4). Comprobación: ejecutar ambas rutas con espacio en el proyecto; esperar equivalencia.
- [x] Ampliar `tools/verify/install-simulation.sh` con casos de equivalencia y error de desinstalación (A4). Comprobación: `./verify`; esperar casos no vacíos y fallo al desactivar temporalmente un alias.

Verificación del tramo: `./verify` — nivel 2 por falta de comprobación rápida declarada; exit 0, cubre A4.

Handoff: conservar el uso interno de `--silencioso --conservar-ajustes` por el instalador. Registrar la mutación aislada que comprueba sensibilidad.

## Evidencia

- `./verify`: `ok 5d: equivalencia de desinstalación, errores y mutación aislada`; `VERIFY OK`; exit 0. Las pruebas recrean instalaciones temporales y comparan salida, estado y árbol, además de comprobar que la simulación no escribe.

## Notas

- Revisión independiente: A4 cumplido; `./verify` terminó con VERIFY OK y exit 0. Veredicto: APROBADO.
