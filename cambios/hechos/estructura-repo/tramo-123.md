# Tramo 123 — Catalogar las evaluaciones existentes

## Pasos

### Tramo 123 — Historia: Catalogar las evaluaciones existentes
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 122 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: evals/README.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: evals/README.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A123).
Aceptación A123: Ejecutar solo node pruebas/revisor-luna/medir.mjs --autoprueba en aislamiento y comprobar que no se modifica resultados.jsonl.
TODO:
- [x] En `evals/README.md`, Documentar pruebas/revisor-luna/medir.mjs, sus casos y resultados históricos conservados, comando --autoprueba y ubicación; señalar que comparar-openspec no existe en este checkout. (A123). Comprobación: Ejecutar solo node pruebas/revisor-luna/medir.mjs --autoprueba en aislamiento y comprobar que no se modifica resultados.jsonl.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A123). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1 / A123: `$ node pruebas/revisor-luna/medir.mjs --autoprueba` ejecutado en una copia temporal aislada del medidor y las tarifas con dos casos sintéticos; no se copiaron casos reales. Salida: cuatro corridas simuladas, `autoprueba: filas=4; corridas=4; tope cortó=true; primera fila=0.655`, `AUTOPRUEBA OK`, `exit 0`. `pruebas/revisor-luna/resultados.jsonl` quedó intacto: 20826 bytes y SHA-256 `d56dd646db38e7025c174c00fd9d3faa25d31691a39080154993a4cb2434f396` antes y después. `evals/README.md` documenta condiciones, casos, histórico preservado, comando offline y ausencia de OpenSpec.
- Paso 2 / A123: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó en 43,6 s, `exit 0`. `./verify` coincide con la línea base salvo el mensaje exacto autorizado del escenario 9; dos simulaciones aisladas de instalación son repetibles y coinciden con la referencia, aplicando solo esa excepción.
