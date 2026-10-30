// Validador determinista del contrato de roles: agentes, skills y modelos.json.
// validarRoles({ agentes, skills, modelos }) devuelve un arreglo de mensajes de error en español; vacío = válido.
// agentes y skills son objetos { <clave>: <texto> } (para skills, la clave es el nombre de la carpeta).
// modelos es el objeto de modelos.json ya parseado. No lanza excepciones.

const ESTADOS_TAREA = ['borrador', 'aprobada', 'en curso', 'lista para revisión', 'hecha', 'bloqueada'];
const RE_BLOQUEO = /BLOQUEO: rol=<[^>]+>; motivo=<[^>]+>/;
const FRASE_STATUS = 'escribes en `STATUS.md`';

// Lee el front matter `---` y devuelve { clave: valor } (sin comillas dobles externas), o null si no hay.
function frontMatter(texto) {
  const coincide = /^---\n([\s\S]*?)\n---/.exec(String(texto).replace(/\r\n?/g, '\n'));
  if (!coincide) return null;
  const campos = {};
  for (const linea of coincide[1].split('\n')) {
    const par = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(linea);
    if (!par) continue;
    let valor = par[2].trim();
    if (valor.length >= 2 && valor.startsWith('"') && valor.endsWith('"')) valor = valor.slice(1, -1);
    campos[par[1]] = valor;
  }
  return campos;
}

