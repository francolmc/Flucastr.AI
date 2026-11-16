# Tramo 82 — Comprobar copias de compatibilidad (borrador)

## Pasos

### Tramo 82 — Historia: comprobar copias de compatibilidad
Como mantenedor quiero detectar cualquier diferencia entre las fuentes en `core/` y sus rutas anteriores para mantener una única fuente editable.
Dependencias: tramo 81 revisado; módulos de verify de los tramos 4–26. Contratos: comprobación sin escribir archivos ni seguir enlaces simbólicos; no modificar mensajes preexistentes de verify; rutas del inventario relativas al repositorio. Ejemplo: cambiar un byte de una copia en una copia temporal causa fallo de la comprobación.
Alcance: `tools/core-compatibility.json`, `tools/verify/core-compatibility.mjs` y el módulo de verify responsable de comprobaciones estructurales identificado en tramo 3; pruebas pertinentes.
Archivos: inventario, comprobador y módulo estructural de verify (máximo tres archivos de producto).
CUANDO exista un par en el inventario ENTONCES ambos archivos regulares tienen el mismo contenido y permisos ejecutables (A82).
Aceptación A82: inventario inicialmente vacío válido; cada par se valida por bytes, tipo y bit ejecutable; rutas faltantes, duplicadas, fuera del repo o enlaces fallan; las pruebas comprueban cada caso sin modificar el checkout.
La validación rechaza rutas absolutas, componentes `..` y enlaces simbólicos en cualquier componente, no solo en el archivo final; comprobar también alias y duplicados tras normalizar. No abrir archivos hasta validar su confinamiento.
TODO:
- [ ] Crear `tools/core-compatibility.json` vacío y `tools/verify/core-compatibility.mjs` sin dependencias externas; validar pares, duplicados y confinamiento, sin seguir enlaces (A82). Comprobación: pruebas aisladas positivas y negativas pasan.
- [ ] Conectar `tools/verify/core-compatibility.mjs` al módulo estructural de verify identificado en tramo 3, sin cambiar el orden ni textos existentes (A82). Comprobación: diff acotado y verify falla en una copia temporal con par distinto.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A82). Comprobación: retornan 0 y coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además pruebas negativas y simulación. Duración: medida en tramo 1.
Handoff: registrar resultados y detenerse para revisión.

## Evidencia
Pendiente.
