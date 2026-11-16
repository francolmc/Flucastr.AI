# Tramo 118 — Conectar el lector del diagnóstico

## Pasos

### Tramo 118 — Historia: Conectar el lector del diagnóstico
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 117 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: skills/diagnosticar/diagnosticar.mjs, core/skills/diagnose/diagnosticar.mjs. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: skills/diagnosticar/diagnosticar.mjs, core/skills/diagnose/diagnosticar.mjs.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A118).
Aceptación A118: Ejecutar la matriz del tramo 112 y probar instalaciones por enlace, copia y paquete remoto offline, sin acceso al checkout en los dos últimos casos.
TODO:
- [ ] En `skills/diagnosticar/diagnosticar.mjs`, Reemplazar las dos funciones y constantes por el import local correspondiente en ambos entrypoints idénticos. (A118). Comprobación: Ejecutar la matriz del tramo 112 y probar instalaciones por enlace, copia y paquete remoto offline, sin acceso al checkout en los dos últimos casos.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A118). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
