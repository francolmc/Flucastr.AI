# task-09 — Cerrar el núcleo del coordinador en 7168 bytes
repo: Flucastr.AI   depende_de: task-08   estado: hecha

## Descripción
Tras las tasks 04, 06 y 08 el `coordinador` mide unos 9 KB. Esta tarea lo lleva a la meta de 7168 B recortando redacción repetida (sin quitar ninguna frase del manifiesto ni cambiar una regla) y fija el tope en la prueba de bytes. También hace obligatorios los tres módulos en esa prueba. Es la tarea que baja el costo por turno; si el costo no baja en la medición de Franco, se revierte solo ella.

## Contexto
- Tocar: `agentes/coordinador.md`, `pruebas/comprobaciones/topes-bytes.test.mjs`
- Fuente: definitions/CONTRATOS.md «3. Qué hace el `coordinador` ante cada respuesta»
- `agentes/coordinador.md`: las filas largas de `## Tabla de decisión` (las de `REFINAR:`, `DECISION:`/`PARCIAL:`, puerta 3, puerta 4 y bloqueada), `## Autorización de delegar`, `## Cómo avanzas`, `## Escalación` y `## Antes de entregar` son los candidatos. Tamaño inicial: el de `wc -c` tras task-08 (anótalo en *Notas*).
- `topes-bytes.test.mjs` (task-02): tabla `TOPES` con `agentes/coordinador.md` en 17920 y los tres módulos con `opcional: true`.
- Pruebas que leen frases del coordinador: `contrato-roles.test.mjs` (manifiesto, tabla de seis estados, `tools:`), `coordinador-turnos.test.mjs` (11 frases de F21 en la salida generada para Claude y para Pi), `coordinador-status.test.mjs` (`Antes de delegar, escribe en definitions/STATUS.md`, `empieza vacía o resumida`), `puerta-previa.test.mjs` (`validar-tarea.mjs`, `salida 1`, `DECISION: tarea=task-NN; abiertas=<n>`).
- Lee solo las *Notas* de task-08.

## Decisiones ya tomadas
- Meta: 7168 B o menos. Se recorta solo redacción: conectores, ejemplos y repeticiones entre filas y secciones. No se cambia ninguna regla ni se borra ninguna frase del manifiesto ni del front matter.
- La tabla de decisión conserva una fila por cada primera línea de respuesta (`REFINAR:`, `DECISION:`/`PARCIAL:`, `BLOQUEO:`, tarea `lista para revisión`) y se añade una fila `CONFIRMAR:` de una línea (pregunta a Franco; con su sí explícito, reencarga con la skill `ramas-feature`) y la fila «Nada de lo anterior: escalación». Esas filas se pagan con los recortes.
- En `topes-bytes.test.mjs`: tope del coordinador 7168 y `opcional: false` en los tres módulos (si el archivo falta, la prueba falla).
- Si tras recortar solo redacción el archivo no baja de 7168 B, la tarea queda `bloqueada` con `PARCIAL:` y la cifra lograda; no se amplía el tope ni se borra una regla.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: recorte de redacción en un archivo y un cambio de dos constantes en una prueba.
Fuera de alcance: `coordinador-turnos.test.mjs` (su tope de 17920 queda como cota vieja), los módulos, `tools:`, la medición con `consumo.mjs` (la hace Franco) y todo lo de `definitions/`.

## Pasos
1. Recorta redacción de `agentes/coordinador.md` y añade las dos filas indicadas; mide con `wc -c` tras cada grupo de cambios.
2. Corre `contrato-roles`, `coordinador-turnos`, `coordinador-status` y `puerta-previa` hasta `ℹ fail 0`.
3. En `topes-bytes.test.mjs`, fija 7168 y `opcional: false`.
4. Corre la prueba de bytes y la rápida.

## Criterios de aceptación
1. `agentes/coordinador.md` mide 7168 B o menos.
2. Las cuatro pruebas de frases (`contrato-roles`, `coordinador-turnos`, `coordinador-status`, `puerta-previa`) dan `ℹ fail 0`.
3. `topes-bytes.test.mjs` da `ℹ fail 0` con tope 7168 y módulos obligatorios.
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
test $(wc -c < agentes/coordinador.md) -le 7168 && echo "ok-nucleo"; echo "exit $?"
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs pruebas/comprobaciones/puerta-previa.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
node --test pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
grep -c '7168' pruebas/comprobaciones/topes-bytes.test.mjs; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ok-nucleo`, `ℹ fail 0` en los comandos segundo y tercero, el cuarto cuenta la línea del tope y termina en `exit 0`, y `ℹ fail 7` en el último.

## Evidencia

```
$ test $(wc -c < agentes/coordinador.md) -le 7168 && echo "ok-nucleo"; echo "exit $?"
ok-nucleo
exit 0
```

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs pruebas/comprobaciones/puerta-previa.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
```

```
$ node --test pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
```

```
$ grep -c '7168' pruebas/comprobaciones/topes-bytes.test.mjs; echo "exit $?"
1
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

## Notas
- Tamaño inicial de `agentes/coordinador.md`: 9799 B (`wc -c` tras task-08). Final: 7136 B (≤ 7168).
- Solo redacción: se quitaron conectores y repeticiones; ninguna regla, estado, frase del manifiesto ni línea `tools:` se borró. Se añadieron las filas `CONFIRMAR:` y «Nada de lo anterior: escalación».
- Huecos menores: (1) las secciones `## Escalación`, `## Modo yolo` y `## Comandos, archivo y cierre` se fundieron en la tabla y en «Ramas por feature» conservando su texto; (2) en `topes-bytes.test.mjs` el comentario de los módulos se actualizó a «obligatorios», porque ya no hay `opcional: true`.
- Tope fijado en 7168 y `opcional: false` en los tres módulos; `skills/modo-yolo`, `skills/ramas-feature` y `skills/comandos-coordinador` existen.
- Cuatro pruebas de frases y `topes-bytes`: `ℹ fail 0`. Rápida: `ℹ fail 7`, sin reintentos ni timeouts.
- Modo yolo: sin rama ni `git switch`; sin commit, push ni merge. `instalar.sh` no se ejecutó.
- Autocomprobación `--evidencia` (salida final): `OK: 1 tarea(s) con evidencia completa`, exit 0.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
