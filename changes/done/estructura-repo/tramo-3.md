# Tramo 3 — Diseño de compatibilidad (borrador)

## Pasos

### Tramo 3 — Historia: Diseño de compatibilidad
Como mantenedor quiero conocer los contratos de rutas para planificar movimientos seguros.
Dependencias: tramo 2 revisado; `rg`, Git y entorno aislado del tramo 1.
Contratos a conservar: entradas de instalación y desinstalación, enlaces instalados, modo copia y salida de simulación.
Rutas susceptibles de cambio: ninguna de producto en este tramo; el registro queda en `cambios/estructura-repo/`.
Ejemplo concreto del resultado esperado: una referencia a `scripts/resolver.mjs` identifica el consumidor y el comando que comprueba su resolución.
Alcance: documentación y comprobaciones auxiliares en `cambios/estructura-repo/`; ningún archivo de producto ni prueba de aceptación existente.
Archivos: ninguno.
CUANDO se examine cada consumidor ENTONCES queda trazado con su estrategia y comprobación, sin mover el archivo (A3).
Aceptación A3: Cada consumidor de la matriz tiene estrategia verificable y prueba asociada; las referencias sin estrategia quedan como bloqueo y no se modifica producto.
TODO:
- [x] Resolver las pruebas previas de A3 en `cambios/estructura-repo/`: caracterizar el bootstrap remoto con fixtures sintéticos sin red según la matriz del tramo 99; comprobar las rutas documentales existentes y registrar por separado ejemplos de proyectos receptores y referencias previamente ausentes; ejecutar la autoprueba offline del medidor en aislamiento sin leer casos reales; y comprobar la omisión explícita de OpenSpec ausente. Asociar cada prueba a sus consumidores en `compatibilidad.md`, indicando cobertura y límites, y conservar el contrato de las rutas ausentes hasta poder caracterizarlas. No modificar producto ni pruebas de aceptación. Si algún contrato no puede comprobarse sin acceso no autorizado, registrar el límite y detenerse antes del movimiento afectado. Comprobación: ejecutar las pruebas auxiliares y registrar comandos, resultados y fixtures utilizados.
- [x] Registrar en `cambios/estructura-repo/compatibilidad.md` el destino, wrapper o alias y orden de migración para cada contrato de la matriz. (A3). Comprobación: revisar la matriz frente a `rg` y los puntos de entrada; esperar cobertura trazable.
- [x] Ejecutar `./verify` aislado (A3). Comprobación: esperar código 0 y resultados equivalentes a la línea base.
- [x] Ejecutar `bash ./instalar.sh --simular` aislado (A3). Comprobación: esperar código 0 y resultados equivalentes a la línea base.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además comparar simulación. Duración: medida en tramo 1.
Handoff: registrar resultados y dudas no resueltas; detenerse antes de cambiar producto si falta un consumidor o estrategia.

## Evidencia
- `$ python3 -B cambios/estructura-repo/comprobar-a3.py`
  `bootstrap remoto sintético: URLs, --estado sin escrituras, instalación, repetición y actualización; rechazos=actualizar-sin-instalacion,ref-invalida,sha-ausente,sha-invalido,tar-ausente,tar-ilegible,ruta-absoluta,ruta-parent,symlink,hardlink; árbol y versión previos idénticos; sin red`
  `autoprueba offline del medidor: 2 casos sintéticos, Codex falso, sin resultados persistentes`
  `OpenSpec: omisión explícita conservada en salida sanitizada de verify; no se abrió su árbol ausente`
  `exit 0`
- `$ python3 -B cambios/estructura-repo/comprobar-rutas-documentales.py`
  `documentos revisados: 11`
  `rutas por categoría/estado: kit-reference:missing=9, kit-reference:present=83, kit-reference:protected-not-inspected=9, kit-reference:template-reference=3, receiver-example:present=32, receiver-example:protected-not-inspected=11, receiver-example:receiver-contract=32, receiver-example:template-reference=14`
  `referencias del kit ausentes no protegidas: 9`
  `clases ausentes: documentation-contract=9`
  `exit 1` (hallazgos preexistentes, comparados con `rutas-documentales-previas.txt`; no se leen destinos)
- `$ python3 -B -` (comparación de la salida actual con la captura anonimizada previa; comprobación de existencia OpenSpec únicamente)
  `ausencias previas=9 actuales=9; conjunto idéntico=True`
  `OpenSpec presente=False; comprobación de existencia, sin listar contenido`
  `exit 0`
- `$ python3 -B -` (auditoría estática de `consumidores.md` frente a `compatibilidad.md`)
  `filas_consumidor=29 filas_con_estrategia=29 sin_estrategia=[] referencia_sin_fila=[]`
  `destino_puente_orden=29; tabla y matriz coinciden`
  `exit 0`
- `$ rg -n 'consumidores\.md:(9|10|11|12|18|19|20|21|22|23|29|30|31|32|33|34|35|36|37|38|39|40|46|47|48|49|50|51|52)' cambios/estructura-repo/compatibilidad.md >/dev/null`: código 0; las 29 filas de datos aparecen en los apartados de estrategia y destino/puente/orden.
- `$ git diff --check`: código 0.
- `compatibilidad.md` y `matrices.md` asocian los diez rechazos remotos con comparación íntegra del estado sintético; clasifican las nueve referencias faltantes como contratos documentales y acotan el bloqueo a los movimientos que dependen de ellas. OpenSpec ausente retiene solo movimientos dependientes de su contrato interno desconocido. No se afirma publicación remota ni cobertura conductual de las referencias documentales.
- `$ python3 cambios/estructura-repo/comprobar-a3.py`: evidencia inicial, ampliada más abajo con diez rechazos sintéticos preservando snapshots.
- `$ python3 -B cambios/estructura-repo/comprobar-rutas-documentales.py`: inventario inicial de 11 documentos; la comparación más abajo confirma que las nueve ausencias continúan iguales a la captura previa.
- `compatibilidad.md` y `matrices.md` registran alcance y límites; las ausencias documentales y OpenSpec retienen solo movimientos que dependan de sus contratos no caracterizados. No se movió producto.
- `bash cambios/estructura-repo/reproducir-linea-base.sh`: `Simulaciones repetibles y verify coinciden con linea-base/.`; código 0. La receta ejecutó las dos simulaciones y `./verify` dentro del aislamiento y las comparó con las salidas completas de referencia.
- `git diff --check`: código 0.
- La auditoría previa que señalaba faltantes fue sustituida por las comprobaciones registradas arriba: las diez negativas remotas sintéticas pasan y cada una preserva el snapshot previo; las 29 filas tienen estrategia con comprobación asociada, destino, puente y orden. Permanecen condicionados solo los movimientos dependientes de las nueve referencias documentales ausentes, del contrato interno OpenSpec no disponible o de pruebas ampliadas declaradas pendientes. No se inició movimiento de producto.