export function validarRoles({ agentes = {}, skills = {}, modelos = {} } = {}) {
  const errores = [];
  const nombresAgentes = Object.keys(agentes);

  // Regla 1: front matter con name igual a la clave y description no vacía (agentes y skills).
  const verificarFrontMatter = (tipo, mapa) => {
    for (const [clave, texto] of Object.entries(mapa)) {
      const fm = frontMatter(texto);
      if (!fm) {
        errores.push(`${tipo} «${clave}» no tiene front matter «---» al inicio.`);
        continue;
      }
      if (fm.name !== clave) {
        errores.push(`${tipo} «${clave}»: el campo «name» es «${fm.name ?? ''}» y debe ser «${clave}».`);
      }
      if (!fm.description || fm.description.trim() === '') {
        errores.push(`${tipo} «${clave}» tiene «description» vacía.`);
      }
    }
  };
  verificarFrontMatter('Agente', agentes);
  verificarFrontMatter('Skill', skills);

  // Regla 2: las claves de modelos.agentes son exactamente los nombres de los agentes.
  const modelosAgentes = Object.keys(modelos?.agentes ?? {});
  const faltan = nombresAgentes.filter((n) => !modelosAgentes.includes(n));
  const sobran = modelosAgentes.filter((n) => !nombresAgentes.includes(n));
  if (faltan.length) errores.push(`modelos.json no declara en «agentes» a: ${faltan.join(', ')}.`);
  if (sobran.length) errores.push(`modelos.json declara en «agentes» algo que no es un agente: ${sobran.join(', ')}.`);

  // Regla 3: el coordinador delega en exactamente los demás agentes; ningún otro tiene Agent en «tools:».
  if (!('coordinador' in agentes)) {
    errores.push('Falta el agente «coordinador».');
  } else {
    const tools = frontMatter(agentes.coordinador)?.tools ?? '';
    const lista = /Agent\(([^)]*)\)/.exec(tools);
    if (!lista) {
      errores.push('La línea «tools:» del coordinador debe contener «Agent(…)».');
    } else {
      const declarados = lista[1].split(',').map((s) => s.trim()).filter(Boolean).sort();
      const esperados = nombresAgentes.filter((n) => n !== 'coordinador').sort();
      if (JSON.stringify(declarados) !== JSON.stringify(esperados)) {
        errores.push(`«Agent(…)» del coordinador debe listar exactamente: ${esperados.join(', ')}. Lista: ${declarados.join(', ') || 'ninguno'}.`);
      }
    }
  }
  for (const nombre of nombresAgentes.filter((n) => n !== 'coordinador')) {
    const tools = frontMatter(agentes[nombre])?.tools ?? '';
    if (/\bAgent\b/.test(tools)) {
      errores.push(`El agente «${nombre}» no debe tener «Agent» en «tools:», solo el coordinador delega.`);
    }
  }

  // Regla 4: cada skill aparece entre comillas invertidas en al menos un agente.
  for (const skill of Object.keys(skills)) {
    const mencionada = nombresAgentes.some((n) => agentes[n].includes(`\`${skill}\``));
    if (!mencionada) {
      errores.push(`La skill «${skill}» no aparece en ningún agente entre comillas invertidas.`);
    }
  }

  // Regla 5: planificador, coordinador y la skill ejecutar-tarea tienen la línea de bloqueo.
  const conBloqueo = [
    ['Agente «planificador»', agentes.planificador ?? ''],
    ['Agente «coordinador»', agentes.coordinador ?? ''],
    ['Skill «ejecutar-tarea»', skills['ejecutar-tarea'] ?? ''],
  ];
  for (const [etiqueta, texto] of conBloqueo) {
    if (!RE_BLOQUEO.test(texto)) {
      errores.push(`${etiqueta} no contiene la línea «BLOQUEO: rol=<rol>; motivo=<motivo>».`);
    }
  }

  // Regla 6: planificador y constructor declaran que no escriben en STATUS.md.
  for (const nombre of ['planificador', 'constructor']) {
    if (!(agentes[nombre] ?? '').includes(FRASE_STATUS)) {
      errores.push(`El agente «${nombre}» debe contener la frase «${FRASE_STATUS}».`);
    }
  }

  // Regla 7: la tabla del coordinador (líneas que empiezan por «|») menciona los seis estados de tarea.
  const tablaCoordinador = (agentes.coordinador ?? '')
    .split('\n')
    .filter((l) => l.startsWith('|'))
    .join('\n');
  for (const estado of ESTADOS_TAREA) {
    if (!tablaCoordinador.includes(`\`${estado}\``)) {
      errores.push(`La tabla del coordinador no menciona el estado de tarea «${estado}».`);
    }
  }

  // Regla 8: descomponer-feature permite solo mover la marca de BACKLOG.md y no la prohíbe.
  const descomponer = skills['descomponer-feature'] ?? '';
  if (!descomponer.includes('solo puedes mover la marca')) {
    errores.push('La skill «descomponer-feature» debe decir que solo puedes mover la marca en BACKLOG.md.');
  }
  if (descomponer.includes('No cambies `BACKLOG.md`')) {
    errores.push('La skill «descomponer-feature» contiene «No cambies `BACKLOG.md`», que contradice la marca «→».');
  }

  // Regla 9: el coordinador traza la rama de la feature y pide CONFIRMAR antes de cambiar de rama.
  const frasesRama = [
    'Rama: <prefijo>/Fxx-nombre',
    'CONFIRMAR: accion=git switch <rama>; motivo=<motivo>',
    'Franco confirmó `git switch <rama>`',
  ];
  for (const frase of frasesRama) {
    if (!(agentes.coordinador ?? '').includes(frase)) {
      errores.push(`El agente «coordinador» debe contener la frase «${frase}».`);
    }
  }

  // Regla 10: el coordinador indica a Franco el cierre de la rama de la feature (sin ejecutarlo).
  if (!(agentes.coordinador ?? '').includes('cierra la rama, haz el PR y despliega')) {
    errores.push('El agente «coordinador» debe contener la frase «cierra la rama, haz el PR y despliega».');
  }

  // Regla 11: REFINAR en coordinador, planificador y descomponer-feature; la skill cita refinado.md.
  const FRASE_REFINAR = 'REFINAR: feature=Fxx; preguntas=<n>';
  for (const nombre of ['coordinador', 'planificador']) {
    if (!(agentes[nombre] ?? '').includes(FRASE_REFINAR)) {
      errores.push(`El agente «${nombre}» debe contener la frase «${FRASE_REFINAR}».`);
    }
  }
  if (!descomponer.includes(FRASE_REFINAR)) {
    errores.push(`La skill «descomponer-feature» debe contener la frase «${FRASE_REFINAR}».`);
  }
  if (!descomponer.includes('features/Fxx-nombre/refinado.md')) {
    errores.push('La skill «descomponer-feature» debe citar «features/Fxx-nombre/refinado.md».');
  }

  // Regla 12: el modo yolo está descrito en coordinador, planificador y descomponer-feature.
  const FRASES_YOLO_COORDINADOR = [
    'Modo yolo: activo — alcance <…>; pedido por Franco el <fecha>; rama <…>',
    'ADVERTENCIA: rama main',
    'Modo yolo: detenido (feature Fxx requiere refinado)',
    'Modo yolo: terminado',
  ];
  const FRASE_YOLO = 'Modo yolo: activo';
  for (const frase of FRASES_YOLO_COORDINADOR) {
    if (!(agentes.coordinador ?? '').includes(frase)) {
      errores.push(`El agente «coordinador» debe contener la frase «${frase}».`);
    }
  }
  if (!(agentes.planificador ?? '').includes(FRASE_YOLO)) {
    errores.push(`El agente «planificador» debe contener la frase «${FRASE_YOLO}».`);
  }
  if (!descomponer.includes(FRASE_YOLO)) {
    errores.push(`La skill «descomponer-feature» debe contener la frase «${FRASE_YOLO}».`);
  }

  // Regla 13: el coordinador avisa del archivo sin ejecutarlo; coordinador y planificador no entran en features/completed/.
  const FRASE_APLICAR = 'node scripts/archivar.mjs --aplicar Fxx';
  const FRASE_ARCHIVO = 'features/completed/';
  if (!(agentes.coordinador ?? '').includes(FRASE_APLICAR)) {
    errores.push(`El agente «coordinador» debe contener la frase «${FRASE_APLICAR}».`);
  }
  for (const nombre of ['coordinador', 'planificador']) {
    if (!(agentes[nombre] ?? '').includes(FRASE_ARCHIVO)) {
      errores.push(`El agente «${nombre}» debe contener la frase «${FRASE_ARCHIVO}».`);
    }
  }

  // Regla 14: el coordinador deja el comando de registrar.mjs en «Espera a Franco» y no entra en registro/.
  const FRASE_REGISTRAR = 'node scripts/registrar.mjs';
  const FRASE_REGISTRO = 'registro/';
  for (const frase of [FRASE_REGISTRAR, FRASE_REGISTRO]) {
    if (!(agentes.coordinador ?? '').includes(frase)) {
      errores.push(`El agente «coordinador» debe contener la frase «${frase}».`);
    }
  }

  // Regla 15: el coordinador tiene exactamente los tres comandos Bash(...) en «tools:», sin Bash desnudo; su cuerpo fija la lista cerrada y la revisión de scripts/; ningún otro agente tiene Bash(node scripts/ en «tools:».
  const PATRONES_BASH_COORDINADOR = [
    'Bash(node scripts/registrar.mjs)',
    'Bash(node scripts/archivar.mjs)',
    'Bash(node scripts/archivar.mjs --aplicar F*)',
  ];
  const toolsCoordinador = frontMatter(agentes.coordinador ?? '')?.tools ?? '';
  const bashCoordinador = toolsCoordinador.match(/Bash(\([^)]*\))?/g) ?? [];
  for (const patron of PATRONES_BASH_COORDINADOR) {
    if (!bashCoordinador.includes(patron)) {
      errores.push(`El agente «coordinador» debe declarar «${patron}» en «tools:».`);
    }
  }
  for (const bash of bashCoordinador) {
    if (!PATRONES_BASH_COORDINADOR.includes(bash)) {
      errores.push(`El agente «coordinador» tiene «${bash}» en «tools:»; solo puede tener los tres patrones «Bash(...)» de la lista cerrada, y ningún «Bash» sin patrón.`);
    }
  }
  for (const frase of ['lista cerrada', 'pedido explícito', 'no autoriza', 'git diff scripts/']) {
    if (!(agentes.coordinador ?? '').includes(frase)) {
      errores.push(`El agente «coordinador» debe contener la frase «${frase}».`);
    }
  }
  for (const nombre of nombresAgentes.filter((n) => n !== 'coordinador')) {
    const tools = frontMatter(agentes[nombre])?.tools ?? '';
    if (tools.includes('Bash(node scripts/')) {
      errores.push(`El agente «${nombre}» no debe tener «Bash(node scripts/» en «tools:»; solo el coordinador corre scripts.`);
    }
  }

  return errores;
}
