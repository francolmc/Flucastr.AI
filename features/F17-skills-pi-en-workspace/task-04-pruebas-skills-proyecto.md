# task-04 — pruebas Capa 1 de skills de Pi en el proyecto
repo: Flucastr.AI   depende_de: task-01, task-02, task-03   estado: aprobada

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

## Notas
