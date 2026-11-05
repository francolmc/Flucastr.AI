# task-01 — Regla de rol del coordinador: skill y puntero sin crecer el prompt
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
`agentes/coordinador.md` mide 7155 de 7168 bytes y no puede crecer. La regla de rol de F41 (Franco hace solo lo suyo; lo demás se delega o se resuelve con un comando de la lista cerrada) va completa en `skills/comandos-coordinador/SKILL.md` (2866 de 5120 bytes). En el prompt solo entra un puntero que obliga a cargar la skill antes de pedirle algo a Franco, con cambio neto de 0 bytes.

## Contexto
- Tocar: `skills/comandos-coordinador/SKILL.md`, `agentes/coordinador.md`
- `agentes/coordinador.md`, párrafo «Carga `comandos-coordinador` al pedirte Franco un comando, antes de `descomponer-feature`, al cerrar una feature o sin subagentes.»: ahí se cambia el final. La fila final de la tabla termina en «...que le avisa. No interpretas ni «arreglas».»: se borra la última frase para compensar (confirmado: «arreglas» no está en ninguna prueba).
- `skills/comandos-coordinador/SKILL.md`: la nueva sección va justo antes de `## Comandos que puede correr`.
- Las pruebas de `coordinador-status.test.mjs` exigen `empieza vacía o resumida` y las de `frases-por-archivo.mjs` exigen `al pedirte Franco un comando`: no se tocan.
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- La especificación es la viñeta «Alcance de F41 (Franco, 2026-11-04)» de esa sección.
- Requiere: ninguno

## Decisiones ya tomadas
- Cambio 1, en `coordinador.md`: «al cerrar una feature o sin subagentes.» pasa a «al cerrar una feature, sin subagentes o antes de pedirle algo a Franco.» (+32 bytes).
- Cambio 2, en `coordinador.md`: se borra « No interpretas ni «arreglas».» al final de la fila «Nada de lo anterior: escalación» (-32 bytes). Resultado: 7155 bytes exactos.
- Cambio 3, en la skill, sección nueva con este texto exacto (en español, sin emojis):

```
## Rol: qué hace Franco y qué delegas

Franco hace solo lo suyo por diseño: aprobar puertas, decidir, commit, PR y despliegue, responder `CONFIRMAR:` y las escalaciones. Todo lo demás lo delegas a un rol o lo resuelves con un comando de tu lista cerrada:

- Backlog y tareas, incluida la marca `→` de `BACKLOG.md`: `planificador`.
- Definiciones y `AGENTS.md`: `arquitecto`; si toca `definitions/WORKFLOW.md`, con la autorización de Franco.
- Código: `constructor`.

No le pasas a Franco comandos manuales (`sed`, ediciones) que correspondan a un rol. Si un archivo no tiene dueño, lo dices y propones uno; no se lo pasas a Franco.
```

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: los tres cambios de texto.
Fuera de alcance: `definitions/` (asignar dueño a `definitions/PENDIENTES.md` cambia `WORKFLOW.md` §2 y vuelve a la puerta 1), los límites de escritura del coordinador, otras skills, las pruebas (task-02).

## Pasos
1. Comprueba `git branch --show-current`; si no es la rama esperada, detente con `BLOQUEO:`.
2. Aplica los cambios 1 y 2 en `agentes/coordinador.md` con `Edit`.
3. Inserta la sección del cambio 3 en la skill, con una línea en blanco antes y después.
4. Corre la *Verificación*.

## Criterios de aceptación
1. La rama activa es `fix/F41-coordinador-delega-su-rol` (comando 1).
2. La skill contiene la regla y el prompt el puntero, y ya no está la frase sobrante (comandos 2 a 4).
3. `coordinador.md` mide 7155 bytes o menos y la skill 5120 o menos (comandos 5 y 6).
4. Las pruebas de contrato del coordinador pasan (comando 7) y solo cambiaron los dos archivos (comando 8).

## Verificación
Comando 1:
```
git branch --show-current
```
Esperado: `fix/F41-coordinador-delega-su-rol`.

Comando 2:
```
grep -c 'Franco hace solo lo suyo' skills/comandos-coordinador/SKILL.md
```
Esperado: `1`.

Comando 3:
```
grep -c 'antes de pedirle algo a Franco' agentes/coordinador.md
```
Esperado: `1`.

Comando 4:
```
grep -c 'arreglas' agentes/coordinador.md
```
Esperado: `0`.

Comando 5:
```
wc -c agentes/coordinador.md
```
Esperado: un número menor o igual a 7155.

Comando 6:
```
wc -c skills/comandos-coordinador/SKILL.md
```
Esperado: un número menor o igual a 5120.

Comando 7:
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'
```
Esperado: `ℹ fail 0`.

Comando 8:
```
git diff --stat -- agentes skills
```
Esperado: solo `agentes/coordinador.md` y `skills/comandos-coordinador/SKILL.md`.

## Evidencia
Comando 1:

```
$ git branch --show-current
fix/F41-coordinador-delega-su-rol
exit 0
```

Comando 2:

```
$ grep -c 'Franco hace solo lo suyo' skills/comandos-coordinador/SKILL.md
1
exit 0
```

Comando 3:

```
$ grep -c 'antes de pedirle algo a Franco' agentes/coordinador.md
1
exit 0
```

Comando 4 (`grep -c` sin coincidencias devuelve exit 1; el resultado es `0`, como se espera):

```
$ grep -c 'arreglas' agentes/coordinador.md
0
exit 1
```

Comando 5:

```
$ wc -c agentes/coordinador.md
7155 agentes/coordinador.md
exit 0
```

Comando 6:

```
$ wc -c skills/comandos-coordinador/SKILL.md
3508 skills/comandos-coordinador/SKILL.md
exit 0
```

Comando 7:

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'
ℹ fail 0
exit 0
```

Comando 8:

```
$ git diff --stat -- agentes skills
 agentes/coordinador.md               |  4 ++--
 skills/comandos-coordinador/SKILL.md | 10 ++++++++++
 2 files changed, 12 insertions(+), 2 deletions(-)
exit 0
```

## Notas
- Rama creada con `git switch -c fix/F41-coordinador-delega-su-rol` desde `main` (no existía; sin confirmación necesaria).
- Cambios aplicados tal cual a *Decisiones ya tomadas*: `coordinador.md` queda en 7155 bytes; la skill en 3508 bytes (tope 5120).
- Sin huecos menores.
- Sin commit, push, PR, merge ni despliegue. Franco revisa la *Evidencia* y commitea.

Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
