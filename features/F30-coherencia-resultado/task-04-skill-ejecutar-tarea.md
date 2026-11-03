# task-04 — `ejecutar-tarea`: `lista` exige `pasa` y la evidencia se valida con el lanzador
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
La skill `ejecutar-tarea` solo corre `--evidencia` si el repo tiene `scripts/validar-tarea.mjs`, y los proyectos instalados no lo tienen. Se agrega la ruta por el lanzador `~/.flucastr-ai/validar-tarea.mjs` y una frase que ata `lista` a `verificacion=pasa`, con `parcial` en `bloqueada`. Sin tocar `agentes/constructor.md` (tope 3072 B).

## Contexto
- Tocar: `skills/ejecutar-tarea/SKILL.md`, `pruebas/comprobaciones/contrato-constructor.test.mjs`
- Texto actual (confirmado), paso 3 de «Ejecución» en `skills/ejecutar-tarea/SKILL.md` línea 24: «Antes de `lista para revisión`, si existe `scripts/validar-tarea.mjs`, corre `node scripts/validar-tarea.mjs --evidencia <ruta-tarea>`; si sale 1, corrige la *Evidencia* …». El lanzador `node ~/.flucastr-ai/validar-tarea.mjs` lo escribe `instalar.sh` (líneas 443–472) y carga `scripts/validar-tarea.mjs` del kit; `skills/comandos-coordinador/SKILL.md` línea 15 ya lo documenta con `--evidencia` (confirmado).
- Línea `Registro:` en la misma skill, significados `verificacion` y `causa` (líneas 62–75): ya dice que `parcial` va con `resultado=bloqueada; causa=parcial`.
- Pruebas: `pruebas/comprobaciones/contrato-constructor.test.mjs` usa `validarConstructor` de `contrato-constructor.mjs` con `variantes` que borran frases (20 pruebas pasan hoy). La skill mide hoy 7223 B y no tiene tope en `topes-bytes.test.mjs`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «Pieza 2 — Coherencia de `resultado`»

## Decisiones ya tomadas
- Paso 3 pasa a: «…corre `node scripts/validar-tarea.mjs --evidencia <ruta-tarea>` si existe `scripts/validar-tarea.mjs`; si no, `node ~/.flucastr-ai/validar-tarea.mjs --evidencia <ruta-tarea>`; …».
- Frase nueva, al final del paso 3 y literal: «`lista` exige `verificacion=pasa`; con `parcial` o `falla` la tarea queda `bloqueada`.»
- La prueba nueva va en `contrato-constructor.test.mjs` (no se toca `contrato-constructor.mjs`): un caso lee la skill real y exige las dos frases literales (la del lanzador y la nueva); un control negativo borra una de ellas y exige que la comprobación falle.
- Crecimiento máximo de la skill: 400 B.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: dos frases en la skill y su prueba literal.
Fuera de alcance: `agentes/constructor.md`, `skills/comandos-coordinador`, `instalar.sh`, el regex de `Registro:`, cualquier regla de `Requiere:` o `Bloqueo:`.

## Pasos
1. Edita el paso 3 de `skills/ejecutar-tarea/SKILL.md` con las dos frases de *Decisiones ya tomadas*.
2. Mide el tamaño: no debe superar 7223 + 400 B.
3. En `pruebas/comprobaciones/contrato-constructor.test.mjs` agrega la prueba que exige ambas frases literales en la skill real.
4. Agrega el control negativo (texto sin la frase de `verificacion=pasa` falla).
5. Corre las pruebas del contrato.

## Criterios de aceptación
1. El paso 3 nombra `node ~/.flucastr-ai/validar-tarea.mjs --evidencia`; se comprueba con `grep -c`.
2. La frase «`lista` exige `verificacion=pasa`» está literal; se comprueba con `grep -c`.
3. La skill pesa como máximo 7623 B; se comprueba con `wc -c`.
4. Las 20 pruebas previas de `contrato-constructor.test.mjs` pasan y la nueva también.

## Verificación
```
node --test pruebas/comprobaciones/contrato-constructor.test.mjs
grep -c "~/.flucastr-ai/validar-tarea.mjs --evidencia" skills/ejecutar-tarea/SKILL.md
grep -c "exige \`verificacion=pasa\`" skills/ejecutar-tarea/SKILL.md
wc -c < skills/ejecutar-tarea/SKILL.md
```
Esperado: `ℹ fail 0`; luego `1`; luego `1`; el último número es ≤ 7623.

## Evidencia

```
$ node --test pruebas/comprobaciones/contrato-constructor.test.mjs
✔ rechaza la regla 11 si la rama se resuelve después del paso a «en curso» (1.020209ms)
✔ rechaza la regla 14 si «Modo yolo: activo» aparece después de «git switch -c» en la skill (0.12875ms)
✔ la skill real trae las dos frases literales del paso 3 (0.070041ms)
✔ control negativo: sin la frase de verificacion=pasa la comprobación falla (0.076208ms)
ℹ tests 22
ℹ suites 0
ℹ pass 22
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 78.842709
exit 0

$ grep -c "~/.flucastr-ai/validar-tarea.mjs --evidencia" skills/ejecutar-tarea/SKILL.md
1
exit 0

$ grep -c "exige \`verificacion=pasa\`" skills/ejecutar-tarea/SKILL.md
1
exit 0

$ wc -c < skills/ejecutar-tarea/SKILL.md
    7382
exit 0
```

## Notas
- Huecos menores resueltos: (1) la prueba negativa usa una constante `frasesPaso3` y una función `faltanPaso3` en `contrato-constructor.test.mjs`, para que la misma comprobación sirva al caso real y al control negativo; (2) la frase nueva se pegó al final del paso 3 y el texto de la ruta se reordenó para leer «si existe `scripts/…`; si no, `~/.flucastr-ai/…`», como pide la tarea.
- Verificación: una pasada completa, sin reintentos. La skill mide 7382 B (7223 + 159, dentro del tope 7623). Tests del contrato: 22 (20 previas + 2 nuevas), todas pasan.
- Sin branch, sin commit: modo yolo activo, no se creó rama ni se hizo `git switch`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
