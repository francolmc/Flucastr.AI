# task-10 — Corridas con modelo real del planificador (Claude Code; Pi ya dio OK)
repo: Flucastr.AI   depende_de: task-04, task-08, task-09   estado: hecha

## Descripción
Única tarea de F42 que gasta créditos: corre `pruebas/correr-planificador.sh claude-code` una vez y deja el informe `-4.md` (Pi ya dio `Veredicto: OK` en `-3.md`, que se conserva) en `pruebas/resultados/`. Solo se ejecuta con el visto bueno expreso de Franco. Patrón de F36 y de F39 task-06.

## Contexto
- Tocar: `features/F42-tareas-acotadas-topes/task-10-corridas-con-modelo-real-del-planificador.md`
- Tras la corrección de task-09 (la skill aclara que «Leer» y «Tocar» son una línea cada una; la corrida `claude-code-3` falló por dos líneas «- Leer:»), se repite solo la corrida de Claude Code; los créditos ya los autorizó Franco el 2026-11-05 (última ronda: opción A). Los informes anteriores (`-1.md`, `-2.md`, `-3.md`) quedan, incluido `pi-3.md` (`Veredicto: OK`, no se repite). La corrida nueva escribe `claude-code-4.md`. Lo ya anotado en *Evidencia* y *Notas* es del intento `-3`; se conserva y se añade el de `-4` debajo.
- `correr-planificador.sh` (task-06, ajustado por task-07) hace la precondición de modelos, lanza al planificador sobre el fixture de task-05 y escribe el informe con `Veredicto: OK` o `Veredicto: FALLA`. Desde task-08 el veredicto depende solo de los topes (leer ≤4, tocar ≤3, pasos ≤6, criterios ≤5, contexto ≤12 KB) y de que el planificador cree tareas en `borrador`; los rechazos de plantilla del validador van aparte, bajo `Formato ajeno a los topes`.
- Solo se escriben los informes que genera el script y *Evidencia* y *Notas* de esta tarea.
- Exige red y sesión iniciada de `claude`; gasta tokens.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: red, largo:900

## Decisiones ya tomadas
- No se ajustan prompts, skills ni topes para obtener `OK` en las corridas (el cambio de task-09 ya está hecho antes). Con `Veredicto: FALLA` no se edita nada (es la última ronda: Franco cierra F42 incompleta si falla de nuevo): queda `lista para revisión` con el informe en *Evidencia* y la causa en *Notas*; Franco decide (si falla por no respetar los topes pese al mensaje del validador, se reconsidera la skill nueva descartada en `definitions/F42-TOPES.md` §2c).
- Si la precondición de modelos falla (salida 2): `BLOQUEO: rol=franco; motivo=entorno: reinstalar los agentes`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: dos corridas y sus informes.
Fuera de alcance: editar agentes, skills, pruebas o definiciones; repetir hasta obtener `OK`; el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Lee `pruebas/correr-planificador.sh` (task-06, ajustado por task-07) y anota el siguiente número libre de informe de claude-code (`-4`).
3. Corre `bash pruebas/correr-planificador.sh claude-code` y anota la ruta del informe.
4. Añade en *Evidencia* (sin borrar lo anterior) la línea `Veredicto:` y el nombre del informe `-4`; en *Notas*, las cifras por tarea y, si trae líneas bajo `Formato ajeno a los topes`, cópialas tal cual.

## Criterios de aceptación
1. Rama `feature/F42-tareas-acotadas-topes` (comando 1).
2. La corrida terminó con código 0 e imprimió su informe (comando 2).
3. Existe `pruebas/resultados/2026-11-05-planificador-claude-code-4.md` con su veredicto (comando 3).

## Verificación
```
git branch --show-current
bash pruebas/correr-planificador.sh claude-code
grep -h "^Veredicto:" pruebas/resultados/2026-11-05-planificador-claude-code-4.md
```
Esperado: rama `feature/F42-tareas-acotadas-topes`; la corrida termina en 0 e imprime `informe: ` y `Veredicto:`; el grep devuelve una línea (`OK` o `FALLA`).

## Evidencia

Intento -3 (claude-code FALLA; pi OK, no se repite):

```
$ bash pruebas/correr-planificador.sh claude-code
informe: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/resultados/2026-11-05-planificador-claude-code-3.md
Veredicto: FALLA
exit 0
```

```
$ bash pruebas/correr-planificador.sh pi
informe: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/resultados/2026-11-05-planificador-pi-3.md
Veredicto: OK
exit 0
```

Intento -4 (claude-code, única repetición tras task-09):

```
$ git branch --show-current
feature/F42-tareas-acotadas-topes
exit 0
```

```
$ bash pruebas/correr-planificador.sh claude-code
modelos de agentes instalados vigentes
informe: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/resultados/2026-11-05-planificador-claude-code-4.md
Veredicto: OK
exit 0
```

```
$ grep -h "^Veredicto:" pruebas/resultados/2026-11-05-planificador-claude-code-4.md
Veredicto: OK
exit 0
```

Reintento de recorte (2026-11-05): se reejecutan los dos comandos sin modelo; la corrida con modelo no se repite.

```
$ git branch --show-current
feature/F42-tareas-acotadas-topes
exit 0
```

```
$ grep -h "^Veredicto:" pruebas/resultados/2026-11-05-planificador-claude-code-4.md
Veredicto: OK
exit 0
```

Informes: `pruebas/resultados/2026-11-05-planificador-claude-code-3.md` (FALLA), `pruebas/resultados/2026-11-05-planificador-pi-3.md` (OK), `pruebas/resultados/2026-11-05-planificador-claude-code-4.md` (OK).

## Notas
Corridas con modelo real, una por herramienta, sin ajustar nada (Decisiones ya tomadas). Los informes `-1.md` y `-2.md` de intentos anteriores quedan sin tocar.

Intento -3 (última ronda autorizada por Franco el 2026-11-05):
- claude-code: Veredicto FALLA. Causa: «Leer» duplicado; hay más de una línea «- Leer:» en «## Contexto» (task-01-cli-tiempos.md y task-02-pruebas-cli.md). Ningún tope excedido. Formato ajeno: «Tocar» debe listar las rutas entre comillas invertidas (ambas tareas).
- pi: Veredicto OK (una tarea en `borrador`, topes dentro de rango). No se repite.

Intento -4 (claude-code, tras la corrección de task-09; una sola corrida, sin ajustar nada):
- Veredicto claude-code: OK (informe `pruebas/resultados/2026-11-05-planificador-claude-code-4.md`).
- Cifras por tarea: claude-code: Tareas: 2; task-01-cli-tiempos.md (pasos 4; archivos a leer 1; bytes de contexto 551; archivos a tocar 2); task-02-pruebas-cli.md (pasos 3; archivos a leer 1; bytes de contexto 551; archivos a tocar 1). Motivos: ninguno. Formato ajeno a los topes: ninguno.

Reintento de recorte (2026-11-05): el validador rechazó la tarea por 8196 caracteres (máximo 8192). Se recortaron *Evidencia* y *Notas* sin cambiar los veredictos, las cifras de `-4` ni las líneas `Registro:`. No se ejecutó ninguna corrida con modelo; `git branch` y `grep` sobre el informe `-4` se reejecutaron. Veredicto final: OK en `-4`, no hay causa que anotar. Franco decide el cierre de F42.

Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

Registro: n=2; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

Registro: n=3; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

Registro: n=4; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

Registro: n=5; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
