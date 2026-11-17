# Tramo 139 — Indexar historial sin mover archivos protegidos

## Pasos

### Tramo 139 — Historia: Indexar historial sin mover archivos protegidos
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 138 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: changes/HISTORY.md, archive/README.md y actualización de docs/decisions/structure.md para reflejar estos índices. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: changes/HISTORY.md, archive/README.md, docs/decisions/structure.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A139).
Aceptación A139: Comprobar existencia de destinos y que git status no muestra cambios en históricos; conservar ceremonia vigente.
TODO:
- [x] En `changes/HISTORY.md`, Crear índices que enlacen cambios/hechos/ y old/ respectivamente, sin leer ni mover old/v1/registro/ ni cambiar contenidos históricos. (A139). Comprobación: Comprobar existencia de destinos y que git status no muestra cambios en históricos; conservar ceremonia vigente.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A139). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: creados `changes/HISTORY.md` y `archive/README.md`. La comprobación de enlaces confirmó 6 enlaces locales válidos y que `cambios/hechos/` y `old/` existen (`exit 0`). `git status --short -- old cambios/hechos` no mostró cambios históricos; `git diff --check` pasó. Los índices mantienen `cambios/hechos/` como destino de la ceremonia y enlazan `old/` sin mover ni inventariar su contenido.
- Paso 2: `$ timeout 71 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó `exit 0` en 40,9 s. `./verify` coincide con la línea base salvo las sustituciones textuales exactas autorizadas de escenarios 9 y 8i; las dos simulaciones de instalación son repetibles y coinciden bajo esas mismas excepciones. El control negativo adicional de 8i fue rechazado. Receta aislada del tramo 1; referencia intacta.

## Notas de revisión
- La decisión de estructura del tramo 138 afirmaba que `archive/`, `changes/` y `changes/HISTORY.md` no estaban implementados; se corrigió para distinguir índices existentes de traslados aún propuestos. Se comprobaron las nueve rutas mencionadas en la revisión y todas existen; `git status --short -- old cambios/hechos` no muestra cambios históricos, y `git diff --check` pasa. La receta aislada de este tramo ya había pasado en 40,9 s (`exit 0`); no se repitió porque esta corrección solo cambia documentación.
