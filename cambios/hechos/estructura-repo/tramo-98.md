# Tramo 98 — Separar desinstalación global (borrador)

## Pasos

### Tramo 98 — Historia: Separar desinstalación global
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 97 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: desinstalar.sh y tools/uninstall/global.sh; pruebas y evidencias pertinentes.
Archivos: desinstalar.sh, tools/uninstall/global.sh.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A98).
Aceptación A98: Cada caso global de la matriz compara salida, código y árbol con su referencia. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [x] Extraer íntegros el bucle global y limpieza final a un archivo sourced en el mismo shell, preservando las variables, continue, trap y exit originales. (A98). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-98.md` y confirmar que solo aborda esta responsabilidad.
- [x] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-98.md` y las pruebas negativas afectadas con fixtures aislados (A98). Comprobación: Cada caso global de la matriz compara salida, código y árbol con su referencia.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A98). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: comprobación estructural con `python3` confirmó una única carga después del flujo de proyecto, el módulo de 7.797 bytes/172 líneas contiene el bucle, limpieza y `exit`; `$ bash -n desinstalar.sh tools/uninstall/global.sh && git diff --check -- desinstalar.sh tools/uninstall/global.sh`: sin salida; `exit 0`. Captura inicial: `$ bash cambios/estructura-repo/capturar-desinstalacion.sh cambios/estructura-repo/tramo-98-antes.txt && cmp cambios/estructura-repo/tramo-97-despues.txt cambios/estructura-repo/tramo-98-antes.txt && sha256sum cambios/estructura-repo/tramo-97-despues.txt cambios/estructura-repo/tramo-98-antes.txt`: ambas sumas `86a7dbc97dff2a998c9d58ea6dca234991e60a99b5b6f2a115e2e89e03b52c6d`; `exit 0`.
- Paso 2: `$ bash cambios/estructura-repo/capturar-desinstalacion.sh cambios/estructura-repo/tramo-98-despues.txt && cmp cambios/estructura-repo/tramo-98-antes.txt cambios/estructura-repo/tramo-98-despues.txt && sha256sum cambios/estructura-repo/tramo-98-antes.txt cambios/estructura-repo/tramo-98-despues.txt`: los 18 casos completos coinciden (salida, código y árboles); ambos SHA-256 `86a7dbc97dff2a998c9d58ea6dca234991e60a99b5b6f2a115e2e89e03b52c6d`; `exit 0`. `$ node --test --test-name-pattern='instalar, reinstalar y desinstalar' pruebas/permisos-v2.test.mjs`: 1/1, `fail 0`, fixtures sintéticos; `exit 0`.
- Paso 3: `$ timeout 71 bash cambios/estructura-repo/reproducir-linea-base.sh`: ejecutó `./verify` y dos simulaciones dentro de Bubblewrap; verify conserva únicamente la excepción exacta autorizada del escenario 9 y las simulaciones coinciden con la referencia y entre sí; `exit 0` en 47,7 s.
