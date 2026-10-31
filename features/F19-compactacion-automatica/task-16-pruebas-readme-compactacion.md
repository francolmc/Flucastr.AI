# task-16 — `pruebas/README.md`: documentar las pruebas de compactación
repo: Flucastr.AI   depende_de: task-15   estado: hecha

## Descripción
Agregar a `pruebas/README.md` una viñeta que describe las pruebas sin modelo de la compactación (resolver de Pi y de Claude Code, Capa 1 y regla del `coordinador`) y la corrida con modelo en Pi que cruza una compactación (dos informes), para que quien corra las pruebas sepa qué fija cada una, dónde corre y qué no se hizo.

## Contexto
- Leído `pruebas/README.md`: las viñetas de las líneas 5–6 (rápida y suite completa), 9 (modelo de cada agente) y 10–14 (corridas del `coordinador` con sub-lista) son el estilo a imitar; la última viñeta es «Registro de eventos: …».
- Archivos a citar (existen, leídos): `pruebas/comprobaciones/resolver-compactacion-pi.test.mjs` (task-03), `pruebas/comprobaciones/resolver-compactacion-claude.test.mjs` (task-05), `pruebas/capa1/compactacion.test.mjs` (task-10) y `pruebas/comprobaciones/coordinador-status.test.mjs` (task-13). Leído `pruebas/rapida.sh` línea 8: el bucle incluye `pruebas/capa1/compactacion.test.mjs` y las comprobaciones `pruebas/comprobaciones/*.test.mjs`, así que las cuatro corren dentro de la rápida; léelo de nuevo y di lo que haga al momento de escribir.
- Informes con modelo (leídos): `pruebas/resultados/2026-10-31-compactacion-pi.md` (intento 1, `Veredicto: FALLA` por umbral inviable: 1500 tokens de margen, el agente compacta en cada paso y no llega a escribir `STATUS.md`) y `pruebas/resultados/2026-10-31-compactacion-pi-2.md` (intento 2, `OK` con una reserva: la retoma pudo salir del resumen de la compactación y no de releer `STATUS.md`; umbral artificial de 18000 tokens de margen, modelo `openai/gpt-6.1-sol`, 2026-10-31).
- Claude Code: NO se hizo corrida con modelo (decisión de Franco, 2026-10-31): costo estimado US$1–3, el mismo límite de diseño que Pi, y Claude Code ya tiene una compactación automática real observada en `pruebas/resultados/2026-10-31-verificacion-compactacion.md` (`system/compact_boundary`, `trigger: "auto"`, umbral real ≈ ventana − 33000, el más bajo posible ≈ 67 k).
- No existe comprobador que lea `pruebas/README.md`; se verifica con la rápida.

## Decisiones ya tomadas
- Una viñeta nueva (con sub-lista) justo después de la viñeta «Registro de eventos», con: las cuatro pruebas sin modelo, su comando `node --test <ruta>` y qué fija cada una en una frase; la corrida con modelo en Pi sobre el fixture del coordinador, con umbral artificialmente bajo en un directorio temporal y sin tocar la configuración real, citando los dos informes con su veredicto tal cual (intento 1 FALLA por umbral inviable; intento 2 OK con reserva), el modelo y la fecha.
- La viñeta dice explícitamente que no se hizo la corrida con modelo en Claude Code y por qué (costo estimado US$1–3, mismo límite de diseño, y la compactación automática real de Claude Code ya está observada en el informe de verificación citado), y que Claude Code lleva el colchón de 33.000.
- Incluye la advertencia «la corrida con modelo solo se hace a pedido de Franco».
- El veredicto se copia, no se reinterpreta.

## Alcance / Fuera de alcance
Alcance: la viñeta en `pruebas/README.md`.
Fuera de alcance: cualquier otra viñeta, `README.md` raíz, scripts, comprobadores, informes, y crear o correr una corrida con modelo en Claude Code.

## Pasos
1. Leer los cuatro archivos de prueba, `pruebas/rapida.sh` y los dos informes de Pi. Resultado: veredictos y estado de `rapida.sh` anotados en *Notas*.
2. Insertar la viñeta tras «Registro de eventos» en `pruebas/README.md`. Resultado: `grep -n "compactacion" pruebas/README.md` con al menos 5 líneas.
3. Correr la verificación y pegarla en *Evidencia*.

