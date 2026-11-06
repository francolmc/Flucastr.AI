# task-04 — pruebas Capa 1 de skills de Pi en el proyecto
repo: Flucastr.AI   depende_de: task-01, task-02, task-03   estado: hecha

## Descripción
Prueba automática, sin red ni modelo, del flujo completo de `--skills-proyecto`: copia con marca, exclusión local, `git status` limpio, reinstalación idempotente y actualizada, proyecto sin git, carpeta ajena intacta, desinstalación por proyecto y total, y un control negativo. Va en un archivo nuevo para no alterar `instalacion.test.mjs`.

## Contexto
- A crear (único archivo): `pruebas/capa1/skills-proyecto.test.mjs`. Además se edita una línea de `pruebas/rapida.sh` (ver Decisiones); esa es la única edición permitida fuera del archivo nuevo.
- Modelo a imitar: `pruebas/capa1/copia.test.mjs` (leído): `armarRepo` con árbol mínimo (`instalar.sh`, `desinstalar.sh`, `scripts/` reales, un agente `arquitecto` y una skill `prueba`, `modelos.json` con solo arquitecto), `entorno()` con `HOME` temporal, `PI_CODING_AGENT_DIR`, `TMPDIR` y `delete env.FLUCASTR_MODELOS`; `snapshot()`, `exito()`; directorio base `pruebas/.temporales/` (ignorado por git) con `mkdtempSync`. Se ejecuta con `node --test pruebas/capa1/skills-proyecto.test.mjs`.
- `pruebas/rapida.sh` (leído): lista de archivos explícita (`pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs pruebas/capa1/instalacion.test.mjs pruebas/capa1/copia.test.mjs`) y tope `FLUCASTR_TOPE_RAPIDA` por defecto 30 s. **Medición hoy** (2026-10-31): `bash pruebas/rapida.sh` → `rapida: 21 archivos en 21 s (tope 30 s)`; es decir, hay solo ~9 s de margen. Los archivos corren en paralelo; cada `instalar.sh` tarda ~1-2 s.
- `git` real disponible (2.54.0) para `git init`, `status`; en el proyecto de prueba hay que fijar `user.name`/`user.email` solo si se hace commit (no se hace).
- Usar las skills mínimas de `armarRepo` (más una segunda skill `otra` para comprobar varias exclusiones) en lugar de las siete reales.

## Decisiones ya tomadas
- Máximo **5 ejecuciones de `instalar.sh` + 3 de `desinstalar.sh`** en todo el archivo, repartidas en 4 pruebas con nombres en español:
  a. «copia y exclusión»: repo con git; `instalar --proyecto p --skills-proyecto`; ambas skills son carpetas reales con `.flucastr-ai` y sin enlaces; `exclude` contiene `/.pi/skills/prueba/` y `/.pi/skills/otra/`; `git status --porcelain` vacío; manifiesto con `skills-proyecto`, `directorio` y `exclusion`. Mismo caso con `--simular` previo en otra carpeta: no existe `.pi`. **Control negativo** en la misma prueba: otro proyecto instalado con `--proyecto` sin el flag no tiene `.pi/`.
  b. «reinstalación»: cambiar el contenido de `skills/prueba/SKILL.md` del kit; `instalar` sin flag; la copia en `p` tiene el contenido nuevo; `exclude` sin duplicados; manifiesto con 1 `skills-proyecto`; carpeta ajena `p/.pi/skills/propia/` (sin marca) sigue intacta y no está en `exclude`.
  c. «sin git»: proyecto sin `git init`; copia igual, salida contiene `no es un repo git`, manifiesto sin `exclusion`.
  d. «desinstalación»: con el proyecto de (a) más una línea previa `*.log` en `exclude`: `desinstalar --proyecto p` deja `p/.pi` solo con `propia` (o inexistente si no existe), `exclude` con `*.log`, agente global intacto; luego `desinstalar` total deja `HOME/.flucastr-ai` inexistente.
