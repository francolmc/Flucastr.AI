# task-04 — Pruebas de contrato: frases de F21 en el `coordinador` para Pi y Claude Code
repo: Flucastr.AI   depende_de: task-03   estado: aprobada

## Descripción
Las reglas de task-01 a 03 viven solo en texto; la prueba debe fallar si alguien las quita. Se agrega una regla 16 al validador `validarRoles` con las frases literales de F21, sus controles negativos, y una prueba nueva que genera el agente del `coordinador` para Pi y para Claude Code con `scripts/resolver.mjs` y comprueba las mismas frases y un tope de tamaño. Verifican el **texto**, no el comportamiento (`definitions/CONTEXTO.md` §3).

## Contexto
- Leer `pruebas/comprobaciones/contrato-roles.mjs` (`validarRoles`; reglas 1-15; la 15 es la última, antes de `return errores`) y `pruebas/comprobaciones/contrato-roles.test.mjs` (`muestra()` líneas ~30-80, listas `variantes…` con `for … test(…)`, y la prueba final sobre archivos reales, líneas ~275-292).
- Salida del generador, confirmada: `node scripts/resolver.mjs agente-claude agentes/coordinador.md` imprime front matter, `# flucastr-ai:generado …`, la línea `Herramienta: Claude Code | Modelo: … | Agente: coordinador` y el cuerpo; `agente-pi` hace lo mismo con la herramienta Pi (el cuerpo es idéntico).
- Esquema de pruebas de texto: `pruebas/comprobaciones/coordinador-status.test.mjs` (`node:test`, `leer`, `sinLineas`).
- `pruebas/rapida.sh` ejecuta `pruebas/comprobaciones/*.test.mjs` por glob: el archivo nuevo entra solo.
- Tocar: `pruebas/comprobaciones/contrato-roles.mjs`, `pruebas/comprobaciones/contrato-roles.test.mjs`, `pruebas/comprobaciones/coordinador-turnos.test.mjs` (nuevo).

## Decisiones ya tomadas
- `contrato-roles.mjs` exporta `FRASES_COORDINADOR_F21` (arreglo de estas 11 cadenas exactas, las de task-01 a 03) y la regla 16 agrega un error `El agente «coordinador» debe contener la frase «<frase>».` por cada una ausente: `Lectura de tareas: con \`Read\` y \`limit: 3\` lees solo las 3 primeras líneas`; `No lees \`definitions/\` salvo \`STATUS.md\` y \`BACKLOG.md\``; `No lees tareas \`hecha\``; `Tarea completa solo en la revisión del modo yolo`; `Reescribes \`STATUS.md\` solo en puertas y en cambios de rol`; `con \`Edit\` por sección, no con \`Write\` completo`; `cada ítem ≤150 caracteres`; `Agrupa en un mismo turno las llamadas independientes`; `actívala una vez por sesión; si \`subagent\` ya funcionó, no la repitas`; `Plantilla de encargo`; `no uses \`contact_supervisor\` para preguntar: ante falta de información responde \`BLOQUEO:\` o \`REFINAR:\``.
- `muestra()` agrega esas 11 frases a `coordinador` (una por línea) para que la muestra válida siga sin errores.
- Control negativo por frase (patrón de `variantesF07`): quitar la frase y esperar un error que la mencione.
- `coordinador-turnos.test.mjs`: con `spawnSync('node', ['scripts/resolver.mjs', orden, 'agentes/coordinador.md'])` para `agente-claude` y `agente-pi` (cwd = raíz del repo, como `RAIZ` en las otras pruebas), comprueba que cada salida contiene las 11 frases, que la línea `Herramienta: ` está y que el cuerpo del archivo `agentes/coordinador.md` mide ≤ 17920 bytes. Caso negativo: la misma comprobación sobre el texto con una frase quitada devuelve error.

## Alcance / Fuera de alcance
Alcance: la regla 16, `muestra()`, sus negativos y la prueba nueva.
Fuera de alcance: cambiar texto de `agentes/*.md` o `skills/` (si falta una frase, es un hueco de task-01 a 03: se anota en *Notas* y la tarea queda `bloqueada`); frases de planificador, constructor y arquitecto (F22); `formato-tarea.mjs` y `archivar.mjs` (F23); correr modelo.

## Pasos
1. `contrato-roles.mjs`: exportar `FRASES_COORDINADOR_F21` y agregar la regla 16.
2. `contrato-roles.test.mjs`: agregar las frases a `muestra()` y los 11 negativos.
3. Crear `coordinador-turnos.test.mjs` (Pi, Claude Code, tope y negativo).
4. Correr las verificaciones.

## Criterios de aceptación
1. Sobre el repo real, `contrato-roles.test.mjs` pasa (incluida la prueba de archivos reales).
2. Quitar cualquiera de las 11 frases hace fallar la regla 16 (11 negativos pasan).
3. `coordinador-turnos.test.mjs` pasa para Pi y para Claude Code.
4. `bash pruebas/rapida.sh` termina con código 0 y S ≤ 30.

## Verificación
- `node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs` → `fail 0`.
- `node --test pruebas/comprobaciones/coordinador-status.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs` → `fail 0`.
- `bash pruebas/rapida.sh` → código 0 y `rapida: … (tope 30 s)` con S ≤ 30.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
