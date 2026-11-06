# Controles negativos conservados

- **Contrato B/M/R**: `node --test --test-concurrency=1 pruebas/comprobaciones/contrato.test.mjs` prueba salidas faltantes, AGENTS vacío, estado no borrador, canario, cambio fuera de rutas permitidas, sintaxis/reconstrucción/segunda ejecución de `initialize.sh`, remoto/rama incorrectos, repos ausentes del diagrama y flecha `front`→`api` ausente en M.
- **Preflight de agente instalado**: `node --test --test-concurrency=1 pruebas/comprobaciones/agente-instalado.test.mjs` verifica que el control rechace agentes instalados obsoletos para Claude y Pi.
- **Registro y seguridad**: los controles en `registro.test.mjs` y `registro.e2e.test.mjs` permanecen sin recorte; incluyen lecturas `.env`, ejecución de `initialize.sh`, canario y registros inválidos.
- **Capa 1**: I1–I6 y sus controles negativos permanecen en `pruebas/capa1/instalacion.test.mjs`.
