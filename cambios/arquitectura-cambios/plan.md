---
estado: aprobado
rama: feature/piloto-arquitectura-cambios
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Piloto offline de arquitectura de cambios

## Objetivo
Preparar una comparación reproducible de tres formatos de contexto para modelos pequeños. Esta entrega comprueba los materiales y oráculos con controles sintéticos; no mide modelos ni demuestra que un formato sea mejor.

## Exploración y evaluación
[Exploración](exploracion.md) y [validación](validacion-modelos-pequenos.md) contienen fuentes, riesgos y comparación de alternativas. El arnés de OpenSpec allí descrito no está en este checkout; el medidor de `pruebas/revisor-luna/` sirve a otra evaluación. Se comparan tres formatos para no adoptar uno sin evidencia; la equivalencia semántica requiere revisión humana.

## Validación y supuestos
Se aprobó preparar el piloto offline con Luna en Codex y Haiku en Claude; la inferencia requiere presupuesto posterior. Este plan espera aprobación. Los formatos reciben las mismas reglas, tarea y base, sin igualar sus tokens. La exploración siempre existe; los tramos son opcionales.

## Alcance
Crear `evals/arquitectura-cambios/` con cuatro casos, tres presentaciones por caso, oráculos, controles, autoprueba y protocolo; enlazar desde `evals/README.md`. No modificar reglas, invocar modelos, usar credenciales, instalar dependencias ni adoptar un formato. Repeticiones y reanudación quedan para después.

## Contrato común
- Cada caso tiene `base/`, `variantes/actual/`, `variantes/fragmentada/`, `variantes/breve/` y un manifiesto. Comparten comportamiento, restricciones y base. Actual representa el flujo vigente; fragmentada usa exploración, spec vigente, delta y plan; breve integra todo en un documento. Cada paquete indica lecturas y cuándo detenerse.
- El evaluador externo recibe copia del resultado y estado (`completado` o `pausa`, con motivo) y comprueba archivos. Oráculos y controles viven fuera de los paquetes; el runner no lanza agentes.
- Los controles incluyen una solución válida y al menos un resultado inválido por caso. El caso de pausa incluye pausa válida, falso completado y modificación indebida. No son salidas reales.
- El runner descubre exactamente 4 casos por 3 variantes, verifica archivos requeridos no vacíos, ejecuta los controles, informa 12 combinaciones y hashes SHA-256 de base e instrucciones, y sale distinto de cero ante un archivo ausente o control inesperado. Solo usa Node y archivos locales; no llama red ni ejecutables de modelos.

## Casos y criterios independientes
1. `saludo`: una CLI Node existente imprime `Hola, mundo` para `saludo` y `1` para `version`. Se pide `Hola, equipo` y conservar `version`. El oráculo ejecuta ambos comandos y compara salida y código.
2. `permisos`: `puedeEditar(usuario, documento)` permite solo usuario activo dueño del documento. Se agrega negar documentos archivados, conservando la regla vigente. El oráculo comprueba dueño activo sin archivar, usuario inactivo, no dueño y documento archivado, incluido dueño activo.
3. `totales`: dos módulos conectados, un cálculo de subtotal de artículos con precio y cantidad enteros y una CLI de resumen. El primer tramo implementa `subtotal(items)` como suma de `precio * cantidad`; el segundo lo consume y muestra `Total: 125` para `[{precio:50,cantidad:2},{precio:25,cantidad:1}]`. Se conserva `version` con salida `1`. El oráculo comprueba el cálculo con ese ejemplo y lista vacía, la salida real de la CLI y `version`.
4. `contradiccion`: la especificación vigente prohíbe eliminar `registro.json` y la solicitud exige eliminarlo; no hay prioridad que resuelva el conflicto. Se debe detener con estado `pausa`, explicar el conflicto y conservar sin modificar los archivos de la base. El oráculo compara hashes de toda la base y exige pausa y motivo no vacío; el protocolo exige revisar manualmente si el motivo describe la contradicción.

## Historias y pasos

### Historia 1: casos claros y restricción vigente
Dependencias: ninguna. Rutas: casos `saludo/` y `permisos/` bajo `evals/arquitectura-cambios/casos/`. Corregir cualquier diferencia de reglas entre variantes.

