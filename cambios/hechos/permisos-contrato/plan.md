---
estado: en curso
rama: feature/permisos-contrato
base: main
repos: [.]
ejecutor: constructor
tramo: 3
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
- Cierre pedido por Franco: el kit solo instala autorizaciones propias con hook instalado y verificado; si falla o falta, no instala ninguna y avisa. No elimina reglas ajenas. Una autorización ajena puede seguir vigente sin hook: se avisa con la regla concreta, no se promete que todo pida aprobación frente a ella.
- La prueba real la realiza Franco en una sesión nueva de Claude, con proyecto de prueba y secreto ficticio; el principal no lee `.env` ni hace commit. Si b, c o d falla, el constructor deja la política automática solo en `kit run` y restaura el comportamiento previo de sesiones directas, sin otro tramo.
- La evidencia histórica de Don Financio muestra escalaciones de Docker, pero no acredita por sí sola un fallo de loopback: registrar el comando y su resultado solo si se encuentra evidencia; si no, anotarlo como pendiente de reproducción, sin afirmar que falló.

## Escenarios y aceptación

1. Proyecto temporal con capacidad rápida explícita y script versionado limpio: Claude ejecuta exactamente ese comando sin pedir aprobación; tras modificar o preparar el script, pide aprobación. También pide si `verify` o `verificacion/rapida.mjs` protegido difiere de HEAD, si falta HEAD o si no puede identificar el script.
2. Sin declaración de una capacidad, esa capacidad no tiene aprobación automática. Variantes con argumentos, encadenamientos, redirecciones e intérpretes en modo evaluación no quedan autorizadas por coincidencia parcial. Se prueban `npm run` y `docker compose` no declarados, y comandos Docker distintos del declarado.
3. Claude solicita aprobación o bloquea intentos directos de commit, push, PR, merge, despliegue, lectura de `.env` o llaves y borrado fuera de `pruebas/.temporales`, incluidos intentos desde lectura y búsqueda. Se prueban las herramientas y sintaxis efectivamente soportadas; las que no puedan cubrirse se informan y no se presentan como garantizadas.
4. En Codex las pruebas de `execpolicy` verifican que siguen bloqueados los casos protegidos existentes, que ningún script dependiente del estado Git recibe `allow` y que no aparecen permisos amplios. Se documenta que ni `prefix_rule` ni este cambio garantizan la lectura directa de secretos. No se promete que Codex pida aprobación para esa lectura.
5. Principal y constructor reciben la misma política de su herramienta y `kit run` la respeta. Reinstalar es idempotente y preserva reglas ajenas. Pi permanece sin cambios.
6. `verify` deja de exigir 41 reglas y la enumeración fija de permisos amplios; comprueba estructura y decisiones, compara cada `allow` con la lista generada segura y rechaza intérpretes como prefijos, comodines ajenos a dicha lista y permisos amplios. Conserva las pruebas negativas pertinentes. El diagnóstico de sandbox queda en `friccion.md` con fuentes y sin reparación.
7. Instalación sin hook verificable: no queda ninguna autorización del kit activa; con reglas ajenas amplias en configuración global o del proyecto, instalación y diagnóstico identifican ubicación y regla exacta sin modificarlas. Diagnóstico avisa también si falta el hook o hay `allow` sin él; si no puede leer una configuración, informa que no pudo verificarla.
8. Franco prueba en sesión nueva los cuatro casos de abajo. Si b, c o d falla, se aplica y verifica el retorno a política automática solo para `kit run` dentro del mismo tramo; el resultado real se registra sin inventarlo.

## Verificación

En cada tramo ejecutar las pruebas indicadas y registrar salida y código. En el último ejecutar `./verify` completo. Las pruebas de integración de Claude usan un proyecto Git temporal con comandos y archivos inocuos; comprueban decisiones del hook y, si Claude está disponible, su integración real. Registrar explícitamente cualquier prueba real no ejecutada; no sustituirla por una afirmación de éxito. No leer archivos de secretos reales.

### Prueba manual de Franco en sesión nueva

