# Comportamiento vigente y delta
Vigente: solo un usuario activo cuyo `id` coincide con `documento.propietarioId` puede editar.

## Delta
Los documentos archivados siempre se deniegan, incluido el caso del dueño activo. La regla del dueño activo se conserva para documentos no archivados.
