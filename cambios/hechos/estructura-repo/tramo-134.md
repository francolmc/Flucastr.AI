# Tramo 134 — Anonimizar justificación de Codex

## Pasos

### Tramo 134 — Historia: Anonimizar justificación de Codex
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 133 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: adapters/codex/deny.mjs. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: adapters/codex/deny.mjs.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A134).
Aceptación A134: Ejecutar pruebas de permisos y generación, comparar configuración generada y limitar la diferencia al texto autorizado.
TODO:
- [x] En `adapters/codex/deny.mjs`, Sustituir el nombre personal en la justificación generada por un rol equivalente; preservar reglas deny y permisos. (A134). Comprobación: Ejecutar pruebas de permisos y generación, comparar configuración generada y limitar la diferencia al texto autorizado.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A134). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- `$ node --check adapters/codex/deny.mjs && node --test pruebas/permisos-contrato/generacion.test.mjs pruebas/permisos-contrato/estructura.test.mjs pruebas/permisos-v2.test.mjs` → sintaxis correcta; `tests 8`, `pass 8`, `fail 0`, `exit 0`.
- Comparación de salida generada con fixture AGENTS sintético: SHA-256 anterior `6dfc7950bdb0c7dca07430cfa0e40e86787348366b242d15eca4a4d08929b4fd`; `sed 's/Lo hace Franco:/Lo hace el mantenedor:/g' anterior | cmp - actual` pasó. Se conservaron 10 reglas `forbidden`, 1 regla `allow` y su justificación; las 10 justificaciones deny usan el rol nuevo. Diff generado limitado exactamente al texto autorizado.
- `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` → `control negativo: modificación adicional en 8i rechazada.`, `verify coincide salvo las sustituciones textuales exactas autorizadas de los escenarios 9 y 8i.`, `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo las excepciones textuales exactas autorizadas de los escenarios 9 y 8i.`; `exit 0` (~30 s).
