# task-03 — `--actualizar` atómico, aviso de `modelos.json` nuevo y documentación
repo: Flucastr.AI   depende_de: task-02   estado: lista para revisión

## Descripción
Completa `instalar-remoto.sh` con la actualización: si el sha publicado cambió, arma el kit nuevo, lo valida, lo intercambia con vuelta atrás si algo falla y avisa si el `modelos.json` publicado trae novedades respecto del personal (sin tocar el personal). Documenta el flujo en `README.md` para Franco, con la guía de comprobación manual en el PC de trabajo.

## Contexto
Base: `definitions/ARCHITECTURE.md` («Versión instalada y publicada», «`modelos.json` local del usuario», actualización atómica) y `definitions/PROJECT.md` («Pruebas de F09», «Lo que queda para Franco»). Supuestos (no confirmados por Franco): `main` + sha; actualización manual (sin procesos en segundo plano); comando largo; modo dual; PC de trabajo macOS/POSIX con `bash`, `node`, `curl`, `tar`.
Leídos: `README.md` (secciones `## Estructura`, árbol que termina en `├── instalar.sh` y `└── desinstalar.sh`; `## Instalación`; redactado en primera persona de Franco), `pruebas/comprobaciones/readme-estructura.mjs` (solo compara hijos de `agentes/` y `skills/` con el disco), y el estado que deja task-02: `instalar-remoto.sh`, `pruebas/capa1/remoto.test.mjs`, formato de `version` (`sha=`, `fecha=`, `ref=`) y mensaje provisional `Hay una versión nueva; la actualización se agrega en task-03`. Comandos sobre código aún no escrito: «no ejecutado, inferido».
A tocar: `instalar-remoto.sh`, `scripts/resolver.mjs`, `pruebas/capa1/remoto.test.mjs`, `README.md`.

## Decisiones ya tomadas
- `--actualizar` y volver a correr el comando sin opciones hacen lo mismo cuando ya hay instalación; `--actualizar` sin instalación previa sale con 1 y el mensaje `No hay instalación; corre el comando sin --actualizar.`
- Misma sha que `version` = `al día (<sha>)`, código 0, nada se toca.
- Orden de la actualización: sha → descarga → verificación y lista permitida (las de task-02) → armar `kit.nuevo` → validar el `modelos.json` **personal** con `FLUCASTR_MODELOS=<personal> node kit.nuevo/scripts/resolver.mjs modelo <agente> claude-code` y `pi` para cada `kit.nuevo/agentes/*.md` (si falla: salir con 1 sin mover nada, instalación previa intacta) → `mv kit kit.anterior` → `mv kit.nuevo kit` → `bash kit/instalar.sh --copiar` → si todo bien, escribir `version` y borrar `kit.anterior`.
- Vuelta atrás: si falla `instalar.sh` del kit nuevo, `rm -rf kit`, `mv kit.anterior kit`, `bash kit/instalar.sh --copiar` (reinstala lo anterior), `version` no cambia, mensaje `FALLÓ la actualización; se restauró la versión anterior (<sha>).` y código 1. Si también falla la reinstalación, mensaje con la ruta `~/.flucastr-ai/kit.anterior` y código 1.
- Una skill borrada en el kit nuevo desaparece del destino (lo hace el `desinstalar.sh` del kit nuevo por el manifiesto anterior; la prueba lo comprueba).
- Aviso de `modelos.json`: nueva orden `node scripts/resolver.mjs comparar-modelos <personal> <publicado>`: imprime una línea por diferencia (`version: personal N, publicado M` si M > N; `agente nuevo: <nombre>`; `perfil nuevo: <nombre>`) y nada si no hay; siempre código 0 salvo JSON ilegible (error con el mensaje habitual de `fallar`). Si imprime algo, `instalar-remoto.sh` lo muestra tras `AVISO: el modelos.json publicado trae cambios; compáralo con el tuyo:` y la línea `  diff ~/.flucastr-ai/modelos.json ~/.flucastr-ai/kit/modelos.json`. Nunca modifica el personal.
- README, redacción en primera persona como el resto: sección nueva `### Sin clonar el repo (PC de trabajo)` dentro de `## Instalación` con: forma de dos pasos primero (bajar `instalar-remoto.sh`, leerlo, `bash instalar-remoto.sh`), el comando largo `curl -fsSL https://raw.githubusercontent.com/francolmc/Flucastr.AI/main/instalar-remoto.sh | bash`, `--estado`, `--actualizar`, `--ref <rama|tag|sha>` (también marcha atrás), dónde vive todo (`~/.flucastr-ai/kit/`, `modelos.json` personal que nunca se pisa), `bash ~/.flucastr-ai/kit/desinstalar.sh` (`--todo` borra también `modelos.json`), el aviso de `modelos.json` nuevo, el requisito `bash`, `curl`, `tar`, `node`, y el riesgo de `curl | bash`. Más una subsección «Comprobación manual en el PC de trabajo» con 5 puntos: red que llega a `raw.githubusercontent.com`, `api.github.com` y `codeload.github.com`; el comando de una línea y el arranque de `claude --agent arquitecto` o `pi-arquitecto` con el modelo de su `modelos.json`; editar su `modelos.json`, publicar un cambio mínimo en `main`, `--estado` dice `hay versión nueva`, `--actualizar` lo trae y su `modelos.json` queda igual; política de la empresa sobre instalar agentes de IA; probar el desinstalador.
- El árbol de `## Estructura` gana la línea `├── instalar-remoto.sh   # instala sin clonar el repo: descarga main de GitHub, verifica y actualiza` entre `instalar.sh` y `desinstalar.sh`.
- No se documenta ni se pide en estos pasos la revisión del repo ni hacerlo público: son de Franco.

