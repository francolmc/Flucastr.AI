# task-03 — control-consumo: opciones A/B coherentes con los topes por rol y bloqueos de código
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
La skill `control-consumo` ofrece, con `estado=excedido`, A) ampliar con `ampliado=N` y B) replantear con `arquitecto` o `planificador`. Con `arq` excedido, B suma otra ronda sobre un tope que A no sube: se anulan. Esta tarea (1) hace que A amplíe el tope de la causa con los sufijos de task-01, solo con el «sí» de Franco, y que B no se ofrezca cuando la causa es `arq` o `plan`; (2) añade la plantilla con los sufijos opcionales; (3) añade la regla que enruta un bloqueo de código o verificación (`rol=constructor; motivo=codigo:`) al `planificador` para una tarea de corrección y luego al `constructor`, no al `arquitecto`. El texto va aquí y no en `agentes/coordinador.md`, que está en 7168/7168 B.

## Contexto
- Tocar: `skills/control-consumo/SKILL.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- De `depende_de:` lee solo las *Notas* de task-01.
- En `skills/control-consumo/SKILL.md` (1818 B hoy): paso 4 (línea 11), paso 5 (línea 12), línea `Presupuesto:` de la plantilla (línea 20) y paso 8 (línea 27) como último paso.
- En `pruebas/comprobaciones/frases-por-archivo.mjs`: el bloque `'skills/control-consumo': [` (línea 143).
- Tope de bytes: `skills/control-consumo/SKILL.md` ≤ 4096 (`pruebas/comprobaciones/topes-bytes.test.mjs`); no se cambia.
- Fuente: ninguna
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Paso 4: añade al final, tras «`Presupuesto:` vuelve a ceros.», la frase ` Conserva los `amp_*` al reescribirla.`
- Paso 5, texto completo: `5. Con `estado=excedido` no delegas. En *Escalación* pones la causa y las opciones cerradas: A) ampliar el tope de esa causa en N: `ampliado=N` si es `D`; `amp_arq=N`, `amp_plan=N` o `amp_k=N` si es `arq`, `plan` o `K`; solo tras el «sí» de Franco en la conversación, nunca por tu cuenta; B) replantear lo bloqueado con `arquitecto` o `planificador` (cuenta como ronda), solo si la causa es `D` o `K`; con `arq` o `plan` no ofrezcas B; C) cerrar la sesión y revisar a mano. Después te detienes.`
- Plantilla: la línea pasa a `Presupuesto: <Fxx>; rondas arq=<n> plan=<n>; ampliado=<n>[; amp_arq=<n>][; amp_plan=<n>][; amp_k=<n>]`.
- Paso 9 nuevo, al final del archivo: `9. `BLOQUEO: rol=constructor; motivo=codigo:` (defecto de código o de verificación en el repo) no va al `arquitecto` ni reabre la tarea: delega al `planificador` (`Disparó: BLOQUEO task-NN`) una tarea de corrección nueva y acotada en la misma feature (cuenta como ronda `plan`) y luego al `constructor`; con ella `hecha`, la bloqueada vuelve a `aprobada`.`
- Con esos cambios el archivo mide 2464 B (medido en una copia de trabajo con exactamente este texto). Si el resultado difiere, el texto de arriba manda y el tamaño solo debe quedar ≤ 4096.
- Manifiesto: en `'skills/control-consumo'` añade las frases `'amp_arq=N'`, `'no ofrezcas B'` y `'rol=constructor; motivo=codigo:'`; conserva las seis que ya están (la de la plantilla, `Presupuesto: <Fxx>; rondas arq=<n> plan=<n>; ampliado=<n>`, sigue contenida en la línea nueva).
- No cambies la `description` del frontmatter ni el resto de pasos.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: una skill y el manifiesto de frases.
Fuera de alcance: `agentes/` (el coordinador no se toca), `skills/ejecutar-tarea/` y `skills/descomponer-feature/` (tareas 04 y 05), `scripts/`, `definitions/`.

## Pasos
1. Lee las *Notas* de task-01.
2. Edita `skills/control-consumo/SKILL.md` con `Edit`: paso 4, paso 5, línea de plantilla y paso 9, con los textos de «Decisiones ya tomadas».
3. Añade las tres frases al manifiesto en `pruebas/comprobaciones/frases-por-archivo.mjs`.
4. Mide con `wc -c skills/control-consumo/SKILL.md` y corre la *Verificación*.

## Criterios de aceptación
1. `wc -c < skills/control-consumo/SKILL.md` imprime un valor ≤ 4096 (esperado 2464).
2. `node --test pruebas/comprobaciones/topes-bytes.test.mjs` da `ℹ tests 23` y `ℹ fail 0`.
3. `node --test pruebas/comprobaciones/contrato-roles.test.mjs` da `ℹ tests 112` y `ℹ fail 0` (hoy 109; +3 frases nuevas).
4. `node scripts/validar-tarea.mjs --presupuesto` no se toca: `node --test pruebas/comprobaciones/validar-tarea.test.mjs` sigue en `ℹ fail 0`.
5. `bash pruebas/rapida.sh` da `ℹ fail 6` (los mismos ajenos).

## Verificación
```
wc -c < skills/control-consumo/SKILL.md | tr -d ' '; echo "exit $?"
node --test pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
```
Esperado: `2464`; `ℹ tests 23` y `ℹ fail 0`; `ℹ tests 112` y `ℹ fail 0`; `ℹ fail 6` con `ℹ tests` igual a 682 más los nuevos de tareas 01 y 02 más 3 (base medida el 2026-11-03: 682 tests, 6 fail ajenos). Cada `exit` es el del último comando de su línea (0).
La *Evidencia* se pega concisa: solo la salida literal de cada comando, sin repetir los resultados en prosa.

## Evidencia
```
$ wc -c < skills/control-consumo/SKILL.md | tr -d ' '; echo "exit $?"
2464
exit 0
$ node --test pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
ℹ tests 23
ℹ fail 0
exit 0
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
ℹ tests 112
ℹ fail 0
exit 0
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
ℹ tests 700
ℹ fail 6
exit 0
```

## Notas
- Criterio 4 (fuera de la Verificación): `node --test pruebas/comprobaciones/validar-tarea.test.mjs` da `ℹ tests 29` y `ℹ fail 0`.
- Hueco menor: `rapida.sh` da `ℹ tests 700`, no la cuenta de la fórmula de *Verificación*; se toma la cifra medida. `ℹ fail 6` coincide con los ajenos.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
