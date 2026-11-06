# task-01 — Una sola pasada en arquitecto.md y definir-proyecto
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
El `arquitecto` produjo documentos de 130 KB con rondas sucesivas (síntoma S4). Esta tarea fija en su texto y en el de `definir-proyecto` una sola pasada por puerta, con tope de tamaño y las dudas restantes como «Decisiones para Franco» con opciones cerradas. Las frases quedan exactas para que task-03 las compruebe.

## Contexto
- Tocar: `agentes/arquitecto.md`, `skills/definir-proyecto/SKILL.md`
- `agentes/arquitecto.md` (3723 bytes) tiene `## Lectura acotada` en la línea 47; la sección nueva va justo antes.
- `skills/definir-proyecto/SKILL.md` tiene en la línea 22: `Si una respuesta abre otra duda importante, pregunta de nuevo antes de seguir.`
- No tocar `agentes/coordinador.md` (17897 bytes, tope 17920) ni `definitions/`.

## Decisiones ya tomadas
- Tope: 12288 bytes (12 KB) nuevos en `definitions/` por pasada, sumando todos los documentos.
- Frases exactas (sin cambiar una letra):
  - arquitecto: `Una sola pasada por puerta`, `devuelves el documento y nada más`, `no reabres preguntas`, `Otra ronda solo si Franco la pide`, `Decisiones para Franco`, `Tope de tamaño: 12288 bytes`, `Tamaño de la pasada:`.
  - definir-proyecto: `devuelves el documento y nada más`, `Decisiones para Franco`, `Tope de tamaño: 12288 bytes`.
- Las opciones cerradas son 2 o 3 (`A) B) C)`) con una recomendada.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: texto de dos archivos.
Fuera de alcance: las otras dos skills (task-02), el control en pruebas (task-03), el script de tamaño (task-04), `coordinador.md` y `definitions/`.

## Pasos
1. En `agentes/arquitecto.md`, antes de `## Lectura acotada`, inserta la sección `## Una sola pasada` con tres viñetas: (a) `Una sola pasada por puerta: devuelves el documento y nada más; no reabres preguntas ni propones otra ronda. Otra ronda solo si Franco la pide.` (b) `Si algo queda abierto, lo listas bajo «Decisiones para Franco» con 2 o 3 opciones cerradas (A, B, C) y una recomendada, en vez de iterar.` (c) `Tope de tamaño: 12288 bytes (12 KB) nuevos en definitions/ por pasada, sumando todos los documentos. Cierras con la línea «Tamaño de la pasada: <n> bytes».`
2. En `skills/definir-proyecto/SKILL.md`, reemplaza la línea 22 por: `Si una respuesta abre otra duda, no preguntes de nuevo: déjala en «Decisiones para Franco».`
3. En la misma skill, antes de la sección `## Formato de PROJECT.md`, añade el párrafo `**Una sola pasada:** devuelves el documento y nada más. Tope de tamaño: 12288 bytes por pasada en definitions/. Lo que quede abierto va en una sección «Decisiones para Franco» con opciones cerradas y una recomendada.`

## Criterios de aceptación
1. `agentes/arquitecto.md` contiene las 7 frases exactas; se comprueba con `grep`.
2. `skills/definir-proyecto/SKILL.md` contiene sus 3 frases y ya no contiene `pregunta de nuevo antes de seguir`.
3. `agentes/arquitecto.md` conserva `una vez por sesión` y `No lees` sobre `features/`.
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7` (7 fallos ajenos conocidos); no suma fallos nuevos.

## Verificación
```
grep -c -e 'Una sola pasada por puerta' -e 'devuelves el documento y nada más' -e 'no reabres preguntas' -e 'Otra ronda solo si Franco la pide' -e 'Decisiones para Franco' -e 'Tope de tamaño: 12288 bytes' -e 'Tamaño de la pasada:' agentes/arquitecto.md; echo "exit $?"
grep -c 'pregunta de nuevo antes de seguir' skills/definir-proyecto/SKILL.md; echo "exit $?"
grep -c -e 'Decisiones para Franco' -e 'Tope de tamaño: 12288 bytes' skills/definir-proyecto/SKILL.md; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `exit 0` en el primer, tercer y cuarto comando; en el segundo, `exit 1`; y `ℹ fail 7`.

## Evidencia

Pasada 1 (única pasada de esta ejecución; los cuatro comandos de Verificación, desde la raíz del repo):

```
$ grep -c -e 'Una sola pasada por puerta' -e 'devuelves el documento y nada más' -e 'no reabres preguntas' -e 'Otra ronda solo si Franco la pide' -e 'Decisiones para Franco' -e 'Tope de tamaño: 12288 bytes' -e 'Tamaño de la pasada:' agentes/arquitecto.md; echo "exit $?"
3
exit 0
```

```
$ grep -c 'pregunta de nuevo antes de seguir' skills/definir-proyecto/SKILL.md; echo "exit $?"
0
exit 1
```

```
$ grep -c -e 'Decisiones para Franco' -e 'Tope de tamaño: 12288 bytes' skills/definir-proyecto/SKILL.md; echo "exit $?"
2
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

## Notas
- Cambios aplicados: sección `## Una sola pasada` antes de `## Lectura acotada` en `agentes/arquitecto.md`; línea 22 de `skills/definir-proyecto/SKILL.md` reemplazada; párrafo `**Una sola pasada:**` antes de `## Formato de PROJECT.md`.
- Criterio 1 y 2 (frases exactas, ausencia de la frase antigua): cumplidos por `grep`.
- Criterio 4 (`ℹ fail 7`): cumplido en esta ejecución. La corrida anterior dio 14 y 19 con timeouts `ETIMEDOUT` por suspensión del equipo; no era un fallo de estos cambios.
- Autocomprobación `node scripts/validar-tarea.mjs --evidencia`: la primera corrida rechazó «La última línea no vacía de Notas debe ser Registro»; se corrige con la línea `Registro` final y se vuelve a correr.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=falla; huecos=0; resultado=bloqueada; causa=verificacion_x2
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
