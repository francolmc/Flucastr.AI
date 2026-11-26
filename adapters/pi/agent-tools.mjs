// Pi no puede hacer cumplir patrones de Bash: en `tools:` cada `Bash(...)` pasa a `Bash`, una sola vez.
// Pi tampoco entiende `disallowedTools:` (clave de Claude Code): se quita de la cabecera.
// Lo demás de la cabecera queda igual.
export function bashPlano(cabeceraClaude) {
  const cabecera = cabeceraClaude.replace(/^disallowedTools:.*(\r?\n|$)/gm, "");
  return cabecera.replace(/^tools:[ \t]*(.*)$/m, (_linea, valor) => {
    const partes = [];
    let prof = 0;
    let actual = "";
    for (const ch of valor) {
      if (ch === "(") prof++;
      if (ch === ")") prof--;
      if (ch === "," && prof === 0) {
        partes.push(actual.trim());
        actual = "";
      } else {
        actual += ch;
      }
    }
    if (actual.trim()) partes.push(actual.trim());

    const salida = [];
    let hayBash = false;
    for (const p of partes) {
      if (/^Bash(\(.*\))?$/.test(p)) {
        if (hayBash) continue;
        hayBash = true;
        salida.push("Bash");
      } else {
        salida.push(p);
      }
    }
    return `tools: ${salida.join(", ")}`;
  });
}
