# Tramo 93 — Consolidar skills/preparar-proyecto/referencia.md en core/skills/prepare-project/referencia.md (borrador)

## Pasos

### Tramo 93 — Historia: Consolidar skills/preparar-proyecto/referencia.md en core/skills/prepare-project/referencia.md
Como mantenedor quiero una fuente identificable en `core/` para conservar el acceso de instalaciones existentes.
Dependencias: tramo 92 revisado, aislamiento del tramo 1 y matriz del tramo 56. Contratos: mantener `skills/preparar-proyecto/referencia.md` como archivo regular versionado con bytes y permisos iguales a `core/skills/prepare-project/referencia.md`; conservar nombres públicos de skills, referencias relativas y comportamiento; no usar enlaces simbólicos. No acceder a proyectos ni HOME reales. Ejemplo: una instalación anterior que referencia `skills/preparar-proyecto/referencia.md` sigue leyendo exactamente el mismo contenido.
Alcance: `core/skills/prepare-project/referencia.md` y el inventario de equivalencias `tools/core-compatibility.json`; pruebas pertinentes. `skills/preparar-proyecto/referencia.md` permanece intacto en este tramo.
Archivos: `core/skills/prepare-project/referencia.md`, `tools/core-compatibility.json`.
CUANDO se cargue `skills/preparar-proyecto/referencia.md` desde una instalación previa o un paquete remoto ENTONCES obtiene el mismo contenido y recursos que antes (A93).
Aceptación A93: el archivo nuevo es idéntico byte a byte y con permisos equivalentes al anterior; el inventario incluye el par y la comprobación del tramo 82 lo valida; no cambian la salida ni la cobertura.
TODO:
- [x] Copiar `skills/preparar-proyecto/referencia.md` a `core/skills/prepare-project/referencia.md` como archivo regular y añadir el par exacto al inventario, sin alterar contenidos ni referencias (A93). Comprobación: `cmp` retorna 0 y los modos coinciden.
- [x] Ejecutar la comprobación de equivalencias y la prueba offline de instalación remota con archivo válido, y comprobar que una instalación previa aislada sigue resolviendo `skills/preparar-proyecto/referencia.md` (A93). Comprobación: todas retornan 0; el paquete contiene ambas rutas como archivos regulares.
- [x] Comparar los escenarios pertinentes de `cambios/estructura-repo/tramo-56.md`, incluyendo salida, errores, código, enlaces y contenido generado (A93). Comprobación: coincide con la referencia salvo las diferencias autorizadas.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A93). Comprobación: ambos retornan 0 y coinciden con la referencia salvo las diferencias autorizadas.
Verificación del tramo: `./verify` — nivel 3; además prueba offline, matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: `$ cmp skills/preparar-proyecto/referencia.md core/skills/prepare-project/referencia.md && test "$(stat -c '%a' skills/preparar-proyecto/referencia.md)" = "$(stat -c '%a' core/skills/prepare-project/referencia.md)" && stat -c '%a %F %n' skills/preparar-proyecto/referencia.md core/skills/prepare-project/referencia.md && node --check tools/verify/core-compatibility.mjs && node tools/verify/core-compatibility.mjs`: `644 regular file` para ambas rutas; `cmp`, modos, sintaxis e inventario con el par agregado pasaron; salida silenciosa del comprobador (`exit 0`).
- Paso 2: `$ node --test tools/verify/core-compatibility.test.mjs && node --check tools/verify/core-compatibility.mjs && node tools/verify/core-compatibility.mjs`: 6/6 pruebas pasan; sintaxis e inventario válidos (`exit 0`). Prueba offline: `$ python3 - <<'PY'` (paquete temporal de rutas permitidas, instalación por `instalar-remoto.sh` bajo Bubblewrap): ambas rutas `skills/preparar-proyecto/referencia.md` y `core/skills/prepare-project/referencia.md` quedan como archivos regulares con bytes idénticos; `instalar.sh --copiar --simular` retorna 0 y se lee el contenido por la ruta pública anterior (`exit 0`). Sin red, HOME real ni proyectos.
- Paso 3: `$ python3 -B cambios/estructura-repo/comprobar-a3.py`: `exit 0`; matriz sintética pertinente del tramo 56 completó instalación, estado, actualización y diez rechazos negativos conservando códigos, mensajes y árbol previo. También pasaron la copia remota y simulación del kit y la resolución desde cwd conflictivo; sin red ni persistencia del medidor.
- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `exit 0` en 46.7 s; `./verify` aislado coincide con la línea base salvo el mensaje exacto autorizado del escenario 9 y las dos ejecuciones de `bash ./instalar.sh --simular` coinciden con línea base y entre sí. El runner usa Bubblewrap y HOME sintético; no accedió a proyectos reales, secretos ni áreas excluidas.
