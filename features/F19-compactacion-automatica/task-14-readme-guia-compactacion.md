# task-14 — Guía de higiene de contexto y compactación en el `README.md`
repo: Flucastr.AI   depende_de: task-09   estado: aprobada

## Descripción
Documentar en `README.md` lo que el kit deja puesto (compactación automática en Pi y Claude Code), con la tabla de mecanismos por herramienta, cómo cambiar el umbral, cómo comprobar el resultado tras instalar y las limitaciones. Es la guía para Franco, también desde el celular: no pide teclear comandos para que funcione.

## Contexto
- Leído `README.md` (16.139 caracteres): secciones `## La idea`, `## Para qué existe`, `## Reglas`, `## Documentación`, `## Cómo se usa`, `## Estructura`, `## Instalación` (con `### Con el repo clonado`, lista de viñetas sobre `instalar.sh`, `--proyecto`, `--skills-proyecto`), `## Pruebas`, `## Flujo`, `## Registro de eventos`, `## Archivo y rescate`, `## Bitácora`. La sección nueva va entre `## Flujo` y `## Registro de eventos`.
- Fuentes de las cifras y mecanismos: `definitions/ARCHITECTURE.md` («Cambio de diseño», puntos 2 a 4) e informe `pruebas/resultados/2026-10-31-verificacion-compactacion.md` (esquema de Pi, bloqueo `settings.json.lock`, colchón de 33.000 de Claude Code, ventanas de 272.000, precedencia de archivos de Claude Code, rango 100000–1000000, Pi no relee en caliente). Costo: `pruebas/resultados/2026-10-31-sondeo-consumo-pi.md` (≈2,4 veces más por turno con 130 k de contexto que con 25 k, *inferido*).
- Comportamiento real implementado por las tareas 02 a 09 (mensajes, formato del manifiesto, qué se omite).
- El único comprobador que mira el README es `pruebas/comprobaciones/readme-estructura.mjs` (árbol de agentes y skills de `## Estructura`): no se cambian esos nombres.

## Decisiones ya tomadas
- Sección `## Higiene de contexto y compactación` con estas partes, en este orden:
  1. **Por qué**: el estado del flujo vive en `definitions/STATUS.md` y en archivos, no en la conversación; un contexto largo cuesta más por turno y deriva (≈2,4 veces más por turno a 130 k que a 25 k, *inferido*); por eso el kit compacta solo.
  2. **Qué deja puesto el kit**: Pi, ajuste global en `~/.pi/agent/settings.json` (o `$PI_CODING_AGENT_DIR`): `compaction.modelOverrides["<proveedor>/<modelo>"].reserveTokens = ventana − compactar_en` (con ventana 272000 y `compactar_en` 100000, `172000`); Claude Code, solo con `--proyecto`: `autoCompactWindow = compactar_en + 33000` (`133000`) en `<proyecto>/.claude/settings.local.json`. Sin `--proyecto`, Claude Code no recibe ajuste.
  3. **Tabla de mecanismos** (Pi 1.4.0 y Claude Code 2.1.308), filas: compactación automática; dónde se configura; fórmula; rango y validación (Pi: enteros no negativos, un valor inválido en el modelo activo detiene a Pi; Claude Code: 100000–1000000, fuera de rango se ignora en silencio); cuándo se aplica (Pi: al abrir Pi de nuevo o con `/reload`; Claude Code: al abrir una sesión nueva); sesión nueva a mano (`/new` en Pi, `/clear` en Claude Code); compactar a mano (`/compact` en ambos); medir (Pi: pie del TUI, `/session`, `showCacheMissNotices: true`; Claude Code: `/context`, donde se ve `Autocompact buffer 33k`). Cada celda sin evidencia dice «no verificado»; Codex aparece como «pendiente».
  4. **Cambiar el umbral**: editar `compactar_en` (y `ventanas` si cambia el modelo) en `modelos.json` y correr `bash instalar.sh` (Pi se rehace solo). En Claude Code, un proyecto ya instalado conserva su valor: correr antes `bash desinstalar.sh --proyecto <ruta>`.
  5. **Qué respeta**: nunca pisa lo que Franco ya definió (`compaction.enabled`, `compaction.reserveTokens`, un `modelOverrides` del mismo modelo, un `autoCompactWindow` del proyecto): lo omite y lo avisa con `OMITIDO`. Escribe con bloqueo `settings.json.lock` y escritura atómica; `bash instalar.sh --simular` muestra qué haría; `bash desinstalar.sh` quita solo lo suyo (si el valor sigue siendo el del kit).
  6. **Después de instalar, comprobar** (tomado del informe): abrir Pi nuevo o `/reload`; `diff` de `~/.pi/agent/settings.json` contra la copia previa: solo debe aparecer `compaction.modelOverrides` para los modelos del kit.
  7. **Limitaciones**: en Pi el ajuste es global y compacta también cuando se usan esos modelos fuera del kit; compactar pierde razonamiento intermedio y salidas de subagentes no anotadas (por eso el `coordinador` escribe `STATUS.md` antes de delegar); un `modelos.json` personal antiguo (sin `compactar_en` ni `ventanas`) no instala nada, y `instalar-remoto.sh --actualizar` avisa «campo nuevo».
