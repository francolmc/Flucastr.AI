# task-02 — El coordinador cierra puertas y pausas con `CONTEXTO:`
repo: Flucastr.AI   depende_de: —   estado: borrador

## Descripción
Agregar a `agentes/coordinador.md` la regla de higiene de contexto aprobada: en cada puerta y pausa de pregunta, la última línea de «Espera a Franco» y de su respuesta es `CONTEXTO: sesion-nueva` (en yolo, `CONTEXTO: compactar`). Es una sugerencia que no bloquea.

## Contexto
- Leído: `agentes/coordinador.md` (secciones: Límites, Qué lees, Tabla de decisión, Cómo avanzas, Ramas por feature, Modo yolo, Comandos que puede correr, «Archivo y contexto», Bloqueos, Escalación, Formato de `STATUS.md`, Respaldo, «Antes de entregar» con la viñeta «Cierra con cinco líneas máximo y **di qué sigue**»).
- Leído: `definitions/WORKFLOW.md` §3, viñeta «Higiene de contexto», y `definitions/ARCHITECTURE.md`, sección «Higiene de contexto» (regla neutral, frase fija, solo esas dos formas, sin nombrar herramienta ni comando; límite: sugerencia, no puerta ni escalación).
- Comprobadores existentes que fijan frases de este archivo: `pruebas/comprobaciones/contrato-roles.mjs` (reglas 5 y 9–15: `BLOQUEO: rol=<rol>; motivo=<motivo>`, `Rama: <prefijo>/Fxx-nombre`, `CONFIRMAR: accion=git switch <rama>; motivo=<motivo>`, `REFINAR: feature=Fxx; preguntas=<n>`, frases de yolo, `features/completed/`, `node scripts/registrar.mjs`, patrones `Bash(...)` del front matter). No se debe alterar ninguna.
- Se prueba con `node pruebas/comprobaciones/contrato-roles.test.mjs` (contrato real sobre `agentes/`) y `bash pruebas/rapida.sh`.

## Decisiones ya tomadas
- Archivo único: `agentes/coordinador.md`. Sección nueva `## Higiene de contexto`, colocada justo antes de `## Bloqueos`.
- Texto de la sección (literal, sin variantes):
  «En cada puerta (1 a 4) y en cada pausa de pregunta (`CONFIRMAR:`, `REFINAR:`), la **última línea** de «Espera a Franco» en `STATUS.md` y la última línea de tu respuesta es, literal, `CONTEXTO: sesion-nueva`: el estado vive en `STATUS.md` y en los archivos, así que Franco puede cerrar la sesión y abrir otra sin perder nada. En modo yolo, al detenerte o terminar, esa línea es `CONTEXTO: compactar` (la vigencia de yolo no cruza sesiones). Es una sugerencia: no bloquea, no cambia estados y no nombras herramienta ni comando; solo Franco abre sesiones o compacta.»
- En «Antes de entregar» se añade una viñeta: «En una puerta o pausa, la última línea de tu respuesta es la línea `CONTEXTO:` (excepción a «cinco líneas máximo»).»
- No se cambia el front matter, la tabla de decisión ni ningún otro texto.

## Alcance / Fuera de alcance
Alcance: la sección nueva y la viñeta, en `agentes/coordinador.md`.
Fuera de alcance: quitar la línea de `modelos.json` (task-03), pruebas (task-06), `WORKFLOW.md`, `README.md`, otros agentes, `instalar.sh`.

## Pasos
1. Insertar la sección `## Higiene de contexto` con el texto exacto antes de `## Bloqueos`. Resultado: `grep -n "CONTEXTO: sesion-nueva" agentes/coordinador.md` muestra una línea.
2. Añadir la viñeta a «Antes de entregar». Resultado: `grep -c "CONTEXTO:" agentes/coordinador.md` ≥ 3.
3. Correr la verificación y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. El archivo contiene literal `CONTEXTO: sesion-nueva` y `CONTEXTO: compactar` (`grep -c`).
2. La sección está antes de `## Bloqueos` (`grep -n "^## " agentes/coordinador.md`).
3. `node --test pruebas/comprobaciones/contrato-roles.test.mjs` termina con `fail 0`.
4. `git diff --stat` muestra solo `agentes/coordinador.md` como tocado por esta tarea.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -n "CONTEXTO: sesion-nueva\|CONTEXTO: compactar" agentes/coordinador.md
grep -n "^## " agentes/coordinador.md
node --test pruebas/comprobaciones/contrato-roles.test.mjs
```
Esperado: dos líneas con las frases; `## Higiene de contexto` justo antes de `## Bloqueos`; `fail 0`. (El `contrato-roles.test.mjs` existe; no ejecutado por el planificador tras el cambio.)

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
