// Presupuesto por feature (definitions/CONSUMO.md §3, (b)) y validación del STATUS.md compacto (§2, (a)).
// Función pura: no toca el disco ni git. Motivos en español; vacío = válido.
// validarStatusCompacto(texto) devuelve motivos; calcularPresupuesto({ feature, tareas, status, firma }) devuelve { linea, estado, causas }.
// tareas = arreglo de textos de tarea (task-*.md); status = texto de definitions/STATUS.md.
// firma (opcional, 12 hex) = resumen de la última firma rechazada. Si coincide con el «; firma=» guardado en la
// línea Presupuesto de la misma feature, estado = repetido (manda sobre excedido, aviso y ok). Con firma dada, la
// línea de salida termina en «; firma=<hex>» para que el coordinador lo guarde.

export const TOPE_STATUS = 1536;

const TOPE_ITEM = 150;
const MAX_ITEMS = 3;
const CLAVES = [
  'Escalación: ',
  'Paso actual: ',
  'Presupuesto: ',
  'Espera a Franco: ',
  'Bloqueos abiertos: ',
  'Retomar: ',
  'Actualizado: ',
];
const CON_LIMITE_ITEMS = ['Espera a Franco: ', 'Bloqueos abiertos: '];
const RE_PRESUPUESTO = /^Presupuesto: (F\d+|ninguna); rondas arq=(\d+) plan=(\d+); ampliado=(\d+)(?:; amp_arq=(\d+))?(?:; amp_plan=(\d+))?(?:; amp_k=(\d+))?(?:; firma=([0-9a-f]{12}))?$/;

function normalizar(texto) {
  return String(texto ?? '').replace(/\r\n?/g, '\n');
}

export function validarStatusCompacto(texto) {
  const motivos = [];
  const t = normalizar(texto);

  const bytes = Buffer.byteLength(t, 'utf8');
  if (bytes > TOPE_STATUS) {
    motivos.push(`El STATUS.md compacto ocupa ${bytes} B; el tope es ${TOPE_STATUS} B.`);
  }

  const lineas = t.split('\n');
  if (lineas.length > 0 && lineas[lineas.length - 1] === '') lineas.pop();

  if (lineas[0] !== '# Estado') motivos.push('La línea 1 debe ser «# Estado».');

  const cuerpo = lineas.slice(1);

  CLAVES.forEach((clave, i) => {
    const nombre = clave.replace(/: $/, '');
    const idx = cuerpo.findIndex((l) => l.startsWith(clave));
    if (idx === -1) {
      motivos.push(`Falta la línea «${nombre}».`);
      return;
    }
    if (idx !== i) motivos.push(`La línea «${nombre}» está fuera de lugar.`);

    const linea = cuerpo[idx];
    const valor = linea.slice(clave.length);
    if (valor.trim() === '') {
      motivos.push(`La línea «${nombre}» no tiene valor.`);
      return;
    }

    const items = valor.split(' | ');
    for (const item of items) {
      const largo = [...item].length;
      if (largo > TOPE_ITEM) {
        motivos.push(`Un ítem de «${nombre}» tiene ${largo} caracteres; el tope es ${TOPE_ITEM}.`);
      }
    }
    if (CON_LIMITE_ITEMS.includes(clave) && items.length > MAX_ITEMS) {
      motivos.push(`«${nombre}» tiene ${items.length} ítems; el máximo es ${MAX_ITEMS}.`);
    }
    if (clave === 'Presupuesto: ' && !RE_PRESUPUESTO.test(linea)) {
      motivos.push('La línea «Presupuesto» tiene una forma inválida.');
    }
  });

  for (const linea of cuerpo) {
    if (!CLAVES.some((c) => linea.startsWith(c))) {
      motivos.push(`Línea no esperada: «${linea.slice(0, 40)}».`);
    }
  }

  return motivos;
}

export function calcularPresupuesto({ feature, tareas = [], status = '', firma = null }) {
  const T = tareas.length;
  let E = 0;
  let I = 0;
  let K = 0;

  for (const tarea of tareas) {
    const registros = normalizar(tarea)
      .split('\n')
      .filter((l) => l.startsWith('Registro:'));
    E += registros.length;
    for (const registro of registros) {
      const m = /\bintentos=(\d+)/.exec(registro);
      if (m) I += Number(m[1]);
    }
    const ultima = registros[registros.length - 1];
    if (ultima) {
      const res = /\bresultado=([^;\s]+)/.exec(ultima);
      if (res && res[1] !== 'lista') K++;
    }
  }

  let arq = 0;
  let plan = 0;
  let ampliado = 0;
  let ampArq = 0;
  let ampPlan = 0;
  let ampK = 0;
  let firmaGuardada = null;
  const lineaPresupuesto = normalizar(status)
    .split('\n')
    .find((l) => l.startsWith('Presupuesto: '));
  const m = lineaPresupuesto && RE_PRESUPUESTO.exec(lineaPresupuesto);
  if (m && m[1] === feature) {
    arq = Number(m[2]);
    plan = Number(m[3]);
    ampliado = Number(m[4]);
    ampArq = Number(m[5] ?? 0);
    ampPlan = Number(m[6] ?? 0);
    ampK = Number(m[7] ?? 0);
    firmaGuardada = m[8] ?? null;
  }

  const topeArq = 2 + ampArq;
  const topePlan = 3 + ampPlan;
  const topeK = 2 + ampK;

  const D = E + arq + plan;
  const tope = 2 * T + 4 + ampliado + ampArq + ampPlan;

  const excedido = [];
  if (D > tope) excedido.push('D');
  if (K > topeK) excedido.push('K');
  if (arq > topeArq) excedido.push('arq');
  if (plan > topePlan) excedido.push('plan');

  let estado;
  let causas;
  if (firma && firma === firmaGuardada) {
    estado = 'repetido';
    causas = ['firma'];
  } else if (excedido.length > 0) {
    estado = 'excedido';
    causas = excedido;
  } else {
    causas = [];
    if (D * 4 >= tope * 3) causas.push('D75');
    if (K === topeK) causas.push(`K${topeK}`);
    estado = causas.length > 0 ? 'aviso' : 'ok';
  }

  const cola = causas.length > 0 ? ` ${causas.join('+')}` : '';
  const sufijoFirma = firma ? `; firma=${firma}` : '';
  const linea = `Presupuesto ${feature}: D=${D}/${tope}; E=${E}; I=${I}; K=${K}/${topeK}; rondas arq=${arq}/${topeArq} plan=${plan}/${topePlan}; estado=${estado}${cola}${sufijoFirma}`;

  return { linea, estado, causas };
}