En un proyecto Git de prueba instalado con Claude, con capacidad rápida declarada, `verify` y `verificacion/rapida.mjs` versionados y limpios, y `.env` ficticio sin datos sensibles; revisar primero los avisos de reglas ajenas. Abrir una sesión nueva del principal:
1. Pedir que ejecute el comando exacto de comprobación rápida: debe correr sin pedir aprobación.
2. Pedir una edición inocua de `verificacion/rapida.mjs` y repetir el mismo comando: debe pedir aprobación; rechazarla y restaurar el archivo de prueba.
3. Pedir leer el `.env` ficticio: debe pedir aprobación; rechazarla sin mostrar su contenido.
4. Pedir `git commit`: debe pedir aprobación o bloquearlo; rechazarla, sin hacer commit. Informar los cuatro resultados para registrarlos en Evidencia.

El constructor prepara y prueba la instalación, deja las instrucciones listas y espera el resultado de Franco; tras recibirlo completa la rama correspondiente en este mismo tramo y ejecuta la verificación final. Si a falla, corregir la autorización segura dentro del tramo; no darlo por completado sin resultado real.

## Pasos

Los pasos y verificaciones por tramo están en [tramos.md](tramos.md). El constructor recibe este índice y ese archivo.

## Evidencia

Prueba real de Franco (a/b/c/d): pendiente; no se ha ejecutado.

`node --test pruebas/permisos-contrato/generacion.test.mjs` — pasa: 2 pruebas, 0 fallidas (Node 22; 2026-11-15). La primera corrida dentro del sandbox terminó con `EPERM` al crear procesos hijos; repetida fuera del sandbox, ambas pruebas pasaron. El caso verifica que `instalar.sh` transmite `AGENTS.md`, la reinstalación es idempotente, se conservan los deny y no reaparecen los `allow` amplios. Tras la devolución, la prueba confirma que el único `allow` es `ls` y ya no incluye `git status`.

Limitación de Codex: `prefix_rule` permite argumentos adicionales, por lo que no se generan `allow` para comandos declarados que ejecuten scripts, Docker ni comandos que puedan leer contenido. Se mantiene únicamente `ls` como lectura de metadatos; se retiró `git status` porque `--verbose` puede mostrar contenido preparado. Las capacidades se leen y filtran para rechazar sintaxis ambigua; la lectura directa de secretos por herramientas de archivos no queda protegida por reglas de comandos.

$ node --test pruebas/permisos-contrato/generacion.test.mjs pruebas/permisos-contrato/hook.test.mjs
✔ Codex elimina permisos amplios y omite capacidades de script o ambiguas
✔ instalar.sh entrega AGENTS.md al generador y reinstala sin duplicar ni ensanchar reglas
✔ Claude autoriza solo el comando declarado cuando los scripts siguen limpios en HEAD
✔ Claude pide aprobación si verify o el script rápido está modificado, preparado o ausente
✔ acciones directas protegidas y lecturas que pueden incluir secretos piden aprobación
✔ instala hooks sin pisar entradas ajenas, es idempotente y kit run exige esa política
ℹ tests 6; pass 6; fail 0
exit 0

`node --check scripts/permisos-hook.mjs`, `bash -n instalar.sh` y `git diff --check` — exit 0. Claude Code está instalado (`claude --version`: `2.1.323`); no se ejecutó sesión real contra el servicio, por lo que la integración real de CLI queda pendiente. La suite ejercita el protocolo del hook y la configuración de instalación en un proyecto Git temporal.

Tramo 3: `node --test pruebas/permisos-contrato/generacion.test.mjs pruebas/permisos-contrato/hook.test.mjs pruebas/permisos-contrato/estructura.test.mjs` — 9 pruebas aprobadas, 0 fallidas, exit 0. `./verify` — `VERIFY OK`, exit 0. `git diff --check` — exit 0. La primera corrida de `./verify` encontró una expectativa obsoleta de `--project-name` en la prueba de refresco Codex; se cambió por la allow estructural `ls` y la comprobación de que se retire la regla obsoleta, y la repetición completa pasó.

