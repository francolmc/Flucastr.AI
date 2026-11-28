## Evidence

$ node tests/spawn-seguro/run.mjs
ok - A1 sin stdio ni input: stdin cerrado, cat termina con stdout vacío
ok - A2 con input: el hijo recibe el texto y no quedan restos temporales
ok - A2 execFileSyncSeguro con input devuelve el texto y no deja restos
ok - A2 execFileSyncSeguro sin input: stdin cerrado
ok - A3 stdio explícito: el helper no lo cambia (stdout null con inherit)
control: spawnSync crudo status=0 stdout="hola" (sin helper)
ok - control: spawnSync crudo con input coincide con el helper
6 casos pasaron
exit 0

$ node --input-type=module -e 'import { spawnSync } from "node:child_process"; import { mkdtempSync, openSync, closeSync, statSync, rmSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path"; const dir=mkdtempSync(join(tmpdir(),"maxbuffer-probe-")); const file=join(dir,"out"); const fd=openSync(file,"w"); let r; try { r=spawnSync(process.execPath,["-e","process.stdout.write(Buffer.alloc(16*1024*1024))"],{stdio:["ignore",fd,"ignore"],maxBuffer:1024}); } finally { closeSync(fd); } console.log(JSON.stringify({status:r.status,error:r.error?.code,signal:r.signal,bytes:statSync(file).size,maxBuffer:1024})); rmSync(dir,{recursive:true,force:true});'
{"status":0,"error":null,"signal":null,"bytes":16777216,"maxBuffer":1024}
exit 0

$ node --input-type=module -e 'import { spawnSyncSeguro } from "./tools/spawn/sync-seguro.mjs"; const r = spawnSyncSeguro(process.execPath, ["-e", "process.stdout.write(\"x\".repeat(4096))"], { maxBuffer: 1024 }); console.log(JSON.stringify({ status: r.status, error: r.error?.code, stdoutBytes: r.stdout?.length }));'
{"status":null,"error":"ENOBUFS","stdoutBytes":4096}
exit 0

## Notes
- Segmento 1 detenido antes de cambios de código: la aceptación exige conservar el límite `maxBuffer` y detener al hijo al excederlo. Con stdout conectado a pipe, Node entrega `ENOBUFS` y mata al proceso; sustituir ese pipe por un fd de archivo elimina la supervisión nativa y leer el tamaño después permitiría crecimiento sin límite durante la ejecución.
- El camino síncrono bloquea el hilo mientras `spawnSync` espera. Una cuota supervisada requiere un proceso supervisor externo o rediseñar el contrato/alcance; no se implementa una salida por archivo que debilite el límite. El camino async puede vigilar archivos, pero no resuelve el síncrono compartido por consumidores de aceptación.
- Hecho 0/5 TODO. Pasó el baseline `node tests/spawn-seguro/run.mjs`; no se cambiaron los archivos de producto ni pruebas. `node scripts/kit-nota.mjs ... blocked` registró la pausa.
- Siguiente paso: revisar diseño/alcance para permitir un supervisor acotado aplicable a los caminos sync y async, o mantener pipes y tratar la pérdida del sandbox con una solución upstream compatible. Retomar desde el primer TODO cuando el diseño esté aprobado.
- `changes/fix-captura-sandbox/probe.mjs` permanece intacto; no se ha intentado borrarlo ni eludir controles. A1 y A2 quedan sin demostrar en Codex sandbox real.

- D-03: intentar supervisor durante ejecución para salida en archivos, acotado, con pruebas de límites, señal y timeout en ambos caminos. El límite debe operar durante la ejecución; validar byte multibyte, truncado y limpieza. Si no se puede preservar la semántica, PAUSED motivo=design con medición precisa. No modificar ni borrar el sondeo cuyo borrado fue denegado.
- Reanudación D-03: prueba directa de `spawnSync` con stdout por fd de archivo terminó `status=0` y escribió 16 MiB con `maxBuffer=1 KiB`; por tanto el límite de Node no vigila archivos. Un supervisor que mida el archivo después tampoco lo limita durante la ejecución; sondear por intervalos deja una ventana de crecimiento sin tope estricto. Capturar en pipes bajo el supervisor volvería al transporte que pierde la salida en el sandbox. No hay implementación dentro del Scope que se haya demostrado capaz de conservar el límite síncrono.
- Hecho 0/5 TODO en este intento. Se repitió el bloqueo de diseño con `kit-nota`; no hay cambios de código. El baseline previo sigue pasando, pero A1/A2 y la repetición sandbox no están verificados. `probe.mjs` continúa intacto.
- Retomar: resolver upstream la pérdida de pipe sin cambiar la API, o aprobar formalmente un contrato/cambio de alcance para un mecanismo de salida acotado con límites distintos y pruebas de carga/señales/timeout. No afirmar que el sandbox quedó corregido.
