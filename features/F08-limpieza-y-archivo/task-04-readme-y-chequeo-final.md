# task-04 — README al día y chequeo final de F08
repo: Flucastr.AI   depende_de: task-03   estado: lista para revisión

## Descripción
Deja el README coherente con lo que añadió F08 (`scripts/archivar.mjs`, `features/completed/`) y comprueba de punta a punta, en solo lectura, que el chequeo corre sobre el repo real. No ejecuta `--aplicar`: archivar F01–F07 lo decide y lo hace Franco.

## Contexto
- Leídos: `README.md` (bloque «## Estructura»: línea `├── features/        # tareas por feature …` y `scripts/` con `│   └── resolver.mjs …`); `pruebas/comprobaciones/readme-estructura.mjs` (el validador solo compara los hijos de `agentes/` y `skills/` con el disco; las demás líneas del árbol son libres) y su prueba real en `readme-estructura.test.mjs` (lee `README.md`).
- A tocar: `README.md`. Comando de prueba: `node --test pruebas/comprobaciones/readme-estructura.test.mjs`.
- Convención del árbol: líneas `│   ├── nombre   # comentario`, y la última del grupo con `└──`.

## Decisiones ya tomadas
- En `scripts/` el árbol pasa a dos hijos: `│   ├── resolver.mjs    # …` (comentario existente) y `│   └── archivar.mjs    # chequea el contexto y, con --aplicar (lo corre Franco), mueve las features hecha a features/completed/`.
- La línea de `features/` queda: `├── features/        # tareas por feature (features/Fxx-nombre/task-NN-nombre.md); las terminadas, archivadas en features/completed/`.
- No se tocan otras secciones del README (no se corrige el estado del encabezado: fuera de F08).
- No se ejecuta `--aplicar` en el repo real.

## Alcance / Fuera de alcance
Alcance: dos líneas del árbol de `README.md` y la verificación final.
Fuera de alcance: `AGENTS.md` (ya cumple su límite de 2 KB y no necesita cambios), `definitions/**`, `pruebas/README.md`, archivar F01–F07, compactar filas del backlog.

## Pasos
1. En `README.md`, cambiar la línea de `features/` según *Decisiones*. Resultado: `grep -n "features/completed" README.md` muestra la línea.
2. En `README.md`, cambiar el bloque `scripts/` según *Decisiones*. Resultado: `grep -n "archivar.mjs" README.md` muestra la línea.
3. Correr la *Verificación* y pegar en *Evidencia* el informe real de `node scripts/archivar.mjs` (puede incluir `AVISO` por tamaño o por candidatas; no se corrige nada).

## Criterios de aceptación
1. El árbol del README menciona `scripts/archivar.mjs` y `features/completed/`. Se comprueba con `grep`.
2. La comprobación de estructura del README sigue pasando. `node --test pruebas/comprobaciones/readme-estructura.test.mjs`.
3. `node scripts/archivar.mjs` sobre el repo real termina en 0 y no modifica archivos (`git status --short` igual antes y después).
4. `bash pruebas/rapida.sh` pasa dentro del tope de 30 s.

## Verificación
```
antes="$(git status --short)"; node scripts/archivar.mjs; echo "salida=$?"; [ "$antes" = "$(git status --short)" ] && echo "sin cambios por el chequeo"
grep -n "archivar.mjs\|features/completed" README.md
node --test pruebas/comprobaciones/readme-estructura.test.mjs
bash pruebas/rapida.sh
```
Esperado: la primera imprime el informe, `salida=0` y `sin cambios por el chequeo`; la segunda muestra dos líneas; la tercera con `fail 0`; la cuarta termina con `rapida: N archivos en S s (tope 30 s)` y código 0.

## Evidencia

Paso 1 y 2 (`grep -n "archivar.mjs\|features/completed" README.md`):
```
37:├── features/        # tareas por feature (features/Fxx-nombre/task-NN-nombre.md); las terminadas, archivadas en features/completed/
54:│   └── archivar.mjs    # chequea el contexto y, con --aplicar (lo corre Franco), mueve las features hecha a features/completed/
```

Verificación 1 (`antes=...; node scripts/archivar.mjs; echo "salida=$?"; [ ... ] && echo "sin cambios por el chequeo"`), informe real:
```
Chequeo de contexto y archivo (solo lectura; definitions/WORKFLOW.md §10)

## Tamaño de lo que se lee
- AGENTS.md: 1141 caracteres, 10 líneas (umbral 2048)
- definitions/STATUS.md: 2355 caracteres, 35 líneas (umbral 3072)
- definitions/BACKLOG.md: 10023 caracteres, 28 líneas (umbral 8192) AVISO
- definitions/ARCHITECTURE.md: 8559 caracteres, 139 líneas (umbral 30720)
- definitions/PROJECT.md: 15195 caracteres, 136 líneas (umbral 30720)
- definitions/REPOS.md: 1757 caracteres, 30 líneas (umbral 30720)
- definitions/WORKFLOW.md: 37488 caracteres, 354 líneas (umbral 30720) AVISO

## Filas hechas del backlog
- F01: 155 caracteres (umbral 300)
- F02: 180 caracteres (umbral 300)
- F03: 897 caracteres (umbral 300) AVISO
- F04: 207 caracteres (umbral 300)
- F05: 901 caracteres (umbral 300) AVISO
- F06: 409 caracteres (umbral 300) AVISO
- F07: 550 caracteres (umbral 300) AVISO

## Candidatas a archivar
- F01
- F02
- F03
- F04
- F05
- F06
- F07

## Inconsistentes
- ninguna

## Features con tareas hechas y fila no hecha
- ninguna
salida=0
sin cambios por el chequeo
```

Verificación 2 (`grep -n "archivar.mjs\|features/completed" README.md`): dos líneas, las mismas de arriba.

Verificación 3 (`node --test pruebas/comprobaciones/readme-estructura.test.mjs`), últimas líneas:
```
✔ variante: README sin sección «## Estructura» (0.058166ms)
✔ repo real: README, agentes/ y skills/ coinciden (0.248458ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 53.957542
```

Verificación 4 (`bash pruebas/rapida.sh`), dos corridas reales: la primera con `tail`, la segunda capturando el código de salida (`codigo=0`). Última línea de la segunda:
```
rapida: 18 archivos en 21 s (tope 30 s)
```
(Primera corrida: `rapida: 18 archivos en 22 s (tope 30 s)`, con 181 pruebas pasando y 0 fallos.)

Criterios de aceptación:
1. El árbol menciona `scripts/archivar.mjs` y `features/completed/`: cumple (líneas 37 y 54).
2. Comprobación de estructura del README: cumple, `fail 0`.
3. `archivar.mjs` termina en 0 y no cambia `git status --short`: cumple (`salida=0`, `sin cambios por el chequeo`). No se ejecutó `--aplicar`.
4. `rapida.sh` pasa dentro de 30 s: cumple (21 s, código 0).

## Notas
- Hueco menor: el *Paso 1* pedía cambiar la línea de `features/` y el *Paso 2* el bloque de `scripts/`, sin indicar el orden exacto de las líneas dentro del árbol. Se mantuvo la convención `│   ├──` / `│   └──`: `resolver.mjs` queda con `├──` y `archivar.mjs` con `└──`, como indica *Decisiones ya tomadas*.
- `git status --short` ya mostraba antes de empezar `M definitions/STATUS.md` y `M features/F08-limpieza-y-archivo/task-03-coordinador-y-planificador.md`. No los toqué; el chequeo los dejó igual.
- El chequeo reporta `AVISO` de tamaño en BACKLOG.md, WORKFLOW.md y en las filas F03, F05, F06 y F07, y 7 candidatas a archivar (F01–F07). Es información para Franco; no se corrigió nada, como pide la tarea.
- La primera corrida de `rapida.sh` se hizo con `| tail`, y el código se perdió porque `PIPESTATUS` no existe en zsh; por eso se repitió sin tubería y se pegó el código real.
- Las dos ediciones de README y las de esta tarea son lo único que escribí. No se tocó `definitions/STATUS.md`. Sin commit, push, PR, merge ni despliegue.
