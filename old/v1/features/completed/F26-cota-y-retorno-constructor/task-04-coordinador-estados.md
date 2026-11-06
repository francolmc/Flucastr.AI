# task-04 — Coordinador: qué hace ante cada estado del constructor
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
El `coordinador` debe tratar `PARCIAL:` y llevar sus opciones cerradas a Franco sin reabrir al `arquitecto`. En modo normal es una pregunta a Franco (como `DECISION:`); en yolo equivale a `bloqueada` y el modo se detiene. El archivo está al límite de tamaño: hay que recortar redacción.

## Contexto
- Tocar: `agentes/coordinador.md`, `pruebas/comprobaciones/contrato-roles.mjs`, `pruebas/comprobaciones/contrato-roles.test.mjs`
- `agentes/coordinador.md` mide 17887 bytes; tope 17920 (`pruebas/comprobaciones/coordinador-turnos.test.mjs`, 33 libres). Líneas: 44 (fila `DECISION:`), 65 (`Devuelve:`), 99 (yolo regla 5), 100 (yolo regla 6), 59 (paso 2 de «Cómo avanzas», con la frase `La conversación se puede compactar o cerrar entre un turno y otro: el estado vive en el archivo, no en tu memoria.`, ninguna prueba la exige).
- `contrato-roles.mjs`: reglas numeradas con comentario `// Regla N`, la 9 en línea 168; `contrato-roles.test.mjs`: `variantesF05` (línea 156) y la muestra sintética con texto del coordinador (línea 59).
- Formato `PARCIAL:` en `skills/ejecutar-tarea/SKILL.md` «Retorno» (task-02); leer solo las *Notas* de task-03.

## Decisiones ya tomadas
- Fila de la línea 44: pasa a cubrir `DECISION: …` y `PARCIAL: tarea=task-NN; hecho=<n>; falta=<n>`. Mismo tratamiento: registra en «Espera a Franco», pregunta a Franco, te detienes, no reabres al `arquitecto`. Con `PARCIAL:` la tarea queda `bloqueada` y la respuesta de Franco la devuelve a `aprobada` antes de delegar con `Decisión de Franco:`.
- Yolo: regla 5 añade `PARCIAL:` a las escalaciones; regla 6 pasa a `Si el constructor respondió BLOQUEO: o PARCIAL:, o la causa fue verificacion_x2, la tarea queda bloqueada y el modo se detiene.` (más corta que hoy). `BLOQUEO:` con `causa=verificacion_x2` sigue la regla de `BLOQUEO:` existente.
- Línea `Devuelve:` añade `PARCIAL:`.
- Recorte obligatorio: quitar la frase del paso 2 citada arriba y cualquier otra redacción redundante hasta quedar ≤ 17900 bytes. No tocar `tools:` ni las 11 frases de F21.
- Regla 18 en `contrato-roles.mjs`: el coordinador contiene `PARCIAL: tarea=task-NN; hecho=<n>; falta=<n>`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: las ediciones de `coordinador.md` y la regla 18 con muestra y variante.
Fuera de alcance: `definitions/` (`WORKFLOW.md` §6 y `ARCHITECTURE.md` no cambian), la skill, `scripts/`, `tools:`.

## Pasos
1. Editar `coordinador.md` según las decisiones (fila, reglas 5 y 6, `Devuelve:`) y recortar.
2. Añadir la regla 18 en `contrato-roles.mjs`; añadir la frase a la muestra del test y una variante en `variantesF05` cuyo error mencione la frase.
3. Correr la verificación.

## Criterios de aceptación
1. `coordinador.md` contiene la frase de `PARCIAL:` y mide ≤ 17900 bytes. Con `wc -c`.
2. Sin la frase, la regla 18 falla (control negativo).
3. `tools:` y las 11 frases de F21 intactas: `coordinador-turnos.test.mjs` pasa.
4. La rápida no suma fallos.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs
grep -c 'PARCIAL: tarea=task-NN; hecho=<n>; falta=<n>' agentes/coordinador.md
wc -c agentes/coordinador.md
bash pruebas/rapida.sh
```
Esperado: el primero termina con `ℹ fail 0`; el segundo imprime `1`; el tercero un tamaño de a lo más 17900 seguido de `agentes/coordinador.md`; la rápida deja exactamente `ℹ fail 7` (ajenos: BACKLOG real y 6 de higiene de contexto).

## Evidencia

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs
ℹ tests 61
ℹ suites 0
ℹ pass 61
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 148.841917
exit 0
```

```
$ grep -c 'PARCIAL: tarea=task-NN; hecho=<n>; falta=<n>' agentes/coordinador.md
1
exit 0
```

```
$ wc -c agentes/coordinador.md
   17897 agentes/coordinador.md
exit 0
```

```
$ bash pruebas/rapida.sh
ℹ tests 424
ℹ pass 417
ℹ fail 7
✖ definitions/BACKLOG.md real cumple el formato
✖ falla si falta la lectura acotada en constructor
✖ falla si falta la lectura acotada en ejecutar-tarea
✖ falla si un agente conserva la línea de modelos.json
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json
✖ falla si WORKFLOW.md pasa de 30720 caracteres
✖ los archivos reales cumplen la regla
exit 1
```

## Notas
- Pasada 1 de la verificación: al quitar la frase de «Cómo avanzas» paso 2 se perdió el salto de línea antes de «3. Delega.», y `coordinador-status` falló. Lo restauré; la pasada 2 es la válida (`intentos=2`). Error de edición mío.
- Recorte: quité «en el encargo» en la fila `DECISION:`/`PARCIAL:` (17910 → 17897 bytes).
- Yolo: sin rama, sin `git switch`, sin commit.
- Rápida: `exit 1` con exactamente las 7 ajenas esperadas (`ℹ fail 7`) = coincide con el Esperado; verificacion=pasa.
- Autocomprobación `node scripts/validar-tarea.mjs --evidencia`: salida real `OK: 1 tarea(s) con evidencia completa`, exit 0.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
