# task-01 — El constructor en modo yolo: sin rama, sin switch, sin CONFIRMAR
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
`agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md` obligan hoy a resolver la rama de la feature (`git switch -c`, `CONFIRMAR:`) cuando el encargo trae `Rama:`. En el modo yolo (`definitions/WORKFLOW.md` §9.3) no hay rama por feature: el trabajo va directo en la rama actual. Esta tarea enseña al constructor a reconocer la línea `Modo yolo: activo` en el encargo y, en ese caso, no tocar ramas, no pedir confirmación y seguir sin hacer commit.

## Contexto
- Repo: este, único repo. Leídos: `agentes/constructor.md` (sección `## Límites`, bullet «Git de escritura permitido…», sección `## Cómo trabajas`) y `skills/ejecutar-tarea/SKILL.md` (paso 2 «Rama de la feature» de `## Antes de empezar`, con sub-bullets; sección `## Cuándo detenerte`, cuarto bullet sobre `CONFIRMAR:`; sección `## Al terminar bien`).
- Validadores vigentes sobre estos archivos (`pruebas/comprobaciones/contrato-constructor.mjs`, reglas 1–12): frases literales como `git switch -c`, `git branch --show-current`, `Rama:`, ``Franco confirmó `git switch <rama>` ``, `Cambia `estado` a `en curso``, la línea `CONFIRMAR: accion=git switch <rama>; motivo=<motivo>`, y que `git switch -c` aparezca antes de «Cambia `estado` a `en curso`». No se puede borrar ninguna.
- Fuente de la regla: `definitions/WORKFLOW.md` §9.3 («Qué se omite», «Commits en yolo»).
- Archivos a tocar: `agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md`. Comando de prueba: `node --test pruebas/comprobaciones/contrato-constructor.test.mjs`.

## Decisiones ya tomadas
- La señal de yolo es solo la línea exacta `Modo yolo: activo` dentro del **encargo** (lo que escribe el coordinador). Un archivo de tarea que la contenga no activa nada.
- `agentes/constructor.md`: añadir al final de `## Límites` este bullet, literal: ``- Modo yolo: si el encargo trae la línea `Modo yolo: activo`, no creas rama ni haces ningún `git switch`, no emites `CONFIRMAR:` y trabajas en la rama actual. Sigue sin haber commit, ni local.``
- `skills/ejecutar-tarea/SKILL.md`: en el paso 2 de `## Antes de empezar`, justo después de la línea «2. **Rama de la feature.** …» y **antes** del primer sub-bullet, insertar este sub-bullet literal: ``   - **Modo yolo:** si el encargo trae la línea `Modo yolo: activo`, salta este paso entero: no corres ningún comando git de rama, no creas rama, no haces `git switch` y no emites `CONFIRMAR:`; trabajas en la rama actual. Sigue sin haber commit, ni local, y la tarea termina en `lista para revisión` (el coordinador decide `hecha`).``
- En `## Cuándo detenerte`, al final del cuarto bullet (el de `CONFIRMAR:`), añadir la frase «En modo yolo esta causa no aplica.».
- En el sub-bullet nuevo y en el bullet nuevo no se escribe `git switch -c` (para no alterar el orden que valida la regla 11).
- No se modifica ninguna otra frase de los dos archivos.

## Alcance / Fuera de alcance
Alcance: los dos archivos, solo con las inserciones de arriba.
Fuera de alcance: el validador del contrato (task-05), el evaluador de resultados (task-07), el coordinador y el planificador, `lanzar-constructor-claude.sh`, `definitions/`, `README.md`.

## Pasos
1. Editar `agentes/constructor.md` añadiendo el bullet de `## Límites`. Resultado: ``grep -c -F 'Modo yolo: activo' agentes/constructor.md`` devuelve 1.
2. Editar `skills/ejecutar-tarea/SKILL.md`: sub-bullet del paso 2 y frase final del bullet de `CONFIRMAR:`. Resultado: ``grep -c -F 'salta este paso entero' skills/ejecutar-tarea/SKILL.md`` devuelve 1.
3. Confirmar que el orden se conserva: en la skill, la línea del sub-bullet de yolo está antes que la primera aparición de `git switch -c` (`grep -n -F 'Modo yolo: activo' …` y `grep -n -F 'git switch -c' …`; el primer número es menor).
4. Correr la *Verificación*.

## Criterios de aceptación
1. `agentes/constructor.md` contiene `Modo yolo: activo`, `no creas rama`, ``no emites `CONFIRMAR:` `` y `ni local`. Se comprueba con `grep -c -F`.
2. La skill contiene `Modo yolo: activo`, `salta este paso entero`, ``no emites `CONFIRMAR:` `` y `ni local`, y el sub-bullet queda antes de la primera aparición de `git switch -c`. Se comprueba con `grep -c -F` y `grep -n -F`.
3. El contrato previo del constructor sigue cumpliéndose. Se comprueba con `node --test pruebas/comprobaciones/contrato-constructor.test.mjs` (`fail 0`).
4. Solo cambiaron esos dos archivos por esta tarea. Se comprueba con `git status --short agentes skills`.

