// Validador determinista del contrato de roles: agentes, skills y modelos.json.
// validarRoles({ agentes, skills, modelos }) devuelve un arreglo de mensajes de error en español; vacío = válido.
// agentes y skills son objetos { <clave>: <texto> } (para skills, la clave es el nombre de la carpeta).
// modelos es el objeto de modelos.json ya parseado. No lanza excepciones.

import { FRASES_POR_ARCHIVO, FRASES_COORDINADOR_F21, FRASES_LECTURA_F22, FRASES_UNA_PASADA } from './frases-por-archivo.mjs';

// Las listas de frases viven en frases-por-archivo.mjs; se reexportan para quien las importa desde aquí.
export { FRASES_POR_ARCHIVO, FRASES_COORDINADOR_F21, FRASES_LECTURA_F22, FRASES_UNA_PASADA };

const ESTADOS_TAREA = ['borrador', 'aprobada', 'en curso', 'lista para revisión', 'hecha', 'bloqueada'];
const RE_BLOQUEO = /BLOQUEO: rol=<[^>]+>; motivo=<[^>]+>/;

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

  // Regla 8: descomponer-feature no prohíbe tocar BACKLOG.md (la frase «solo puedes mover la marca» va en el manifiesto).
  const descomponer = skills['descomponer-feature'] ?? '';
  if (descomponer.includes('No cambies `BACKLOG.md`')) {
    errores.push('La skill «descomponer-feature» contiene «No cambies `BACKLOG.md`», que contradice la marca «→».');
  }

  // Regla 15: el coordinador tiene exactamente los cuatro comandos Bash(...) en «tools:», sin Bash desnudo; su cuerpo fija la lista cerrada, la revisión de scripts/ y el validador de tareas; ningún otro agente tiene Bash(node scripts/ en «tools:».
  const PATRONES_BASH_COORDINADOR = [
    'Bash(node scripts/registrar.mjs)',
    'Bash(node scripts/archivar.mjs)',
    'Bash(node scripts/archivar.mjs --aplicar F*)',
    'Bash(node ~/.flucastr-ai/validar-tarea.mjs *)',
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
      errores.push(`El agente «coordinador» tiene «${bash}» en «tools:»; solo puede tener los cuatro patrones «Bash(...)» de la lista cerrada, y ningún «Bash» sin patrón.`);
    }
  }
  const cuerpoCoordinador = (agentes.coordinador ?? '').replace(/^---\n[\s\S]*?\n---/, '');
  if (!cuerpoCoordinador.includes('validar-tarea.mjs')) {
    errores.push('El agente «coordinador» debe nombrar «validar-tarea.mjs» en el cuerpo (puerta previa).');
  }
  for (const nombre of nombresAgentes.filter((n) => n !== 'coordinador')) {
    const tools = frontMatter(agentes[nombre])?.tools ?? '';
    if (tools.includes('Bash(node scripts/')) {
      errores.push(`El agente «${nombre}» no debe tener «Bash(node scripts/» en «tools:»; solo el coordinador corre scripts.`);
    }
  }

  // Regla 6 a 19 (manifiesto): cada frase de FRASES_POR_ARCHIVO debe estar en su agente o skill.
  for (const [ruta, frases] of Object.entries(FRASES_POR_ARCHIVO)) {
    const [tipo, nombre] = ruta.split('/');
    const esAgente = tipo === 'agentes';
    const texto = esAgente ? (agentes[nombre] ?? '') : (skills[nombre] ?? '');
    for (const frase of frases) {
      if (!texto.includes(frase)) {
        errores.push(esAgente
          ? `El agente «${nombre}» debe contener la frase «${frase}».`
          : `La skill «${nombre}» debe contener la frase «${frase}».`);
      }
    }
  }

  return errores;
}
