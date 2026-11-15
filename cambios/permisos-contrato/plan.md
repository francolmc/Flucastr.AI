---
estado: listo
rama: feature/permisos-contrato
base: main
repos: [.]
ejecutor: constructor
tramo: 2
---

# Permisos según el contrato del proyecto

## Objetivo

Reducir las aprobaciones de pruebas cuando la herramienta pueda conservar las restricciones pedidas, sin ensanchar el sandbox ni usar modos que eliminen las aprobaciones. Principal, constructor y `kit run` deben recibir la misma política efectiva para la herramienta correspondiente.

## Supuestos y límites

- La garantía cubre acciones directas del agente; los efectos internos de los scripts declarados quedan sujetos a la revisión de Franco en la puerta de evidencia. La formulación permanente va una sola vez en `nucleo/contrato/verificacion.md`.
- Codex no permite condicionar un `prefix_rule` al estado Git del script, y sus reglas de comandos no gobiernan la lectura mediante sus herramientas de archivos. Por tanto, no se puede asegurar aquí que toda lectura directa de `.env` o llaves pida aprobación en Codex. Tampoco se asegura allí la ejecución preaprobada de scripts: se conserva la solicitud de aprobación. No se presenta esa herramienta como equivalente a Claude ni se debilita el sandbox para simularlo.
- Una regla de prefijo acepta argumentos adicionales; no equivale a un comando exacto. Ningún `allow` de Codex puede concederse si sus argumentos adicionales permiten una acción protegida. Si no se puede demostrar seguridad, queda sin `allow`. En Claude, la inspección debe considerar tanto Bash como las herramientas de lectura; si no puede preservar las restricciones, pedir aprobación y registrar la limitación.
- El resultado de ejecución automática con script intacto y solicitud tras modificarlo se exige para Claude Code. En Codex se verifica que el comando de script no obtiene `allow`; la lectura directa de secretos sigue siendo una limitación explícita. Pi queda como está. La aprobación de este plan no amplía esas garantías.
- No se presupone que `./verify` sea capacidad declarada: si falta la línea correspondiente, no obtiene permiso automático. Tampoco se inventan capacidades ausentes.

## Alcance y decisiones

- Leer únicamente las líneas de capacidad del `AGENTS.md` del proyecto (comprobación rápida, servicio y aceptación); sumar revisar-plan, diagnosticar y lectura `git status`, `git diff`, `git log`, `ls`, `rg` solo cuando la herramienta pueda aplicar la restricción con seguridad. Los comandos declarados se comparan completos, no por prefijo. No interpretar expresiones de shell ni aceptar sustituciones, redirecciones, tuberías o encadenamientos como un único comando exacto; ante ambigüedad, pedir aprobación.
- Eliminar los `allow` amplios existentes de `scripts/resolver.mjs`, entre ellos `npm run`, `docker compose` y `bash -lc`. No autorizar prefijos de intérprete ni `bash -c`, `sh -c`, `node -e` o `python -c`. Un comando declarado que invoque un archivo concreto, como `node verificacion/rapida.mjs`, no es un permiso para `node` en general.
- Mantener sin excepciones la solicitud o bloqueo de acciones directas protegidas: commit, push, PR, merge, despliegue, lectura de `.env` o llaves y borrado fuera de `pruebas/.temporales`; Docker solo puede autorizarse si el comando concreto está declarado y sus efectos directos no infringen esas reglas. Se conservan los deny existentes y se comprueban las interacciones con la configuración previa; nunca se borra una regla ajena.
- El hook de Claude comprueba antes de autorizar el comando exacto que `verify`, `verificacion/rapida.mjs` y cualquier archivo de script correspondiente al comando estén sin cambios frente a HEAD, incluidos cambios preparados, no preparados, archivos nuevos o ausentes. No deducir sin evidencia el script detrás de gestores o comandos indirectos; si no puede identificarse inequívocamente, si Git falla o si hay una ruta insegura, pedir aprobación. La comprobación de scripts de cada comando cubre tanto rutas explícitas como el archivo del ejecutable cuando sea un script del proyecto.
- La instalación debe actualizar su configuración generada sin duplicar ni borrar configuración ajena; la política generada se usa en las dos funciones y en `kit run`, sin crear una vía paralela más permisiva. Pi y el sandbox quedan fuera del cambio.
- La evidencia histórica de Don Financio muestra escalaciones de Docker, pero no acredita por sí sola un fallo de loopback: registrar el comando y su resultado solo si se encuentra evidencia; si no, anotarlo como pendiente de reproducción, sin afirmar que falló.

## Escenarios y aceptación

