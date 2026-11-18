# Tramo 12 — Datos de ejemplo del observador

## Pasos

### Tramo 12 — Historia: datos de ejemplo anónimos

Como persona que prueba el observador quiero ejemplos anónimos y coherentes que sigan produciendo informes válidos para que el kit sea reutilizable.

Dependencias: Tramo 7, para conservar el recorrido de ambos nombres de la herramienta; tramos 9 y 10, para reutilizar seudónimos.

Contratos a conservar: campos JSONL, tipos, registros, fechas, duraciones y relaciones entre archivos; informe con los mismos agregados; rutas y comandos públicos.

Rutas susceptibles de cambio: los tres archivos de datos conservan sus rutas; las pruebas afectadas mantienen su ubicación.

Ejemplo concreto del resultado esperado: cambiar el nombre de ejemplo de un proyecto en eventos y muestras conserva su relación y el total del informe.

Alcance: los tres archivos listados y pruebas del observador afectadas.

Archivos: scripts/fixtures-observador/datos/LEEME.txt, scripts/fixtures-observador/datos/eventos.jsonl, scripts/fixtures-observador/datos/muestras.jsonl

CUANDO se genera un informe sobre los datos de ejemplo ENTONCES no aparecen referencias identificativas y los agregados y relaciones siguen siendo correctos (A12).

Aceptación:
- A12: verificar que cada línea JSONL se procesa, que hay casos no vacíos y que el informe conserva totales y relaciones antes y después; `./verify` pasa.

TODO:
- [x] Anonimizar `scripts/fixtures-observador/datos/LEEME.txt` (A12). Comprobación: revisar texto y rutas; esperar instrucciones válidas sin nombres personales.
- [x] Anonimizar `scripts/fixtures-observador/datos/eventos.jsonl` (A12). Comprobación: procesar cada línea y comparar campos y totales; esperar datos válidos y seudónimos coherentes.
- [x] Anonimizar `scripts/fixtures-observador/datos/muestras.jsonl` (A12). Comprobación: procesar cada línea y comparar relaciones y totales; esperar datos válidos y seudónimos coherentes.
- [x] Adaptar expectativas en `tools/verify/docker-observer.sh` (A12). Comprobación: ejecutar `./verify`; esperar el mismo informe agregado y casos no vacíos.

Verificación del tramo: `./verify` — nivel 2 por falta de comprobación rápida declarada; exit 0, cubre A12.

Handoff: conservar numéricos y timestamps; dejar evidencia de comparación de agregados, no solo de JSON válido.

## Evidencia

- Se procesaron 7 eventos y 8 muestras JSONL, comparando todos sus campos con los originales tras aplicar los mismos seudónimos. El informe completo anterior y posterior coincide tras sustituir los nombres; builds, OOM y solape son no vacíos.
- `tools/verify/docker-observer.sh` toma la salida esperada de `LEEME.txt`; la actualización del fixture adapta automáticamente la expectativa, sin editar el script.
- `./verify`: exit 0, `VERIFY OK`; informe coincide con la salida esperada y la prueba negativa de OOM pasa.

## Notas

- Punto de control: tres archivos de datos actualizados con `proyecto-a` y `proyecto-b`; informe y relaciones preservados. Expectativa del verificador enlazada al LEEME. Pendiente revisión independiente en contexto nuevo.
