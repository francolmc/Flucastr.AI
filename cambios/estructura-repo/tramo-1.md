# Línea base (propuesta, no aprobada)

## Pasos

### Tramo 1 — Historia: establecer la línea base
Como mantenedor quiero registrar el comportamiento actual para comparar cada cambio posterior.
Dependencias: `node`, `bash` y las herramientas que requiera `./verify`; acceso a un directorio temporal. Contratos: no acceder a proyectos reales ni escribir en el HOME real ni `pruebas/.temporales/`. `verify` consulta una ruta absoluta bajo `/Users`; cambiar HOME por sí solo no basta: usar un entorno aislado que presente `/Users` vacío y solo exponga una copia temporal del repo y las herramientas necesarias; si no se puede demostrar ese aislamiento, detenerse antes de ejecutar. Rutas sensibles: `instalar.sh`, `verify` y los directorios de prueba existentes permanecen en su lugar. Ejemplo: dos simulaciones en la misma copia y entorno temporal producen el mismo código y salida.
Diseño preliminar y cuestiones sin resolver: [aislamiento.md](aislamiento.md). No ejecutar las órdenes de referencia hasta resolverlas y demostrar que el aislamiento conserva la cobertura.
Alcance: sin archivos de producto; evidencias solo en esta carpeta, sin credenciales ni rutas privadas.
Archivos: ninguno; evidencia en `cambios/estructura-repo/plan.md`.
CUANDO se ejecute la simulación y la verificación originales en entorno aislado ENTONCES queda una referencia reproducible de salida, códigos y duración (A1).
Aceptación A1: registrar comando, entorno, duración, código y salida sanitizada de `bash ./instalar.sh --simular` y `./verify`; confirmar que ambos pasan y que la simulación repetida coincide. Si no se puede aislar o falla una comprobación, detenerse y registrar el motivo; no modificar el producto para obtener la línea base.
TODO:
- [ ] Inspeccionar `./instalar.sh` y `./verify`. Comprobación: documentar en `cambios/estructura-repo/plan.md` el aislamiento; esperar que no afecte proyectos ni datos existentes.
- [ ] Ejecutar `bash ./instalar.sh --simular` dos veces. Comprobación: comparar salida y código en el mismo entorno temporal; esperar coincidencia y código 0.
- [ ] Ejecutar `./verify` original en el entorno que sus pruebas requieren; registrar duración, código y salida sanitizada; esperar código 0.
- [ ] Guardar la receta y comparaciones en `cambios/estructura-repo/plan.md`. Comprobación: revisar que no incluyan rutas personales ni secretos y permitan reproducir el entorno.
Verificación del tramo: `./verify` — nivel 3, por exigencia del usuario de línea base completa; además comparar ambas simulaciones. Duración: desconocida hasta medir.
Handoff: registrar el estado real y detenerse antes de mover archivos.


## Evidencia
Pendiente.