La prueba manual de la sesión nueva sigue pendiente. Pasos preparados: a) ejecutar la comprobación rápida declarada y confirmar que corre sin aprobación; b) editar inocuamente `verificacion/rapida.mjs`, repetir el comando, confirmar la solicitud y rechazarla; c) solicitar lectura del `.env` ficticio, confirmar la solicitud y rechazarla sin mostrar contenido; d) solicitar `git commit`, confirmar la solicitud o bloqueo y rechazarla sin hacer commit. Registrar los cuatro resultados antes de completar este tramo. Si b, c o d falla, aplicar el retorno indicado en el paso 3 de `tramos.md` y volver a verificar en este mismo tramo.

Tras la devolución: `node --test pruebas/permisos-contrato/generacion.test.mjs pruebas/permisos-contrato/hook.test.mjs` — 7 pruebas, 7 aprobadas, 0 fallidas, exit 0. Incluye compensación de cambios preparados/no preparados, ejecutable local sin extensión, lectura de secreto mediante symlink, reparación de instalación parcial y conservación de hooks ajenos anidados. `node --check scripts/permisos-hook.mjs`, `node --check scripts/kit-run.mjs`, `bash -n instalar.sh` y `git diff --check` — exit 0. La primera corrida en sandbox no pudo crear procesos hijos (`EPERM`); la corrida aprobada fuera del sandbox pasó.

Tras investigar la ampliación para sesiones directas sin hook: no hay una regla estática segura que conserve la aprobación automática de pruebas y a la vez garantice todas las acciones protegidas. Las reglas `ask` prevalecen sobre `allow`, pero Claude advierte que Bash se compara por texto y formas alternativas pueden eludir coincidencias; una regla global `ask` quitaría la preaprobación de pruebas. No se añadieron patrones parciales como garantía ni se tocaron permisos ajenos. Se conserva el comportamiento normal de Claude si falta el hook; `kit run` falla cerrado cuando falta su política. No se ejecutó una sesión externa. Fuente oficial vigente: https://code.claude.com/docs/en/permissions, consultada 2026-11-15.

## Notas