## Alcance / Fuera de alcance
Alcance: `--actualizar`, vuelta atrás, `comparar-modelos`, pruebas nuevas y las dos adiciones al `README.md`.
Fuera de alcance: cron o avisos automáticos, atajo `flucastr-ai` en `~/.local/bin`, fusión del `modelos.json`, `definitions/**`, `pruebas/README.md`, cualquier uso de red real, revisar o publicar el repo.

## Pasos
1. `scripts/resolver.mjs`: orden `comparar-modelos` y línea en la cabecera de uso. Resultado: con dos JSON de prueba imprime las diferencias esperadas y nada si son iguales.
2. `instalar-remoto.sh`: opción `--actualizar` y rama de instalación existente según *Decisiones* (reemplaza el mensaje provisional de task-02). Resultado: sha igual = `al día`.
3. `instalar-remoto.sh`: validación del `modelos.json` personal contra `kit.nuevo`, intercambio con `kit.anterior` y borrado al terminar. Resultado: con sha nuevo imprime `Actualizado: <viejo> -> <nuevo>` y `version` cambia.
4. `instalar-remoto.sh`: vuelta atrás y aviso de `modelos.json`. Resultado: ver criterios 2 y 3.
5. `pruebas/capa1/remoto.test.mjs`: añadir como máximo 5 pruebas, ligeras y con control negativo: sha nuevo actualiza, quita una skill que ya no existe y `kit.anterior` desaparece; `modelos.json` personal editado queda byte a byte igual tras actualizar; personal inválido = nada cambia (árbol del HOME idéntico); `instalar.sh` del kit nuevo falla = vuelve a `kit.anterior`, `version` igual y el kit anterior vuelve a funcionar; aviso de `modelos.json` nuevo (`version` mayor o agente nuevo) y ausencia de aviso cuando no hay cambios.
6. `README.md`: añadir la línea del árbol y la sección según *Decisiones*. Resultado: `grep -n "instalar-remoto" README.md` muestra al menos 4 líneas.
7. Correr la *Verificación* y pegar la salida en *Evidencia*, con la duración de `rapida.sh`.

