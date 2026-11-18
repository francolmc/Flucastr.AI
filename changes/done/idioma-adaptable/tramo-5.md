# Tramo 5 — Instalación remota autónoma

## Pasos

### Tramo 5 — Historia: ejecutar la entrada remota en inglés

Como persona que instala desde una descarga quiero un archivo remoto en inglés que funcione por sí solo y conserve la interfaz anterior para que el kit sea reutilizable.

Dependencias: Tramo 3, porque la instalación remota ejecuta el instalador del kit descargado.

Contratos a conservar: `instalar-remoto.sh` descargado por separado sigue funcionando, URLs funcionales y verificación de descarga conservadas, sin dependencias de archivos vecinos, códigos y mensajes españoles. No contactar servicios reales en las pruebas.

Rutas susceptibles de cambio: se agrega `install-remote.sh`; la ruta española y su funcionamiento independiente permanecen.

Ejemplo concreto del resultado esperado: una copia aislada de `install-remote.sh` ejecutada con `--show-urls` imprime las mismas URLs y devuelve el mismo estado que la copia española con `--mostrar-urls`.

Alcance: los dos scripts remotos y sus pruebas en `tools/verify/` y `pruebas/`.

Archivos: instalar-remoto.sh, install-remote.sh

CUANDO se descarga cualquiera de las dos entradas remotas y se invoca con sus alias ENTONCES funciona sin archivos vecinos y conserva el comportamiento anterior (A5).

Aceptación:
- A5: ejecutar copias aisladas de ambos archivos con `--show-urls`/`--mostrar-urls`, `--status`/`--estado` y `--update`/`--actualizar`; usar sustitutos locales para red y estado. Comparar salida, código y efectos, comprobar errores y ausencia de red real; `./verify` pasa.

TODO:
- [x] Añadir alias ingleses a `./instalar-remoto.sh` sin alterar verificación ni URLs (A5). Comprobación: ejecutar cada par con red simulada; esperar equivalencia.
- [x] Crear `./install-remote.sh` autónomo con el mismo comportamiento, incluyendo descarga individual (A5). Comprobación: copiar solo ese archivo a un directorio vacío y ejecutar las pruebas con red simulada; esperar éxito equivalente.
- [x] Ampliar `tools/verify/install-simulation.sh` para probar ambos archivos aislados y errores (A5). Comprobación: `./verify`; esperar éxito y que una mutación aislada de un alias sea detectada.

Verificación del tramo: `./verify` — nivel 2 por falta de comprobación rápida declarada; exit 0, cubre A5.

Handoff: si se duplica el archivo autónomo, agregar una comprobación automática de sincronización que impida divergencias; no descargar archivos externos durante la prueba.

## Evidencia

- `./verify`: `ok 5e: entradas remotas aisladas, equivalencia, errores y sincronización sin red`; `VERIFY OK`, exit 0. Se probó rechazo de paquete inválido, actualización sin instalación y mutación aislada.

## Notas

- Revisión independiente: A5 cumplido; `./verify` terminó con VERIFY OK, exit 0. Veredicto: APROBADO.
