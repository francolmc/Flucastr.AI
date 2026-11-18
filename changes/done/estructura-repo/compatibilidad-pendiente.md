# Compatibilidad y restricciones descubiertas

## Paquetes remotos y rutas anteriores

`instalar-remoto.sh:verificar_tar` acepta exclusivamente entradas de archivo y directorio; rechaza enlaces simbólicos en el tar. Además, `comprobar_contenido` exige `agentes/*.md` y `skills/*/SKILL.md`, `copiar_permitidas` copia carpetas concretas, e `instalar.sh` genera lanzadores y enlaces con esas rutas. Un enlace simbólico versionado como alias de `agentes/`, `skills/` o sus archivos rompe la instalación remota; tampoco basta actualizar los consumidores del repo porque hay lanzadores y enlaces instalados previamente.

Estrategia propuesta para agentes y skills: fuente canónica en `core/`; en las rutas antiguas, archivos regulares generados de forma determinista con contenido idéntico, versionados para que el tar de GitHub sea aceptado. Añadir una comprobación que falle si difieren y documentación que impida editarlos a mano. Conservar nombres de skills, referencias relativas y permisos. Preparar primero la copia de `core/` en el paquete remoto; mantener validación de seguridad existente sin aceptar enlaces. Para cada movimiento: crear archivo canónico y conservar copia antigua byte a byte en el mismo tramo, actualizar inventario de generación y verificar instalación local y remota offline, incluidos enlaces de una instalación anterior. Si no se puede preservar una ruta o recurso con esta técnica, detener ese movimiento y registrar el caso, sin relajar `verificar_tar`.

Este uso temporal de copias generadas implica duplicación física en el repositorio y paquete, no dos fuentes editables; la comprobación de igualdad es imprescindible. No modificar las salidas de simulación ni cambiar los enlaces creados en HOME. El mismo razonamiento se aplica al contrato y recetas que se consumen por las rutas `nucleo/`; no alterar el `old/v1/` que se crea al migrar un proyecto.

## Archivo histórico y planes

La ceremonia vigente usa `cambios/hechos/` en instrucciones instaladas, por tanto no trasladar esa ruta por inferencia. Mantener `old/` intacto en su ubicación y `cambios/hechos/` accesible; `changes/HISTORY.md` puede ser un índice nuevo hacia las rutas actuales sin mover ni editar contenido. No afirmar que `changes/` contiene todos los planes activos mientras el contrato siga en español. Un traslado completo exige diseñar y validar compatibilidad para cierres futuros y enlaces históricos; dejarlo como transición explícita, no como movimiento automático.

## Evaluaciones y pruebas ignoradas

En este checkout `pruebas/comparar-openspec/` no existe; `verify` lo detecta y omite con aviso. No hay evidencia para prometer moverlo, ejecutarlo o conservar una cobertura que aquí no está. Inventariar archivos presentes **incluidos los ignorados**, excluyendo `pruebas/.temporales/`, secretos y `old/v1/registro/`; si el arnés no aparece, documentar la omisión y no generar fixtures que finjan una suite real. Las pruebas versionadas, sus recursos y los conjuntos existentes fuera de Git necesitan inventario separado; no mover directorios enteros ni cambiar el descubrimiento sin comprobar cada dependencia.

## Aislamiento

La referencia del tramo 1 requiere ocultar la ruta absoluta que consulta el escenario 9. Un HOME temporal no es suficiente. Antes de aprobar construcción hay que escribir una receta comprobable para este entorno, verificar que el montaje de `/Users` es inaccesible y que HOME y cualquier proyecto real son inaccesibles para los comandos de prueba; si no se dispone de aislamiento, detener las ejecuciones afectadas. No ejecutar `verify` ni el instalador durante este diagnóstico.
