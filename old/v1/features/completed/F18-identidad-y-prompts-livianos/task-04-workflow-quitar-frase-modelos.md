# task-04 — Quitar de `WORKFLOW.md` §2 la frase sobre `modelos.json`
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Quitar de `definitions/WORKFLOW.md` §2 (línea 22) la frase «Cada rol configura su nivel de modelo en `modelos.json`, a elección de Franco (inicialmente `planificador` en medio).», equivalente a la que task-03 quita de los agentes. El documento no puede pasar de 30.720 caracteres.

## Contexto
- Leído `definitions/WORKFLOW.md:22`: «Ramas, refinado y modo yolo: §9. Todos: sin leer `.env`, llaves ni credenciales. Cada rol configura su nivel de modelo en `modelos.json`, a elección de Franco (inicialmente `planificador` en medio).».
- Medido hoy (ejecutado): `wc -m definitions/WORKFLOW.md` → 30635 (con las modificaciones sin commit de Franco ya incluidas). La frase con su espacio previo mide 118 caracteres, así que el resultado esperado es 30517. Tope informativo 30.720 (`DEFINICION_INFORMATIVO` en `scripts/archivar.mjs:24`).
- `WORKFLOW.md` §7 (líneas 155 y 161, «Modelo por agente (F07)») sigue explicando `modelos.json`; no se toca.
- `definitions/WORKFLOW.md` tiene cambios sin commit de Franco (estado y viñeta «Higiene de contexto»): no se revierten ni se editan; `git diff` de esta tarea se juzga por la línea 22, no por el diff total.
- Es documentación de Franco aprobada; la edición está cubierta por el alcance de F18 aprobado el 2026-10-31 (`BACKLOG.md`, «Alcance de F18», punto 2).

## Decisiones ya tomadas
- Se borra solo la frase (desde «Cada rol configura» hasta «en medio).») y el espacio previo; el resto de la línea 22 queda igual.
- La medida es `wc -m` (caracteres). Si tras el cambio supera 30720, no se aplica y la tarea queda `bloqueada` (no puede ocurrir: solo se quita texto).

## Alcance / Fuera de alcance
Alcance: esa frase.
Fuera de alcance: cualquier otro cambio en `WORKFLOW.md`, `definitions/STATUS.md`, `BACKLOG.md`, §7, los agentes.

## Pasos
1. Editar `definitions/WORKFLOW.md` quitando la frase. Resultado: la línea 22 termina en «credenciales.».
2. Medir y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. `grep -n "Cada rol configura" definitions/WORKFLOW.md` sin salida.
2. `wc -m definitions/WORKFLOW.md` imprime un número ≤ 30720 (esperado 30517).
3. `sed -n 22p definitions/WORKFLOW.md` termina en «sin leer `.env`, llaves ni credenciales.».

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -n "Cada rol configura" definitions/WORKFLOW.md
wc -m definitions/WORKFLOW.md
sed -n 22p definitions/WORKFLOW.md
node --test pruebas/comprobaciones/formato-flujo.test.mjs
```
Esperado: sin salida del `grep`; `30517 definitions/WORKFLOW.md` (o menos de 30720); línea 22 terminada en «credenciales.»; `fail 0` (`formato-flujo.test.mjs` existe; no ejecutado tras el cambio).

## Evidencia
Antes: `wc -m definitions/WORKFLOW.md` → `30635 definitions/WORKFLOW.md`.

Verificación (comandos de la tarea, salida real):

```
$ grep -n "Cada rol configura" definitions/WORKFLOW.md
(sin salida; exit=1)

$ wc -m definitions/WORKFLOW.md
   30516 definitions/WORKFLOW.md

$ sed -n 22p definitions/WORKFLOW.md
Ramas, refinado y modo yolo: §9. Todos: sin leer `.env`, llaves ni credenciales.

$ node --test pruebas/comprobaciones/formato-flujo.test.mjs
ℹ tests 16
ℹ pass 16
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
```

Criterios de aceptación:
1. `grep -n "Cada rol configura"` sin salida: cumple.
2. `wc -m` = 30516, ≤ 30720: cumple. El esperado de la tarea era 30517; la diferencia es de 1 carácter (ver *Notas*).
3. Línea 22 termina en «sin leer `.env`, llaves ni credenciales.»: cumple.

Diff de la línea 22 (`git diff -U0 definitions/WORKFLOW.md`): solo se quitó la frase «Cada rol configura su nivel de modelo en `modelos.json`, a elección de Franco (inicialmente `planificador` en medio).» con su espacio previo. El resto del archivo (estado y viñeta «Higiene de contexto» sin commit de Franco) no se tocó.

Verificación rápida pedida por Franco, con HOME real (`HOME=/Users/franco`), `bash pruebas/rapida.sh`, exit=0:

```
ℹ tests 227
ℹ pass 227
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
rapida: 22 archivos en 12 s (tope 30 s)
```

No se corrió ninguna instalación ni se tocó `~/.claude` ni `~/.pi`. Las pruebas usan directorios temporales del repo.

## Notas
- Hueco menor: el esperado 30517 de la tarea supone que la frase con su espacio previo ocupa 118 caracteres. `wc -m` mide 119 (30635 → 30516). Se aplicó la edición exacta de la frase indicada, sin tocar nada más; la cifra del criterio 2 (≤ 30720) se cumple. Es un error de conteo en el estimado de la tarea, no una decisión de alcance.
- `rapida.sh` se corrió dos veces (la primera para ver la salida, la segunda para capturar el exit code); ambas pasan.
- Los pasos de *Verificación* se corrieron una vez completa; `rapida.sh` no está en la verificación de la tarea y se corrió como lo pidió Franco.
- No se escribió en `definitions/STATUS.md`, no se hizo commit ni push, no se cambió la rama.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
