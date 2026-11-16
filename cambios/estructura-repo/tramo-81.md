# Tramo 81 — Incluir core en paquetes remotos (borrador)

## Pasos

### Tramo 81 — Historia: incluir core en paquetes remotos
Como mantenedor quiero que los futuros archivos de `core/` estén disponibles tras una instalación remota para conservar el funcionamiento del kit.
Dependencias: tramo 80 revisado y prueba offline del tramo 28. Contratos: mantener validación del tar y rechazo de enlaces simbólicos; no acceder a red, HOME ni proyectos reales. Ejemplo: un paquete válido con un archivo regular en `core/` lo conserva al instalarse.
Alcance: `instalar-remoto.sh`; pruebas y evidencia.
Archivos: `instalar-remoto.sh`.
CUANDO el paquete remoto incluya `core/` ENTONCES el instalador copia sus archivos regulares sin permitir rutas adicionales ni enlaces (A81).
Aceptación A81: presencia y ausencia de `core/` funcionan; las pruebas negativas de enlaces y entradas prohibidas siguen rechazándolos; otras salidas y efectos permanecen iguales.
TODO:
- [ ] En `./instalar-remoto.sh`, añadir `core/` a la lista de directorios copiados por `copiar_permitidas`, sin alterar extracción ni validación (A81). Comprobación: inspeccionar el diff y verificar que la modificación se limita a esa lista.
- [ ] Ampliar la prueba offline de `./instalar-remoto.sh` del tramo 28 para un paquete sintético con y sin `core/`, y casos de enlace simbólico y ruta prohibida (A81). Comprobación: copia correcta o rechazo esperado, respectivamente, sin red.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A81). Comprobación: retornan 0 y coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además pruebas offline y simulación. Duración: medida en tramo 1.
Handoff: registrar resultados y detenerse para revisión.

## Evidencia
Pendiente.
