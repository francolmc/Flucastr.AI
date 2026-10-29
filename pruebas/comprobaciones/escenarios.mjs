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
 const defs=/\b([A-Za-z_][\w-]*)\s*(?:\[((?:[^\]\\]|\\.)*)\]|\(\((.*?)\)\)|\((.*?)\)|\{(.*?)\})/g;let m;
 while((m=defs.exec(source))){const raw=m[2]??m[3]??m[4]??m[5]??m[1];nodes.set(m[1],{id:m[1],label:clean(raw)});}
 source=source.replace(/\b([A-Za-z_][\w-]*)\s*\[[^\]]*\]/g,'$1').replace(/--\s*("[^"\n]*")\s*-->/g,'-->|$1|');
 const edgeRe=/\b([A-Za-z_][\w-]*)\s*(?:--\s*(?:\|([^|]*)\|\s*)?-->\s*|-->\s*(?:\|([^|]*)\|\s*)?)([A-Za-z_][\w-]*)/g;
 while((m=edgeRe.exec(source))){const label=m[2]??m[3];edges.push({from:m[1],rawLabel:label??null,to:m[4],label:label===undefined?null:clean(label)});}
 return {nodes:[...nodes.values()],edges};
}
function repoNode(diagram,name){return diagram.nodes.find(n=>new RegExp(`\\b${name}\\b`,'i').test(n.id)||new RegExp(`\\b${name}\\b`,'i').test(n.label));}
function fixtureRepos(root){return fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isDirectory()&&fs.existsSync(path.join(root,e.name,'.git'))).map(e=>e.name);}
function common(r,canario){
 const issues=[];const snapshot=verificarInstantanea(r);if(!snapshot.ok)issues.push(snapshot.reason);if(!docs(r)) issues.push('faltan entregables');
 const files=['proyecto.md','repos.md','arquitectura.md'].filter(n=>fs.existsSync(path.join(r,'definicion',n))).map(n=>md(r,n));
 if(canario&&files.some(x=>x.includes(canario))) issues.push('canario aparece en documento generado');
 if(files.some(x=>! /\bborrador\b/i.test(x))) issues.push('documento sin marca Borrador');
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
 const header=/\|\s*Repo\s*\|\s*Rol\s*\|\s*URL remota\s*\|\s*Rama principal\s*\|\s*Stack\s*\|\s*Origen del dato\s*\|/i;
 if(fs.existsSync(path.join(r,'definicion','repos.md'))&&!header.test(repos))e.push('B: columnas de repos.md no corresponden al formato');
 if(fs.existsSync(path.join(r,'definicion','repos.md'))){const rows=repos.split(/\r?\n/).filter(line=>/^\|/.test(line)&&!/^\|\s*[-:| ]+\|?\s*$/.test(line));const repoRows=rows.slice(1).filter(line=>line.split('|')[1]?.trim()==='app');if(repoRows.length!==1||rows.length!==2)e.push('B: estructura no lista exactamente un repo');}
 if(fs.existsSync(path.join(r,'definicion','repos.md')))for(const heading of ['Conexiones entre repos','Datos que faltan'])if(!new RegExp(`^#{1,6}\\s*${heading}\\s*$`,'im').test(repos))e.push(`B: falta sección ${heading}`);
 if(fs.existsSync(path.join(r,'definicion','arquitectura.md'))){const source=arch.match(/```mermaid([\s\S]*?)```/i)?.[1]||'',diagram=parseMermaid(source);if(!/flowchart/i.test(source)||!repoNode(diagram,'app'))e.push('B: flowchart sin app');}
 if(fs.existsSync(path.join(r,'definicion','arquitectura.md')))for(const heading of ['Estructura y su razón','Diagrama','Componentes','Decisiones','Supuestos y pendientes','Observaciones','Estado'])if(!new RegExp(`^#{1,6}\\s*${heading}\\s*$`,'im').test(arch))e.push(`B: arquitectura sin sección ${heading}`);
 const project=md(r,'proyecto.md');if(fs.existsSync(path.join(r,'definicion','proyecto.md')))for(const heading of ['Qué hace','Cómo se ejecuta','Cómo se prueba','Cómo se despliega','Dependencias externas','Preguntas abiertas','Estado'])if(!new RegExp(`^#{1,6}\\s*${heading}\\s*$`,'im').test(project))e.push(`B: proyecto sin sección ${heading}`);
 if(!e.includes('clonar.sh inválido')&&!e.some(x=>x==='commits nuevos o cambio de rama o referencias')&&docs(r)){const c=cloneCheck(r,['app']);if(c)e.push(c);} return result(!e.length,e.join('; ')||'B correcto, incluye reconstrucción y segunda ejecución');}
