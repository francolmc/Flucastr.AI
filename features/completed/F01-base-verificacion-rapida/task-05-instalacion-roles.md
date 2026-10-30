# task-05 — Capa 1: comprobar que se instalan todos los agentes y skills
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
La Capa 1 comprueba que lo instalado es correcto (I2: encabezado y modelo) pero no que esté todo lo que debe: si `instalar.sh` dejara de instalar `coordinador`, `planificador`, `constructor` o una skill nueva, nada fallaría. Esta tarea añade el caso I7, con su control negativo, que compara las fuentes (`agentes/`, `skills/`) con lo instalado para Claude Code y Pi, incluidos los lanzadores `pi-<agente>`. Sigue siendo determinista y corre dentro de la verificación rápida.

## Contexto
- Repo: este, único repo. Sin modelo ni red. Todo ocurre en un `HOME` aislado dentro de `pruebas/.temporales/` (función `entorno()` de `pruebas/capa1/instalacion.test.mjs`).
- Instalación real en un `HOME` aislado (ejecutada por el planificador): `.claude/agents/{arquitecto,constructor,coordinador,planificador}.md`; `.claude/skills/<7 skills>` (`crear-backlog`, `definir-proyecto`, `descomponer-feature`, `disenar-arquitectura`, `ejecutar-tarea`, `generar-clonar`, `revisar-proyecto-existente`); `.local/bin/pi-<agente>` (4); `pi/agents/<agente>.md` (4) y `pi/skills/<skill>` (7), donde `pi` es `PI_CODING_AGENT_DIR` (`e.pi` en la prueba).
- `pruebas/comprobaciones/capa1.mjs`: función `comprobar(id, dato)` con un `switch` por caso (`I1`…`I6`) y `default: throw`.
- `pruebas/capa1/instalacion.test.mjs`: función `caso(id, obtener)` que registra «`<id>`: comprobación real»; después, un objeto `falsos` con un dato falso por caso que genera «`<id>`: control negativo rechaza salida falsa». `entorno(nombre)` devuelve `{ repo, home, pi, instalar, … }`; `exito(r)` exige estado 0.
- Archivos a tocar: `pruebas/comprobaciones/capa1.mjs` y `pruebas/capa1/instalacion.test.mjs`.

## Decisiones ya tomadas
- El caso se llama `I7`. Dato que devuelve `obtener`: un arreglo de un elemento `{ esperados, instalados }`, donde ambos son `{ agentes: string[], skills: string[] }` y `instalados` agrupa por herramienta: `instalados.claude = { agentes, skills }` y `instalados.pi = { agentes, skills, lanzadores }`.
- Cómo se obtienen: `esperados.agentes` = nombres (sin `.md`) de `agentes/*.md` en `e.repo`; `esperados.skills` = nombres de subdirectorios de `skills/` en `e.repo`. Instalados: nombres de `.md` en `join(e.home, '.claude/agents')` y `join(e.pi, 'agents')`; entradas de `join(e.home, '.claude/skills')` y `join(e.pi, 'skills')`; `lanzadores` = entradas de `join(e.home, '.local/bin')` que empiezan por `pi-`, sin el prefijo. Todas las listas ordenadas.
- `comprobar('I7', dato)`: para cada elemento, exige `esperados.agentes.length > 0` y `esperados.skills.length > 0` (evita pasar en vacío) y `assert.deepEqual` entre lo esperado y cada lista instalada (agentes de Claude, skills de Claude, agentes de Pi, skills de Pi, lanzadores de Pi), con mensaje que nombre la lista que difiere.
- Dato falso para el control negativo: `esperados` con 2 agentes y 2 skills, e `instalados.pi.skills` con una sola; `comprobar` debe lanzar `AssertionError`.
- No se hace nada con `instalar.sh`, `desinstalar.sh` ni `scripts/resolver.mjs`.

## Alcance / Fuera de alcance
Alcance: el caso I7 y su control negativo en los dos archivos indicados.
Fuera de alcance: modificar `instalar.sh`, `desinstalar.sh`, `scripts/resolver.mjs`, agentes o skills; comprobar el contenido de las skills o el modelo resuelto de cada agente (ya lo hace I2); comprobar `--proyecto`; limpiar `pruebas/.temporales/`; hacer commit.

## Pasos
1. Antes de cambiar nada, correr `bash pruebas/rapida.sh` y anotar en *Evidencia* el número de `ℹ pass` (llamado P).
2. En `pruebas/comprobaciones/capa1.mjs`, añadir `case 'I7':` antes del `default`, con la lógica de *Decisiones ya tomadas*.
3. En `pruebas/capa1/instalacion.test.mjs`, añadir `caso('I7', …)` después de `caso('I6', …)`: crea `entorno('I7')`, llama `exito(e.instalar())`, arma el dato y lo devuelve.
4. En el mismo archivo, añadir la entrada `I7` al objeto `falsos`.
5. Correr la Capa 1 y confirmar 14 pruebas pasando (las 12 de hoy más I7 real y su control negativo).
6. Correr `bash pruebas/rapida.sh` y confirmar 0, `ℹ pass` igual a P + 2 y bajo 30 s.

