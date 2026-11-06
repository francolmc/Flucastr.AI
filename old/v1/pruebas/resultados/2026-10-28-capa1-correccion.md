# Resultado — corrección del instalador y Capa 1

- Fecha: 2026-10-28.
- Sin modelos ni red; todas las instalaciones usan HOME y directorios Pi temporales bajo `pruebas/.temporales/`.
- `bash -n instalar.sh`: pasa.
- `node --test pruebas/capa1/instalacion.test.mjs`: **6/6 comprobaciones reales pasan y los 6 controles negativos pasan** (12/12 pruebas).
- I5 cubre JSON roto y nivel inexistente en HOME limpio; además instala correctamente, rompe `modelos.json` e intenta reinstalar, comprobando que la instalación anterior permanece idéntica.
- Se conserva el resumen anterior `2026-10-28-capa1.md`.

## Cambios

`instalar.sh` decide primero las herramientas que instalará y resuelve/genera en validación los agentes correspondientes antes de crear el temporal de manifiesto, quitar una instalación previa o escribir/enlazar destinos. Así, un fallo de configuración o de validación no altera la instalación existente. `--simular` atraviesa la misma validación.

Las comprobaciones de I3 ahora permiten directorios vacíos residuales, pero siguen comparando todo el estado no-directorio y por tanto detectan archivos, enlaces y cambios en el contenido previo. I4 compara estado persistente y tolera el temporal eliminado de `mktemp`.

## Alcance de la verificación

La variante de reinstalación se comprobó contra ambas versiones. Con la versión sin corregir obtenida mediante `git show fa24e7c:instalar.sh`, la secuencia «instalar bien → romper `modelos.json` → reinstalar» devolvió código 1 con el error claro del JSON, pero **falló la comprobación de estado idéntico**: desaparecieron el agente Claude, ambos agentes/lanzador Pi y sus cuatro enlaces de skills; el manifiesto también cambió. Esto confirma el control negativo esperado. La evidencia aislada se conserva en `pruebas/.temporales/i5-negativo-fa24e7c-SQElVP/` (salida de reinstalación y snapshots antes/después). Con la versión corregida, la misma variante pasa según la Capa 1 ejecutada previamente. No se avanzó a otros escenarios ni se hizo commit.
