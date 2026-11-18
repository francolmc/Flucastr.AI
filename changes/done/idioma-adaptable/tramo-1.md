# Tramo 1 — Instrucciones adaptables para agentes y skills

## Pasos

### Tramo 1 — Historia: instrucciones operativas en inglés

Como persona que usa el kit, quiero que las instrucciones internas estén en inglés y que los agentes usen el idioma de mi conversación para recibir respuestas comprensibles sin cambiar los contratos del kit.

Dependencias: ninguna. Requiere Node y Bash disponibles, como en la verificación inicial.

Contratos a conservar: permisos y prohibiciones, puertas de aprobación, roles, secuencia del trabajo, protección de secretos, criterios de parada, reglas de verificación, marcadores `COMPLETADO`, `PAUSA`, `APROBADO` y `DEVUELTO`, campos y encabezados de planes, rutas, nombres instalados de skills y ejemplos de comandos. No traducir identificadores interpretados por programas. Los mensajes generados por comandos siguen en español.

Rutas susceptibles de cambio: se modifica el contenido de las rutas existentes indicadas abajo; no se renombran ni archivan. Las pruebas que buscan texto literal se adaptan al texto nuevo conservando sus pruebas negativas.

Ejemplo concreto del resultado esperado: si una persona escribe en portugués, el agente responde en portugués; si después le pide español, responde en español. Un plan sigue usando `estado: aprobado` y un constructor comunica `COMPLETADO` conforme al contrato existente.

Alcance: instrucciones de `core/agents/`, `core/skills/`, `core/contracts/` y `core/recipes/`; copias correspondientes en `tools/core-compatibility.json`; verificaciones en `tools/verify/` y `pruebas/`. Las pruebas y documentos no cuentan como archivos de producto para el límite por tramo.

Archivos: core/agents/principal.md, core/agents/constructor.md, core/contracts/verificacion.md, core/recipes/node-pnpm.md

CUANDO se instalan y usan los agentes y skills ENTONCES sus instrucciones operativas están en inglés y los agentes se adaptan al idioma elegido por la persona, conservando los contratos existentes (A1).

Aceptación:
- A1: revisión de los documentos y ejecución de `./verify`; esperar instrucciones operativas en inglés, regla explícita de adaptación lingüística en ambos agentes, contratos intactos y salida `VERIFY OK`. Las pruebas negativas deben seguir fallando ante una mutación aislada que suprima la regla comprobada.

TODO:
- [x] Traducir `core/agents/principal.md` y añadir adaptación al idioma de la conversación (A1). Comprobación: revisión del documento; esperar reglas y señales anteriores conservadas.
- [x] Traducir `core/agents/constructor.md` y añadir adaptación al idioma de la conversación (A1). Comprobación: revisión del documento; esperar reglas y señales anteriores conservadas.
- [x] Traducir instrucciones en `core/skills/define-project/SKILL.md` (A1). Comprobación: revisión del documento; esperar identificadores y estructura de salida conservados.
- [x] Traducir instrucciones en `core/skills/design-experience/SKILL.md` (A1). Comprobación: revisión del documento; esperar identificadores y estructura de salida conservados.
- [x] Traducir instrucciones en `core/skills/diagnose/SKILL.md` (A1). Comprobación: revisión del documento; esperar identificadores y estructura de salida conservados.
- [x] Traducir instrucciones en `core/skills/execute-plan/SKILL.md` (A1). Comprobación: revisión del documento; esperar identificadores y estructura de salida conservados.
- [x] Traducir instrucciones en `core/skills/migrate-project/SKILL.md` (A1). Comprobación: revisión del documento; esperar identificadores y estructura de salida conservados.
- [x] Traducir instrucciones en `core/skills/plan-change/SKILL.md` (A1). Comprobación: revisión del documento; esperar identificadores y estructura de salida conservados.
- [x] Traducir instrucciones en `core/skills/prepare-project/SKILL.md` (A1). Comprobación: revisión del documento; esperar identificadores y estructura de salida conservados.
- [x] Traducir instrucciones en `core/skills/prepare-project/referencia.md` (A1). Comprobación: revisión del documento; esperar comandos e identificadores conservados.
- [x] Traducir instrucciones en `core/contracts/verificacion.md` (A1). Comprobación: revisión del documento; esperar nombres de capacidades y contratos conservados.
- [x] Sincronizar copias correspondientes de `tools/core-compatibility.json` con sus fuentes modificadas (A1). Comprobación: `node tools/verify/core-compatibility.mjs`; esperar exit 0.
- [x] Traducir instrucciones en `core/recipes/node-pnpm.md` (A1). Comprobación: revisión del documento; esperar comandos y resultados conservados.
- [x] Adaptar en `tools/verify/agent-contracts.sh` y las demás suites de `tools/verify/` las comprobaciones afectadas por el texto nuevo (A1). Comprobación: ejecutar las pruebas negativas existentes; esperar que rechacen una mutación que elimine la regla correspondiente.
- [x] Adaptar en `pruebas/contrato-constructor.mjs` y `pruebas/continuidad/protocolo.mjs` las comprobaciones literales afectadas (A1). Comprobación: ejecutar `./verify` (≈1 min); esperar `VERIFY OK` y conservación de los casos negativos.

