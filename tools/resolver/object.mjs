export function esObjeto(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function tiene(obj, clave) {
  return Object.prototype.hasOwnProperty.call(obj, clave);
}

export function esEntero(v) {
  return Number.isSafeInteger(v) && v > 0;
}
