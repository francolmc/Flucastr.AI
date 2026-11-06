# task-03 — control-consumo: opciones A–D con una letra y «aplica la letra sin condiciones»
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
En Memory-AI F05 (Pi), con `estado=excedido` por `arq`, el coordinador se negó a ampliar («no corresponde ampliar topes ni abrir otra feature para eludirlos») aunque la opción A lo permite con el «sí» de Franco, y no existe salida para cerrar la feature incompleta y abrir la siguiente. Esta tarea cambia la skill `control-consumo` para que (1) las opciones lleven una letra y se sumen D (cerrar incompleta y abrir la siguiente), y (2) una letra de Franco baste: se aplica sin condiciones, sin discutir ni reinterpretar. El texto va en la skill y no en `agentes/coordinador.md` (7168/7168 B).

## Contexto
- Tocar: `skills/control-consumo/SKILL.md`
- Archivo único, 2464 B hoy, tope 4096 en `pruebas/comprobaciones/topes-bytes.test.mjs`, línea 20). Pasos vigentes: 5 en la línea 12 y 9 como último paso.
- De `depende_de:` lee solo las *Notas* de task-02.
- El manifiesto `'skills/control-consumo'` de `pruebas/comprobaciones/frases-por-archivo.mjs` (línea 143) exige hoy nueve frases, entre ellas `amp_arq=N`, `no ofrezcas B`, `ampliado=N`, `estado=excedido`, `abre sesión nueva`: el texto nuevo las conserva todas (`node --test pruebas/comprobaciones/contrato-roles.test.mjs` da hoy `ℹ tests 114`, `ℹ fail 0`).
- `scripts/formato-presupuesto.mjs` (solo cita): `amp_arq`, `amp_plan`, `amp_k` y `ampliado` suben los topes; `Presupuesto:` de una feature nueva vuelve a ceros (paso 4 de la skill).
- Estados de tarea válidos incluyen `cancelada`, que exige `Cancelada: motivo=<motivo>` en *Notas* (`scripts/formato-tarea.mjs`, regla 13; motivo válido `otra`); el coordinador solo escribe el `estado`, por eso D delega al `planificador`.
- Fuente: ninguna
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Paso 5, reemplazo completo de esa línea por: «5. Con `estado=excedido` no delegas. En *Escalación* pones la causa y las opciones, cada una con su letra: A) ampliar el tope de esa causa en N (1 si Franco no da otro): `ampliado=N` si es `D`; `amp_arq=N`, `amp_plan=N` o `amp_k=N` si es `arq`, `plan` o `K`; B) replantear lo bloqueado con `arquitecto` o `planificador` (cuenta como ronda), solo si la causa es `D` o `K`; con `arq` o `plan` no ofrezcas B; C) cerrar la sesión y revisar a mano; D) cerrar la feature como incompleta y abrir la siguiente con presupuesto propio. Termina con «Responde con una letra». Después te detienes.»
- Paso 10 nuevo, al final del archivo: «10. Si Franco responde una letra (A, B, C o D), la aplicas sin añadir condiciones; no discutas ni reinterpretes ni pidas otra frase ni otro «sí». Esa letra es su aprobación. A: con solo la letra amplías N=1 para la causa, sin pedir el número ni más condiciones; si Franco da otro N, usas ese; suma N al `amp_*` (o `ampliado`) en la escritura siguiente, vuelve a correr `--presupuesto` y sigue el flujo. D: delega al `planificador` (`Disparó: franco`) pasar las tareas sin `hecha` a `cancelada` (`Cancelada: motivo=otra`), escribe `hecha` en la fila de la feature de `BACKLOG.md`, escribe en *Espera a Franco* que la feature se cerró INCOMPLETA y lista las tareas canceladas, para que Franco lo vea antes de archivar; anota en *Retomar* lo que quedó sin hacer y sigue con `descomponer-feature` de la siguiente (`Presupuesto:` en ceros; esa delegación no cuenta como ronda). Sin letra de Franco, no amplías ni cierras por tu cuenta.»
- Medido en una copia de trabajo con exactamente estos dos textos: 3496 B. Si el resultado difiere, los textos mandan y el tamaño solo debe quedar ≤ 4096.
- Decisión de yolo, a revisar por Franco al cierre: D usa solo estados existentes (`cancelada` con `motivo=otra`, fila `hecha`) para no tocar `definitions/WORKFLOW.md` ni el coordinador; la feature cerrada así queda `hecha` con tareas `cancelada`.
- No cambies la `description`, la plantilla ni los demás pasos.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: dos ediciones en una skill.
Fuera de alcance: `agentes/`, `definitions/` (el cambio de estados de feature lo decide Franco), manifiesto y pruebas de contrato (task-04), `skills/descomponer-feature/` y `skills/ejecutar-tarea/` (sin margen de bytes), `scripts/`.

