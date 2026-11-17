# Tramo 92 — Consolidar skills/preparar-proyecto/SKILL.md en core/skills/prepare-project/SKILL.md (borrador)

## Pasos

### Tramo 92 — Historia: Consolidar skills/preparar-proyecto/SKILL.md en core/skills/prepare-project/SKILL.md
Como mantenedor quiero una fuente identificable en `core/` para conservar el acceso de instalaciones existentes.
Dependencias: tramo 91 revisado, aislamiento del tramo 1 y matriz del tramo 56. Contratos: mantener `skills/preparar-proyecto/SKILL.md` como archivo regular versionado con bytes y permisos iguales a `core/skills/prepare-project/SKILL.md`; conservar nombres públicos de skills, referencias relativas y comportamiento; no usar enlaces simbólicos. No acceder a proyectos ni HOME reales. Ejemplo: una instalación anterior que referencia `skills/preparar-proyecto/SKILL.md` sigue leyendo exactamente el mismo contenido.
Alcance: `core/skills/prepare-project/SKILL.md` y el inventario de equivalencias `tools/core-compatibility.json`; pruebas pertinentes. `skills/preparar-proyecto/SKILL.md` permanece intacto en este tramo.
Archivos: `core/skills/prepare-project/SKILL.md`, `tools/core-compatibility.json`.
CUANDO se cargue `skills/preparar-proyecto/SKILL.md` desde una instalación previa o un paquete remoto ENTONCES obtiene el mismo contenido y recursos que antes (A92).
Aceptación A92: el archivo nuevo es idéntico byte a byte y con permisos equivalentes al anterior; el inventario incluye el par y la comprobación del tramo 82 lo valida; no cambian la salida ni la cobertura.
TODO:
- [x] Copiar `skills/preparar-proyecto/SKILL.md` a `core/skills/prepare-project/SKILL.md` como archivo regular y añadir el par exacto al inventario, sin alterar contenidos ni referencias (A92). Comprobación: `cmp` retorna 0 y los modos coinciden.
- [x] Ejecutar la comprobación de equivalencias y la prueba offline de instalación remota con archivo válido, y comprobar que una instalación previa aislada sigue resolviendo `skills/preparar-proyecto/SKILL.md` (A92). Comprobación: todas retornan 0; el paquete contiene ambas rutas como archivos regulares.
- [x] Comparar los escenarios pertinentes de `cambios/estructura-repo/tramo-56.md`, incluyendo salida, errores, código, enlaces y contenido generado (A92). Comprobación: coincide con la referencia salvo las diferencias autorizadas.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A92). Comprobación: ambos retornan 0 y coinciden con la referencia salvo las diferencias autorizadas.
Verificación del tramo: `./verify` — nivel 3; además prueba offline, matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: `$ cmp skills/preparar-proyecto/SKILL.md core/skills/prepare-project/SKILL.md && test "$(stat -c '%a' skills/preparar-proyecto/SKILL.md)" = "$(stat -c '%a' core/skills/prepare-project/SKILL.md)" && stat -c '%a %F %n' skills/preparar-proyecto/SKILL.md core/skills/prepare-project/SKILL.md && node --check tools/verify/core-compatibility.mjs && node tools/verify/core-compatibility.mjs` terminó `exit 0`. `cmp` y comprobador silenciosos; ambos archivos regulares modo `644`, inventario validado.
- Paso 2: `$ node --test tools/verify/core-compatibility.test.mjs && node --check tools/verify/core-compatibility.mjs && node tools/verify/core-compatibility.mjs && python3 -B` (Bubblewrap, paquete sintético creado desde rutas permitidas e incluyendo `core/`): 6/6 pruebas, sintaxis e inventario pasaron; `exit 0`. La instalación remota offline terminó `exit 0`; ambas rutas de SKILL.md fueron archivos regulares con bytes idénticos a la fuente, la ruta pública anterior resolvió contenido y `instalar.sh --copiar --simular` terminó `exit 0`; sin red ni HOME real.
- Paso 3: `$ python3 -B cambios/estructura-repo/comprobar-a3.py` terminó `exit 0`. La matriz A56 confirmó instalación/actualización, `--estado` sin escrituras, mensajes/códigos y diez rechazos negativos con árbol y versión previos idénticos; la copia remota pasó `--copiar --simular` y resolución con cwd conflictivo. Autoprueba offline del medidor: 2 casos sintéticos, sin resultados persistentes; arnés OpenSpec ausente omitido según contrato. Sin red.
- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó `exit 0` en 47.3 s. La receta aislada comparó `./verify` y dos simulaciones con la línea base: verify coincide salvo el mensaje exacto autorizado del escenario 9; las simulaciones son repetibles y coinciden con la referencia. `git diff --check` para los archivos del tramo terminó `exit 0`.
