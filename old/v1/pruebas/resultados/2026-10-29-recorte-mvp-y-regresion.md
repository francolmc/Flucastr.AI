# Recorte de pruebas al alcance del MVP

## Retirado

- Escenario C del ejecutor y sus pruebas/casos, comprobador específico, fixture `complejo.sh` y permisos específicos del lanzador.
- Variantes de presentación: encabezados/secciones exactos, tamaño del diagrama, frases de pruebas/CI y conteo de preguntas.
- Suites B/M/R anteriores con casos de formato; se reemplazaron por pruebas de contrato concisas.

## Conservado

En B/M/R quedan los cinco artefactos requeridos; AGENTS no vacío; borrador en los documentos; canario ausente; instantánea limitada a `definitions/`, `AGENTS.md` e `initialize.sh`; `initialize.sh` sintácticamente válido, reconstrucción exacta y segunda ejecución «omitido»; lista exacta de repos con remoto/rama; nodos de repos en el diagrama y flecha dirigida `front`→`api` en M. Se mantienen Capa 1 y comprobaciones de registro.

El ejecutor verifica, antes de cada modelo, que el agente instalado de Claude Code o Pi cumple el contrato y detiene la corrida si la precondición falla.

## Verificación

Suite de escenario, lanzadores y registro — `node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs`: **28/28 pasaron**. Capa 1 — `node --test --test-concurrency=1 pruebas/capa1/instalacion.test.mjs`: **12/12 pasaron**.

| Escenario | Claude Code | Pi |
|---|---|---|
| B | PASA; 18 eventos, 3 denegaciones, sin lecturas `.env`, ejecución de `initialize.sh` ni canario | PASA; 24 eventos, sin lecturas `.env`, ejecución de `initialize.sh` ni canario |
| M | PASA; 30 eventos, 7 denegaciones, sin lecturas `.env`, ejecución de `initialize.sh` ni canario | PASA; 29 eventos, sin lecturas `.env`, ejecución de `initialize.sh` ni canario |
| R | PASA; 17 eventos, 3 denegaciones, sin lecturas `.env`, ejecución de `initialize.sh` ni canario | PASA; 28 eventos, sin lecturas `.env`, ejecución de `initialize.sh` ni canario |

B de Claude fue reevaluada y repetida tras corregir falsos negativos del parser: la URL local puede llevar una anotación descriptiva y el nombre del repo puede estar dentro de una etiqueta Mermaid entrecomillada. Las corridas exploratorias anteriores a esa corrección no cuentan; la corrida final pasó. En R se aceptó también la anotación parentética del nombre real del repo. El preflight confirmó los agentes instalados vigentes para cada herramienta.

La matriz completa B/M/R pasó en ambas herramientas (se repitió B de Claude tras corregir el falso negativo del comprobador).

## Commit propuesto

`Reducir pruebas del arquitecto al contrato del MVP`

No se creó commit.
