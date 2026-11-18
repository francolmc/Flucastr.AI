#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const HELP = `Uso: node scripts/revisar-plan.mjs <plan.md>

Lee un plan Markdown e imprime un aviso por línea y motivo. No modifica archivos.
Revisa ## Pasos y sus tramos ### Tramo N. Los archivos se declaran en «Archivos:»;
documentos Markdown y rutas de pruebas no cuentan como archivos de producto.
Los pasos deben nombrar una ruta y una comprobación (comando entre acentos graves
o «Comprobación:»). Las pantallas se detectan con «pantalla(s):» o con los nombres
de F13: acceso, saldo inicial y resumen. Las capas explícitas son interfaz/UI/web,
API y datos/base de datos. Son heurísticas textuales, no un análisis semántico.
En historias «### Tramo N — Historia:» también comprueba los campos de la plantilla.
Los planes antiguos sin ese encabezado mantienen las comprobaciones anteriores.
Con dos o más tramos en ## Pasos y sin «continuidad: continua», avisa una vez.
El límite de tamaño es 8192 bytes UTF-8 por archivo de plan/tramo.`;

const productPath = (value) => !/\.md\b/i.test(value) && !/(^|\/)(test|tests|pruebas|spec|specs)(\/|$)/i.test(value);
const routeTokens = (text) => [...text.matchAll(/(?:^|[\s`(])((?:\.?\/?[\w@.-]+\/)+[\w@.-]*\/?)(?=$|[\s`,;)])/gm)].map((m) => m[1]);

function analyze(source, file) {
  const lines = source.split(/\r?\n/);
  const warnings = [];
  const warn = (line, message) => warnings.push(`${file}:${line}: ${message}`);
  if (Buffer.byteLength(source, 'utf8') > 8192) warn(1, 'el plan supera 8192 bytes');

  const isNewStory = (line) => /^###\s+Tramo\s+\d+\s+[—–-]\s*Historia\s*:/i.test(line.trim());
  const hasNewFormat = lines.some(isNewStory) || lines.some((line) => /^\s*(?:CUANDO\b|TODO\s*:)/i.test(line));
  const stepsHeader = lines.findIndex((line) => /^##\s+Pasos\s*$/i.test(line.trim()));
  if (stepsHeader < 0) {
    if (hasNewFormat) warn(1, 'el plan nuevo no contiene ## Pasos');
    return warnings;
  }
  let stepsEnd = lines.length;
  for (let i = stepsHeader + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) { stepsEnd = i; break; }
  }
  const chunks = [];
  const trancheHeads = [];
  const storyHeads = [];
  for (let i = stepsHeader + 1; i < stepsEnd; i++) {
    if (/^###\s+Tramo\s+\d+/i.test(lines[i].trim())) trancheHeads.push(i);
    if (isNewStory(lines[i])) storyHeads.push(i);
  }
  const hasContinuity = lines.some((line) => /^\s*continuidad\s*:\s*continua\b/i.test(line));
  const linkedTramos = new Set(lines.slice(stepsHeader + 1, stepsEnd).flatMap((line) => line.match(/tramo-\d+\.md/g) ?? []));
  const tramoCount = Math.max(trancheHeads.length, linkedTramos.size);
  if (tramoCount >= 2 && !hasContinuity) {
    warn((trancheHeads[0] ?? stepsHeader) + 1, `el plan tiene ${tramoCount} tramos sin «continuidad: continua»; si son de una misma historia, declárala (heurística)`);
  }
  if (trancheHeads.length) {
    for (let n = 0; n < trancheHeads.length; n++) chunks.push({ start: trancheHeads[n], end: trancheHeads[n + 1] ?? stepsEnd });
  } else chunks.push({ start: stepsHeader, end: stepsEnd });

  for (const chunk of chunks) {
    const relevant = lines.slice(chunk.start, chunk.end);
    const chunkText = relevant.join('\n');
    const chunkLine = chunk.start + 1;
    const newStory = storyHeads.includes(chunk.start);
    if (newStory) {
      const field = (pattern) => relevant.some((line) => pattern.test(line.trim()));
      const requiredFields = [
        [/^Como\s+.+\bquiero\b.+\bpara\b.+[.]?$/i, 'historia «Como … quiero … para …»'],
        [/\bDependencias\s*:/i, 'Dependencias:'],
        [/^Archivos\s*:/i, 'Archivos:'],
        [/^CUANDO\s+.+\s+ENTONCES\s+.+\bA\d+\b.*$/i, 'CUANDO/ENTONCES con A#'],
        [/^Aceptaci[oó]n(?:\s+A\d+)?\s*:/i, 'Aceptación:'],
        [/^Verificaci[oó]n\s+del\s+tramo\s*:/i, 'Verificación del tramo:'],
        [/^Handoff\s*:/i, 'Handoff:'],
      ];
      for (const [pattern, label] of requiredFields) {
        if (!field(pattern)) warn(chunkLine, `historia nueva: falta ${label}`);
      }
      if (!field(/^Alcance\s*:/i) && !lines.slice(0, stepsHeader).some((line) => /^##\s+Alcance\s*$/i.test(line.trim()))) {
        warn(chunkLine, 'historia nueva: falta Alcance:');
      }
      if (!/^\s*-\s*\[[ xX]\]/m.test(chunkText)) warn(chunkLine, 'historia nueva: falta TODO con pasos en casillas');
      const criteria = [...chunkText.matchAll(/^\s*(?:[-*]\s*)?(?:Aceptaci[oó]n\s+)?A(\d+)\s*:/gim)].map((match) => `A${match[1]}`);
      const behaviorCriteria = [...chunkText.matchAll(/\bCUANDO\b[\s\S]*?\bENTONCES\b[^\n]*?\b(A\d+)\b/gim)].map((match) => match[1]);
      const todoCriteria = [...chunkText.matchAll(/^\s*-\s*\[[ xX]\].*?\b(A\d+)\b/gim)].map((match) => match[1]);
      if (criteria.length === 0) warn(chunkLine, 'historia nueva: falta al menos un criterio A#');
      for (const criterion of behaviorCriteria) if (!criteria.includes(criterion)) warn(chunkLine, `historia nueva: ${criterion} no tiene criterio de aceptación`);
      for (const criterion of todoCriteria) if (!criteria.includes(criterion)) warn(chunkLine, `historia nueva: ${criterion} en TODO no tiene criterio de aceptación`);
    }
    const fileDecl = relevant.findIndex((line) => /(?:^|\s)(?:[-*]\s*)?Archivos\s*:/i.test(line));
    if (fileDecl >= 0) {
      const marker = relevant[fileDecl].match(/(?:^|\s)(?:[-*]\s*)?Archivos\s*:/i);
      let declaration = relevant[fileDecl].slice(marker.index + marker[0].length);
      for (let i = fileDecl + 1; i < relevant.length && !/^\s*(?:[-*]\s*)?(?:Resultado|Pasos|Verificaci[oó]n|Comprobaci[oó]n)\s*:/i.test(relevant[i]) && !/^\s*-\s*\[[ xX]\]/.test(relevant[i]); i++) {
        if (/^\s{2,}\S/.test(relevant[i])) declaration += ` ${relevant[i]}`;
      }
      const paths = routeTokens(declaration);
      if (paths.some((path) => path.endsWith('/'))) warn(chunk.start + fileDecl + 1, 'Archivos: nombra una carpeta; declara rutas de archivo explícitas');
      const productFiles = [...new Set(paths.filter((path) => !path.endsWith('/') && productPath(path)))];
      if (productFiles.length > 3) warn(chunk.start + fileDecl + 1, `Archivos: declara ${productFiles.length} archivos de producto (máximo 3)`);
    }

    const screenNames = new Set();
    for (const match of chunkText.matchAll(/\bpantallas?\s*:\s*([^\n]+)/gi)) {
      const value = match[1].replace(/`/g, '').split(/[;.]|(?:\s+para\s+)/i)[0];
      for (const item of value.split(/[,/]|\s+\/\s+/)) {
        const screen = item.trim().toLowerCase();
        if (screen) screenNames.add(screen);
      }
    }
    for (const screen of ['acceso', 'saldo inicial', 'resumen']) {
      if (new RegExp(`\\b${screen.replace(/ /g, '\\s+')}\\b`, 'i').test(chunkText)) screenNames.add(screen);
    }
    if (screenNames.size > 1) warn(chunkLine, `el tramo cubre varias pantallas: ${[...screenNames].join(', ')}`);

    const layerText = chunkText.replace(/\b(?:interfaz|UI|web|API|datos|base\s+de\s+datos)\s+(?:fuera|excluidos?|excluidas?|no\s+incluidos?|no\s+incluidas?)\b/gi, '');
    const layerMatches = [
      ['interfaz', /\b(?:interfaz|ui|web)\b/i],
      ['API', /\bAPI\b/i],
      ['datos', /\b(?:datos|base\s+de\s+datos)\b/i],
    ];
    const layers = layerMatches.filter(([, pattern]) => pattern.test(layerText)).map(([name]) => name);
    if (layers.length > 1) warn(chunkLine, `el tramo cubre varias capas: ${layers.join(', ')}`);

    const stepIndexes = [];
    for (let i = chunk.start; i < chunk.end; i++) if (/^\s*-\s*\[[ xX]\]/.test(lines[i])) stepIndexes.push(i);
    for (let n = 0; n < stepIndexes.length; n++) {
      const start = stepIndexes[n];
      let end = stepIndexes[n + 1] ?? chunk.end;
      for (let i = start + 1; i < end; i++) if (/^###\s+/.test(lines[i])) { end = i; break; }
      for (let i = start + 1; i < end; i++) if (/^\s*Verificaci[oó]n\s+del\s+tramo\s*:/i.test(lines[i])) { end = i; break; }
      const step = lines.slice(start, end).join('\n');
      if (!routeTokens(step).some((path) => !path.endsWith('/'))) warn(start + 1, 'el paso no nombra una ruta de archivo');
      const commands = [...step.matchAll(/`([^`]+)`/g)].map((match) => match[1].trim());
      const hasCommand = commands.some((value) => /^(?:node|npm|pnpm|yarn|bun|deno|bash|sh|git|curl|wget|python(?:3)?|pytest|vitest|playwright|docker|make|cargo|go|tsc|eslint|prettier)\b/i.test(value)
        || /^\.\/(?:verify|scripts\/\S+|node_modules\/\.bin\/\S+)/i.test(value));
      if (!hasCommand && !/\bComprobaci[oó]n\s*:/i.test(step)) warn(start + 1, 'el paso no indica cómo se comprueba');
    }
  }
  return warnings;
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}
if (process.argv.length !== 3) {
  console.error('Error: indica exactamente un archivo Markdown.');
  process.exit(2);
}
const file = process.argv[2];
try {
  const source = await readFile(file, 'utf8');
  const warnings = analyze(source, file);
  if (warnings.length) {
    console.log(warnings.join('\n'));
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`Error: no se pudo leer ${file}: ${error.message}`);
  process.exit(2);
}
