# Tramo 3 — Instalación con nombres ingleses

## Pasos

### Tramo 3 — Historia: instalar con opciones inglesas

Como persona que instala el kit, quiero usar `install.sh` y opciones inglesas para trabajar con comandos uniformes sin romper automatizaciones existentes.

Dependencias: ninguna funcional; se ejecuta después del tramo 2 para mantener el orden del plan. Bash y Node disponibles.

Contratos a conservar: `instalar.sh` y sus opciones siguen funcionando; argumentos con espacios se transmiten sin cambios; combinaciones inválidas y valores faltantes siguen fallando; simulación no escribe; instalación real mantiene configuración, migración y códigos de salida; mensajes informativos en español.

Rutas susceptibles de cambio: `instalar.sh` conserva su ruta; se agrega `install.sh`; las pruebas existentes se actualizan sin moverlas.

Ejemplo concreto del resultado esperado: `bash install.sh --project '/tmp/mi proyecto' --agent constructor --dry-run` realiza la misma simulación que el comando español equivalente, sin escribir.

Alcance: `instalar.sh`, `install.sh` y pruebas de instalación y migración de `tools/verify/` y `pruebas/`.

Archivos: instalar.sh, install.sh

CUANDO se invoca el instalador con la interfaz inglesa ENTONCES se obtiene el mismo comportamiento que con la española, con mensajes en español (A3).

Aceptación:
- A3: pruebas en directorios temporales aislados comparan salida, estado y efectos para `--dry-run`, `--migrate`, `--copy`, `--only`, `--project`, `--agent`, `--project-skills` y sus alias españoles; incluyen opciones mezcladas, ruta con espacios, argumento ausente y combinaciones inválidas. Esperar equivalencia y `./verify` en verde.

TODO:
- [x] Añadir a `./instalar.sh` los alias ingleses definidos en el plan principal (A3). Comprobación: comparar cada par de opciones con pruebas aisladas; esperar mismos resultados y errores.
- [x] Crear `./install.sh` como punto de entrada que reenvía todos los argumentos y código de salida a `instalar.sh` (A3). Comprobación: ejecutar ambos con `--dry-run` y argumentos con espacios en entorno temporal; esperar comportamiento equivalente.
- [x] Ampliar `tools/verify/install-simulation.sh` con pares, mezclas y errores (A3). Comprobación: `./verify`; esperar que los casos sean no vacíos y pasen, y que una mutación aislada que rompa un alias haga fallar la prueba.

Verificación del tramo: `./verify` — nivel 2, por ausencia de comprobación rápida declarada; exit 0, cubre A3.

Handoff: usar directorios temporales bajo control de la prueba y no modificar instalaciones reales; no introducir una traducción de mensajes de salida.

## Evidencia

- `$ ./verify`: `ok 5c: alias, mezclas, instalación, migración, errores y mutación aislada`; `VERIFY OK`; exit 0. La comparación comprueba salida, código y efectos; la simulación deja intactos el HOME y proyecto temporales. La copia mutada rechaza `--dry-run`.

## Notas

- Tramo 3 implementado en `instalar.sh`, `install.sh` y `tools/verify/install-simulation.sh`. Pendiente revisión independiente en contexto nuevo.
