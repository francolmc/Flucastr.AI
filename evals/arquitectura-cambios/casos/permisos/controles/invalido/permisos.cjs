function puedeEditar(usuario, documento) {
  return usuario.activo === true && usuario.id === documento.propietarioId;
}

module.exports = { puedeEditar };
