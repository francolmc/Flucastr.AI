# task-01 — Alinear README y comentario de archivar.mjs con WORKFLOW.md §3.1
repo: Flucastr.AI   depende_de: —   estado: lista para revisión

## Descripción
Tras F12, el `coordinador` puede correr `scripts/archivar.mjs` a pedido explícito de Franco (`definitions/WORKFLOW.md` §3.1). Dos textos fuera de `definitions/` aún dicen lo contrario o lo omiten: el árbol del `README.md` y el comentario de cabecera de `scripts/archivar.mjs`. Se corrigen solo esas dos frases, sin cambiar comportamiento. Es una sola tarea porque son dos líneas en dos archivos con la misma verificación.

## Contexto
- Repo: este, único. Node 25. Sin modelo. Leídos por el planificador:
  - `README.md` línea 54: `│   ├── archivar.mjs    # chequea el contexto y, con --aplicar (lo corre Franco), mueve las features hecha a features/completed/`
  - `scripts/archivar.mjs` líneas 9-11 (comentario): `--aplicar F03` exige `Fxx`; la línea 11 termina en «Lo ejecuta Franco, nunca un agente.»
  - `definitions/WORKFLOW.md` §3.1 (lista cerrada de comandos del `coordinador`) y §10.2: `--aplicar` siempre con `Fxx` explícito; a pedido explícito de Franco; el commit sigue siendo de Franco. Solo lectura, no se edita.
- Pruebas del script: `pruebas/comprobaciones/archivar.test.mjs`. Suite completa ejecutada hoy: 246 pruebas, 246 pasan, 0 fallan.
- `git diff` ya muestra cambios sin commit en `definitions/` hechos por el arquitecto: no usar `git diff --stat` como verificación.

## Decisiones ya tomadas
- Texto nuevo en `README.md` línea 54, reemplazando solo el comentario tras `#`: `# chequea el contexto y, con --aplicar Fxx (Fxx explícito; lo corre Franco o el coordinador a su pedido, WORKFLOW.md §3.1), mueve esa feature hecha a features/completed/`
- Texto nuevo en `scripts/archivar.mjs`: la oración «Lo ejecuta Franco, nunca un agente.» pasa a «Lo ejecuta Franco o, a su pedido explícito, el coordinador (definitions/WORKFLOW.md §3.1); el commit es siempre de Franco.» Si la línea supera ~110 caracteres, se parte en dos líneas de comentario `//`.
- No se toca código ejecutable, `definitions/`, `STATUS.md` ni `BACKLOG.md`.

## Alcance / Fuera de alcance
Alcance: una línea de `README.md` y el comentario de cabecera de `scripts/archivar.mjs`.
Fuera de alcance: cualquier línea ejecutable del script, otras menciones en `README.md` (p. ej. la de `registrar.mjs`, línea ~143), `definitions/**`, `agentes/**`, `pruebas/**`, `STATUS.md`, `BACKLOG.md`, commit.

## Pasos
1. Leer `README.md` línea 54 y `scripts/archivar.mjs` líneas 1-12 y confirmar que coinciden con *Contexto*.
2. En `README.md`, reemplazar el comentario de la línea 54 por el texto de *Decisiones ya tomadas*. Resultado: `grep -n "archivar.mjs" README.md` muestra la frase nueva.
3. En `scripts/archivar.mjs`, reemplazar «Lo ejecuta Franco, nunca un agente.» por el texto nuevo (en una o dos líneas `//`). Resultado: el comentario cita §3.1.
4. Confirmar que el diff de ambos archivos solo toca esas líneas: `git diff -U0 README.md scripts/archivar.mjs`.
5. Correr `node --test pruebas/comprobaciones/archivar.test.mjs` y ver 0 fallos.
6. Correr la suite completa y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. `README.md` ya no contiene «con --aplicar (lo corre Franco)» y sí «Fxx explícito» y «el coordinador a su pedido». Se comprueba con los `grep` de *Verificación*.
2. `scripts/archivar.mjs` ya no contiene «nunca un agente» y sí «§3.1». Se comprueba con `grep`.
3. El diff de ambos archivos solo toca líneas de texto/comentario (`git diff -U0`).
4. La suite completa queda en 246/246 sin fallos.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -c "con --aplicar (lo corre Franco)" README.md          # 0
grep -c "Fxx explícito" README.md                             # 1
grep -c "el coordinador a su pedido" README.md                # 1
grep -c "nunca un agente" scripts/archivar.mjs                # 0
grep -c "WORKFLOW.md §3.1" scripts/archivar.mjs               # 1
git diff -U0 README.md scripts/archivar.mjs                   # solo la línea 54 y el comentario
node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs pruebas/capa1/*.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Salida esperada de `grep -c`: 0, 1, 1, 0, 1 (`grep -c` con 0 coincidencias sale con código 1; es normal). Suite: `tests 246`, `pass 246`, `fail 0` (el primer bloque de resumen).

## Evidencia

Rama: `git branch --show-current` dio `main`; `git switch -c chore/F13-alinear-readme-archivar` → «Switched to a new branch 'chore/F13-alinear-readme-archivar'»; `git branch --show-current` → `chore/F13-alinear-readme-archivar`.

Verificación (salida real):
```
$ grep -c "con --aplicar (lo corre Franco)" README.md
0
$ grep -c "Fxx explícito" README.md
1
$ grep -c "el coordinador a su pedido" README.md
1
$ grep -c "nunca un agente" scripts/archivar.mjs
0
$ grep -c "WORKFLOW.md §3.1" scripts/archivar.mjs
1
$ git diff -U0 README.md scripts/archivar.mjs
diff --git a/README.md b/README.md
@@ -54 +54 @@ Flucastr.AI/
-│   ├── archivar.mjs    # chequea el contexto y, con --aplicar (lo corre Franco), mueve las features hecha a features/completed/
+│   ├── archivar.mjs    # chequea el contexto y, con --aplicar Fxx (Fxx explícito; lo corre Franco o el coordinador a su pedido, WORKFLOW.md §3.1), mueve esa feature hecha a features/completed/
diff --git a/scripts/archivar.mjs b/scripts/archivar.mjs
@@ -11 +11,2 @@
-// no borra y no toca BACKLOG.md, STATUS.md, ramas ni git. Lo ejecuta Franco, nunca un agente.
+// no borra y no toca BACKLOG.md, STATUS.md, ramas ni git. Lo ejecuta Franco o, a su pedido explícito,
+// el coordinador (definitions/WORKFLOW.md §3.1); el commit es siempre de Franco.
$ node --test pruebas/comprobaciones/archivar.test.mjs | tail
ℹ tests 27
ℹ pass 27
ℹ fail 0
$ node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs pruebas/capa1/*.test.mjs | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 246
ℹ pass 246
ℹ fail 0
```

Criterios: 1 cumplido (grep README: 0, 1, 1); 2 cumplido (grep archivar: 0, 1); 3 cumplido (diff -U0 solo toca la línea 54 de README.md y la línea 11 del comentario de archivar.mjs, que pasa a dos líneas `//`); 4 cumplido (suite 246/246, fail 0).

## Notas
Hueco menor: la oración nueva de archivar.mjs supera ~110 caracteres en una línea, así que se partió en dos líneas `//` según la tarea. Sin otros huecos.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
