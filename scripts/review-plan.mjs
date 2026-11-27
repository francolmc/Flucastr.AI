#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { checkDecisions } from '../tools/check/decisiones.mjs';

const HELP = `Uso: node scripts/review-plan.mjs <plan.md>

Lee un plan Markdown e imprime un aviso por línea y motivo. No modifica archivos.
Revisa ## Steps y sus tramos ### Segment N. Los archivos se declaran en «Files:»;
documentos Markdown y rutas de pruebas no cuentan como archivos de producto.
Los pasos deben nombrar una ruta y una comprobación (comando entre acentos graves
o «Check:»). Las pantallas se detectan con «pantalla(s):» o con los nombres
de F13: acceso, saldo inicial y resumen. Las capas explícitas son interfaz/UI/web,
API y datos/base de datos. Son heurísticas textuales, no un análisis semántico.
En historias «### Segment N — Story:» también comprueba los campos de la plantilla y
Segment verification: que cubra cada A# de su tramo, que tenga comando y level,
que level 2 solo esté en el último tramo de la historia, que level 3 solo esté en el
último tramo del plan, que level 1 no use marcas de servicio (docker, compose,
VERIFY_RAPIDO, ./verify, playwright, e2e, psql, redis, localhost) y que dos A# no
mezclen unidades (archivos de producto disjuntos en sus TODO).
Los planes antiguos sin ese encabezado mantienen las comprobaciones anteriores y
añaden una nota «nota: formato anterior» en stderr (salida 0 si no hay avisos).
Con dos o más tramos en ## Steps y sin «continuity: continuous», avisa una vez.
Falsos positivos conocidos: A# que no comparten archivo por diseño (documentación
frente a código), archivos raíz sin «/» que no se ven, «level» en prosa dentro de la
línea de verificación. Revisar un tramo suelto lo trata como último del plan.
El límite de tamaño es 8192 bytes UTF-8 por archivo de plan/tramo y el máximo son
3 tramos por plan. Una línea «Excepción de tamaño: <razón>» con razón no vacía anula
ambos avisos; sin razón, no cuenta.
Si hay decisions.md junto al plan, también revisa las decisiones citadas (IDs D-NN;
avisos «decisiones:»; formato en records.md). Sin decisions.md solo avisa si el plan cita un ID.`;

const productPath = (value) => !/\.md\b/i.test(value) && !/(^|\/)(test|tests|pruebas|spec|specs)(\/|$)/i.test(value);
const routeTokens = (text) => [...text.matchAll(/(?:^|[\s`(])((?:\.?\/?[\w@.-]+\/)+[\w@.-]*\/?)(?=$|[\s`,;)])/gm)].map((m) => m[1]);
const SERVICE_MARKERS = /docker|compose|VERIFY_RAPIDO|\.\/verify|playwright|e2e|psql|redis|localhost/i;

