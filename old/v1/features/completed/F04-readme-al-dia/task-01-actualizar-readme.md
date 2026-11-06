# task-01 — Actualizar el README al kit real
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
`README.md` quedó en el reinicio: dice que «faltan el coordinador, el planificador y el constructor», lista un solo agente y cuatro de las siete skills, y llama a `pruebas/` «arnés de pruebas del arquitecto» (inconsistencia 2 de `definitions/PROJECT.md`). Quien lo lee no sabe que el flujo ya existe ni cómo abrirlo. Esta tarea lo deja fiel al checkout actual, sin cambiar reglas ni definiciones.

**Por qué esta feature para probar F04** (decisión del planificador, a aprobar por Franco): es pequeña (2 tareas, 1 archivo de producto y 2 de prueba), de un solo repo, útil para el kit y no toca `definitions/`; la tarea 01 ejercita la puerta 3 y 4 con un entregable de texto que Franco revisa con criterio propio, y la tarea 02 (`depende_de: task-01`) ejercita el constructor con código, pruebas, un control negativo y el orden de dependencia. Alternativas descartadas: ver *Notas del planificador* al final de la tarea 02.

## Contexto
- Repo: este, único repo (`/Users/franco/Codes/flucastr/Flucastr.AI`). Archivo a tocar: `README.md` (92 líneas; leído). No se toca nada más.
- Secciones actuales (leídas): línea 5 «Estado: MVP en construcción… faltan el coordinador, el planificador y el constructor»; `## Estructura` (líneas 30–50, bloque de código con el árbol); `## Instalación` (52–70); `## Pruebas` (72–79); `## Próximos pasos` (81–83); `## Bitácora` (89–92).
- Realidad del checkout (leída con `ls`): `agentes/` tiene `arquitecto.md`, `constructor.md`, `coordinador.md`, `planificador.md`; `skills/` tiene `crear-backlog`, `definir-proyecto`, `descomponer-feature`, `disenar-arquitectura`, `ejecutar-tarea`, `generar-clonar`, `revisar-proyecto-existente`; existen `features/`, `definitions/`, `pruebas/`, `scripts/`, `modelos.json`, `instalar.sh`, `desinstalar.sh`, `initialize.sh`, `AGENTS.md`.
- `instalar.sh` instala todos los `agentes/*.md` y `skills/*/` y genera un lanzador `pi-<agente>` por agente (líneas 60, 115, 172–188); su opción `--agente <nombre>` (línea 39) elige el agente predeterminado de `--proyecto`, con `arquitecto` por defecto (línea 21). El mensaje final de `instalar.sh` solo menciona al arquitecto: no se toca (fuera de alcance).
- El coordinador se abre como agente principal: `claude --agent coordinador` / `pi-coordinador` (`definitions/WORKFLOW.md` §7, resultado del paso 1).
- Verificación: solo `grep`/`ls`/`bash pruebas/rapida.sh` (sin efectos sobre archivos versionados; los dos últimos corren hoy sin cambios).

