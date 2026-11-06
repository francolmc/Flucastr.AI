# task-05 — Informe final con recomendación «vale la pena / no»
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
Reúne medición, análisis, mecanismos y prueba en `informe.md` y emite la recomendación «vale la pena» o «no» según el criterio del diseño, con el riesgo de contexto desactualizado. Es solo informe: no cambia ninguna regla, prompt, skill ni agente. La decisión caché sí/no es de Franco (puerta aparte); si es «sí» o si hay que recortar prompts, sale como feature `producto` nueva.

## Contexto
- Leer: `features/F43-auditoria-contexto/analisis.md`, `features/F43-auditoria-contexto/prueba.md`, `definitions/F43-AUDITORIA.md@25-8`
- Tocar: `features/F43-auditoria-contexto/informe.md`
- Criterio «vale la pena» (de `definitions/F43-AUDITORIA.md` §3): ahorro medido ≥20 % de los bytes de entrada del rol en la prueba, y mecanismo verificable (hash o fecha del archivo fuente en el resumen), y ningún prompt sube sobre su tope. Si falta alguno: «no». Umbral 20 % confirmado por Franco (2026-11-05).
- Riesgo de desactualizado: un «sí» exige que el resumen lleve el hash del original y que el rol lo descarte si no coincide; sin eso, «no».
- De `depende_de:` leer solo las *Notas* de task-04.
- Fuente: definitions/F43-AUDITORIA.md «3. Verificación de caché o resumen compartido»
- Requiere: ninguno

## Decisiones ya tomadas
- `informe.md` tiene: `## Resumen` (5 líneas máx.), `## Hallazgos` (top de fuentes y repetidas, con cifras de `analisis.md`), `## Prueba` (ahorro medido por herramienta, de `prueba.md`), `## Criterio` (los tres requisitos, cada uno cumple sí/no con su dato), `## Riesgo de desactualizado` y `## Recomendación`.
- `## Recomendación` contiene una sola línea que empieza exactamente por `Recomendación: vale la pena` o `Recomendación: no vale la pena`, seguida del motivo en una frase.
- Si task-04 no se ejecutó (sin autorización de Franco) o dio `n/d`, la recomendación es `Recomendación: no vale la pena` con ese motivo; no se estima el ahorro.
- Cierra con `## Siguiente`: si «sí», una feature `producto` nueva que toca `agentes/planificador.md` y `skills/descomponer-feature/SKILL.md` (ya tocados por F42) y requiere al `arquitecto`; si «no», cerrar F43 con este informe. Solo se propone, no se crea.
- No se edita `BACKLOG.md`, `STATUS.md` ni `definitions/`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: `informe.md`.
Fuera de alcance: cambiar reglas, prompts, skills, agentes, scripts o topes; crear la feature nueva; marcar F43 como `hecha`; el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Lee `analisis.md` y `prueba.md` y escribe `## Resumen`, `## Hallazgos` y `## Prueba` en `informe.md`.
3. Evalúa los tres requisitos del criterio con los datos y escribe `## Criterio`.
4. Escribe `## Riesgo de desactualizado` y `## Recomendación` (línea exacta).
5. Escribe `## Siguiente`.
6. Corre la verificación y copia la salida en *Evidencia*.

## Criterios de aceptación
1. Rama `chore/F43-auditoria-contexto` (comando 1).
2. `informe.md` tiene las seis secciones obligatorias y `## Siguiente` (comando 2).
3. Hay exactamente una línea de recomendación con la forma exigida (comando 3).
4. Esta tarea no cambió reglas, prompts, skills ni agentes: `agentes/`, `skills/`, `definitions/WORKFLOW.md` y `AGENTS.md` siguen sin diff (comando 4).

## Verificación
```
git branch --show-current
grep -c '^## Resumen\|^## Hallazgos\|^## Prueba\|^## Criterio\|^## Riesgo de desactualizado\|^## Recomendación\|^## Siguiente' features/F43-auditoria-contexto/informe.md
grep -c '^Recomendación: \(vale la pena\|no vale la pena\)' features/F43-auditoria-contexto/informe.md
git diff --stat -- agentes skills definitions/WORKFLOW.md AGENTS.md
```
Esperado: rama `chore/F43-auditoria-contexto`; `7`; `1`; salida vacía.

## Evidencia

```
$ git branch --show-current
chore/F43-auditoria-contexto
exit 0
$ grep -c '^## Resumen\|^## Hallazgos\|^## Prueba\|^## Criterio\|^## Riesgo de desactualizado\|^## Recomendación\|^## Siguiente' features/F43-auditoria-contexto/informe.md
7
exit 0
$ grep -c '^Recomendación: \(vale la pena\|no vale la pena\)' features/F43-auditoria-contexto/informe.md
1
exit 0
$ git diff --stat -- agentes skills definitions/WORKFLOW.md AGENTS.md
exit 0
```

Los cuatro comandos cumplen lo esperado: rama `chore/F43-auditoria-contexto`; `7`; `1`; salida vacía del `git diff --stat`.

## Notas

- Autorización: el encargo trae `Modo yolo: activo` y `Rama:` con la rama actual; `git branch --show-current` confirma `chore/F43-auditoria-contexto`. No se creó ni cambió de rama. Sin commit, push, PR, merge ni despliegue. No se escribió en `STATUS.md`.
- Reintento tras el bloqueo anterior: el planificador corrigió el comando 4 de la *Verificación* a `git diff --stat -- agentes skills definitions/WORKFLOW.md AGENTS.md`. Con ese comando la salida es vacía y la verificación pasa. Se quitó la nota del bloqueo anterior. `definitions/BACKLOG.md` y `definitions/STATUS.md` ya tenían cambios sin commit antes de F43; quedan fuera del comando y no se tocaron.
- Informe revisado contra los criterios de aceptación (seis secciones más `## Siguiente`, una sola línea de recomendación con forma exigida, `Recomendación: no vale la pena` con motivo). Cumple; no se reescribió.
- Huecos menores 1 a 3 (anotados en la primera ejecución, siguen vigentes; no son nuevos en esta):
- Hueco menor 1: el umbral de 20 % se evaluó sobre los ahorros reportados en `prueba.md`, que son tokens; el criterio pide bytes. Se anotó en *Criterio* del informe; no se estimó una conversión.
- Hueco menor 2: la condición «ningún prompt sobre su tope» queda `no evaluable`: el repo solo define un tope propuesto para `coordinador` (≤10 KB, F26, sin aprobar); hoy mide 7155 bytes; los otros roles no tienen tope.
- Hueco menor 3: `definitions/CONTEXTO.md` §1 cita un prompt del coordinador de 16 KB; el tamaño actual es 7155 bytes. Se informa en *Hallazgos*; no se corrigió (fuera de alcance).
- Informe en `features/F43-auditoria-contexto/informe.md`. Recomendación: no vale la pena (condición 2 no cumple: no hay resumen con hash o fecha del original; el ahorro medido es caché de prefijo del proveedor).
- Huecos nuevos en esta ejecución: 0.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=falla; huecos=3; resultado=bloqueada; causa=otra
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
