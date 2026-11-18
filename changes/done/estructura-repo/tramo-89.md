# Tramo 89 — Consolidar skills/ejecutar-plan/SKILL.md en core/skills/execute-plan/SKILL.md (borrador)

## Pasos

### Tramo 89 — Historia: Consolidar skills/ejecutar-plan/SKILL.md en core/skills/execute-plan/SKILL.md
Como mantenedor quiero una fuente identificable en `core/` para conservar el acceso de instalaciones existentes.
Dependencias: tramo 88 revisado, aislamiento del tramo 1 y matriz del tramo 56. Contratos: mantener `skills/ejecutar-plan/SKILL.md` como archivo regular versionado con bytes y permisos iguales a `core/skills/execute-plan/SKILL.md`; conservar nombres públicos de skills, referencias relativas y comportamiento; no usar enlaces simbólicos. No acceder a proyectos ni HOME reales. Ejemplo: una instalación anterior que referencia `skills/ejecutar-plan/SKILL.md` sigue leyendo exactamente el mismo contenido.
Alcance: `core/skills/execute-plan/SKILL.md` y el inventario de equivalencias `tools/core-compatibility.json`; pruebas pertinentes. `skills/ejecutar-plan/SKILL.md` permanece intacto en este tramo.
Archivos: `core/skills/execute-plan/SKILL.md`, `tools/core-compatibility.json`.
CUANDO se cargue `skills/ejecutar-plan/SKILL.md` desde una instalación previa o un paquete remoto ENTONCES obtiene el mismo contenido y recursos que antes (A89).
Aceptación A89: el archivo nuevo es idéntico byte a byte y con permisos equivalentes al anterior; el inventario incluye el par y la comprobación del tramo 82 lo valida; no cambian la salida ni la cobertura.
TODO:
- [x] Copiar `skills/ejecutar-plan/SKILL.md` a `core/skills/execute-plan/SKILL.md` como archivo regular y añadir el par exacto al inventario, sin alterar contenidos ni referencias (A89). Comprobación: `cmp` retorna 0 y los modos coinciden.
- [x] Ejecutar la comprobación de equivalencias y la prueba offline de instalación remota con archivo válido, y comprobar que una instalación previa aislada sigue resolviendo `skills/ejecutar-plan/SKILL.md` (A89). Comprobación: todas retornan 0; el paquete contiene ambas rutas como archivos regulares.
- [x] Comparar los escenarios pertinentes de `cambios/estructura-repo/tramo-56.md`, incluyendo salida, errores, código, enlaces y contenido generado (A89). Comprobación: coincide con la referencia salvo las diferencias autorizadas.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A89). Comprobación: ambos retornan 0 y coinciden con la referencia salvo las diferencias autorizadas.
Verificación del tramo: `./verify` — nivel 3; además prueba offline, matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: `$ cmp skills/ejecutar-plan/SKILL.md core/skills/execute-plan/SKILL.md && test "$(stat -c '%a' skills/ejecutar-plan/SKILL.md)" = "$(stat -c '%a' core/skills/execute-plan/SKILL.md)" && stat -c '%a %F %n' skills/ejecutar-plan/SKILL.md core/skills/execute-plan/SKILL.md && node --check tools/verify/core-compatibility.mjs && node tools/verify/core-compatibility.mjs`: ambas rutas son archivos regulares modo `644`; `cmp`, modos, sintaxis y comprobador del inventario actualizado pasaron (`exit 0`). La fuente `skills/ejecutar-plan/SKILL.md` permanece intacta.
- Paso 2: `$ node --check tools/verify/core-compatibility.mjs && node tools/verify/core-compatibility.mjs && python3 -B` (Bubblewrap: prueba remota del kit con `core/` incluido en el paquete sintético): todo pasó (`exit 0`). La instalación remota y `instalar.sh --copiar --simular` pasaron sin red; ambas rutas quedaron como archivos regulares con bytes idénticos a la fuente y `skills/ejecutar-plan/SKILL.md` resolvió contenido. Origen, HOME, paquete e instalación fueron sintéticos.
- Paso 3: `$ python3 -B cambios/estructura-repo/comprobar-a3.py`: `exit 0`. La matriz A56 conservó instalación remota, estado sin escrituras, actualización, mensajes, códigos y árbol previo, además de los 10 rechazos negativos; sin red. También pasaron la copia remota del kit, la autoprueba sintética del medidor (2 casos, sin resultados persistentes) y la comprobación de omisión explícita de OpenSpec sin abrir su árbol ausente.
- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `exit 0` en 45.9 s. En Bubblewrap aislado, `./verify` coincidió con la referencia salvo el mensaje exacto autorizado del escenario 9; las dos simulaciones `bash ./instalar.sh --simular` fueron repetibles y coincidieron con la referencia. Sin red, HOME real ni proyectos reales.