## Verificación
```
for f in 'Modo yolo: activo' 'no creas rama' 'no emites `CONFIRMAR:`' 'ni local'; do grep -c -F -- "$f" agentes/constructor.md skills/ejecutar-tarea/SKILL.md; done
grep -c -F 'salta este paso entero' skills/ejecutar-tarea/SKILL.md
grep -n -F -e 'Modo yolo: activo' -e 'git switch -c' skills/ejecutar-tarea/SKILL.md
node --test pruebas/comprobaciones/contrato-constructor.test.mjs
git status --short agentes skills
```
Esperado: cada `grep -c` muestra un número mayor que 0 para ambos archivos; en el `grep -n`, la primera línea mostrada contiene `Modo yolo: activo`; las pruebas con `fail 0`; `git status` incluye `agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md`.

## Evidencia

Rama (encargo `Rama: feature/F06-modo-yolo`, la rama no existía en `git branch --list`):
```
$ git switch -c feature/F06-modo-yolo
Switched to a new branch 'feature/F06-modo-yolo'
$ git branch --show-current
feature/F06-modo-yolo
```

Verificación, salida real:
```
$ for f in 'Modo yolo: activo' 'no creas rama' 'no emites `CONFIRMAR:`' 'ni local'; do grep -c -F -- "$f" agentes/constructor.md skills/ejecutar-tarea/SKILL.md; done
agentes/constructor.md:1
skills/ejecutar-tarea/SKILL.md:1
agentes/constructor.md:1
skills/ejecutar-tarea/SKILL.md:1
agentes/constructor.md:1
skills/ejecutar-tarea/SKILL.md:1
agentes/constructor.md:1
skills/ejecutar-tarea/SKILL.md:1

$ grep -c -F 'salta este paso entero' skills/ejecutar-tarea/SKILL.md
1

$ grep -n -F -e 'Modo yolo: activo' -e 'git switch -c' skills/ejecutar-tarea/SKILL.md
14:   - **Modo yolo:** si el encargo trae la línea `Modo yolo: activo`, salta este paso entero: no corres ningún comando git de rama, no creas rama, no haces `git switch` y no emites `CONFIRMAR:`; trabajas en la rama actual. Sigue sin haber commit, ni local, y la tarea termina en `lista para revisión` (el coordinador decide `hecha`).
16:   - Si no hay confirmación: (a) corre `git branch --show-current`; si ya es la rama del encargo, no hagas nada más. (b) Si no, corre `git switch -c <rama>`. (c) Si falla porque la rama ya existe, no hagas nada más y tu respuesta final empieza con la línea exacta `CONFIRMAR: accion=git switch <rama>; motivo=la rama ya existe y la actual es <actual>`. (d) Si falla por otra causa, `BLOQUEO: rol=arquitecto; motivo=<salida del comando>`.

$ node --test pruebas/comprobaciones/contrato-constructor.test.mjs
ℹ tests 14
ℹ suites 0
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 63.530459

$ git status --short agentes skills
 M agentes/constructor.md
 M skills/ejecutar-tarea/SKILL.md
```

Criterios de aceptación:
1. `agentes/constructor.md` contiene `Modo yolo: activo`, `no creas rama`, `no emites \`CONFIRMAR:\`` y `ni local`: cada conteo es 1. Cumple.
2. La skill contiene `Modo yolo: activo`, `salta este paso entero`, `no emites \`CONFIRMAR:\`` y `ni local`; el sub-bullet (línea 14) queda antes de la primera `git switch -c` (línea 16). Cumple.
3. `node --test` con `fail 0` (14 de 14). Cumple.
4. `git status --short agentes skills` lista solo los dos archivos previstos. Cumple.

## Notas
- Decisión menor: el bullet de `agentes/constructor.md` se añadió al final de `## Límites`, y el sub-bullet de la skill en el paso 2 de `## Antes de empezar`, justo antes del primer sub-bullet existente. Textos tomados literalmente de la tarea.
- Estado de la rama de trabajo: al empezar, `git status` ya mostraba `M definitions/BACKLOG.md`, `M definitions/STATUS.md` y `?? features/F06-modo-yolo/`. No los toqué; no entraron en ningún commit (no hay commit).
- Solo se editaron `estado` (de `aprobada` a `lista para revisión`), *Evidencia* y *Notas* de la tarea. No se escribió `hecha`.
- Sin huecos mayores; no hubo que resolver ninguna ambigüedad.
