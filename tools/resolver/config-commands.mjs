export function fijarAgente(args, { leerAjustes, mkdirSync, dirname, writeFileSync }) {
  // Con --sobrescribir reemplaza otro agente ya fijado (lo usa --migrar) y dice cuál era.
  const [ruta, agente] = args;
  const ajustes = leerAjustes(ruta);
  if (ajustes.agent === agente) {
    console.log("ya-estaba");
  } else if (ajustes.agent && args.length === 2) {
    console.log(`omitido:${ajustes.agent}`);
  } else {
    const anterior = ajustes.agent;
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, JSON.stringify({ ...ajustes, agent: agente }, null, 2) + "\n");
    console.log(anterior ? `reemplazado:${anterior}` : "fijado");
  }
}

export function quitarAgente(args, { leerAjustes, rmSync, writeFileSync }) {
  const [ruta, agente] = args;
  const ajustes = leerAjustes(ruta);
  if (ajustes.agent !== agente) {
    console.log("omitido");
  } else {
    delete ajustes.agent;
    if (Object.keys(ajustes).length === 0) {
      rmSync(ruta);
      console.log("archivo-quitado");
    } else {
      writeFileSync(ruta, JSON.stringify(ajustes, null, 2) + "\n");
      console.log("quitado");
    }
  }
}

export function compararModelos(args, { leerJson }) {
  // Solo avisa: no escribe nada. Diferencias: version mayor en el publicado, agentes y perfiles nuevos.
  const [personal, publicado] = args;
  const propio = leerJson(personal);
  const nuevo = leerJson(publicado);
  const tiene = (obj, clave) => Object.prototype.hasOwnProperty.call(obj ?? {}, clave);
  const lineas = [];
  if (typeof propio.version === "number" && typeof nuevo.version === "number" && nuevo.version > propio.version) {
    lineas.push(`version: personal ${propio.version}, publicado ${nuevo.version}`);
  }
  for (const agente of Object.keys(nuevo.agentes ?? {})) {
    if (!tiene(propio.agentes, agente)) lineas.push(`agente nuevo: ${agente}`);
  }
  for (const perfil of Object.keys(nuevo.perfiles ?? {})) {
    if (!tiene(propio.perfiles, perfil)) lineas.push(`perfil nuevo: ${perfil}`);
  }
  // Esfuerzo por agente: avisa si el publicado lo trae y el personal no.
  for (const agente of Object.keys(nuevo.agentes ?? {})) {
    if (!tiene(nuevo.agentes[agente], "esfuerzo")) continue;
    if (!tiene(propio.agentes?.[agente] ?? {}, "esfuerzo")) lineas.push(`campo nuevo: esfuerzo (agente ${agente})`);
  }
  // Campos del modelos.json publicado que el personal no trae: compactar_en y ventanas (por perfil).
  if (tiene(nuevo, "compactar_en") && !tiene(propio, "compactar_en")) lineas.push("campo nuevo: compactar_en");
  for (const [perfil, datos] of Object.entries(nuevo.perfiles ?? {})) {
    if (!tiene(datos, "ventanas") || !tiene(propio.perfiles, perfil)) continue;
    if (!tiene(propio.perfiles[perfil], "ventanas")) lineas.push(`campo nuevo: ventanas (perfil ${perfil})`);
  }
  for (const linea of lineas) console.log(linea);
}
