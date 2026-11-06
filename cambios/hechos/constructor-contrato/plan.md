---
estado: listo
rama: feature/endurecer-constructor
repos: [.]
---
# Constructor: cuenta externa, sin PARCIAL y procedimiento en el prompt (Pedido 8, tramo 1 de 3)

## Objetivo
El constructor no puede parar con pasos pendientes: tras cada paso marca `[x]`, deja su evidencia y cuenta lo que falta con un comando; solo termina con la cuenta en 0 y `verify` pasando (`COMPLETADO`) o con una `PAUSA` que ofrece 2 o 3 opciones cerradas. Su procedimiento vive en su propio prompt, no en una skill que deba ir a leer.

Cubre (b), (f) y (h) del Pedido 8 más tres ideas sacadas de comparar con el apply de OpenSpec (que funciona con un modelo pequeño). Siguen `cambios/ejecutor-y-pasos` (c, d, e, pasos atómicos, ejecución visible) y `cambios/plazos-y-tiempo` (g), en ese orden.

## Supuestos
- (a) del Pedido 8 (`acceptanceRole`/`gate` de pi-subagents) queda fuera; sería un plan aparte.
- `PARCIAL` desaparece como retorno. Las salidas son dos:
  - `COMPLETADO: plan=<ruta>; verify=pasa`
  - `PAUSA: plan=<ruta>; motivo=<ambiguo|diseño|alcance|acceso|verify>; hecho=<n>/<total>; siguiente=<paso exacto>; no_intentado=<por qué>`
- Bajo la línea de `PAUSA` va el problema y 2 o 3 opciones cerradas, una marcada «(recomendada)», como el pause de OpenSpec. `motivo=verify` es nuevo: `verify` falló 3 veces; trae el diagnóstico completo.
- El estado del plan tras una `PAUSA` sigue siendo `parcial` (no se renombra; solo cambia cómo se llega a él). «checkpoint», cansancio, falta de contexto o de tiempo no son motivos.
- La cuenta externa es `grep -c '^- \[ \]' <plan>`; sin scripts nuevos. Cuenta solo pasos (las casillas viven en *Pasos*).
- «Evidencia por paso» es una línea bajo el paso: `  - evidencia: <archivos creados o `comando` → exit N>`. La *Evidencia* final de `verify` sigue como hoy.
- `constructor.md` conserva `skills: ejecutar-plan` en el frontmatter: `verify` y Pi lo exigen. Pero el cuerpo trae el procedimiento y ya no dice «carga la skill». La skill queda para cuando el principal ejecuta un plan.
- Los textos de `verify` son comprobaciones de frases clave, como las de 8b (no llaman a un modelo).
- La rama parte de `main` (o de lo ya fusionado). Los tres tramos tocan `principal.md` y `ejecutar-plan`: se hacen y commitean en orden.

## Alcance
Cambiar: `agentes/constructor.md`, `skills/ejecutar-plan/SKILL.md`, `agentes/principal.md`, `skills/planificar-cambio/SKILL.md` (solo el vocabulario de estados, líneas de `parcial` y de relanzar) y `verify` (bloque `8c` antes de `VERIFY OK`).
Fuera de alcance: `preparar-proyecto`, `modelos.json`, `scripts/`, instalador, `old/`, Pi y su configuración.

## Decisiones ya tomadas
- Un modelo pequeño se detiene por impresión de «ya hice bastante», no por un fallo real. La cuenta externa lo contradice con un número, no con un juicio. Por eso `grep -c` y no una regla en prosa.
- Sin salida fácil: no hay `PARCIAL`. Pausar exige un problema real y opciones; en Don Financio el modelo paró sin intentar nada.
- Si el constructor teme quedarse sin contexto, anota el avance y sigue; parar no lo resuelve.
- El plan es el estado: se marca y registra tras CADA paso. El principal, tras una pausa o un corte, no se fía de las casillas: reconstruye con `git status` y `git diff --stat` en cada carpeta de `repos:` y los archivos esperados.
- El procedimiento está dos veces (prompt del constructor y skill). Para que no se desfasen, `verify` exige las mismas frases clave en ambos.

## Escenarios
- CUANDO el constructor termina un paso ENTONCES el plan tiene `- [x]` y su línea de evidencia, y corrió `grep -c '^- \[ \]'`, antes de empezar el siguiente.
- CUANDO el `grep -c` da más de 0 ENTONCES el constructor no devuelve `COMPLETADO` ni `PAUSA` por cansancio: sigue con el siguiente paso.
- CUANDO `verify` falla 3 veces ENTONCES devuelve `PAUSA motivo=verify` con diagnóstico y 2 o 3 opciones, una recomendada.
- CUANDO devuelve `PAUSA` ENTONCES la primera línea trae `siguiente=` y `no_intentado=`, y el plan queda en `estado: parcial`.
- CUANDO el principal recibe una `PAUSA` o un corte ENTONCES reconstruye el estado desde el árbol, lo escribe en *Notas* y recién entonces decide (elige una opción o corrige) y relanza.

