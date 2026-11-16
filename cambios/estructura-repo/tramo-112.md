# Tramo 112 — Caracterizar script de diagnóstico (borrador)

## Pasos

### Tramo 112 — Historia: Caracterizar script de diagnóstico
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 111 revisado; aislamiento y referencia del tramo 1; compatibilidad del tramo 82. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: una carpeta inexistente produce un error en texto o JSON y código 0, como establece el entrypoint actual.
Alcance: skills/diagnosticar/diagnosticar.mjs; pruebas y evidencias pertinentes.
Archivos: sin cambios de producto.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A112).
Aceptación A112: Ambas rutas producen resultados equivalentes con fixtures aislados y no escriben en ellos. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] En `cambios/estructura-repo/tramo-112.md` registrar los comandos y las salidas de `node skills/diagnosticar/diagnosticar.mjs <fixture>` y con `--json`, y repetir con `core/skills/diagnose/diagnosticar.mjs`, usando la misma ruta temporal para que la salida textual sea comparable (A112). Incluir carpeta inexistente, árbol vacío, repo sintético sin HEAD y repo con HEAD y cambios en producto y `cambios/`; medir antes y después el estado de cada árbol. Comprobación: ambos entrypoints devuelven las mismas salidas y código 0; ningún árbol cambia.
- [ ] Ejecutar `node --test pruebas/diagnostico-sugiere/*.test.mjs` en el aislamiento y registrar el resultado en `cambios/estructura-repo/tramo-112.md` (A112). Comprobación: las pruebas de huella vigente, obsoleta y sin HEAD pasan sin alterar las pruebas existentes.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A112). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
