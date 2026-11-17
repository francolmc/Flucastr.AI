# Tramo 118 — Conectar el lector del diagnóstico

## Pasos

### Tramo 118 — Historia: Conectar el lector del diagnóstico
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 117 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: skills/diagnosticar/diagnosticar.mjs, core/skills/diagnose/diagnosticar.mjs. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: skills/diagnosticar/diagnosticar.mjs, core/skills/diagnose/diagnosticar.mjs.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A118).
Aceptación A118: Ejecutar la matriz del tramo 112 y probar instalaciones por enlace, copia y paquete remoto offline, sin acceso al checkout en los dos últimos casos.
TODO:
- [x] En `skills/diagnosticar/diagnosticar.mjs`, Reemplazar las dos funciones y constantes por el import local correspondiente en ambos entrypoints idénticos. (A118). Comprobación: Ejecutar la matriz del tramo 112 y probar instalaciones por enlace, copia y paquete remoto offline, sin acceso al checkout en los dos últimos casos.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A118). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: ambos entrypoints idénticos importan `leerResultado` desde su `./result.mjs` local; se retiraron las constantes y funciones locales duplicadas. Matriz A112 de 16 casos por ruta: los dos entrypoints del checkout, instalación por enlace, instalación por copia y paquete remoto offline; 80 comparaciones exactas de código/stdout/stderr con la referencia (incluye inexistente, vacío, repo sin HEAD y repo con HEAD, texto y JSON). Hashes de stdout por fixture/modo iguales a A112: `ba6878451449f5892264b3277be5530717d8b316fcb325ee24ddf0807d41d603`, `607e340f9c9f998eb1102b79d01759b694e2fe7f527218905136e160183df6f7`, `2b4005b0cf5ff95b582c905076edc8344ce658c7fc83ec9c9680176917bb58a1`, `bb693fd45f9f1acd0d037c6b3d7d2a4e00782527e56245ffc1f9550cfa788221`, `e7ce7fdb3365f9434278d36d3f95369aeda2f21d3e4a242007dfe1343e701f83`, `a6fc05a271040ee6548dc55ac9447707313f006d24b63599fddc64f89e1bac17`, `7e07f1a3e444dd6bc583f05b14f0b09102bdc7cae9f06f802203460a3d2b99e6`, `03fa149a94f5802194d26c2e0a195a3ff365b20810b62d1114080373440d292b8`; los árboles fixture no cambiaron. Copia y paquete remoto se ejecutaron en Bubblewrap con el checkout ausente; la instalación por enlace también se comprobó. `cmp`, `node --check` para ambos entrypoints, `node tools/verify/core-compatibility.mjs` y `git diff --check` pasaron, `exit 0`. Instalaciones sintéticas bajo `/tmp/diagnostico-tramo118-install-20261117`; referencia A112 en `/tmp/diagnostico-tramo112-4xwD2M/baseline-115.json`.
- Paso 2: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `verify coincide salvo el mensaje exacto autorizado del escenario 9.` y `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`, terminó en 43.4 s, `exit 0`. El runner aislado ejecutó `./verify` y dos veces `bash ./instalar.sh --simular`; códigos, salida y efectos comparados con la línea base.
