## Steps

### Segment 10 — Story: uso documentado y vigilado
As persona dueña del kit I want los comandos y límites escritos so that pueda correr la línea base solo.
Dependencies: Segment 9 — órdenes completas.
Contracts to keep: pasos existentes de `verify`.
Paths likely to change: `evals/builder/README.md`, `evals/README.md`, `verify`.
Concrete example of the expected result: README con `calibrar`, prueba de humo (`--tramos K-02`), `correr`, `comparar`.
Scope: esos tres archivos.
Files: evals/builder/README.md, evals/README.md, verify
WHEN corre `verify` THEN incluye las pruebas del banco (A11)
Acceptance:
- A11: paso nuevo en `verify`, enlace desde `evals/README.md`, y README con comandos fuera del sandbox, métricas, cómo poner la variante B y límites (n pequeño, costo del revisor vacío, thrashing, reservas con Docker); check with `node --test tests/evals-builder/*.test.mjs && ./verify`; expect exit 0.
TODO:
- [x] Escribir `evals/builder/README.md` (A11). Check: `rg -n 'calibrar|correr|comparar|contrato-b' evals/builder/README.md`; expect las cuatro.
- [x] Enlazar desde `evals/README.md` (A11). Check: `rg -n 'builder/README.md' evals/README.md`; expect una línea.
- [x] Añadir el paso en `verify` (A11). Check: `./verify`; expect exit 0.
- [x] Corregir la variante B en `evals/builder/README.md`: archivos de contrato bajo la carpeta del `.json`, rutas sin `..` ni absolutas (A11). Check: `leerVariante` sobre el ejemplo copiado a un temporal; expect aceptado.
- [x] Corregir en `evals/builder/README.md` qué se borra (copias y `HOME` temporal; la carpeta real de Codex no) y listar los campos nuevos de `comparar` (A11). Check: lectura contra `variante.mjs` y `comparar.mjs`; expect sin contradicciones.
Segment verification: `node --test tests/evals-builder/*.test.mjs && ./verify` — level 3; exit 0; covers A11.
Handoff: `correr` sin `--tramos` exige `--calibracion <salida>/calibracion.json` (D-27). seguir la numeración y `paso`/`fallo` ya usados en `verify`.

## Evidence
