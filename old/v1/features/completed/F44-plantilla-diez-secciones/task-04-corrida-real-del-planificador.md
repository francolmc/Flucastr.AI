# task-04 — Corridas con modelo real del planificador (claude-code y pi)
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Única tarea de F44 que gasta créditos: corre `bash pruebas/correr-planificador.sh claude-code` y `bash pruebas/correr-planificador.sh pi` y deja los informes en `pruebas/resultados/`, para comprobar que las tareas que escribe el planificador con la plantilla corregida pasan `validar-tarea` sin rechazos de plantilla. Solo se ejecuta si el encargo trae la frase literal «Franco autoriza la prueba real de F44» y el modelo de Pi que indique Franco; sin esa frase, el constructor se detiene antes de lanzar nada.

## Contexto
- Tocar: `features/F44-plantilla-diez-secciones/task-04-corrida-real-del-planificador.md`
- `pruebas/correr-planificador.sh {claude-code|pi}` (F42) hace la precondición de modelos, crea el fixture de `pruebas/fixtures/planificador.sh`, lanza al planificador y escribe `pruebas/resultados/<fecha>-planificador-<herramienta>-<k>.md` con `Veredicto: OK` o `Veredicto: FALLA`; los rechazos de plantilla del validador salen aparte, bajo `Formato ajeno a los topes`.
- Para Pi, el modelo lo fija Franco en el encargo; si el encargo no lo trae, no se lanza `pi`.
- Solo se escriben los informes que genera el script y *Evidencia* y *Notas* de esta tarea.
- Exige red y sesión iniciada de `claude` y de `pi`; gasta tokens.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: red, largo:900

## Decisiones ya tomadas
- Sin la frase «Franco autoriza la prueba real de F44» en el encargo: `BLOQUEO: rol=franco; motivo=entorno: falta la autorización de la prueba real de F44`, sin lanzar ninguna corrida.
- No se ajustan prompts, skills ni topes para obtener `OK`. Con `Veredicto: FALLA` o con líneas bajo `Formato ajeno a los topes` en la sección de decisiones del informe, no se edita nada: la tarea queda `lista para revisión` con el informe en *Evidencia* y la causa en *Notas*; Franco decide.
- Si la precondición de modelos falla (salida 2): `BLOQUEO: rol=franco; motivo=entorno: reinstalar los agentes`.
- Cada herramienta se corre una sola vez.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: dos corridas y sus informes.
Fuera de alcance: editar agentes, skills, pruebas o definiciones; repetir hasta obtener `OK`; el commit.

## Pasos
1. Corre `git branch --show-current` y comprueba que el encargo trae la frase de autorización y el modelo de Pi; si no, detente como indica *Decisiones ya tomadas*.
2. Corre `bash pruebas/correr-planificador.sh claude-code` y anota la ruta del informe.
3. Corre `bash pruebas/correr-planificador.sh pi` y anota la ruta del informe.
4. En *Evidencia* pega las salidas; en *Notas*, la línea `Veredicto:` de cada informe y, si las hay, las líneas bajo `Formato ajeno a los topes` copiadas tal cual.

## Criterios de aceptación
1. Rama `fix/F44-plantilla-diez-secciones` (comando 1).
2. Cada corrida terminó con código 0 e imprimió `informe:` (comandos 2 y 3).
3. Existe un informe nuevo por herramienta con su veredicto (comando 4).
4. Ninguna línea de `Formato ajeno a los topes` menciona `Decisiones abiertas` (comando 5).

## Verificación
```
git branch --show-current
bash pruebas/correr-planificador.sh claude-code
bash pruebas/correr-planificador.sh pi
grep -h "^Veredicto:" pruebas/resultados/*-planificador-claude-code-*.md pruebas/resultados/*-planificador-pi-*.md
grep -c "Decisiones abiertas" pruebas/resultados/*-planificador-pi-*.md
```
Esperado: rama `fix/F44-plantilla-diez-secciones`; las dos corridas terminan en 0 e imprimen `informe: ` y `Veredicto:`; el cuarto comando lista una línea `Veredicto:` por informe; el quinto imprime `0` para los informes nuevos (los de F42 pueden traer otro número y se ignoran).

## Evidencia

```
$ git branch --show-current
fix/F44-plantilla-diez-secciones
exit 0
```

```
$ bash pruebas/correr-planificador.sh claude-code
modelos de agentes instalados vigentes
informe: pruebas/resultados/2026-11-05-planificador-claude-code-5.md
Veredicto: OK
exit 0
```

```
# con FLUCASTR_PI_BIN=<scratchpad>/pi-planificador-luna (ver Notas)
$ bash pruebas/correr-planificador.sh pi
modelos de agentes instalados vigentes
informe: pruebas/resultados/2026-11-05-planificador-pi-4.md
Veredicto: FALLA
exit 0
```

```
$ grep -h "^Veredicto:" pruebas/resultados/*-planificador-claude-code-*.md pruebas/resultados/*-planificador-pi-*.md
Veredicto: FALLA
Veredicto: FALLA
Veredicto: FALLA
Veredicto: FALLA
Veredicto: FALLA
Veredicto: OK
Veredicto: FALLA
Veredicto: OK
Veredicto: OK
exit 0
```

```
$ grep -c "Decisiones abiertas" pruebas/resultados/*-planificador-pi-*.md
pruebas/resultados/2026-11-05-planificador-pi-1.md:0
pruebas/resultados/2026-11-05-planificador-pi-2.md:0
pruebas/resultados/2026-11-05-planificador-pi-3.md:0
pruebas/resultados/2026-11-05-planificador-pi-4.md:0
exit 1
```
(exit 1 de grep -c: sin coincidencias; los cuatro dan 0.)

## Notas
- Hueco menor 1 (decisión): el `pi-planificador` instalado resuelve `openai/gpt-6.1-sol` desde modelos.json, no `openai/gpt-6-luna` que indicó Franco. No se editaron modelos.json, configuración de Pi, scripts ni ~/.pi. Se usó FLUCASTR_PI_BIN apuntando a un envoltorio temporal fuera del repo (scratchpad) que replica pi-planificador con `--model openai/gpt-6-luna`. Franco debe saber que el instalado sigue en gpt-6.1-sol.
- Pi: `Veredicto: FALLA` (informe pi-4). Causa en el informe: línea «Leer» con formato inválido en task-01-cli-temporizado.md y task-02-pruebas-cli.md (debe ser «- Leer: `ruta`, `ruta@offset-limit`»). Formato ajeno a los topes (copiado tal cual):
  - task-01-cli-temporizado.md: «Tocar» debe listar las rutas entre comillas invertidas, separadas por «, ».
  - task-02-pruebas-cli.md: «Tocar» debe listar las rutas entre comillas invertidas, separadas por «, ».
  No se editó nada, según *Decisiones ya tomadas*.
- Claude Code: `Veredicto: OK` (claude-code-5). Formato ajeno a los topes: ninguno.
- Criterio 4: ninguna línea de «Formato ajeno a los topes» menciona «Decisiones abiertas» (pi-4 tiene 0 apariciones).
- Cada corrida se lanzó una sola vez; no se repitió ninguna.
- Aviso de Pi (no leído ni editado): `~/.pi/agent/settings.json` tiene JSON inválido en la línea 20.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
