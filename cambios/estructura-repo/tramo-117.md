# Tramo 117 — Distribuir el lector de resultados

## Pasos

### Tramo 117 — Historia: Distribuir el lector de resultados
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 116 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: core/skills/diagnose/result.mjs, tools/core-compatibility.json. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: core/skills/diagnose/result.mjs, tools/core-compatibility.json.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A117).
Aceptación A117: El comprobador de compatibilidad pasa y detecta una diferencia de bytes en una copia temporal.
TODO:
- [x] En `core/skills/diagnose/result.mjs`, Copiar el módulo anterior como archivo regular y agregar el par al inventario de compatibilidad. (A117). Comprobación: El comprobador de compatibilidad pasa y detecta una diferencia de bytes en una copia temporal.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A117). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: `$ cp -p skills/diagnosticar/result.mjs core/skills/diagnose/result.mjs`; `test -f` y `test ! -L` confirman archivo regular, modo `644`; ambas rutas tienen SHA-256 `b0d6534b6b635aa2bb77a4dbe60cf6d1d0d0a4011c77b9b13f5429fd89a32a4c`. Se agregó el par exacto a `tools/core-compatibility.json`. `$ node tools/verify/core-compatibility.mjs` terminó `exit 0`; `$ node --test tools/verify/core-compatibility.test.mjs` pasó 6/6, incluida la prueba que ejecuta la fase de modelos sobre una copia temporal con contenido desigual y verifica rechazo por bytes. Sintaxis de los dos módulos y `git diff --check` pasaron.
- Paso 2: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó en 40.6 s, `exit 0`; `verify coincide salvo el mensaje exacto autorizado del escenario 9.` y `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.` El runner ejecutó `./verify` y dos `bash ./instalar.sh --simular` en aislamiento y comparó códigos, salidas y efectos.