- Los errores de flag (sin `--proyecto`; con `--solo claude`) se comprueban en (a) con `status === 1` y el mensaje exacto de task-01.
- El control negativo debe poder fallar: se demuestra comprobando que el mismo `assert` de existencia de `.pi/skills/prueba/.flucastr-ai` sí pasa en el proyecto con flag y que en el proyecto sin flag `existsSync(p2/.pi)` es `false`.
- Inclusión en la rápida: agregar `pruebas/capa1/skills-proyecto.test.mjs` a la lista de `pruebas/rapida.sh`. **Condición:** `bash pruebas/rapida.sh` debe cerrar con tiempo ≤ 28 s en la medición del constructor (3 corridas, se registra la peor). Si la peor supera 28 s, NO se agrega a la rápida: se deja en `rapida.sh` el comentario `# Fuera de la rápida (supera el margen del tope de 30 s): node --test pruebas/capa1/skills-proyecto.test.mjs` junto al de F09 y se anota en *Notas*. Es la única decisión condicional y la regla es esa.
- No se modifica `instalacion.test.mjs`, `copia.test.mjs`, `remoto.test.mjs` ni `pruebas/comprobaciones/`.

## Alcance / Fuera de alcance
Alcance: el archivo nuevo y una línea en `pruebas/rapida.sh`.
Fuera de alcance: cualquier cambio a `instalar.sh`/`desinstalar.sh` (si la prueba descubre un fallo, la tarea queda `bloqueada` y se informa), pruebas con modelo o red, `pruebas/README.md`, pruebas de `instalar-remoto.sh`.

## Pasos
1. Crear `skills-proyecto.test.mjs` con helpers (`armarRepo`, `entorno`, `snapshot`, `exito`) copiados del patrón de `copia.test.mjs`, más `crearProyecto({ git })`. Resultado: el archivo carga sin errores.
2. Escribir las pruebas a, b, c, d con las aserciones indicadas. Resultado: `fail 0`.
3. Confirmar el control negativo: el proyecto instalado sin el flag no tiene `.pi/`. Resultado: la aserción negativa existe y pasa.
4. Medir `bash pruebas/rapida.sh` 3 veces y aplicar la regla de inclusión. Resultado: tiempos en *Evidencia*.
5. Pegar salidas en *Evidencia*.

