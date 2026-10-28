# Pruebas del agente `arquitecto`

- Etapa 1 (I1–I6): `node --test pruebas/capa1/instalacion.test.mjs`.
- Etapa 2: genera B/M/C/R con `pruebas/fixtures/{basico,medio,complejo,real}.sh DIRECTORIO`.
- Fixtures fuera del repo de pruebas, sin dependencias, remotos bare locales; `.env` lleva canario aleatorio.
- Comprueba los controles negativos del núcleo: `node pruebas/comprobaciones/escenario.mjs`.
- Los casos adversos persistentes están definidos en `pruebas/comprobaciones/escenario.mjs` y documentados como tabla de casos en `casos-negativos.md`.
- Verificación de sintaxis: `bash -n pruebas/ejecutar.sh pruebas/fixtures/*.sh`.
- `pruebas/ejecutar.sh ESCENARIO HERRAMIENTA [N] [COMANDO [ARG...]]` prepara el fixture y genera antes de invocar el comando una instantánea única en el directorio temporal padre (`.instantanea-inicial.json`), mediante `comprobaciones/instantanea.mjs`. Incluye hashes del árbol fuera de `definicion/` y HEAD, rama y referencias de cada repo. Nunca se permite omitir la comprobación por ausencia de instantánea.
- Los tests B/M usan el mismo módulo compartido para crear y verificar la instantánea. Comprobación común: ningún commit nuevo ni cambio de rama o referencias.
- El analizador Mermaid cubre aristas etiquetadas `A -- "texto" --> B` y `A -->|"x"| B -->|"y"| C`, además de `A -->|"texto"| B`. No se pretende analizar toda la gramática Mermaid (por ejemplo, subgrafos, enlaces con índices ni sintaxis de flechas distintas de las cubiertas).
- Las comprobaciones específicas B/M/C/R y sus controles negativos: `node --test pruebas/comprobaciones/escenarios.test.mjs`; el ejecutor también evalúa cada escenario.
- Solo queda pendiente el análisis del registro estructurado de Claude/Pi (lecturas de `.env` y ejecución de `clonar.sh` por el agente); no se asume su formato.
- La estructura de React Router v7 del fixture B no se verificó contra la plantilla oficial vigente; queda anotada como no verificada, sin consultar red.
- R usa clon local fijado en `4b7b074`; falla de forma explícita si el commit no está disponible, sin usar red.
- Esta etapa no ejecuta escenarios ni guarda resultados de corridas con modelos.
