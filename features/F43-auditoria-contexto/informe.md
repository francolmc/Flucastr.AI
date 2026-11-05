# F43 — Informe final de la auditoría de contexto

Fecha: 2026-11-05. Fuentes: `medicion.md` (task-01), `analisis.md` (task-02), `mecanismos.md` (task-03), `prueba.md` (task-04) y `definitions/F43-AUDITORIA.md` §3. Solo informe: no cambia reglas, prompts, skills, agentes ni topes.

## Resumen

- La medición y el análisis muestran que el contexto repetido más pesado está en `agentes/constructor.md`, `agentes/planificador.md`, `definitions/BACKLOG.md` y `definitions/WORKFLOW.md`, leídos por varios roles.
- La prueba real midió caché de prefijo del proveedor (Claude Code 100,0 %, Pi 46,3 %) entre dos lanzamientos seguidos con el mismo prompt. Eso no es un resumen compartido entre subagentes y no responde la pregunta de F43.
- No existe ningún resumen con hash o fecha del original en el repo, y ningún mecanismo verificado lo habilita. Sin eso el criterio falla.
- Muestra mínima: 2 corridas por herramienta, con método y modelo distintos entre Claude Code y Pi.
- Recomendación: no vale la pena, por falta del mecanismo verificable.

## Hallazgos

Fuente: `analisis.md`. Límite: solo se ven 34 de 658 filas de `medicion.md`; el resto está en `--json` y no se re-midió. Las cifras son KB leídos según la medición, no tamaño de archivo.

- Top del Top 10: `agentes/constructor.md` (861,3 KB, 311 lecturas), `agentes/planificador.md` (447 KB, 128), `definitions/BACKLOG.md` (303,1 KB, 34) y `definitions/WORKFLOW.md` (232,5 KB, 13).
- Repetidas entre roles (suma por archivo): `definitions/BACKLOG.md` 524,3 KB (3 roles), `definitions/WORKFLOW.md` 471,9 KB (3 roles), `agentes/coordinador.md` 328,7 KB (3 roles, sumado por dos formas de ruta).
- Huecos anotados en `analisis.md`: rutas absolutas y relativas no normalizadas por `scripts/contexto-fuentes.mjs`; rol `desconocido` contado como rol; filas 4 y 6 marcadas «sí (solo carpeta)»; y las filas fuera de las 34 visibles sin re-medir.
- Prompts (`wc -c`, hoy): `agentes/coordinador.md` 7155 bytes, `agentes/arquitecto.md` 3583, `agentes/planificador.md` 3576, `agentes/constructor.md` 2836. `definitions/CONTEXTO.md` §1 cita un prompt del coordinador de 16 KB; la cifra actual es menor, así que la de CONTEXTO está desactualizada.

## Prueba

Fuente: `prueba.md`. Prompt idéntico en las cuatro corridas. Ahorro = cacheRead de la segunda corrida / (input + cacheRead + cacheWrite) de la segunda.

| herramienta | corrida | input | cacheRead | cacheWrite | ahorro |
|---|---|---|---|---|---|
| claude-code | 1 | 4 | 36784 | 18882 | — |
| claude-code | 2 | 4 | 55666 | 0 | 100,0 % |
| pi (`openai/gpt-6-luna`) | 1 | 6080 | 0 | 0 | — |
| pi | 2 | 3264 | 2816 | 0 | 46,3 % |

Lo que esto significa y lo que no:

- Es caché de prefijo del proveedor entre dos lanzamientos seguidos con el mismo prompt. No es un resumen compartido entre subagentes, ni un caché propio del proyecto. No responde la pregunta de F43 (si un resumen o caché compartido reduce el contexto de los roles).
- El método difiere: Pi hizo una lectura de archivo por herramienta (respuesta `toolUse`), Claude Code no. Los modelos también son distintos (Claude Code frente a `openai/gpt-6-luna`). Las cifras no son comparables entre herramientas.
- Muestra mínima: 2 corridas por herramienta. Las cifras no permiten generalizar.
- Las cifras son tokens. El criterio de F43 pide bytes de entrada del rol; no se midió en bytes.
- El campo de caché venía en el log de ambas herramientas.

## Criterio

Umbral de `definitions/F43-AUDITORIA.md` §3: (1) ahorro medido ≥20 %, (2) mecanismo verificable (hash o fecha del archivo fuente en el resumen), (3) ningún prompt sobre su tope.

1. **Ahorro medido ≥20 %: cumple en cifra, no válido para F43.** 100,0 % (Claude Code) y 46,3 % (Pi) superan el 20 %, pero miden caché del proveedor con prefijo idéntico, no el mecanismo que F43 evalúa. No se puede usar para decidir sobre un resumen.
2. **Mecanismo verificable: no cumple.** No hay resumen en el repo ni se implementó en la prueba. `mecanismos.md` marca «resumen compartido entre subagentes» como *supuesto* sin verificar; la única coincidencia documentada de caché compartido es el fork de Claude Code con la sesión principal, que es caché del proveedor, no resumen. Ninguna fuente exige ni provee hash o fecha de un original.
3. **Ningún prompt sobre su tope: no evaluable.** El repo solo tiene tope propuesto para `coordinador` (≤10 KB, F26, no aprobado ni aplicado); no hay tope definido para los otros tres roles. Hoy `coordinador` mide 7155 bytes. Ningún prompt cambió en esta prueba.

Resultado: la condición 2 falla. La condición 3 no se puede evaluar con un tope aprobado.

## Riesgo de desactualizado

No aplica en la práctica porque no existe resumen. Si se propusiera uno, el criterio exige que lleve el hash del original y que el rol lo descarte si no coincide. Sin ese mecanismo, un resumen puede divergir del archivo vigente sin que nadie lo note; eso es el motivo de la condición 2.

## Recomendación

Recomendación: no vale la pena. Motivo: no existe un resumen con hash o fecha del original ni un mecanismo verificado que lo sostenga, y el ahorro medido es caché de prefijo del proveedor, no un resumen compartido.

## Siguiente

No. Cerrar F43 con este informe. No se propone feature `producto` nueva. La decisión caché sí/no queda para Franco según la puerta aparte de `definitions/F43-AUDITORIA.md`; esta recomendación es «no».
