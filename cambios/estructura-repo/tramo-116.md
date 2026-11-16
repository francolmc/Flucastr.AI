# Tramo 116 — Separar lectura de resultados del diagnóstico

## Pasos

### Tramo 116 — Historia: Separar lectura de resultados del diagnóstico
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 115 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: skills/diagnosticar/result.mjs. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: skills/diagnosticar/result.mjs.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A116).
Aceptación A116: Comparar los resultados del módulo con los de la matriz del tramo 112, incluidos JSON inválido y sin evidencia.
TODO:
- [ ] En `skills/diagnosticar/result.mjs`, Copiar sin cambios validarResultado y leerResultado, con las constantes NIVELES y FALLOS, e importar existsSync y readFileSync de node:fs, join de node:path y huellaActual de ./fingerprint.mjs; exportar ambas funciones y conservar temporalmente los originales. Comparar directamente ambos resultados en fixtures equivalentes, sin comparar objetos internos con la salida textual del CLI. (A116). Comprobación: Comparar los resultados del módulo con los de la matriz del tramo 112, incluidos JSON inválido y sin evidencia.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A116). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
