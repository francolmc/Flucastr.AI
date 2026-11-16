# Tramo 56 — Caracterizar el instalador (borrador)

## Pasos

Casos y capturas obligatorios: [matrices de caracterización](matrices.md).

### Tramo 56 — Historia: Establecer equivalencia del instalador
Como mantenedor quiero capturar el comportamiento de instalación para detectar cualquier cambio al separar funciones.
Dependencias: tramo 55 revisado y aislamiento del tramo 1. Contratos: solo repos y HOME sintéticos, sin secretos ni proyectos reales; no invocar modelos ni red. Ejemplo: instalar y desinstalar en directorios temporales conserva ajustes y produce el mismo manifiesto que la línea base.
Alcance: pruebas de caracterización y evidencia en `cambios/estructura-repo/`; no editar scripts de producto.
Archivos: pruebas de caracterización pertinentes y `cambios/estructura-repo/tramo-56.md`.
CUANDO se instale, reinstale, migre o desinstale en fixtures ENTONCES quedan capturados resultados y efectos comparables (A56).
Aceptación A56: matrices con códigos, stdout, stderr, manifiestos, contenido, permisos y enlaces; pruebas existentes intactas; solo se normalizan rutas temporales y excepciones aprobadas.
TODO:
- [ ] En `cambios/estructura-repo/tramo-56.md`, capturar instalación y simulación por Claude, Pi y Codex, combinaciones --solo y --copiar, herramientas ausentes y opciones inválidas (A56). Comprobación: registrar comandos, estado y árboles en fixtures reproducibles.
- [ ] En `cambios/estructura-repo/tramo-56.md`, capturar proyecto sintético, --skills-proyecto, reinstalación, desinstalación y migración real y simulada en fixtures desechables, incluidos ajustes preexistentes (A56). Comprobación: registrar árbol antes y después y asegurar que el HOME y proyecto reales no se tocan.
- [ ] En `cambios/estructura-repo/tramo-56.md`, capturar instalación remota con transporte local simulado, sin red, y fallo de integridad (A56). Comprobación: conservar código, mensajes y árbol resultante.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A56). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A56). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar evidencia y detenerse para revisión.

## Evidencia
Pendiente.