function analyze(source, file) {
  const lines = source.split(/\r?\n/);
  const warnings = [];
  const warn = (line, message) => warnings.push(`${file}:${line}: ${message}`);
  const hasException = lines.some((line) => /^\s*Excepción de tamaño\s*:\s*\S/i.test(line));
  if (!hasException && Buffer.byteLength(source, 'utf8') > 8192) {
    warn(1, 'el plan supera 8192 bytes; parte el cambio o declara «Excepción de tamaño: <razón>»');
  }

  const isNewStory = (line) => /^###\s+Segment\s+\d+\s+[—–-]\s*Story\s*:/i.test(line.trim());
  const storyTitle = (line) => line.match(/Story\s*:\s*(.*)$/i)?.[1].trim() ?? '';
  const hasNewFormat = lines.some(isNewStory) || lines.some((line) => /^\s*(?:WHEN\b|TODO\s*:)/i.test(line));
  const stepsHeader = lines.findIndex((line) => /^##\s+Steps\s*$/i.test(line.trim()));
  if (stepsHeader < 0) {
    if (hasNewFormat) warn(1, 'el plan nuevo no contiene ## Steps');
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
    if (/^###\s+Segment\s+\d+/i.test(lines[i].trim())) trancheHeads.push(i);
    if (isNewStory(lines[i])) storyHeads.push(i);
  }
  const hasContinuity = lines.some((line) => /^\s*continuity\s*:\s*continuous\b/i.test(line));
  const linkedTramos = new Set(lines.slice(stepsHeader + 1, stepsEnd).flatMap((line) => line.match(/tramo-\d+\.md/g) ?? []));
  const tramoCount = Math.max(trancheHeads.length, linkedTramos.size);
  if (tramoCount > 3 && !hasException) {
    warn(stepsHeader + 1, `el plan tiene ${tramoCount} tramos (máximo 3); parte el cambio o declara «Excepción de tamaño: <razón>»`);
  }
  if (tramoCount >= 2 && !hasContinuity) {
    warn((trancheHeads[0] ?? stepsHeader) + 1, `el plan tiene ${tramoCount} tramos sin «continuity: continuous»; si son de una misma historia, declárala (heurística)`);
  }
  if (trancheHeads.length) {
    for (let n = 0; n < trancheHeads.length; n++) chunks.push({ start: trancheHeads[n], end: trancheHeads[n + 1] ?? stepsEnd });
  } else chunks.push({ start: stepsHeader, end: stepsEnd });

  for (const [index, chunk] of chunks.entries()) {
    const relevant = lines.slice(chunk.start, chunk.end);
    const chunkText = relevant.join('\n');
    const chunkLine = chunk.start + 1;
    const newStory = storyHeads.includes(chunk.start);
    if (newStory) {
      const field = (pattern) => relevant.some((line) => pattern.test(line.trim()));
      const requiredFields = [
        [/^As\s+.+\bI want\b.+\bso that\b.+[.]?$/i, 'story «As … I want … so that …»'],
        [/\bDependencies\s*:/i, 'Dependencies:'],
        [/^Files\s*:/i, 'Files:'],
        [/^WHEN\s+.+\s+THEN\s+.+\bA\d+\b.*$/i, 'WHEN/THEN con A#'],
        [/^Acceptance(?:\s+A\d+)?\s*:/i, 'Acceptance:'],
        [/^Segment\s+verification\s*:/i, 'Segment verification:'],
        [/^Handoff\s*:/i, 'Handoff:'],
      ];
      for (const [pattern, label] of requiredFields) {
        if (!field(pattern)) warn(chunkLine, `historia nueva: falta ${label}`);
      }
      if (!field(/^Scope\s*:/i) && !lines.slice(0, stepsHeader).some((line) => /^##\s+Scope\s*$/i.test(line.trim()))) {
        warn(chunkLine, 'historia nueva: falta Scope:');
      }
      if (!/^\s*-\s*\[[ xX]\]/m.test(chunkText)) warn(chunkLine, 'historia nueva: falta TODO con pasos en casillas');
      const criteria = [...chunkText.matchAll(/^\s*(?:[-*]\s*)?(?:Acceptance\s+)?A(\d+)\s*:/gim)].map((match) => `A${match[1]}`);
      const behaviorCriteria = [...chunkText.matchAll(/\bWHEN\b[\s\S]*?\bTHEN\b[^\n]*?\b(A\d+)\b/gim)].map((match) => match[1]);
      const todoCriteria = [...chunkText.matchAll(/^\s*-\s*\[[ xX]\].*?\b(A\d+)\b/gim)].map((match) => match[1]);
      if (criteria.length === 0) warn(chunkLine, 'historia nueva: falta al menos un criterio A#');
      for (const criterion of behaviorCriteria) if (!criteria.includes(criterion)) warn(chunkLine, `historia nueva: ${criterion} no tiene criterio de aceptación`);
      for (const criterion of todoCriteria) if (!criteria.includes(criterion)) warn(chunkLine, `historia nueva: ${criterion} en TODO no tiene criterio de aceptación`);

      const verificationLine = relevant.find((line) => /^Segment\s+verification\s*:/i.test(line.trim()));
      if (verificationLine) {
        const at = chunk.start + relevant.indexOf(verificationLine) + 1;
        const command = verificationLine.match(/`([^`]+)`/)?.[1].trim();
        const level = verificationLine.match(/\b(?:level|nivel)\s+(\d+)\b/i)?.[1];
        const coverage = verificationLine.match(/\b(?:covers|cubre)\b(.*)$/i)?.[1] ?? '';
        const covered = (coverage.match(/\bA\d+\b/gi) ?? []).map((criterion) => criterion.toUpperCase());
        if (!command) warn(at, 'Segment verification: falta el comando entre acentos graves');
        if (level === undefined) warn(at, 'Segment verification: falta level (1, 2 o 3)');
        if (covered.length === 0) warn(at, 'Segment verification: no cubre ningún A#');
        for (const criterion of criteria) {
          if (!covered.includes(criterion)) warn(at, `historia nueva: ${criterion} no tiene Segment verification`);
        }
        if (level !== undefined) {
          const number = Number(level);
          const nextChunk = chunks[index + 1];
          const lastOfStory = !nextChunk || !storyHeads.includes(nextChunk.start) || storyTitle(lines[nextChunk.start]) !== storyTitle(lines[chunk.start]);
          const lastOfPlan = index === chunks.length - 1;
          if (number === 2 && !lastOfStory) warn(at, 'nivel 2 solo en el último tramo de la historia');
          else if (number === 3 && !lastOfPlan) warn(at, 'nivel 3 solo en el último tramo del plan');
          else if (![1, 2, 3].includes(number)) warn(at, `nivel ${level} no existe (use 1, 2 o 3)`);
          const marker = command?.match(SERVICE_MARKERS)?.[0];
          if (number === 1 && marker) warn(at, `nivel 1 con marca de servicio «${marker}»; usa un comando de host`);
        }
      }

      const filesByCriterion = new Map();
      for (const line of relevant) {
        if (!/^\s*-\s*\[[ xX]\]/.test(line)) continue;
        const work = line.split(/\bCheck\s*:/i)[0];
        const files = routeTokens(work).filter((path) => !path.endsWith('/') && productPath(path));
        for (const criterion of [...work.matchAll(/\bA(\d+)\b/g)].map((match) => `A${match[1]}`)) {
          const set = filesByCriterion.get(criterion) ?? new Set();
          for (const file of files) set.add(file);
          filesByCriterion.set(criterion, set);
        }
      }
      const withFiles = [...filesByCriterion].filter(([, set]) => set.size > 0);
      for (let i = 0; i < withFiles.length; i++) {
        for (let j = i + 1; j < withFiles.length; j++) {
          const [first, firstFiles] = withFiles[i];
          const [second, secondFiles] = withFiles[j];
          if (![...firstFiles].some((file) => secondFiles.has(file))) {
            warn(chunkLine, `historia nueva: ${first} y ${second} mezcla unidades: sus TODO tocan archivos de producto disjuntos`);
          }
        }
      }
    }
    const fileDecl = relevant.findIndex((line) => /(?:^|\s)(?:[-*]\s*)?Files\s*:/i.test(line));
    if (fileDecl >= 0) {
      const marker = relevant[fileDecl].match(/(?:^|\s)(?:[-*]\s*)?Files\s*:/i);
      let declaration = relevant[fileDecl].slice(marker.index + marker[0].length);
      for (let i = fileDecl + 1; i < relevant.length && !/^\s*(?:[-*]\s*)?(?:Result|Steps|Verification|Check)\s*:/i.test(relevant[i]) && !/^\s*-\s*\[[ xX]\]/.test(relevant[i]); i++) {
        if (/^\s{2,}\S/.test(relevant[i])) declaration += ` ${relevant[i]}`;
      }
      const paths = routeTokens(declaration);
      if (paths.some((path) => path.endsWith('/'))) warn(chunk.start + fileDecl + 1, 'Files: nombra una carpeta; declara rutas de archivo explícitas');
      const productFiles = [...new Set(paths.filter((path) => !path.endsWith('/') && productPath(path)))];
      if (productFiles.length > 3) warn(chunk.start + fileDecl + 1, `Files: declara ${productFiles.length} archivos de producto (máximo 3)`);
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
      for (let i = start + 1; i < end; i++) if (/^\s*Segment\s+verification\s*:/i.test(lines[i])) { end = i; break; }
      const step = lines.slice(start, end).join('\n');
      if (!routeTokens(step).some((path) => !path.endsWith('/'))) warn(start + 1, 'el paso no nombra una ruta de archivo');
      const commands = [...step.matchAll(/`([^`]+)`/g)].map((match) => match[1].trim());
      const hasCommand = commands.some((value) => /^(?:node|npm|pnpm|yarn|bun|deno|bash|sh|git|curl|wget|python(?:3)?|pytest|vitest|playwright|docker|make|cargo|go|tsc|eslint|prettier)\b/i.test(value)
        || /^\.\/(?:verify|scripts\/\S+|node_modules\/\.bin\/\S+)/i.test(value));
      if (!hasCommand && !/\bCheck\s*:/i.test(step)) warn(start + 1, 'el paso no indica cómo se comprueba');
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
  if (!/^\s*###\s+Segment\s+\d+\s+[—–-]\s*Story\s*:/im.test(source)) {
    console.error('nota: formato anterior; las comprobaciones de tramos verificables (Segment verification, level, mezcla de unidades) no se aplican.');
  }
  const warnings = analyze(source, file);
  const registryFile = path.join(path.dirname(file), 'decisions.md');
  const registry = await readFile(registryFile, 'utf8').catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  warnings.push(...checkDecisions(source, file, registry, registryFile));
  if (warnings.length) {
    console.log(warnings.join('\n'));
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`Error: no se pudo leer ${file}: ${error.message}`);
  process.exit(2);
}
