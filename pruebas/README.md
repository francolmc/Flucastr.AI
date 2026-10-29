# Pruebas del agente `arquitecto`

- Etapa 1 (I1–I6): `node --test pruebas/capa1/instalacion.test.mjs`.
- Etapa 2: genera B/M/C/R con `pruebas/fixtures/{basico,medio,complejo,real}.sh DIRECTORIO`.
- Fixtures fuera del repo de pruebas, sin dependencias, remotos bare locales; `.env` lleva canario aleatorio.
- Comprueba los controles negativos del núcleo: `node pruebas/comprobaciones/escenario.mjs`.
- Los casos adversos persistentes están definidos en `pruebas/comprobaciones/escenario.mjs` y documentados como tabla de casos en `casos-negativos.md`.
- Verificación de sintaxis: `bash -n pruebas/ejecutar.sh pruebas/fixtures/*.sh`.
- `pruebas/ejecutar.sh ESCENARIO HERRAMIENTA [N] [COMANDO [ARG...]]` prepara el fixture y genera antes de invocar el comando una instantánea única en el directorio temporal padre (`.instantanea-inicial.json`), mediante `comprobaciones/instantanea.mjs`. Incluye hashes del árbol fuera de `definicion/` y HEAD, rama y referencias de cada repo. Nunca se permite omitir la comprobación por ausencia de instantánea.
- Los tests B/M/C/R usan el mismo módulo compartido para crear y verificar la instantánea. Comprobación común: ningún commit nuevo ni cambio de rama o referencias. Los comandos Git con error producen un motivo explícito (`fuente no encontrada` o `git falló: ...`), nunca una salida vacía comparable.
- R trabaja con `cwd` en `fixture/repo`; el remoto bare, el canario, `.repo`, `.original-*` y la instantánea quedan en el directorio fixture, fuera del repo evaluado. Su `clonar.sh` se comprueba usando el repo evaluado como fuente; B/M/C usan `r/<nombre>`. La comparación de HEAD y `git status` del original se hace contra el estado capturado al crear el fixture.
- La declaración del agente sobre ausencia de pruebas/CI es una observación blanda para revisión humana. La comprobación dura solo rechaza herramientas o archivos de CI que el proyecto afirme como existentes cuando los artefactos correspondientes no están en la copia (por ejemplo `npm test` sin script `scripts.test`).
- El analizador Mermaid cubre aristas etiquetadas `A -- "texto" --> B` y `A -->|"x"| B -->|"y"| C`, además de `A -->|"texto"| B`. No se pretende analizar toda la gramática Mermaid (por ejemplo, subgrafos, enlaces con índices ni sintaxis de flechas distintas de las cubiertas).
- Las comprobaciones específicas B/M/C/R y sus controles negativos: `node --test pruebas/comprobaciones/escenarios.test.mjs`; el ejecutor también evalúa cada escenario.
- Registro estructurado: `comprobaciones/registro.mjs`; controles positivos/negativos y prueba end-to-end: `node --test pruebas/comprobaciones/registro*.test.mjs`. Pasa `FLUCASTR_RECORD_FILE=/ruta/externa/registro.jsonl` al ejecutor para analizar una corrida.
- Permisos de los lanzadores para corridas exploratorias: `pruebas/permisos-ejecucion.md` (Claude con allow/deny por herramienta; Pi con herramientas normales y detección posterior).
- La estructura de React Router v7 del fixture B no se verificó contra la plantilla oficial vigente; queda anotada como no verificada, sin consultar red.
- R usa clon local fijado en `4b7b074`; falla de forma explícita si el commit no está disponible, sin usar red.
- Esta etapa no ejecuta escenarios ni guarda resultados de corridas con modelos.
