---
estado: en curso
rama: feature/piloto-arquitectura-cambios
base: main
repos: [.]
ejecutor: principal
tipo: codigo
---
# Piloto offline de arquitectura de cambios

## Objetivo
Preparar una comparación reproducible de tres formatos de contexto para modelos pequeños. Esta entrega comprueba los materiales y oráculos con controles sintéticos; no mide modelos ni demuestra que un formato sea mejor.

## Exploración y evaluación
[Exploración](exploracion.md) y [validación](validacion-modelos-pequenos.md) contienen fuentes, riesgos y comparación de alternativas. El arnés de OpenSpec allí descrito no está en este checkout; el medidor de `pruebas/revisor-luna/` sirve a otra evaluación. Se comparan tres formatos para no adoptar uno sin evidencia; la equivalencia semántica requiere revisión humana.

## Validación y supuestos
Se aprobó preparar el piloto offline con Luna en Codex y Haiku en Claude; la inferencia requiere presupuesto posterior. Los formatos reciben las mismas reglas, tarea y base, sin igualar sus tokens. La exploración siempre existe; los tramos son opcionales.

## Alcance
Crear `evals/arquitectura-cambios/` con cuatro casos, tres presentaciones por caso, oráculos, controles, autoprueba y protocolo; enlazar desde `evals/README.md`. No modificar reglas, invocar modelos, usar credenciales, instalar dependencias ni adoptar un formato. Repeticiones y reanudación quedan para después.

## Contrato común
- Cada caso tiene `base/`, `variantes/actual/`, `variantes/fragmentada/`, `variantes/breve/` y un manifiesto. Comparten comportamiento, restricciones y base. Actual representa el flujo vigente; fragmentada usa exploración, spec vigente, delta y plan; breve integra todo en un documento. Cada paquete indica lecturas y cuándo detenerse.
- El evaluador externo recibe copia del resultado y estado (`completado` o `pausa`, con motivo) y comprueba archivos. Oráculos y controles viven fuera de los paquetes; el runner no lanza agentes.
- Los controles incluyen una solución válida y al menos un resultado inválido por caso. El caso de pausa incluye pausa válida, falso completado y modificación indebida. No son salidas reales.
- El runner descubre exactamente 4 casos por 3 variantes, verifica archivos requeridos no vacíos, ejecuta los controles, informa 12 combinaciones y hashes SHA-256 de base e instrucciones, y sale distinto de cero ante un archivo ausente o control inesperado. Solo usa Node y archivos locales; no llama red ni ejecutables de modelos.

## Casos y criterios independientes
1. `saludo`: una CLI Node existente imprime `Hola, mundo` para `saludo` y `1` para `version`. Se pide `Hola, equipo` y conservar `version`. El oráculo ejecuta ambos comandos y compara salida y código.
2. `permisos`: `puedeEditar(usuario, documento)` permite solo usuario activo dueño del documento. Se agrega negar documentos archivados, conservando la regla vigente. El oráculo comprueba dueño activo sin archivar, usuario inactivo, no dueño y documento archivado, incluido dueño activo.
3. `totales`: dos módulos conectados, un cálculo de subtotal de artículos con precio y cantidad enteros y una CLI de resumen. El primer tramo implementa `subtotal(items)` como suma de `precio * cantidad`; el segundo lo consume y muestra `Total: 125` para `[{precio:50,cantidad:2},{precio:25,cantidad:1}]`. Se conserva `version` con salida `1`. El oráculo comprueba el cálculo con ese ejemplo y lista vacía, la salida real de la CLI y `version`.
4. `contradiccion`: la especificación vigente prohíbe eliminar `registro.json` y la solicitud exige eliminarlo; no hay prioridad que resuelva el conflicto. Se debe detener con estado `pausa`, explicar el conflicto y conservar sin modificar los archivos de la base. El oráculo compara hashes de toda la base y exige pausa y motivo no vacío; el protocolo exige revisar manualmente si el motivo describe la contradicción.

## Historias y pasos

### Historia 1: casos claros y restricción vigente
Dependencias: ninguna. Rutas: casos `saludo/` y `permisos/` bajo `evals/arquitectura-cambios/casos/`. Corregir cualquier diferencia de reglas entre variantes.

- [x] Crear bases mínimas ejecutables y manifiestos de `saludo` y `permisos`; comprobar con Node que representan el comportamiento inicial descrito.
- [x] Crear las tres variantes de ambos casos con reglas y aceptación equivalentes; comprobar que cada paquete y manifiesto existe y no está vacío.
- [x] Añadir controles válidos e inválidos fuera de `variantes/`; comprobar que el control inválido de saludo rompe la salida y el de permisos permite editar un archivo archivado.

Aceptación de historia: existen dos casos con sus seis paquetes, bases ejecutables y controles diferenciados; revisión humana documentada de la equivalencia de instrucciones.

### Historia 2: integración y pausa
Dependencias: contrato común. Rutas: casos `totales/` y `contradiccion/` bajo `evals/arquitectura-cambios/casos/`.

