> Los nombres personales y de proyectos de este documento histórico fueron anonimizados.

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
- [x] En `scripts/uso.mjs`, Sustituir únicamente el nombre de persona del comentario ejemplificativo por un nombre ficticio; si el comentario fue movido durante los tramos 101–107, aplicar en su destino efectivo. (A136). Comprobación: Ejecutar la matriz del tramo 101 y asegurar que el diff no cambia código ejecutable.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A136). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: `node pruebas/uso/probar.mjs` pasó 19/19 antes y después; las salidas capturadas coinciden byte a byte (`cmp`). El archivo previo y actual se compararon con `franco`→`ana`: exactamente dos ocurrencias sustituidas en un único comentario; todo el resto de `scripts/uso.mjs`, incluido el código ejecutable, es idéntico. `git diff --check -- scripts/uso.mjs` pasó. Captura posterior: `/tmp/tramo-136-uso-despues.out`.
- Paso 2: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó `exit 0` en ~38 s. `./verify` y las simulaciones aisladas coincidieron con la referencia y entre sí, conservando únicamente las sustituciones textuales exactas autorizadas de los escenarios 9 y 8i; el control negativo de una alteración adicional en 8i fue rechazado.
