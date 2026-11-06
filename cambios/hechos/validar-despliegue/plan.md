---
estado: listo
rama: feature/validar-despliegue
repos: [.]
---
# validar-despliegue

## Objetivo
El `verify` de un proyecto puede correr solo el recorrido real contra un entorno ya desplegado (`VERIFY_TARGET=<url> ./verify`) con pasos seguros; `docs/proyecto.md` lleva una sección «Despliegue»; y ante «prepárame el despliegue» el principal escribe un plan de revisión previa, sin desplegar ni tocar producción.

## Supuestos
- En modo remoto, si el recorrido tiene pasos que escriben y no hay `VERIFY_PERMITIR_ESCRITURA=1`, esos pasos se omiten con un aviso «OMITIDO» y `verify` termina bien solo si la parte de lectura pasó, diciendo «solo lectura». Si Franco prefiere que sin la variable termine con error, cambia una línea del esqueleto y de la skill.
- El recorrido declara si escribe con la línea `# VERIFY_ESCRIBE: sí` o `no` en `verify-flujo.sh`; si falta la línea, se trata como `sí` (lo seguro).
- «Datos de prueba marcados» = correos `verify-<pid>@example.invalid` y cualquier nombre con prefijo `verify-`, para borrarlos después. `verify` no garantiza limpiar el entorno remoto.
- `./verify` del kit solo comprueba textos clave de los archivos tocados; la prueba funcional del modo remoto la corre el principal en una carpeta temporal (no se agrega un servidor al `verify` del kit).
- El principal no corre `VERIFY_TARGET` contra producción: el comando de comprobación posterior lo corre Franco.
- La sección «Despliegue» de un proyecto sin datos aún dice «pendiente» en cada punto desconocido; no inventa valores.

## Alcance
Editar: `skills/preparar-proyecto/SKILL.md` y `skills/preparar-proyecto/referencia.md` (modo remoto, sección «Despliegue», revisión previa), `skills/definir-proyecto/SKILL.md` (pedir la sección), `agentes/principal.md` (regla de «prepárame el despliegue»), `verify` (textos clave, escalón 8), `AGENTS.md` y `PENDIENTES.md` (una línea cada uno).
Fuera de alcance: `instalar.sh`, `desinstalar.sh`, `agentes/constructor.md`, `old/`, y cualquier despliegue real.

