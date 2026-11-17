# Tramo 97 — Separar desinstalación por proyecto (borrador)

## Pasos

### Tramo 97 — Historia: Separar desinstalación por proyecto
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 96 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: desinstalar.sh y tools/uninstall/project.sh; pruebas y evidencias pertinentes.
Archivos: desinstalar.sh, tools/uninstall/project.sh.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A97).
Aceptación A97: Cada caso de proyecto de la matriz compara salida, código y árbol con su referencia. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [x] Extraer íntegro el bloque de --proyecto a un archivo sourced en el mismo shell y misma posición; conservar exit, variables, orden de lectura y escritura, sin subshell ni cambios de lógica. (A97). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-97.md` y confirmar que solo aborda esta responsabilidad.
- [x] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-97.md` y las pruebas negativas afectadas con fixtures aislados (A97). Comprobación: Cada caso de proyecto de la matriz compara salida, código y árbol con su referencia.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A97). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: el diff del tramo modifica solo esta responsabilidad: extracción del bloque del flujo `--proyecto`, matriz específica y controles de aislamiento, sin tocar otros flujos de desinstalación.
- Captura de referencia previa a extracción: `$ bash -n cambios/estructura-repo/capturar-desinstalacion.sh && bash cambios/estructura-repo/capturar-desinstalacion.sh cambios/estructura-repo/tramo-97-antes.txt && cmp cambios/estructura-repo/tramo-96-captura.txt cambios/estructura-repo/tramo-97-antes.txt && sha256sum cambios/estructura-repo/tramo-97-antes.txt`: 18 casos coinciden íntegramente con tramo 96; SHA-256 `86a7dbc97dff2a998c9d58ea6dca234991e60a99b5b6f2a115e2e89e03b52c6d`, `exit 0`. `git diff --check` pasó, sin salida (`exit 0`).
- Paso 2: `$ bash cambios/estructura-repo/capturar-desinstalacion.sh cambios/estructura-repo/tramo-97-despues.txt && cmp cambios/estructura-repo/tramo-97-antes.txt cambios/estructura-repo/tramo-97-despues.txt && sha256sum cambios/estructura-repo/tramo-97-antes.txt cambios/estructura-repo/tramo-97-despues.txt`: los 18 casos (incluidos proyecto, errores negativos y árbol completo) son idénticos; ambos SHA-256 `86a7dbc97dff2a998c9d58ea6dca234991e60a99b5b6f2a115e2e89e03b52c6d`, `exit 0`. `$ node --test --test-name-pattern='instalar, reinstalar y desinstalar' pruebas/permisos-v2.test.mjs`: 1/1 pasada, `exit 0` (3.1 s); fixtures en HOME/proyecto sintéticos.
- Paso 3: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `exit 0` en 45.1 s. `./verify` coincide con la referencia salvo el mensaje exacto autorizado del escenario 9; dos ejecuciones de `bash ./instalar.sh --simular` coinciden entre sí y con la referencia. La receta ejecuta en Bubblewrap, HOME sintético y `/Users` vacío.
