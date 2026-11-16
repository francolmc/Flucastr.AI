# Tramo 102 — Separar lectura de JSONL (borrador)

## Pasos

### Tramo 102 — Historia: Separar lectura de JSONL
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 101 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/uso.mjs y tools/usage/jsonl.mjs; pruebas y evidencias pertinentes.
Archivos: scripts/uso.mjs, tools/usage/jsonl.mjs.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A102).
Aceptación A102: Fixtures válidos, líneas corruptas y directorios inexistentes producen los resultados anteriores. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] Extraer esDirectorio, reciente, listarJsonl y leerJsonl con sus imports; conservar orden de recorridos, fallos silenciosos y callback por línea. (A102). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-102.md` y confirmar que solo aborda esta responsabilidad.
- [ ] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-102.md` y las pruebas negativas afectadas con fixtures aislados (A102). Comprobación: Fixtures válidos, líneas corruptas y directorios inexistentes producen los resultados anteriores.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A102). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
