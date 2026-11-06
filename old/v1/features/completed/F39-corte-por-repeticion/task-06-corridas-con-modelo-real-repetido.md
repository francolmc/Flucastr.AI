# task-06 — Corridas con modelo real del corte por repetición (Claude Code y Pi)
repo: Flucastr.AI   depende_de: task-05   estado: hecha

## Descripción
Última tarea de F39 y la única que gasta créditos: corre `pruebas/correr-repetido.sh` una vez por herramienta y deja los informes en `pruebas/resultados/`. Solo se ejecuta con el visto bueno expreso de Franco.

## Contexto
- Tocar: `features/F39-corte-por-repeticion/task-06-corridas-con-modelo-real-repetido.md`
- `pruebas/correr-repetido.sh` (task-05) hace la precondición de modelos, lanza el coordinador sobre el fixture de task-04 y escribe `pruebas/resultados/AAAA-MM-DD-repetido-<herramienta>-<k>.md` con `Veredicto: OK` o `Veredicto: FALLA`.
- Solo se escriben los informes que genera el script y *Evidencia* y *Notas* de esta tarea.
- Exige red y sesión iniciada de `claude` y de `pi-coordinador`; gasta tokens; Pi corta cada lanzamiento a los 300 s.
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- Especificación: viñeta «Alcance de F37–F39 (Franco, 2026-11-04)», parte F39: la corrida confirma que no ofrece «A».
- Requiere: red, largo:900

## Decisiones ya tomadas
- No se ajustan prompts ni umbrales para obtener `OK`. Con `Veredicto: FALLA` no se edita nada: queda `lista para revisión` con el informe en *Evidencia* y la causa en *Notas*; Franco decide.
- Si la precondición de modelos falla (salida 2): `BLOQUEO: rol=franco; motivo=entorno: reinstalar los agentes`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: dos corridas y sus informes.
Fuera de alcance: editar agentes, skills, pruebas o definiciones; repetir hasta obtener `OK`; el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Corre `bash pruebas/correr-repetido.sh claude-code` y anota la ruta del informe.
3. Corre `bash pruebas/correr-repetido.sh pi` y anota la ruta del informe.
4. Copia en *Evidencia* la línea `Veredicto:` y el nombre de cada informe; en *Notas*, las letras que ofreció cada coordinador.

## Criterios de aceptación
1. Rama `feature/F39-corte-por-repeticion` (comando 1).
2. Cada corrida terminó con código 0 e imprimió su informe (comandos 2 y 3).
3. Existen los dos informes con su veredicto (comando 4).

## Verificación
```
git branch --show-current
bash pruebas/correr-repetido.sh claude-code
bash pruebas/correr-repetido.sh pi
grep -h "^Veredicto:" pruebas/resultados/*-repetido-*.md
```
Esperado: rama `feature/F39-corte-por-repeticion`; cada corrida termina en 0 e imprime `informe: ` y `Veredicto:`; el grep devuelve dos líneas.

## Evidencia

```
$ git branch --show-current
feature/F39-corte-por-repeticion
exit 0
```

```
$ bash pruebas/correr-repetido.sh claude-code
modelos de agentes instalados vigentes
informe: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/resultados/2026-11-05-repetido-claude-code-2.md
Veredicto: OK
exit 0
```

```
$ bash pruebas/correr-repetido.sh pi
modelos de agentes instalados vigentes
]777;notify;Pi;Ready for inputinforme: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/resultados/2026-11-05-repetido-pi-1.md
Veredicto: OK
exit 0
```

```
$ grep -h "^Veredicto:" pruebas/resultados/*-repetido-*.md
Veredicto: OK
Veredicto: OK
Veredicto: FALLA
exit 0
```

Informes: `pruebas/resultados/2026-11-05-repetido-claude-code-2.md` (Veredicto: OK, corrida de este reintento; letras C y D) y `pruebas/resultados/2026-11-05-repetido-pi-1.md` (Veredicto: OK, primer intento, conservado). El informe `pruebas/resultados/2026-11-05-repetido-claude-code-1.md` (Veredicto: FALLA, primer intento de Claude Code por denegación de `Bash`) se conserva en disco y ya no es la evidencia de la tarea.

## Notas

- Corrida de Claude Code: `Veredicto: FALLA`, modelo claude-sonnet-5-5. El informe dice que el coordinador no pudo seguir porque el entorno denegó `Bash` (modo «don't ask»), así que no llegó a delegar ni a escalar. No se ofreció ninguna letra. Hecho reportado tal cual; no se editó código, prompts ni reglas.
- Corrida de Pi: `Veredicto: OK`, modelo gpt-6.1-sol. Letras ofrecidas por el coordinador: C) «Cerrar la sesión y revisar a mano», D) «Cerrar F01 como incompleta y abrir la siguiente con presupuesto propio».
- Cada herramienta se corrió una sola vez. El veredicto FALLA no es un fallo de la tarea: los criterios de aceptación (rama, código 0 con informe, dos veredictos) se cumplen.
- Reintento (Franco confirmó `git switch feature/F39-corte-por-repeticion`): rama existente, cambio con `git switch` sin `-c`; `git branch --show-current` devuelve `feature/F39-corte-por-repeticion`. Solo se repitió la corrida de Claude Code, una vez; la de Pi no se repitió.
- Comandos denegados en el primer intento de Claude Code (informe `-1`): el modelo pidió `node ~/.flucastr-ai/validar-tarea.mjs --presupuesto features/F01-demo` y `node ~/.flucastr-ai/validar-tarea.mjs --fuente features/F01-demo/task-01-rota.md`, y el entorno los denegó (modo «don't ask»). En el reintento (`-2`) el informe no menciona denegación (búsqueda de «denegad» y «permission» sin coincidencias): el modelo llegó a escalar. No se cambiaron agentes, prompts, reglas, lanzadores ni código.
- Corrida de Claude Code del reintento: `Veredicto: OK`, modelo claude-sonnet-5-5, escalación «se repite»: sí. Letras ofrecidas: C) «Cerrar la sesión y revisar a mano», D) «Cerrar F01 como incompleta y abrir la siguiente». El informe de `-1` (FALLA) queda en disco, pero la evidencia de la tarea usa `-2`.
- Hueco menor: en la corrida de Claude Code la herramienta no devolvió el código de salida (la línea `exit` salió vacía). El `exit 0` de la *Evidencia* se deduce del flujo del script, que imprime `informe:` y `Veredicto:` solo justo antes de `exit 0`. No se repitió la corrida para no gastar más créditos; Franco puede confirmarlo.
- Corrida de Pi (primer intento, conservada): `Veredicto: OK`, modelo gpt-6.1-sol, letras C) y D).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
Registro: n=2; herramienta=claude-code; modo=normal; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
