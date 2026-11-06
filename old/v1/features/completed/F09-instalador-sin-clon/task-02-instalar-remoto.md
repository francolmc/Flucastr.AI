# task-02 — `instalar-remoto.sh`: descarga, verificación e instalación inicial
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Crea `instalar-remoto.sh`, el script que Franco ejecuta en el PC de trabajo sin clonar el repo: pregunta el sha de `main` a GitHub, descarga ese sha como `tar.gz`, lo verifica, lo deja en `~/.flucastr-ai/kit/` y corre `instalar.sh --copiar`. Escribe `~/.flucastr-ai/version` al final. Incluye `--estado`, `--mostrar-urls` y `--ref`. La actualización llega en task-03. Todo se prueba sin red con un origen local.

## Contexto
Base: `definitions/ARCHITECTURE.md`, sección «Instalación sin clon desde GitHub» (descarga en dos pasos, verificación mínima, lista permitida de rutas, versión) y `definitions/PROJECT.md` («Pruebas de F09»). Supuestos (no confirmados por Franco, citados): `main` + sha como versión; actualización manual; comando largo; PC de trabajo con macOS/POSIX y `bash`, `node`, `curl`, `tar`. Su red y la política de la empresa son una comprobación manual de Franco, no de esta tarea.
Leídos en el repo: `instalar.sh` y `desinstalar.sh` tras task-01 (opciones `--copiar`, `--todo`; manifiesto con línea `modo`); `pruebas/capa1/instalacion.test.mjs` (patrón de entorno); `pruebas/rapida.sh` (lista de archivos, tope 30 s). Herramientas del equipo verificadas: bash 3.2 (sin arreglos asociativos), curl 8.7.1, bsdtar 3.5.3. Los comandos de esta tarea sobre archivos nuevos son «no ejecutado, inferido».
A tocar: `instalar-remoto.sh` (nuevo), `pruebas/capa1/remoto.test.mjs` (nuevo), `pruebas/rapida.sh`.

## Decisiones ya tomadas
- Origen: con `FLUCASTR_ORIGEN=<carpeta>` se lee `<carpeta>/sha` (una línea) y `<carpeta>/kit.tar.gz`, sin `curl` ni red. Sin la variable se usa GitHub.
- URLs reales (las muestra `--mostrar-urls`, una por línea, sin conectarse, usando `--ref` o `main`): `script: https://raw.githubusercontent.com/francolmc/Flucastr.AI/main/instalar-remoto.sh`, `sha: https://api.github.com/repos/francolmc/Flucastr.AI/commits/<ref>`, `descarga: https://codeload.github.com/francolmc/Flucastr.AI/tar.gz/<sha>`.
- Sha: `curl` a la API con `-H "Accept: application/vnd.github.sha"`; debe cumplir `^[0-9a-f]{40}$` o se aborta. Se descarga el sha obtenido, nunca `main`. `curl` con `--fail --silent --show-error --proto '=https' --max-time 120 --max-filesize 20971520`.
- Verificación antes de extraer, con `tar -tzf` y `tar -tvzf`: rechazar rutas absolutas, rutas con componente `..`, y entradas de tipo enlace simbólico o duro (primer carácter `l` o `h` del listado detallado). Extraer solo a un directorio nuevo creado con `mktemp -d` bajo `~/.flucastr-ai/tmp/` (con `--strip-components=1` por la carpeta raíz de GitHub). Se borra al terminar o fallar (`trap`).
- Exigidos tras extraer: `instalar.sh`, `desinstalar.sh`, `modelos.json`, `scripts/resolver.mjs`, al menos un `agentes/*.md` y al menos un `skills/*/SKILL.md`; si falta algo, `RECHAZADO: falta <ruta>` y código 1. Solo se copian a `kit.nuevo` las rutas permitidas: `agentes/`, `skills/`, `scripts/`, `instalar.sh`, `desinstalar.sh`, `instalar-remoto.sh`, `modelos.json`. No se copian `pruebas/`, `definitions/`, `features/`, `README.md`.
- Formato de `~/.flucastr-ai/version`: tres líneas `sha=<40 hex>`, `fecha=<AAAA-MM-DDTHH:MM:SSZ>`, `ref=<ref>`. Se escribe solo al final y solo si todo salió bien.
- Salidas fijas que usan las pruebas: `Instalado: <sha>`; `al día (<sha>)`; con `--estado`: líneas `instalada: <sha o ninguna>`, `publicada: <sha>` y una de `al día`, `hay versión nueva`, `no instalado`.
- Si ya hay `version`: mismo sha = `al día` y termina sin tocar nada (código 0); sha distinto = `Hay una versión nueva; la actualización se agrega en task-03` y código 0 sin tocar nada (task-03 reemplaza este mensaje).
- Si el manifiesto existe y su modo no es `descarga`, se niega antes de descargar con el mismo mensaje de task-01.
- Si `instalar.sh --copiar` falla en una primera instalación: borrar `kit/`, no escribir `version`, salir con 1.
- Necesita `node`, `tar` y (sin `FLUCASTR_ORIGEN`) `curl`; si falta, lo dice y sale con 1 antes de escribir.
- Las pruebas arman `kit.tar.gz` con `tar` desde un árbol mínimo propio (no del repo real): carpeta raíz `Flucastr.AI-<sha>/`, los scripts reales copiados más un agente, una skill y un `modelos.json` reducido.

