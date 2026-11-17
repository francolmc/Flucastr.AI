# Tramo 99 — Caracterizar bootstrap remoto (borrador)

## Pasos

Casos y capturas obligatorios: [matrices de caracterización](matrices.md).

### Tramo 99 — Historia: Caracterizar bootstrap remoto
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 98 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: instalar-remoto.sh; pruebas y evidencias pertinentes.
Archivos: sin cambios de producto.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A99).
Aceptación A99: La matriz distingue cada rechazo y comprueba el estado anterior tras fallar. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [x] Cubrir offline FLUCASTR_ORIGEN: urls, estado, instalación, actualización, sha inválido, tar ilegible, ruta absoluta, .. y enlaces; comparar mensajes, códigos, efectos y recuperación. (A99). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-99.md` y confirmar que solo aborda esta responsabilidad.
- [x] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-99.md` y las pruebas negativas afectadas con fixtures aislados (A99). Comprobación: La matriz distingue cada rechazo y comprueba el estado anterior tras fallar.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A99). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- `$ python3 -B cambios/estructura-repo/comprobar-a3.py`
  `bootstrap remoto sintético: URLs, --estado sin escrituras, instalación sin core y actualización con core; rechazos=actualizar-sin-instalacion,ref-invalida,sha-ausente,sha-invalido,tar-ausente,tar-ilegible,ruta-absoluta,ruta-parent,symlink,hardlink; árbol y versión previos idénticos; sin red`
  `exit 0`
- Inspección de la matriz `cambios/estructura-repo/matrices.md` y del helper confirmó URLs sin consulta de red, estado sin escrituras, instalación/repetición/actualización y diez rechazos; cada rechazo requiere su motivo esperado y snapshot previo idéntico.
- `$ python3 -B cambios/estructura-repo/comprobar-a3.py`
  `copia remota del kit real: tools/ y adapters/ conservados; rutas excluidas ausentes; instalar.sh --copiar --simular pasó; resolver instalado obtuvo modelo y modelo-esfuerzo desde su raíz con cwd conflictivo; sin red`
  `autoprueba offline del medidor: 2 casos sintéticos, Codex falso, sin resultados persistentes`
  `OpenSpec: omisión explícita conservada en salida sanitizada de verify; no se abrió su árbol ausente`
  `exit 0`
- Matriz A99: diez rechazos sobre HOME/origen temporales nuevos; por caso `code != 0`, mensaje esperado y snapshot íntegro/version previo idéntico. Rechazos: `actualizar-sin-instalacion`, `ref-invalida`, `sha-ausente`, `sha-invalido`, `tar-ausente`, `tar-ilegible`, `ruta-absoluta`, `ruta-parent`, `symlink`, `hardlink`.
- `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `./verify` aislado y dos simulaciones de `bash ./instalar.sh --simular`; `verify coincide salvo el mensaje exacto autorizado del escenario 9`; las simulaciones y efectos coinciden con `linea-base/`; `exit 0` (43.5 s).
- Punto de control tramo 99: sin cambios de producto; evidencia en `tramo-99.md` y `plan.md`. La matriz A99 distingue diez rechazos con código/motivo esperado y snapshot íntegro previo; línea base aislada compara `verify` y dos simulaciones, aplicando únicamente la excepción exacta aprobada del escenario 9. `git diff --check` pasa. Sin acceso a red, HOME real, proyectos reales, secretos, `old/v1/registro/` ni `pruebas/.temporales/`. Sin commit; detener para revisión.
