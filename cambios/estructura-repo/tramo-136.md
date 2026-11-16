# Tramo 136 — Anonimizar ejemplo del medidor

## Pasos

### Tramo 136 — Historia: Anonimizar ejemplo del medidor
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 135 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: scripts/uso.mjs. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: scripts/uso.mjs.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A136).
Aceptación A136: Ejecutar la matriz del tramo 101 y asegurar que el diff no cambia código ejecutable.
TODO:
- [ ] En `scripts/uso.mjs`, Sustituir únicamente el nombre de persona del comentario ejemplificativo por un nombre ficticio; si el comentario fue movido durante los tramos 101–107, aplicar en su destino efectivo. (A136). Comprobación: Ejecutar la matriz del tramo 101 y asegurar que el diff no cambia código ejecutable.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A136). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
