# Denegar edición de documentos archivados
## Exploración
`base/permisos.cjs` permite editar solo al dueño activo. La solicitud añade una restricción.
## Comportamiento vigente y delta
Se conserva que solo el dueño activo edita. Se agrega que un documento con `archivado === true` siempre se deniega, también al dueño activo.
## Tamaño, alcance y plan
Cambio claro sin tramos. Añade la condición sin cambiar otras reglas. Acepta dueño activo/no archivado; deniega usuario inactivo, no dueño y documento archivado (incluido dueño activo).