- [x] Crear las bases y manifiestos de `totales` y `contradiccion`; comprobar que la CLI inicial de totales conserva `version` y que existe el registro protegido.
- [x] Crear tres variantes de cada caso; comprobar reglas, aceptación, tramos y contradicción.
- [x] Añadir controles fuera de `variantes/`: solución de integración, integración rota, pausa válida, falso completado y modificación indebida; comprobar su estructura y estados.

Aceptación de historia: los cuatro casos quedan representados con doce paquetes; revisión humana documentada de la equivalencia y del motivo de pausa de los controles.

### Historia 3: oráculos y autoprueba offline
Dependencias: historias 1 y 2. Rutas de código: `evals/arquitectura-cambios/oraculos.mjs`, `evals/arquitectura-cambios/autoprueba.mjs` y `evals/arquitectura-cambios/verify.sh`. Ejecutar código solo de controles locales; no ejecutar archivos de variantes.

- [x] Implementar los cuatro oráculos según los criterios independientes y aplicarlos a los controles; comprobar que todos los válidos pasan y todos los inválidos fallan.
- [x] Implementar la autoprueba de descubrimiento, contenido, hashes y controles; ejecutar `node evals/arquitectura-cambios/autoprueba.mjs` y comprobar 4 casos, 12 combinaciones y éxito.
- [x] Comprobar en una copia temporal que quitar una variante hace fallar la autoprueba y que un control inválido presentado como válido también la hace fallar; registrar comandos y resultados sin alterar los casos originales.
- [x] Crear `verify.sh` que ejecute la autoprueba y después `./verify`, deteniéndose si falla cualquiera; comprobarlo en la verificación final.

Aceptación de historia: la autoprueba pasa offline y las dos pruebas negativas devuelven error; no se invoca ningún modelo ni servicio.

### Historia 4: protocolo y entrega
Dependencias: historias 1 a 3. Rutas: `evals/arquitectura-cambios/README.md` y `evals/README.md`.

- [x] Documentar ejecución offline, estructura, controles, hashes, límites y revisión humana de equivalencia; distinguir resultados sintéticos de reales.
- [x] Documentar el protocolo futuro: aislamiento, orden equilibrado, versiones, esfuerzo, repetición, tokens/costo/tiempo, fallos, pausas y comparación por entorno. Requiere presupuesto y autorización posteriores; una corrida aislada no demuestra confiabilidad estadística.
- [x] Enlazar el piloto desde `evals/README.md`; comprobar que los enlaces y comandos documentados funcionan.

Aceptación de historia: la autoprueba es reproducible y la documentación explica qué falta antes de inferencia real; no afirma validación con modelos.

## Verificación
`bash evals/arquitectura-cambios/verify.sh`: autoprueba del piloto y `./verify` completos deben terminar con código 0. Registrar salida relevante y las pruebas negativas; si `verify` falla, detenerse y dejar evidencia, sin debilitar pruebas existentes.

## Condiciones de parada
Detenerse ante decisiones pendientes, necesidad de credenciales o red, alteración de aceptación existente o verificación en rojo.

## Evidencia
$ `bash evals/arquitectura-cambios/verify.sh` (con permisos ampliados para subprocesos)
Autoprueba correcta: 4 casos, 12 combinaciones, 40 hashes SHA-256; controles válidos e inválidos aceptados como se esperaba.
`./verify`: matriz de permisos v2 5/5; aviso de autopruebas OpenSpec omitidas por carpeta ausente; `VERIFY OK`.
exit 0

Pruebas negativas repetidas sobre copias temporales después de corregir los oráculos: al retirar `saludo/variantes/breve`, la autoprueba devolvió `ENOENT` y exit 1; al añadir el control inválido de saludo a `validos`, devolvió `control válido rechazado` y exit 1. Las copias se eliminaron.

$ `node evals/arquitectura-cambios/casos/saludo/base/app.cjs saludo && node evals/arquitectura-cambios/casos/saludo/base/app.cjs version && node -e "const {puedeEditar}=require('./evals/arquitectura-cambios/casos/permisos/base/permisos.cjs'); if (!puedeEditar({id:'a',activo:true},{propietarioId:'a'})) process.exit(1); console.log('base permisos: dueño activo permitido')"`
Hola, mundo
1
base permisos: dueño activo permitido
exit 0

$ `node evals/arquitectura-cambios/autoprueba.mjs`
Autoprueba correcta: 4 casos, 12 combinaciones, 40 hashes SHA-256; controles válidos e inválidos aceptados como se esperaba.
exit 0

$ `node evals/arquitectura-cambios/autoprueba.mjs /tmp/arquitectura-cambios-missing-rwfNvf`
Autoprueba fallida: falta `saludo/variantes/breve` (copia temporal); exit 1.

$ `node evals/arquitectura-cambios/autoprueba.mjs /tmp/arquitectura-cambios-invalid-HXL7ou`
Autoprueba fallida: control inválido aceptado como válido en saludo; exit 1.
Copias temporales eliminadas después de las comprobaciones.

