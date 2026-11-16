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
- [ ] En `core/skills/diagnose/result.mjs`, Copiar el módulo anterior como archivo regular y agregar el par al inventario de compatibilidad. (A117). Comprobación: El comprobador de compatibilidad pasa y detecta una diferencia de bytes en una copia temporal.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A117). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
