# Tramo 135 — Anonimizar documentación de permisos

## Pasos

### Tramo 135 — Historia: Anonimizar documentación de permisos
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 134 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: docs/reglas-deny.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: docs/reglas-deny.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A135).
Aceptación A135: Comprobar enlaces y comparar el texto semánticamente con el original.
TODO:
- [ ] En `docs/reglas-deny.md`, Sustituir el nombre personal por el rol correspondiente sin alterar la descripción de las barreras. (A135). Comprobación: Comprobar enlaces y comparar el texto semánticamente con el original.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A135). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