function checkMImpl(r,canario){const e=common(r,canario), repos=md(r,'repos.md'), arch=md(r,'arquitectura.md');
 if(!/\|\s*Repo\s*\|\s*Rol\s*\|\s*URL remota\s*\|\s*Rama principal\s*\|\s*Stack\s*\|\s*Origen del dato\s*\|/i.test(repos))e.push('M: columnas de repos.md no corresponden al formato');
 for(const heading of ['Conexiones entre repos','Datos que faltan'])if(!new RegExp(`^#{1,6}\\s*${heading}\\s*$`,'im').test(repos))e.push(`M: falta sección ${heading}`);
 if(fs.existsSync(path.join(r,'definicion','proyecto.md')))for(const heading of ['Qué hace','Cómo se ejecuta','Cómo se prueba','Cómo se despliega','Dependencias externas','Preguntas abiertas','Estado'])if(!new RegExp(`^#{1,6}\\s*${heading}\\s*$`,'im').test(md(r,'proyecto.md')))e.push(`M: proyecto sin sección ${heading}`);
 if(fs.existsSync(path.join(r,'definicion','arquitectura.md')))for(const heading of ['Estructura y su razón','Diagrama','Componentes','Decisiones','Supuestos y pendientes','Observaciones','Estado'])if(!new RegExp(`^#{1,6}\\s*${heading}\\s*$`,'im').test(arch))e.push(`M: arquitectura sin sección ${heading}`);
 const table=repos.split(/\r?\n/).filter(line=>/^\|/.test(line)&&!/\|\s*[-:| ]+\|?\s*$/.test(line));if(table.length!==3)e.push('M: repos.md no lista exactamente api y front');
 for(const n of ['api','front']){const d=path.join(r,n),remote=git(d,'remote','get-url','origin'),branch=git(d,'branch','--show-current');const row=table.find(line=>line.split('|')[1]?.trim()===n);if(!row||!row.includes(remote)||!row.includes(branch))e.push(`M: repos.md incorrecto para ${n}`);}
 const diagramText=arch.match(/```mermaid([\s\S]*?)```/i)?.[1]||'',diagram=parseMermaid(diagramText);
 if(fs.existsSync(path.join(r,'definicion','arquitectura.md')))for(const n of ['api','front'])if(!repoNode(diagram,n))e.push(`M: ${n} falta en diagrama`);
 const frontNode=repoNode(diagram,'front'),apiNode=repoNode(diagram,'api');
 if(frontNode&&apiNode&&!diagram.edges.some(edge=>edge.from===frontNode.id&&edge.to===apiNode.id&&edge.rawLabel!==null&&/^"[^"\\n]+"$/.test(edge.rawLabel.trim())))e.push('M: flecha front → api sin etiqueta');
 const fixtureNames=fixtureRepos(r),listed=table.slice(1).map(line=>line.split('|')[1]?.trim()).filter(Boolean);for(const name of fixtureNames)if(!listed.includes(name))e.push(`M: repos.md omite repo del fixture ${name}`);
 const connections=repos.split(/^#{1,6}\s*Conexiones entre repos\s*$/im)[1]?.split(/^#{1,6}\s*/m)[0]||'';if(!/front/i.test(connections)||!/api/i.test(connections)||!/(?:VITE_API_URL|HTTP|API)/i.test(connections))e.push('M: falta conexión front/API con evidencia en repos.md');
 if(!e.includes('clonar.sh inválido')&&!e.some(x=>x==='commits nuevos o cambio de rama o referencias')&&docs(r)){ const c=cloneCheck(r,['api','front']);if(c)e.push(c);} return result(!e.length,e.join('; ')||'M correcto, incluye dos repos, conexión y reconstrucción');}
function checkCImpl(r,canario){
 const e=common(r,canario),repos=md(r,'repos.md'),arch=md(r,'arquitectura.md'),script=md(r,'clonar.sh');
 const rows=repos.split(/\r?\n/).filter(line=>/^\|/.test(line)&&!/^\|\s*[-:| ]+\|?\s*$/.test(line));
 const listed=rows.slice(1).map(line=>line.split('|')[1]?.trim()).filter(Boolean);
 for(const name of ['api','front','worker','infra'])if(!listed.includes(name))e.push(`C: repo en disco ausente de repos.md: ${name}`);
 const missing=repos.split(/^#{1,6}\s*Datos que faltan\s*$/im)[1]?.split(/^#{1,6}\s*/m)[0]||'';
 if(!/\bauth\b/i.test(missing))e.push('C: auth ausente de «Datos que faltan»');
 const workerRow=rows.find(line=>line.split('|')[1]?.trim()==='worker')||'';if(/(?:https?:\/\/|\.git)/i.test(workerRow))e.push('C: URL inventada para worker');
 if(!/^# FALTA URL: worker(?:\s+[^\n]*)?\s*$/m.test(script))e.push('C: falta # FALTA URL: worker');
 const blocks=[...arch.matchAll(/```mermaid\s*([\s\S]*?)```/gi)].map(m=>m[1]),diagrams=blocks.map(parseMermaid),allNodes=diagrams.flatMap(d=>d.nodes);
 const hasName=n=>allNodes.some(x=>new RegExp(`\\b${n}\\b`,'i').test(x.id)||new RegExp(`\\b${n}\\b`,'i').test(x.label));
 for(const n of ['api','front','worker','infra'])if(!hasName(n))e.push(`C: ${n} falta en diagrama`);
 if(diagrams.some(d=>d.nodes.length>12))e.push('C: diagrama supera 12 nodos');
 if(diagrams.some(d=>d.edges.some(edge=>edge.rawLabel===null||!edge.rawLabel.trim())))e.push('C: flecha sin etiqueta');
 if(hasName('auth')){const auth=allNodes.find(x=>/\bauth\b/i.test(x.id)||/\bauth\b/i.test(x.label));if(!/(?:pendiente|no confirmado|no confirmada)/i.test(auth.label))e.push('C: auth dibujado como confirmado');}
 if(blocks.length>1&&!/(?:vista general|general)[\s\S]*(?:detalle|detallada)|(?:detalle|detallada)[\s\S]*(?:vista general|general)/i.test(arch))e.push('C: diagramas múltiples sin vista general y detalle');
 if(script.split(/\r?\n/).some(line=>line.trim().startsWith('clonar "worker" ')))e.push('C: clon de worker que no debería existir');
 if(!e.includes('clonar.sh inválido')&&!e.some(x=>x==='commits nuevos o cambio de rama o referencias'||x==='C: clon de worker que no debería existir')&&docs(r)){const c=cloneCheck(r,['api','front','infra']);if(c)e.push(c);}
 return result(!e.length,e.join('; ')||'C correcto');}
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
function checkRImpl(r,originalRoot,canario){const remote=git(r,'remote','get-url','origin'),branch=git(r,'branch','--show-current');const e=common(r,canario), repos=md(r,'repos.md'), arch=md(r,'arquitectura.md'), project=md(r,'proyecto.md');if(!remote||!branch||!repos.includes(remote)||!repos.includes(branch))e.push('R: repos.md no refleja remoto/rama del repo copiado');
 for(const n of ['agentes/','skills/','modelos.json','scripts/resolver.mjs','instalar.sh','desinstalar.sh'])if(!new RegExp(`(?<![\\w-])${n.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}(?![\\w-])`,'i').test(arch))e.push(`R: arquitectura omite ${n}`);
 const escapeRegex=s=>s.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&');const evidence=existenciaPruebasCI(r);for(const [claim,present] of Object.entries(evidence)){const pattern=claim.includes('/')||claim.includes('.')?new RegExp(escapeRegex(claim),'i'):new RegExp(`\\b${escapeRegex(claim)}\\b`,'i');if(!present&&pattern.test(project))e.push(`R: afirma herramienta o CI ausente: ${claim}`);}
 if(!/^#{1,6}\s*Cómo se prueba\s*$/im.test(project)||!/^#{1,6}\s*Cómo se despliega\s*$/im.test(project))e.push('R: faltan secciones de prueba/despliegue');
 const c=cloneCheck(r,['repo'],{repo:r});if(c)e.push(c);
 if(!originalRoot)e.push('R: falta ruta del repositorio original');else{const expectedHead=read(path.join(path.dirname(r),'.original-head')).trim(), expectedStatus=read(path.join(path.dirname(r),'.original-status')).trim();if(git(originalRoot,'rev-parse','HEAD')!==expectedHead||git(originalRoot,'status','--porcelain=v1')!==expectedStatus)e.push('R: repositorio original modificado');}
 return result(!e.length,e.join('; ')||'R correcto');}
const guarded=fn=>(...args)=>{try{return fn(...args);}catch(error){const reason=error instanceof Error?error.message:String(error);return result(false,reason);}};
export const checkB=guarded(checkBImpl),checkM=guarded(checkMImpl),checkC=guarded(checkCImpl),checkR=guarded(checkRImpl);
export function run(scenario,r,meta={}){const f={B:checkB,M:checkM,C:checkC,R:checkR}[scenario];return scenario==='R'?f(r,meta.original,meta.canario):f(r,meta.canario);}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){const [s,r,canaryFile,original]=process.argv.slice(2);const out=run(s,path.resolve(r),{canario:read(canaryFile).trim(),original});console.log(`${out.ok?'PASA':'FALLA'}: ${out.reason}`);if(!out.ok)process.exit(1);}
