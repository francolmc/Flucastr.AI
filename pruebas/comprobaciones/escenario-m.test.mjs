import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { crearInstantanea, rutaInstantanea } from './instantanea.mjs';
import { spawnSync } from 'node:child_process';
import { checkM, parseMermaid } from './escenarios.mjs';
const repo=process.cwd();
function run(cmd,args){const x=spawnSync(cmd,args,{cwd:repo,encoding:'utf8'});assert.equal(x.status,0,x.stderr);return x.stdout.trim();}
function writeRef(root){const vals={};for(const n of ['api','front']){const d=path.join(root,n);vals[n]={url:run('git',['-C',d,'remote','get-url','origin']),branch:run('git',['-C',d,'branch','--show-current'])};}
 fs.mkdirSync(path.join(root,'definicion'),{recursive:true});
 fs.writeFileSync(path.join(root,'definicion/proyecto.md'),`# Proyecto existente\n\n## Qué hace\nSistema con API y cliente web; evidencia: README.md de ambos repos.\n## Cómo se ejecuta\nNo confirmado en los manifiestos mínimos del fixture.\n## Cómo se prueba\nNo se encontró configuración de pruebas.\n## Cómo se despliega\nNo confirmado.\n## Dependencias externas\nAPI local; evidencia: front/.env.example.\n## Preguntas abiertas\n¿Dónde se desplegarán ambos componentes?\n## Estado\nBorrador.\n`);
 fs.writeFileSync(path.join(root,'definicion/repos.md'),`# Repositorios\n\n| Repo | Rol | URL remota | Rama principal | Stack | Origen del dato |\n|---|---|---|---|---|---|\n| api | API | ${vals.api.url} | ${vals.api.branch} | Node.js | api/package.json; git remote -v; git branch |\n| front | Cliente web | ${vals.front.url} | ${vals.front.branch} | Vite | front/package.json; git remote -v; git branch |\n\n## Conexiones entre repos\nfront llama a api por HTTP usando VITE_API_URL; evidencia: front/.env.example y front/api.ts.\n\n## Datos que faltan\nNo se confirmó entorno de despliegue.\n\nEstado: borrador.\n`);
 fs.writeFileSync(path.join(root,'definicion/arquitectura.md'),`# Arquitectura actual\n\n## Estructura y su razón\nDos repositorios presentes: api y front. Modo actual.\n## Diagrama\n\`\`\`mermaid\nflowchart LR\n  front[front] -->|"HTTP vía VITE_API_URL"| api[api]\n\`\`\`\n## Componentes\n| Componente | Responsabilidad | Tecnología | Origen del dato |\n|---|---|---|---|\n| api | API | Node.js | api/package.json |\n| front | Cliente | Vite | front/package.json |\n## Decisiones\n| Decisión | Por qué | Descartado y por qué | Qué la cambiaría |\n|---|---|---|---|\n| Describir repos actuales | Evidencia del fixture | Rediseñar | Evidencia nueva |\n## Supuestos y pendientes\nDespliegue pendiente.\n## Observaciones\nSin observaciones.\n## Estado\nBorrador.\n`);
 fs.writeFileSync(path.join(root,'definicion/clonar.sh'),`#!/usr/bin/env bash\nset -euo pipefail\n\nDESTINO="${'$'}{1:-.}"\nmkdir -p "${'$'}DESTINO"\n\nclonar() {\n  local nombre="${'$'}1" url="${'$'}2" rama="${'$'}3"\n  if [ -e "${'$'}DESTINO/${'$'}nombre" ]; then\n    echo "omitido (ya existe): ${'$'}nombre"\n    return\n  fi\n  git clone --branch "${'$'}rama" "${'$'}url" "${'$'}DESTINO/${'$'}nombre"\n  echo "clonado: ${'$'}nombre"\n}\n\nclonar "api" "${vals.api.url}" "${vals.api.branch}"\nclonar "front" "${vals.front.url}" "${vals.front.branch}"\n`);
}
function corrupt(root,name,canary){const p=n=>path.join(root,'definicion',n),mutate=(n,fn)=>fs.writeFileSync(p(n),fn(fs.readFileSync(p(n),'utf8')));switch(name){
 case 'entregables':fs.unlinkSync(p('proyecto.md'));break;
 case 'commits':run('git',['-C',path.join(root,'api'),'commit','--allow-empty','-m','prueba']);break;
 case 'canario':mutate('proyecto.md',s=>s+'\n'+canary);break;
 case 'borrador':mutate('repos.md',s=>s.replace('Estado: borrador.','Estado: publicado.'));break;
 case 'raiz':fs.writeFileSync(path.join(root,'CAMBIO-RAIZ'),'x');break;
 case 'bash':mutate('clonar.sh',()=> 'if then');break;
 case 'api-repo':mutate('repos.md',s=>s.replace(/\| api \|[^\n]+/,`| api | API | /fake/api.git | main-fake | Node.js | inventado |`));break;
 case 'front-repo':mutate('repos.md',s=>s.replace(/\| front \|[^\n]+/,`| front | Front | /fake/front.git | main-fake | Vite | inventado |`));break;
 case 'extra-repo':mutate('repos.md',s=>s.replace(/^(\| front \|[^\n]+)$/m,'$1\n| extra | extra | unknown | main | unknown | inventado |'));break;
 case 'api-diagrama':mutate('arquitectura.md',s=>s.replace('api[api]','otro[otro]'));break;
 case 'front-diagrama':mutate('arquitectura.md',s=>s.replace('front[front]','otro[otro]'));break;
 case 'flecha':mutate('arquitectura.md',s=>s.replace(/-->\|"[^"]+"\|/,'-->'));break;
 case 'conexion':mutate('repos.md',s=>s.replace('front llama a api por HTTP usando VITE_API_URL; evidencia: front/.env.example y front/api.ts.','No se documentan conexiones confirmadas.'));break;
 case 'clonar-api':mutate('clonar.sh',s=>s.replace(/clonar "api"[^\n]+\n/,''));break;
 case 'clonar-front':mutate('clonar.sh',s=>s.replace(/clonar "front"[^\n]+\n/,''));break;
 case 'clonar-viceversa':{const d=path.join(root,'api'),url=run('git',['-C',d,'remote','get-url','origin']),branch=run('git',['-C',d,'branch','--show-current']);mutate('clonar.sh',s=>s+`clonar "orphan" "${url}" "${branch}"\n`);break;}
 }}
const cases=[
 ['entregables',['faltan entregables']],['commits',['commits nuevos o cambio de rama o referencias']],['canario',['canario aparece en documento generado']],['borrador',['documento sin marca Borrador','repos.md: Estado no indica borrador']],['raiz',['cambio fuera de definicion/: CAMBIO-RAIZ']],['bash',['clonar.sh inválido']],['api-repo',['M: repos.md incorrecto para api']],['front-repo',['M: repos.md incorrecto para front']],['extra-repo',['M: repos.md no lista exactamente api y front']],['api-diagrama',['M: api falta en diagrama']],['front-diagrama',['M: front falta en diagrama']],['flecha',['M: flecha front → api sin etiqueta']],['conexion',['M: falta conexión front/API con evidencia en repos.md']],['clonar-api',['no reconstruyó api']],['clonar-front',['no reconstruyó front']],['clonar-viceversa',['reconstruyó repos no listados: orphan']]
];
function fixture(){const base=fs.mkdtempSync(path.join(os.tmpdir(),'ref-m-')),root=path.join(base,'fixture');run('bash',[path.join(repo,'pruebas/fixtures/medio.sh'),root]);crearInstantanea(root);writeRef(root);return {base,root,canary:fs.readFileSync(path.join(base,'fixture.canario-esperado'),'utf8').trim()};}
test('Mermaid: reconoce todos los operadores de flowchart etiquetados en una cadena',()=>{const parsed=parseMermaid(`flowchart LR\na -->|"HTTP a VITE_API_URL: API_v2 (inferido)"| b ---|TLS: API_v2| c -.->|"eventos—sí"| d -.-|"HTTP (batch)"| e ==>|gRPC: API_v2| f ===|shared_state| g --o|notify (SSE)| h --x|reject: 401| i <-->|"two-way sync"| j`);assert.deepEqual(parsed.edges.map(edge=>edge.operator),['-->','---','-.->','-.-','==>','===','--o','--x','<-->']);assert.ok(parsed.edges.every(edge=>edge.rawLabel&&edge.rawLabel.trim()));});
test('Mermaid: etiquetas dash con y sin comillas, encadenadas y en ambas sintaxis',()=>{for(const source of [
 'flowchart LR\nfront -.->|"HTTP a VITE_API_URL: API_v2 (inferido)"| api',
 'flowchart LR\nfront -. "HTTP a VITE_API_URL: API_v2 (inferido)" .-> api',
 'flowchart LR\nfront -.->|HTTP: API_v2 (inferido)| api',
 'flowchart LR\nfront -. HTTP: API_v2 (inferido) .-> api',
 'flowchart LR\na -.->|"API_v2 (inferido)"| b -.->|TLS: API_v2| c',
]){const edges=parseMermaid(source).edges;assert.equal(edges.length,source.includes('a -.->')?2:1,source);assert.ok(edges.every(edge=>edge.rawLabel&&edge.rawLabel.includes('API')),source);}});
test('Mermaid: paréntesis descriptivos no generan nodos espurios',()=>{const parsed=parseMermaid('flowchart LR\na["Front (cliente)"] -->|"Llama (inferido)"| b["API (servidor)"]');assert.deepEqual(parsed.nodes.map(node=>node.id),['a','b']);assert.equal(parsed.edges.length,1);});
test('Mermaid: no etiqueta sigue siendo arista sin etiqueta y no se acepta como flujo documentado',()=>{for(const source of ['flowchart LR\na --> b','flowchart LR\na -.-> b','flowchart LR\na --- b'])assert.equal(parseMermaid(source).edges[0]?.rawLabel??null,null,source);});
test('M: referencia calculada desde fixture pasa comprobaciones y reconstruye ambos repos con commits iguales',()=>{const {root,canary}=fixture();assert.deepEqual(checkM(root,canary),{ok:true,reason:'M correcto, incluye dos repos, conexión y reconstrucción'});});
test('M: acepta etiquetas realistas con y sin comillas en las dos sintaxis Mermaid',()=>{for(const syntax of [
 'front[front] -->|"HTTP a VITE_API_URL (inferido)"| api[api]',
 'front[front] -->|HTTP API: URL_vía_front-to-api| api[api]',
 'front[front] -- "HTTP (JSON): VITE_API_URL_vía_api" --> api[api]',
 'front[front] -- HTTP VITE_API_URL: gateway-to-service (confirmado) --> api[api]',
]){const {root,canary}=fixture(),p=path.join(root,'definicion/arquitectura.md');fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('front[front] -->|"HTTP vía VITE_API_URL"| api[api]',syntax));assert.deepEqual(checkM(root,canary),{ok:true,reason:'M correcto, incluye dos repos, conexión y reconstrucción'},syntax);}});
test('M: conserva el control negativo de flecha sin etiqueta',()=>{const {root,canary}=fixture(),p=path.join(root,'definicion/arquitectura.md');fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('front[front] -->|"HTTP vía VITE_API_URL"| api[api]','front[front] --> api[api]'));assert.deepEqual(checkM(root,canary),{ok:false,reason:'M: flecha front → api sin etiqueta'});});
test('M: resuelve repos por ID exacto antes de buscar nombres en etiquetas de otros nodos',()=>{const {root,canary}=fixture(),p=path.join(root,'definicion/arquitectura.md'),source=fs.readFileSync(p,'utf8').replace('front[front] -->|"HTTP vía VITE_API_URL"| api[api]','front["front — repo; archivo api.ts"] -.->|"Posible destino (inferido)"| api[api]');fs.writeFileSync(p,source);assert.deepEqual(checkM(root,canary),{ok:true,reason:'M correcto, incluye dos repos, conexión y reconstrucción'});});
test('M: IDs alternativos y etiquetas Mermaid enriquecidas son válidos; el esqueleto de skill pasa',()=>{const {root,canary}=fixture(),p=path.join(root,'definicion/arquitectura.md');fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('front[front] -->|"HTTP vía VITE_API_URL"| api[api]','FE["front (React)"] -->|"HTTP API request, VITE_API_URL"| API_NODE["api service"]'));assert.deepEqual(checkM(root,canary),{ok:true,reason:'M correcto, incluye dos repos, conexión y reconstrucción'});});
test('M: Markdown en celdas Repo y Estado en negrita o en línea son formatos válidos',()=>{const {root,canary}=fixture();for(const name of ['proyecto.md','arquitectura.md']){const p=path.join(root,'definicion',name);fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('## Estado\nBorrador.','**Estado**: **Borrador**'));}const repos=path.join(root,'definicion/repos.md');fs.writeFileSync(repos,fs.readFileSync(repos,'utf8').replace('| api |','| **`api`** |').replace('| front |','| [front](#front) |'));assert.equal(checkM(root,canary).ok,true);});
test('M: acepta Estado en cualquier posición de la línea en los tres documentos',()=>{const {root,canary}=fixture();for(const name of ['proyecto.md','repos.md','arquitectura.md']){const p=path.join(root,'definicion',name),s=fs.readFileSync(p,'utf8');fs.writeFileSync(p,s.replace(/(?:## Estado\nBorrador\.|Estado: borrador\.)/g,'Modo: actual. Estado: borrador.'));}assert.equal(checkM(root,canary).ok,true);});
test('M: instantánea ausente hace no evaluable y falla',()=>{const {root,canary}=fixture();fs.unlinkSync(rutaInstantanea(root));assert.deepEqual(checkM(root,canary),{ok:false,reason:'instantánea inicial ausente: comprobación no evaluable'});});
test('M: cada variante aislada devuelve exactamente sus motivos esperados',()=>{const {root,canary}=fixture();for(const [name,expected] of cases){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'var-m-'));fs.cpSync(root,dir,{recursive:true});fs.copyFileSync(rutaInstantanea(root),rutaInstantanea(dir));corrupt(dir,name,canary);const out=checkM(dir,canary);assert.equal(out.ok,false,name);assert.deepEqual(out.reason.split('; '),expected,name);}});
