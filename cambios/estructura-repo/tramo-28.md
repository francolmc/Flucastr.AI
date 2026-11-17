# Tramo 28 — Preparar la copia del instalador remoto (borrador)

## Pasos

### Tramo 28 — Historia: Preparar la copia del instalador remoto
Como mantenedor quiero preparar la copia del instalador remoto para conservar el funcionamiento del kit mientras se separan responsabilidades.
Dependencias: tramo 27 revisado, entorno aislado y línea base del tramo 1. Contratos: no acceder a proyectos reales, HOME real, secretos ni `pruebas/.temporales/`; conservar salida, códigos y efectos salvo excepciones aprobadas. Rutas sensibles: `scripts/resolver.mjs`, instalación remota y lanzadores existentes. Ejemplo: la resolución del modelo del agente `principal` para `codex` devuelve la misma salida que antes.
Alcance: `./instalar-remoto.sh`.
Archivos: `./instalar-remoto.sh`. Pruebas y documentos de evidencia no cuentan como archivos de producto.
CUANDO se complete este tramo ENTONCES El paquete remoto conserva módulos futuros; no cambia la política de descarga ni se accede a un HOME real. (A28).
Aceptación A28: El paquete remoto conserva módulos futuros; no cambia la política de descarga ni se accede a un HOME real. La matriz del tramo 27 y las comprobaciones pertinentes conservan códigos, salida y efectos; cualquier diferencia no autorizada detiene el avance.
TODO:
- [x] Ampliar únicamente `copiar_permitidas` en `./instalar-remoto.sh` para copiar los directorios `tools/` y `adapters/` cuando existan, conservando el resto de la lista y el comportamiento ante directorios ausentes. Añadir una prueba de integración offline que construya un archivo de descarga sintético con módulos en ambas rutas, ejercite el flujo remoto real con HOME temporal y compruebe su presencia en el kit instalado; usar los mecanismos existentes de prueba o un sustituto local de descarga, sin red. (A28). Comprobación: revisar el diff y verificar que solo contiene el alcance declarado.
- [x] Comprobar el archivo `./instalar-remoto.sh` con directorios presentes y ausentes, y que entradas no permitidas permanecen excluidas; deben pasar la prueba offline y `bash instalar.sh --copiar --simular` dentro del kit copiado. (A28). Comprobación: registrar la comparación y esperar coincidencia.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A28). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A28). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- Paso 1: `$ python3 -B cambios/estructura-repo/comprobar-a3.py`: el flujo remoto sintético existente pasó sin directorios opcionales; el flujo con el instalador real empaquetado y HOME temporal conservó `tools/future-module.sh` y `adapters/future-adapter.md`; sin red. `$ bash -n instalar-remoto.sh`: código 0. `$ git diff --check -- instalar-remoto.sh cambios/estructura-repo/comprobar-a3.py`: código 0. Revisión del diff: el único cambio de producto añade `tools adapters` al bucle de directorios de `copiar_permitidas`; no modifica descarga ni validación. Todos los comandos terminaron con `exit 0`.
- Paso 2: `$ python3 -B cambios/estructura-repo/comprobar-a3.py`: código 0. El caso sintético sin `tools/` ni `adapters/` instaló correctamente y no creó esas rutas; el caso con ambas rutas las instaló; los marcadores de `pruebas/`, `definitions/`, `features/` y `README.md` quedaron excluidos. `$ /usr/bin/bash ./home/.flucastr-ai/kit/instalar.sh --copiar --simular` dentro del Bubblewrap temporal terminó con código 0 (la comprobación se ejecuta desde el arnés y sin HOME real ni red). Salida: `copia remota del kit real: herramientas y adaptador sintéticos presentes; pruebas/, definitions/, features/ y README.md excluidos; instalar.sh --copiar --simular pasó; sin red`; `exit 0`.
- Paso 3: `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: `./verify` en Bubblewrap terminó con código 0; `verify coincide salvo el mensaje exacto autorizado del escenario 9.` La receta aislada confirmó coincidencia con `linea-base/verify.txt` fuera de esa excepción; `exit 0`.
- Paso 4: `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: `bash ./instalar.sh --simular` se ejecutó dos veces dentro de Bubblewrap; ambas simulaciones compararon con sus capturas de línea base y resultaron repetibles, código 0. `$ bash cambios/estructura-repo/ejecutar-matriz-resolver.sh`: 101 casos en dos ejecuciones, coincide con la referencia y no la modifica; SHA-256 `1d734c71e7a8335298d83d2a39a79b6d63c74c3864153c7a876f657b339cb37a`; `exit 0`.
