// Suma dos números. Juguete: sin tests a propósito.
function suma(a, b) {
  return a + b;
}

module.exports = { suma };

if (require.main === module) {
  console.log(suma(2, 3));
}
