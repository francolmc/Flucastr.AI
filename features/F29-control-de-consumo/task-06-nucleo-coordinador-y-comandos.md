# task-06 — Núcleo del coordinador y comandos: Write por transición y --presupuesto
repo: Flucastr.AI   depende_de: task-05   estado: hecha

## Descripción
Cierra la integración en tres archivos: (1) el bloque «Formato de `definitions/STATUS.md`» del `coordinador` (que hoy manda `Edit` por sección) pasa a una línea que remite a `control-consumo` y fija «una sola vez por transición, con `Write` completo»; (2) se restituye en el núcleo el aviso `al pedirte Franco un comando` para `comandos-coordinador`; (3) el comando 4 de esa skill admite `--presupuesto` por iniciativa propia, una vez por transición. El manifiesto se actualiza en el mismo paso para no dejar pruebas que exijan `Edit` por sección.

## Contexto
- Tocar: `agentes/coordinador.md`, `skills/comandos-coordinador/SKILL.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- Fuente: definitions/CONSUMO.md «(d) Dónde vive el texto»
- `agentes/coordinador.md` (7141 B tras task-04; tope 7168, no se sube): `## Formato de `definitions/STATUS.md`` (encabezado, la línea «Secciones, en orden…» y tres viñetas, ≈405 B) y, bajo `## Ramas por feature`, la línea `Carga `comandos-coordinador` antes de delegar `descomponer-feature`, al cerrar una feature o sin subagentes. Al delegar, carga `control-consumo`.`
- `skills/comandos-coordinador/SKILL.md` (2795 B): línea 15 (comando 4: `node ~/.flucastr-ai/validar-tarea.mjs [--evidencia] <ruta-tarea>...`) y línea 19 (`Excepción: el cuarto, como puerta previa, también en yolo.`).
- `frases-por-archivo.mjs`: `FRASES_COORDINADOR_F21` (líneas 6-18) y las claves `'agentes/coordinador'` y `'skills/comandos-coordinador'`. `coordinador-turnos.test.mjs` usa `FRASES_COORDINADOR_F21[0]` como control negativo: esa primera frase no cambia.
- `coordinador-status.test.mjs` no cambia: su frase («Antes de delegar, escribe en `definitions/STATUS.md`») queda en el paso 2.
- Lee solo las *Notas* de task-05.

## Decisiones ya tomadas
- El bloque «Formato…» se reemplaza por el encabezado `## STATUS.md` y la línea «Escribes `STATUS.md` una sola vez por transición (rol, puerta o estado), con `Write` completo; formato, presupuesto y corte de sesión: `control-consumo`.»
- La línea de `comandos-coordinador` pasa a: «Carga `comandos-coordinador` al pedirte Franco un comando, antes de `descomponer-feature`, al cerrar una feature o sin subagentes. Al delegar, carga `control-consumo`.»
- Comando 4: `[--evidencia|--fuente|--presupuesto]`. Excepción: «el cuarto, como puerta previa y, con `--presupuesto`, una vez por transición; también en yolo». Las frases `lista cerrada`, `pedido explícito` y `no autoriza` se conservan.
- Manifiesto: en `FRASES_COORDINADOR_F21` se quitan `con `Edit` por sección, no con `Write` completo` y `cada ítem ≤150 caracteres` (esta última ya está en la skill), y `Reescribes `STATUS.md` solo en puertas y en cambios de rol` pasa a `una sola vez por transición`; en `'agentes/coordinador'` se añaden `Al delegar, carga `control-consumo`` y `al pedirte Franco un comando`; en `'skills/comandos-coordinador'`, `--presupuesto`.
- El `coordinador` debe quedar en ≤ 7168 B; si no cabe, recorta redacción repetida del núcleo sin borrar reglas ni frases del manifiesto.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: un bloque y una línea del núcleo, dos líneas de la skill y el manifiesto.
Fuera de alcance: `tools:` del `coordinador`, `control-consumo`, los topes, `coordinador-status.test.mjs` y todo lo de `definitions/` (el enlace desde `AGENTS.md` lo hace Franco).

## Pasos
1. Edita `agentes/coordinador.md` según las dos primeras decisiones y mide con `wc -c`.
2. Edita las líneas 15 y 19 de `skills/comandos-coordinador/SKILL.md`.
3. Actualiza el manifiesto.
4. Corre las pruebas de contrato, turnos, status, topes y la rápida.

## Criterios de aceptación
1. `agentes/coordinador.md` mide ≤ 7168 B, no contiene `Edit` por sección y contiene `al pedirte Franco un comando`.
2. Las cuatro pruebas (`contrato-roles`, `coordinador-turnos`, `coordinador-status`, `topes-bytes`) dan `ℹ fail 0`.
3. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
test $(wc -c < agentes/coordinador.md) -le 7168 && echo "ok-nucleo"; echo "exit $?"
grep -c 'Edit` por sección' agentes/coordinador.md; echo "exit $?"
grep -c 'al pedirte Franco un comando' agentes/coordinador.md; echo "exit $?"
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ok-nucleo`; `0` para `Edit` por sección (con `exit 1`, porque `grep -c` sale 1 sin coincidencias); `1` para la frase del comando; `ℹ fail 0` en el cuarto y `ℹ fail 7` en el último.

## Evidencia

```
$ test $(wc -c < agentes/coordinador.md) -le 7168 && echo "ok-nucleo"; echo "exit $?"
ok-nucleo
exit 0
```

```
$ grep -c 'Edit` por sección' agentes/coordinador.md; echo "exit $?"
0
exit 1
```

```
$ grep -c 'al pedirte Franco un comando' agentes/coordinador.md; echo "exit $?"
1
exit 0
```

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

## Notas

Modo yolo: sin rama, sin `git switch`, sin commit. Fuente (CONSUMO.md, sección 5, (d)) leída. Huecos menores: 0. `agentes/coordinador.md` mide 6977 B (tope 7168); el bloque «Formato» quedó en `## STATUS.md` con una línea que remite a `control-consumo`, y se restituyó «al pedirte Franco un comando». Manifiesto: se quitaron de `FRASES_COORDINADOR_F21` las dos frases de `Edit`/≤150 (ya cubiertas en `control-consumo`) y «Reescribes…» pasó a «una sola vez por transición»; se añadieron a `agentes/coordinador` «Al delegar, carga `control-consumo`» y «al pedirte Franco un comando»; a `skills/comandos-coordinador`, «--presupuesto». No se tocó `tools:`, `STATUS.md` ni `definitions/`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