## Decisiones ya tomadas
- Contenido en español, tono y viñetas del README actual; no se reescriben `Para qué existe`, `Reglas`, `Documentación`, `Archivo y rescate`.
- Línea 5 pasa a: `> Estado: MVP en construcción (2026-10-29). Arquitecto, coordinador, planificador y constructor existen; falta cerrar una feature real de punta a punta.`
- El bloque de `## Estructura` pasa a ser exactamente este (los hijos de `agentes/` y `skills/` usan el prefijo `│   ├── ` / `│   └── ` y el nombre sin espacios al inicio, porque la tarea 02 lo analiza):
```
Flucastr.AI/
├── README.md
├── AGENTS.md        # entrada breve para agentes
├── definitions/     # definición vigente del proyecto
├── features/        # tareas por feature (features/Fxx-nombre/task-NN-nombre.md)
├── modelos.json     # niveles y modelos por herramienta; los agentes declaran nivel, no modelo
├── agentes/         # un archivo por agente
│   ├── arquitecto.md    # define proyecto, estructura y arquitectura
│   ├── coordinador.md   # el único que abres; delega y se detiene en las cuatro puertas
│   ├── planificador.md  # redacta el backlog y las tareas
│   └── constructor.md   # ejecuta una tarea aprobada y deja la evidencia
├── skills/          # procedimientos que los agentes cargan solo cuando los necesitan
│   ├── definir-proyecto/
│   ├── revisar-proyecto-existente/
│   ├── disenar-arquitectura/
│   ├── generar-clonar/
│   ├── crear-backlog/
│   ├── descomponer-feature/
│   └── ejecutar-tarea/
├── scripts/
│   └── resolver.mjs    # resuelve el modelo de cada agente y genera los archivos por herramienta
├── pruebas/         # comprobaciones del kit y arnés de pruebas del arquitecto (ver pruebas/README.md)
├── instalar.sh      # instala agentes y skills en Claude Code y Pi
└── desinstalar.sh   # quita exactamente lo que instaló
```
- En `## Instalación`: la frase «El nivel del arquitecto lo eliges tú en ese archivo.» pasa a «El nivel de cada agente lo eliges tú en ese archivo.»; el ejemplo `--proyecto` se mantiene y se añade una viñeta: «`--agente <nombre>` elige el agente predeterminado del proyecto (por defecto `arquitecto`).» y el «Uso» pasa a: «Uso: `claude --agent coordinador` o `pi-coordinador`, desde la carpeta del proyecto (también `arquitecto`, `planificador` y `constructor` por separado).»
- `## Próximos pasos` se renombra `## Flujo` y su texto pasa a: «El `coordinador` (el único agente que abro) invoca al `arquitecto`, al `planificador` y al `constructor`, y se detiene en cuatro puertas de aprobación: definición, backlog, cada tarea y revisión del resultado. Detalle en [`definitions/WORKFLOW.md`](definitions/WORKFLOW.md). Pendiente: cerrar una feature real de punta a punta (`definitions/BACKLOG.md`, F04).»
- `## Bitácora`: se añade al final una viñeta `- 2026-10-29: existen coordinador, planificador y constructor; el README se actualiza a ese estado.`
- No se cita `tareas/` ni ninguna ruta inexistente.

## Alcance / Fuera de alcance
Alcance: `README.md`.
Fuera de alcance: `definitions/**`, `AGENTS.md`, `pruebas/README.md`, `instalar.sh` (incluido su mensaje final), `agentes/`, `skills/`, `modelos.json`; cambiar las reglas del README; añadir secciones nuevas; hacer commit.

## Pasos
1. En `README.md`, sustituir la línea 5 por la de *Decisiones ya tomadas*. Resultado: `sed -n 5p README.md` muestra el texto nuevo.
2. Sustituir el bloque de código de `## Estructura` por el árbol de *Decisiones ya tomadas*. Resultado: el árbol lista 4 agentes y 7 skills.
3. En `## Instalación`, aplicar los tres cambios de texto (nivel de cada agente, viñeta `--agente`, línea de «Uso»). Resultado: `grep -n "claude --agent coordinador" README.md` devuelve una línea.
4. Renombrar `## Próximos pasos` a `## Flujo` y reemplazar su texto. Resultado: `grep -c "^## Próximos pasos" README.md` es 0.
5. Añadir la viñeta de bitácora. Resultado: es la última línea del archivo.
6. Correr la *Verificación*.

