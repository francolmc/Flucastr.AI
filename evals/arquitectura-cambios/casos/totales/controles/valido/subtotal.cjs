function subtotal(items) {
  return items.reduce((s, item) => s + item.precio * item.cantidad, 0);
}

module.exports = { subtotal };
