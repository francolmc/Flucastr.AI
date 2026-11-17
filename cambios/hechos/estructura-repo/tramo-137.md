# Tramo 137 — Actualizar contexto vigente del repositorio

## Pasos

### Tramo 137 — Historia: Actualizar contexto vigente del repositorio
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 136 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: AGENTS.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: AGENTS.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A137).
Aceptación A137: Revisar cada obligación y enlace contra el original; ejecutar aceptación y comprobaciones estructurales.
TODO:
- [x] En `./AGENTS.md`, reemplazar nombres personales y de proyectos en instrucciones vigentes por roles y ejemplos anónimos, conservar identificadores de compatibilidad y enlaces históricos. Actualizar las rutas de estructura efectiva sin alterar políticas. (A137). Comprobación: Revisar cada obligación y enlace contra el original; ejecutar aceptación y comprobaciones estructurales.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A137). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: `AGENTS.md` cambia las menciones personales a «la persona usuaria» y las referencias operativas a rutas canónicas bajo `core/` (agentes, skills, contrato y receta). Se conservaron `Flucastr.AI`, el remoto público `francolmc/Flucastr.AI`, identificadores de compatibilidad, rutas históricas e informe `docs/investigaciones/auditoria-andes-constructor.md`. La revisión del diff confirma que no cambian las obligaciones ni políticas. Aceptación antes y después: `node --test pruebas/aceptacion/*.test.mjs`, 3/3 flujos aprobados en ambas ejecuciones. Comprobación estructural de los destinos nuevos y `git diff --check -- AGENTS.md`: sin errores; búsqueda de nombres personales y de proyectos de ejemplo en el archivo: sin coincidencias.
- Paso 2: `$ timeout 71 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con `exit 0` en 42,9 s. `./verify` y las dos simulaciones repetibles de `bash ./instalar.sh --simular` coinciden con `linea-base/` tras las excepciones textuales exactas autorizadas para escenarios 9 y 8i; el control negativo rechazó una modificación adicional de 8i.
