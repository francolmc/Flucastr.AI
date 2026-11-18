# Tramo 86 — Consolidar skills/diagnosticar/SKILL.md en core/skills/diagnose/SKILL.md (borrador)

## Pasos

### Tramo 86 — Historia: Consolidar skills/diagnosticar/SKILL.md en core/skills/diagnose/SKILL.md
Como mantenedor quiero una fuente identificable en `core/` para conservar el acceso de instalaciones existentes.
Dependencias: tramo 85 revisado, aislamiento del tramo 1 y matriz del tramo 56. Contratos: mantener `skills/diagnosticar/SKILL.md` como archivo regular versionado con bytes y permisos iguales a `core/skills/diagnose/SKILL.md`; conservar nombres públicos de skills, referencias relativas y comportamiento; no usar enlaces simbólicos. No acceder a proyectos ni HOME reales. Ejemplo: una instalación anterior que referencia `skills/diagnosticar/SKILL.md` sigue leyendo exactamente el mismo contenido.
Alcance: `core/skills/diagnose/SKILL.md` y el inventario de equivalencias `tools/core-compatibility.json`; pruebas pertinentes. `skills/diagnosticar/SKILL.md` permanece intacto en este tramo.
Archivos: `core/skills/diagnose/SKILL.md`, `tools/core-compatibility.json`.
CUANDO se cargue `skills/diagnosticar/SKILL.md` desde una instalación previa o un paquete remoto ENTONCES obtiene el mismo contenido y recursos que antes (A86).
Aceptación A86: el archivo nuevo es idéntico byte a byte y con permisos equivalentes al anterior; el inventario incluye el par y la comprobación del tramo 82 lo valida; no cambian la salida ni la cobertura.
TODO:
- [x] Copiar `skills/diagnosticar/SKILL.md` a `core/skills/diagnose/SKILL.md` como archivo regular y añadir el par exacto al inventario, sin alterar contenidos ni referencias (A86). Comprobación: `cmp` retorna 0 y los modos coinciden.
- [x] Ejecutar la comprobación de equivalencias y la prueba offline de instalación remota con archivo válido, y comprobar que una instalación previa aislada sigue resolviendo `skills/diagnosticar/SKILL.md` (A86). Comprobación: todas retornan 0; el paquete contiene ambas rutas como archivos regulares.
- [x] Comparar los escenarios pertinentes de `cambios/estructura-repo/tramo-56.md`, incluyendo salida, errores, código, enlaces y contenido generado (A86). Comprobación: coincide con la referencia salvo las diferencias autorizadas.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A86). Comprobación: ambos retornan 0 y coinciden con la referencia salvo las diferencias autorizadas.
Verificación del tramo: `./verify` — nivel 3; además prueba offline, matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: `$ cmp skills/diagnosticar/SKILL.md core/skills/diagnose/SKILL.md && test "$(stat -c '%a' skills/diagnosticar/SKILL.md)" = "$(stat -c '%a' core/skills/diagnose/SKILL.md)" && stat -c '%a %F %n' skills/diagnosticar/SKILL.md core/skills/diagnose/SKILL.md && node --check tools/verify/core-compatibility.mjs && node tools/verify/core-compatibility.mjs`: ambas rutas son archivos regulares modo `644`; `cmp`, modos, sintaxis y comprobador del inventario actualizado pasaron (`exit 0`). La fuente `skills/diagnosticar/SKILL.md` permanece intacta.
- Paso 2: `$ node --check tools/verify/core-compatibility.mjs && node tools/verify/core-compatibility.mjs && python3 -B` (Bubblewrap: `check_remote_copy` con `core/` incluido en el tar sintético): todo pasó (`exit 0`). La instalación remota y `instalar.sh --copiar --simular` pasaron sin red; `skills/diagnosticar/SKILL.md` y `core/skills/diagnose/SKILL.md` quedaron instalados como archivos regulares, con bytes idénticos a la fuente y la ruta anterior legible. Salidas: `copia remota del kit real: tools/ y adapters/ conservados; rutas excluidas ausentes; instalar.sh --copiar --simular pasó; resolver instalado obtuvo modelo y modelo-esfuerzo desde su raíz con cwd conflictivo; sin red` y `diagnose remote package: ambas rutas regulares, bytes idénticos; skills/diagnosticar/SKILL.md resolvió contenido`. Origen, HOME, tar e instalación fueron sintéticos.
- Paso 3: `$ python3 -B cambios/estructura-repo/comprobar-a3.py`: `exit 0`. La matriz A56 conservó instalación remota, estado sin escrituras, actualización, mensajes y árbol previo, además de los 10 rechazos negativos; sin red. También pasaron copia remota del kit y autoprueba sintética del medidor; OpenSpec fue omitido sin abrir su árbol ausente.
- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `exit 0` en 46,1 s. En el aislamiento Bubblewrap del tramo 1, `./verify` coincidió con la referencia salvo el mensaje exacto aprobado del escenario 9; las dos simulaciones `bash ./instalar.sh --simular` fueron repetibles y coincidieron con la referencia. Sin red ni acceso a HOME o proyectos reales.