## Pasos
1. Con `Edit`, reemplaza la línea del paso 5 por el texto de *Decisiones ya tomadas*.
2. Añade el paso 10 al final del archivo, con una línea en blanco de separación solo si el paso 9 la tiene.
3. Corre la *Verificación*.

## Criterios de aceptación
1. `wc -c < skills/control-consumo/SKILL.md` imprime un valor ≤ 4096 (esperado 3496).
2. `grep -c 'Responde con una letra' skills/control-consumo/SKILL.md` imprime `1` y `grep -c 'D) cerrar la feature como incompleta' skills/control-consumo/SKILL.md` imprime `1`; `grep -c 'N=1' ...` imprime `1` y `grep -c 'INCOMPLETA' ...` imprime `1`.
3. `node --test pruebas/comprobaciones/contrato-roles.test.mjs` da `ℹ tests 114` y `ℹ fail 0`; `topes-bytes.test.mjs` da `ℹ fail 0`.
4. `bash pruebas/rapida.sh` da `ℹ fail 6` (ajenos) y `ℹ tests 715`.

## Verificación
```
wc -c < skills/control-consumo/SKILL.md | tr -d ' '
grep -c 'Responde con una letra' skills/control-consumo/SKILL.md; grep -c 'D) cerrar la feature como incompleta' skills/control-consumo/SKILL.md
grep -c 'N=1' skills/control-consumo/SKILL.md; grep -c 'INCOMPLETA' skills/control-consumo/SKILL.md
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'
```
Esperado: `3496`; `1` y `1`; `1` y `1`; `ℹ tests 137` (114 + 23) y `ℹ fail 0`; `ℹ tests 715` y `ℹ fail 6` (la rápida sale 1 mientras haya fallos conocidos: no se exige salida 0).
La *Evidencia* se pega concisa: solo la salida literal de cada comando, sin repetir los resultados en prosa.

## Evidencia
```
$ wc -c < skills/control-consumo/SKILL.md | tr -d ' '
3496
exit 0
```
```
$ grep -c 'Responde con una letra' skills/control-consumo/SKILL.md; grep -c 'D) cerrar la feature como incompleta' skills/control-consumo/SKILL.md
1
1
exit 0
```
```
$ grep -c 'N=1' skills/control-consumo/SKILL.md; grep -c 'INCOMPLETA' skills/control-consumo/SKILL.md
1
1
exit 0
```
```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 137
ℹ fail 0
exit 0
```
```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 715
ℹ fail 6
exit 0
```

## Notas
- Huecos menores: ninguno. Las dos ediciones siguen *Decisiones ya tomadas* literalmente; el tamaño sale 3496 B (esperado 3496).
- `bash pruebas/rapida.sh` salió con código 1 (real); la línea `exit 0` de arriba es la del pipeline con `grep`. Los 6 fallos son los conocidos y ajenos: «los archivos reales cumplen la regla», «falla si un agente conserva la línea de modelos.json», «falla si falta la lectura acotada en constructor», «falla si falta la lectura acotada en ejecutar-tarea», «falla si WORKFLOW.md pasa de 30720 caracteres», «falla si WORKFLOW.md conserva la frase sobre modelos.json».
- Aviso del planificador (séptimo fallo, `R: ejecutar.sh genera fixture e instantánea y resume correctamente`): en el repo real no reproduce; en la salida de `rapida.sh` sale `✔ R: ejecutar.sh genera fixture e instantánea y resume correctamente (1607.020667ms)`. No se tocó nada por ese punto.
- Decisión de yolo para revisar por Franco (la deja la tarea): D usa solo estados existentes (`cancelada` con `motivo=otra` y fila `hecha`), sin tocar `definitions/WORKFLOW.md` ni el coordinador.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
