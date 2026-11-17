# Tramo 95 — Consolidar nucleo/recetas/node-pnpm.md en core/recipes/node-pnpm.md (borrador)

## Pasos

### Tramo 95 — Historia: Consolidar nucleo/recetas/node-pnpm.md en core/recipes/node-pnpm.md
Como mantenedor quiero una fuente identificable en `core/` para conservar el acceso de instalaciones existentes.
Dependencias: tramo 94 revisado, aislamiento del tramo 1 y matriz del tramo 56. Contratos: mantener `nucleo/recetas/node-pnpm.md` como archivo regular versionado con bytes y permisos iguales a `core/recipes/node-pnpm.md`; conservar nombres públicos de skills, referencias relativas y comportamiento; no usar enlaces simbólicos. No acceder a proyectos ni HOME reales. Ejemplo: una instalación anterior que referencia `nucleo/recetas/node-pnpm.md` sigue leyendo exactamente el mismo contenido.
Alcance: `core/recipes/node-pnpm.md` y el inventario de equivalencias `tools/core-compatibility.json`; pruebas pertinentes. `nucleo/recetas/node-pnpm.md` permanece intacto en este tramo.
Archivos: `core/recipes/node-pnpm.md`, `tools/core-compatibility.json`.
CUANDO se cargue `nucleo/recetas/node-pnpm.md` desde una instalación previa o un paquete remoto ENTONCES obtiene el mismo contenido y recursos que antes (A95).
Aceptación A95: el archivo nuevo es idéntico byte a byte y con permisos equivalentes al anterior; el inventario incluye el par y la comprobación del tramo 82 lo valida; no cambian la salida ni la cobertura.
TODO:
- [x] Copiar `nucleo/recetas/node-pnpm.md` a `core/recipes/node-pnpm.md` como archivo regular y añadir el par exacto al inventario, sin alterar contenidos ni referencias (A95). Comprobación: `cmp` retorna 0 y los modos coinciden.
- [x] Ejecutar la comprobación de equivalencias y la prueba offline de instalación remota con archivo válido, y comprobar que una instalación previa aislada sigue resolviendo `nucleo/recetas/node-pnpm.md` (A95). Comprobación: todas retornan 0; el paquete contiene ambas rutas como archivos regulares.
- [x] Comparar los escenarios pertinentes de `cambios/estructura-repo/tramo-56.md`, incluyendo salida, errores, código, enlaces y contenido generado (A95). Comprobación: coincide con la referencia salvo las diferencias autorizadas.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A95). Comprobación: ambos retornan 0 y coinciden con la referencia salvo las diferencias autorizadas.
Verificación del tramo: `./verify` — nivel 3; además prueba offline, matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: `$ cmp nucleo/recetas/node-pnpm.md core/recipes/node-pnpm.md && test "$(stat -c '%a' nucleo/recetas/node-pnpm.md)" = "$(stat -c '%a' core/recipes/node-pnpm.md)" && stat -c '%a %F %n' nucleo/recetas/node-pnpm.md core/recipes/node-pnpm.md && node --check tools/verify/core-compatibility.mjs && node tools/verify/core-compatibility.mjs`: `cmp`, modos, sintaxis e inventario pasan (`exit 0`); ambas rutas son archivos regulares modo `644`.
- Paso 2: `$ node --test tools/verify/core-compatibility.test.mjs && node --check tools/verify/core-compatibility.mjs && node tools/verify/core-compatibility.mjs` y fixture remoto sintético con Bubblewrap y red deshabilitada: 6/6 pruebas, sintaxis e inventario pasan (`exit 0`). Bootstrap remoto offline terminó `Instalado: a…` (`exit 0`); el tar contenía ambas rutas como archivos regulares e idénticas (724 bytes, SHA-256 `74f2244bfaee4c8a41536da0960c43b7ae4c9daf9dfa746d39893feb523cbf90`); `core/recipes/node-pnpm.md` quedó regular en la instalación. Fixture previo separado leyó `nucleo/recetas/node-pnpm.md` con los mismos 724 bytes. El instalador remoto filtra esa ruta histórica al materializar `kit/`; se comprobó la lectura previa en su propio árbol sintético, sin modificar la selección de rutas del instalador. Sin HOME real ni proyectos.
- Paso 3: `$ python3 -B cambios/estructura-repo/comprobar-a3.py`: `exit 0`. Matriz A56 aislada: URLs y estado sin escrituras; instalación sin `core`, actualización con `core`; los diez rechazos negativos preservan exactamente árbol y versión; copia remota real del kit conserva `tools/` y `adapters/`, simulación y resolución desde cwd conflictivo pasan; autoprueba offline del medidor 2/2; omisión explícita de OpenSpec preservada. Sin red ni proyectos reales.
- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `exit 0`, 44 s. `./verify` aislado coincide con la referencia salvo el mensaje exacto autorizado del escenario 9; las dos simulaciones de `bash ./instalar.sh --simular` son repetibles y coinciden con la línea base bajo esa misma excepción. Bubblewrap, HOME sintético, sin proyectos reales ni áreas excluidas.