## Criterios de aceptación
1. La Capa 1 pasa con 14 pruebas, 0 fallos, e incluye «I7: comprobación real» y «I7: control negativo rechaza salida falsa». Se comprueba con la primera orden.
2. En la instalación real aislada, I7 compara 4 agentes y 7 skills esperados contra lo instalado en Claude Code y Pi. Se comprueba con la segunda orden (lee el JSON que la prueba guarda).
3. `bash pruebas/rapida.sh` sale con 0, reporta `ℹ pass` igual a P + 2 (P = valor anotado en el paso 1) y `rapida: 9 archivos en N s (tope 30 s)` con N ≤ 30. Se comprueba con la tercera orden.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --test --test-concurrency=1 pruebas/capa1/instalacion.test.mjs 2>&1 | grep -E "^(✔ I7|✖ I7|ℹ (tests|pass|fail))"
d=$(ls -dt pruebas/.temporales/capa1-* | head -1); node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1]+"/I7.json","utf8"))[0]; console.log(j.esperados.agentes.length, j.esperados.skills.length)' "$d"
bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ (pass|fail)|rapida:)"
```
Salida esperada: `✔ I7: comprobación real`, `✔ I7: control negativo rechaza salida falsa`, `ℹ tests 14`, `ℹ pass 14`, `ℹ fail 0`; luego `4 7`; luego `ℹ pass` igual a P + 2, `ℹ fail 0` y `rapida: 9 archivos en N s (tope 30 s)` con N ≤ 30.

## Evidencia

**Paso 1 (P medido antes de cambiar nada)**: `bash pruebas/rapida.sh`, salida de la corrida inicial (código 0):
```
ℹ pass 60
ℹ fail 0
rapida: 9 archivos en 13 s (tope 30 s)
```
P = 60, por tanto la meta del paso 6 es `ℹ pass 62`.

**Verificación 1** (`node --test --test-concurrency=1 pruebas/capa1/instalacion.test.mjs 2>&1 | grep -E "^(✔ I7|✖ I7|ℹ (tests|pass|fail))"`):
```
✔ I7: comprobación real (1050.353584ms)
✔ I7: control negativo rechaza salida falsa (0.198375ms)
ℹ tests 14
ℹ pass 14
ℹ fail 0
```
Código de salida de la Capa 1, medido en una corrida aparte (`node --test ... >/dev/null 2>&1; echo $?`): 0. En la primera orden no se usó `PIPESTATUS` para el código: en zsh esa variable no existe y el `echo` salió vacío, así que se midió por separado.

**Verificación 2** (lee `I7.json` de la última corrida):
```
d=pruebas/.temporales/capa1-GRvqJY
4 7
```

**Verificación 3** (`bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ (pass|fail)|rapida:)"`):
```
ℹ pass 62
ℹ fail 0
rapida: 9 archivos en 14 s (tope 30 s)
```
Código de salida de `rapida.sh`, en corrida aparte (`bash pruebas/rapida.sh >/dev/null 2>&1; echo $?`): 0. El `exit=$?` de la línea combinada midió el código de `grep`, no el de `rapida.sh`; por eso el código válido es el de la corrida aparte.

**Criterios de aceptación**
1. Capa 1 con 14 pruebas, 0 fallos, con «I7: comprobación real» y «I7: control negativo rechaza salida falsa»: cumple (verificación 1).
2. Instalación real aislada: I7 compara 4 agentes y 7 skills esperados: cumple (verificación 2, `4 7`).
3. `rapida.sh` sale con 0, `ℹ pass` = 62 = P + 2 (P = 60), `ℹ fail 0`, `9 archivos en 14 s` (≤ 30 s): cumple (verificación 3).

## Notas
- Cambios realizados: `pruebas/comprobaciones/capa1.mjs` (caso `I7` antes de `default`) y `pruebas/capa1/instalacion.test.mjs` (`caso('I7', …)` después de I6, y entrada `I7` en `falsos`). No se tocó `instalar.sh`, `desinstalar.sh`, `scripts/resolver.mjs`, agentes ni skills. No se escribió en `STATUS.md` ni `BACKLOG.md`. No hubo commit, push, PR, merge ni despliegue.
- Huecos menores resueltos (la tarea no lo fijaba):
  1. `esperados.skills` solo cuenta subdirectorios de `skills/` (`isDirectory`), que es lo que dice la tarea; los nombres instalados se listan sin filtrar por tipo, por si una skill se instala como enlace.
  2. Los lanzadores `pi-<agente>` se comparan contra `esperados.agentes`, porque hay un lanzador por agente. Es la lectura más directa de la tarea.
  3. El control negativo cambia solo `instalados.pi.skills` (una sola entrada); el resto coincide, así que la aserción que falla es la de Pi/skills.
- No fue necesario ajustar conteos: la rápida corre 9 archivos, como dice la tarea.
- No hubo «Señal: la tarea estaba incompleta»: los huecos fueron dos o tres y se resolvieron sin escalar.
- Archivos sin relación con la tarea que ya estaban modificados en el árbol (`definitions/BACKLOG.md`, `definitions/STATUS.md`, `task-04`, `pruebas/comprobaciones/formato-flujo*.mjs`) no se tocaron.
- Artefactos conservados por la prueba en `pruebas/.temporales/` (no se limpiaron, según *Fuera de alcance*).
