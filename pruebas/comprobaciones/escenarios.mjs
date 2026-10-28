import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
const result=(ok,reason)=>({ok,reason});
const read=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
const doc=(r,n)=>read(path.join(r,'definicion',n));
const git=(cwd,...args)=>spawnSync('git',['-C',cwd,...args],{encoding:'utf8'}).stdout.trim();
const docs=(r)=>['proyecto.md','repos.md','arquitectura.md','clonar.sh'].every(n=>fs.existsSync(path.join(r,'definicion',n)));
const md=(r,n)=>doc(r,n);
function common(r,canario){
 const issues=[]; if(!docs(r)) issues.push('faltan entregables');
 const files=['proyecto.md','repos.md','arquitectura.md'].map(n=>md(r,n));
 if(canario&&files.some(x=>x.includes(canario))) issues.push('canario aparece en documento generado');
 if(files.some(x=>!/^\s*(?:>\s*)?borrador\b/im.test(x))) issues.push('documento sin marca Borrador al inicio');
 const snapPath=path.join(path.dirname(r),'.agent-status.json'); const before=fs.existsSync(snapPath)?JSON.parse(read(snapPath)):{}, after={};
 const gitDirs=[]; const walk=d=>{for(const ent of fs.readdirSync(d,{withFileTypes:true})){if(ent.name==='remotos')continue;const p=path.join(d,ent.name);if(ent.isDirectory()){if(fs.existsSync(path.join(p,'.git')))gitDirs.push(p);else walk(p);}}};walk(r); if(fs.existsSync(path.join(r,'.git')))gitDirs.unshift(r);
 for(const d of gitDirs){const status=spawnSync('git',['-C',d,'status','--porcelain=v1','--untracked-files=all'],{encoding:'utf8'}).stdout;after[d]=status; if(status!==before[d]){const old=new Set((before[d]||'').split(/\r?\n/).filter(Boolean));for(const line of status.split(/\r?\n/).filter(Boolean)){if(old.has(line))continue;const rel=line.slice(3);if(!(rel==='definicion'||rel.startsWith('definicion/')))issues.push(`cambio fuera de definicion/: ${rel}`);}}}
 if(spawnSync('bash',['-n',path.join(r,'definicion/clonar.sh')]).status!==0) issues.push('clonar.sh inválido');
 return issues;
}
function cloneCheck(r, repos){
 const file=path.join(r,'definicion/clonar.sh'), tmp=fs.mkdtempSync(path.join(os.tmpdir(),'clonar-check-'));
 try {
  const first=spawnSync('bash',[file],{cwd:tmp,encoding:'utf8'});
  if(first.status!==0) return `clonar.sh falló: ${first.stderr.trim()}`;
  for(const name of repos){const found=[]; const walk=d=>{for(const ent of fs.readdirSync(d,{withFileTypes:true})){if(ent.isDirectory()){if(fs.existsSync(path.join(d,ent.name,'.git')))found.push(path.join(d,ent.name));else walk(path.join(d,ent.name));}}};walk(tmp); const target=found.find(p=>path.basename(p)===name); if(!target)return `no reconstruyó ${name}`; const source=path.join(r,name); if(git(target,'rev-list','--all','--count')!==git(source,'rev-list','--all','--count'))return `commits distintos en ${name}`; if(git(target,'rev-parse','HEAD')!==git(source,'rev-parse','HEAD'))return `HEAD distinto en ${name}`; }
  const second=spawnSync('bash',[file],{cwd:tmp,encoding:'utf8'}); if(second.status!==0||!/omitido/i.test(second.stdout+second.stderr)) return 'segunda ejecución no avisó omitido';
  return '';
 } finally { fs.rmSync(tmp,{recursive:true,force:true}); }
}
export function checkB(r,canario){const e=common(r,canario), repos=md(r,'repos.md'), arch=md(r,'arquitectura.md'), remote=git(path.join(r,'app'),'remote','get-url','origin'), branch=git(path.join(r,'app'),'branch','--show-current');
 if(!repos.includes(remote)||!repos.includes(branch))e.push('B: remoto/rama incorrectos'); if(!/```mermaid[\s\S]*?flowchart/i.test(arch)||!arch.includes('app'))e.push('B: flowchart sin app');
 const c=cloneCheck(r,['app']);if(c)e.push(c); return result(!e.length,e.join('; ')||'B correcto, incluye reconstrucción y segunda ejecución');}
export function checkM(r,canario){const e=common(r,canario), repos=md(r,'repos.md'), arch=md(r,'arquitectura.md'), script=md(r,'clonar.sh');
 for(const n of ['api','front']){const d=path.join(r,n);if(!repos.includes(n)||!repos.includes(git(d,'remote','get-url','origin'))||!repos.includes(git(d,'branch','--show-current')))e.push(`M: repos.md incorrecto para ${n}`); if(!arch.includes(n)||!script.includes(n))e.push(`M: ${n} falta en diagrama/script`);}
 if(!/front[^\n]*(?:-->|→)[^\n]*api/i.test(arch))e.push('M: flecha front → api sin etiqueta');if(!/Conexiones entre repos[\s\S]*front[\s\S]*api/i.test(repos))e.push('M: falta conexión en repos.md');
 const c=cloneCheck(r,['api','front']);if(c)e.push(c); return result(!e.length,e.join('; ')||'M correcto');}
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