## Verificación
`./verify` — termina en `VERIFY OK`, con el bloque `8c` en verde y su prueba negativa fallando donde corresponde.

## Pasos
- [x] `constructor.md`: reemplazar «Carga `ejecutar-plan`» por el procedimiento compacto en el cuerpo. Comprobar: `grep -c 'Carga' agentes/constructor.md` es 0.
  - evidencia: `agentes/constructor.md`, sección «Procedimiento»; `grep -c 'Carga' agentes/constructor.md` → 0
- [x] `constructor.md`, bucle: tras cada paso marcar `[x]` y agregar su línea de evidencia.
  - evidencia: `agentes/constructor.md`, «Procedimiento», paso 4 (marcar y línea de evidencia)
- [x] `constructor.md`, bucle: tras cada paso correr `grep -c '^- \[ \]'` sobre el plan.
  - evidencia: `agentes/constructor.md`, «Procedimiento», paso 4 (`grep -c`)
- [x] `constructor.md`: con esa cuenta mayor que 0 no puede terminar; «checkpoint», cansancio y falta de contexto o tiempo no valen.
  - evidencia: `agentes/constructor.md`, «Cuenta, contexto y pausa», primer y segundo punto
- [x] `constructor.md`: «si temes quedarte sin contexto, anota el avance y sigue».
  - evidencia: `agentes/constructor.md`, «Cuenta, contexto y pausa», segundo punto
- [x] `constructor.md`, «Retorno»: dejar solo `COMPLETADO` y `PAUSA` con el formato de Supuestos. Comprobar: `grep -c PARCIAL agentes/constructor.md` es 0.
  - evidencia: `agentes/constructor.md`, «Retorno»; `grep -c PARCIAL agentes/constructor.md` → 0
- [x] `constructor.md`, `PAUSA`: debajo, el problema y 2 o 3 opciones cerradas, una marcada «(recomendada)».
  - evidencia: `agentes/constructor.md`, «Retorno» y «Cuenta, contexto y pausa», cuarto punto
- [x] `constructor.md`: si `verify` falla 3 veces, `PAUSA motivo=verify` con el diagnóstico completo.
  - evidencia: `agentes/constructor.md`, «Procedimiento», paso 5 y «Cuenta, contexto y pausa» (motivo `verify`)
- [x] `constructor.md`, «Límites»: `parcial` solo cuando devuelve `PAUSA`.
  - evidencia: `agentes/constructor.md`, «Límites», bullet de estados
- [x] `ejecutar-plan`, bucle: marcar `[x]`, evidencia por paso y `grep -c '^- \[ \]'` tras cada paso.
  - evidencia: `skills/ejecutar-plan/SKILL.md`, «Bucle de ejecución»
- [x] `ejecutar-plan`: no terminar con la cuenta mayor que 0; «si temes quedarte sin contexto, anota y sigue».
  - evidencia: `skills/ejecutar-plan/SKILL.md`, «Cuenta, contexto y pausa»
- [x] `ejecutar-plan`, «Verificación»: tras 3 corridas, `PAUSA motivo=verify` con diagnóstico y opciones, no `PARCIAL`.
  - evidencia: `skills/ejecutar-plan/SKILL.md`, «Verificación», tope
- [x] `ejecutar-plan`, «Cuándo pausar»: la `PAUSA` lleva `siguiente=`, `no_intentado=` y 2 o 3 opciones. Comprobar: `grep -c PARCIAL skills/ejecutar-plan/SKILL.md` es 0.
  - evidencia: `skills/ejecutar-plan/SKILL.md`, «Cuenta, contexto y pausa»; `grep -c PARCIAL skills/ejecutar-plan/SKILL.md` → 0
- [x] `ejecutar-plan`, «Al terminar»: vocabulario de estados sin `PARCIAL`; `parcial` queda para la `PAUSA`.
  - evidencia: `skills/ejecutar-plan/SKILL.md`, «Al terminar»
- [x] `principal.md`, punto 5: `PARCIAL` pasa a `PAUSA`: elegir una opción o corregir, `aprobado` y relanzar.
  - evidencia: `agentes/principal.md`, «Cómo trabajas», punto 5
- [x] `principal.md`, punto 5: tras una pausa o corte, reconstruir con `git status` y `git diff --stat` por carpeta de `repos:`.
  - evidencia: `agentes/principal.md`, «Cómo trabajas», punto 5 (tercer viñeta)