Verificación del tramo: `./verify` — nivel 2, usado porque el proyecto no declara comprobación rápida; exit 0, cubre A1.

Handoff: mantener los textos de protocolo en español aunque el resto de las instrucciones esté en inglés. Registrar qué pruebas negativas se mutaron y su resultado; no modificar pruebas de aceptación fuera de este alcance ni debilitarlas.

## Evidencia

- `$ ./verify`: `ok A6: ambos agentes adaptan sus respuestas al idioma de la persona y las mutaciones negativas fallan`; pruebas negativas de contratos y tramos rechazadas; `VERIFY OK`; exit 0. Se omitió la autoprueba offline OpenSpec porque `pruebas/comparar-openspec/` no existe en este checkout.
- `$ node tools/verify/core-compatibility.mjs` y `$ git diff --check`: sin salida, exit 0.

- `$ node tools/verify/core-compatibility.mjs`: sin salida; exit 0. `$ git diff --check`: sin salida; exit 0.

- Revisión de `core/skills/execute-plan/SKILL.md`: instrucciones operativas en inglés; se conservan los marcadores, campos y estructura de salida del protocolo. `git diff --check -- core/skills/execute-plan/SKILL.md`: exit 0.
- Revisión de `core/skills/migrate-project/SKILL.md`: instrucciones operativas en inglés; se conservan comandos, nombres de skills, rutas, condiciones de aprobación y etiquetas de salida en español. `git diff --check -- core/skills/migrate-project/SKILL.md`: exit 0.
- Revisión de `core/skills/plan-change/SKILL.md`: instrucciones operativas en inglés; se conservan campos y encabezados del plan, marcadores de protocolo, identificadores y comandos. `git diff --check -- core/skills/plan-change/SKILL.md`: exit 0.
- Revisión de `core/skills/prepare-project/SKILL.md`: instrucciones operativas en inglés y la plantilla de salida permanece en español; se conservan rutas, nombres de capacidades, comandos y mensajes programáticos. `git diff --check -- core/skills/prepare-project/SKILL.md`: exit 0.
- Revisión de `core/skills/prepare-project/referencia.md`: comentarios orientativos del esqueleto en inglés; nombres de variables y rutas intactos, mensajes ejecutados por comandos en español. `git diff --check -- core/skills/prepare-project/referencia.md`: exit 0.
- Revisión documental de `core/agents/{principal,constructor}.md`, skills `define-project` y `diagnose`, contrato de verificación y receta Node/pnpm: instrucciones operativas en inglés; se conservan las rutas, nombres de skills instaladas, estados y señales de protocolo. `core/agents/principal.md` declara que responde en el idioma actual de la persona y cambia si este cambia. `git diff --check`: sin salida, exit 0.
- Revisión de `core/skills/design-experience/SKILL.md`: plantillas operativas y pasos en inglés; los ejemplos de interfaz permanecen como contenido localizable y el cierre solicita aprobación en el idioma actual de la persona.
- `bash tools/verify/agent-contracts.sh` con `T8` en `/tmp` y su función `fallo` configurados: las comprobaciones 8i, 8k, 8l y 8m pasaron; las mutaciones negativas de esos casos fueron rechazadas. `node pruebas/contrato-constructor.mjs`: exit 0; A1–A5 y A6 pasaron, incluidas las mutaciones negativas del idioma.

## Notas
- Reanudación autorizada por la persona usuaria tras la pausa de verificación; se mantiene `ejecutor: principal`.
- PAUSA `motivo=verify`: tres ejecuciones de `./verify` terminaron con exit 1; la primera en 8b y la segunda en 8j por verificaciones literales del texto anterior. Tras adaptar esas comprobaciones, la tercera superó 8j y sus mutaciones negativas, pero falló en 9a (`tools/verify/migration-contract.sh`), que todavía busca expresiones en español de la skill traducida. Queda pendiente adaptar esa suite y revisar otras posteriores con sus pruebas negativas, conservando los contratos; no se ejecutó la verificación posterior. El registro anterior de `node pruebas/contrato-constructor.mjs` exit 0 precede a la sincronización completa y no acredita el estado actual.
- Estado al detenerse: 32 archivos de producto y pruebas modificados; `cambios/idioma-adaptable/` sin seguimiento. Sin commit. La última casilla sigue pendiente y A1 no está verificado.
- Reanudación aprobada: se sincronizó `nucleo/contrato/verificacion.md` con `core/contracts/verificacion.md`; `cmp` y `git diff --check` pasan. `node tools/verify/core-compatibility.mjs` sigue fallando en el siguiente par (`core/agents/constructor.md`, `agentes/constructor.md`). El TODO de sincronización queda pendiente y `./verify` no se reintentó porque falta autorización para ampliar el alcance a las copias de compatibilidad restantes.
