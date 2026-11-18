# Tramo 9 — Código histórico, primer grupo

## Pasos

### Tramo 9 — Historia: anonimizar tres utilidades históricas

Como persona que reutiliza el repositorio quiero ejemplos históricos anónimos que conserven su comportamiento y significado para que el kit sea reutilizable.

Dependencias: ninguna funcional; seguir el orden del plan y el inventario `exploracion.md`.

Contratos a conservar: nombres de funciones, estructura y semántica de datos, cifras, cronología, valores no identificativos y resultados de las pruebas históricas. No leer credenciales ni modificar el historial Git.

Rutas susceptibles de cambio: los tres scripts mantienen su ubicación; se actualizan fixtures y pruebas históricas si dependen de sus ejemplos.

Ejemplo concreto del resultado esperado: una ruta de ejemplo con nombre personal se sustituye por una ruta genérica coherente sin cambiar la forma de los datos ni sus campos.

Alcance: tres scripts listados y pruebas o fixtures históricos afectados en `old/v1/pruebas/`.

Archivos: old/v1/scripts/archivar.mjs, old/v1/scripts/formato-encargo.mjs, old/v1/scripts/formato-presupuesto.mjs

CUANDO se examinan los ejemplos de estos scripts ENTONCES no identifican a la persona ni a sus proyectos, salvo los literales y fixtures necesarios para compatibilidad histórica; se aceptan alternativas genéricas y se mantienen los contratos históricos (A9).

Aceptación:
- A9: revisión contextual de coincidencias del inventario en los tres scripts y pruebas históricas relacionadas; esperar sustituciones coherentes, sin cambios funcionales, y `./verify` exitoso.

TODO:
- [x] Anonimizar ejemplos en `old/v1/scripts/archivar.mjs` (A9). Comprobación: revisar diff y pruebas relacionadas; esperar semántica conservada.
- [x] Adaptar `old/v1/scripts/formato-encargo.mjs` conservando el contrato histórico (A9).
- [x] Adaptar `old/v1/scripts/formato-presupuesto.mjs` conservando el contrato histórico (A9).
- [x] Comprobar los fixtures históricos y los alias genéricos en `old/v1/pruebas/comprobaciones/` (A9).

Verificación del tramo: `./verify` — nivel 2 por falta de comprobación rápida declarada; exit 0, cubre A9.

Handoff: registrar los seudónimos empleados en Notas para reutilizarlos; no debilitar pruebas ni cambiar datos salvo anonimización.

## Evidencia
- Pruebas históricas de los tres scripts: 80 aprobadas fuera del sandbox; la ejecución dentro del sandbox falló en `archivar.test.mjs`. `git diff --check`: exit 0.
- `./verify` fuera del sandbox: exit 0, `VERIFY OK`.

## Notas
- PAUSA por conflicto de contratos antes de editar: `formato-encargo.mjs` reconoce y devuelve el literal `franco` como valor de máquina; `formato-presupuesto.mjs` exige la clave literal `Espera a Franco: `. Eliminarlos o sustituirlos cambia los datos aceptados o devueltos, en contra de A9. Se requiere decidir cómo conservar compatibilidad y eliminar la identificación. No hay casillas completadas ni cambios de producto en este tramo.
- Decisión confirmada: conservar los literales y pruebas históricas necesarios para compatibilidad y admitir alternativas genéricas. `Disparó: usuario` conserva el resultado histórico; `Espera a usuario: ` es una alternativa a la clave histórica, con los mismos límites. Las referencias no funcionales se anonimizan.
- Historia ejecutada: comentario de archivo anonimizado; dos entradas genéricas aceptadas; valores antiguos conservados; 80 pruebas históricas y `./verify` pasan. Falta revisión independiente en contexto nuevo antes de avanzar.