## Decisiones ya tomadas
- (a) En el esqueleto de `verify` (`referencia.md`): si `VERIFY_TARGET` está definida, se valida que empiece por `http://` o `https://`, se salta el build y el compose (sin llamar a `docker`), se fijan `API_URL` y `WEB_URL` a ese valor (con `API_URL`/`WEB_URL` ya definidas ganan) y se corre solo `verify-flujo.sh` con `VERIFY_SOLO_LECTURA=1` salvo `VERIFY_PERMITIR_ESCRITURA=1`. Imprime siempre una línea «MODO REMOTO: <url>» y, si hay pasos que escriben sin permiso, «OMITIDO: el recorrido escribe (# VERIFY_ESCRIBE: sí); para permitirlo: VERIFY_PERMITIR_ESCRITURA=1».
- En `verify-flujo.sh` del esqueleto: sección «Lectura» (`GET /health` y `GET /`) que corre siempre, y sección «Escritura» (el flujo de correo) que se salta cuando `VERIFY_SOLO_LECTURA=1`. En local (sin `VERIFY_TARGET`) corre todo como hoy. El `exit 1` deliberado del final se conserva dentro de la sección «Escritura».
- (b) `docs/proyecto.md` lleva «## Despliegue» con cinco líneas: dónde se despliega; nombres (nunca valores) de variables requeridas; cómo se aplican las migraciones; cómo se vuelve atrás; comprobación posterior (`VERIFY_TARGET=<url> ./verify`). `preparar-proyecto` la pide (la agrega si falta, con «pendiente» donde no se sabe) y `definir-proyecto` la escribe en el segundo tiempo (se quita su frase «No hay sección “Despliegue” todavía»).
- (c) Nueva sección en `preparar-proyecto` «Revisión previa al despliegue», y en `principal.md` una regla: ante «prepárame el despliegue», cargar esa sección y escribir `cambios/revision-despliegue/plan.md` en borrador con `repos:`, solo lectura (Alcance: solo el plan). Pasos del plan: variables de `.env.example` contra las que usa el código; migraciones pendientes; endpoints de salud; qué cubre y qué NO cubre `verify` (proveedores externos, OAuth, correo real); comprobación posterior con `VERIFY_TARGET`. El principal nunca despliega ni toca producción.

## Escenarios
- CUANDO se usa el esqueleto con `VERIFY_TARGET=http://127.0.0.1:<puerto>` y un servidor que responde a `/health` y `/` ENTONCES termina con 0, imprime «MODO REMOTO» y «OMITIDO», y no llama a `docker`.
- CUANDO el servidor responde 500 en `/health` ENTONCES `verify` sale con código ≠ 0.
- CUANDO se agrega `VERIFY_PERMITIR_ESCRITURA=1` ENTONCES corre la sección «Escritura» (con el `exit 1` de plantilla falla, como debe).
- CUANDO `VERIFY_TARGET=ftp://x` ENTONCES sale con error claro antes de hacer nada.

## Verificación
`./verify` — el escalón 8 comprueba los textos clave nuevos (`VERIFY_TARGET` y `VERIFY_PERMITIR_ESCRITURA` en `referencia.md`; «Despliegue» en `preparar-proyecto` y `definir-proyecto`; «prepárame el despliegue» en `principal.md`), con una copia negativa sin ellos que debe fallar.

## Pasos
- [x] `referencia.md`: modo remoto en `verify` y secciones Lectura/Escritura en `verify-flujo.sh`, según *Decisiones (a)*.
- [x] `preparar-proyecto/SKILL.md`: documentar `VERIFY_TARGET`, `VERIFY_PERMITIR_ESCRITURA`, la sección «Despliegue» y «Revisión previa al despliegue».
- [x] `definir-proyecto/SKILL.md`: escribir «Despliegue» en el segundo tiempo.
- [x] `principal.md`: la regla de «prepárame el despliegue» (corta; el detalle vive en la skill).
- [x] `verify` escalón 8: textos clave + copia negativa.
- [x] `AGENTS.md` y `PENDIENTES.md`: una línea cada uno.
- [x] Correr `./verify` y pegar la cola en *Evidencia*. La prueba funcional (a) no la hace el constructor.

## Evidencia
$ ./verify
ar deja las 7
== 7. migración a v2 (--migrar, --simular, repetición, sin v1) ==
ok escenario 1: old/v1 con las tres carpetas, agente principal, sin hook, 12 deny, cambios/, lista de trabajo a medias
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
grep: /var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.S5ybsWKqVM/neg3/skills/definir-proyecto/SKILL.md: No such file or directory
ok 8b: textos clave presentes (incluido el modo remoto y Despliegue); copias sin repos:, sin «Descartado», sin definir-proyecto o sin VERIFY_TARGET fallan la comprobación
VERIFY OK
exit 0

Verificación previa (no sustituye a la prueba funcional del modo remoto, que corre el principal): los dos scripts del esqueleto de `referencia.md` pasan `bash -n`.

## Notas
- Rama `feature/validar-despliegue` creada desde `feature/definir-proyecto` (la rama actual). El `plan.md` modificado sin commit viajó con el cambio de rama.
- Modo remoto: `API_URL` y `WEB_URL` se toman del entorno si ya están definidas; si no, de `VERIFY_TARGET`. El modo local no cambió sus líneas.
- En modo remoto `verify` no usa `esperar` (que reintenta 120 s); la lectura en `verify-flujo.sh` falla de inmediato con «Falla: <url>».
- Datos de prueba del esqueleto: `verify-$$@example.invalid` (antes `prueba-$$@example.com`), según *Supuestos*.
- `MAILPIT_URL` es obligatoria solo en la sección «Escritura» (error claro si falta).
- Negativo añadido (`neg4`): copia completa sin `VERIFY_TARGET` en `referencia.md` debe fallar; falla.
- El `grep: ... neg3/... No such file` del log es ruido de la copia negativa sin `definir-proyecto` que ya existía; el escenario sigue dando «ok».
