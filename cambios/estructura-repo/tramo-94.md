# Tramo 94 — Consolidar nucleo/contrato/verificacion.md en core/contracts/verificacion.md (borrador)

## Pasos

### Tramo 94 — Historia: Consolidar nucleo/contrato/verificacion.md en core/contracts/verificacion.md
Como mantenedor quiero una fuente identificable en `core/` para conservar el acceso de instalaciones existentes.
Dependencias: tramo 93 revisado, aislamiento del tramo 1 y matriz del tramo 56. Contratos: mantener `nucleo/contrato/verificacion.md` como archivo regular versionado con bytes y permisos iguales a `core/contracts/verificacion.md`; conservar nombres públicos de skills, referencias relativas y comportamiento; no usar enlaces simbólicos. No acceder a proyectos ni HOME reales. Ejemplo: una instalación anterior que referencia `nucleo/contrato/verificacion.md` sigue leyendo exactamente el mismo contenido.
Alcance: `core/contracts/verificacion.md` y el inventario de equivalencias `tools/core-compatibility.json`; pruebas pertinentes. `nucleo/contrato/verificacion.md` permanece intacto en este tramo.
Archivos: `core/contracts/verificacion.md`, `tools/core-compatibility.json`.
CUANDO se cargue `nucleo/contrato/verificacion.md` desde una instalación previa o un paquete remoto ENTONCES obtiene el mismo contenido y recursos que antes (A94).
Aceptación A94: el archivo nuevo es idéntico byte a byte y con permisos equivalentes al anterior; el inventario incluye el par y la comprobación del tramo 82 lo valida; no cambian la salida ni la cobertura.
TODO:
- [x] Copiar `nucleo/contrato/verificacion.md` a `core/contracts/verificacion.md` como archivo regular y añadir el par exacto al inventario, sin alterar contenidos ni referencias (A94). Comprobación: `cmp` retorna 0 y los modos coinciden.
- [x] Ejecutar la comprobación de equivalencias y la prueba offline de instalación remota con archivo válido, y comprobar que una instalación previa aislada sigue resolviendo `nucleo/contrato/verificacion.md` (A94). Comprobación: todas retornan 0; el paquete contiene ambas rutas como archivos regulares.
- [x] Comparar los escenarios pertinentes de `cambios/estructura-repo/tramo-56.md`, incluyendo salida, errores, código, enlaces y contenido generado (A94). Comprobación: coincide con la referencia salvo las diferencias autorizadas.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A94). Comprobación: ambos retornan 0 y coinciden con la referencia salvo las diferencias autorizadas.
Verificación del tramo: `./verify` — nivel 3; además prueba offline, matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: `$ cmp nucleo/contrato/verificacion.md core/contracts/verificacion.md && test "$(stat -c '%a' nucleo/contrato/verificacion.md)" = "$(stat -c '%a' core/contracts/verificacion.md)" && stat -c '%a %F %n' nucleo/contrato/verificacion.md core/contracts/verificacion.md && node --check tools/verify/core-compatibility.mjs && node tools/verify/core-compatibility.mjs`: `644 regular file` en ambas rutas; bytes, modos, sintaxis e inventario validados (`exit 0`).
- Paso 2: `$ node --test tools/verify/core-compatibility.test.mjs && node --check tools/verify/core-compatibility.mjs && node tools/verify/core-compatibility.mjs && python3 -B cambios/estructura-repo/comprobar-a3.py`: 6/6 pruebas; sintaxis, inventario y A56 con diez rechazos negativos pasaron (`exit 0`). Paquete remoto sintético creado con rutas permitidas más ambas rutas A94 e instalado bajo Bubblewrap sin red: `core/contracts/verificacion.md` quedó regular e idéntico; instalación previa sintética leyó `nucleo/contrato/verificacion.md` idéntico (`exit 0`). Sin HOME real ni proyectos.
- Paso 3: `$ python3 -B cambios/estructura-repo/comprobar-a3.py`: `exit 0`. Escenarios remotos A56 conservaron URLs y salidas previstas; `--estado` no escribió; instalación sin `core`, actualización con `core` y diez rechazos negativos preservaron árbol y versión previos. La copia real del kit conservó `tools/` y `adapters/`, pasó `instalar.sh --copiar --simular` y resolvió modelo/esfuerzo desde cwd conflictivo; autoprueba del medidor 2/2; OpenSpec quedó omitido como referencia. Ejecución offline y aislada, sin acceso al HOME real ni a proyectos.
- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `exit 0` en 44.8 s. `./verify` coincide con la línea base salvo el mensaje exacto autorizado del escenario 9; las dos simulaciones de `bash ./instalar.sh --simular` son repetibles y coinciden con la línea base, aplicando solo esa excepción. Bubblewrap y HOME sintético; sin proyectos reales ni áreas excluidas.
