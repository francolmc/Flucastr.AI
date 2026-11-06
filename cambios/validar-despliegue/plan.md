---
estado: borrador
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
- [ ] `referencia.md`: modo remoto en `verify` y secciones Lectura/Escritura en `verify-flujo.sh`, según *Decisiones (a)*.
- [ ] `preparar-proyecto/SKILL.md`: documentar `VERIFY_TARGET`, `VERIFY_PERMITIR_ESCRITURA`, la sección «Despliegue» y «Revisión previa al despliegue».
- [ ] `definir-proyecto/SKILL.md`: escribir «Despliegue» en el segundo tiempo.
- [ ] `principal.md`: la regla de «prepárame el despliegue» (corta; el detalle vive en la skill).
- [ ] `verify` escalón 8: textos clave + copia negativa.
- [ ] `AGENTS.md` y `PENDIENTES.md`: una línea cada uno.
- [ ] Correr `./verify` y pegar la cola en *Evidencia*. La prueba funcional (a) no la hace el constructor.

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