## Alcance / Fuera de alcance
Alcance: lo descrito arriba.
Fuera de alcance: actualizar una instalación existente (`--actualizar`, `kit.anterior`), aviso de `modelos.json` nuevo, `README.md`, revisar o publicar el repo, cualquier uso de red real, firmas o hashes de autenticidad (no existen en los `tar.gz` de GitHub).

## Pasos
1. Crear `instalar-remoto.sh` (cabecera con uso, guarda de bash, `set -euo pipefail`, `ESTADO_DIR`): análisis de `--estado`, `--mostrar-urls`, `--ref <valor>`, `-h`; error ante opciones desconocidas. Resultado: `bash instalar-remoto.sh --mostrar-urls` imprime las tres URLs y termina en 0.
2. Función `obtener_sha` (origen local o API) con la validación de 40 hex, y `--estado`. Resultado: `--estado` con origen local imprime las tres líneas fijas.
3. Función `descargar` y `verificar_tar` según *Decisiones*. Resultado: un tar con ruta `..`, absoluta o enlace simbólico termina con `RECHAZADO` y deja `~/.flucastr-ai/` sin `kit`.
4. Armado de `kit.nuevo` con la lista permitida, comprobación de lo exigido y `mv kit.nuevo kit`. Resultado: `kit/` contiene solo rutas permitidas.
5. Ejecutar `bash kit/instalar.sh --copiar`, escribir `version` y limpiar el temporal; rama de fallo según *Decisiones*. Resultado: `Instalado: <sha>` y `version` con tres líneas.
6. Rama «ya instalado»: `al día` o el aviso de versión nueva, y negativa por modo. Resultado: segunda corrida con el mismo sha no cambia nada (árbol del HOME idéntico).
7. Crear `pruebas/capa1/remoto.test.mjs` con, como máximo, 7 pruebas y control negativo cada una: primera instalación (carpetas copiadas con marca, ningún enlace, `version` correcto, `modelos.json` personal creado); segunda corrida igual = `al día` y árbol idéntico; `--estado` con y sin instalación, sin descargar; tarball peligroso (`..`, absoluta o enlace; si `tar` de la plataforma no permite crear alguno, se prueba con los otros y se anota en *Notas*) = rechazado; tarball sin `instalar.sh` o sin `agentes/` = rechazado; falla de `instalar.sh` en la primera instalación = sin `kit` ni `version`; `--mostrar-urls` imprime las tres URLs exactas; instalación en modo `repo` previa = negativa. Añadir el archivo a `pruebas/rapida.sh`.
8. Correr la *Verificación* y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. Primera instalación con origen local copia sin enlaces simbólicos y escribe `version`. `node --test pruebas/capa1/remoto.test.mjs`.
2. Un tar peligroso o incompleto se rechaza sin dejar `kit` ni `version`. Misma prueba.
3. `--estado` y `--mostrar-urls` no escriben ni se conectan. Misma prueba (árbol del HOME idéntico; `--mostrar-urls` sin `FLUCASTR_ORIGEN` ni red).
4. Ninguna prueba usa red ni toca `~/.claude`, `~/.pi` o `~/.flucastr-ai` reales. Revisión: todas las ejecuciones usan HOME temporal y `FLUCASTR_ORIGEN`.
5. `bash pruebas/rapida.sh` pasa dentro de 30 s.

## Verificación
```
bash -n instalar-remoto.sh && echo sintaxis-ok
bash instalar-remoto.sh --mostrar-urls
node --test pruebas/capa1/remoto.test.mjs
bash pruebas/rapida.sh
```
Esperado: `sintaxis-ok`; tres líneas (`script:`, `sha:`, `descarga:`) con las URLs de *Decisiones*; `fail 0`; `rapida: N archivos en S s (tope 30 s)` con código 0.

## Evidencia

Corridas reales del 2026-10-30 en `feature/F09-instalador-sin-clon` (bash 3.2.57, bsdtar, curl 8.7.1). Todas las pruebas usan HOME temporal y `FLUCASTR_ORIGEN` local; no hubo ninguna descarga real ni ejecución contra `~/.claude`, `~/.pi` o `~/.flucastr-ai`.

`bash -n instalar-remoto.sh && echo sintaxis-ok && bash instalar-remoto.sh --mostrar-urls`
```
sintaxis-ok
script: https://raw.githubusercontent.com/francolmc/Flucastr.AI/main/instalar-remoto.sh
sha: https://api.github.com/repos/francolmc/Flucastr.AI/commits/main
descarga: https://codeload.github.com/francolmc/Flucastr.AI/tar.gz/<sha>
```
(código 0; no lee `FLUCASTR_ORIGEN` ni abre conexión)

