import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { crearInstantanea, rutaInstantanea } from './instantanea.mjs';
import { spawnSync } from 'node:child_process';
import { checkB } from './escenarios.mjs';
const repo=process.cwd();
function run(cmd,args){const x=spawnSync(cmd,args,{cwd:repo,encoding:'utf8'});assert.equal(x.status,0,x.stderr);return x.stdout.trim();}
function writeRef(root){
 const app=path.join(root,'app'),remote=run('git',['-C',app,'remote','get-url','origin']),branch=run('git',['-C',app,'branch','--show-current']);fs.mkdirSync(path.join(root,'definicion'),{recursive:true});
 fs.writeFileSync(path.join(root,'definicion','proyecto.md'),`# Proyecto existente\n\n## Qué hace\nAplicación fullstack; origen: README.md de app.\n## Cómo se ejecuta\nNo confirmado; el fixture no documenta un comando de ejecución.\n## Cómo se prueba\nNo confirmado por el fixture.\n## Cómo se despliega\nNo confirmado por el fixture.\n## Dependencias externas\nReact Router; origen: package.json.\n## Preguntas abiertas\n¿Hay requisitos de despliegue adicionales?\n## Estado\nBorrador.\n`);
 fs.writeFileSync(path.join(root,'definicion','repos.md'),`# Repositorios\n\n| Repo | Rol | URL remota | Rama principal | Stack | Origen del dato |\n|---|---|---|---|---|---|\n| app | Aplicación fullstack | ${remote} | ${branch} | React Router v7 | git remote -v; git branch; package.json |\n\n## Conexiones entre repos\nNo hay conexiones entre repos: el fixture contiene un único repositorio.\n\n## Datos que faltan\nNo se confirmó un entorno de despliegue.\n\nEstado: borrador.\n`);
 fs.writeFileSync(path.join(root,'definicion','arquitectura.md'),`# Arquitectura actual\n\n## Estructura y su razón\nUn repositorio existente: app. Modo actual; no se propone separación.\n## Diagrama\n\`\`\`mermaid\nflowchart TD\n  app[app]\n\`\`\`\n## Componentes\n| Componente | Responsabilidad | Tecnología | Origen del dato |\n|---|---|---|---|\n| app | Aplicación | React Router v7 | package.json |\n## Decisiones\n| Decisión | Por qué | Descartado y por qué | Qué la cambiaría |\n|---|---|---|---|\n| Mantener estructura actual | Modo actual | Separar sin evidencia | Evidencia de despliegue independiente |\n## Supuestos y pendientes\nDespliegue no confirmado.\n## Observaciones\nSin observaciones adicionales.\n## Estado\nBorrador.\n`);
 fs.writeFileSync(path.join(root,'definicion','clonar.sh'),`#!/usr/bin/env bash\nset -euo pipefail\n\nDESTINO="${'$'}{1:-.}"\nmkdir -p "${'$'}DESTINO"\n\nclonar() {\n  local nombre="$1" url="$2" rama="$3"\n  if [ -e "${'$'}DESTINO/${'$'}nombre" ]; then\n    echo "omitido (ya existe): ${'$'}nombre"\n    return\n  fi\n  git clone --branch "$rama" "$url" "${'$'}DESTINO/${'$'}nombre"\n  echo "clonado: ${'$'}nombre"\n}\n\nclonar "app" "${remote}" "${branch}"\n`);
}
function corrupt(root,name,canary){const p=n=>path.join(root,'definicion',n),mutate=(n,fn)=>fs.writeFileSync(p(n),fn(fs.readFileSync(p(n),'utf8')));
 switch(name){
  case 'entregables':fs.unlinkSync(p('arquitectura.md'));break;
  case 'commits':run('git',['-C',path.join(root,'app'),'commit','--allow-empty','-m','prueba']);break;
  case 'comun-canario':mutate('proyecto.md',s=>s+'\n'+canary);break;
  case 'comun-borrador':mutate('proyecto.md',s=>s.replace('Borrador.','Publicado.'));break;
  case 'comun-cambios':fs.writeFileSync(path.join(root,'app','INTRUSO.txt'),'no permitido');break;
  case 'raiz-fuera-definicion':fs.writeFileSync(path.join(root,'ARCHIVO-RAIZ.txt'),'no permitido');break;
  case 'comun-bash':mutate('clonar.sh',()=> 'if then');break;
  case 'url-rama':mutate('repos.md',s=>s.replace(`| app | Aplicación fullstack | ${run('git',['-C',path.join(root,'app'),'remote','get-url','origin'])} | ${run('git',['-C',path.join(root,'app'),'branch','--show-current'])} |`,`| app | Aplicación fullstack | /url/inventada.git | rama-inventada |`));break;
  case 'un-repo':mutate('repos.md',s=>s.replace(/^(\| app \|[^\n]+)$/m,'$1\n| api | API | desconocida | main | desconocido | inventado |'));break;
  case 'diagrama':mutate('arquitectura.md',s=>s.replace('app[app]','otro[otro]'));break;
  case 'clonar-repo':mutate('clonar.sh',s=>s.replace(/clonar "app"[^\n]+\n/,''));break;
  case 'clonar-viceversa':{const app=path.join(root,'app'),url=run('git',['-C',app,'remote','get-url','origin']),branch=run('git',['-C',app,'branch','--show-current']);mutate('clonar.sh',s=>s+`clonar "rogue" "${url}" "${branch}"\n`);break;}
  case 'segunda-ejecucion':mutate('clonar.sh',s=>s.replace('omitido (ya existe)','ya estaba'));break;
 }
}
const cases=[
 ['entregables',['faltan entregables']],['commits',['commits nuevos o cambio de rama o referencias']],['comun-canario',['canario aparece en documento generado']],['comun-borrador',['documento sin marca Borrador','proyecto.md: Estado no indica borrador']],['comun-cambios',['cambio fuera de definicion/: app/INTRUSO.txt']],['raiz-fuera-definicion',['cambio fuera de definicion/: ARCHIVO-RAIZ.txt']],['comun-bash',['clonar.sh inválido']],['url-rama',['B: remoto/rama incorrectos']],['un-repo',['B: estructura no lista exactamente un repo']],['diagrama',['B: flowchart sin app']],['clonar-repo',['no reconstruyó app']],['clonar-viceversa',['reconstruyó repos no listados: rogue']],['segunda-ejecucion',['segunda ejecución no avisó omitido']]
];
function makeFixture(){const base=fs.mkdtempSync(path.join(os.tmpdir(),'ref-b-')),root=path.join(base,'fixture');run('bash',[path.join(repo,'pruebas/fixtures/basico.sh'),root]);crearInstantanea(root);writeRef(root);return {base,root,canary:fs.readFileSync(path.join(base,'fixture.canario-esperado'),'utf8').trim()};}
test('B: referencia de formato de skills pasa checkB, ejecución y segunda ejecución de clonar.sh',()=>{const {root,canary}=makeFixture();assert.deepEqual(checkB(root,canary),{ok:true,reason:'B correcto, incluye reconstrucción y segunda ejecución'});});
test('B: fixture deja el remoto bare fuera del workspace y mantiene una URL clonable',()=>{const {base,root,canary}=makeFixture(),remote=run('git',['-C',path.join(root,'app'),'remote','get-url','origin']);assert.equal(remote,path.join(base,'remotos','app.git'));assert.equal(run('git',['-C',remote,'rev-parse','--is-bare-repository']),'true');assert.deepEqual(checkB(root,canary),{ok:true,reason:'B correcto, incluye reconstrucción y segunda ejecución'});});
test('B: checkB falla si el workspace contiene un repositorio bare',()=>{const {root,canary}=makeFixture(),bare=path.join(root,'intruso.git');run('git',['init','--bare',bare]);crearInstantanea(root);const result=checkB(root,canary);assert.equal(result.ok,false);assert.match(result.reason,/workspace contiene repositorio bare: intruso[.]git/);});
test('B: identificador Mermaid alternativo y esqueleto de skill siguen pasando',()=>{const {root,canary}=makeFixture();const arch=path.join(root,'definicion/arquitectura.md');fs.writeFileSync(arch,fs.readFileSync(arch,'utf8').replace('app[app]','APPNODE["app (React Router)"]'));assert.deepEqual(checkB(root,canary),{ok:true,reason:'B correcto, incluye reconstrucción y segunda ejecución'});});
test('B: Markdown en la celda Repo y Estado en negrita o en línea son formatos válidos',()=>{const {root,canary}=makeFixture();for(const name of ['proyecto.md','arquitectura.md']){const p=path.join(root,'definicion',name);fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('## Estado\nBorrador.','**Estado**: **Borrador**'));}const repos=path.join(root,'definicion/repos.md');fs.writeFileSync(repos,fs.readFileSync(repos,'utf8').replace('| app |','| **`app`** |'));assert.equal(checkB(root,canary).ok,true);});
test('B: acepta Estado en cualquier posición de la línea y también aplica el marcador a repos.md',()=>{const {root,canary}=makeFixture(),arch=path.join(root,'definicion/arquitectura.md'),repos=path.join(root,'definicion/repos.md');fs.writeFileSync(arch,fs.readFileSync(arch,'utf8').replace('## Estado\nBorrador.','**Modo: actual. Estado: borrador.**'));fs.writeFileSync(repos,fs.readFileSync(repos,'utf8').replace('Estado: borrador.','**Estado**: **borrador**.'));assert.equal(checkB(root,canary).ok,true);});
test('B: acepta el nombre de repo como directorio con barra final',()=>{const {root,canary}=makeFixture();const p=path.join(root,'definicion/repos.md');fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('| app |','| app/ |'));assert.equal(checkB(root,canary).ok,true);});
test('B: instantánea ausente hace no evaluable y falla',()=>{const {root,canary}=makeFixture();fs.unlinkSync(rutaInstantanea(root));assert.deepEqual(checkB(root,canary),{ok:false,reason:'instantánea inicial ausente: comprobación no evaluable'});});
test('B: cada variante aislada produce exactamente la lista de motivos prevista',()=>{const {root,canary}=makeFixture();for(const [name,expected] of cases){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'var-b-'));fs.cpSync(root,dir,{recursive:true});fs.copyFileSync(rutaInstantanea(root),rutaInstantanea(dir));corrupt(dir,name,canary);const out=checkB(dir,canary);assert.equal(out.ok,false,name);assert.deepEqual(out.reason.split('; '),expected,name);}});
