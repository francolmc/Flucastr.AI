# task-07 — Corridas con modelo real del planificador (Claude Code y Pi)
repo: Flucastr.AI   depende_de: task-04, task-06   estado: aprobada

## Descripción
Única tarea de F42 que gasta créditos: corre `pruebas/correr-planificador.sh` una vez por herramienta y deja los informes en `pruebas/resultados/`. Solo se ejecuta con el visto bueno expreso de Franco. Patrón de F36 y de F39 task-06.

## Contexto
- Tocar: `features/F42-tareas-acotadas-topes/task-07-corridas-con-modelo-real-del-planificador.md`
- Leer: `pruebas/correr-planificador.sh`
- `correr-planificador.sh` (task-06) hace la precondición de modelos, lanza al planificador sobre el fixture de task-05 y escribe el informe con `Veredicto: OK` o `Veredicto: FALLA`.
- Solo se escriben los informes que genera el script y *Evidencia* y *Notas* de esta tarea.
- Exige red y sesión iniciada de `claude` y de `pi-planificador`; gasta tokens.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: red, largo:900

## Decisiones ya tomadas
- No se ajustan prompts, skills ni topes para obtener `OK`. Con `Veredicto: FALLA` no se edita nada: queda `lista para revisión` con el informe en *Evidencia* y la causa en *Notas*; Franco decide (si falla por no respetar los topes pese al mensaje del validador, se reconsidera la skill nueva descartada en `definitions/F42-TOPES.md` §2c).
- Si la precondición de modelos falla (salida 2): `BLOQUEO: rol=franco; motivo=entorno: reinstalar los agentes`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: dos corridas y sus informes.
Fuera de alcance: editar agentes, skills, pruebas o definiciones; repetir hasta obtener `OK`; el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Corre `bash pruebas/correr-planificador.sh claude-code` y anota la ruta del informe.
3. Corre `bash pruebas/correr-planificador.sh pi` y anota la ruta del informe.
4. Copia en *Evidencia* la línea `Veredicto:` y el nombre de cada informe; en *Notas*, las cifras por tarea de cada informe.

## Criterios de aceptación
1. Rama `feature/F42-tareas-acotadas-topes` (comando 1).
2. Cada corrida terminó con código 0 e imprimió su informe (comandos 2 y 3).
3. Existen los dos informes con su veredicto (comando 4).

## Verificación
```
git branch --show-current
bash pruebas/correr-planificador.sh claude-code
bash pruebas/correr-planificador.sh pi
grep -h "^Veredicto:" pruebas/resultados/*-planificador-*.md
```
Esperado: rama `feature/F42-tareas-acotadas-topes`; cada corrida termina en 0 e imprime `informe: ` y `Veredicto:`; el grep devuelve dos líneas.

## Evidencia

## Notas