## Criterios de aceptación
1. Con sha nuevo, la actualización instala lo nuevo, quita lo que ya no existe y no deja `kit.anterior`. `node --test pruebas/capa1/remoto.test.mjs`.
2. Si algo falla a la mitad, vuelve a la versión anterior y `version` no cambia. Misma prueba.
3. El `modelos.json` personal queda idéntico byte a byte; si el publicado trae novedades, se avisa sin tocarlo. Misma prueba.
4. El README documenta el comando, `--estado`, `--actualizar`, `--ref`, desinstalar y la comprobación manual; `node --test pruebas/comprobaciones/readme-estructura.test.mjs` pasa.
5. `bash pruebas/rapida.sh` pasa dentro de 30 s.

## Verificación
```
bash -n instalar-remoto.sh && echo sintaxis-ok
node --test pruebas/capa1/remoto.test.mjs
node --test pruebas/comprobaciones/readme-estructura.test.mjs
grep -n "instalar-remoto" README.md
bash pruebas/rapida.sh
```
Esperado: `sintaxis-ok`; `fail 0` en las dos pruebas; al menos 4 líneas de `grep`; `rapida: N archivos en S s (tope 30 s)` con código 0. Si `rapida.sh` supera el tope, mover las pruebas de F09 a un archivo propio fuera de `rapida.sh` (siguen sin red) y dejarlo anotado en *Notas*.

## Evidencia

Corridas reales del 2026-10-30 en `feature/F09-instalador-sin-clon`, sin commit. `/bin/bash` es GNU bash 3.2.57 (arm64). Todas las pruebas usan HOME temporal y `FLUCASTR_ORIGEN` local; no hubo red ni ejecución contra `~/.claude`, `~/.pi` o `~/.flucastr-ai`.

`bash -n instalar-remoto.sh && echo sintaxis-ok`
```
sintaxis-ok
```

`node --test pruebas/capa1/remoto.test.mjs` (12 pruebas: R1 a R7 de task-02, con R2 ajustada al nuevo comportamiento, y R8 a R12 nuevas)
```
✔ R1 primera instalación: copia sin enlaces, version escrito, modelos personal creado
✔ R2 segunda corrida con el mismo sha: al día sin cambios
✔ R3 --estado y --mostrar-urls: no escriben ni descargan; textos exactos
✔ R4 tarball peligroso (.., absoluta, enlace) = RECHAZADO sin kit ni version; con contenido sano sí instala
✔ R5 tarball incompleto = RECHAZADO «falta …» sin kit ni version; completo sí instala
✔ R6 falla de instalar.sh en la primera instalación = sin kit, sin version y sin manifiesto
✔ R7 instalación en modo repo previa = se niega antes de descargar, sin tocar nada
✔ R8 sha nuevo: actualiza, quita la skill que ya no existe y no deja kit.anterior ni kit.nuevo
✔ R9 modelos.json personal: idéntico byte a byte tras actualizar; con novedades avisa sin tocarlo
✔ R10 modelos.json inválido (del paquete o personal) = nada cambia y no se crea el personal
✔ R11 falla de instalar.sh en la actualización = vuelve a la versión anterior con version igual
✔ R12 --actualizar sin instalación sale con 1; con el mismo sha no hay cambios ni aviso; comparar-modelos
ℹ tests 12
ℹ pass 12
ℹ fail 0
```

`node --test pruebas/comprobaciones/readme-estructura.test.mjs`
```
ℹ tests 7
ℹ pass 7
ℹ fail 0
```

`grep -n "instalar-remoto" README.md` (9 líneas; el mínimo era 4)
```
57:├── instalar-remoto.sh   # instala sin clonar el repo: descarga main de GitHub, verifica y actualiza
84:En el PC de trabajo no tengo clon. Ahí uso `instalar-remoto.sh`, que baja la versión publicada de `main` (o la de `--ref`), la verifica y corre `instalar.sh --copiar` sobre una copia en `~/.flucastr-ai/kit/`. Lo que recomiendo es bajarlo, leerlo y correrlo en dos pasos:
87:curl -fsSL https://raw.githubusercontent.com/francolmc/Flucastr.AI/main/instalar-remoto.sh -o instalar-remoto.sh
88:cat instalar-remoto.sh     # lo leo antes de correrlo
89:bash instalar-remoto.sh
95:curl -fsSL https://raw.githubusercontent.com/francolmc/Flucastr.AI/main/instalar-remoto.sh | bash
101:bash ~/.flucastr-ai/kit/instalar-remoto.sh --estado                # compara la instalada con la publicada; no descarga
102:bash ~/.flucastr-ai/kit/instalar-remoto.sh --actualizar            # trae la versión publicada si cambió
103:bash ~/.flucastr-ai/kit/instalar-remoto.sh --ref <rama|tag|sha>    # fija otra versión; también sirve para volver atrás
```

