# task-03 — `--actualizar` atómico, aviso de `modelos.json` nuevo y documentación
repo: Flucastr.AI   depende_de: task-02   estado: aprobada

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

## Notas