## Criterios de aceptación
1. La viñeta cita las cuatro pruebas y los dos informes de Pi con rutas que existen (`ls` de cada una).
2. Los veredictos citados coinciden con los informes (`grep -n "Veredicto" pruebas/resultados/2026-10-31-compactacion-pi*.md`).
3. La viñeta dice que no se hizo la corrida en Claude Code y cita el informe `pruebas/resultados/2026-10-31-verificacion-compactacion.md` (`grep -n "Claude Code" pruebas/README.md`).
4. `bash pruebas/rapida.sh` termina con exit 0.
5. `git diff --stat pruebas/README.md` muestra solo ese archivo de esta tarea.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -n "compactacion" pruebas/README.md
ls pruebas/comprobaciones/resolver-compactacion-pi.test.mjs pruebas/comprobaciones/resolver-compactacion-claude.test.mjs pruebas/capa1/compactacion.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs pruebas/resultados/2026-10-31-compactacion-pi.md pruebas/resultados/2026-10-31-compactacion-pi-2.md pruebas/resultados/2026-10-31-verificacion-compactacion.md
grep -n "Veredicto" pruebas/resultados/2026-10-31-compactacion-pi*.md
grep -n compactacion pruebas/rapida.sh
R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -2 "$R"
git diff --stat pruebas/README.md
```
Esperado: al menos cinco líneas del primer `grep`; siete rutas listadas; los veredictos de los dos informes de Pi; la línea de `rapida.sh` que incluye la prueba; `rapida exit=0`; el diff toca solo `pruebas/README.md`. No ejecutado por el planificador: la edición de `pruebas/README.md` es de esta tarea.

## Evidencia
Rama (`git branch --show-current`): `feature/F19-compactacion-automatica`, sin switch. HOME de la corrida: `HOME=/Users/franco`. Sin commit, push, PR, merge ni despliegue. No se ejecutó `instalar.sh` ni `desinstalar.sh`; no se tocó `~/.pi` ni `~/.claude`; no se abrió `auth.json`, `.env` ni credenciales. `definitions/STATUS.md` no se escribió. Único archivo editado: `pruebas/README.md` (más esta tarea).

Paso 2, inserción: viñeta «Compactación automática (F19)» con sub-lista, después de «Registro de eventos» (líneas 19 a 29 de `pruebas/README.md`).

Criterio 1 (rutas que existen):
```
$ ls pruebas/comprobaciones/resolver-compactacion-pi.test.mjs pruebas/comprobaciones/resolver-compactacion-claude.test.mjs pruebas/capa1/compactacion.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs pruebas/resultados/2026-10-31-compactacion-pi.md pruebas/resultados/2026-10-31-compactacion-pi-2.md pruebas/resultados/2026-10-31-verificacion-compactacion.md
pruebas/capa1/compactacion.test.mjs
pruebas/comprobaciones/coordinador-status.test.mjs
pruebas/comprobaciones/resolver-compactacion-claude.test.mjs
pruebas/comprobaciones/resolver-compactacion-pi.test.mjs
pruebas/resultados/2026-10-31-compactacion-pi-2.md
pruebas/resultados/2026-10-31-compactacion-pi.md
pruebas/resultados/2026-10-31-verificacion-compactacion.md
```
Las siete rutas existen.

Criterio 2 (veredictos):
```
$ grep -n "Veredicto" pruebas/resultados/2026-10-31-compactacion-pi*.md
pruebas/resultados/2026-10-31-compactacion-pi.md:5:**Veredicto: FALLA** (en la condición 2 del turno 1). ...
pruebas/resultados/2026-10-31-compactacion-pi-2.md:7:## Veredicto
```
El informe 2 pone el veredicto en la línea siguiente al encabezado: `**OK**, según los cinco criterios de la tarea, con una reserva ...`. La viñeta cita «OK con reserva», igual que el informe.

Criterio 3 (Claude Code), salida real de `grep -n "Claude Code" pruebas/README.md` (cada línea cortada a 90 caracteres con `cut -c1-90`):
```
8:- El ejecutor verifica antes de cada invocación con modelo que el agente instalado de Cl
9:- Modelo de cada agente: `node pruebas/comprobaciones/modelos-agentes.mjs` comprueba que
13:  - Lanzador en Claude Code `pruebas/lanzar-coordinador-claude.sh`.
21:  - `node --test pruebas/comprobaciones/resolver-compactacion-claude.test.mjs` (10 prue
28:  - Claude Code: no se hizo corrida con modelo (decisión de Franco, 2026-10-31): costo 
```
La línea 28 (viñeta nueva) cumple el criterio 3.

Verificación del paso 2 (`grep -n "compactacion" pruebas/README.md`, al menos 5 líneas), salida real cortada a 90 caracteres:
```
20:  - `node --test pruebas/comprobaciones/resolver-compactacion-pi.test.mjs` (20 pruebas)
21:  - `node --test pruebas/comprobaciones/resolver-compactacion-claude.test.mjs` (10 prue
22:  - `node --test pruebas/capa1/compactacion.test.mjs` (9 pruebas, unos 5 s): `instalar.
25:    - `pruebas/resultados/2026-10-31-compactacion-pi.md`: intento 1, **Veredicto: FALLA
26:    - `pruebas/resultados/2026-10-31-compactacion-pi-2.md`: intento 2, **Veredicto: OK*
28:  - Claude Code: no se hizo corrida con modelo (decisión de Franco, 2026-10-31): costo 
```
Son seis líneas. Cumple.

Verificación (`grep -n compactacion pruebas/rapida.sh`):
```
$ grep -n compactacion pruebas/rapida.sh
8:for f in pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs pruebas/capa1/instalacion.test.mjs pruebas/capa1/copia.test.mjs pruebas/capa1/skills-proyecto.test.mjs pruebas/capa1/compactacion.test.mjs; do
```

Rápida (una sola pasada, HOME real, log en `/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.tLAwILSwhT`):
```
$ R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -2 "$R"
rapida exit=0
ℹ duration_ms 13940.195125
rapida: 27 archivos en 14 s (tope 30 s)
$ grep -nE "^ℹ (tests|pass|fail|cancelled)" "$R"
282:ℹ tests 277
284:ℹ pass 277
285:ℹ fail 0
286:ℹ cancelled 0
```
La falla intermitente de `registro.e2e.test.mjs` no apareció, así que no hubo repetición.

Diff (criterio 5):
```
$ git diff --stat pruebas/README.md
 pruebas/README.md | 11 +++++++++++
 1 file changed, 11 insertions(+)
```
Solo `pruebas/README.md` de esta tarea.

## Notas
- Paso 1 (lectura): los cuatro archivos de prueba tienen la cabecera esperada. Los dos informes de Pi: intento 1 `Veredicto: FALLA` (umbral de 1500 tokens de margen); intento 2 `Veredicto` `**OK**` con reserva (18000 tokens de margen, `openai/gpt-6.1-sol`). `rapida.sh` incluye los cuatro archivos (línea 8: `pruebas/comprobaciones/*.test.mjs` y `pruebas/capa1/compactacion.test.mjs`); la rápida con HOME real dio exit 0 en 14 s con 277 pruebas y 0 fallas.
- Fuentes de las frases de la viñeta: «FALLA» y «OK con reserva» se copian de los informes; la causa del intento 1 y la reserva del intento 2 se resumen de sus textos de veredicto, sin interpretación nueva. El colchón de 33.000 y «umbral real ≈ ventana − 33 000» salen de `pruebas/resultados/2026-10-31-verificacion-compactacion.md` y de `COLCHON_CLAUDE_CODE = 33000` en `scripts/resolver.mjs`.
- Hueco menor (1): la tarea pide en el paso 1 que los veredictos queden anotados; eso se hizo aquí. El veredicto del intento 2 está como encabezado `## Veredicto` con `**OK**` en la línea siguiente, no como línea `Veredicto: OK`; la viñeta usa «Veredicto: OK» como la tarea lo pide y el informe lo confirma en su texto. Decisión: copiar «OK con reserva» tal cual aparece en el informe (su reserva está en la línea 11 y siguientes).
- Las citas de Evidencia de la verificación de `grep` se corrigieron después de la primera pasada: las primeras versiones de esos bloques no eran salida real y se reemplazaron por la salida real cortada con `cut -c1-90`. Anotado para que quede claro en la revisión.
- `pruebas/README.md` tiene 11 líneas nuevas; no se tocó ninguna otra línea. Sin cambios en código, comprobadores, informes ni `rapida.sh`.
- Falla intermitente de `registro.e2e.test.mjs`: no apareció en esta pasada; no se repitió.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
