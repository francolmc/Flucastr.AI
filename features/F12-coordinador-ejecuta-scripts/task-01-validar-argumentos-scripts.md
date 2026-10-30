# task-01 — Validación estricta de argumentos en `archivar.mjs` y `registrar.mjs`
repo: Flucastr.AI   depende_de: —   estado: borrador

## Descripción
Hoy `node scripts/archivar.mjs --aplicar` (sin `Fxx`) mueve todas las candidatas, y ambos scripts aceptan opciones repetidas (la última gana). Franco decidió (`definitions/WORKFLOW.md` §3.1.1, punto 2) que `--aplicar` exige siempre un `Fxx` explícito, y §3.1 pide que ambos scripts rechacen argumentos ambiguos. Esta tarea endurece el CLI de los dos scripts y lo prueba sin modelo. Es la contención que queda cuando la herramienta no restringe el comando (patrón `F*` en Claude Code, `bash` completo en Pi).

## Contexto
- Repo: este (`/Users/franco/Codes/flucastr/Flucastr.AI`), único repo. Node 25, sin red ni modelo.
- A tocar (leídos): `scripts/archivar.mjs` (función `leerArgumentos`, líneas ~275–296, y el comentario de uso de las líneas 4–11; el bloque CLI usa `opciones.ids.length > 0 ? opciones.ids : null`), `scripts/registrar.mjs` (`leerArgumentos` y `USO`, líneas ~537–556), `pruebas/comprobaciones/archivar.test.mjs` (usa un helper `cli(raiz, args)`), `pruebas/capa1/registrar.test.mjs` (tests numerados `(1)`…`(9)`).
- Estado actual (ejecutado por el planificador): `node --test pruebas/comprobaciones/archivar.test.mjs` → 20 pruebas, 0 fallos; `node --test pruebas/capa1/registrar.test.mjs` → 9 pruebas, 0 fallos.
- Hoy ambos scripts ya rechazan opciones desconocidas con código 1 y mensaje en stderr (`argumento desconocido '…'` / `opción desconocida '…'`).
- Pruebas existentes de `archivar.test.mjs` que llaman `--aplicar` sin `Fxx` por CLI: `(a) --aplicar sin ID…` y `--aplicar sin candidatas imprime «Nada que archivar.»`. Deben reescribirse (ver Pasos).

## Decisiones ya tomadas
- Errores nuevos de `archivar.mjs` (código 1, a stderr con prefijo `error: `, sin mover nada): `--aplicar exige un Fxx explícito`; `--aplicar acepta un solo Fxx`; `opción repetida '--raiz'` / `opción repetida '--aplicar'`.
- Errores nuevos de `registrar.mjs` (código 1, stderr, seguido de la línea `USO` ya existente, sin crear `registro/`): `opción repetida '--raiz'` / `opción repetida '--reconstruir'`.
- La función exportada `aplicar(raiz, ids)` conserva su comportamiento con `ids = null` (la usan pruebas de función); el rechazo es solo del CLI.
- El `Fxx` debe seguir cumpliendo `RE_ID` (`/^F\d{2}$/`); no se admiten comodines, minúsculas ni espacios.
- No se cambia el formato de salida de éxito de ninguno de los dos scripts.

## Alcance / Fuera de alcance
Alcance: `leerArgumentos` de ambos scripts, sus comentarios de uso y las pruebas sin modelo.
Fuera de alcance: cambiar `chequear`, `aplicar` o `registrar`; tocar `agentes/`, `definitions/` o `README.md`; el ajuste de textos que mencionen `--aplicar` sin `Fxx` fuera de los dos scripts (lo hacen task-02 y task-07); commit.

## Pasos
1. Releer `leerArgumentos` en ambos scripts y el helper `cli` de `pruebas/comprobaciones/archivar.test.mjs`.
2. `scripts/archivar.mjs`: en `leerArgumentos`, rechazar `--raiz` o `--aplicar` repetidos; con `--aplicar` y `ids.length === 0` devolver `--aplicar exige un Fxx explícito`; con `ids.length > 1` devolver `--aplicar acepta un solo Fxx`. Mantener el error existente de IDs sin `--aplicar`.
3. `scripts/archivar.mjs`: actualizar el comentario de uso (líneas 4–11): quitar la línea de `--aplicar` sin ID y decir que `Fxx` es obligatorio; simplificar el bloque CLI (`ids` ya es de un elemento).
4. `scripts/registrar.mjs`: en `leerArgumentos`, rechazar `--raiz` y `--reconstruir` repetidos con `opción repetida '<opción>'`.
5. `pruebas/comprobaciones/archivar.test.mjs`: reescribir `(a)` y la de «Nada que archivar» para pasar `--aplicar F01`/`F09` (ajustando lo esperado), y añadir pruebas CLI: `--aplicar` solo, `--aplicar F01 F02`, `--aplicar F01 --aplicar`, `--raiz x --raiz y`, `F01` sin `--aplicar`, `--aplicar F1`, `--aplicar f01`; cada una con código 1, stderr con el mensaje y el directorio sin cambios (`listarRecursivo` antes/después).
6. `pruebas/capa1/registrar.test.mjs`: añadir la prueba `(10)`: `registrar.mjs --reconstruir --reconstruir`, `--raiz . --raiz .`, `--foo` y un argumento suelto `F01` terminan en 1 con stderr y sin crear `registro/` en un repo temporal.
7. Ejecutar la verificación y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. `node scripts/archivar.mjs --aplicar` termina en 1 con `--aplicar exige un Fxx explícito` y no mueve nada. Se comprueba con la prueba nueva.
2. Varios `Fxx`, opciones repetidas y `Fxx` mal formado terminan en 1 en `archivar.mjs` sin mover nada. Se comprueba con las pruebas nuevas.
3. `registrar.mjs` rechaza opciones repetidas y argumentos sueltos con código 1 y sin crear `registro/`. Se comprueba con `(10)`.
4. `node scripts/archivar.mjs` (chequeo) y `--aplicar F02` sobre una candidata siguen funcionando. Se comprueba con las pruebas `(b)`, `(i)` existentes.
5. Las suites de ambos archivos pasan completas.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --test pruebas/comprobaciones/archivar.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
node --test pruebas/capa1/registrar.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
node scripts/archivar.mjs --aplicar; echo "rc=$?"
node scripts/registrar.mjs --reconstruir --reconstruir; echo "rc=$?"
git status --short scripts pruebas registro
```
Salida esperada: primera suite `fail 0` (tests ≥ 25); segunda `fail 0` (tests 10); `error: --aplicar exige un Fxx explícito` y `rc=1`; `error: opción repetida '--reconstruir'`, la línea `uso:` y `rc=1`; `git status` solo con ` M` en `scripts/archivar.mjs`, `scripts/registrar.mjs` y los dos tests (ningún cambio en `features/` ni `registro/`).

## Evidencia

## Notas
