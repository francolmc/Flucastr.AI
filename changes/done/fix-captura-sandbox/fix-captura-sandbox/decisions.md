# Decisions — fix-captura-sandbox

| ID | Decision | Reason | Date | Status |
|----|----------|--------|------|--------|
| D-01 | Investigar y corregir la captura del sandbox manteniendo el aislamiento. | Pedido explícito de la persona usuaria. | 2026-11-28 | active |
| D-02 | Mantener P01 en su rama y conservar sus cambios sin commit. | La persona trabaja desde el celular y ya autorizó el árbol con cambios. | 2026-11-28 | active |
| D-03 | Probar un supervisor que limite la salida durante la ejecución y preserve errores, señales y timeout; pausar si no se demuestra esa equivalencia. | Implementa el límite ya aprobado sin desactivar el sandbox. | 2026-11-28 | active |
| D-04 | Adoptar mediación Python 3 estándar con captura incremental acotada y transporte por archivos privados, sujeto a controles reales sync/async y compatibilidad; autorizar actualización del plan y consumidores afectados. | El prompt autoriza diseño y dependencia; el control real Python capturó ambos flujos, archivos directos no conservan maxBuffer. | 2026-11-28 | active |
| D-05 | Reanudar A4 tras la pausa: auditar tools/check/cambios.mjs y autorizar nuevas verificaciones del árbol final sin subir nivel ni cambiar permisos. | La persona respondió «si dale» a retomar la validación pendiente. | 2026-11-28 | active |
