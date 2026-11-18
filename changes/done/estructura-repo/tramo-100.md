# Tramo 100 — Documentar excepción de tamaño del bootstrap (borrador)

## Pasos

### Tramo 100 — Historia: Documentar excepción de tamaño del bootstrap
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 99 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: instalar-remoto.sh; pruebas y evidencias pertinentes.
Archivos: sin cambios de producto.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A100).
Aceptación A100: El comando remoto aislado con una sola copia del bootstrap funciona y el documento explica por qué source externo rompería la entrada. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [x] Conservar el bootstrap autocontenido: se descarga y ejecuta como archivo individual antes de disponer del árbol tools; registrar sus líneas reales y justificar la excepción de 300 líneas. (A100). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-100.md` y confirmar que solo aborda esta responsabilidad.
- [x] Ejecutar la matriz de bootstrap registrada en `cambios/estructura-repo/tramo-99.md` y las pruebas negativas afectadas con fixtures aislados (A100). Comprobación: El comando remoto aislado con una sola copia del bootstrap funciona y el documento explica por qué source externo rompería la entrada.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A100). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- `$ wc -l instalar-remoto.sh`: `322 instalar-remoto.sh` (`exit 0`). El archivo contiene 322 líneas, 22 sobre la guía de 300; no tiene `source` ni `. <archivo>` ejecutables (`rg` solo encontró menciones de texto/comandos de otros scripts). Las líneas 1–102 definen entrada, opciones y precondiciones; 103–256 resuelven la versión, descarga, validan/extractan el paquete, preparan y consultan estado; 258–322 instalan o actualizan con rollback. Se conserva como excepción porque el URL impreso en líneas 62–66 distribuye este archivo de entrada por sí solo y sus comandos se ejecutan antes de descargar y extraer `kit/`; un `source` a `tools/` dependería de un árbol que todavía no existe. La carga de `instalar.sh` ocurre desde el kit extraído en líneas 280–283 y 312–315. Sin cambios de producto.
- Inspección de `cambios/estructura-repo/matrices.md` (sección Bootstrap remoto) y `comprobar-a3.py` confirma que el fixture copia y ejecuta `instalar-remoto.sh` como archivo individual con `FLUCASTR_ORIGEN`, sin red.
- `$ python3 -B cambios/estructura-repo/comprobar-a3.py`: `exit 0`. Bootstrap remoto sintético pasó URLs, `--estado` sin escrituras, instalación sin `core`, actualización con `core` y diez rechazos negativos; árbol y versión previos idénticos, sin red. También pasó copia remota offline del kit real (rutas `tools/` y `adapters/` conservadas; excluidas ausentes), `instalar.sh --copiar --simular`, resolución instalada desde raíz con `cwd` conflictivo y autoprueba offline de medidor (2 casos); se mantuvo la omisión explícita de OpenSpec.
- `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `exit 0` en 42.4 s. `./verify` aislado coincide salvo el mensaje exacto autorizado del escenario 9; las dos simulaciones repetibles de `bash ./instalar.sh --simular` coinciden con la línea base y entre sí. Aislamiento del tramo 1.
