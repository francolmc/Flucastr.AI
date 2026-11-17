# Tramo 138 — Documentar decisiones de estructura

## Pasos

### Tramo 138 — Historia: Documentar decisiones de estructura
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 137 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: docs/decisions/structure.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: docs/decisions/structure.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A138).
Aceptación A138: Comprobar que cada ruta mencionada existe o está indicada expresamente como histórica o propuesta.
TODO:
- [x] En `docs/decisions/structure.md`, Describir estructura implementada, copias regulares y sus verificaciones, rutas heredadas, límite de 300 líneas y excepciones justificadas, y no traslado de históricos. (A138). Comprobación: Comprobar que cada ruta mencionada existe o está indicada expresamente como histórica o propuesta.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A138). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: creado `docs/decisions/structure.md`. La inspección de rutas comprobó 43 rutas implementadas existentes, 3 rutas históricas existentes y 3 destinos propuestos ausentes, expresamente rotulados como históricos o propuesta (`exit 0`). `node tools/verify/core-compatibility.mjs` y `git diff --check -- docs/decisions/structure.md` terminaron `exit 0`. El documento identifica las 15 parejas inventariadas, el control específico y su integración en `./verify`; justifica la excepción de 322 líneas de `instalar-remoto.sh` con la evidencia aprobada en tramo 100 y explica la conservación de la CLI en `scripts/uso.mjs` (318 líneas).
- Paso 2: `$ timeout 71 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó `exit 0` en 37,9 s. `./verify` coincide con la línea base salvo las sustituciones textuales exactas autorizadas de escenarios 9 y 8i; las dos simulaciones de instalación son repetibles y coinciden bajo esas mismas excepciones. El control negativo adicional de 8i fue rechazado. Receta aislada del tramo 1; referencia intacta.
