# Piloto de arquitectura de cambios

## Propósito y límites

Este piloto prepara cuatro tareas pequeñas para comparar tres presentaciones de contexto con modelos pequeños. No ha ejecutado modelos ni demuestra que una presentación sea mejor. Los controles son fixtures sintéticos diseñados para comprobar que los oráculos distinguen resultados correctos e incorrectos.

Los modelos propuestos para una medición posterior son Luna en Codex y Haiku en Claude. La inferencia requiere aprobación de presupuesto y autorización posteriores. No se debe interpretar la autoprueba como una evaluación de modelos.

## Ejecutar la comprobación offline

Desde la raíz del repositorio:

```sh
node evals/arquitectura-cambios/autoprueba.mjs
bash evals/arquitectura-cambios/verify.sh
```

La primera orden valida materiales, oráculos y controles locales; no ejecuta los documentos de variantes. `verify.sh` hace esa misma autoprueba y luego ejecuta `./verify`, deteniéndose si falla cualquiera.

La autoprueba exige exactamente cuatro casos y tres variantes por caso, comprueba los archivos requeridos y no vacíos, valida todos los controles y muestra hashes SHA-256 de bases e instrucciones. Acepta opcionalmente la ruta a una copia temporal del directorio del piloto para probar que detecta errores:

```sh
node evals/arquitectura-cambios/autoprueba.mjs /ruta/a/copia/arquitectura-cambios
```

El runner usa Node local y ejecuta código de los controles sintéticos de confianza. No hace solicitudes de red, no invoca modelos y nunca ejecuta código de `variantes/`. El entorno debe permitir subprocesos Node.

## Casos y presentaciones

Cada caso tiene una base, un manifiesto, controles separados y estos tres paquetes:

| Presentación | Archivos | Forma |
| --- |
| `actual` | `plan.md` y `lecturas.md` | Exploración, tamaño, alcance, aceptación y plan en el flujo habitual. |
| `fragmentada` | `exploracion.md`, `spec.md`, `plan.md`, `lecturas.md` | Exploración separada del comportamiento/delta y del plan. |
| `breve` | `cambio.md` y `lecturas.md` | Contexto integrado en un documento corto. |

Los casos son `saludo` (cambio claro con comando vecino), `permisos` (extender una regla vigente), `totales` (integración entre módulos con dos pasos dependientes) y `contradiccion` (solicitud en conflicto con una regla vigente, que exige pausa).

### Revisión humana de equivalencia

Se revisaron lado a lado las tres presentaciones de cada caso y sus manifiestos. En cada paquete están expresados el mismo comportamiento vigente, la misma solicitud, el mismo tamaño de trabajo y el mismo criterio verificable. La presentación `fragmentada` distribuye información entre documentos y `breve` la integra; la separación cambia, no la tarea ni su aceptación. En `totales`, las tres especifican el orden de cálculo e integración y los dos resultados CLI. En `contradiccion`, las tres piden pausar, explicar las dos instrucciones y conservar intacta la base. Las diferencias de redacción siguen siendo una limitación: esta revisión no demuestra que un modelo vaya a recuperar o ponderar cada dato igual.

## Controles y oráculos

Los controles viven en `casos/<id>/controles/`, con un índice en `controles.json`, fuera de los paquetes de instrucciones. Cada caso incluye una solución válida y una inválida. El de saludo conserva la salida incorrecta; el de permisos permite editar un documento archivado; el de totales rompe la conexión entre cálculo y CLI; los de contradicción incluyen falso completado y modificación de base durante una pausa.

Los oráculos en `oraculos.mjs` ejecutan los controles para comprobar salidas y códigos CLI, cuatro combinaciones de permiso y subtotal con lista de ejemplo y vacía; comparan hashes y archivos para la contradicción. El motivo de pausa debe revisarse manualmente. Los controles no son resultados de agentes. Estos oráculos no son un sandbox para código no confiable; antes de aplicarlos a resultados reales debe implementarse aislamiento.

## Protocolo para una medición futura

Antes de usar inferencia real, acordar y registrar:

1. **Autorización y costo:** presupuesto máximo, proveedor, modelos y cuentas permitidos. Usar inicialmente Luna en Codex y Haiku en Claude, registrando identificador y versión exacta disponible en cada fecha.
2. **Entorno aislado:** una copia limpia por corrida, sin acceso de escritura a bases compartidas; conservar entrada, salida y diff por separado. No reutilizar resultados de una variante como contexto de otra.
3. **Equilibrio del orden:** asignar las tres variantes de cada caso a órdenes rotados o aleatorios reproducibles. Alternar el orden entre modelos para reducir efectos de calentamiento o deriva temporal.
4. **Esfuerzo y contexto:** fijar y registrar esfuerzo, instrucciones globales, herramientas disponibles, límites de contexto/salida y cualquier configuración del agente. Mantenerlos iguales dentro de cada comparación cuando el producto lo permita.
5. **Repeticiones:** repetir cada combinación caso-variante-modelo varias veces con sesiones independientes, guardar semilla/orden cuando exista y reportar cada resultado. Una corrida aislada no estima confiabilidad estadística.
6. **Medidas:** guardar estado final, archivos, resultado del oráculo, cumplimiento de restricciones, pausas, tokens de entrada/salida, costo estimado y duración. Registrar también fallos de herramienta, timeout y ejecuciones incompletas; no contarlos como éxito.
7. **Revisión:** comparar por modelo y entorno; inspeccionar fallos y pausas manualmente. Revisar de nuevo la equivalencia semántica si se cambia cualquier texto o herramienta.

No iniciar esa medición hasta definir el presupuesto y autorizar explícitamente las llamadas a modelos. La comparación de costos y tiempos debe incluir sus límites e incertidumbre; los hashes identifican qué bases e instrucciones se midieron.
