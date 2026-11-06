# task-03 — Quitar la excepción de yolo sobre la rama en el constructor y en ejecutar-tarea
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
`agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md` dicen que en yolo no se crea rama ni se emite `CONFIRMAR:`. Con la nueva regla (`definitions/WORKFLOW.md` §9.1 y §9.3) el constructor aplica en yolo la misma regla de rama que en el modo normal, así que esas frases se borran. El texto restante ya cubre el caso: crea la rama solo si el encargo trae `Rama:`, y `CONFIRMAR:` si existe y no es la actual. No se reordena nada (el orden entorno/rama se decide tras el diagnóstico de task-01).

## Contexto
- Tocar: `agentes/constructor.md`, `skills/ejecutar-tarea/SKILL.md`
- `agentes/constructor.md` línea 19 (sección «Límites»): la viñeta que empieza «- Modo yolo: si el encargo trae `Modo yolo: activo`, no creas rama, …». Se borra entera.
- `skills/ejecutar-tarea/SKILL.md`: línea 15, la viñeta que empieza «   - **Modo yolo:** si el encargo trae la línea `Modo yolo: activo`, salta este paso entero: …». Se borra entera. Línea 35 (causa «La rama de la feature ya existe y no es la actual»): se borra solo la frase final « En modo yolo esta causa no aplica.».
- No se tocan la línea 70 (`modo`: `yolo` en el registro) ni el resto de los pasos.
- Topes en bytes (`wc -c`): `agentes/constructor.md` hoy 3008 de 3072; `skills/ejecutar-tarea/SKILL.md` hoy 7619 de 7623. Ninguno puede quedar por encima.
- Fuente: definitions/F40-RAMAS.md «C. Efectos fuera de las definiciones (no se editan aquí)»
- Requiere: ninguno

## Decisiones ya tomadas
- Solo se borra texto; no se añade ninguna frase.
- Las frases que exigen las reglas 10, 11, 12 y 16 del contrato (`git switch -c`, `git branch --show-current`, `Rama:`, `Franco confirmó`, `CONFIRMAR: accion=…`) siguen intactas.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: dos viñetas y una frase.
Fuera de alcance: mover el paso de rama respecto del entorno, `modo-yolo`, `coordinador.md`, pruebas.

## Pasos
1. Comprueba `git branch --show-current`.
2. En `agentes/constructor.md` borra la viñeta «Modo yolo: …» de «Límites».
3. En `skills/ejecutar-tarea/SKILL.md` borra la viñeta «**Modo yolo:** …» del paso 2.
4. En el mismo archivo borra « En modo yolo esta causa no aplica.» de «Cuándo detenerte».
5. Corre la *Verificación*.

## Criterios de aceptación
1. La rama activa es `fix/F40-rama-de-trabajo` (comando 1).
2. Ya no queda «no creas rama» ni «salta este paso entero» ni «esta causa no aplica» en los dos archivos (comando 2: salida vacía).
3. Ninguno supera su tope (comandos 3 y 4).
4. El contrato del constructor sigue pasando (comando 5).

## Verificación
Comando 1:
```
git branch --show-current
```
Esperado: `fix/F40-rama-de-trabajo`.

Comando 2:
```
grep -n -E 'no creas rama|salta este paso entero|esta causa no aplica' agentes/constructor.md skills/ejecutar-tarea/SKILL.md
```
Esperado: salida vacía.

Comando 3:
```
wc -c agentes/constructor.md
```
Esperado: un número menor o igual a 3072.

Comando 4:
```
wc -c skills/ejecutar-tarea/SKILL.md
```
Esperado: un número menor o igual a 7623.

Comando 5:
```
node --test pruebas/comprobaciones/contrato-constructor.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'
```
Esperado: `ℹ fail 0`.

## Evidencia
```
$ git branch --show-current
fix/F40-rama-de-trabajo
exit 0
```
```
$ grep -n -E 'no creas rama|salta este paso entero|esta causa no aplica' agentes/constructor.md skills/ejecutar-tarea/SKILL.md
(sin salida)
exit 1
```
```
$ wc -c agentes/constructor.md
2836 agentes/constructor.md
exit 0
```
```
$ wc -c skills/ejecutar-tarea/SKILL.md
7366 skills/ejecutar-tarea/SKILL.md
exit 0
```
```
$ node --test pruebas/comprobaciones/contrato-constructor.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'
ℹ pass 19
ℹ fail 0
exit 0
```

## Notas
- Hueco menor: ninguno. Se borraron exactamente la viñeta «Modo yolo» de `agentes/constructor.md` (línea 19), la viñeta «Modo yolo» del paso 2 de `skills/ejecutar-tarea/SKILL.md` (línea 15) y la frase « En modo yolo esta causa no aplica.» de `skills/ejecutar-tarea/SKILL.md` (línea 35), como indica *Pasos*.
- Topes en bytes: `agentes/constructor.md` 3008 antes, 2836 después (tope 3072); `skills/ejecutar-tarea/SKILL.md` 7619 antes, 7366 después (tope 7623).
- Modo yolo: no se creó rama, no hubo `git switch` ni `CONFIRMAR:`; el encargo no trae línea `Rama:`, así que no se ejecutó ningún comando git de rama. Sin commit.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
