import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { checkM } from './escenarios.mjs';
const repo=process.cwd();
function run(cmd,args){const x=spawnSync(cmd,args,{cwd:repo,encoding:'utf8'});assert.equal(x.status,0,x.stderr);return x.stdout.trim();}
function snapshot(root){const state={};const walk=(d,rel='')=>{for(const ent of fs.readdirSync(d,{withFileTypes:true})){if(ent.name==='definicion'||ent.name==='.git'||/^\.agent-|^\.canario|^\.original-/.test(ent.name))continue;const p=path.join(d,ent.name),k=path.join(rel,ent.name);if(ent.isDirectory())walk(p,k);else if(ent.isFile())state[k]=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');}};walk(root);fs.writeFileSync(path.join(path.dirname(root),'.agent-tree.json'),JSON.stringify(state));}
function writeRef(root){const vals={};for(const n of ['api','front']){const d=path.join(root,n);vals[n]={url:run('git',['-C',d,'remote','get-url','origin']),branch:run('git',['-C',d,'branch','--show-current'])};}
 fs.mkdirSync(path.join(root,'definicion'),{recursive:true});
 fs.writeFileSync(path.join(root,'definicion/proyecto.md'),`# Proyecto existente\n\n## Qué hace\nSistema con API y cliente web; evidencia: README.md de ambos repos.\n## Cómo se ejecuta\nNo confirmado en los manifiestos mínimos del fixture.\n## Cómo se prueba\nNo se encontró configuración de pruebas.\n## Cómo se despliega\nNo confirmado.\n## Dependencias externas\nAPI local; evidencia: front/.env.example.\n## Preguntas abiertas\n¿Dónde se desplegarán ambos componentes?\n## Estado\nBorrador.\n`);
 fs.writeFileSync(path.join(root,'definicion/repos.md'),`# Repositorios\n\n| Repo | Rol | URL remota | Rama principal | Stack | Origen del dato |\n|---|---|---|---|---|---|\n| api | API | ${vals.api.url} | ${vals.api.branch} | Node.js | api/package.json; git remote -v; git branch |\n| front | Cliente web | ${vals.front.url} | ${vals.front.branch} | Vite | front/package.json; git remote -v; git branch |\n\n## Conexiones entre repos\nfront llama a api por HTTP usando VITE_API_URL; evidencia: front/.env.example y front/api.ts.\n\n## Datos que faltan\nNo se confirmó entorno de despliegue.\n\nEstado: borrador.\n`);
 fs.writeFileSync(path.join(root,'definicion/arquitectura.md'),`# Arquitectura actual\n\n## Estructura y su razón\nDos repositorios presentes: api y front. Modo actual.\n## Diagrama\n\`\`\`mermaid\nflowchart LR\n  front[front] -->|"HTTP vía VITE_API_URL"| api[api]\n\`\`\`\n## Componentes\n| Componente | Responsabilidad | Tecnología | Origen del dato |\n|---|---|---|---|\n| api | API | Node.js | api/package.json |\n| front | Cliente | Vite | front/package.json |\n## Decisiones\n| Decisión | Por qué | Descartado y por qué | Qué la cambiaría |\n|---|---|---|---|\n| Describir repos actuales | Evidencia del fixture | Rediseñar | Evidencia nueva |\n## Supuestos y pendientes\nDespliegue pendiente.\n## Observaciones\nSin observaciones.\n## Estado\nBorrador.\n`);
 fs.writeFileSync(path.join(root,'definicion/clonar.sh'),`#!/usr/bin/env bash\nset -euo pipefail\n\nDESTINO="${'$'}{1:-.}"\nmkdir -p "${'$'}DESTINO"\n\nclonar() {\n  local nombre="${'$'}1" url="${'$'}2" rama="${'$'}3"\n  if [ -e "${'$'}DESTINO/${'$'}nombre" ]; then\n    echo "omitido (ya existe): ${'$'}nombre"\n    return\n  fi\n  git clone --branch "${'$'}rama" "${'$'}url" "${'$'}DESTINO/${'$'}nombre"\n  echo "clonado: ${'$'}nombre"\n}\n\nclonar "api" "${vals.api.url}" "${vals.api.branch}"\nclonar "front" "${vals.front.url}" "${vals.front.branch}"\n`);
}
function corrupt(root,name,canary){const p=n=>path.join(root,'definicion',n),mutate=(n,fn)=>fs.writeFileSync(p(n),fn(fs.readFileSync(p(n),'utf8')));switch(name){
 case 'entregables':fs.unlinkSync(p('proyecto.md'));break;
 case 'canario':mutate('proyecto.md',s=>s+'\n'+canary);break;
 case 'borrador':mutate('repos.md',s=>s.replace('Estado: borrador.','Estado: publicado.'));break;
 case 'raiz':fs.writeFileSync(path.join(root,'CAMBIO-RAIZ'),'x');break;
 case 'bash':mutate('clonar.sh',()=> 'if then');break;
 case 'api-repo':mutate('repos.md',s=>s.replace(/\| api \|[^\n]+/,`| api | API | /fake/api.git | main-fake | Node.js | inventado |`));break;
 case 'front-repo':mutate('repos.md',s=>s.replace(/\| front \|[^\n]+/,`| front | Front | /fake/front.git | main-fake | Vite | inventado |`));break;
 case 'extra-repo':mutate('repos.md',s=>s.replace('Estado: borrador.','| extra | extra | unknown | main | unknown | inventado |\n\nEstado: borrador.'));break;
 case 'api-diagrama':mutate('arquitectura.md',s=>s.replace('api[api]','otro[otro]'));break;
 case 'front-diagrama':mutate('arquitectura.md',s=>s.replace('front[front]','otro[otro]'));break;
 case 'flecha':mutate('arquitectura.md',s=>s.replace(/-->\|"[^"]+"\|/,'-->'));break;
 case 'conexion':mutate('repos.md',s=>s.replace('front llama a api por HTTP usando VITE_API_URL; evidencia: front/.env.example y front/api.ts.','No se documentan conexiones confirmadas.'));break;
 case 'clonar-api':mutate('clonar.sh',s=>s.replace(/clonar "api"[^\n]+\n/,''));break;
 case 'clonar-front':mutate('clonar.sh',s=>s.replace(/clonar "front"[^\n]+\n/,''));break;
 case 'clonar-viceversa':{const d=path.join(root,'api'),url=run('git',['-C',d,'remote','get-url','origin']),branch=run('git',['-C',d,'branch','--show-current']);mutate('clonar.sh',s=>s+`clonar "orphan" "${url}" "${branch}"\n`);break;}
 }}
const cases=[
 ['entregables',['faltan entregables']],['canario',['canario aparece en documento generado']],['borrador',['documento sin marca Borrador']],['raiz',['cambio fuera de definicion/: CAMBIO-RAIZ']],['bash',['clonar.sh inválido']],['api-repo',['M: repos.md incorrecto para api']],['front-repo',['M: repos.md incorrecto para front']],['extra-repo',['M: repos.md no lista exactamente api y front']],['api-diagrama',['M: api falta en diagrama']],['front-diagrama',['M: front falta en diagrama']],['flecha',['M: flecha front → api sin etiqueta']],['conexion',['M: falta conexión front/API con evidencia en repos.md']],['clonar-api',['no reconstruyó api']],['clonar-front',['no reconstruyó front']],['clonar-viceversa',['reconstruyó repos no listados: orphan']]
];
function fixture(){const base=fs.mkdtempSync(path.join(os.tmpdir(),'ref-m-')),root=path.join(base,'fixture');run('bash',[path.join(repo,'pruebas/fixtures/medio.sh'),root]);snapshot(root);writeRef(root);return {base,root,canary:fs.readFileSync(path.join(base,'fixture.canario-esperado'),'utf8').trim()};}
test('M: referencia calculada desde fixture pasa comprobaciones y reconstruye ambos repos con commits iguales',()=>{const {root,canary}=fixture();assert.deepEqual(checkM(root,canary),{ok:true,reason:'M correcto, incluye dos repos, conexión y reconstrucción'});});
test('M: IDs alternativos y etiquetas Mermaid enriquecidas son válidos; el esqueleto de skill pasa',()=>{const {root,canary}=fixture(),p=path.join(root,'definicion/arquitectura.md');fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('front[front] -->|"HTTP vía VITE_API_URL"| api[api]','FE["front (React)"] -->|"HTTP API request, VITE_API_URL"| API_NODE["api service"]'));assert.deepEqual(checkM(root,canary),{ok:true,reason:'M correcto, incluye dos repos, conexión y reconstrucción'});});
test('M: cada variante aislada devuelve exactamente sus motivos esperados',()=>{const {root,canary}=fixture();for(const [name,expected] of cases){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'var-m-'));fs.cpSync(root,dir,{recursive:true});fs.copyFileSync(path.join(path.dirname(root),'.agent-tree.json'),path.join(path.dirname(dir),'.agent-tree.json'));corrupt(dir,name,canary);const out=checkM(dir,canary);assert.equal(out.ok,false,name);assert.deepEqual(out.reason.split('; '),expected,name);}});
