// Revisión textual de decisiones citadas en un plan contra su registro decisions.md.
// Formato en core/skills/plan-change/references/records.md. Función pura: recibe textos
// y devuelve avisos «<archivo>:<línea>: decisiones: <mensaje>». Solo avisa; no interpreta prosa.
import path from 'node:path';

const HEADER = ['ID', 'Decision', 'Reason', 'Date', 'Status'];
const SKIPPED_SECTIONS = new Set(['Exploration', 'Notes', 'Evidence']);
const DECISION_SECTIONS = new Set(['Decisions already taken', 'Decisions']);
const EXEMPT_BULLET = /^(?:Executor\s*:|None\b|Ninguna\b)/i;

// Vacía cercas y código en línea sin cambiar el número de líneas ni las columnas.
function maskCode(lines) {
  let fenced = false;
  return lines.map((line) => {
    if (/^\s*(?:```|~~~)/.test(line)) {
      fenced = !fenced;
      return '';
    }
    if (fenced) return '';
    return line.replace(/`[^`]*`/g, (span) => ' '.repeat(span.length));
  });
}

// Separa celdas de una fila «| a | b |»; «\|» es un pipe literal.
function splitRow(line) {
  let body = line.trim();
  if (body.startsWith('|')) body = body.slice(1);
  if (body.endsWith('|') && !body.endsWith('\\|')) body = body.slice(0, -1);
  return body.split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, '|').trim());
}

const isSeparator = (line) => /^\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?$/.test(line.trim());
const normalize = (text) => text.replace(/\\\|/g, '|').replace(/\s+/g, ' ').trim().replace(/\.$/, '').toLowerCase();

function parseRegistry(text, file) {
  const warnings = [];
  const warn = (line, message) => warnings.push(`${file}:${line}: decisiones: ${message}`);
  const rows = [];
  let hasHeader = false;
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line.startsWith('|') || isSeparator(line)) return;
    const cells = splitRow(line);
    if (!hasHeader && cells.join(' | ') === HEADER.join(' | ')) {
      hasHeader = true;
      return;
    }
    rows.push({ line: index + 1, cells });
  });
  if (!hasHeader) warn(1, `falta el encabezado ${HEADER.join(' | ')}`);

  const table = new Map();
  for (const { line, cells } of rows) {
    if (cells.length !== HEADER.length) {
      warn(line, `fila con ${cells.length} celdas (se esperan ${HEADER.length})`);
      continue;
    }
    const [id, decision, , date, status] = cells;
    if (!/^D-\d{2,}$/.test(id)) {
      warn(line, `ID no válido «${id}» (se espera D-NN)`);
      continue;
    }
    if (table.has(id)) {
      warn(line, `ID repetido ${id}`);
      continue;
    }
    if (cells.includes('')) warn(line, `${id} tiene una celda vacía`);
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) warn(line, `fecha no válida en ${id} (se espera YYYY-MM-DD)`);
    const superseded = status.startsWith('superseded by');
    const replacement = status.match(/^superseded by (D-\d{2,})$/)?.[1] ?? null;
    if (status && !superseded && status !== 'active' && status !== 'revoked') {
      warn(line, `estado no válido en ${id}: «${status}»`);
    }
    if (superseded && !replacement) warn(line, `${id} superseded sin reemplazo válido (se espera superseded by D-NN)`);
    if (replacement === id) warn(line, `${id} no puede reemplazarse a sí mismo`);
    table.set(id, { line, decision, status, replacement });
  }
  for (const [id, entry] of table) {
    if (entry.replacement && entry.replacement !== id && !table.has(entry.replacement)) {
      warn(entry.line, `reemplazo ${entry.replacement} de ${id} no existe`);
    }
  }
  return { warnings, table };
}

// registryText null significa que no hay registro: solo avisa si el plan cita un ID.
export function checkDecisions(planText, planFile, registryText, registryFile) {
  const registryName = path.basename(registryFile);
  const rawLines = planText.split(/\r?\n/);
  const lines = maskCode(rawLines);

  if (registryText === null || registryText === undefined) {
    const index = lines.findIndex((line) => /\bD-\d{2,}\b/.test(line));
    if (index < 0) return [];
    const id = lines[index].match(/\bD-\d{2,}\b/)[0];
    return [`${planFile}:${index + 1}: decisiones: cita ${id} pero no existe ${registryName} junto al plan`];
  }

  const { warnings, table } = parseRegistry(registryText, registryFile);
  const warn = (line, message) => warnings.push(`${planFile}:${line}: decisiones: ${message}`);
  let section = '';
  lines.forEach((text, index) => {
    const heading = text.match(/^##\s+(.*?)\s*$/);
    if (heading) section = heading[1];
    const line = index + 1;
    const ids = [...new Set(text.match(/\bD-\d{2,}\b/g) ?? [])];

    for (const id of ids) {
      const entry = table.get(id);
      if (!entry) {
        warn(line, `${id} no existe en ${registryName}`);
        continue;
      }
      if (SKIPPED_SECTIONS.has(section)) continue;
      if (entry.status === 'revoked') warn(line, `${id} está revocada`);
      else if (entry.replacement && !ids.includes(entry.replacement)) {
        warn(line, `${id} está superada por ${entry.replacement}; cítala junto con ${entry.replacement} en la misma línea`);
      }
    }

    if (/\bResuelto\s*:/.test(text)) {
      if (ids.length === 0) warn(line, 'Resuelto: sin ID de decisión');
    } else if (DECISION_SECTIONS.has(section) && /^-\s/.test(text)) {
      const body = text.replace(/^-\s+/, '').trim();
      if (ids.length === 0 && !EXEMPT_BULLET.test(body)) warn(line, `viñeta sin ID en «## ${section}»`);
      const match = rawLines[index].match(/^-\s+(D-\d{2,})\s*(?::|—|–|=)\s*(.+)$/);
      const entry = match && table.get(match[1]);
      if (entry && normalize(match[2]) !== normalize(entry.decision)) {
        warn(line, `${match[1]} no coincide con su texto en ${registryName}`);
      }
    }
  });
  return warnings;
}
