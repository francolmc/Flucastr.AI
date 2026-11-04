# task-03 — Quitar la excepción de yolo sobre la rama en el constructor y en ejecutar-tarea
repo: Flucastr.AI   depende_de: task-02   estado: borrador

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
(lo llena el constructor: la cola relevante de cada salida, hasta 1,5 KB)

## Notas
(lo llena el constructor)
