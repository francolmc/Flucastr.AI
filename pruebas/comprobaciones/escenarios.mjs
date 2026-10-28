import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
const doc = (root, name) => read(path.join(root, 'definicion', name));
const repos = (root) => doc(root, 'repos.md');
const arch = (root) => doc(root, 'arquitectura.md');
const script = (root) => doc(root, 'clonar.sh');
const lines = (text) => text.split(/\r?\n/).filter(Boolean);
const result = (ok, reason) => ({ ok, reason });

export function checkB(root) {
  const r = repos(root), a = arch(root), s = script(root);
  const remote = spawnSync('git', ['-C', path.join(root, 'app'), 'remote', 'get-url', 'origin'], { encoding: 'utf8' }).stdout.trim();
  const branch = spawnSync('git', ['-C', path.join(root, 'app'), 'branch', '--show-current'], { encoding: 'utf8' }).stdout.trim();
  if (!['proyecto.md','repos.md','arquitectura.md','clonar.sh'].every(n => fs.existsSync(path.join(root,'definicion',n)))) return result(false,'faltan entregables');
  if ((r.match(/https?:\/\/|\.git|origin/gi)||[]).length < 1 || !r.includes(remote) || !r.includes(branch)) return result(false,'repos.md no contiene URL remota y rama correctas');
  if (!/```mermaid[\s\S]*?flowchart/i.test(a) || !a.includes('app')) return result(false,'diagrama Mermaid flowchart no identifica app');
  if (spawnSync('bash',['-n',path.join(root,'definicion/clonar.sh')]).status !== 0) return result(false,'clonar.sh inválido');
  return result(true,'entregables, remoto, rama y diagrama válidos; ejecución del clon requiere evaluación del arnés');
}
export function checkM(root) {
  const r=repos(root), a=arch(root), s=script(root), errs=[];
  for (const n of ['api','front']) {
    const remote=spawnSync('git',['-C',path.join(root,n),'remote','get-url','origin'],{encoding:'utf8'}).stdout.trim();
    const branch=spawnSync('git',['-C',path.join(root,n),'branch','--show-current'],{encoding:'utf8'}).stdout.trim();
    if(!r.includes(n)||!r.includes(remote)||!r.includes(branch)) errs.push(`${n}: repos.md omite nombre, URL o rama`);
    if(!a.includes(n)||!s.includes(n)) errs.push(`${n}: falta en diagrama o clonar.sh`);
  }
  if(!/front[^\n]*(?:-->|→)[^\n]*api|api[^\n]*(?:<--|←)[^\n]*front/i.test(a)) errs.push('falta flecha front → API etiquetada');
  if(!/Conexiones entre repos[\s\S]*?(?:front[\s\S]*api|api[\s\S]*front)/i.test(r)) errs.push('falta conexión front/API en repos.md');
  if(spawnSync('bash',['-n',path.join(root,'definicion/clonar.sh')]).status!==0) errs.push('clonar.sh inválido');
  return result(!errs.length, errs.join('; ') || 'dos repos, conexión y sintaxis correctos');
}
export function checkC(root) {
  const r=repos(root), a=arch(root), s=script(root), errs=[];
  for(const n of ['api','front','worker','infra']) if(!r.includes(n)||!a.includes(n)) errs.push(`${n} falta en repos.md/diagrama`);
  if(!/auth[\s\S]{0,250}(?:falta|ausente|no está|pendiente)|(?:falta|ausente|no está|pendiente)[\s\S]{0,250}auth/i.test(r)) errs.push('auth no está identificado como dato faltante');
  if(/worker[^\n]*(?:https?:\/\/|\.git)/i.test(r)) errs.push('worker tiene URL inventada');
  if(!/#\s*FALTA URL:\s*worker/i.test(s)) errs.push('clonar.sh no marca FALTA URL: worker');
  if(spawnSync('bash',['-n',path.join(root,'definicion/clonar.sh')]).status!==0) errs.push('clonar.sh inválido');
  const nodes=(a.match(/\b(?:\w+\[[^\]]*\]|\w+\([^)]*\)|\w+\{[^}]*\})/g)||[]).length;
  if(nodes>12) errs.push(`diagrama excede 12 nodos aproximados (${nodes})`);
  if(/-->|<--|---/.test(a) && /(?:-->|<--|---)(?!\|[^|]+\|)/.test(a)) errs.push('flujo sin etiqueta detectable');
  if(/auth\s*(?:\[|\(|\{)/i.test(a)) errs.push('auth dibujado como confirmado');
  return result(!errs.length,errs.join('; ')||'componentes, ausencia de auth, worker y diagrama válidos');
}
export function checkR(root, originalRoot) {
  const r=repos(root), a=arch(root), p=doc(root,'proyecto.md'), s=script(root), errs=[];
  const remote=spawnSync('git',['-C',root,'remote','get-url','origin'],{encoding:'utf8'}).stdout.trim();
  const branch=spawnSync('git',['-C',root,'branch','--show-current'],{encoding:'utf8'}).stdout.trim() || 'HEAD (detached)';
  if(!r.includes(remote)||(!r.includes(branch)&&!r.toLowerCase().includes('detached'))) errs.push('repos.md no refleja remoto/rama del fixture');
  for(const n of ['agentes/','skills/','modelos.json','scripts/resolver.mjs','instalar.sh','desinstalar.sh']) if(!a.includes(n)) errs.push(`arquitectura omite ${n}`);
  if(!/no hay[^\n]*(?:pruebas|tests|ci)|sin[^\n]*(?:pruebas|tests|ci)/i.test(p)) errs.push('proyecto.md no declara ausencia de pruebas/CI');
  if(!/Cómo se prueba/i.test(p)||!/Cómo se despliega/i.test(p)) errs.push('faltan secciones de prueba/despliegue');
  if(spawnSync('bash',['-n',path.join(root,'definicion/clonar.sh')]).status!==0) errs.push('clonar.sh inválido');
  if(originalRoot){const status=spawnSync('git',['-C',originalRoot,'status','--porcelain=v1'],{encoding:'utf8'}).stdout; const head=spawnSync('git',['-C',originalRoot,'rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(); if(status!==read(path.join(path.dirname(root),'.original-status')).trim()||head!==read(path.join(path.dirname(root),'.original-head')).trim()) errs.push('repositorio original modificado');}
  return result(!errs.length,errs.join('; ')||'contenido real y clonación validados');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const [scenario, root] = process.argv.slice(2); const fn={B:checkB,M:checkM,C:checkC,R:checkR}[scenario];
  if(!fn||!root){console.error('uso: node escenarios.mjs {B|M|C|R} FIXTURE');process.exit(2)}
  const out=fn(path.resolve(root)); console.log(`${out.ok?'PASA':'FALLA'}: ${out.reason}`); if(!out.ok) process.exit(1);
}
