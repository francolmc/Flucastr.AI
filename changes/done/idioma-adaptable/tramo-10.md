# Tramo 10 — Código histórico, segundo grupo

## Pasos

### Tramo 10 — Historia: anonimizar otras tres utilidades históricas

Como persona que reutiliza el repositorio quiero referencias históricas anónimas sin afectar la funcionalidad conservada para que el kit sea reutilizable.

Dependencias: Tramo 9, para aplicar seudónimos coherentes a las mismas entidades.

Contratos a conservar: funciones, formatos, cifras, cronología y resultados de pruebas históricas; no tocar credenciales ni historial Git.

Rutas susceptibles de cambio: los tres scripts mantienen su ubicación; se actualizan pruebas históricas afectadas sin moverlas.

Ejemplo concreto del resultado esperado: referencias al mismo proyecto usan el seudónimo ya registrado en el tramo anterior.

Alcance: tres scripts listados y pruebas o fixtures afectados en `old/v1/pruebas/`.

Archivos: old/v1/scripts/informe.mjs, old/v1/scripts/pistas.mjs, old/v1/scripts/registrar.mjs

CUANDO se examinan los ejemplos de estos scripts ENTONCES están anonimizados y conservan sus contratos (A10).

Aceptación:
- A10: revisión contextual de coincidencias de los tres scripts, pruebas históricas relacionadas y `./verify`; esperar sustituciones coherentes, resultados históricos preservados y verificación exitosa.

TODO:
- [x] Anonimizar ejemplos en `old/v1/scripts/informe.mjs` (A10). Comprobación: revisar diff y ejecutar pruebas relacionadas; esperar mismo contrato.
- [x] Anonimizar ejemplos en `old/v1/scripts/pistas.mjs` (A10). Comprobación: revisar diff y ejecutar pruebas relacionadas; esperar mismo contrato.
- [x] Anonimizar ejemplos en `old/v1/scripts/registrar.mjs` (A10). Comprobación: revisar diff y ejecutar pruebas relacionadas; esperar mismo contrato.
- [x] Ajustar fixtures afectados en `old/v1/pruebas/comprobaciones/` (A10). Comprobación: ejecutar las pruebas históricas relacionadas; esperar éxito sin debilitar aserciones.

Verificación del tramo: `./verify` — nivel 2 por falta de comprobación rápida declarada; exit 0, cubre A10.

Handoff: reutilizar el mapa de seudónimos; registrar únicamente referencias necesarias para los siguientes tramos sin publicar información nueva.

## Evidencia

- `git diff --check`: exit 0. `node --test old/v1/pruebas/comprobaciones/informe*.test.mjs old/v1/pruebas/comprobaciones/registro.test.mjs`: 52 pruebas aprobadas, exit 0. No fue necesario modificar fixtures.
- Se conserva el valor histórico `franco` en el contrato de eventos y se aclara su significado; cambiarlo alteraría los datos históricos.
- Comprobación ampliada: pruebas antiguas de `capa1/registrar.test.mjs` y `registro.e2e.test.mjs` presentaron fallos fuera del alcance; la primera esperaba un modelo de prueba distinto del resuelto y la segunda depende de un agente antiguo instalado. El cambio de `registrar.mjs` modifica solo un comentario.
- `./verify`: exit 0, `VERIFY OK`; la autoprueba offline OpenSpec se omitió por ausencia de su carpeta, como consta en el proyecto.

## Notas

- Punto de control: se modificaron únicamente los tres scripts previstos; se generalizaron cuatro textos visibles y se documentó el valor histórico de eventos. Las 52 pruebas focalizadas y `./verify` pasaron. La revisión independiente de A10 queda pendiente; considerar los fallos de la comprobación ampliada al revisar.