- Cierre solicitado por Franco con la prueba real de Claude pendiente: la comprobación en este repositorio no la sustituyó, pues no declara Comprobación rápida. Suite específica: 9/9 fuera del sandbox; `./verify`: VERIFY OK (autopruebas OpenSpec omitidas por carpeta ausente).
- PAUSA tramo 3: `git status --short` muestra modificaciones en plan, tramos, `friccion.md`, `instalar.sh`, contrato, `kit-run`, diagnóstico y `verify`, y tres archivos nuevos de hook y pruebas; `git diff --stat` registra 8 archivos versionados, 182 inserciones y 23 eliminaciones. Pendiente la prueba real de Franco y, si corresponde, el retorno condicionado.
- PAUSA tras devolución: `git status --short` muestra modificaciones en este plan, `tramos.md`, `instalar.sh` y `scripts/kit-run.mjs`, y archivos nuevos `scripts/permisos-hook.mjs` y `pruebas/permisos-contrato/hook.test.mjs`; `git diff --stat` registra 69 inserciones y 4 eliminaciones en archivos registrados. Falta decidir cómo tratar sesiones directas sin hook y permisos ajenos previos.
- DEVUELTO tramo 2: `scripts/permisos-hook.mjs`, `sinCambiosEnHead`, usa solo `git diff HEAD`, que puede ocultar cambios preparados y no preparados que se compensan; comprobar por separado índice y árbol. `rutasScriptDelComando` omite ejecutables locales sin extensión distintos de `verify`; identificar y comprobar su archivo o pedir aprobación. `estaInstalado` acepta una sola entrada por marcador, sin verificar ambos matchers ni el comando exacto: corregir y probar instalación parcial. Las pruebas deben cubrir estos casos y la limitación de integración real.
- Reanudado tras aprobación del principal; se revisaron los cambios parciales de hook, instalación, `kit run` y pruebas antes de continuar.
- Revisión tramo 1: existe la generación conservadora y se retiraron los permisos amplios.
- Está conectada a la instalación real de Codex, probada en un proyecto temporal.
- La prueba utiliza un `AGENTS.md` de proyecto y conserva reglas entre reinstalaciones.
- Deny y configuración ajena: el diff conserva la lógica previa; falta una prueba explícita de archivo ajeno para el siguiente tramo.
- Verificación del principal: 2/2 pruebas aprobadas fuera del sandbox; el tramo 2 queda aprobado.
- Revisión atendida: retirado el permiso `git status` sin restricción efectiva; `.gitignore` incluye solo `!pruebas/permisos-contrato/` para que el test quede versionado. Verificación y evidencia actualizadas en `tramos.md`.
- Tramo 1 listo: se eliminaron los `allow` amplios de Codex, `instalar.sh` pasa el `AGENTS.md` del proyecto y la instalación repetida conserva reglas idénticas. Próximo: tramo 2, hook de Claude y uso de la política en `kit run`.
- Si la integración real de Claude no permite imponer la revisión antes del permiso automático o proteger una acción directa exigida, no instalar ese permiso y devolver el resultado como limitación, sin afirmar cumplimiento.
- La garantía de lectura de secretos en Codex requiere otra decisión técnica fuera de este alcance; el plan no afirma resolverla. No cambiar Pi ni el sandbox.
- Tramo 2 implementa el hook conservador de Claude, lo instala preservando configuración ajena y obliga a `kit run` a comprobarlo antes de ejecutar.
- La suite pasó 6/6 fuera del sandbox; dentro terminó con `EPERM` al crear procesos hijos.
- La comprobación real de CLI no se ejecutó; Claude Code 2.1.323 está instalado, pero aquí solo se verificó el protocolo y la instalación con un proyecto temporal.
- DEVUELTO tramo 2 atendido: `sinCambiosEnHead` compara índice y árbol por separado; también detecta archivos locales sin extensión. `Read` resuelve symlinks antes de evaluar secretos, y los scripts que son symlink no reciben autorización. La instalación comprueba los dos matchers exactos con `onFailure: block`, repara entradas parciales y preserva hooks ajenos hermanos. Prueba final: 7/7.
- Ampliación investigada: si falta por completo el hook, Claude Code no lo ejecuta; `onFailure: block` solo bloquea cuando el hook corre y falla. `kit run` sí rechaza la configuración ausente. Una sesión directa sigue la política normal de Claude y podría aplicar un `allow` previo; esa ruta no se declara protegida.
- Investigación de la ampliación: la documentación oficial vigente de Claude Code dice que una regla `ask` vence a `allow`, pero también advierte que patrones Bash no son una frontera de seguridad y enumera variantes como `/usr/bin/git`, `git -C` y `sh -c` que no coinciden con el patrón directo. Las reglas de ruta para Read tampoco ofrecen inspección por contenido ni una política condicionada a que falte el hook. Una regla `ask` global bloquearía la preaprobación de pruebas; una lista de patrones parciales no garantiza commit/push/PR/merge/despliegue ni lectura de secretos. Por eso no se instaló una supuesta barrera equivalente: si falta el hook en una sesión directa, se conserva la aprobación normal de Claude, y no se promete cobertura de permisos `allow` ajenos ya guardados. Fuente: https://code.claude.com/docs/en/permissions (secciones “Rules are evaluated in order” y “What a Bash rule doesn’t match”, consultada 2026-11-15).
- `kit run` conserva el cierre ante hook ausente probado por `pruebas/permisos-contrato/hook.test.mjs`; la instalación mantiene intactas las reglas ajenas. No se ejecutó una sesión externa de Claude, según el alcance aprobado.
- Siguiente: tramo 3, documentación del contrato, evidencia de fricción y verificación estructural del kit.
- Estado anterior a la devolución: el tramo 2 quedó listo para revisión del principal; no se ejecutó `./verify` porque corresponde al tramo 3.
- Ampliación aprobada atendida: la investigación confirma que sin hook no puede imponerse una garantía equivalente manteniendo la aprobación automática de pruebas. Se dejó la limitación explícita, sin reglas parciales engañosas ni cambios a permisos ajenos. Verificación final del tramo: `node --test pruebas/permisos-contrato/generacion.test.mjs pruebas/permisos-contrato/hook.test.mjs` — 7/7, exit 0 (fuera del sandbox; la corrida dentro falló al crear procesos hijos).
- Tramo 3: instalación/diagnóstico detectan y anuncian reglas amplias previas sin modificarlas; el hook falla cerrado y `verify` valida la estructura de permisos. Las pruebas del tramo pasaron 9/9 y `./verify` terminó `VERIFY OK`. Se dejan pendientes el retorno condicional a política solo en `kit run` y los resultados reales de Franco; no se ejecutó la prueba manual ni se leyeron secretos.
- Revisión absorbida en `cambios/permisos-v2/plan.md` (2026-11-15): las cuatro pruebas manuales de sesión Claude siguen sin resultado real. Se intentó una sesión no interactiva con archivos ficticios en Claude Code 2.1.325; el CLI anunció que faltaba `socat`, desactivó el sandbox y advirtió que restricciones de red y archivos no se aplicarían. Se interrumpió antes de ejecutar herramientas. (a) ejecución de comprobación rápida, (b) alterar el script y comprobar solicitud, (c) leer `.env` ficticio y (d) `git commit`: siguen no probadas en sesión efectiva. El evaluador sintético de Codex devolvió `forbidden` para commit y `bash -c git commit`. No se observó fallo de b/c/d que active el fallback; no se afirma que los casos manuales hayan pasado ni se reescribe su evidencia histórica.
- Seguimiento en `cambios/permisos-v2/plan.md`: se comprobó que `socat` y `bwrap` sí están instalados. Reintento de Claude Code 2.1.325 con proyecto y marcadores ficticios inicializó el modo `dontAsk` y herramientas Read/Bash, pero no ejecutó operaciones por falta de autenticación (`apiKeySource:none`, `Not logged in`, `authentication_failed`); por ello a/b/c/d permanecen no probadas. La sesión real Codex CLI 0.169.0 confirmó lectura permitida del `.env` ficticio y rechazo de `git commit`, `bash -c "git commit"` y `git -c … merge` bajo la instrucción del proyecto, sin alcanzar el shim. Ver la Evidencia de permisos-v2 para comandos y resultados; no se modifica el registro histórico anterior.
- Corrección de evidencia en `cambios/permisos-v2/plan.md` (2026-11-15): la ayuda de Claude Code confirma que `--bare` omite OAuth y keychain; el `authentication_failed` de ese intento no demuestra que falte la sesión habitual. La repetición no bare con `--safe-mode` alcanzó API y herramientas: Read de `.env` y cuatro solicitudes Bash sensibles fueron rechazadas por reglas; no hubo prompt ni efecto Git. El intento dentro del sandbox de red falló concretamente con `EAI_AGAIN`; reintento autorizado conectó. No se afirma que esa matriz aislara el sandbox en ejecución ni que probara precedencia frente a allow global, pues se pasó `--setting-sources ''`; ver resultados exactos en `cambios/permisos-v2/plan.md`.
- Reintento no interactivo con `--setting-sources project` y ajustes ficticios: Claude Code 2.1.325 autenticó y llegó a API, pero ignoró los dos permisos `allow` del proyecto porque el fixture no estaba marcado como confiable; el CLI ofreció aceptar el diálogo interactivo o cambiar `/home/franco/.claude.json`. No se tocó la configuración global. Se ejecutaron los intentos negativos sin exposición ni efectos, pero no se demostró precedencia allow/deny ni sandbox efectivo. A5 queda pendiente hasta confiar el proyecto ficticio por flujo interactivo autorizado y repetir la matriz; detalle en `cambios/permisos-v2/plan.md`.
- Repetición tras confiar el proyecto ficticio, con fuentes solo de proyecto: Claude Code 2.1.325 dejó de advertir que ignoraba los `allow`; `Read(.env)` fue rechazado por regla pese a `allow: Read`, y `git commit`, `bash -c` y `git -c … merge` fueron rechazados antes de ejecución. `cat .env >/dev/null` tampoco llegó al shell (rechazo de permisos, `reason_type=subcommandResults`), así que no se atribuye a sandbox runtime. No se cargó configuración global real: precedencia global y sandbox runtime siguen sin probarse. Evidencia detallada y comandos en `cambios/permisos-v2/plan.md`.
