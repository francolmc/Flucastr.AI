# task-07 — El planificador pone `git branch --show-current` como primer comando de Verificación
repo: Flucastr.AI   depende_de: task-06   estado: hecha

## Descripción
`skills/descomponer-feature/SKILL.md` prohíbe en yolo que la *Verificación* dependa de la rama actual. Con la nueva regla (`definitions/WORKFLOW.md` §9.1, bullet «Comprobación»), la primera línea de *Verificación* de cada tarea es `git branch --show-current` con la rama esperada, y el planificador la deriva solo: prefijo de la fila de la feature en el backlog más la carpeta `Fxx-nombre` (decisión de Franco, 2026-11-04; el coordinador no la pasa). El constructor pega su salida en *Evidencia* con el mecanismo de F25.

## Contexto
- Tocar: `skills/descomponer-feature/SKILL.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- `skills/descomponer-feature/SKILL.md` hoy 6339 bytes, tope 6400.
  - Línea 19 (paso 2): sustituir «En yolo, ninguna tarea pide crear rama, hacer `git switch` ni commit, ni modificar `definitions/`, y su *Verificación* no depende de la rama actual.» por «En yolo, ninguna tarea pide commit ni modificar `definitions/`.»
  - Línea 36 (plantilla): sustituir «## Verificación     Comandos exactos y salida esperada.» por «## Verificación     Comandos exactos y salida esperada; el primero, `git branch --show-current` con la rama esperada (prefijo de la fila del backlog + `Fxx-nombre`).» Resultado medido sobre una copia: 6363 bytes.
- `pruebas/comprobaciones/frases-por-archivo.mjs`: en `'skills/descomponer-feature': [` (hacia la línea 172) añadir `'git branch --show-current',`.
- Fuente: definitions/WORKFLOW.md «9.1 Ramas por feature (F05)»
- Requiere: ninguno

## Decisiones ya tomadas
- Los reemplazos son exactos; no se añade nada más a la skill (tope 6400, holgura de 37 bytes).
- El prefijo (`feature/`, `fix/`, `chore/`) lo lee el planificador de la fila de la feature en `BACKLOG.md`; no se agrega columna.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: dos frases de la skill y una frase en `frases-por-archivo.mjs`.
Fuera de alcance: `WORKFLOW.md` §6 (plantilla de la definición), `validar-tarea.mjs`, `agentes/planificador.md`, reescribir tareas ya existentes.

## Pasos
1. Comprueba `git branch --show-current`.
2. Edita la línea 19 de `skills/descomponer-feature/SKILL.md`.
3. Edita la línea 36 (plantilla).
4. Añade la frase en `pruebas/comprobaciones/frases-por-archivo.mjs`.
5. Corre la *Verificación*.

## Criterios de aceptación
1. La rama activa es `fix/F40-rama-de-trabajo` (comando 1).
2. La skill contiene `git branch --show-current` y ya no contiene «no depende de la rama actual» (comandos 2 y 3).
3. Pesa 6400 bytes o menos (comando 4).
4. La prueba de contrato-roles pasa (comando 5).

## Verificación
Comando 1:
```
git branch --show-current
```
Esperado: `fix/F40-rama-de-trabajo`.

Comando 2:
```
grep -c 'git branch --show-current' skills/descomponer-feature/SKILL.md
```
Esperado: `1`.

Comando 3:
```
grep -c 'no depende de la rama actual' skills/descomponer-feature/SKILL.md
```
Esperado: `0`.

Comando 4:
```
wc -c skills/descomponer-feature/SKILL.md
```
Esperado: un número menor o igual a 6400.

Comando 5:
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'
```
Esperado: `ℹ fail 0`.

## Evidencia
```
$ git branch --show-current
fix/F40-rama-de-trabajo
exit 0
$ grep -c 'git branch --show-current' skills/descomponer-feature/SKILL.md
1
exit 0
$ grep -c 'no depende de la rama actual' skills/descomponer-feature/SKILL.md
0
exit 1
$ wc -c skills/descomponer-feature/SKILL.md
6363 skills/descomponer-feature/SKILL.md
exit 0
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'
ℹ pass 126
ℹ fail 0
exit 0
```

## Notas
- Hecho: `skills/descomponer-feature/SKILL.md` 6339 -> 6363 bytes (paso 2, línea 19: la frase de yolo quedó en «En yolo, ninguna tarea pide commit ni modificar `definitions/`.»; plantilla, línea 36: `## Verificación` con `git branch --show-current` como primer comando). `pruebas/comprobaciones/frases-por-archivo.mjs`: `'git branch --show-current',` añadida a `'skills/descomponer-feature'`.
- Rama: modo yolo, en `fix/F40-rama-de-trabajo`; sin `git switch` ni rama nueva; sin commit.
- Tope: 6363 bytes <= 6400 (holgura de 37 bytes).
- Nota: `grep -c 'no depende de la rama actual'` imprime 0 y sale con 1, porque grep sale con 1 si no hay coincidencias; el 0 es el esperado.
- Huecos menores en esta ejecución: 0.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