`node --test --test-concurrency=1 pruebas/capa1/remoto.test.mjs`
```
✔ R1 primera instalación: copia sin enlaces, version escrito, modelos personal creado
✔ R2 segunda corrida: al día sin cambios; sha nuevo: aviso sin tocar nada
✔ R3 --estado y --mostrar-urls: no escriben ni descargan; textos exactos
✔ R4 tarball peligroso (.., absoluta, enlace) = RECHAZADO sin kit ni version; con contenido sano sí instala
✔ R5 tarball incompleto = RECHAZADO «falta …» sin kit ni version; completo sí instala
✔ R6 falla de instalar.sh en la primera instalación = sin kit, sin version y sin manifiesto
✔ R7 instalación en modo repo previa = se niega antes de descargar, sin tocar nada
ℹ tests 7
ℹ pass 7
ℹ fail 0
```

`bash pruebas/rapida.sh` (última corrida, con `remoto.test.mjs` añadido a la lista)
```
ℹ tests 193
ℹ pass 193
ℹ fail 0
rapida: 20 archivos en 26 s (tope 30 s)
```
(código 0). Medidas previas con la misma lista: 28 s y 34 s en corridas distintas; el margen contra el tope de 30 s es estrecho y depende de la carga de la máquina.

Criterios de aceptación:
1. Primera instalación con origen local: copia sin enlaces (`enlaces: []` en R1), escribe `version` con `sha=`, `fecha=`, `ref=main`, y crea `modelos.json` personal. Verificado por R1 (y su control negativo con un enlace falso).
2. Tarball con `..`, absoluta, enlace o incompleto: `RECHAZADO` y sin `kit` ni `version` (R4, R5). El mismo flujo con contenido sano instala (control).
3. `--estado` y `--mostrar-urls` no escriben ni descargan: el HOME queda idéntico en R3; `--estado` funciona con un origen que no tiene `kit.tar.gz`, lo que demuestra que no descarga.
4. Ninguna prueba usa red: `ejecutar()` en `remoto.test.mjs` lanza error si una llamada no lleva `FLUCASTR_ORIGEN` y no es `--mostrar-urls`. Todas las rutas de HOME son temporales en `pruebas/.temporales/remoto-*`.
5. `rapida.sh` pasa dentro de 30 s (26 s en la última corrida, código 0).

Archivos tocados: `instalar-remoto.sh` (nuevo), `pruebas/capa1/remoto.test.mjs` (nuevo), `pruebas/rapida.sh` (una línea: se añade `pruebas/capa1/remoto.test.mjs` a la lista), y esta tarea (solo *Evidencia*, *Notas* y `estado`).

## Notas

Huecos menores resueltos (decisión entre paréntesis):
- Verificación del tar: se rechaza cualquier entrada que no sea archivo ni carpeta (`-` o `d` en el listado detallado), no solo enlaces `l` y `h`. Más estricto que lo pedido, sin efecto en paquetes normales.
- `kit.nuevo` se arma en `~/.flucastr-ai/kit.nuevo` y el `trap` lo borra si queda. Sigue siendo `mv kit.nuevo kit`.
- Si `instalar.sh --copiar` falla en la primera instalación, antes de borrar `kit/` se corre `kit/desinstalar.sh --silencioso`, para deshacer lo que `instalar.sh` alcanzó a registrar en el manifiesto (el manifiesto se escribe al salir). La tarea solo decía borrar `kit/`; R6 comprueba que no queda manifiesto.
- Si existe `kit/` sin `version` (instalación interrumpida), se aborta con un mensaje y no se pisa.
- `--ref` se valida con `^[A-Za-z0-9._/-]+$` antes de armar cualquier URL.
- `-h` imprime un texto fijo (heredoc) y no `sed` sobre `$0`, porque con `curl … | bash` `$0` no es el archivo.
- `instalar.sh` recibe `< /dev/null`, para que no lea del mismo stdin que `curl | bash` está usando para el script.
- El control negativo de R4 se hace una vez (un paquete sano después de los tres peligrosos), no una por variante, para no sumar tiempo a `rapida.sh`.

Lo que vi y no toqué (fuera de alcance; para Franco):
- `instalar.sh` (task-01) crea `~/.flucastr-ai/modelos.json` copiando el del paquete **antes** de validar los agentes. Si el paquete trae un `modelos.json` inválido, el personal queda roto y, como no se sobrescribe, una corrida posterior no lo repara. No lo probé: sale de leer el código. Conviene revisarlo en task-03 o antes.
- `rapida.sh` queda con margen estrecho: 26 s, 28 s y 34 s en corridas distintas. Si Franco ve fallas por tiempo, la primera candidata a mover es esta prueba a un archivo propio fuera de `rapida.sh` (la tarea lo permite si no cabe).

Señal: la tarea estaba incompleta. Faltaban: qué hacer si falla `instalar.sh` tras escribir el manifiesto (limpieza), validar `--ref`, y qué hacer con un `kit/` huérfano sin `version`.
