# Cambio: documentos archivados

## Exploración
`base/permisos.cjs` permite editar solo al dueño activo. Se pide una nueva restricción sin relajar las reglas vigentes.

## Evaluación y decisión
El comportamiento existente es requisito. Añadir la condición de archivo como denegación explícita.

## Alcance y aceptación
Un usuario activo dueño puede editar un documento no archivado. Usuario inactivo, no dueño y cualquier documento archivado no se pueden editar, incluso si el dueño está activo.

## Plan
Lee la función, añade la condición y verifica los cuatro escenarios de aceptación.