- [ ] Crear bases mínimas ejecutables y manifiestos de `saludo` y `permisos`; comprobar con Node que representan el comportamiento inicial descrito.
- [ ] Crear las tres variantes de ambos casos con reglas y aceptación equivalentes; comprobar que cada paquete y manifiesto existe y no está vacío.
- [ ] Añadir controles válidos e inválidos fuera de `variantes/`; comprobar que el control inválido de saludo rompe la salida y el de permisos permite editar un archivo archivado.

Aceptación de historia: existen dos casos con sus seis paquetes, bases ejecutables y controles diferenciados; revisión humana documentada de la equivalencia de instrucciones.

### Historia 2: integración y pausa
Dependencias: contrato común. Rutas: casos `totales/` y `contradiccion/` bajo `evals/arquitectura-cambios/casos/`.

- [ ] Crear las bases y manifiestos de `totales` y `contradiccion`; comprobar que la CLI inicial de totales conserva `version` y que existe el registro protegido.
- [ ] Crear tres variantes de cada caso; comprobar reglas, aceptación, tramos y contradicción.
- [ ] Añadir controles fuera de `variantes/`: solución de integración, integración rota, pausa válida, falso completado y modificación indebida; comprobar su estructura y estados.

Aceptación de historia: los cuatro casos quedan representados con doce paquetes; revisión humana documentada de la equivalencia y del motivo de pausa de los controles.

### Historia 3: oráculos y autoprueba offline
Dependencias: historias 1 y 2. Rutas de código: `evals/arquitectura-cambios/oraculos.mjs`, `evals/arquitectura-cambios/autoprueba.mjs` y `evals/arquitectura-cambios/verify.sh`. Ejecutar código solo de controles locales; no ejecutar archivos de variantes.

- [ ] Implementar los cuatro oráculos según los criterios independientes y aplicarlos a los controles; comprobar que todos los válidos pasan y todos los inválidos fallan.
- [ ] Implementar la autoprueba de descubrimiento, contenido, hashes y controles; ejecutar `node evals/arquitectura-cambios/autoprueba.mjs` y comprobar 4 casos, 12 combinaciones y éxito.
- [ ] Comprobar en una copia temporal que quitar una variante hace fallar la autoprueba y que un control inválido presentado como válido también la hace fallar; registrar comandos y resultados sin alterar los casos originales.
- [ ] Crear `verify.sh` que ejecute la autoprueba y después `./verify`, deteniéndose si falla cualquiera; comprobarlo en la verificación final.

Aceptación de historia: la autoprueba pasa offline y las dos pruebas negativas devuelven error; no se invoca ningún modelo ni servicio.

### Historia 4: protocolo y entrega
Dependencias: historias 1 a 3. Rutas: `evals/arquitectura-cambios/README.md` y `evals/README.md`.

- [ ] Documentar ejecución offline, estructura, controles, hashes, límites y revisión humana de equivalencia; distinguir resultados sintéticos de reales.
- [ ] Documentar el protocolo futuro: aislamiento, orden equilibrado, versiones, esfuerzo, repetición, tokens/costo/tiempo, fallos, pausas y comparación por entorno. Requiere presupuesto y autorización posteriores; una corrida aislada no demuestra confiabilidad estadística.
- [ ] Enlazar el piloto desde `evals/README.md`; comprobar que los enlaces y comandos documentados funcionan.

Aceptación de historia: la autoprueba es reproducible y la documentación explica qué falta antes de inferencia real; no afirma validación con modelos.

## Verificación
`bash evals/arquitectura-cambios/verify.sh`: autoprueba del piloto y `./verify` completos deben terminar con código 0. Registrar salida relevante y las pruebas negativas; si `verify` falla, detenerse y dejar evidencia, sin debilitar pruebas existentes.

## Condiciones de parada
Detenerse ante decisiones pendientes, necesidad de credenciales o red, alteración de aceptación existente o verificación en rojo.

## Evidencia
Pendiente.

## Notas
Requiere constructor; los controles no sustituyen modelos reales.
