# task-11 — Pedir la viñeta Fuente en descomponer-feature y usar --fuente en la puerta previa
repo: Flucastr.AI   depende_de: task-10   estado: hecha

## Descripción
Con `--fuente` disponible (task-10), el planificador debe escribir la viñeta `- Fuente:` en cada tarea y el `coordinador` debe pasarla por la puerta previa, también en yolo. Esta tarea cambia solo texto de agentes y skills: la skill `descomponer-feature`, la fila de la puerta 3 del `coordinador` y la regla 2 de `modo-yolo`. El `coordinador` no puede crecer.

## Contexto
- Tocar: `skills/descomponer-feature/SKILL.md`, `agentes/coordinador.md`, `skills/modo-yolo/SKILL.md`
- Fuente: definitions/CONTRATOS.md «2. Contrato por traspaso»
- `skills/descomponer-feature/SKILL.md` (5254 B): en `## Plantilla`, el bloque indica `## Contexto      Rutas exactas a leer y a tocar; ...`; `## Tarea que se basta sola` lista las citas de *Contexto*. Frases del manifiesto que deben seguir exactas: `solo puedes mover la marca`, `REFINAR: feature=Fxx; preguntas=<n>`, `features/Fxx-nombre/refinado.md`, `Modo yolo: activo`, `cita en *Contexto* las líneas o firmas exactas que el ejecutor necesita`, `con su ruta y título`, `~3 archivos tocados`.
- `agentes/coordinador.md`: la fila de la puerta 3 de la tabla corre `node ~/.flucastr-ai/validar-tarea.mjs <ruta-tarea>...`; debe conservar `validar-tarea.mjs` y `salida 1` (`puerta-previa.test.mjs`).
- `skills/modo-yolo/SKILL.md`: la regla 2 de «Mientras está activo» empieza `2. **Revisión de «completa»` y corre `node ~/.flucastr-ai/validar-tarea.mjs <ruta-tarea>`.
- Lee solo las *Notas* de task-10 y de task-09 (tamaño final del coordinador).

## Decisiones ya tomadas
- `descomponer-feature`: en «Tarea que se basta sola» se añade la viñeta: «En *Contexto*, una viñeta `- Fuente: <ruta> «<encabezado>»` con la sección de `definitions/` de la que sale el diseño (una por documento citado), o `- Fuente: ninguna` si la tarea no depende de ningún diseño. `node scripts/validar-tarea.mjs --fuente` comprueba que el encabezado existe.». En el bloque de plantilla, la línea de *Contexto* termina con «; viñeta Fuente».
- `coordinador.md`: en la fila de la puerta 3 y solo allí, el comando pasa a `node ~/.flucastr-ai/validar-tarea.mjs --fuente <ruta-tarea>...`. El archivo termina con el mismo tamaño o menos que antes de la tarea (acorta redacción de esa misma fila si hace falta); el tope de 7168 B de `topes-bytes.test.mjs` lo vigila.
- `modo-yolo`: en la regla 2, el comando pasa a `node ~/.flucastr-ai/validar-tarea.mjs --fuente <ruta-tarea>` y el módulo sigue en 5120 B o menos.
- La fila de la puerta 4 y la regla 6 (`--evidencia`) no cambian.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: una viñeta nueva en una skill y dos comandos que ganan `--fuente`.
Fuera de alcance: `WORKFLOW.md` §6 (pendiente de la puerta 1), `formato-tarea.mjs`, `ejecutar-tarea` y todo lo de `definitions/`.

## Pasos
1. Edita `skills/descomponer-feature/SKILL.md` según «Decisiones ya tomadas».
2. Cambia el comando en la fila de la puerta 3 de `agentes/coordinador.md`.
3. Cambia el comando de la regla 2 en `skills/modo-yolo/SKILL.md`.
4. Corre las pruebas de contrato, puerta previa, bytes y la rápida.

## Criterios de aceptación
1. `contrato-roles.test.mjs`, `puerta-previa.test.mjs` y `topes-bytes.test.mjs` dan `ℹ fail 0`.
2. `descomponer-feature` contiene `- Fuente:`; el `coordinador` y `modo-yolo` contienen `validar-tarea.mjs --fuente`.
3. `agentes/coordinador.md` mide 7168 B o menos.
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/puerta-previa.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
grep -c -e '- Fuente:' skills/descomponer-feature/SKILL.md; echo "exit $?"
grep -l 'validar-tarea.mjs --fuente' agentes/coordinador.md skills/modo-yolo/SKILL.md; echo "exit $?"
test $(wc -c < agentes/coordinador.md) -le 7168 && echo "ok-nucleo"; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ℹ fail 0`, un conteo con `exit 0`, las rutas `agentes/coordinador.md` y `skills/modo-yolo/SKILL.md`, `ok-nucleo` y `ℹ fail 7`.

## Evidencia

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/puerta-previa.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
```

```
$ grep -c -e '- Fuente:' skills/descomponer-feature/SKILL.md; echo "exit $?"
1
exit 0
```

```
$ grep -l 'validar-tarea.mjs --fuente' agentes/coordinador.md skills/modo-yolo/SKILL.md; echo "exit $?"
skills/modo-yolo/SKILL.md
agentes/coordinador.md
exit 0
```

```
$ test $(wc -c < agentes/coordinador.md) -le 7168 && echo "ok-nucleo"; echo "exit $?"
ok-nucleo
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

## Notas
- Repetición completa (intento 1): los cinco comandos de la Verificación dan lo esperado; `rapida.sh` da `ℹ fail 7`.
- Fallo anterior: una línea de *Notas* de task-10 tenía palabras de marcador de pendiente en prosa. Ya está corregida; esta tarea no la toca de nuevo.
- Tamaño de `agentes/coordinador.md`: 7132 B (tope 7168).
- Autocomprobación `validar-tarea.mjs --evidencia`: `OK: 1 tarea(s) con evidencia completa`, exit 0.
- Huecos menores: 0.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=falla; huecos=0; resultado=bloqueada; causa=verificacion_x2
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
