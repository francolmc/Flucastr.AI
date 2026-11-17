export function instruccionesCodex(agente, cuerpo, lineaIdentidad) {
  return `${lineaIdentidad("codex", agente)}\n\n${cuerpo.replace(/^\s+/, "")}`;
}

export function generarAgenteCodex({
  archivo,
  agente,
  cabecera,
  cuerpo,
  valorCabecera,
  fallar,
  resolverModelo,
  resolverEsfuerzo,
  esfuerzoDe,
  lineaIdentidad,
}) {
  if (valorCabecera(cabecera, "name") !== agente) {
    fallar(`el 'name' del encabezado ('${valorCabecera(cabecera, "name")}') debe coincidir con el archivo ('${agente}')`);
  }
  const descripcion = valorCabecera(cabecera, "description");
  if (!descripcion) fallar(`${archivo} no tiene 'description' en el encabezado (Codex la exige)`);
  if (/^model:/m.test(cabecera)) {
    fallar(`${archivo} no debe declarar 'model': se define en modelos.json`);
  }
  if (/^effort:/m.test(cabecera) || /^thinking:/m.test(cabecera)) {
    fallar(`${archivo} no debe declarar 'effort' ni 'thinking': el esfuerzo se define en modelos.json`);
  }

  const modelo = resolverModelo(agente, "codex");
  const esfuerzo = esfuerzoDe("codex", resolverEsfuerzo(agente));
  const lineaEsfuerzo = esfuerzo ? `model_reasoning_effort = ${JSON.stringify(esfuerzo)}\n` : "";
  return (
    `# flucastr-ai:generado - no editar; se regenera con instalar.sh\n` +
    `name = ${JSON.stringify(agente)}\n` +
    `description = ${JSON.stringify(descripcion)}\n` +
    `model = ${JSON.stringify(modelo)}\n` +
    lineaEsfuerzo +
    `developer_instructions = ${JSON.stringify(instruccionesCodex(agente, cuerpo, lineaIdentidad))}\n`
  );
}