`bash pruebas/rapida.sh`, tres corridas con `remoto.test.mjs` ya fuera de la lista (ver Notas):
```
corrida 1: ℹ tests 186 · ℹ pass 186 · ℹ fail 0 · rapida: 19 archivos en 25 s (tope 30 s) · código 0
corrida 2: ℹ tests 186 · ℹ pass 186 · ℹ fail 0 · rapida: 19 archivos en 23 s (tope 30 s) · código 0
corrida 3: ℹ tests 186 · ℹ pass 186 · ℹ fail 0 · rapida: 19 archivos en 24 s (tope 30 s) · código 0
```
Medida previa, con `remoto.test.mjs` dentro de la lista (20 archivos, 198 pruebas en verde): 36 s, 36 s y 36 s, las tres con código 1 por superar el tope. Por eso se sacó.

Paso 1 (`comparar-modelos`), dentro de R12: con dos JSON iguales no imprime nada; con `version` 1→2 y un agente y un perfil nuevos imprime `version: personal 1, publicado 2`, `agente nuevo: nuevo` y `perfil nuevo: y`; con un JSON ilegible sale con error.

Hallazgo de task-02, reproducido con `instalar.sh` solo, HOME temporal y un `modelos.json` roto en el paquete:
```
$ env -i PATH=<dir de node>:/usr/bin:/bin HOME=<tmp>/home PI_CODING_AGENT_DIR=<tmp>/home/pi bash kit/instalar.sh --copiar
modelos.json personal creado: <tmp>/home/.flucastr-ai/modelos.json
error: no pude leer modelos.json (Expected property name or '}' in JSON at position 2 (line 1 column 3))
codigo=1
# el personal queda en disco:  { roto
```
Con `instalar-remoto.sh` ya no ocurre: R10 (caso a) comprueba que el paquete con `modelos.json` inválido se rechaza antes de copiar nada, sin personal, sin `kit/` y sin `version`.

Criterios de aceptación:
1. Con sha nuevo se instala lo nuevo, se quita lo que ya no existe y no queda `kit.anterior`: R8.
2. Falla a la mitad: vuelve a la versión anterior, `version` no cambia y el árbol del HOME es idéntico al previo: R11.
3. `modelos.json` personal idéntico byte a byte; con novedades avisa sin tocarlo: R9. Personal inválido = HOME idéntico: R10 (caso b).
4. README con comando, `--estado`, `--actualizar`, `--ref`, desinstalar y comprobación manual; `readme-estructura.test.mjs` 7/7: ver arriba.
5. `rapida.sh` pasa dentro del tope: 23 a 25 s en tres corridas, código 0.

Archivos tocados por esta tarea: `instalar-remoto.sh`, `scripts/resolver.mjs`, `pruebas/capa1/remoto.test.mjs`, `pruebas/rapida.sh` (se quita `remoto.test.mjs` de la lista y se añade un comentario), `README.md`, y esta tarea (solo *Evidencia*, *Notas* y `estado`). `definitions/STATUS.md` y `task-02` ya venían modificados antes de empezar; no los toqué.

## Notas

