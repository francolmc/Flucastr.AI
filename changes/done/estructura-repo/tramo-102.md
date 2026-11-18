# Tramo 102 — Separar lectura de JSONL (borrador)

## Pasos

### Tramo 102 — Historia: Separar lectura de JSONL
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 101 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/uso.mjs y tools/usage/jsonl.mjs; pruebas y evidencias pertinentes.
Archivos: scripts/uso.mjs, tools/usage/jsonl.mjs.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A102).
Aceptación A102: Fixtures válidos, líneas corruptas y directorios inexistentes producen los resultados anteriores. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [x] Extraer esDirectorio, reciente, listarJsonl y leerJsonl con sus imports; conservar orden de recorridos, fallos silenciosos y callback por línea. (A102). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-102.md` y confirmar que solo aborda esta responsabilidad.
- [x] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-102.md` y las pruebas negativas afectadas con fixtures aislados (A102). Comprobación: Fixtures válidos, líneas corruptas y directorios inexistentes producen los resultados anteriores.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A102). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- La suite `$ node pruebas/uso/probar.mjs` pasó como referencia previa a la extracción: `exit 0`, 19/19 casos A1–A8 con fixtures existentes.
- Extracción de `esDirectorio`, `reciente`, `listarJsonl` y `leerJsonl` a `tools/usage/jsonl.mjs`; `scripts/uso.mjs` importa las cuatro funciones donde se definían originalmente. Los cuerpos y orden de recorrido se conservaron; `leerJsonl` mantiene omisión silenciosa de líneas vacías/corruptas y callback por objeto válido.
- `$ node --check scripts/uso.mjs && node --check tools/usage/jsonl.mjs && git diff --check -- scripts/uso.mjs tools/usage/jsonl.mjs`: `exit 0`. La inspección del diff confirma que el cambio de producto se limita a retirar las cuatro funciones e imports ya trasladados y añadir el import del módulo.
- `$ node pruebas/uso/probar.mjs` tras extraer: `exit 0`, 19/19; resultados iguales a la referencia pre-extracción. A4a confirmó que una línea corrupta y un archivo antiguo se omiten; A4b comprobó una carpeta ausente junto con el resto de fuentes; A4c comprobó todas las carpetas ausentes y código 1. Fixtures sintéticos; no se consultaron sesiones reales.
- `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `exit 0` en 46.7 s. En aislamiento del tramo 1, `./verify` coincide con la referencia salvo el mensaje exacto autorizado del escenario 9; dos simulaciones de instalación son repetibles y coinciden con la línea base. El runner compara códigos, salidas y efectos.