- [x] `principal.md`, «Cuándo preguntar»: `PARCIAL` pasa a `PAUSA` repetida con la misma causa. Comprobar: `grep -c PARCIAL agentes/principal.md` es 0.
  - evidencia: `agentes/principal.md`, «Cuándo preguntar a Franco»; `grep -c PARCIAL agentes/principal.md` → 0
- [x] `planificar-cambio`, líneas de `parcial` y de relanzar: `PARCIAL` pasa a `PAUSA`. Comprobar: `grep -c PARCIAL skills/planificar-cambio/SKILL.md` es 0.
  - evidencia: `skills/planificar-cambio/SKILL.md`, «Estados»; `grep -c PARCIAL skills/planificar-cambio/SKILL.md` → 0
- [x] `verify`, `8c`: función `textos_contrato` con `grep -c '^- \[ \]'`, `siguiente=`, `no_intentado=` y `3 corridas` exigidos en `constructor.md` y en `ejecutar-plan`.
  - evidencia: `verify`, bloque `8c`, función `textos_contrato`
- [x] `verify`, `8c`: exigir `git diff --stat` en `principal.md` y que `constructor.md` no tenga `PARCIAL:`.
  - evidencia: `verify`, bloque `8c`, `textos_contrato` (dos últimas comprobaciones)
- [x] `verify`, `8c`: copia negativa de `constructor.md` sin `grep -c` debe fallar.
  - evidencia: `verify`, bloque `8c`, copia `cneg` sin `grep -c`
- [x] `verify`, `8c`: copia negativa de `ejecutar-plan` sin `no_intentado=` debe fallar. Comprobar: `./verify` termina en `VERIFY OK`.
  - evidencia: `verify`, bloque `8c`, copia `cneg` sin `no_intentado=`; `./verify` → `VERIFY OK` (ver *Evidencia*)

## Evidencia
$ ./verify
```
ok, 12 deny, cambios/, lista de trabajo a medias
ok escenario 2: repetir dice «old/v1 ya existe» y no cambia el árbol
ok escenario 3: solo definitions/ -> se mueve y no hay error
ok escenario 4: sin v1 -> «nada que migrar», sin cambios
ok escenario 5: --simular imprime el plan y no cambia el árbol
ok escenario 6: --migrar con --proyecto da error y no cambia nada
ok escenario 7: workspace -> old/v1 de la raíz, hijos intactos, log con hijos y raíz sin repo
ok escenario 7b: --simular en workspace no cambia el árbol y sale el aviso de AGENTS.md
ok escenario 8: .gitignore con línea repetida no duplica y conserva las demás
ok escenario 8b y 8c: .gitignore sin salto final y sin .gitignore quedan con la línea una vez; sin AGENTS.md no hay aviso
ok escenario 9: copia de Cleaner -> sin texto de workspace, aviso, git mv de definitions/ y features/, .gitignore en git status
== 8. workspaces (detección con find, textos clave de los archivos del cambio) ==
ok 8a: workspace con dos hijos con .git -> find devuelve 2
grep: /var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.5fPjAgK3hd/neg3/skills/definir-proyecto/SKILL.md: No such file or directory
ok 8b: textos clave presentes (incluido el modo remoto y Despliegue); copias sin repos:, sin «Descartado», sin definir-proyecto o sin VERIFY_TARGET fallan la comprobación
ok 8c: contrato del constructor presente (grep -c, siguiente=, no_intentado=, 3 corridas, git diff --stat, sin PARCIAL:); copias sin esas frases fallan
VERIFY OK
```
exit 0

## Notas
- Rama: `feature/endurecer-constructor` ya era la activa en `.`; no se creó otra. `repos: [.]`, un solo repo.
- `./verify` pasó antes de tocar nada (log en `/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/1aa070b3-7fc9-4882-b931-9be2c361154b/scratchpad/verify-base.log`).
- Decisión menor: el constructor con `estado` distinto de `aprobado` devuelve `PAUSA motivo=alcance` con la causa. El contrato no fijaba motivo para ese caso.
- `verify` 8c trae dos copias negativas más que las pedidas: principal sin `git diff --stat` y constructor con una línea `PARCIAL:`.
- Fuera de alcance, sin tocar: el 8b imprime `grep: ... neg3/skills/definir-proyecto/SKILL.md: No such file or directory`. Es la copia negativa sin esa skill y el mensaje es esperado; no altera el resultado.
- `skills/ejecutar-plan/SKILL.md`, «Antes de empezar», paso 1, sigue diciendo «detente y dilo» para `estado` distinto de `aprobado`; no se cambió porque el plan no lo pedía.