- Una viñeta en `### Con el repo clonado` (lista de `instalar.sh`): `- Deja puesta la compactación automática en Pi y, con \`--proyecto\`, en Claude Code; ver [Higiene de contexto y compactación](#higiene-de-contexto-y-compactación).`
- En el bloque de `## Estructura` solo se tocan los comentarios de `modelos.json` (añadir «, ventanas y compactar_en») y de `resolver.mjs` (añadir «y la compactación»); no los nombres del árbol de agentes y skills.
- Sin comandos de barra dentro de reglas del flujo: los comandos manuales aparecen solo en la tabla. Se escribe en primera persona del README (como el resto del archivo).

## Alcance / Fuera de alcance
Alcance: `README.md` (sección nueva, una viñeta de instalación, dos comentarios de `## Estructura`).
Fuera de alcance: `definitions/`, `pruebas/README.md` (task-17), el árbol de agentes y skills de `## Estructura`, `instalar.sh`, `AGENTS.md`, la bitácora.

## Pasos
1. Releer la salida real de `bash instalar.sh --simular` en un HOME temporal con `--proyecto` y los mensajes de las tareas 08 y 09. Resultado: textos exactos anotados en *Notas*.
2. Escribir la sección en `README.md`. Resultado: `grep -n "^## Higiene de contexto y compactación" README.md` con una línea.
3. Añadir la viñeta de instalación y los dos comentarios de `## Estructura`. Resultado: `grep -n "compactación automática en Pi" README.md` con una línea.
4. Comprobar que las cifras (`172000`, `133000`, `33000`, `272000`, `100000`) son las de `modelos.json` y el informe. Resultado: lista en *Notas*.
5. Correr la verificación y pegarla en *Evidencia*.

## Criterios de aceptación
1. La sección contiene `reserveTokens = ventana − compactar_en`, `autoCompactWindow = compactar_en + 33000`, `172000`, `133000`, `compaction.modelOverrides`, `.claude/settings.local.json`, `/reload` y `desinstalar.sh` (`grep -c` de *Verificación* ≥ 8 líneas distintas).
2. La tabla de mecanismos tiene una fila por cada tema listado y las dos columnas de herramienta (inspección: `sed -n` de la sección).
3. La viñeta de instalación enlaza a `#higiene-de-contexto-y-compactación` y el encabezado existe.
4. `node --test pruebas/comprobaciones/readme-estructura.test.mjs` termina con `fail 0`.
5. `git diff --stat README.md` muestra solo `README.md` de esta tarea.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -n "^## Higiene de contexto y compactación\|higiene-de-contexto-y-compactación" README.md
for t in 'reserveTokens = ventana − compactar_en' 'autoCompactWindow = compactar_en + 33000' '172000' '133000' 'compaction.modelOverrides' '.claude/settings.local.json' '/reload' 'desinstalar.sh --proyecto'; do printf '%s: ' "$t"; grep -c -F -- "$t" README.md; done
node --test pruebas/comprobaciones/readme-estructura.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)"
git diff --stat README.md
```
Esperado: dos líneas del `grep` (encabezado y enlace); ocho contadores ≥ 1; `fail 0`; el diff toca solo `README.md`. Leído por el planificador: el README existe con las secciones citadas; la sección nueva se escribe al construir.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
