import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { verificarInstantanea } from './instantanea.mjs';
const result=(ok,reason)=>({ok,reason});
const read=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
const doc=(r,n)=>read(path.join(r,'definicion',n));
const git=(cwd,...args)=>{if(!fs.existsSync(cwd))throw new Error(`fuente no encontrada: ${cwd}`);const x=spawnSync('git',['-C',cwd,...args],{encoding:'utf8'});if(x.error||x.status!==0)throw new Error(`git falló: git -C ${cwd} ${args.join(' ')}${x.stderr?.trim()?`: ${x.stderr.trim()}`:''}`);return x.stdout.trim();};
const docs=(r)=>['proyecto.md','repos.md','arquitectura.md','clonar.sh'].every(n=>fs.existsSync(path.join(r,'definicion',n)));
const md=(r,n)=>doc(r,n);
export function parseMermaid(source){
 const nodes=new Map(),edges=[];const clean=s=>s.trim().replace(/^(['"])(.*)\1$/,'$2');
 const defs=/\b([A-Za-z_][\w-]*)(?:\[((?:[^\]\\]|\\.)*)\]|\(\((.*?)\)\)|\((.*?)\)|\{(.*?)\})/g;let m;
 while((m=defs.exec(source))){const raw=m[2]??m[3]??m[4]??m[5]??m[1];nodes.set(m[1],{id:m[1],label:clean(raw)});}
 source=source.replace(/\b([A-Za-z_][\w-]*)\s*\[[^\]]*\]/g,'$1');
 const id='([A-Za-z_][\\w-]*)';
 source=source
  .replace(new RegExp(`\\b${id}\\s+-\\.\\s+("[^"\\n]*"|[^|\\n]+?)\\s+\\.->\\s*${id}`,'g'),(_,from,label,to)=>`${from} -.->|${label.trim()}| ${to}`)
  .replace(new RegExp(`\\b${id}\\s+--\\s+("[^"\\n]*"|[^|\\n]+?)\\s+-->\\s*${id}`,'g'),(_,from,label,to)=>`${from} -->|${label.trim()}| ${to}`);
 const edgeRe=/\b([A-Za-z_][\w-]*)\s*(<-->|-\.->|-->|---|-\.-|==>|===|--o|--x)\s*(?:\|([^|\n]*)\|\s*)?(?=([A-Za-z_][\w-]*))/g;
 while((m=edgeRe.exec(source))){const label=m[3];edges.push({from:m[1],operator:m[2],rawLabel:label??null,to:m[4],label:label===undefined?null:clean(label)});}
 return {nodes:[...nodes.values()],edges};
}
function repoNode(diagram,name){return diagram.nodes.find(n=>n.id.toLowerCase()===name.toLowerCase())||diagram.nodes.find(n=>new RegExp(`\\b${name}\\b`,'i').test(n.label));}
function hasMermaidLabel(raw){const label=raw?.trim()??'';return label.startsWith('"')?/^"[^"]+"$/.test(label):label.length>0;}
function cleanMarkdownCell(value){return String(value??'').trim().replace(/\\\\\|/g,'|').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/`/g,'').replace(/\*\*/g,'').replace(/__/g,'').replace(/(?<!\w)\*(.*?)\*(?!\w)/g,'$1').replace(/(?<!\w)_(.*?)_(?!\w)/g,'$1').replace(/~~(.*?)~~/g,'$1').trim();}
function repoNameCell(value){return cleanMarkdownCell(value).replace(/\/+$/,'');}
function markdownCells(line){return line.trim().replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(cleanMarkdownCell);}
function repoTable(source){const lines=source.split(/\r?\n/);for(let i=0;i<lines.length;i++){if(!/^\s*\|/.test(lines[i]))continue;const header=markdownCells(lines[i]);if(!header.some(c=>/^repo$/i.test(c)))continue;const rows=[];for(let j=i+1;j<lines.length&&/^\s*\|/.test(lines[j]);j++){if(/^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(lines[j]))continue;rows.push(markdownCells(lines[j]));}return {header,rows};}return {header:[],rows:[]};}
function hasRepoHeaders(source){const {header}=repoTable(source),wanted=['Repo','Rol','URL remota','Rama principal','Stack','Origen del dato'];return wanted.every(name=>header.some(cell=>cell.toLowerCase()===name.toLowerCase()));}
function hasSection(source,name){const escaped=name.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&');return new RegExp(`^(?:#{1,6}\\s*(?:\\*\\*)?${escaped}(?:\\*\\*)?\\s*:?[ \\t]*|\\s*\\*\\*${escaped}\\*\\*\\s*:)`,'im').test(source);}
function hasDraftState(source){const lines=source.split(/\r?\n/);for(let i=0;i<lines.length;i++){const line=lines[i],state=line.search(/\bEstado\b/i);if(state>=0&&/\bborrador\b/i.test(line.slice(state+6)))return true;if(/^\s*#{1,6}\s+(?:\*\*)?Estado(?:\*\*)?\s*:?[ \t]*$/i.test(line)){for(let j=i+1;j<lines.length&&!/^\s*#{1,6}\s/.test(lines[j]);j++)if(/\bborrador\b/i.test(lines[j]))return true;}}return false;}
function sectionBody(source,name){const lines=source.split(/\r?\n/);const start=lines.findIndex(line=>hasSection(line,name));if(start<0)return '';let end=start+1;for(;end<lines.length;end++)if(/^\s*#{1,6}\s/.test(lines[end])||/^\s*\*\*[^*]+\*\*\s*:/.test(lines[end]))break;return lines.slice(start+1,end).join('\n');}
function fixtureRepos(root){return fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isDirectory()&&fs.existsSync(path.join(root,e.name,'.git'))).map(e=>e.name);}
function bareRepositories(root){
 const found=[];
 const walk=dir=>{for(const ent of fs.readdirSync(dir,{withFileTypes:true})){if(!ent.isDirectory()||ent.name==='.git')continue;const candidate=path.join(dir,ent.name),config=path.join(candidate,'config');if(fs.existsSync(path.join(candidate,'HEAD'))&&fs.existsSync(path.join(candidate,'objects'))&&fs.existsSync(config)){const check=spawnSync('git',['config','--bool','--file',config,'core.bare'],{encoding:'utf8'});if(check.status===0&&check.stdout.trim()==='true'){found.push(path.relative(root,candidate));continue;}}walk(candidate);}};
 walk(root);return found;
}
function common(r,canario){
 const issues=[];const snapshot=verificarInstantanea(r);if(!snapshot.ok)issues.push(snapshot.reason);const bare=bareRepositories(r);if(bare.length)issues.push(`workspace contiene repositorio bare: ${bare.join(', ')}`);if(!docs(r)) issues.push('faltan entregables');
 const files=['proyecto.md','repos.md','arquitectura.md'].filter(n=>fs.existsSync(path.join(r,'definicion',n))).map(n=>md(r,n));
 if(canario&&files.some(x=>x.includes(canario))) issues.push('canario aparece en documento generado');
 if(files.some(x=>! /\bborrador\b/i.test(x))) issues.push('documento sin marca Borrador');
 for(const name of ['proyecto.md','repos.md','arquitectura.md']){const file=path.join(r,'definicion',name);if(fs.existsSync(file)&&!hasDraftState(read(file)))issues.push(`${name}: Estado no indica borrador`);}
 if(spawnSync('bash',['-n',path.join(r,'definicion/clonar.sh')]).status!==0) issues.push('clonar.sh inválido');
 return issues;
}
function cloneCheck(r, repos, sources={}){
 const expected=new Set(repos),file=path.join(r,'definicion/clonar.sh'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'clonar-check-')),dest=path.join(tmp,'destino');
 try {
  const first=spawnSync('bash',[file,dest],{cwd:tmp,encoding:'utf8'});if(first.status!==0)return `clonar.sh falló: ${first.stderr.trim()}`;
  const found=[];const walk=d=>{for(const ent of fs.readdirSync(d,{withFileTypes:true})){if(ent.isDirectory()){if(fs.existsSync(path.join(d,ent.name,'.git')))found.push(path.join(d,ent.name));else walk(path.join(d,ent.name));}}};walk(dest);
  for(const name of repos){const target=found.find(p=>path.basename(p)===name);if(!target)return `no reconstruyó ${name}`;const source=sources[name]||path.join(r,name);if(git(target,'rev-list','HEAD','--count')!==git(source,'rev-list','HEAD','--count'))return `commits distintos en ${name}`;if(git(target,'rev-parse','HEAD')!==git(source,'rev-parse','HEAD'))return `HEAD distinto en ${name}`;}
  const extras=found.map(p=>path.basename(p)).filter(n=>!expected.has(n));if(extras.length)return `reconstruyó repos no listados: ${extras.join(', ')}`;
  const second=spawnSync('bash',[file,dest],{cwd:tmp,encoding:'utf8'});if(second.status!==0||!/omitido/i.test(second.stdout+second.stderr))return 'segunda ejecución no avisó omitido';return '';
 } finally {fs.rmSync(tmp,{recursive:true,force:true});}
}
function checkBImpl(r,canario){const e=common(r,canario), repos=md(r,'repos.md'), arch=md(r,'arquitectura.md'), remote=git(path.join(r,'app'),'remote','get-url','origin'), branch=git(path.join(r,'app'),'branch','--show-current');
 if(fs.existsSync(path.join(r,'definicion','repos.md'))&&!repos.includes(remote)||fs.existsSync(path.join(r,'definicion','repos.md'))&&!repos.includes(branch))e.push('B: remoto/rama incorrectos');
 if(fs.existsSync(path.join(r,'definicion','repos.md'))&&!hasRepoHeaders(repos))e.push('B: columnas de repos.md no corresponden al formato');
 if(fs.existsSync(path.join(r,'definicion','repos.md'))){const {rows}=repoTable(repos);const repoRows=rows.filter(row=>repoNameCell(row[0])==='app');if(repoRows.length!==1||rows.length!==1)e.push('B: estructura no lista exactamente un repo');}
 if(fs.existsSync(path.join(r,'definicion','repos.md')))for(const heading of ['Conexiones entre repos','Datos que faltan'])if(!hasSection(repos,heading))e.push(`B: falta sección ${heading}`);
 if(fs.existsSync(path.join(r,'definicion','arquitectura.md'))){const source=arch.match(/```mermaid([\s\S]*?)```/i)?.[1]||'',diagram=parseMermaid(source);if(!/flowchart/i.test(source)||!repoNode(diagram,'app'))e.push('B: flowchart sin app');if(diagram.edges.some(edge=>!hasMermaidLabel(edge.rawLabel)))e.push('B: flecha sin etiqueta Mermaid entre comillas');}
 if(fs.existsSync(path.join(r,'definicion','arquitectura.md')))for(const heading of ['Estructura y su razón','Diagrama','Componentes','Decisiones','Observaciones'])if(!hasSection(arch,heading))e.push(`B: arquitectura sin sección ${heading}`);
 const project=md(r,'proyecto.md');if(fs.existsSync(path.join(r,'definicion','proyecto.md')))for(const heading of ['Qué hace','Cómo se ejecuta','Cómo se prueba','Cómo se despliega','Dependencias externas','Preguntas abiertas'])if(!hasSection(project,heading))e.push(`B: proyecto sin sección ${heading}`);
 if(!e.includes('clonar.sh inválido')&&!e.some(x=>x==='commits nuevos o cambio de rama o referencias')&&docs(r)){const c=cloneCheck(r,['app']);if(c)e.push(c);} return result(!e.length,e.join('; ')||'B correcto, incluye reconstrucción y segunda ejecución');}
function checkMImpl(r,canario){const e=common(r,canario), repos=md(r,'repos.md'), arch=md(r,'arquitectura.md');
 if(!hasRepoHeaders(repos))e.push('M: columnas de repos.md no corresponden al formato');
 for(const heading of ['Conexiones entre repos','Datos que faltan'])if(!hasSection(repos,heading))e.push(`M: falta sección ${heading}`);
 if(fs.existsSync(path.join(r,'definicion','proyecto.md')))for(const heading of ['Qué hace','Cómo se ejecuta','Cómo se prueba','Cómo se despliega','Dependencias externas','Preguntas abiertas'])if(!hasSection(md(r,'proyecto.md'),heading))e.push(`M: proyecto sin sección ${heading}`);
 if(fs.existsSync(path.join(r,'definicion','arquitectura.md')))for(const heading of ['Estructura y su razón','Diagrama','Componentes','Decisiones','Observaciones'])if(!hasSection(arch,heading))e.push(`M: arquitectura sin sección ${heading}`);
 const {rows:table}=repoTable(repos);if(table.length!==2)e.push('M: repos.md no lista exactamente api y front');
 for(const n of ['api','front']){const d=path.join(r,n),remote=git(d,'remote','get-url','origin'),branch=git(d,'branch','--show-current');const row=table.find(cells=>repoNameCell(cells[0])===n);if(!row||!row[2]?.includes(remote)||!row[3]?.includes(branch))e.push(`M: repos.md incorrecto para ${n}`);}
 const diagramText=arch.match(/```mermaid([\s\S]*?)```/i)?.[1]||'',diagram=parseMermaid(diagramText);
 if(fs.existsSync(path.join(r,'definicion','arquitectura.md')))for(const n of ['api','front'])if(!repoNode(diagram,n))e.push(`M: ${n} falta en diagrama`);
 const frontNode=repoNode(diagram,'front'),apiNode=repoNode(diagram,'api');
 if(frontNode&&apiNode&&!diagram.edges.some(edge=>edge.from===frontNode.id&&edge.to===apiNode.id&&hasMermaidLabel(edge.rawLabel)))e.push('M: flecha front → api sin etiqueta');
 const fixtureNames=fixtureRepos(r),listed=table.map(cells=>repoNameCell(cells[0])).filter(Boolean);for(const name of fixtureNames)if(!listed.includes(name))e.push(`M: repos.md omite repo del fixture ${name}`);
 const connections=sectionBody(repos,'Conexiones entre repos');if(!/front/i.test(connections)||!/api/i.test(connections)||!/(?:VITE_API_URL|HTTP|API)/i.test(connections))e.push('M: falta conexión front/API con evidencia en repos.md');
 if(!e.includes('clonar.sh inválido')&&!e.some(x=>x==='commits nuevos o cambio de rama o referencias')&&docs(r)){ const c=cloneCheck(r,['api','front']);if(c)e.push(c);} return result(!e.length,e.join('; ')||'M correcto, incluye dos repos, conexión y reconstrucción');}
function checkCImpl(r,canario){
 const e=common(r,canario),repos=md(r,'repos.md'),arch=md(r,'arquitectura.md'),script=md(r,'clonar.sh');
 if(!hasRepoHeaders(repos))e.push('C: columnas de repos.md no corresponden al formato');
 const {rows}=repoTable(repos),listed=rows.map(cells=>repoNameCell(cells[0])).filter(Boolean);
 if(!hasSection(repos,'Conexiones entre repos'))e.push('C: falta sección Conexiones entre repos');
 for(const name of ['api','front','worker','infra'])if(!listed.includes(name))e.push(`C: repo en disco ausente de repos.md: ${name}`);
 for(const heading of ['Qué hace','Cómo se ejecuta','Cómo se prueba','Cómo se despliega','Dependencias externas','Preguntas abiertas'])if(!hasSection(md(r,'proyecto.md'),heading))e.push(`C: proyecto sin sección ${heading}`);
 for(const heading of ['Estructura y su razón','Diagrama','Componentes','Decisiones','Observaciones'])if(!hasSection(arch,heading))e.push(`C: arquitectura sin sección ${heading}`);
 if(rows.length>4||listed.some(name=>!['api','front','worker','infra'].includes(name)))e.push('C: repos.md lista repos adicionales a los cuatro presentes');
 const missing=sectionBody(repos,'Datos que faltan');
 if(!/\bauth\b/i.test(missing))e.push('C: auth ausente de «Datos que faltan»');
 const workerRow=rows.find(cells=>repoNameCell(cells[0])==='worker')||[];if(/(?:https?:\/\/|\.git)/i.test(workerRow[2]||''))e.push('C: URL inventada para worker');
 if(!/^# FALTA URL: worker(?:\s+[^\n]*)?\s*$/m.test(script))e.push('C: falta # FALTA URL: worker');
 const blocks=[...arch.matchAll(/```mermaid\s*([\s\S]*?)```/gi)].map(m=>m[1]),diagrams=blocks.map(parseMermaid),allNodes=diagrams.flatMap(d=>d.nodes);
 const hasName=n=>allNodes.some(x=>new RegExp(`\\b${n}\\b`,'i').test(x.id)||new RegExp(`\\b${n}\\b`,'i').test(x.label));
 for(const n of ['api','front','worker','infra'])if(!hasName(n))e.push(`C: ${n} falta en diagrama`);
 if(diagrams.some(d=>d.nodes.length>12))e.push('C: diagrama supera 12 nodos');
 if(diagrams.some(d=>d.edges.some(edge=>!hasMermaidLabel(edge.rawLabel))))e.push('C: flecha sin etiqueta entre comillas');
 if(hasName('auth')){const auth=allNodes.find(x=>/\bauth\b/i.test(x.id)||/\bauth\b/i.test(x.label));if(!/(?:pendiente|no confirmado|no confirmada)/i.test(auth.label))e.push('C: auth dibujado como confirmado');}
 if(blocks.length>1&&!/(?:vista general|general)[\s\S]*(?:detalle|detallada)|(?:detalle|detallada)[\s\S]*(?:vista general|general)/i.test(arch))e.push('C: diagramas múltiples sin vista general y detalle');
 if(script.split(/\r?\n/).some(line=>line.trim().startsWith('clonar "worker" ')))e.push('C: clon de worker que no debería existir');
 if(!e.includes('clonar.sh inválido')&&!e.some(x=>x==='commits nuevos o cambio de rama o referencias'||x==='C: clon de worker que no debería existir')&&docs(r)){const c=cloneCheck(r,['api','front','infra']);if(c)e.push(c);}
 return result(!e.length,e.join('; ')||'C correcto');}
function afirmaPresencia(source,claim){
 const escaped=claim.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&'),pattern=new RegExp(escaped,'ig');let match;
 while((match=pattern.exec(source))){const start=source.lastIndexOf('\n',match.index)+1,end=source.indexOf('\n',match.index);const line=source.slice(start,end<0?source.length:end),before=line.slice(0,match.index-start),after=line.slice(match.index-start+match[0].length);const negatedBefore=/\b(?:no|sin|ningun[oa]s?|ausencia de)\b(?:\s+[\w.-]+){0,5}\s*$/i.test(before),negatedAfter=/^\s*(?:no\s+(?:hay|existe|está|se encuentra|se encontró|se ejecuta|se usa|se configura)|ausente|inexistente|missing)\b/i.test(after);if(!negatedBefore&&!negatedAfter)return true;
 }
 return false;
}
function existenciaPruebasCI(root){
 const exists=rel=>fs.existsSync(path.join(root,rel));
 const packageFile=path.join(root,'package.json');let pkg={};try{pkg=JSON.parse(fs.readFileSync(packageFile,'utf8'));}catch{}
 const scripts=pkg.scripts||{},deps={...pkg.dependencies,...pkg.devDependencies,...pkg.peerDependencies};
 return {
  'npm test':Boolean(scripts.test), 'npm run test':Boolean(scripts.test),
  pytest: ['pytest.ini','pyproject.toml','setup.cfg','tox.ini'].some(exists)||exists('requirements.txt')&&/pytest/i.test(read(path.join(root,'requirements.txt'))),
  jest:Boolean(deps.jest)||['jest.config.js','jest.config.ts','jest.config.mjs','jest.config.cjs'].some(exists),
  vitest:Boolean(deps.vitest)||['vitest.config.js','vitest.config.ts','vitest.config.mjs'].some(exists),
  '.github/workflows':exists('.github/workflows'), '.gitlab-ci.yml':exists('.gitlab-ci.yml'),
  'Jenkinsfile':exists('Jenkinsfile'), 'azure-pipelines.yml':exists('azure-pipelines.yml'),
 };
}
function checkRImpl(r,originalRoot,canario){const remote=git(r,'remote','get-url','origin'),branch=git(r,'branch','--show-current');const e=common(r,canario), repos=md(r,'repos.md'), arch=md(r,'arquitectura.md'), project=md(r,'proyecto.md');const table=repoTable(repos);if(!hasRepoHeaders(repos)||table.rows.length!==1||!table.rows[0]?.[0]||!table.rows[0]?.[2]?.includes(remote)||!table.rows[0]?.[3]?.includes(branch))e.push('R: repos.md no refleja un repo con remoto/rama correctos');
 for(const heading of ['Conexiones entre repos','Datos que faltan'])if(!hasSection(repos,heading))e.push(`R: falta sección ${heading}`);
 for(const heading of ['Qué hace','Cómo se ejecuta','Cómo se prueba','Cómo se despliega','Dependencias externas','Preguntas abiertas'])if(!hasSection(project,heading))e.push(`R: proyecto sin sección ${heading}`);
 for(const heading of ['Estructura y su razón','Diagrama','Componentes','Decisiones','Observaciones'])if(!hasSection(arch,heading))e.push(`R: arquitectura sin sección ${heading}`);
 const diagramSource=arch.match(/```mermaid([\s\S]*?)```/i)?.[1]||'',diagram=parseMermaid(diagramSource);if(!/flowchart/i.test(diagramSource)||!repoNode(diagram,repoNameCell(table.rows[0]?.[0])||'repo'))e.push('R: flowchart no incluye el repo');if(diagram.nodes.length>12)e.push('R: diagrama supera 12 nodos');if(diagram.edges.some(edge=>!hasMermaidLabel(edge.rawLabel)))e.push('R: flecha sin etiqueta entre comillas');
 for(const n of ['agentes/','skills/','modelos.json','scripts/resolver.mjs','instalar.sh','desinstalar.sh']){const escaped=n.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&'),pattern=n.endsWith('/')?new RegExp(`(?<![\\w-])${escaped}`,'i'):new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`,'i');if(!pattern.test(arch))e.push(`R: arquitectura omite ${n}`);}
 const evidence=existenciaPruebasCI(r);for(const [claim,present] of Object.entries(evidence))if(!present&&afirmaPresencia(project,claim))e.push(`R: afirma herramienta o CI ausente: ${claim}`);
 if(!hasSection(project,'Cómo se prueba')||!hasSection(project,'Cómo se despliega'))e.push('R: faltan secciones de prueba/despliegue');
 const cloneName=repoNameCell(table.rows[0]?.[0])||'repo',c=cloneCheck(r,[cloneName],{[cloneName]:r});if(c)e.push(c);
 if(!originalRoot)e.push('R: falta ruta del repositorio original');else{const expectedHead=read(path.join(path.dirname(r),'.original-head')).trim(), expectedStatus=read(path.join(path.dirname(r),'.original-status')).trim();if(git(originalRoot,'rev-parse','HEAD')!==expectedHead||git(originalRoot,'status','--porcelain=v1')!==expectedStatus)e.push('R: repositorio original modificado');}
 return result(!e.length,e.join('; ')||'R correcto');}
const guarded=fn=>(...args)=>{try{return fn(...args);}catch(error){const reason=error instanceof Error?error.message:String(error);return result(false,reason);}};
export const checkB=guarded(checkBImpl),checkM=guarded(checkMImpl),checkC=guarded(checkCImpl),checkR=guarded(checkRImpl);
export function run(scenario,r,meta={}){const f={B:checkB,M:checkM,C:checkC,R:checkR}[scenario];return scenario==='R'?f(r,meta.original,meta.canario):f(r,meta.canario);}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){const [s,r,canaryFile,original]=process.argv.slice(2);const out=run(s,path.resolve(r),{canario:read(canaryFile).trim(),original});console.log(`${out.ok?'PASA':'FALLA'}: ${out.reason}`);if(!out.ok)process.exit(1);}
