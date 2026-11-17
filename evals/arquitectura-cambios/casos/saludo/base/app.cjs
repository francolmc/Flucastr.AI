const [accion, valor] = process.argv.slice(2);
if (accion === 'saludo') console.log('Hola, mundo');
else if (accion === 'version') console.log('1');
else { console.error('uso: node app.cjs <saludo|version>'); process.exitCode = 2; }
