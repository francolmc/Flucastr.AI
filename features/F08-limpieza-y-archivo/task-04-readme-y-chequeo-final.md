# task-04 — README al día y chequeo final de F08
repo: Flucastr.AI   depende_de: task-03   estado: aprobada

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

## Notas
