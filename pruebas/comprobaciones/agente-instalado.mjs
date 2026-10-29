import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const tool=process.argv[2],home=process.env.HOME||'',base=tool==='claude-code'?(process.env.CLAUDE_CONFIG_DIR||path.join(home,'.claude')):(process.env.PI_CODING_AGENT_DIR||path.join(home,'.pi/agent'));
function valid(file){const text=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';return ['definitions/','AGENTS.md','initialize.sh'].every(s=>text.includes(s))&&!['definicion/','clonar.sh'].some(s=>text.includes(s));}
if(!['claude-code','pi'].includes(tool)){console.error('herramienta inválida');process.exit(2);}
const installed=tool==='claude-code'?(process.env.FLUCASTR_CLAUDE_AGENT||path.join(base,'agents/arquitecto.md')):(process.env.FLUCASTR_PI_AGENT||path.join(base,'agents/arquitecto.md'));
if(!valid(installed)){console.error(`agente instalado ausente u obsoleto: ${installed}`);process.exit(1);}
if(tool==='pi'){const launcher=process.env.FLUCASTR_PI_BIN||'pi-arquitecto',resolved=path.isAbsolute(launcher)?launcher:(spawnSync('which',[launcher],{encoding:'utf8'}).stdout||'').trim(),script=resolved&&fs.existsSync(resolved)?fs.readFileSync(resolved,'utf8'):'';if(!script.includes('--append-system-prompt')){console.error(`lanzador Pi no verificable: ${launcher}`);process.exit(1);}const match=script.match(/RAIZ="([^"]+)"/);if(match&&!valid(path.join(match[1],'agentes/arquitecto.md'))){console.error('el prompt que utiliza el lanzador Pi está obsoleto');process.exit(1);}}
console.log(`agente y lanzador instalados vigentes: ${installed}`);
