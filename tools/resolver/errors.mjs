export function fallar(mensaje) {
  console.error(`error: ${mensaje}`);
  process.exit(1);
}
