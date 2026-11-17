# Tramo 90 — Consolidar skills/migrar-proyecto/SKILL.md en core/skills/migrate-project/SKILL.md (borrador)

## Pasos

### Tramo 90 — Historia: Consolidar skills/migrar-proyecto/SKILL.md en core/skills/migrate-project/SKILL.md
Como mantenedor quiero una fuente identificable en `core/` para conservar el acceso de instalaciones existentes.
Dependencias: tramo 89 revisado, aislamiento del tramo 1 y matriz del tramo 56. Contratos: mantener `skills/migrar-proyecto/SKILL.md` como archivo regular versionado con bytes y permisos iguales a `core/skills/migrate-project/SKILL.md`; conservar nombres públicos de skills, referencias relativas y comportamiento; no usar enlaces simbólicos. No acceder a proyectos ni HOME reales. Ejemplo: una instalación anterior que referencia `skills/migrar-proyecto/SKILL.md` sigue leyendo exactamente el mismo contenido.
Alcance: `core/skills/migrate-project/SKILL.md` y el inventario de equivalencias `tools/core-compatibility.json`; pruebas pertinentes. `skills/migrar-proyecto/SKILL.md` permanece intacto en este tramo.
Archivos: `core/skills/migrate-project/SKILL.md`, `tools/core-compatibility.json`.
CUANDO se cargue `skills/migrar-proyecto/SKILL.md` desde una instalación previa o un paquete remoto ENTONCES obtiene el mismo contenido y recursos que antes (A90).
Aceptación A90: el archivo nuevo es idéntico byte a byte y con permisos equivalentes al anterior; el inventario incluye el par y la comprobación del tramo 82 lo valida; no cambian la salida ni la cobertura.
TODO:
- [x] Copiar `skills/migrar-proyecto/SKILL.md` a `core/skills/migrate-project/SKILL.md` como archivo regular y añadir el par exacto al inventario, sin alterar contenidos ni referencias (A90). Comprobación: `cmp` retorna 0 y los modos coinciden.
- [x] Ejecutar la comprobación de equivalencias y la prueba offline de instalación remota con archivo válido, y comprobar que una instalación previa aislada sigue resolviendo `skills/migrar-proyecto/SKILL.md` (A90). Comprobación: todas retornan 0; el paquete contiene ambas rutas como archivos regulares.
- [x] Comparar los escenarios pertinentes de `cambios/estructura-repo/tramo-56.md`, incluyendo salida, errores, código, enlaces y contenido generado (A90). Comprobación: coincide con la referencia salvo las diferencias autorizadas.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A90). Comprobación: ambos retornan 0 y coinciden con la referencia salvo las diferencias autorizadas.
Verificación del tramo: `./verify` — nivel 3; además prueba offline, matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: `cp -p` conservó el archivo anterior y creó el nuevo como archivo regular; `cmp` pasó y ambos modos son `644`. Se añadió el par exacto al inventario. `$ cmp ... && test ... && stat ... && node --check tools/verify/core-compatibility.mjs && node tools/verify/core-compatibility.mjs` terminó `exit 0`; salida de modos: `644 regular file` para ambas rutas; validador silencioso.
- Paso 2: `$ node --check tools/verify/core-compatibility.mjs && node tools/verify/core-compatibility.mjs` terminó `exit 0`. La prueba offline `check_remote_copy` en Bubblewrap incluyó `core/` en el paquete temporal; ambas rutas instaladas (`skills/migrar-proyecto/SKILL.md` y `core/skills/migrate-project/SKILL.md`) fueron archivos regulares y tuvieron bytes iguales a la fuente. Se comprobó la resolución de la ruta pública anterior; simulación y resolución desde el kit remoto pasaron, sin red ni HOME real.
- Paso 3: `$ python3 -B cambios/estructura-repo/comprobar-a3.py` terminó `exit 0`. La matriz remota sintética pertinente para A56 pasó instalación, actualización, `--estado` sin escrituras y diez rechazos negativos, con árbol previo preservado y sin red; la copia remota del kit pasó también `instalar.sh --copiar --simular` y resolución desde cwd conflictivo. Sin cambios de salida/código/efectos respecto de sus aserciones.
- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó `exit 0` en 51.8 s. `./verify` aislado y dos simulaciones de `bash ./instalar.sh --simular` coinciden con la línea base, salvo el mensaje exacto autorizado del escenario 9; las dos simulaciones son repetibles.
