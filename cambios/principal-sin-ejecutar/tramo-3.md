# Tramo 3 — Medir la invasión y proteger el cambio

Resultado: `node scripts/uso.mjs --sesiones` muestra, por sesión del principal, ediciones fuera de lo permitido y corridas de `verify`; `verify` falla si el principal vuelve a las frases viejas.
Archivos: `scripts/uso.mjs`, `pruebas/uso/probar.mjs`, `pruebas/uso/fixtures/`, `verify`, `docs/evaluaciones/costos.md`, `AGENTS.md`.

## Pasos
- [ ] En `scripts/uso.mjs`, para Codex, Claude Code y Pi, cuenta por sesión `ediciones_fuera` (escrituras a rutas que no empiezan por `cambios/` y no son `AGENTS.md` ni `docs/proyecto.md`; en Codex lee `apply_patch` y escrituras de `python`/`cat >` en `exec_command`; en Claude `Edit`/`Write` con `file_path`; en Pi `edit`/`write`) y `corridas_verify` (comandos que ejecutan `./verify` o `npm run verify`). Se muestran con `--sesiones` y en `--json`. Solo sesiones principales: las de subagente (constructor) no cuentan. (A4)
- [ ] Añade fixtures de las tres herramientas: uno sin ediciones fuera (esperado 0), uno con una edición en `src/` (esperado 1), uno con una edición en `cambios/` (esperado 0). (A4)
- [ ] Amplía `pruebas/uso/probar.mjs` con esos casos y un caso negativo: una sesión sin ninguna escritura no puede dar `null` por error de lectura. (A4)
- [ ] Agrega al `verify` el paso 8i, al estilo de 8f: las cadenas `Solo creas o editas`, `APROBADO`, `no corriges`, `una sola vez` presentes en `agentes/principal.md`; copia con `Fuera de eso no tienes límites` restituida o sin `Solo creas o editas`: debe fallar. (A5)
- [ ] En `docs/evaluaciones/costos.md` agrega la sección «Invasión del principal»: línea base del 9 nov (README de Memory-AI: 10 créditos del principal frente a 0,7 del constructor; 58 llamadas; 3 ediciones de pruebas del producto en 2 sesiones) y la tabla «después» vacía con las métricas: ediciones fuera, corridas de `verify`, llamadas tras el retorno (no medible aún: anótalo), créditos del principal ÷ créditos del constructor. (A4)
- [ ] En `AGENTS.md` cambia la línea del principal para decir que planifica y revisa, y que el constructor ejecuta toda edición. Sin pasar de 5600 bytes. (A1)
- [ ] `./verify` final sin caché (A1–A6)

Verificación del tramo: `./verify`; cubre A1–A6.
