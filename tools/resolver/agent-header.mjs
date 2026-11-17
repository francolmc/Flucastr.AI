// Valor de una clave de la cabecera YAML (sin comillas exteriores), o undefined si no está.
export function valorCabecera(cabecera, campo) {
  const m = cabecera.match(new RegExp(`^${campo}:\\s*(.+?)\\s*$`, "m"));
  if (!m) return undefined;
  const comillas = m[1].match(/^"(.*)"$/) ?? m[1].match(/^'(.*)'$/);
  return comillas ? comillas[1] : m[1];
}

