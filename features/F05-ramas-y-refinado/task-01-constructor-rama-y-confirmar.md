# task-01 — El constructor crea la rama de la feature y pide CONFIRMAR si ya existe
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Hoy `agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md` no mencionan ramas. Esta tarea les añade la regla aprobada en `definitions/WORKFLOW.md` §9.1: al empezar una tarea el constructor se asegura de estar en la rama de la feature (la crea con `git switch -c` si no existe) y, si la rama ya existe y no es la actual, se detiene con una línea `CONFIRMAR:` sin tocar nada. Es el único git de escritura que se le permite. Sin esto, F05 no cambia el comportamiento real del rol.

## Contexto
- Repo: este, único repo. Leídos: `agentes/constructor.md` (secciones `## Límites`, `## Skill`, `## Cómo trabajas`; la línea «No haces commit, push, PR, merge ni despliegue.» ya existe y debe quedar intacta), `skills/ejecutar-tarea/SKILL.md` (secciones `## Antes de empezar`, `## Ejecución`, `## Cuándo detenerte`, `## Al terminar bien`) y `definitions/WORKFLOW.md` §9.1 (tabla y viñetas «Crear la rama» y «Rama ya existente»).
- El validador `pruebas/comprobaciones/contrato-constructor.mjs` exige frases literales de estos dos archivos (nueve reglas vigentes: «estado: aprobada», «te detienes», «Nunca escribes `hecha`», «No haces commit, push, PR, merge ni despliegue», «escribes en `STATUS.md`» en el constructor; «no es `aprobada`», «detente», «Cambia `estado` a `en curso`» en ese orden, las tres causas de parada, «estado: bloqueada», «rol=planificador», «rol=arquitecto», «Nunca `hecha`», «Sin commit, push, PR, merge ni despliegue» en la skill). No se puede borrar ninguna.
- Comando de prueba: `node --test pruebas/comprobaciones/contrato-constructor.test.mjs` (ejecutado por el planificador: pasa hoy).
- Archivos a tocar: `agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md`. Nada más.

## Decisiones ya tomadas
- De dónde sale la rama: el `coordinador` la pasa en el encargo con una línea `Rama: <prefijo>/Fxx-nombre`. Si el encargo no trae línea `Rama:`, el constructor no ejecuta ningún comando git de rama (así se mantienen las corridas de `pruebas/` sin rama).
- Orden en la skill: el paso de rama va en `## Antes de empezar`, **después** de comprobar que la tarea está `aprobada` y **antes** de «Cambia `estado` a `en curso`», para que un `CONFIRMAR:` deje la tarea intacta (sigue `aprobada`).
- Procedimiento exacto de la skill: (a) `git branch --show-current`; si ya es la rama del encargo, no hace nada más; (b) si no, ejecuta `git switch -c <rama>`; (c) si ese comando falla porque la rama ya existe, no hace nada más y su respuesta final empieza con la línea exacta `CONFIRMAR: accion=git switch <rama>; motivo=la rama ya existe y la actual es <actual>`; (d) si falla por otra causa, `BLOQUEO: rol=arquitecto; motivo=<salida del comando>`.
- Cuando el encargo diga «Franco confirmó `git switch <rama>`», el constructor ejecuta `git switch <rama>` (sin `-c`, solo esa rama), verifica con `git branch --show-current` y sigue la tarea. Sin esa frase en el encargo, no ejecuta `git switch <rama>`. La confirmación vale para esa rama y esa tarea. Si el switch falla (por ejemplo, cambios sin commit que chocan), `BLOQUEO: rol=arquitecto; motivo=<salida del comando>` y no reintenta.
- Texto de permisos en `agentes/constructor.md`, nueva viñeta en `## Límites` justo después de la de commit: «Git de escritura permitido, solo estos: `git switch -c <rama>`, y `git switch <rama>` únicamente con la confirmación descrita en `ejecutar-tarea`. También puedes leer la rama con `git branch --show-current`. Nunca `commit`, `push`, `merge`, `reset`, `rebase` ni `checkout`.»
- Frases literales que otras tareas validarán (escribirlas exactamente así, en los dos archivos, salvo donde se indica): `git switch -c`, `git branch --show-current`, `CONFIRMAR: accion=git switch <rama>; motivo=<motivo>`, ``Franco confirmó `git switch <rama>` ``, `Rama:`; y solo en el constructor: la frase «Nunca `commit`, `push`, `merge`, `reset`, `rebase` ni `checkout`.».
- Cuándo se detiene: en `## Cuándo detenerte` de la skill se añade un cuarto caso, «La rama de la feature ya existe y no es la actual: pide confirmación (`CONFIRMAR:`), no es un bloqueo ni una escalación». Las tres causas existentes no se modifican.

## Alcance / Fuera de alcance
Alcance: texto de `agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md` según las decisiones de arriba.
Fuera de alcance: lista de permisos del lanzador (task-02), validadores (task-03, task-07), `agentes/coordinador.md` (task-04), modo yolo y cualquier regla de F06, commit, push, PR, cambiar `modelos.json`, `definitions/`.