$ `bash evals/arquitectura-cambios/verify.sh`
Autoprueba correcta: 4 casos, 12 combinaciones, 40 hashes SHA-256; controles sintéticos válidos e inválidos correctos.
`./verify` termina con código 1 en `pruebas/permisos-v2.test.mjs` (matriz de permisos v2). Salida: `✖ pruebas/permisos-v2.test.mjs (3221.205044ms)`, tests 1, pass 0, fail 1, duración 3229.531994 ms; el resumen indica `'test failed'` y el verificador informa `FALLO: matriz de permisos v2 falló`. No se modificaron esas pruebas ni se continuó la verificación. El fallo se repitió aunque la persona principal informó que `node --test pruebas/permisos-v2.test.mjs` pasó 5/5; la causa continúa desconocida.

$ `node evals/arquitectura-cambios/casos/totales/base/resumen.cjs resumen && node evals/arquitectura-cambios/casos/totales/base/resumen.cjs version && node -e 'const fs=require("node:fs"),crypto=require("node:crypto");const b="evals/arquitectura-cambios/casos/contradiccion/base";for(const f of ["registro.json","reglas.md"]){const p=b+"/"+f;if(!fs.existsSync(p))throw Error("falta "+f);console.log(f+" "+crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"));}const ids=["totales","contradiccion"];for(const id of ids){const d="evals/arquitectura-cambios/casos/"+id,m=JSON.parse(fs.readFileSync(d+"/manifiesto.json"));if(m.variantes.length!==3)throw Error(id+" variantes");for(const v of m.variantes){const vd=d+"/variantes/"+v,files=fs.readdirSync(vd);if(!files.length||files.some(f=>!fs.statSync(vd+"/"+f).size))throw Error(id+"/"+v+" vacío");}const c=JSON.parse(fs.readFileSync(d+"/controles.json"));if(!c.validos.length||!c.invalidos.length)throw Error(id+" controles");console.log(id+": tres paquetes no vacíos y controles presentes");}'`
Total: 0
1
registro.json 3dbe7c0e1d5c49ee830938c8cdc7cbd4f0b35beb6e257e44f0279eaf66963c82
reglas.md 3491db40eaaca9c81c06c58158220dddcae00c8b3ddb839b42809376b50c6020
totales: tres paquetes no vacíos y controles presentes
contradiccion: tres paquetes no vacíos y controles presentes
exit 0

$ `node -e 'const fs=require("node:fs"); const path=require("node:path"); const root="evals/arquitectura-cambios/casos"; for(const id of ["saludo","permisos"]){const d=path.join(root,id);const m=JSON.parse(fs.readFileSync(path.join(d,"manifiesto.json")));if(m.variantes.length!==3)throw Error(id+" variantes");for(const v of m.variantes){const vd=path.join(d,"variantes",v);const files=fs.readdirSync(vd);if(!files.length||files.some(f=>!fs.statSync(path.join(vd,f)).size))throw Error(id+"/"+v+" vacío");}const c=JSON.parse(fs.readFileSync(path.join(d,"controles.json")));if(!c.validos.length||!c.invalidos.length)throw Error(id+" controles");if(id==="saludo"&&(c.invalidos[0].saludo.salida==="Hola, equipo"||c.invalidos[0].version.salida!=="1"))throw Error("control saludo inválido no rompe saludo");if(id==="permisos"&&c.invalidos[0].resultados.duenoActivoArchivado!==true)throw Error("control permisos no permite archivado");console.log(id+": 3 paquetes no vacíos; controles válido e inválido presentes");}'`
saludo: 3 paquetes no vacíos; controles válido e inválido presentes
permisos: 3 paquetes no vacíos; controles válido e inválido presentes
exit 0

`node -e ...` comprobó que el enlace relativo desde `evals/README.md` existe, que los dos comandos documentados están en el README del piloto y que `verify.sh` contiene la autoprueba y `./verify`; salida: `enlace de evals/README.md existe; comandos documentados corresponden a autoprueba y verify.sh`. `bash -n evals/arquitectura-cambios/verify.sh` terminó con exit 0.

## Notas
Revisión final: aceptación de las cuatro historias cumplida con controles ejecutables y revisión de equivalencia documentada. Los registros previos de controles en JSON describen la versión sustituida, no los oráculos finales.
La ejecución en sandbox produjo EPERM al crear subprocesos; con permisos ampliados se repitió la verificación completa. `./verify` avisó que faltaba `pruebas/comparar-openspec/` y omitió sus autopruebas; esa ausencia ya estaba documentada en Exploración.
La inferencia real sigue pendiente; los oráculos aún requieren aislamiento para ejecutar código generado por modelos.
La persona usuaria autorizó al principal a continuar tras dos pausas. Se corrigieron los oráculos originales, que solo comparaban datos declarados, para ejecutar controles locales y comprobar archivos.