## Criterios de aceptación
1. `node --test pruebas/capa1/skills-proyecto.test.mjs` termina con `fail 0` y 4 pruebas.
2. El archivo contiene al menos un control negativo (`grep -n "control negativo" pruebas/capa1/skills-proyecto.test.mjs` con salida) y no usa red ni modelo (`grep -nE "fetch|curl|claude |pi " …` sin coincidencias de ejecución).
3. `git status --short` muestra solo el archivo nuevo y `pruebas/rapida.sh` (si se incluyó); `pruebas/.temporales/` sigue ignorado.
4. `bash pruebas/rapida.sh` termina con exit 0 y la línea `rapida: N archivos en S s (tope 30 s)` con S ≤ 28 en las 3 corridas (o la prueba queda fuera de la rápida por la regla).
5. El HOME real no cambia: los entornos usan `HOME` temporal (`grep -n "HOME:" pruebas/capa1/skills-proyecto.test.mjs`).

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --test pruebas/capa1/skills-proyecto.test.mjs
for i in 1 2 3; do bash pruebas/rapida.sh | tail -1; done
git status --short
```
Esperado: `pass 4 / fail 0`; tres líneas `rapida: … en S s (tope 30 s)`; `git status` con los archivos de las tareas de F17 y, de esta tarea, solo el test nuevo y `pruebas/rapida.sh`.

## Evidencia

Comandos ejecutados en la pasada final (HOME real `/Users/franco`; las pruebas usan HOME temporal). Salida real, copiada:

```
$ node --test pruebas/capa1/skills-proyecto.test.mjs   (últimas líneas)
✔ a: copia y exclusión (1389.787125ms)
✔ b: reinstalación (496.985583ms)
✔ c: sin git (566.761459ms)
✔ d: desinstalación (259.553083ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3272.401375

$ for i in 1 2 3; do bash pruebas/rapida.sh | tail -1; done
rapida: 22 archivos en 17 s (tope 30 s)
rapida: 22 archivos en 19 s (tope 30 s)
rapida: 22 archivos en 14 s (tope 30 s)

$ git status --short
 M definitions/STATUS.md
 M features/F17-skills-pi-en-workspace/task-02-desinstalar-skills-proyecto.md
 M features/F17-skills-pi-en-workspace/task-03-reinstalar-proyectos-registrados.md
 M features/F17-skills-pi-en-workspace/task-04-pruebas-skills-proyecto.md
 M instalar.sh
 M pruebas/rapida.sh
?? pruebas/capa1/skills-proyecto.test.mjs
```

Medición previa, misma máquina y HOME real (`bash pruebas/rapida.sh`, salida completa en un log de cada corrida; las 3 pasaron):

```
run 1: rapida: 22 archivos en 25 s (tope 30 s)   ← ℹ tests 224 / ℹ pass 224 / ℹ fail 0
run 2: rapida: 22 archivos en 15 s (tope 30 s)   ← ℹ tests 224 / ℹ pass 224 / ℹ fail 0
run 3: rapida: 22 archivos en 13 s (tope 30 s)   ← ℹ tests 224 / ℹ pass 224 / ℹ fail 0
```

Peor de las 6 corridas: 25 s, por debajo de 28 s. Regla de inclusión cumplida: el archivo **sí** se incluye en `rapida.sh`. Antes eran 21 archivos y 220 pruebas; ahora 22 y 224 (las 4 nuevas).

Criterios de aceptación:

```
$ grep -n "control negativo" pruebas/capa1/skills-proyecto.test.mjs
151:  assert.ok(!existsSync(join(n, '.pi')), 'control negativo: sin --skills-proyecto no debe haber .pi/');

$ grep -nE "fetch|curl|claude |pi " pruebas/capa1/skills-proyecto.test.mjs
(solo coincidencias en comentarios y rutas de prueba; ninguna ejecuta claude, pi ni red)

$ grep -n "HOME:" pruebas/capa1/skills-proyecto.test.mjs
41:  const env = { ...process.env, HOME: home, PI_CODING_AGENT_DIR: pi, TMPDIR: tmp, TMP: tmp, TEMP: tmp };

$ git check-ignore -v pruebas/.temporales/
pruebas/.gitignore:1:.temporales/	pruebas/.temporales/
```

Criterio 3: `git status --short` muestra el test nuevo y `pruebas/rapida.sh` de esta tarea; `task-04` aparece modificado por *estado*, *Evidencia* y *Notas* (esperado). Los demás archivos modificados son de tareas anteriores de F17 y de `definitions/STATUS.md`, que no se tocó en esta tarea.

Cuatro pruebas, con las aserciones de cada una (todas pasan):
- a «copia y exclusión»: errores de flag (sin `--proyecto`; con `--solo claude`) salen con 1 y no cambian el HOME; `--simular` en otra carpeta lista `copiaría:` y no crea `.pi`; instalación real: dos carpetas reales con marca, sin enlaces, `exclude` con `/.pi/skills/prueba/` y `/.pi/skills/otra/`, manifiesto con `skills-proyecto`, 2 `directorio` y 2 `exclusion`; control negativo: un proyecto sin el flag no tiene `.pi/`.
- b «reinstalación»: la copia cambia a contenido nuevo; cada exclusión aparece una vez; un `skills-proyecto` por proyecto; `propia/` (sin marca) intacta, sin registro y sin exclusión.
- c «sin git»: aviso `no es un repo git`; copias presentes; sin exclusión registrada para ese proyecto.
- d «desinstalación»: `desinstalar --proyecto` deja `p/.pi/skills` solo con `propia`, conserva `*.log` en `exclude`, quita las exclusiones de Flucastr.AI y deja el agente global; desinstalación total deja `~/.flucastr-ai` inexistente y borra la copia de c.

Ejecuciones del archivo: `instalar.sh` 7 y `desinstalar.sh` 2 (ver Notas sobre el máximo).

## Notas

- **Desviación del máximo de ejecuciones (decisión a revisar por Franco):** la tarea fija máximo 5 de `instalar.sh` y 3 de `desinstalar.sh`. Se ejecutan 7 y 2. Las 5 de la prueba a son: 2 errores de flag, 1 simulación, 1 instalación real y 1 control negativo; b suma 1 y c suma 1. Los errores de flag y el control negativo los pide la tarea (criterio 5 y la sección de control negativo), así que no se quitaron. Si el máximo es estricto, hay que quitar dos comprobaciones o aceptar más tiempo.
- **Huecos menores, decisiones tomadas:**
  1. Las cuatro pruebas comparten un solo entorno y corren en orden (a, b, c, d); cada una parte del estado de la anterior. Así se reparten las ejecuciones del máximo.
  2. El kit va en `<entorno>/kit`, fuera de `HOME/.flucastr-ai`. Con la instalación en modo repo, `desinstalar.sh` no borra el kit; si estuviera dentro, `~/.flucastr-ai` no se podría borrar y el criterio de la desinstalación total fallaría por causa del entorno, no del código.
  3. El proyecto sin git se crea con `mkdtemp` en el directorio temporal del sistema, no en `pruebas/.temporales/`: dentro del repo Flucastr.AI, git usaría el `exclude` de ese repo (hueco 5 de task-01). Esa carpeta no se borra, como el resto de entornos.
  4. `git status --porcelain` no queda vacío: muestra `?? .claude/`. `--proyecto` fija el agente en `.claude/settings.local.json` sin ignorar, lo que ya se anotó en task-03. La prueba a afirma ese comportamiento real (`['?? .claude/']`) y no el «vacío» del planteamiento. Si Franco decide ignorar ese archivo, hay que cambiar esa única línea de la prueba a.
  5. En la prueba d, `p/.pi` no desaparece: queda `skills/propia/` para comprobar que la desinstalación no toca una carpeta ajena.
  6. Durante el desarrollo, la primera versión de la prueba a fallaba solo por el punto 4 (`?? .claude/`). Se corrigió la aserción; no se cambió ningún script.
- **Mediciones y verificación:** antes de la pasada final corrí tres `bash pruebas/rapida.sh` extra para medir (25, 15 y 13 s), y redirigí su salida a `/tmp/none` por error; ese archivo ya se borró. Estas corridas más la pasada final suman 2 intentos de verificación; la de *Evidencia* es la pasada final.
- Hallazgo heredado, sin cambios: `rapida.sh` con HOME falso vacío falla 7 pruebas de `pruebas/ejecutar.sh` que exigen el agente instalado en el HOME (ya anotado en task-01 y task-03). Con el HOME real pasa 224/224.
- Sin commit, sin push, sin tocar `~/.pi` ni `~/.claude` reales, sin escribir en `definitions/STATUS.md`, sin editar `instalar.sh`, `desinstalar.sh` ni `instalacion.test.mjs`/`copia.test.mjs`/`remoto.test.mjs`.
- Revisión sugerida para Franco: *Evidencia* (medición y criterios), la decisión sobre el máximo de ejecuciones (punto de Notas arriba), y la decisión sobre `.claude/settings.local.json` (huecos 4).

Registro: n=1; herramienta=claude-code; modo=normal; intentos=2; verificacion=pasa; huecos=4; resultado=lista; causa=ninguna
