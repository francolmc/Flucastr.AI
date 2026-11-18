# Tramo 2 — Prompts de ejecución y revisión

## Pasos

### Tramo 2 — Historia: instrucciones internas de kit run en inglés

Como persona que usa `kit run`, quiero que las instrucciones enviadas a los agentes estén en inglés para mantener coherencia con sus instrucciones operativas.

Dependencias: Tramo 1, que conserva los identificadores y señales de los agentes. Node y Bash disponibles.

Contratos a conservar: nombres de claves del esquema JSON, valores `APROBADO`, `DEVUELTO`, `PAUSA` y `COMPLETADO`, nombre instalado `ejecutar-plan`, ruta y tramo exactos del plan, límite y contenido del diff, salida de verificación y defectos recibidos, número de reintentos, código de salida y mensajes visibles en español.

Rutas susceptibles de cambio: `tools/run/prompts.mjs`, `scripts/kit-run.mjs` y las pruebas citadas se editan sin moverlas ni archivarlas.

Ejemplo concreto del resultado esperado: al fallar verify, el constructor recibe una indicación correctiva en inglés con el código y la salida reales; tras `DEVUELTO` recibe los defectos JSON sin alterarlos. El usuario sigue viendo `kit-run: verificación`.

Alcance: los dos archivos de producto listados, la evaluación `pruebas/revisor-luna/medir.mjs` y pruebas de `pruebas/kit-run/`.

Archivos: tools/run/prompts.mjs, scripts/kit-run.mjs

CUANDO `kit run` invoca o relanza al constructor y consulta al revisor ENTONCES las instrucciones están en inglés y el flujo conserva sus contratos y mensajes visibles (A2).

Aceptación:
- A2: ejecutar `node pruebas/kit-run/probar.mjs` y `./verify`; esperar éxito, incluyendo reintentos por fallo y rechazo, validación de veredictos y conservación de instrucciones y datos. Una prueba de sensibilidad debe fallar al retirar temporalmente una instrucción obligatoria del prompt, sin guardar la mutación.

TODO:
- [x] Traducir las instrucciones de `tools/run/prompts.mjs` sin alterar claves ni valores de protocolo (A2). Comprobación: inspeccionar prompts emitidos; esperar ruta, tramo, esquema y diff originales.
- [x] Traducir exclusivamente las instrucciones correctivas enviadas al constructor en `scripts/kit-run.mjs` (A2). Comprobación: ejecutar `node pruebas/kit-run/probar.mjs`; esperar evidencia de reintentos y mensajes visibles españoles.
- [x] Sincronizar el prompt de `pruebas/revisor-luna/medir.mjs` con el productivo (A2). Comprobación: comparar ambos prompts con el mismo plan, diff y esquema; esperar las mismas instrucciones.
- [x] Adaptar y ampliar `pruebas/kit-run/probar.mjs` para observar prompts, reintentos y sensibilidad (A2). Comprobación: `node pruebas/kit-run/probar.mjs`; esperar éxito y fallo de la mutación aislada.

Verificación del tramo: `./verify` — nivel 2, por ausencia de comprobación rápida declarada; exit 0, cubre A2.

Handoff: no traducir datos de diagnóstico ni defectos provenientes de herramientas; solo la instrucción que los introduce. Conservar casos negativos y explicar la prueba de sensibilidad en Evidencia.

## Evidencia

- `node pruebas/kit-run/probar.mjs`: 21 casos pasaron fuera del sandbox; se compararon los prompts y esquemas, los reintentos y los datos, y se comprobó que retirar en memoria la instrucción de solo lectura provoca un fallo de la aserción.
- `node pruebas/revisor-luna/medir.mjs --autoprueba`: AUTOPRUEBA OK fuera del sandbox. Dentro del sandbox ambas ejecuciones quedaron esperando y se interrumpieron.
- `./verify`: exit 0, `VERIFY OK`; 21 casos de kit run incluidos.

## Notas

- Revisión independiente: A2 cumplido; `./verify` finalizó con `VERIFY OK` y exit 0. Veredicto: APROBADO.
