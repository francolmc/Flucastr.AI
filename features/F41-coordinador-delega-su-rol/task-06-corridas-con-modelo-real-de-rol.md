# task-06 — Corridas con modelo real de la regla de rol (Claude Code y Pi)
repo: Flucastr.AI   depende_de: task-05   estado: aprobada

## Descripción
Última tarea de F41 y la única que gasta créditos: corre `pruebas/correr-rol.sh` una vez por herramienta, con los dos escenarios (mover el `→` tras cerrar una feature y editar una definición), y deja los informes en `pruebas/resultados/`. Solo se ejecuta con el visto bueno expreso de Franco.

## Contexto
- Tocar: `features/F41-coordinador-delega-su-rol/task-06-corridas-con-modelo-real-de-rol.md`, `pruebas/resultados/README.md`
- `pruebas/correr-rol.sh` (task-04) hace la precondición de modelos, lanza el coordinador sobre el fixture de task-03 y escribe `pruebas/resultados/AAAA-MM-DD-rol-<herramienta>-<k>.md` con `Veredicto: OK` o `Veredicto: FALLA`.
- Solo se escriben los informes que genera el script y *Evidencia* y *Notas* de esta tarea.
- La corrida exige red, sesión iniciada de `claude` y de `pi-coordinador` y gasta tokens; Pi corta cada lanzamiento a los 300 s.
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- La especificación es la viñeta «Alcance de F41 (Franco, 2026-11-04)» de esa sección.
- Requiere: red, largo:1500

## Decisiones ya tomadas
- No se ajustan prompts ni umbrales para obtener `OK`. Con `Veredicto: FALLA` no se edita nada: la tarea queda en `lista para revisión` con el informe en *Evidencia* y la causa en *Notas*, y Franco decide.
- Si la precondición de modelos falla (salida 2), se detiene con `BLOQUEO: rol=franco; motivo=entorno: reinstalar los agentes`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: dos corridas y sus informes.
Fuera de alcance: editar agentes, skills, pruebas o definiciones; repetir corridas hasta que salga `OK`; el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Corre `bash pruebas/correr-rol.sh claude-code` y anota la ruta del informe.
3. Corre `bash pruebas/correr-rol.sh pi` y anota la ruta del informe.
4. Lee la línea `Veredicto:` de cada informe y copia en *Evidencia* esas líneas y el nombre de los informes.
5. Anota en *Notas* qué delegó el coordinador en cada escenario.

## Criterios de aceptación
1. La rama activa es `fix/F41-coordinador-delega-su-rol` (comando 1).
2. Cada corrida terminó con código 0 e imprimió su informe (comandos 2 y 3).
3. Existen los dos informes y se registró su veredicto (comando 4).

## Verificación
Comando 1:
```
git branch --show-current
```
Esperado: `fix/F41-coordinador-delega-su-rol`.

Comando 2:
```
bash pruebas/correr-rol.sh claude-code
```
Esperado: código 0, una línea `informe: <ruta>` y `Veredicto: OK`.

Comando 3:
```
bash pruebas/correr-rol.sh pi
```
Esperado: código 0, una línea `informe: <ruta>` y `Veredicto: OK`.

Comando 4:
```
grep -H 'Veredicto:' pruebas/resultados/*-rol-claude-code-*.md pruebas/resultados/*-rol-pi-*.md
```
Esperado: una línea `Veredicto: OK` por cada informe de esta corrida.

## Evidencia
(El ejecutor pega aquí la cola relevante de cada salida, hasta 1,5 KB.)

## Notas
(Vacío hasta ejecutar.)