1. Proyecto temporal con capacidad rápida explícita y script versionado limpio: Claude ejecuta exactamente ese comando sin pedir aprobación; tras modificar o preparar el script, pide aprobación. También pide si `verify` o `verificacion/rapida.mjs` protegido difiere de HEAD, si falta HEAD o si no puede identificar el script.
2. Sin declaración de una capacidad, esa capacidad no tiene aprobación automática. Variantes con argumentos, encadenamientos, redirecciones e intérpretes en modo evaluación no quedan autorizadas por coincidencia parcial. Se prueban `npm run` y `docker compose` no declarados, y comandos Docker distintos del declarado.
3. Claude solicita aprobación o bloquea intentos directos de commit, push, PR, merge, despliegue, lectura de `.env` o llaves y borrado fuera de `pruebas/.temporales`, incluidos intentos desde lectura y búsqueda. Se prueban las herramientas y sintaxis efectivamente soportadas; las que no puedan cubrirse se informan y no se presentan como garantizadas.
4. En Codex las pruebas de `execpolicy` verifican que siguen bloqueados los casos protegidos existentes, que ningún script dependiente del estado Git recibe `allow` y que no aparecen permisos amplios. Se documenta que ni `prefix_rule` ni este cambio garantizan la lectura directa de secretos. No se promete que Codex pida aprobación para esa lectura.
5. Principal y constructor reciben la misma política de su herramienta y `kit run` la respeta. Reinstalar es idempotente y preserva reglas ajenas. Pi permanece sin cambios.
6. `verify` deja de exigir 41 reglas y la enumeración fija de permisos amplios; comprueba estructura y decisiones, compara cada `allow` con la lista generada segura y rechaza intérpretes como prefijos, comodines ajenos a dicha lista y permisos amplios. Conserva las pruebas negativas pertinentes. El diagnóstico de sandbox queda en `friccion.md` con fuentes y sin reparación.

## Verificación

En cada tramo ejecutar las pruebas indicadas y registrar salida y código. En el último ejecutar `./verify` completo. Las pruebas de integración de Claude usan un proyecto Git temporal con comandos y archivos inocuos; comprueban decisiones del hook y, si Claude está disponible, su integración real. Registrar explícitamente cualquier prueba real no ejecutada; no sustituirla por una afirmación de éxito. No leer archivos de secretos reales.

## Pasos

Los pasos y verificaciones por tramo están en [tramos.md](tramos.md). El constructor recibe este índice y ese archivo.

## Evidencia

`node --test pruebas/permisos-contrato/generacion.test.mjs` — pasa: 2 pruebas, 0 fallidas (Node 22; 2026-11-15). La primera corrida dentro del sandbox terminó con `EPERM` al crear procesos hijos; repetida fuera del sandbox, ambas pruebas pasaron. El caso verifica que `instalar.sh` transmite `AGENTS.md`, la reinstalación es idempotente, se conservan los deny y no reaparecen los `allow` amplios. Tras la devolución, la prueba confirma que el único `allow` es `ls` y ya no incluye `git status`.

Limitación de Codex: `prefix_rule` permite argumentos adicionales, por lo que no se generan `allow` para comandos declarados que ejecuten scripts, Docker ni comandos que puedan leer contenido. Se mantiene únicamente `ls` como lectura de metadatos; se retiró `git status` porque `--verbose` puede mostrar contenido preparado. Las capacidades se leen y filtran para rechazar sintaxis ambigua; la lectura directa de secretos por herramientas de archivos no queda protegida por reglas de comandos.

## Notas

- Revisión tramo 1: existe la generación conservadora y se retiraron los permisos amplios.
- Está conectada a la instalación real de Codex, probada en un proyecto temporal.
- La prueba utiliza un `AGENTS.md` de proyecto y conserva reglas entre reinstalaciones.
- Deny y configuración ajena: el diff conserva la lógica previa; falta una prueba explícita de archivo ajeno para el siguiente tramo.
- Verificación del principal: 2/2 pruebas aprobadas fuera del sandbox; el tramo 2 queda aprobado.
- Revisión atendida: retirado el permiso `git status` sin restricción efectiva; `.gitignore` incluye solo `!pruebas/permisos-contrato/` para que el test quede versionado. Verificación y evidencia actualizadas en `tramos.md`.
- Tramo 1 listo: se eliminaron los `allow` amplios de Codex, `instalar.sh` pasa el `AGENTS.md` del proyecto y la instalación repetida conserva reglas idénticas. Próximo: tramo 2, hook de Claude y uso de la política en `kit run`.
- Si la integración real de Claude no permite imponer la revisión antes del permiso automático o proteger una acción directa exigida, no instalar ese permiso y devolver el resultado como limitación, sin afirmar cumplimiento.
- La garantía de lectura de secretos en Codex requiere otra decisión técnica fuera de este alcance; el plan no afirma resolverla. No cambiar Pi ni el sandbox.
