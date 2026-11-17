const { subtotal } = require('./subtotal.cjs');

const comando = process.argv[2];
if (comando === 'version') {
  console.log('1');
} else if (comando === 'resumen') {
  const items = [{ precio: 50, cantidad: 2 }, { precio: 25, cantidad: 1 }];
  console.log(`Total: ${0}`);
} else {
  process.exitCode = 2;
}
