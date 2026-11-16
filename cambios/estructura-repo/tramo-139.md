# Tramo 139 — Indexar historial sin mover archivos protegidos

## Pasos

### Tramo 139 — Historia: Indexar historial sin mover archivos protegidos
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 138 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: changes/HISTORY.md, archive/README.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: changes/HISTORY.md, archive/README.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A139).
Aceptación A139: Comprobar existencia de destinos y que git status no muestra cambios en históricos; conservar ceremonia vigente.
TODO:
- [ ] En `changes/HISTORY.md`, Crear índices que enlacen cambios/hechos/ y old/ respectivamente, sin leer ni mover old/v1/registro/ ni cambiar contenidos históricos. (A139). Comprobación: Comprobar existencia de destinos y que git status no muestra cambios en históricos; conservar ceremonia vigente.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A139). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