Huecos menores resueltos (decisión entre paréntesis):
- **Validación antes de mover nada** (`validar_modelos_kit`): para cada agente del kit nuevo, `resolver.mjs modelo` con `claude-code` y con `pi`, usando `FLUCASTR_MODELOS` = el personal o, si aún no existe, el `modelos.json` del paquete. Se aplica también en la primera instalación, que es el arreglo del hallazgo de task-02 dentro de `instalar-remoto.sh`. La tarea solo lo pedía para la actualización. R6 (falla de `instalar.sh` en la primera instalación) no cambió.
- **Ensayo `instalar.sh --copiar --simular` antes del swap, solo en la actualización** (no estaba en la tarea). Motivo: `instalar.sh` escribe el manifiesto en su `trap EXIT` aunque falle antes de registrar nada, y eso dejaría el manifiesto vacío y la vuelta atrás sin poder desinstalar. Con el ensayo, lo que `instalar.sh` valida (p. ej., un agente que declara `model`) falla antes de tocar `kit/`. La primera instalación no lo tiene, para no cambiar el comportamiento que prueba R6.
- **Vuelta atrás con `cp -R` y no con `mv`**: `kit.anterior/` se conserva hasta que la reinstalación sale bien, así el mensaje «se conserva en `~/.flucastr-ai/kit.anterior`» es cierto si también falla la reinstalación. Si la reinstalación sale bien, `kit.anterior/` se borra.
- **`kit.anterior/` ya existente** (resto de una actualización interrumpida): se niega con un mensaje y código 1, antes de descargar. Mover `kit/` encima de una carpeta existente habría dejado un `kit.anterior/` anidado.
- **`--actualizar` sin instalación** se decide por la existencia de `version`, no de `kit/`. Un `kit/` sin `version` sigue dando el error de instalación incompleta de task-02.
- **`kit.nuevo/` residual** (un proceso matado a mitad): `preparar_kit_nuevo` lo borra antes de crearlo; antes el `mkdir` fallaba.
- **R2 cambió**: su parte «sha nuevo: aviso» reflejaba el mensaje provisional de task-02, que esta tarea reemplaza. Ese caso pasó a R8.
- **`comparar-modelos` con JSON ilegible del publicado**: la actualización aborta antes de mover nada (código 1, con el mensaje de `fallar`).
- **Aviso de `modelos.json`**: se imprime después de «Actualizado», no antes; si la actualización falla, no se imprime.

Lo que vi y no toqué (fuera de alcance; para Franco o para una tarea aparte):
- **Hallazgo de task-02, causa de raíz en `instalar.sh` (task-01).** Copia el `modelos.json` del paquete a `~/.flucastr-ai/modelos.json` antes de validar los agentes (reproducido arriba). Si el paquete lo trae inválido, el personal queda roto y no se repara en corridas posteriores. `instalar-remoto.sh` ya lo bloquea antes de copiar (R10). Pero `bash instalar.sh --copiar` directo sobre un paquete así sigue dejando el personal roto. El arreglo de raíz es validar antes de copiar en `instalar.sh`; no estaba en *A tocar*.
- **Residuo del `trap EXIT` de `instalar.sh`**: escribe el manifiesto aunque falle antes de registrar nada. El ensayo de la actualización evita que esto llegue a la vuelta atrás, pero la primera instalación sigue dejando un manifiesto vacío y el `desinstalar.sh` lo borra después (R6). Conviene arreglarlo en el mismo cambio de `instalar.sh`.
- **`pruebas/README.md`** no menciona `remoto.test.mjs` ni cómo correrlo (fuera de alcance). Hoy se corre con `node --test pruebas/capa1/remoto.test.mjs`. Está comentado en `rapida.sh`.
- **Margen de `rapida.sh`**: con 19 archivos queda en 23 a 25 s. Si vuelve a acercarse al tope, la siguiente candidata a sacar es `pruebas/capa1/instalacion.test.mjs` o `copia.test.mjs`, no `remoto`.
- **La red real, la política de la empresa y el repo público** son comprobaciones manuales de Franco (ver la sección «Comprobación manual» del README). Nada de eso se probó aquí.

Señal: la tarea estaba incompleta. Faltaban: validar el `modelos.json` también en la primera instalación (el hallazgo de task-02), qué hacer con un `kit.anterior/` que sobra de una actualización interrumpida, y qué hacer si `instalar.sh` falla después de registrar una parte de la instalación (la vuelta atrás depende de ese manifiesto parcial).