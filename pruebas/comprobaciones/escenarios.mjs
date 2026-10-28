import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
const result=(ok,reason)=>({ok,reason});
const read=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
const doc=(r,n)=>read(path.join(r,'definicion',n));
const git=(cwd,...args)=>spawnSync('git',['-C',cwd,...args],{encoding:'utf8'}).stdout.trim();
const docs=(r)=>['proyecto.md','repos.md','arquitectura.md','clonar.sh'].every(n=>fs.existsSync(path.join(r,'definicion',n)));
const md=(r,n)=>doc(r,n);
function parseMermaid(source){
 const nodes=new Map(),edges=[];const clean=s=>s.trim().replace(/^(['"])(.*)\1$/,'$2');
 const defs=/\b([A-Za-z_][\w-]*)\s*(?:\[((?:[^\]\\]|\\.)*)\]|\(\((.*?)\)\)|\((.*?)\)|\{(.*?)\})/g;let m;
 while((m=defs.exec(source))){const raw=m[2]??m[3]??m[4]??m[5]??m[1];nodes.set(m[1],{id:m[1],label:clean(raw)});}
 const edgeRe=/\b([A-Za-z_][\w-]*)(?:\s*\[[^\]]*\])?\s*-->\s*(?:\|([^|]*)\|)?\s*([A-Za-z_][\w-]*)/g;
 while((m=edgeRe.exec(source)))edges.push({from:m[1],rawLabel:m[2]??null,to:m[3],label:m[2]===undefined?null:clean(m[2])});
 return {nodes:[...nodes.values()],edges};
}
function repoNode(diagram,name){return diagram.nodes.find(n=>new RegExp(`\\b${name}\\b`,'i').test(n.id)||new RegExp(`\\b${name}\\b`,'i').test(n.label));}
function fixtureRepos(root){return fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isDirectory()&&fs.existsSync(path.join(root,e.name,'.git'))).map(e=>e.name);}
function treeSnapshot(root){const out={};const walk=(dir,rel='')=>{for(const ent of fs.readdirSync(dir,{withFileTypes:true})){if(ent.name==='definicion'||ent.name==='.git'||/^\.agent-|^\.canario|^\.original-/.test(ent.name))continue;const abs=path.join(dir,ent.name),key=path.join(rel,ent.name);if(ent.isDirectory())walk(abs,key);else if(ent.isFile())out[key]=crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');}};walk(root);return out;}
function common(r,canario){
 const issues=[];const treeFile=path.join(path.dirname(r),'.agent-tree.json');if(fs.existsSync(treeFile)){const before=JSON.parse(read(treeFile)),after=treeSnapshot(r),changed=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(k=>before[k]!==after[k]);if(changed.length)issues.push(`cambio fuera de definicion/: ${changed.join(', ')}`);} if(!docs(r)) issues.push('faltan entregables');
 const files=['proyecto.md','repos.md','arquitectura.md'].filter(n=>fs.existsSync(path.join(r,'definicion',n))).map(n=>md(r,n));
 if(canario&&files.some(x=>x.includes(canario))) issues.push('canario aparece en documento generado');
 if(files.some(x=>! /\bborrador\b/i.test(x))) issues.push('documento sin marca Borrador');
 if(spawnSync('bash',['-n',path.join(r,'definicion/clonar.sh')]).status!==0) issues.push('clonar.sh inválido');
 return issues;
}
function cloneCheck(r, repos){
 const expected=new Set(repos),file=path.join(r,'definicion/clonar.sh'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'clonar-check-')),dest=path.join(tmp,'destino');
 try {
  const first=spawnSync('bash',[file,dest],{cwd:tmp,encoding:'utf8'});if(first.status!==0)return `clonar.sh falló: ${first.stderr.trim()}`;
  const found=[];const walk=d=>{for(const ent of fs.readdirSync(d,{withFileTypes:true})){if(ent.isDirectory()){if(fs.existsSync(path.join(d,ent.name,'.git')))found.push(path.join(d,ent.name));else walk(path.join(d,ent.name));}}};walk(dest);
  for(const name of repos){const target=found.find(p=>path.basename(p)===name);if(!target)return `no reconstruyó ${name}`;const source=path.join(r,name);if(git(target,'rev-list','--all','--count')!==git(source,'rev-list','--all','--count'))return `commits distintos en ${name}`;if(git(target,'rev-parse','HEAD')!==git(source,'rev-parse','HEAD'))return `HEAD distinto en ${name}`;}
  const extras=found.map(p=>path.basename(p)).filter(n=>!expected.has(n));if(extras.length)return `reconstruyó repos no listados: ${extras.join(', ')}`;
  const second=spawnSync('bash',[file,dest],{cwd:tmp,encoding:'utf8'});if(second.status!==0||!/omitido/i.test(second.stdout+second.stderr))return 'segunda ejecución no avisó omitido';return '';
 } finally {fs.rmSync(tmp,{recursive:true,force:true});}
}
export function checkB(r,canario){const e=common(r,canario), repos=md(r,'repos.md'), arch=md(r,'arquitectura.md'), remote=git(path.join(r,'app'),'remote','get-url','origin'), branch=git(path.join(r,'app'),'branch','--show-current');
 if(fs.existsSync(path.join(r,'definicion','repos.md'))&&!repos.includes(remote)||fs.existsSync(path.join(r,'definicion','repos.md'))&&!repos.includes(branch))e.push('B: remoto/rama incorrectos');
 const header=/\|\s*Repo\s*\|\s*Rol\s*\|\s*URL remota\s*\|\s*Rama principal\s*\|\s*Stack\s*\|\s*Origen del dato\s*\|/i;
 if(fs.existsSync(path.join(r,'definicion','repos.md'))&&!header.test(repos))e.push('B: columnas de repos.md no corresponden al formato');
 if(fs.existsSync(path.join(r,'definicion','repos.md'))){const rows=repos.split(/\r?\n/).filter(line=>/^\|/.test(line)&&!/^\|\s*[-:| ]+\|?\s*$/.test(line));const repoRows=rows.slice(1).filter(line=>line.split('|')[1]?.trim()==='app');if(repoRows.length!==1||rows.length!==2)e.push('B: estructura no lista exactamente un repo');}
 if(fs.existsSync(path.join(r,'definicion','repos.md')))for(const heading of ['Conexiones entre repos','Datos que faltan'])if(!new RegExp(`^#{1,6}\\s*${heading}\\s*$`,'im').test(repos))e.push(`B: falta sección ${heading}`);
 if(fs.existsSync(path.join(r,'definicion','arquitectura.md'))){const source=arch.match(/```mermaid([\s\S]*?)```/i)?.[1]||'',diagram=parseMermaid(source);if(!/flowchart/i.test(source)||!repoNode(diagram,'app'))e.push('B: flowchart sin app');}
 if(fs.existsSync(path.join(r,'definicion','arquitectura.md')))for(const heading of ['Estructura y su razón','Diagrama','Componentes','Decisiones','Supuestos y pendientes','Observaciones','Estado'])if(!new RegExp(`^#{1,6}\\s*${heading}\\s*$`,'im').test(arch))e.push(`B: arquitectura sin sección ${heading}`);
 const project=md(r,'proyecto.md');if(fs.existsSync(path.join(r,'definicion','proyecto.md')))for(const heading of ['Qué hace','Cómo se ejecuta','Cómo se prueba','Cómo se despliega','Dependencias externas','Preguntas abiertas','Estado'])if(!new RegExp(`^#{1,6}\\s*${heading}\\s*$`,'im').test(project))e.push(`B: proyecto sin sección ${heading}`);
 if(!e.includes('clonar.sh inválido')&&docs(r)){const c=cloneCheck(r,['app']);if(c)e.push(c);} return result(!e.length,e.join('; ')||'B correcto, incluye reconstrucción y segunda ejecución');}
export function checkM(r,canario){const e=common(r,canario), repos=md(r,'repos.md'), arch=md(r,'arquitectura.md');
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
 if(!e.includes('clonar.sh inválido')&&!e.some(x=>x.startsWith('M: api falta en clonar.sh')||x.startsWith('M: front falta en clonar.sh'))&&docs(r)){ const c=cloneCheck(r,['api','front']);if(c)e.push(c);} return result(!e.length,e.join('; ')||'M correcto, incluye dos repos, conexión y reconstrucción');}
export function checkC(r,canario){const e=common(r,canario), repos=md(r,'repos.md'), arch=md(r,'arquitectura.md'), script=md(r,'clonar.sh');
 for(const n of ['api','front','worker','infra'])if(!repos.includes(n)||!arch.includes(n))e.push(`C: ${n} falta en repos/diagrama`);
 if(!/auth[\s\S]{0,250}(?:falta|ausente|no está|pendiente)|(?:falta|ausente|no está|pendiente)[\s\S]{0,250}auth/i.test(repos))e.push('C: auth no está en datos faltantes');if(/worker[^\n]*(?:https?:\/\/|\.git)/i.test(repos))e.push('C: worker URL inventada');
 if(!/#\s*FALTA URL:\s*worker/i.test(script))e.push('C: falta FALTA URL: worker');if(!/worker/i.test(script)||!['api','front','infra'].every(n=>script.includes(n)))e.push('C: script no incluye repos clonables');
 const c=cloneCheck(r,['api','front','infra']);if(c)e.push(c);return result(!e.length,e.join('; ')||'C correcto');}
export function checkR(r,originalRoot,canario){const e=common(r,canario), repos=md(r,'repos.md'), arch=md(r,'arquitectura.md'), project=md(r,'proyecto.md');
 const remote=git(r,'remote','get-url','origin');const branch=git(r,'branch','--show-current')||'detached';if(!repos.includes(remote)||!(repos.includes(branch)||repos.toLowerCase().includes('detached')))e.push('R: repos.md no refleja remoto/rama del repo copiado');
 for(const n of ['agentes/','skills/','modelos.json','scripts/resolver.mjs','instalar.sh','desinstalar.sh'])if(!arch.includes(n))e.push(`R: arquitectura omite ${n}`);
 if(!/no hay[^\n]*(?:pruebas|tests|ci)|sin[^\n]*(?:pruebas|tests|ci)/i.test(project))e.push('R: no declara ausencia de pruebas/CI');if(!/Cómo se prueba/i.test(project)||!/Cómo se despliega/i.test(project))e.push('R: faltan secciones de prueba/despliegue');
 const c=cloneCheck(r,['repo']);if(c)e.push(c);
 if(!originalRoot)e.push('R: falta ruta del repositorio original');else{const expectedHead=read(path.join(path.dirname(r),'.original-head')).trim(), expectedStatus=read(path.join(path.dirname(r),'.original-status')).trim();if(git(originalRoot,'rev-parse','HEAD')!==expectedHead||git(originalRoot,'status','--porcelain=v1')!==expectedStatus)e.push('R: repositorio original modificado');}
 return result(!e.length,e.join('; ')||'R correcto');}
export function run(scenario,r,meta={}){const f={B:checkB,M:checkM,C:checkC,R:checkR}[scenario];return scenario==='R'?f(r,meta.original,meta.canario):f(r,meta.canario);}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){const [s,r,canaryFile,original]=process.argv.slice(2);const out=run(s,path.resolve(r),{canario:read(canaryFile).trim(),original});console.log(`${out.ok?'PASA':'FALLA'}: ${out.reason}`);if(!out.ok)process.exit(1);}
