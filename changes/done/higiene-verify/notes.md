# Notas: higiene de /tmp y de la salida de verify

## Next action
Cerrado (evidencia aprobada por la persona el 2026-11-26). Falta que la persona haga commit y PR a `main`.

## Diagnóstico (2026-11-26)

### Disco
- `/tmp`: tmpfs 5,9 GB, 685 MB usados; 591 MB son `.pnpm-store` (ajeno al kit).
- `$TMPDIR` del sandbox (`/tmp/claude-1000`): 57 MB, 108 carpetas, 413 archivos (todas las sesiones).
- Restos atribuibles al kit: 74 `tmp.*` (3,6 MB, 24 a 26 nov), 50 con la firma de `$TH` (`install-help.sh`); `kit-run-*`, `kit-run-prueba-*`, `kit-run-vigilado-*` (3, mismo minuto: quizá una corrida cortada, inferencia). No todo `tmp.*` está atribuido.
- `pruebas/.temporales`: 12 KB hoy (no ~3,9 GB; `TODO.md` aún lo cita). `old/v1/pruebas/.temporales`: 316 KB. No se borró nada.

### Salida (`wc` sobre logs de corridas anteriores en `$TMPDIR`)
- Verde: 26.142 B (339 líneas, 24 nov) a 61.123 B (856 líneas, `verify-cierre.txt`, 26 nov).
- Rojo: 22.891 a 31.898 B (272 a 445 líneas). Solo el paso fallido: 255, 5.400 y 9.482 B.
- Pasos más largos del verde: 13 (12,9 KB), 22 (10,2 KB), 23 (4,6 KB), 15 (4,2 KB).
- Duración medida: 128 s (`verify-base.time`, 25 nov, versión de 31 pasos); `escalera-recuperacion` anota ≈3 min.
- Ejecutar `./verify` hoy con TMPDIR propio: permiso DENEGADO; no se reintentó.

### Limpieza por script
- `trap EXIT` efectivo (en subshell): `snapshot.sh`, `agent-resolution.sh`, `install-simulation.sh`, `launchers.sh`, `codex-launcher.sh` (`$tmp`), `codex-negative.sh`; `migration/run.sh`.
- `trap` de nivel superior en archivos cargados con `source`: cada uno reemplaza al anterior. `project-permissions.sh` pisa el de `install-help.sh` (`$TH` queda siempre). T6 a T9 se encadenan a mano hasta `migration-contract.sh`.
- Sin trap, borran solo si pasan: `docker-observer.sh` (T8R), `segment-contract.sh` (T11), `codex-launcher.sh` (`$tf`, con `rm` en cada falla), `migration/names.sh`, `install-compaction.sh` (2, `mv`).
- Trap por función: `install.sh` (`guardar_manifiesto`), `install-remote.sh` (`limpiar`).
- JS: 49 sitios `mkdtemp`; todos tienen `rm`. Solo `tools/run/process.mjs` sin `finally`/`after` (borra en `finalizar`). Ninguno cubre SIGKILL.
- `HOME=` y `cp -r`: siempre hacia temporales de `mktemp`. Docker: `verify` usa un docker falso; no crea recursos.
- Tramo 1 (segmento 1) cerrado: barrido.mjs, tests y kit-run con barrer(tmpdir()); checks en plan.md Evidence. Siguiente: tramo 2 (temporal único por corrida).
- Tramos 2 a 4 cerrados (segmentos 2 a 4 de la historia «verify limpio y breve»): envoltorio con temporal único y espacio libre, resumen verde y rojo acotado con log, prueba estática `tests/temporales/estatico.test.mjs` (14/14) con sonda detectada y borrada, documentación en README y `docs/implementacion.md`. `./verify` completo: exit 0, `VERIFY OK`, 3 líneas en pantalla, 0 entradas en el `TMPDIR` propio.
- Relanzamiento 1 (builder): los cinco `Devuelto:` de plan.md Notes resueltos (filtro de uid en el barrido, caso de kit run, TMPDIR del hijo, registro en verde y rojo, docs). Hallazgo: el registro se repetía en rojo por la cola del log; corregido (se añade al log al final). Sensibilidades y checks en plan.md «Revisión 1 (builder)». `tests/temporales/*.test.mjs` 36/36. Pendiente: `./verify` final.