## Pasos
1. En `agentes/constructor.md`, `## Límites`: añadir la viñeta de git de escritura permitido con el texto de *Decisiones ya tomadas*, sin tocar las demás. Resultado: `grep -c 'git switch -c' agentes/constructor.md` devuelve al menos 1.
2. En `agentes/constructor.md`, `## Cómo trabajas`: añadir al paso 1 que lee del encargo la línea `Rama:` y la frase «Franco confirmó `git switch <rama>`» si existe. Resultado: el texto sigue en tres pasos numerados.
3. En `skills/ejecutar-tarea/SKILL.md`, `## Antes de empezar`: insertar entre el paso 1 y «Cambia `estado` a `en curso`» un paso «Rama de la feature» con el procedimiento (a)–(d) y la regla de la confirmación. Renumerar. Resultado: «Cambia `estado` a `en curso`» sigue después de «no es `aprobada`».
4. En la misma skill, `## Cuándo detenerte`: añadir el caso de `CONFIRMAR:` con la línea exacta y una frase «Al emitirla no tocas código, ni la tarea, ni la rama». Resultado: se ve la línea literal.
5. Correr la *Verificación*.

## Criterios de aceptación
1. Los dos archivos contienen las frases literales listadas en *Decisiones ya tomadas*. Se comprueba con los `grep` de *Verificación*.
2. El paso de rama aparece antes de «Cambia `estado` a `en curso`» en la skill. Se comprueba con el script de orden de *Verificación*.
3. El contrato previo sigue cumpliéndose. Se comprueba con `node --test pruebas/comprobaciones/contrato-constructor.test.mjs` (`fail 0`).
4. Solo cambiaron esos dos archivos. Se comprueba con `git status --short agentes skills`.

## Verificación
```
for f in 'git switch -c' 'git branch --show-current' 'CONFIRMAR: accion=git switch <rama>; motivo=<motivo>' 'Rama:'; do grep -c -F -- "$f" agentes/constructor.md skills/ejecutar-tarea/SKILL.md; done
grep -c -F 'Franco confirmó `git switch <rama>`' agentes/constructor.md skills/ejecutar-tarea/SKILL.md
grep -c -F 'ni `checkout`' agentes/constructor.md
node -e "const t=require('fs').readFileSync('skills/ejecutar-tarea/SKILL.md','utf8');const a=t.indexOf('git switch -c'),b=t.indexOf('Cambia \`estado\` a \`en curso\`');console.log(a>0&&b>a?'orden ok':'orden mal')"
node --test pruebas/comprobaciones/contrato-constructor.test.mjs
git status --short agentes skills
```
Esperado: cada `grep -c` muestra un número mayor que 0 por archivo (el último, solo para el constructor); `orden ok`; `fail 0`; `git status` lista solo `agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md` (más otros archivos de `agentes/` o `skills/` que ya estuvieran sin commitear antes de esta tarea).

## Evidencia

Línea de contrato antes de editar (`node --test pruebas/comprobaciones/contrato-constructor.test.mjs`, salida final):
```
ℹ tests 10
ℹ pass 10
ℹ fail 0
```

Verificación tras los cambios (comandos de *Verificación* y salida real):
```
$ for f in 'git switch -c' 'git branch --show-current' 'CONFIRMAR: accion=git switch <rama>; motivo=<motivo>' 'Rama:'; do grep -c -F -- "$f" agentes/constructor.md skills/ejecutar-tarea/SKILL.md; done
skills/ejecutar-tarea/SKILL.md:1
agentes/constructor.md:1
agentes/constructor.md:1
skills/ejecutar-tarea/SKILL.md:2
agentes/constructor.md:1
skills/ejecutar-tarea/SKILL.md:1
agentes/constructor.md:1
skills/ejecutar-tarea/SKILL.md:1

$ grep -c -F -- 'Franco confirmó `git switch <rama>`' agentes/constructor.md skills/ejecutar-tarea/SKILL.md
agentes/constructor.md:1
skills/ejecutar-tarea/SKILL.md:1

$ grep -c -F -- 'ni `checkout`' agentes/constructor.md
1

$ node -e "...indexOf('git switch -c') ... indexOf('Cambia \`estado\` a \`en curso\`') ..."
orden ok

$ node --test pruebas/comprobaciones/contrato-constructor.test.mjs
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

$ git status --short agentes skills
 M agentes/constructor.md
 M skills/ejecutar-tarea/SKILL.md
```

Criterios de aceptación:
1. Frases literales presentes en los dos archivos (grep arriba): cumplido.
2. Paso de rama antes de «Cambia `estado` a `en curso`» (`orden ok`): cumplido.
3. Contrato previo: `fail 0`, `pass 10`: cumplido.
4. Solo cambiaron `agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md` en `agentes` y `skills`: cumplido.

## Notas

- Git: el encargo no trae línea `Rama:`, así que no se ejecutó ningún comando git de escritura ni de rama. Solo se corrieron lecturas (`git branch --show-current` antes de editar, y los comandos de verificación `git status --short agentes skills` y `git branch --show-current` ya listados).
- Hueco menor 1: la decisión pedía la frase `CONFIRMAR: accion=git switch <rama>; motivo=<motivo>` en los dos archivos, pero el paso 2 de la tarea no la ubicaba en el constructor. La añadí como frase de la primera línea de «Cómo trabajas», paso 1, sin crear viñeta nueva; el constructor sigue con tres pasos numerados.
- Hueco menor 2: el cuarto caso de «Cuándo detenerte» (`CONFIRMAR:`) queda como viñeta y aclara que no es `BLOQUEO:`, para que la frase «En cualquiera:» de las tres causas existentes no se aplique a él. Las tres causas originales no se tocaron.
- Hueco menor 3: el bloque de confirmación «Franco confirmó `git switch <rama>`» va antes de los pasos (a)–(d) dentro del paso 2 de «Antes de empezar», para que con confirmación no se dispare el `CONFIRMAR:`.
- No se ejecutó la rama real ni `git switch`: la tarea no lo pide y no hay línea `Rama:` en el encargo.