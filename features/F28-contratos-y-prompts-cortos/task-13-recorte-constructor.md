# task-13 — Recortar agentes/constructor.md a 3072 bytes
repo: Flucastr.AI   depende_de: task-12   estado: hecha

## Descripción
El `constructor` mide 3377 B y repite en `## Retorno` lo que `ejecutar-tarea` ya define en su propio `## Retorno`. Esta tarea lo lleva a 3072 B reduciendo cada uno de los cuatro estados a una línea y compactando redacción, sin quitar las frases exigidas por las pruebas, y baja su tope en la prueba de bytes.

## Contexto
- Tocar: `agentes/constructor.md`, `pruebas/comprobaciones/topes-bytes.test.mjs`
- Fuente: definitions/CONTRATOS.md «4. Prompts: núcleo corto + módulos bajo demanda»
- `agentes/constructor.md` (3377 B): `## Límites`, `## Skill`, `## Cómo trabajas` (paso 1 con el párrafo de `DECISION:` y `CONFIRMAR:`), `## Retorno` (cuatro viñetas), `## Qué lees`.
- Frases exigidas, con su prueba: `contrato-constructor.mjs` reglas 1, 2, 3, 4, 10, 13 y 17 (estado `aprobada`, «te detienes», «Nunca escribes hecha», «No haces commit, push, PR, merge ni despliegue», la de `STATUS.md`, `git switch -c`, `git branch --show-current`, la lista de comandos git prohibidos, `Modo yolo: activo`, «no creas rama», «ni local», la lista de cuatro estados y `PARCIAL: tarea=task-NN`); `puerta-previa.test.mjs` (`DECISION: tarea=task-NN; abiertas=<n>` y `Recomendada:`); `higiene-contexto.test.mjs` (`Lectura acotada:` y la frase del `edit`); manifiesto de F22 (lectura de `depende_de:`). Léelas en esos archivos antes de recortar.
- Lee solo las *Notas* de task-12.

## Decisiones ya tomadas
- `## Retorno`: una frase de apertura y los cuatro estados en una línea cada uno (`completed`, `partial`, `blocked`, `interaction_required`), con su primera línea literal y la remisión «El formato está en `ejecutar-tarea`».
- El paso 1 de `## Cómo trabajas` mantiene todas las condiciones (decisiones abiertas, `Rama:`, confirmación) pero en frases más cortas; no se pasa nada a `ejecutar-tarea`.
- El tope de `agentes/constructor.md` en `topes-bytes.test.mjs` pasa a 3072.
- Si no se llega a 3072 B sin quitar una frase exigida, la tarea queda `bloqueada` con `PARCIAL:` y la cifra lograda.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: un agente y una constante de prueba.
Fuera de alcance: `skills/ejecutar-tarea/SKILL.md`, los otros agentes y todo lo de `definitions/`.

## Pasos
1. Recorta `## Retorno` y `## Cómo trabajas` en `agentes/constructor.md`, midiendo con `wc -c`.
2. Corre `contrato-constructor.test.mjs`, `puerta-previa.test.mjs`, `higiene-contexto.test.mjs` y `contrato-roles.test.mjs`.
3. Cambia el tope a 3072 en `topes-bytes.test.mjs`.
4. Corre la prueba de bytes y la rápida.

## Criterios de aceptación
1. `agentes/constructor.md` mide 3072 B o menos.
2. Las cuatro pruebas de frases dan `ℹ fail 0` (los 6 fallos de `higiene-contexto` por el tamaño de `WORKFLOW.md` son ajenos y ya están en el `ℹ fail 7`).
3. `topes-bytes.test.mjs` da `ℹ fail 0` con tope 3072.
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
test $(wc -c < agentes/constructor.md) -le 3072 && echo "ok-constructor"; echo "exit $?"
node --test pruebas/comprobaciones/contrato-constructor.test.mjs pruebas/comprobaciones/puerta-previa.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ok-constructor`, `ℹ fail 0` en el segundo comando y `ℹ fail 7` en el último.

## Evidencia

```
$ test $(wc -c < agentes/constructor.md) -le 3072 && echo "ok-constructor"; echo "exit $?"
ok-constructor
exit 0
exit 0
```

```
$ node --test pruebas/comprobaciones/contrato-constructor.test.mjs pruebas/comprobaciones/puerta-previa.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
exit 0
```

## Notas
- Recorte solo de redacción en `agentes/constructor.md`: 3377 B a 2945 B. Límites, paso 1 de `## Cómo trabajas`, lectura acotada y `## Retorno` (cuatro estados en una línea cada uno, con la remisión a `ejecutar-tarea`) quedaron más cortos. No se quitó ninguna frase exigida por `contrato-constructor.mjs`, `puerta-previa.test.mjs`, `higiene-contexto.test.mjs` ni `frases-por-archivo.mjs`; el `tools:` y la descripción del frontmatter no cambiaron.
- Tope de `agentes/constructor.md` en `pruebas/comprobaciones/topes-bytes.test.mjs`: 3500 pasa a 3072. El tope real de hoy era 3500 (no 3377 como dice la tarea); el tamaño de 3377 B sí coincidía con el archivo.
- `higiene-contexto.test.mjs` da 6 fallos, todos por el tamaño de `definitions/WORKFLOW.md` (31298 caracteres frente a 30720), ajenos a esta tarea. La lectura acotada de `agentes/constructor.md` pasa.
- Verificación corrida desde la raíz del repo con un `cd` previo; el texto de cada `$` es el de *Verificación*.
- Huecos menores: 1 (la cifra del tope de hoy, 3500 frente a 3377 en la tarea).
Autocomprobación `node scripts/validar-tarea.mjs --evidencia`: salida 0, «OK: 1 tarea(s) con evidencia completa».
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
