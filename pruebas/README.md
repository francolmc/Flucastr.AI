# Pruebas — etapa 1 (I1–I6)
Requisitos: bash y Node con `node:test`; sin dependencias adicionales.
Desde la raíz: `node --test pruebas/capa1/instalacion.test.mjs`.
Para guardar salida: `node --test pruebas/capa1/instalacion.test.mjs > pruebas/capa1/ultima-ejecucion.tap 2>&1`.
Código 0: todo pasa; código distinto de 0: consultar los fallos.
Cada I tiene una comprobación real y un control negativo de salida falsa.
Se copian fuentes a `pruebas/.temporales/`; HOME, Pi y TMPDIR quedan aislados allí.
Las copias y evidencias se conservan; no hay limpieza automática ni llamadas a modelos.
Los snapshots comparan estado persistente (archivos, permisos, enlaces y directorios), no escrituras transitorias.
Resumen de la ejecución en `pruebas/resultados/2026-10-28-capa1.md`; no incluye etapas posteriores.
