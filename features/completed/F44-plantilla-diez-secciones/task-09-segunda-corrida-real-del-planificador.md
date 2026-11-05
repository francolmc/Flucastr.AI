# task-09 — Segunda corrida con modelo real del planificador (pi y claude-code)
repo: Flucastr.AI   depende_de: task-08   estado: hecha

## Descripción
Repite la corrida de task-04 con la skill endurecida (task-05) y los mensajes nuevos (task-06): `bash pruebas/correr-planificador.sh pi` y `bash pruebas/correr-planificador.sh claude-code`, para comprobar que ambos modelos escriben tareas sin rechazos de Leer, Tocar ni Fuente. Gasta créditos: solo se ejecuta si el encargo trae la frase literal «Franco autoriza la prueba real de F44» y el modelo de Pi que indique Franco; sin esa frase, el constructor se detiene antes de lanzar nada.

## Contexto
- Tocar: `features/F44-plantilla-diez-secciones/task-09-segunda-corrida-real-del-planificador.md`
- `pruebas/correr-planificador.sh {claude-code|pi}` hace la precondición de modelos, crea el fixture, lanza al planificador y escribe `pruebas/resultados/<fecha>-planificador-<herramienta>-<k>.md` con `Veredicto: OK` o `Veredicto: FALLA`; los rechazos de formato salen aparte, bajo `Formato ajeno a los topes`.
- En task-04 el `pi-planificador` instalado resolvía `openai/gpt-6.1-sol` y Franco indicó `openai/gpt-6-luna`; se usó `FLUCASTR_PI_BIN` con un envoltorio temporal fuera del repo. El modelo de Pi lo fija Franco en el encargo.
- Solo se escriben los informes que genera el script y *Evidencia* y *Notas* de esta tarea.
- Exige red y sesión iniciada de `claude` y de `pi`; gasta tokens.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: red, largo:900

## Decisiones ya tomadas
- Sin la frase «Franco autoriza la prueba real de F44» en el encargo: `BLOQUEO: rol=franco; motivo=entorno: falta la autorización de la prueba real de F44`, sin lanzar ninguna corrida.
- Sin el modelo de Pi en el encargo no se lanza `pi`.
- No se ajustan prompts, skills, validador ni topes para obtener `OK`. Con `Veredicto: FALLA` o líneas bajo `Formato ajeno a los topes`, no se edita nada: la tarea queda `lista para revisión` con el informe en *Evidencia* y la causa en *Notas*; Franco decide.
- Si la precondición de modelos falla (salida 2): `BLOQUEO: rol=franco; motivo=entorno: reinstalar los agentes`.
- Cada herramienta se corre una sola vez.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: dos corridas y sus informes.
Fuera de alcance: editar agentes, skills, pruebas, scripts o definiciones; repetir hasta obtener `OK`; el commit.

## Pasos
1. Corre `git branch --show-current` y comprueba que el encargo trae la frase de autorización y el modelo de Pi; si no, detente como indica *Decisiones ya tomadas*.
2. Corre `bash pruebas/correr-planificador.sh pi` y anota la ruta del informe.
3. Corre `bash pruebas/correr-planificador.sh claude-code` y anota la ruta del informe.
4. En *Evidencia* pega las salidas; en *Notas*, la línea `Veredicto:` de cada informe y, si las hay, las líneas bajo `Formato ajeno a los topes` copiadas tal cual.

## Criterios de aceptación
1. Rama `fix/F44-plantilla-diez-secciones` (comando 1).
2. Cada corrida terminó con código 0 e imprimió `informe:` (comandos 2 y 3).
3. Existe un informe nuevo por herramienta con su veredicto (comando 4).
4. Ningún informe nuevo menciona `Leer`, `Tocar` ni `Fuente` bajo «Formato ajeno a los topes» (comando 5).

## Verificación
```
git branch --show-current
bash pruebas/correr-planificador.sh pi
bash pruebas/correr-planificador.sh claude-code
ls -t pruebas/resultados/*-planificador-pi-*.md pruebas/resultados/*-planificador-claude-code-*.md | head -2 | xargs grep -h "^Veredicto:"
ls -t pruebas/resultados/*-planificador-pi-*.md pruebas/resultados/*-planificador-claude-code-*.md | head -2 | xargs grep -c "tiene formato inválido\|debe listar las rutas"
```
Esperado: rama `fix/F44-plantilla-diez-secciones`; las dos corridas terminan en 0 e imprimen `informe: ` y `Veredicto:`; el cuarto comando lista dos líneas `Veredicto:`; el quinto imprime `:0` para los dos informes más recientes.

## Evidencia

```
$ git branch --show-current
fix/F44-plantilla-diez-secciones
exit 0
```

```
$ bash pruebas/correr-planificador.sh pi
modelos de agentes instalados vigentes
Warning: Invalid settings file /Users/franco/.pi/agent/settings.json: Expected double-quoted property name in JSON at position 453 (line 20 column 9)
informe: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/resultados/2026-11-05-planificador-pi-5.md
Veredicto: OK
exit 0
```

```
$ bash pruebas/correr-planificador.sh claude-code
modelos de agentes instalados vigentes
informe: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/resultados/2026-11-05-planificador-claude-code-6.md
Veredicto: FALLA
exit 0
```

```
$ ls -t pruebas/resultados/*-planificador-pi-*.md pruebas/resultados/*-planificador-claude-code-*.md | head -2 | xargs grep -h "^Veredicto:"
Veredicto: FALLA
Veredicto: OK
exit 0
```

```
$ ls -t pruebas/resultados/*-planificador-pi-*.md pruebas/resultados/*-planificador-claude-code-*.md | head -2 | xargs grep -c "tiene formato inválido\|debe listar las rutas"
pruebas/resultados/2026-11-05-planificador-claude-code-6.md:0
pruebas/resultados/2026-11-05-planificador-pi-5.md:0
exit 1
```

## Notas

- Modelo de Pi: `pi-planificador` no acepta modelo en `correr-planificador.sh`, así que se usó `FLUCASTR_PI_BIN` con un envoltorio fuera del repo (`/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/3d5d0b53-8b8d-4c92-bda3-69eff71de12b/scratchpad/pi-luna.sh`) que ejecuta `pi-planificador --model openai/gpt-6-luna "$@"`. Mismo procedimiento que task-04. No se editó `modelos.json`. La corrida de pi se lanzó como `FLUCASTR_PI_BIN=<envoltorio> bash pruebas/correr-planificador.sh pi`.
- Verificación: los comandos 2 y 3 de *Verificación* son las mismas corridas de *Pasos* 2 y 3; no se repitieron, para respetar «cada herramienta se corre una sola vez». Su salida está en *Evidencia*.
- Veredictos: pi `Veredicto: OK` (informe `pruebas/resultados/2026-11-05-planificador-pi-5.md`); claude-code `Veredicto: FALLA` (informe `pruebas/resultados/2026-11-05-planificador-claude-code-6.md`).
- Línea `Veredicto:` de cada informe: claude-code `Veredicto: FALLA`; pi `Veredicto: OK`.
- Formato ajeno a los topes: ninguno en ninguno de los dos informes (criterio 4 cumplido: no aparece `Leer`, `Tocar` ni `Fuente` bajo esa sección).
- Causa del FALLA de claude-code: el validador de Leer rechazó `src/cli.js` en `task-02-opcion-tiempos.md` («El archivo de Leer no se puede leer»). Es un rechazo de Leer, no de formato; no se ajustó nada, según *Decisiones ya tomadas*. Franco decide.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
