function puedeEditar(usuario, documento) {
  return documento.archivado !== true && usuario.activo === true && usuario.id === documento.propietarioId;
}

module.exports = { puedeEditar };