## Criterios de aceptación
1. Cada archivo de `agentes/` y cada carpeta de `skills/` figura en el árbol del README. Se comprueba con la primera orden de *Verificación* (sin líneas `FALTA`).
2. El árbol no lista nada que no exista en disco. Se comprueba con la segunda orden (sin líneas `SOBRA`).
3. El README ya no dice que faltan roles ni cita `tareas/`. Se comprueba con la tercera orden (salida vacía).
4. El README menciona `claude --agent coordinador` y `pi-coordinador`. Se comprueba con la cuarta orden (1 línea con ambos comandos).
5. Solo cambió `README.md` y la suite rápida sigue en verde. Se comprueba con la quinta orden.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
for a in agentes/*.md; do n=$(basename "$a"); grep -q "│   .*── $n" README.md || echo "FALTA agente $n"; done; for s in skills/*/; do n=$(basename "$s"); grep -q "│   .*── $n/" README.md || echo "FALTA skill $n"; done
grep -oE "│   [├└]── [a-z-]+\.md" README.md | sed 's/.*── //' | while read -r n; do [ -f "agentes/$n" ] || echo "SOBRA agente $n"; done; grep -oE "│   [├└]── [a-z-]+/" README.md | sed 's/.*── //' | while read -r n; do [ -d "skills/$n" ] || echo "SOBRA skill $n"; done
grep -nE "faltan el coordinador|tareas/|Próximos pasos" README.md
grep -nE "claude --agent coordinador|pi-coordinador" README.md
git status --short README.md definitions agentes skills instalar.sh; bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"
```
Esperado: la primera, segunda y tercera no imprimen nada; la cuarta imprime 1 línea, la de «Uso», que contiene `claude --agent coordinador` y `pi-coordinador`; `git status` muestra ` M README.md` y, ya modificados antes de esta tarea, ` M definitions/BACKLOG.md` (marca `→` movida a F04; nada en `agentes/`, `skills/` ni `instalar.sh`); y `ℹ fail 0` seguido de `rapida: 15 archivos en S s (tope 30 s)` con S ≤ 30.

## Evidencia

Comando (cd a la raíz del repo, las cuatro primeras órdenes de *Verificación*, tal cual):

```
$ for a in agentes/*.md; do n=$(basename "$a"); grep -q "│   .*── $n" README.md || echo "FALTA agente $n"; done; for s in skills/*/; do n=$(basename "$s"); grep -q "│   .*── $n/" README.md || echo "FALTA skill $n"; done
$ grep -oE "│   [├└]── [a-z-]+\.md" README.md | sed 's/.*── //' | while read -r n; do [ -f "agentes/$n" ] || echo "SOBRA agente $n"; done; grep -oE "│   [├└]── [a-z-]+/" README.md | sed 's/.*── //' | while read -r n; do [ -d "skills/$n" ] || echo "SOBRA skill $n"; done
$ grep -nE "faltan el coordinador|tareas/|Próximos pasos" README.md
(salida de las tres órdenes anteriores: vacía; ninguna línea FALTA, SOBRA ni coincidencia)

$ grep -nE "claude --agent coordinador|pi-coordinador" README.md
78:- Uso: `claude --agent coordinador` o `pi-coordinador`, desde la carpeta del proyecto (también `arquitecto`, `planificador` y `constructor` por separado).

$ git status --short README.md definitions agentes skills instalar.sh; bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"
 M README.md
 M definitions/BACKLOG.md
 M definitions/STATUS.md
ℹ fail 0
rapida: 15 archivos en 17 s (tope 30 s)
```

Lectura de la salida:
- Criterio 1 (agentes y skills en el árbol): sin líneas `FALTA`.
- Criterio 2 (nada en el árbol que no exista): sin líneas `SOBRA`.
- Criterio 3 (sin «faltan el coordinador», «tareas/» ni «Próximos pasos»): salida vacía.
- Criterio 4: una línea (la de «Uso»), con `claude --agent coordinador` y `pi-coordinador`.
- Criterio 5: `README.md` modificado; `definitions/BACKLOG.md` ya estaba modificado antes de la tarea (se listó en el `git status` inicial). `definitions/STATUS.md` también aparece como `M`, ya modificado antes de la tarea; no lo toqué. Ni `agentes/`, `skills/` ni `instalar.sh` aparecen. Suite rápida: `ℹ fail 0`, 17 s ≤ 30 s.

## Notas

- Hueco menor: la viñeta de `--agente <nombre>` no indicaba dónde ir. Se añadió como viñeta nueva justo debajo de la de `--proyecto` y antes de «Uso».
- Un intento de cambiar el árbol de `## Estructura` falló porque mi texto de la última línea no coincidía con el archivo («quita lo instalado» frente a «quita exactamente lo que instaló»). Se reintentó con el texto exacto del archivo; el resultado es el árbol de *Decisiones ya tomadas*.
- No se tocó `definitions/STATUS.md`, `definitions/BACKLOG.md` ni nada fuera de `README.md`. La tarea 02 (`task-02`) no se ha tocado.
- Sin commit, push, PR, merge ni despliegue.
