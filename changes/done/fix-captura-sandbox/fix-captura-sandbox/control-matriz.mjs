import { spawnSyncMediado } from '../../tools/spawn/sync-seguro.mjs';
for(const [name,exe,args,input] of [['node',process.execPath,['-e','process.stdout.write("child-ok");process.stderr.write("err-ok")'],undefined], ['cat','/bin/cat',[], 'cat-ok']]) {
 const r=spawnSyncMediado(exe,args,{input,encoding:'utf8',timeout:5000});
 console.log(JSON.stringify({name,status:r.status,signal:r.signal,error:r.error?.message,stdout:r.stdout,stderr:r.stderr}));
 if(r.status!==0||r.stdout!==(name==='node'?'child-ok':'cat-ok')||r.stderr!==(name==='node'?'err-ok':'')) process.exitCode=1;
}
